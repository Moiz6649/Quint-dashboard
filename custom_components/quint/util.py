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
