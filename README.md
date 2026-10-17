# Quint Dashboard

Standalone Savant-style dashboard for Home Assistant. Installs as an integration and adds its own **sidebar panel**. No Lovelace setup, no token, no YAML.

- Home page: greeting, clock, one tile per service (only services with devices appear)
- Lighting / Shades / Climate / Media → room list → room page with custom cards
- Cameras and Security pages (door / lock / intercom status)
- **More**: add any entity or any Lovelace card (JSON) to any room
- Settings: rooms (from HA Areas), device → room assignment, hide devices, fullscreen mode
- Settings are stored on the HA server and shared by all devices (only admins can change them)

## Install
1. HACS → ⋮ → **Custom repositories** → add `https://github.com/<your-user>/quint-dashboard`, type **Integration**.
2. Download **Quint Dashboard** and **restart Home Assistant**.
3. Settings → Devices & services → **Add integration** → *Quint Dashboard* → enter the title (e.g. Quint).
4. **Quint** appears in the sidebar. Hard-refresh the browser if it doesn't.

Create a GitHub release (e.g. `v1.1.0`) so HACS can install it. Replace `YOUR-USER` in `manifest.json`.

## Fullscreen / wall panel
Settings → **Fullscreen** hides the HA sidebar on that device (☰ button brings it back).

## Admin-only editing
Only Home Assistant **administrators** see the Settings button, the **＋ Add card** tile and the ✕ remove buttons. Other users can use the dashboard and view existing custom cards. Changes are also rejected by the server for non-admins.

## Add-card options and moving cards
- **Add card** lets you filter by device type (every domain found in your HA), pick the entity, choose a style (Auto / On-Off / Run button / Value) and an icon. Auto supports: switch, fan (speed), humidifier, number / input_number (slider), select / input_select (dropdown), scene, script, button, vacuum, lawn mower, water heater, alarm panel, weather, sensors and more.
- **Move cards (admin):** press and hold a card for **5 seconds** (it outlines, then lifts), drag it over another card and release. The order is saved per page/room on the server.

## Template cards
**Add card → Card type → Template card (Jinja)**, or use the **＋ Add card** tile on the Home page.
- **Name / Icon** – any `mdi:` icon.
- **Place** – the Home page or any room.
- **Text / Label** – Jinja templates rendered live by Home Assistant, e.g. `{{ states('sensor.outside_temperature') }} °C` and `{{ relative_time(states.sensor.x.last_changed) }} ago`.
- **Entity** – used for details (hold the card ~1 s) and toggling.
- **Tap** – entity details, toggle entity, run action (`light.turn_on` + optional JSON data) or go to a path.
- Hold 5 seconds to move a card (admin).

## Custom services (new home tiles)
When you add a card to a **room**, the dialog has a **Service** field (default *More*). Every distinct service name becomes its own tile on the Home screen and in the bottom bar, with the name on it, e.g. *Pool*, *Gate*, *Irrigation*. Tapping the tile opens a page grouped by room; each room also gets a tab for that service. Optional **Service icon** (`mdi:…`) sets the tile icon. Cards placed on **Home** appear under *My cards* instead.
