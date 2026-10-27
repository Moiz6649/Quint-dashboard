"""Sensor platform of Quint: the room sensors of the embedded NeonPlan 3D locating feature."""
from __future__ import annotations

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddEntitiesCallback

from .const import DOMAIN


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry, async_add_entities: AddEntitiesCallback) -> None:
    # only when the embedded 3D house is running (it forwards this platform itself)
    from .neon3d.sensor import async_setup_entry as setup

    await setup(hass, entry, async_add_entities)
