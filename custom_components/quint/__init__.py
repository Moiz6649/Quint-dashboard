"""Quint Dashboard – Savant-style sidebar dashboard for Home Assistant."""
from __future__ import annotations

from pathlib import Path

from homeassistant.components import frontend, panel_custom
from homeassistant.components.http import HomeAssistantView, StaticPathConfig
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers.storage import Store

from .const import DOMAIN, PANEL_PATH, STATIC_URL, VERSION


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


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    data = hass.data.setdefault(DOMAIN, {})
    if not data.get("static"):
        store = Store(hass, 1, f"{DOMAIN}.config")
        hass.http.register_view(QuintConfigView(store))
        await hass.http.async_register_static_paths(
            [StaticPathConfig(STATIC_URL, str(Path(__file__).parent / "frontend"), False)]
        )
        data["static"] = True
    title = entry.data.get("title", "Quint")
    js = Path(__file__).parent / "frontend" / "quint-panel.js"
    stamp = int((await hass.async_add_executor_job(js.stat)).st_mtime)
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
    return True
