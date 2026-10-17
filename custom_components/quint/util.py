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
