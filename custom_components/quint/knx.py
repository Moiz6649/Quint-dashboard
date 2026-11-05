"""Own thermostats from KNX group addresses (like an ABB EAE room temperature controller).

Quint reads and writes group addresses through the Home Assistant KNX integration:
  - writing: the knx.send service
  - reading: the knx.event_register service (so telegrams of the group address are decoded and sent
    as knx_event) and knx.read (asks the devices for their value when Quint starts or settings change)
Anything that has no group address can use a Home Assistant entity instead.
"""
from __future__ import annotations

import logging
import re

from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.storage import Store

_LOG = logging.getLogger(__name__)

GA_RE = re.compile(r"^(\d{1,2}/\d{1,2}/\d{1,3}|\d{1,2}/\d{1,4})$")
ENT_RE = re.compile(r"^[a-z0-9_]+\.[a-z0-9_]+$")
ID_RE = re.compile(r"^[a-z0-9_]{1,24}$")
TYPES = ("bool", "temp", "percent", "humidity", "mode", "u8", "s8")
XKNX = {"temp": "temperature", "percent": "percent", "humidity": "humidity"}

# function -> (default type, can be written)
FUNCS = {
    "temp": ("temp", False), "target": ("temp", True), "shift": ("s8", True), "opmode": ("mode", True),
    "onoff": ("bool", True), "hc": ("bool", True), "fan": ("u8", True),
    "m_comfort": ("bool", True), "m_standby": ("bool", True), "m_eco": ("bool", True), "m_frost": ("bool", True),
    "sp_comfort": ("temp", True), "sp_standby": ("temp", True), "sp_eco": ("temp", True), "sp_frost": ("temp", True),
    "hum": ("humidity", False), "valve": ("percent", False), "window": ("bool", False), "presence": ("bool", False),
    "heat_st": ("bool", False), "cool_st": ("bool", False), "outdoor": ("temp", False), "floor": ("temp", False),
    "lock": ("bool", True), "boost": ("bool", True),
}


def is_ga(text) -> bool:
    return bool(GA_RE.match(str(text or "")))


def clean_kt(raw) -> list:
    """Own thermostats: [{id, name, room, s: {function: {w, r, t}}}]; w / r is a group address or an entity id."""
    out = []
    if not isinstance(raw, list):
        return out
    seen = set()
    for t in raw[:20]:
        if not isinstance(t, dict) or not ID_RE.match(str(t.get("id", ""))) or t["id"] in seen:
            continue
        seen.add(t["id"])
        slots = {}
        for fn, sl in (t.get("s") or {}).items() if isinstance(t.get("s"), dict) else []:
            if fn not in FUNCS or not isinstance(sl, dict):
                continue
            row = {}
            for k in ("w", "r"):
                v = str(sl.get(k, "")).strip().lower()
                if is_ga(v) or ENT_RE.match(v):
                    row[k] = v
            if row:
                row["t"] = sl.get("t") if sl.get("t") in TYPES else FUNCS[fn][0]
                slots[fn] = row
        item = {"id": t["id"], "name": str(t.get("name", ""))[:40], "room": str(t.get("room", ""))[:64], "s": slots}
        for k in ("min", "max", "step"):
            try:
                item[k] = float(t[k])
            except (KeyError, TypeError, ValueError):
                pass
        out.append(item)
    return out


def watch_map(kt) -> dict:
    """Group addresses to follow: {address: type}. A function without a status address follows its write address."""
    out: dict = {}
    for t in kt or []:
        for sl in (t.get("s") or {}).values():
            src = sl.get("r") or sl.get("w")
            if is_ga(src):
                out.setdefault(src, sl.get("t", "bool"))
    return out


def decode(t: str, value, data):
    """The value of a telegram: decoded by the KNX integration (value) or the raw bytes (data)."""
    if t in XKNX:
        try:
            return float(value)
        except (TypeError, ValueError):
            return None
    raw = data
    if isinstance(raw, (list, tuple)):
        raw = raw[0] if raw else None
    try:
        raw = int(raw)
    except (TypeError, ValueError):
        try:
            raw = int(value)
        except (TypeError, ValueError):
            return None
    if t == "s8" and raw > 127:
        raw -= 256
    return raw


def encode(t: str, value):
    """(payload, type) for knx.send. Raises ValueError for values that do not fit."""
    if t == "bool":
        v = str(value).strip().lower() in ("1", "true", "on", "yes") if not isinstance(value, bool) else value
        return (1 if v else 0), None
    try:
        n = float(value)
    except (TypeError, ValueError):
        raise ValueError("Needs a number")
    if t == "temp":
        if not -40 <= n <= 100:
            raise ValueError("Temperature out of range")
        return round(n, 2), XKNX[t]
    if t in ("percent", "humidity"):
        if not 0 <= n <= 100:
            raise ValueError("Needs 0 to 100")
        return round(n, 1), XKNX[t]
    i = int(n)
    if t == "mode":
        if not 1 <= i <= 4:
            raise ValueError("Mode is 1 (comfort) to 4 (frost protection)")
        return [i], None
    if t == "s8":
        if not -128 <= i <= 127:
            raise ValueError("Needs -128 to 127")
        return [i & 0xFF], None
    if t == "u8":
        if not 0 <= i <= 255:
            raise ValueError("Needs 0 to 255")
        return [i], None
    raise ValueError("Unknown type")


class QuintKnx:
    def __init__(self, hass: HomeAssistant, store: Store) -> None:
        self._hass = hass
        self._store = store
        self.cache: dict = {}
        self._watch: dict = {}
        self._unsub = None

    async def async_start(self) -> None:
        self._unsub = self._hass.bus.async_listen("knx_event", self._on_event)
        if self._hass.is_running:
            self._hass.async_create_task(self.async_sync())
        else:
            self._hass.bus.async_listen_once("homeassistant_started", lambda _e: self._hass.async_create_task(self.async_sync()))

    def stop(self) -> None:
        if self._unsub:
            self._unsub()
            self._unsub = None

    @property
    def available(self) -> bool:
        return self._hass.services.has_service("knx", "send")

    async def async_sync(self, cfg: dict | None = None) -> None:
        """Follow the group addresses of the own thermostats and ask the devices for their value."""
        cfg = cfg if cfg is not None else (await self._store.async_load() or {})
        self._watch = watch_map(cfg.get("kt"))
        self.cache = {k: v for k, v in self.cache.items() if k in self._watch}
        if not self._watch or not self._hass.services.has_service("knx", "event_register"):
            return
        by_type: dict = {}
        for ga, t in self._watch.items():
            by_type.setdefault(XKNX.get(t), []).append(ga)
        for xt, gas in by_type.items():
            data: dict = {"address": gas}
            if xt:
                data["type"] = xt
            try:
                await self._hass.services.async_call("knx", "event_register", data, blocking=True)
            except Exception as err:  # the KNX integration may not be ready yet
                _LOG.warning("Quint: could not follow %s: %s", gas, err)
        if self._hass.services.has_service("knx", "read"):
            try:
                await self._hass.services.async_call("knx", "read", {"address": list(self._watch)}, blocking=False)
            except Exception as err:
                _LOG.debug("Quint: knx.read failed: %s", err)

    @callback
    def _on_event(self, event) -> None:
        d = event.data or {}
        ga = d.get("destination")
        t = self._watch.get(ga)
        if t is None or d.get("telegramtype") not in (None, "GroupValueWrite", "GroupValueResponse"):
            return
        v = decode(t, d.get("value"), d.get("data"))
        if v is not None:
            self.cache[ga] = v

    async def async_send(self, ga: str, t: str, value) -> dict:
        from homeassistant.exceptions import HomeAssistantError

        if not self.available:
            raise HomeAssistantError("The KNX integration is not running in Home Assistant")
        try:
            payload, xt = encode(t, value)
        except ValueError as err:
            raise HomeAssistantError(str(err)) from err
        data: dict = {"address": ga, "payload": payload}
        if xt:
            data["type"] = xt
        await self._hass.services.async_call("knx", "send", data, blocking=True)
        if ga in self._watch:
            self.cache[ga] = value if t != "bool" else (1 if payload else 0)
        return {"ok": True}
