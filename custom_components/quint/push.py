"""Quint alerts on the phone: sends the dashboard's alerts to the Home Assistant mobile app (notify.mobile_app_*).

The panel raises these alerts itself while a Quint page is open; this watcher does it on the server, so the phone is
told even when nobody has the dashboard open. What counts as an alert is in push_rules.py.
"""
from __future__ import annotations

import logging
import time
from datetime import datetime, timedelta
from typing import Any

from homeassistant.const import EVENT_STATE_CHANGED
from homeassistant.core import Event, HomeAssistant, callback
from homeassistant.helpers.event import async_track_time_interval
from homeassistant.helpers.storage import Store

from .const import DOMAIN
from .push_rules import (
    classify_change,
    clean_push,
    in_quiet,
    is_open_entity,
    left_open,
    offline,
    persistent,
    service_of,
    type_on,
)

_LOGGER = logging.getLogger(__name__)

TICK = timedelta(seconds=30)
LOG_MAX = 30
PANEL_URL = "/quint"


class QuintPush:
    def __init__(self, hass: HomeAssistant, config_store: Store) -> None:
        self.hass = hass
        self._config_store = config_store
        self._log_store: Store = Store(hass, 1, f"{DOMAIN}.pushlog")
        self._cfg: dict[str, Any] = {}
        self._log: list[dict[str, Any]] = []
        self._open: dict[str, list] = {}      # entity -> [since, done]
        self._off: dict[str, list] = {}
        self._seen: dict[str, float] = {}     # alert key -> last sent
        self._quiet_until = 0.0
        self._unsubs: list = []

    # ---------- life cycle ----------
    async def async_start(self) -> None:
        self._cfg = await self._config_store.async_load() or {}
        self._log = await self._log_store.async_load() or []
        if not isinstance(self._log, list):
            self._log = []
        self._quiet_until = time.time() + 20
        now = time.time()
        for st in self.hass.states.async_all():
            self._track_state(st.entity_id, st.state, st.attributes, now)
        self._unsubs.append(self.hass.bus.async_listen(EVENT_STATE_CHANGED, self._on_state))
        self._unsubs.append(async_track_time_interval(self.hass, self._on_tick, TICK))
        try:   # Home Assistant's own notifications (the bell of Home Assistant) also go to the phone
            from homeassistant.components import persistent_notification as pn

            def _pn(update_type: Any, notifications: dict[str, Any]) -> None:
                if getattr(update_type, "value", update_type) != "added":
                    return
                for nid, n in (notifications or {}).items():
                    self._send_soon(persistent(nid, (n or {}).get("title"), (n or {}).get("message")))

            self._unsubs.append(pn.async_register_callback(self.hass, _pn))
        except Exception:  # noqa: BLE001 - older or newer Home Assistant: the other alerts still work
            _LOGGER.debug("Home Assistant notifications cannot be followed here", exc_info=True)

    def stop(self) -> None:
        for u in self._unsubs:
            try:
                u()
            except Exception:  # noqa: BLE001
                pass
        self._unsubs = []

    # ---------- settings ----------
    def settings(self) -> dict[str, Any]:
        return clean_push(self._cfg.get("push"))

    async def async_refresh(self) -> None:
        self._cfg = await self._config_store.async_load() or {}

    def log(self) -> list[dict[str, Any]]:
        return list(self._log)

    # ---------- watching ----------
    def _hidden(self, entity_id: str, attrs: Any) -> bool:
        hide = self._cfg.get("hide")
        return bool(isinstance(hide, list) and entity_id in hide and service_of(entity_id, dict(attrs)))

    def _track_state(self, entity_id: str, state: str, attrs: Any, now: float) -> None:
        a = dict(attrs)
        if is_open_entity(entity_id, state, a):
            self._open.setdefault(entity_id, [now, False])
        else:
            self._open.pop(entity_id, None)
        if state == "unavailable":
            self._off.setdefault(entity_id, [now, False])
        else:
            self._off.pop(entity_id, None)

    @callback
    def _on_state(self, event: Event) -> None:
        new = event.data.get("new_state")
        old = event.data.get("old_state")
        if new is None:
            return
        now = time.time()
        self._track_state(new.entity_id, new.state, new.attributes, now)
        if old is None or old.state == new.state or now < self._quiet_until:
            return
        if self._hidden(new.entity_id, new.attributes):
            return
        alert = classify_change(new.entity_id, old.state, new.state, dict(new.attributes))
        if alert:
            self._send_soon(alert)

    @callback
    def _on_tick(self, _now: Any) -> None:
        if not self.settings()["on"]:
            return
        self.hass.async_create_task(self._tick())

    async def _tick(self) -> None:
        await self.async_refresh()
        ntf = self._cfg.get("ntf") if isinstance(self._cfg.get("ntf"), dict) else {}
        mins = int(ntf.get("mins") or 5)
        mins = mins if mins in (3, 5, 10, 30) else 5
        now = time.time()
        for eid, x in list(self._open.items()):
            st = self.hass.states.get(eid)
            if not x[1] and st is not None and now - x[0] >= mins * 60:
                x[1] = True
                if not self._hidden(eid, st.attributes):
                    await self._send(left_open(eid, dict(st.attributes), mins))
        for eid, x in list(self._off.items()):
            st = self.hass.states.get(eid)
            if not x[1] and st is not None and st.state == "unavailable" and now - x[0] >= 120:
                x[1] = True
                if service_of(eid, dict(st.attributes)) and not self._hidden(eid, st.attributes) and now >= self._quiet_until:
                    await self._send(offline(eid, dict(st.attributes)))

    # ---------- sending ----------
    def _send_soon(self, alert: dict[str, Any]) -> None:
        self.hass.async_create_task(self._send(alert))

    async def _send(self, alert: dict[str, Any], force: bool = False) -> int:
        """Send one alert to the chosen phones; returns how many phones were asked."""
        push = self.settings()
        if not force:
            if not push["on"] or not push["targets"]:
                return 0
            if not type_on(self._cfg.get("ntf"), alert["type"]):
                return 0
            key = f"{alert['type']}:{alert.get('ent') or alert['title']}"
            now = time.time()
            if now - self._seen.get(key, 0) < (86400 if alert.get("day") else 60):
                return 0
            self._seen[key] = now
            await self._remember(alert)
            if in_quiet(self._cfg.get("quiet"), datetime.now().hour, bool(alert.get("crit"))):
                return 0
        else:
            key = "test"
        data: dict[str, Any] = {
            "tag": key, "group": "quint", "url": PANEL_URL, "clickAction": PANEL_URL, "ttl": 0, "priority": "high",
            "channel": "Quint alarm" if alert.get("crit") else "Quint",
        }
        if alert.get("crit"):
            data["importance"] = "high"
            data["push"] = {"interruption-level": "critical", "sound": {"name": "default", "critical": 1, "volume": 1.0}}
        else:
            data["push"] = {"interruption-level": "active"}
        sent = 0
        for target in self.settings()["targets"]:
            if not self.hass.services.has_service("notify", target):
                continue
            try:
                await self.hass.services.async_call(
                    "notify", target, {"title": alert["title"], "message": alert.get("msg") or "", "data": data}, blocking=False
                )
                sent += 1
            except Exception:  # noqa: BLE001 - one broken phone must not stop the others
                _LOGGER.debug("Could not notify %s", target, exc_info=True)
        return sent

    async def async_test(self) -> dict[str, Any]:
        push = self.settings()
        have = [t for t in push["targets"] if self.hass.services.has_service("notify", t)]
        sent = await self._send({"type": "test", "title": "Quint test", "msg": "This is how Quint alerts arrive on your phone"}, force=True)
        return {"sent": sent, "targets": push["targets"], "missing": [t for t in push["targets"] if t not in have]}

    async def _remember(self, alert: dict[str, Any]) -> None:
        now = int(time.time() * 1000)
        self._log.insert(0, {"id": f"s{now:x}", "type": alert["type"], "title": alert["title"], "msg": alert.get("msg") or "", "t": now, "crit": bool(alert.get("crit"))})
        del self._log[LOG_MAX:]
        await self._log_store.async_save(self._log)
