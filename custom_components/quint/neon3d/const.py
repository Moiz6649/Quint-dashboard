"""Constants for NeonPlan 3D, as embedded in Quint.

This folder is a copy of the MIT-licensed NeonPlan 3D integration by Mastershort
(https://github.com/Mastershort/neonplan3d, see LICENSE). Only the glue to Quint was changed:
the pieces that registered NeonPlan's own sidebar page and dashboard-card resource are not used,
the frontend is served from Quint's static path, and the version below is the upstream version
the bundled frontend files were built from.
"""

from __future__ import annotations

DOMAIN = "neonplan3d"
# the integration's earlier name; its stores are taken over once (see storage.py)
LEGACY_DOMAIN = "floorplan_3d"

STORAGE_VERSION = 1
# minor versions of the building store; each step has a migration in storage.py
STORAGE_MINOR_VERSION = 2
STORAGE_KEY_BUILDING = f"{DOMAIN}.building"
STORAGE_KEY_IMAGES = f"{DOMAIN}.images"
STORAGE_KEY_HISTORY = f"{DOMAIN}.history"
STORAGE_KEY_PACKS = f"{DOMAIN}.packs"
STORAGE_KEY_LICENSE = f"{DOMAIN}.license"
# opt-in usage and error reports (see diagnostics_report.py)
STORAGE_KEY_DIAGNOSTICS = f"{DOMAIN}.diagnostics"
# hass.data key of the reporter
DATA_DIAGNOSTICS = f"{DOMAIN}_diagnostics"

# restore points: at most this many, and a new one only after this pause since the last one
HISTORY_MAX = 20
HISTORY_INTERVAL = 600

# the bundled frontend lives in ../frontend/neon3d and is served by Quint's static path
URL_BASE = "/quint_static/neon3d"
# the upstream version of the bundled frontend (the frontend compares it with what the backend reports)
NEON_VERSION = "2.0.6"
MAIN_BUNDLE = "neonplan3d.js"
PANEL_URL_PATH = "quint"
PANEL_COMPONENT = "neonplan3d-panel"
PANEL_ICON = "mdi:floor-plan"
PANEL_TITLE = "Quint"

SIGNAL_BUILDING_UPDATED = f"{DOMAIN}_building_updated"
# a sentence for the open views (see voice.py) and the hass.data key of its broker
SIGNAL_ASK = f"{DOMAIN}_ask"
DATA_ASK = f"{DOMAIN}_ask"
# the voice settings (which sentences Assist hands to NeonPlan), kept in .storage
DATA_VOICE = f"{DOMAIN}_voice"
STORAGE_KEY_VOICE = f"{DOMAIN}.voice"
