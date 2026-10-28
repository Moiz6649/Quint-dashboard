"""What deserves a phone notification (no Home Assistant imports, so it is easy to test).

This mirrors the alerts the Quint panel raises itself (alarm, smoke/gas/leak, left open, unlocked, motion,
offline, low battery), so the phone gets the same alerts even when no Quint page is open.
"""
from __future__ import annotations

from typing import Any

NT_TYPES = ("alarm", "safety", "open", "unlock", "motion", "offline", "battery", "ha")
NT_DEFAULT_ON = {"alarm": True, "safety": True, "open": True, "unlock": False, "motion": False, "offline": False, "battery": True, "ha": True}
NT_SAFE = {
    "smoke": "Smoke detected",
    "gas": "Gas detected",
    "carbon_monoxide": "Carbon monoxide detected",
    "moisture": "Water leak",
    "heat": "Heat alert",
    "safety": "Safety alert",
    "tamper": "",
}
SHADE_DC = ("shutter", "blind", "curtain", "shade", "awning", "window")
SEC_BS = ("door", "window", "opening", "garage_door", "lock", "occupancy", "motion", "tamper")
NOT_OPEN_DC = ("motion", "occupancy", "presence", "tamper", "smoke", "gas", "moisture", "carbon_monoxide")
SERVICES = ("light", "camera", "climate", "media_player", "cover", "lock", "alarm_control_panel")


def domain(entity_id: str) -> str:
    return entity_id.split(".", 1)[0]


def service_of(entity_id: str, attrs: dict[str, Any]) -> str | None:
    """The Quint service an entity belongs to (None when Quint does not show it)."""
    d, dc = domain(entity_id), attrs.get("device_class")
    if d == "light":
        return "lights"
    if d == "camera":
        return "cameras"
    if d == "climate":
        return "climate"
    if d == "media_player":
        return "media"
    if d == "cover":
        return "shades" if not dc or dc in SHADE_DC else "security"
    if d in ("lock", "alarm_control_panel"):
        return "security"
    if d == "binary_sensor" and dc in SEC_BS:
        return "security"
    return None


def is_open_entity(entity_id: str, state: str, attrs: dict[str, Any]) -> bool:
    """A door, gate, garage or window that is open (the 'left open' alert watches these)."""
    d, dc = domain(entity_id), attrs.get("device_class")
    sec = service_of(entity_id, attrs) == "security"
    if d == "cover":
        return (sec or dc in ("door", "garage", "gate", "window")) and state in ("open", "opening")
    if d == "binary_sensor":
        return (dc in ("door", "garage_door", "window", "opening") or (sec and dc not in NOT_OPEN_DC)) and state == "on"
    return False


def _name(entity_id: str, attrs: dict[str, Any]) -> str:
    return str(attrs.get("friendly_name") or entity_id)


def classify_change(entity_id: str, old: str, new: str, attrs: dict[str, Any], old_attrs: dict[str, Any] | None = None) -> dict[str, Any] | None:
    """An alert for one state change, or None. Same rules as the panel's own alerts."""
    d, dc, nm = domain(entity_id), attrs.get("device_class"), _name(entity_id, attrs)
    if d == "alarm_control_panel" and new == "triggered":
        return {"type": "alarm", "ent": entity_id, "title": "Alarm triggered", "msg": nm, "crit": True}
    if d == "binary_sensor" and new == "on" and old != "on":
        if dc in NT_SAFE:
            return {"type": "safety", "ent": entity_id, "title": NT_SAFE[dc], "msg": nm, "crit": True}
        if dc == "battery":
            return {"type": "battery", "ent": entity_id, "title": "Low battery", "msg": nm, "day": True}
        if dc in ("motion", "occupancy"):
            return {"type": "motion", "ent": entity_id, "title": "Motion detected", "msg": nm}
    if d == "lock" and new == "unlocked" and old == "locked":
        return {"type": "unlock", "ent": entity_id, "title": "Door unlocked", "msg": nm}
    if d == "sensor" and dc == "battery":
        try:
            v = float(new)
        except (TypeError, ValueError):
            return None
        try:
            ov = float(old)
        except (TypeError, ValueError):
            ov = None
        if 0 <= v < 15 and not (ov is not None and ov < 15):
            return {"type": "battery", "ent": entity_id, "title": "Low battery", "msg": f"{nm} · {round(v)}%", "day": True}
    return None


def left_open(entity_id: str, attrs: dict[str, Any], minutes: int) -> dict[str, Any]:
    return {"type": "open", "ent": entity_id, "title": "Left open", "msg": f"{_name(entity_id, attrs)} has been open for {minutes} minutes"}


def offline(entity_id: str, attrs: dict[str, Any]) -> dict[str, Any]:
    return {"type": "offline", "ent": entity_id, "title": "Device offline", "msg": f"{_name(entity_id, attrs)} is not answering"}


def persistent(notification_id: str, title: Any, message: Any) -> dict[str, Any]:
    msg = str(message or "")
    for ch in "*_`#>":
        msg = msg.replace(ch, "")
    return {"type": "ha", "ent": "pn:" + str(notification_id), "title": str(title or "Home Assistant")[:80], "msg": msg[:200]}


def clean_push(raw: Any) -> dict[str, Any]:
    """Validate the shared setting {"on": bool, "targets": ["mobile_app_x", ...]}."""
    out: dict[str, Any] = {"on": False, "targets": []}
    if isinstance(raw, dict):
        out["on"] = raw.get("on") is True
        t = raw.get("targets")
        if isinstance(t, list):
            out["targets"] = sorted({x for x in t if isinstance(x, str) and x.startswith("mobile_app_") and len(x) <= 80 and x.replace("_", "").isalnum()})[:12]
    return out


def in_quiet(quiet: Any, hour: int, crit: bool) -> bool:
    """Quiet hours: the same rule as the panel (critical alerts still go through unless switched off)."""
    if not isinstance(quiet, dict) or not quiet.get("on"):
        return False
    a = 22 if quiet.get("from") is None else int(quiet.get("from"))
    b = 7 if quiet.get("to") is None else int(quiet.get("to"))
    inside = hour >= a or hour < b if a > b else a <= hour < b
    return inside and not (crit and quiet.get("crit") is not False)


def type_on(ntf: Any, kind: str) -> bool:
    ntf = ntf if isinstance(ntf, dict) else {}
    if ntf.get("on") is False:
        return False
    types = ntf.get("types") if isinstance(ntf.get("types"), dict) else {}
    return bool(types.get(kind, NT_DEFAULT_ON.get(kind, False)))
