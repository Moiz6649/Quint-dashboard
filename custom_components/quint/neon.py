"""NeonPlan 3D inside Quint.

Quint carries a copy of the MIT-licensed NeonPlan 3D integration by Mastershort (see neon3d/LICENSE and
https://github.com/Mastershort/neonplan3d): the plan editor, the live 3D house, voice, locating and the rest.
This module is the only glue: it starts that backend from Quint's own config entry, so one HACS install gives
the whole 3D house and no sidebar page of NeonPlan's own is added (Quint shows the house on its Home page and
its editor in Settings).

If the NeonPlan 3D integration is also installed on its own, Quint leaves everything to it (one plan, one
backend) and only uses its card. Anything that goes wrong here is caught and reported to the panel; it can
never stop Quint itself from loading.
"""
from __future__ import annotations

import hashlib
import logging
import random
from pathlib import Path
from typing import Any

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant

from .const import DOMAIN, STATIC_URL

_LOGGER = logging.getLogger(__name__)

NEON_DOMAIN = "neonplan3d"
PLATFORMS = ["sensor"]
FRONTEND = Path(__file__).parent / "frontend" / "neon3d"
MAIN_BUNDLE = "neonplan3d.js"


BUILTIN = Path(__file__).parent / "neon3d" / "builtin"


def _read_builtin() -> list[str]:
    """The furniture packs that come with Quint (signed with Quint's key), as file texts."""
    try:
        return [f.read_text(encoding="utf-8") for f in sorted(BUILTIN.glob("*.json"))]
    except OSError:
        return []


async def _install_builtin(hass: HomeAssistant, data: Any) -> None:
    """Install Quint's own furniture packs: once per release, so a pack an admin removed stays removed until
    a newer release of it ships. Never stops the start."""
    from homeassistant.helpers.storage import Store

    from .neon3d.packs import PackError, parts_of, verify_pack

    store = Store[dict[str, Any]](hass, 1, "quint_builtin_packs")
    seen: dict[str, int] = dict((await store.async_load()) or {})
    changed = False
    for text in await hass.async_add_executor_job(_read_builtin):
        try:
            payload = verify_pack(text)
        except PackError as err:
            _LOGGER.warning("A furniture pack that comes with Quint was not accepted: %s", err)
            continue
        release = int(payload.get("release") or 1)
        if seen.get(payload["id"], 0) >= release:
            continue
        await data.async_add_pack(payload, parts_of(text))
        seen[payload["id"]] = release
        changed = True
    if changed:
        await store.async_save(seen)


def _bundle_hash() -> str:
    """A fingerprint of every script of the 3D house. The main script hands its address (with this fingerprint)
    on to the scripts it loads, so a changed engine or editor is never served from the browser's old copy."""
    try:
        h = hashlib.sha256()
        for f in sorted(FRONTEND.glob("*.js")):
            h.update(f.name.encode())
            h.update(f.read_bytes())
        return h.hexdigest()[:10]
    except OSError:
        return "0"


async def async_setup_neon(hass: HomeAssistant, entry: ConfigEntry) -> dict[str, Any]:
    """Start the embedded NeonPlan 3D. Returns what the panel needs: {"mode", "url", "version", "error"}.

    mode: "embedded" (runs inside Quint), "external" (the separate integration does the work), "error".
    """
    store = hass.data.setdefault(DOMAIN, {})
    # NeonPlan 3D installed on its own: it owns the plan, the websocket commands and the sidebar page
    if hass.config_entries.async_entries(NEON_DOMAIN):
        info = {"mode": "external", "url": "", "version": "", "error": ""}
        store["neon"] = info
        return info
    try:
        from .neon3d.const import DATA_DIAGNOSTICS, NEON_VERSION
        from .neon3d.diagnostics_report import DiagnosticsReporter
        from .neon3d.license import FIRST_CHECK_DELAY, REFRESH_INTERVAL, async_refresh_quietly
        from .neon3d.locate.service import DATA_LOCATE, LocateService
        from .neon3d.storage import FloorplanData
        from .neon3d.voice import async_setup_voice
        from .neon3d.websocket import async_register_commands
        from homeassistant.helpers.event import async_call_later, async_track_time_interval

        if not store.get("neon_cmds"):
            async_register_commands(hass)
            store["neon_cmds"] = True

        data = FloorplanData(hass)
        await data.async_load()
        hass.data[NEON_DOMAIN] = data
        try:
            await _install_builtin(hass, data)
        except Exception:  # noqa: BLE001 - furniture is a bonus; the house must start
            _LOGGER.exception("Quint's furniture pack could not be installed")

        # with a shop key, bought packs are checked for updates once a day (never needed for what is installed)
        async def _check(_now) -> None:
            await async_refresh_quietly(hass, data)

        entry.async_on_unload(async_track_time_interval(hass, _check, REFRESH_INTERVAL))
        entry.async_on_unload(async_call_later(hass, random.uniform(*FIRST_CHECK_DELAY), _check))

        # The usage/error reports of NeonPlan are opt-in upstream. Quint is a modified copy, so the reporter is
        # loaded (the editor's switch keeps working) but never started: nothing is ever sent to the NeonPlan server.
        reporter = DiagnosticsReporter(hass, data)
        await reporter.async_load()
        hass.data[DATA_DIAGNOSTICS] = reporter

        # locating (who and what is where, from the Bluetooth scanners): idle unless an admin switched it on
        locate = LocateService(hass)
        await locate.async_load()
        hass.data[DATA_LOCATE] = locate

        # Assist asks the house (service neonplan3d.ask, the intent and the sentences Assist understands)
        await async_setup_voice(hass)
        await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)

        version = await hass.async_add_executor_job(_bundle_hash)
        info = {
            "mode": "embedded",
            "url": f"{STATIC_URL}/neon3d/{MAIN_BUNDLE}?v={NEON_VERSION}-{version}",
            "version": NEON_VERSION,
            "error": "",
        }
    except Exception as err:  # noqa: BLE001 - Quint must load even when the 3D part cannot
        _LOGGER.exception("The 3D house (NeonPlan 3D inside Quint) could not start")
        info = {"mode": "error", "url": "", "version": "", "error": f"{type(err).__name__}: {err}"[:200]}
    store["neon"] = info
    return info


async def async_unload_neon(hass: HomeAssistant, entry: ConfigEntry) -> None:
    """Stop what async_setup_neon started (the data stays in .storage)."""
    info = hass.data.get(DOMAIN, {}).get("neon") or {}
    if info.get("mode") != "embedded":
        return
    try:
        from .neon3d.const import DATA_DIAGNOSTICS
        from .neon3d.locate.service import DATA_LOCATE
        from .neon3d.voice import async_unload_voice

        async_unload_voice(hass)
        await hass.config_entries.async_unload_platforms(entry, PLATFORMS)
        if (locate := hass.data.pop(DATA_LOCATE, None)) is not None:
            locate.stop()
        hass.data.pop(NEON_DOMAIN, None)
        hass.data.pop(DATA_DIAGNOSTICS, None)
    except Exception:  # noqa: BLE001
        _LOGGER.debug("Could not stop the 3D house cleanly", exc_info=True)
