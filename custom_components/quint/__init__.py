"""Quint Dashboard – Savant-style sidebar dashboard for Home Assistant."""
from __future__ import annotations

from pathlib import Path

from homeassistant.components import frontend, panel_custom
from homeassistant.components.http import HomeAssistantView, StaticPathConfig
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers.storage import Store

from .const import DOMAIN, PANEL_PATH, STATIC_URL, VERSION
from .updater import QuintUpdater, read_disk_version
from .util import is_newer, valid_image


class QuintConfigView(HomeAssistantView):
    """Shared dashboard settings (rooms, device map, custom cards)."""

    url = "/api/quint/config"
    name = "api:quint:config"
    requires_auth = True

    def __init__(self, store: Store) -> None:
        self._store = store

    async def get(self, request):
        return self.json(await self._store.async_load() or {})

    async def post(self, request):
        user = request.get("hass_user")
        if user is None or not user.is_admin:
            return self.json_message("Admin required", 403)
        await self._store.async_save(await request.json())
        return self.json({"ok": True})


class QuintVersionView(HomeAssistantView):
    """Running / installed version (the browser reloads itself when it is out of date)."""

    url = "/api/quint/version"
    name = "api:quint:version"
    requires_auth = True

    def __init__(self, hass: HomeAssistant, updater: QuintUpdater) -> None:
        self._hass = hass
        self._updater = updater

    async def get(self, request):
        user = request.get("hass_user")
        if user is not None and user.is_admin and request.query.get("full"):
            return self.json(await self._updater.status())
        disk = await self._hass.async_add_executor_job(read_disk_version)
        return self.json({"running": VERSION, "disk": disk, "pending": is_newer(disk, VERSION)})


class QuintUpdateView(HomeAssistantView):
    """Admin actions: check now, install now, restart now."""

    url = "/api/quint/update"
    name = "api:quint:update"
    requires_auth = True

    def __init__(self, updater: QuintUpdater) -> None:
        self._updater = updater

    async def post(self, request):
        user = request.get("hass_user")
        if user is None or not user.is_admin:
            return self.json_message("Admin required", 403)
        body = await request.json()
        action = body.get("action") if isinstance(body, dict) else ""
        up = self._updater
        up.last_error = ""
        if action == "check":
            await up.refresh()
        elif action == "install":
            await up.refresh()
            if not await up.install():
                up.last_action = "nothing to install"
        elif action == "restart":
            await up.restart("restart requested")
        else:
            return self.json_message("Unknown action", 400)
        return self.json(await up.status())


class QuintBackgroundView(HomeAssistantView):
    """Optional custom background photo shared by every user."""

    url = "/api/quint/background"
    name = "api:quint:background"
    requires_auth = True

    def __init__(self, store: Store) -> None:
        self._store = store

    async def get(self, request):
        data = await self._store.async_load() or {}
        return self.json({"data": data.get("data", "")})

    async def post(self, request):
        user = request.get("hass_user")
        if user is None or not user.is_admin:
            return self.json_message("Admin required", 403)
        body = await request.json()
        image = body.get("data", "") if isinstance(body, dict) else ""
        if not valid_image(image):
            return self.json_message("Invalid image", 400)
        await self._store.async_save({"data": image})
        return self.json({"ok": True})

    async def delete(self, request):
        user = request.get("hass_user")
        if user is None or not user.is_admin:
            return self.json_message("Admin required", 403)
        await self._store.async_remove()
        return self.json({"ok": True})


class QuintRoomImageView(HomeAssistantView):
    """Optional photo per room, shared by every user (set by an admin)."""

    url = "/api/quint/roomimg"
    name = "api:quint:roomimg"
    requires_auth = True

    def __init__(self, store: Store) -> None:
        self._store = store

    async def get(self, request):
        return self.json(await self._store.async_load() or {})

    async def post(self, request):
        user = request.get("hass_user")
        if user is None or not user.is_admin:
            return self.json_message("Admin required", 403)
        body = await request.json()
        rid = body.get("id", "") if isinstance(body, dict) else ""
        image = body.get("data", "") if isinstance(body, dict) else ""
        if not isinstance(rid, str) or not 0 < len(rid) <= 64 or not valid_image(image):
            return self.json_message("Invalid image", 400)
        data = await self._store.async_load() or {}
        data[rid] = image
        await self._store.async_save(data)
        return self.json({"ok": True})

    async def delete(self, request):
        user = request.get("hass_user")
        if user is None or not user.is_admin:
            return self.json_message("Admin required", 403)
        data = await self._store.async_load() or {}
        data.pop(request.query.get("id", ""), None)
        await self._store.async_save(data)
        return self.json({"ok": True})


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    data = hass.data.setdefault(DOMAIN, {})
    if not data.get("static"):
        store = Store(hass, 1, f"{DOMAIN}.config")
        hass.http.register_view(QuintConfigView(store))
        updater = QuintUpdater(hass, store)
        data["updater"] = updater
        hass.http.register_view(QuintVersionView(hass, updater))
        hass.http.register_view(QuintUpdateView(updater))
        hass.http.register_view(QuintBackgroundView(Store(hass, 1, f"{DOMAIN}.background")))
        hass.http.register_view(QuintRoomImageView(Store(hass, 1, f"{DOMAIN}.roomimg")))
        await hass.http.async_register_static_paths(
            [StaticPathConfig(STATIC_URL, str(Path(__file__).parent / "frontend"), False)]
        )
        data["static"] = True
    data["updater"].start()
    title = entry.data.get("title", "Quint")
    js = Path(__file__).parent / "frontend" / "quint-panel.js"
    stamp = int((await hass.async_add_executor_job(js.stat)).st_mtime)
    guard = f"{STATIC_URL}/quint-guard.js?v={VERSION}.{stamp}"
    frontend.add_extra_js_url(hass, guard)
    data["guard"] = guard
    await panel_custom.async_register_panel(
        hass,
        webcomponent_name="quint-panel",
        frontend_url_path=PANEL_PATH,
        module_url=f"{STATIC_URL}/quint-panel.js?v={VERSION}.{stamp}",
        sidebar_title=title,
        sidebar_icon="mdi:home-automation",
        require_admin=False,
        config={"title": title},
    )
    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    frontend.async_remove_panel(hass, PANEL_PATH)
    updater = hass.data.get(DOMAIN, {}).get("updater")
    if updater:
        updater.stop()
    guard = hass.data.get(DOMAIN, {}).pop("guard", None)
    if guard:
        frontend.remove_extra_js_url(hass, guard)
    return True
