"""Quint Dashboard – Savant-style sidebar dashboard for Home Assistant."""
from __future__ import annotations

from pathlib import Path

from homeassistant.components import frontend, panel_custom
from homeassistant.components.http import HomeAssistantView, StaticPathConfig
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers.storage import Store

from .const import DOMAIN, PANEL_PATH, STATIC_URL, VERSION
from .neon import async_setup_neon, async_unload_neon
from .updater import QuintUpdater, read_disk_version
from .push import QuintPush
from .knx import FUNCS as KNX_FUNCS, QuintKnx, clean_kt, is_ga
from .util import clean_perms, clean_thermo_cond, clean_thermo_map, guess_thermo, is_newer, thermo_call, thermo_cond_ok, valid_image, valid_new_user


class QuintConfigView(HomeAssistantView):
    """Shared dashboard settings (rooms, device map, custom cards)."""

    url = "/api/quint/config"
    name = "api:quint:config"
    requires_auth = True

    def __init__(self, store: Store, hass: HomeAssistant | None = None) -> None:
        self._store = store
        self._hass = hass

    async def get(self, request):
        return self.json(await self._store.async_load() or {})

    async def post(self, request):
        user = request.get("hass_user")
        if user is None or not user.is_admin:
            return self.json_message("Admin required", 403)
        data = await request.json()
        if not isinstance(data, dict):
            return self.json_message("Bad settings", 400)
        old = await self._store.async_load() or {}
        # the Quint admin, user limits and update switches are changed only through their own endpoints
        for key in ("perms", "manager", "upInstall", "upRestart"):
            if key in old:
                data[key] = old[key]
            else:
                data.pop(key, None)
        if isinstance(data.get("thermo"), dict):
            data["thermo"]["map"] = clean_thermo_map(data["thermo"].get("map"))
            data["thermo"]["cond"] = clean_thermo_cond(data["thermo"].get("cond"))
        if "kt" in data:
            data["kt"] = clean_kt(data["kt"])
        await self._store.async_save(data)
        knx = (self._hass.data.get(DOMAIN, {}) if self._hass else {}).get("knx")
        if knx is not None:
            self._hass.async_create_task(knx.async_sync(data))
        push = (self._hass.data.get(DOMAIN, {}) if self._hass else {}).get("push")
        if push is not None:
            await push.async_refresh()
        return self.json({"ok": True})


class QuintUsersView(HomeAssistantView):
    """People: the Quint admin (a normal user chosen in Settings) and Home Assistant admins
    can list, add and remove normal users and choose which services and rooms each may use."""

    url = "/api/quint/users"
    name = "api:quint:users"
    requires_auth = True

    def __init__(self, hass: HomeAssistant, store: Store) -> None:
        self._hass = hass
        self._store = store

    async def _caller(self, request):
        user = request.get("hass_user")
        cfg = await self._store.async_load() or {}
        is_admin = bool(user and user.is_admin)
        is_mgr = bool(user and not is_admin and cfg.get("manager") and cfg.get("manager") == user.id)
        return user, cfg, is_admin, is_mgr

    async def get(self, request):
        user, cfg, is_admin, is_mgr = await self._caller(request)
        if not (is_admin or is_mgr):
            return self.json_message("Not allowed", 403)
        users = await self._hass.auth.async_get_users()
        return self.json(
            [
                {"id": u.id, "name": u.name, "is_admin": u.is_admin, "is_active": u.is_active, "is_owner": u.is_owner}
                for u in users
                if not u.system_generated
            ]
        )

    async def post(self, request):
        user, cfg, is_admin, is_mgr = await self._caller(request)
        if not (is_admin or is_mgr):
            return self.json_message("Not allowed", 403)
        try:
            body = await request.json()
        except ValueError:
            return self.json_message("Bad request", 400)
        action = body.get("action") if isinstance(body, dict) else None
        auth = self._hass.auth

        if action == "perms":
            cfg["perms"] = clean_perms(body.get("perms"), cfg.get("perms"), user.id if is_mgr else "")
            await self._store.async_save(cfg)
            return self.json({"ok": True, "perms": cfg["perms"]})

        if action == "manager":
            if not is_admin:
                return self.json_message("Admin required", 403)
            uid = body.get("user_id") or ""
            if uid:
                target = await auth.async_get_user(uid)
                if target is None or target.system_generated or target.is_admin or not target.is_active:
                    return self.json_message("Pick a normal user", 400)
                cfg["manager"] = uid
            else:
                cfg.pop("manager", None)
            await self._store.async_save(cfg)
            return self.json({"ok": True, "manager": cfg.get("manager", "")})

        if action == "create":
            msg = valid_new_user(body.get("name"), body.get("username"), body.get("password"))
            if msg:
                return self.json_message(msg, 400)
            from homeassistant.auth.providers import homeassistant as auth_ha

            username = body["username"].strip().lower()
            provider = auth_ha.async_get_provider(self._hass)
            new_user = await auth.async_create_user(body["name"].strip(), group_ids=["system-users"])
            try:
                await provider.async_add_auth(username, body["password"])
                creds = await provider.async_get_or_create_credentials({"username": username})
                await auth.async_link_user(new_user, creds)
            except Exception as err:  # noqa: BLE001 - undo the half-made user, tell the person
                await auth.async_remove_user(new_user)
                return self.json_message(f"Could not add the user ({err})", 400)
            return self.json({"ok": True, "id": new_user.id})

        if action == "delete":
            target = await auth.async_get_user(str(body.get("user_id") or ""))
            if (
                target is None
                or target.system_generated
                or target.is_admin
                or target.is_owner
                or target.id == user.id
                or target.id == cfg.get("manager")
            ):
                return self.json_message("That user cannot be removed here", 400)
            await auth.async_remove_user(target)
            if isinstance(cfg.get("perms"), dict):
                cfg["perms"].pop(target.id, None)
                await self._store.async_save(cfg)
            return self.json({"ok": True})

        return self.json_message("Unknown action", 400)


def _thermo_items(hass: HomeAssistant) -> list[dict]:
    """Every entity with its device, class and name, for the thermostat helper."""
    from homeassistant.helpers import entity_registry as er

    reg = er.async_get(hass)
    items = [
        {
            "entity_id": e.entity_id,
            "device_id": e.device_id,
            "device_class": e.device_class or e.original_device_class or "",
            "name": e.name or e.original_name or "",
        }
        for e in reg.entities.values()
        if not e.disabled
    ]
    known = {e["entity_id"] for e in items}
    for st in hass.states.async_all():
        if st.entity_id not in known:
            items.append({"entity_id": st.entity_id, "device_id": None, "device_class": st.attributes.get("device_class") or "", "name": st.attributes.get("friendly_name") or ""})
    return items


async def async_thermo_set(hass: HomeAssistant, store: Store, climate: str, fn: str, value, user=None) -> dict:
    """Set one thermostat function through the entity chosen for it in Quint (or the thermostat itself).
    A person may only change what Home Assistant allows them to control."""
    from homeassistant.auth.permissions.const import POLICY_CONTROL
    from homeassistant.exceptions import HomeAssistantError, Unauthorized

    if not str(climate).startswith("climate.") or hass.states.get(climate) is None:
        raise HomeAssistantError("Unknown thermostat")
    cfg = await store.async_load() or {}
    ent = (((cfg.get("thermo") or {}).get("map") or {}).get(climate) or {}).get(fn, "")
    if ent and hass.states.get(ent) is None:
        ent = ""
    cond = (((cfg.get("thermo") or {}).get("cond") or {}).get(climate) or {}).get(fn)
    if ent and cond:
        cs = hass.states.get(cond.get("e", ""))
        if not thermo_cond_ok(cond, cs.state if cs else None):
            ent = ""
    try:
        domain, service, data = thermo_call(fn, ent, value, climate)
    except ValueError as err:
        raise HomeAssistantError(str(err)) from err
    if user is not None and not user.is_admin and not user.permissions.check_entity(data["entity_id"], POLICY_CONTROL):
        raise Unauthorized(user_id=user.id)
    await hass.services.async_call(domain, service, data, blocking=True)
    return {"ok": True, "entity": data["entity_id"], "service": f"{domain}.{service}"}


class QuintThermoView(HomeAssistantView):
    """Thermostat helper.
    GET  /api/quint/thermo[?climate=id]  finds the entities of the same device for every thermostat function (admin)
    GET  /api/quint/thermo?status=1      the chosen entities with their state, for every thermostat
    POST /api/quint/thermo {climate, function, value}  sets one function through its entity, with the person's rights"""

    url = "/api/quint/thermo"
    name = "api:quint:thermo"
    requires_auth = True

    def __init__(self, hass: HomeAssistant, store: Store) -> None:
        self._hass = hass
        self._store = store

    async def get(self, request):
        user = request.get("hass_user")
        if request.query.get("status"):
            cfg = await self._store.async_load() or {}
            out = {}
            for cid, m in ((cfg.get("thermo") or {}).get("map") or {}).items():
                st = {}
                for fn, ent in m.items():
                    s = self._hass.states.get(ent)
                    st[fn] = {"entity": ent, "state": s.state if s else None}
                out[cid] = st
            return self.json(out)
        if user is None or not user.is_admin:
            return self.json_message("Admin required", 403)
        items = _thermo_items(self._hass)
        only = request.query.get("climate")
        ids = [only] if only else sorted(i["entity_id"] for i in items if i["entity_id"].startswith("climate."))
        return self.json({cid: guess_thermo(cid, items) for cid in ids})

    async def post(self, request):
        from homeassistant.exceptions import HomeAssistantError, Unauthorized

        user = request.get("hass_user")
        body = await request.json()
        if not isinstance(body, dict):
            return self.json_message("Bad request", 400)
        try:
            return self.json(await async_thermo_set(self._hass, self._store, str(body.get("climate", "")), str(body.get("function", "")), body.get("value"), user))
        except Unauthorized:
            return self.json_message("Not allowed", 403)
        except HomeAssistantError as err:
            return self.json_message(str(err), 400)


class QuintKnxView(HomeAssistantView):
    """Own thermostats from KNX group addresses.
    GET  /api/quint/knx   the latest value of every followed group address
    POST /api/quint/knx   {thermostat, function, value}: writes the group address chosen for that function"""

    url = "/api/quint/knx"
    name = "api:quint:knx"
    requires_auth = True

    def __init__(self, knx: QuintKnx, store: Store) -> None:
        self._knx = knx
        self._store = store

    async def get(self, request):
        return self.json({"knx": self._knx.available, "values": self._knx.cache})

    async def post(self, request):
        from homeassistant.exceptions import HomeAssistantError

        body = await request.json()
        if not isinstance(body, dict):
            return self.json_message("Bad request", 400)
        cfg = await self._store.async_load() or {}
        t = next((x for x in cfg.get("kt") or [] if x.get("id") == body.get("thermostat")), None)
        fn = str(body.get("function", ""))
        sl = ((t or {}).get("s") or {}).get(fn)
        if not sl or fn not in KNX_FUNCS or not KNX_FUNCS[fn][1] or not is_ga(sl.get("w")):
            return self.json_message("No group address to write for this function", 400)
        try:
            return self.json(await self._knx.async_send(sl["w"], sl.get("t", KNX_FUNCS[fn][0]), body.get("value")))
        except HomeAssistantError as err:
            return self.json_message(str(err), 400)


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
        if request.query.get("full") and await self._updater.can_manage(user):
            return self.json(await self._updater.status())
        disk = await self._hass.async_add_executor_job(read_disk_version)
        return self.json({"running": VERSION, "disk": disk, "pending": is_newer(disk, VERSION)})


class QuintUpdateView(HomeAssistantView):
    """Admin and Quint admin actions: check now, install now, restart now, automatic-update switches."""

    url = "/api/quint/update"
    name = "api:quint:update"
    requires_auth = True

    def __init__(self, updater: QuintUpdater) -> None:
        self._updater = updater

    async def post(self, request):
        user = request.get("hass_user")
        if not await self._updater.can_manage(user):
            return self.json_message("Admin required", 403)
        body = await request.json()
        action = body.get("action") if isinstance(body, dict) else ""
        up = self._updater
        up.last_error = ""
        if action == "settings":
            await up.set_settings(body.get("install"), body.get("restart"))
        elif action == "check":
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


class QuintPushView(HomeAssistantView):
    """The alerts sent to phones (for the bell) and the phones that can be chosen; an admin can send a test."""

    url = "/api/quint/push"
    name = "api:quint:push"
    requires_auth = True

    def __init__(self, hass: HomeAssistant) -> None:
        self._hass = hass

    def _push(self):
        return self._hass.data.get(DOMAIN, {}).get("push")

    async def get(self, request):
        push = self._push()
        phones = sorted(
            n for n in (self._hass.services.async_services().get("notify") or {}) if isinstance(n, str) and n.startswith("mobile_app_")
        )
        return self.json({"log": push.log() if push else [], "phones": phones})

    async def post(self, request):
        user = request.get("hass_user")
        if user is None or not user.is_admin:
            return self.json_message("Admin required", 403)
        push = self._push()
        if push is None:
            return self.json_message("Not running", 503)
        await push.async_refresh()
        return self.json(await push.async_test())


def _register_services(hass: HomeAssistant, store: Store) -> None:
    """quint.thermostat_set: set a thermostat function (also from automations and scripts)."""
    import voluptuous as vol
    from homeassistant.core import ServiceCall
    from homeassistant.helpers import config_validation as cv

    if hass.services.has_service(DOMAIN, "thermostat_set"):
        return

    async def _set(call: ServiceCall) -> None:
        user = await hass.auth.async_get_user(call.context.user_id) if call.context.user_id else None
        await async_thermo_set(hass, store, call.data["entity_id"], call.data["function"], call.data.get("value"), user)

    hass.services.async_register(
        DOMAIN,
        "thermostat_set",
        _set,
        schema=vol.Schema({vol.Required("entity_id"): cv.entity_id, vol.Required("function"): cv.string, vol.Optional("value"): vol.Any(str, int, float, bool)}),
    )


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    data = hass.data.setdefault(DOMAIN, {})
    if not data.get("static"):
        store = Store(hass, 1, f"{DOMAIN}.config")
        hass.http.register_view(QuintConfigView(store, hass))
        hass.http.register_view(QuintPushView(hass))
        hass.http.register_view(QuintThermoView(hass, store))
        knx = QuintKnx(hass, store)
        data["knx"] = knx
        hass.http.register_view(QuintKnxView(knx, store))
        _register_services(hass, store)
        data["push"] = QuintPush(hass, store)
        updater = QuintUpdater(hass, store)
        data["updater"] = updater
        hass.http.register_view(QuintUsersView(hass, store))
        hass.http.register_view(QuintVersionView(hass, updater))
        hass.http.register_view(QuintUpdateView(updater))
        hass.http.register_view(QuintBackgroundView(Store(hass, 1, f"{DOMAIN}.background")))
        hass.http.register_view(QuintRoomImageView(Store(hass, 1, f"{DOMAIN}.roomimg")))
        await hass.http.async_register_static_paths(
            [StaticPathConfig(STATIC_URL, str(Path(__file__).parent / "frontend"), False)]
        )
        data["static"] = True
    data["updater"].start()
    await data["push"].async_start()
    await data["knx"].async_start()
    title = entry.data.get("title", "Quint")
    neon = await async_setup_neon(hass, entry)
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
        config={"title": title, "neon": neon},
    )
    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    frontend.async_remove_panel(hass, PANEL_PATH)
    await async_unload_neon(hass, entry)
    updater = hass.data.get(DOMAIN, {}).get("updater")
    if updater:
        updater.stop()
    push = hass.data.get(DOMAIN, {}).get("push")
    if push:
        push.stop()
    knx = hass.data.get(DOMAIN, {}).get("knx")
    if knx:
        knx.stop()
    guard = hass.data.get(DOMAIN, {}).pop("guard", None)
    if guard:
        frontend.remove_extra_js_url(hass, guard)
    return True
