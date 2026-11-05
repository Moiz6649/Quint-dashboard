"""Helpers for Quint Dashboard (no Home Assistant imports, so they are easy to test)."""
from __future__ import annotations

import re

MAX_IMAGE_CHARS = 6_000_000
_IMAGE_RE = re.compile(r"data:image/(?:jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}")


def valid_image(data: object) -> bool:
    """True only for a plain base64 jpeg/png/webp data URL of a sane size."""
    return (
        isinstance(data, str)
        and len(data) <= MAX_IMAGE_CHARS
        and _IMAGE_RE.fullmatch(data) is not None
    )


def parse_version(value: object) -> tuple[int, ...]:
    """'1.11.0' / 'v1.11.0' -> (1, 11, 0). Unknown text -> ()."""
    if not isinstance(value, str):
        return ()
    parts = re.findall(r"\d+", value.split("-")[0])
    return tuple(int(p) for p in parts)


def is_newer(candidate: object, current: object) -> bool:
    """True when candidate is a higher version than current."""
    a, b = parse_version(candidate), parse_version(current)
    return bool(a) and bool(b) and a > b


def looks_like_quint(*texts: object) -> bool:
    """Used to find the HACS update entity that belongs to this integration."""
    blob = " ".join(str(t) for t in texts if t).lower()
    return "quint" in blob


def clean_perms(raw: object, keep: dict | None = None, protect: str = "") -> dict:
    """Validate the per-user limits {user_id: {"svcOff": [...], "roomOff": [...]}}.

    Unknown shapes are dropped. Entries with nothing switched off are removed.
    The entry of `protect` (a user id) is always taken from `keep`, so nobody can
    change their own limits.
    """
    out: dict = {}
    if isinstance(raw, dict):
        for uid, p in raw.items():
            if not isinstance(uid, str) or not uid or len(uid) > 64 or not isinstance(p, dict):
                continue
            entry = {}
            for k in ("svcOff", "roomOff"):
                v = p.get(k, [])
                entry[k] = sorted({str(x)[:80] for x in v if isinstance(x, str) and x}) if isinstance(v, list) else []
            if entry["svcOff"] or entry["roomOff"]:
                out[uid] = entry
    if protect:
        out.pop(protect, None)
        if isinstance(keep, dict) and protect in keep:
            out[protect] = keep[protect]
    return out


_USERNAME_RE = re.compile(r"[a-z0-9._-]{2,64}")


def valid_new_user(name: object, username: object, password: object) -> str:
    """'' when fine, otherwise a short message for the person."""
    if not isinstance(name, str) or not name.strip() or len(name.strip()) > 60:
        return "Give the user a name"
    if not isinstance(username, str) or _USERNAME_RE.fullmatch(username.strip().lower()) is None:
        return "The login name may only use letters, numbers and . _ -"
    if not isinstance(password, str) or len(password) < 8 or len(password) > 200:
        return "The password needs at least 8 characters"
    return ""


# ---------- thermostat: which entity does which function ----------
# set: functions Quint can change through their entity; read: functions that only show a value
THERMO_NUM = ("target", "shift", "low", "high", "comfort", "standby", "eco", "frost", "hum_target")
THERMO_SEL = ("mode", "preset", "fan", "swing")
THERMO_SWITCH = ("power", "lock", "ecosw")
THERMO_READ = ("temp", "hum", "action", "window", "valve", "outdoor", "floor", "presence", "energy")
THERMO_FUNCS = THERMO_NUM + THERMO_SEL + THERMO_SWITCH + ("boost",) + THERMO_READ

_W = {
    "outdoor": ("outdoor", "outside", "aussen", "außen", "draussen"),
    "floor": ("floor", "boden", "fussboden", "fußboden", "estrich"),
    "shift": ("shift", "offset", "verschieb", "korrektur", "correction"),
    "low": ("heat_to", "heating_setpoint", "target_low", "low", "unter", "min_temp"),
    "high": ("cool_to", "cooling_setpoint", "target_high", "high", "ober", "max_temp"),
    "comfort": ("comfort", "komfort"),
    "standby": ("standby", "stand_by", "abwesen", "away"),
    "eco": ("economy", "eco", "nacht", "night", "absenk"),
    "frost": ("frost", "protect", "schutz"),
    "hum_target": ("humidity", "feucht", "hum_target"),
    "target": ("setpoint", "set_point", "target", "soll", "sollwert", "solltemp"),
    "valve": ("valve", "ventil", "output", "stellgr", "stellwert", "heating_out", "position"),
    "action": ("action", "status", "state_text", "zustand"),
    "preset": ("preset", "operation", "betriebsart", "komfort", "comfort", "eco", "standby"),
    "mode": ("hvac", "mode", "heizen", "kuehlen", "cooling_heating", "season", "umschalt"),
    "fan": ("fan", "luefter", "lüfter", "ventilator", "speed", "stufe"),
    "swing": ("swing", "louver", "lamelle", "oscill", "vane"),
    "power": ("power", "on_off", "onoff", "ein_aus", "einaus", "enable", "aktiv"),
    "lock": ("child", "kinder", "lock", "sperre", "verriegel"),
    "ecosw": ("eco", "spar", "energy_saving"),
    "boost": ("boost", "party", "turbo"),
    "presence": ("presence", "occupan", "anwesen", "motion", "belegt"),
}


def _has(text: str, words) -> bool:
    return any(w in text for w in words)


def guess_thermo_function(item: dict):
    """Which thermostat function an entity of the same device probably serves, or None.
    item: {entity_id, device_class, name}"""
    eid = str(item.get("entity_id") or "")
    domain = eid.split(".")[0]
    dc = str(item.get("device_class") or "")
    text = f"{eid} {item.get('name') or ''}".lower().replace(" ", "_")
    if domain == "sensor":
        if dc in ("power", "energy"):
            return "energy"
        if dc == "temperature" or _has(text, ("temperature", "temperatur", "ist_temp")):
            if _has(text, _W["outdoor"]):
                return "outdoor"
            if _has(text, _W["floor"]):
                return "floor"
            return "temp"
        if dc == "humidity":
            return "hum"
        if _has(text, _W["valve"]):
            return "valve"
        if _has(text, _W["action"]):
            return "action"
        return None
    if domain == "binary_sensor":
        if dc in ("occupancy", "presence", "motion") or _has(text, _W["presence"]):
            return "presence"
        return "window" if dc in ("window", "door", "opening", "garage_door") or _has(text, ("window", "fenster", "contact")) else None
    if domain in ("number", "input_number"):
        for fn in ("shift", "low", "high", "frost", "comfort", "standby", "eco"):
            if _has(text, _W[fn]):
                return fn
        if _has(text, _W["hum_target"]):
            return "hum_target"
        return "target" if _has(text, _W["target"]) else None
    if domain in ("select", "input_select"):
        for fn in ("preset", "fan", "swing", "mode"):
            if _has(text, _W[fn]):
                return fn
        return None
    if domain in ("switch", "input_boolean", "lock", "button", "input_button"):
        if _has(text, _W["boost"]):
            return "boost"
        if domain in ("button", "input_button"):
            return None
        if _has(text, _W["lock"]):
            return "lock"
        if _has(text, _W["power"]):
            return "power"
        return "ecosw" if _has(text, _W["ecosw"]) else None
    return None


def guess_thermo(climate_id: str, entities: list[dict]) -> dict:
    """Suggest the entity of every thermostat function from the entities that belong to the same device.
    entities: [{entity_id, device_id, device_class, name}], the climate itself is in the list.
    Returns {"entities": {fn: entity_id}, "candidates": {fn: [entity_id, ...]}}."""
    me = next((e for e in entities if e.get("entity_id") == climate_id), None)
    did = me.get("device_id") if me else None
    base = climate_id.split(".", 1)[1] if "." in climate_id else climate_id
    related = []
    for e in entities:
        eid = str(e.get("entity_id") or "")
        if eid == climate_id or not eid:
            continue
        same_dev = bool(did) and e.get("device_id") == did
        same_name = len(base) > 3 and base in eid.split(".", 1)[-1]
        if same_dev or same_name:
            related.append(e)
    found: dict[str, str] = {}
    cand: dict[str, list[str]] = {}
    for e in sorted(related, key=lambda x: str(x.get("entity_id"))):
        fn = guess_thermo_function(e)
        if fn:
            cand.setdefault(fn, []).append(e["entity_id"])
            found.setdefault(fn, e["entity_id"])
    return {"entities": found, "candidates": cand}


def clean_thermo_map(raw) -> dict:
    """Keep only {climate_id: {function: entity_id}} with known functions and valid entity ids."""
    out: dict = {}
    if not isinstance(raw, dict):
        return out
    import re

    ok = re.compile(r"^[a-z0-9_]+\.[a-z0-9_]+$")
    for cid, m in list(raw.items())[:200]:
        if not isinstance(m, dict) or not ok.match(str(cid)):
            continue
        row = {fn: str(v) for fn, v in m.items() if fn in THERMO_FUNCS and ok.match(str(v))}
        if row:
            out[str(cid)] = row
    return out


def _truthy(value) -> bool | None:
    if isinstance(value, bool):
        return value
    v = str(value).strip().lower()
    if v in ("1", "true", "on", "yes", "lock", "locked"):
        return True
    if v in ("0", "false", "off", "no", "unlock", "unlocked"):
        return False
    return None


def thermo_call(fn: str, entity_id: str, value, climate_id: str):
    """The Home Assistant service call that sets one thermostat function: (domain, service, data).
    entity_id is the entity chosen for the function, empty to use the thermostat itself.
    Raises ValueError for functions that cannot be set or values that do not fit."""
    if fn not in THERMO_FUNCS:
        raise ValueError("Unknown function")
    if fn in THERMO_READ:
        raise ValueError("This function only shows a value")
    dom = entity_id.split(".")[0] if entity_id else "climate"
    if entity_id:
        if fn in THERMO_NUM:
            if dom not in ("number", "input_number"):
                raise ValueError("Needs a number entity")
            try:
                return dom, "set_value", {"entity_id": entity_id, "value": float(value)}
            except (TypeError, ValueError):
                raise ValueError("Needs a number")
        if fn in THERMO_SEL:
            if dom not in ("select", "input_select"):
                raise ValueError("Needs a select entity")
            return dom, "select_option", {"entity_id": entity_id, "option": str(value)}
        if fn == "boost" and dom in ("button", "input_button"):
            return dom, "press", {"entity_id": entity_id}
        if dom not in ("switch", "input_boolean", "lock"):
            raise ValueError("Needs a switch")
        want = _truthy(value) if str(value).lower() != "toggle" else None
        if dom == "lock":
            if want is None:
                raise ValueError("Needs on or off")
            return "lock", "lock" if want else "unlock", {"entity_id": entity_id}
        if want is None:
            return dom, "toggle", {"entity_id": entity_id}
        return dom, "turn_on" if want else "turn_off", {"entity_id": entity_id}
    cid = {"entity_id": climate_id}
    try:
        if fn in ("target", "low", "high"):
            key = {"target": "temperature", "low": "target_temp_low", "high": "target_temp_high"}[fn]
            return "climate", "set_temperature", {**cid, key: float(value)}
        if fn == "hum_target":
            return "climate", "set_humidity", {**cid, "humidity": int(float(value))}
    except (TypeError, ValueError):
        raise ValueError("Needs a number")
    if fn in THERMO_SEL:
        svc = {"mode": ("set_hvac_mode", "hvac_mode"), "preset": ("set_preset_mode", "preset_mode"), "fan": ("set_fan_mode", "fan_mode"), "swing": ("set_swing_mode", "swing_mode")}[fn]
        return "climate", svc[0], {**cid, svc[1]: str(value)}
    if fn == "power":
        want = _truthy(value)
        if want is None:
            raise ValueError("Needs on or off")
        return "climate", "turn_on" if want else "turn_off", cid
    raise ValueError("This function needs an entity chosen in Settings")
