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
THERMO_FUNCS = ("temp", "hum", "target", "mode", "preset", "fan", "swing", "power", "window", "valve", "shift", "action")

_THERMO_WORDS = {
    "shift": ("shift", "offset", "verschieb", "korrektur", "correction"),
    "target": ("setpoint", "set_point", "target", "soll", "sollwert", "solltemp"),
    "valve": ("valve", "ventil", "output", "stellgr", "stellwert", "heating_out", "position"),
    "action": ("action", "status", "state_text", "zustand"),
    "preset": ("preset", "operation", "betriebsart", "komfort", "comfort", "eco", "standby"),
    "mode": ("hvac", "mode", "heizen", "kuehlen", "cooling_heating", "season", "umschalt"),
    "fan": ("fan", "luefter", "lüfter", "ventilator", "speed", "stufe"),
    "swing": ("swing", "louver", "lamelle", "oscill", "vane"),
    "power": ("power", "on_off", "onoff", "ein_aus", "einaus", "enable", "aktiv"),
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
        if dc == "temperature":
            return "temp"
        if dc == "humidity":
            return "hum"
        if _has(text, _THERMO_WORDS["valve"]):
            return "valve"
        if _has(text, _THERMO_WORDS["action"]):
            return "action"
        if _has(text, ("temperature", "temperatur", "ist_temp")):
            return "temp"
        return None
    if domain == "binary_sensor":
        return "window" if dc in ("window", "door", "opening", "garage_door") or _has(text, ("window", "fenster", "contact")) else None
    if domain in ("number", "input_number"):
        if _has(text, _THERMO_WORDS["shift"]):
            return "shift"
        if _has(text, _THERMO_WORDS["target"]):
            return "target"
        return None
    if domain in ("select", "input_select"):
        for fn in ("preset", "fan", "swing", "mode"):
            if _has(text, _THERMO_WORDS[fn]):
                return fn
        return None
    if domain in ("switch", "input_boolean"):
        return "power" if _has(text, _THERMO_WORDS["power"]) else None
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
