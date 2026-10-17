# Quint Dashboard

Standalone Savant-style dashboard for Home Assistant. Installs as an integration and adds its own **sidebar panel**. No Lovelace setup, no token, no YAML.

- Home page (wall-panel style): client name top left, big clock, date, weather + sunset, greeting, scene buttons, and one live card per service – Security (status, doors/locks, alarm mode), Cameras (live picture), Lighting (rooms with on/off), Climate, Media (now playing + controls), Shades
- **v1.9.3**: the room photo now fills the **whole screen** behind that room's page (slightly darkened so text stays readable); the normal background returns when you leave the room
- **v1.9.2**: **floors** (tabs like Ground / First / Outside on the Rooms page; add, rename, order floors and choose each room's floor in Settings → Rooms; HA floors are imported automatically); **room photos** are now set in Settings → Room photos (shared for everyone by an admin with a switch per room; normal users can pick their own photo per room on their device); the photo button is removed from the room page
- **v1.9.1**: scenes are added only in **Settings → Scenes** (not on the home page); a scene can belong to a room and then also shows on that room's page; every user now has a settings button with **Scenes** and **Background** (saved on their own device); **room photo** button at the top right of every room page; Intercom buttons (Video / Audio / Open door) can be shown or hidden in Settings → Intercom
- **v1.9.0**: organized balanced home columns, **Intercom** tile (video call, audio call, open door, doorbell ring), **each camera as its own tile**, a clearer **Lighting** tile (rooms with switch + dimmer, All on / All off), **Scenes you can create** (shared or only on this device), **personal background** for every user, a dynamic sliding bottom bar, and AM/PM clock fix
- **Tap a camera to open it big** (live stream, with snapshot fallback); switch cameras with the arrows or the name buttons
- **Rooms** tab: pick a room on the left and see all its lights (with dimmers), shades, climate, media, cameras and custom cards
- Bottom bar: Home, Rooms, one tab per service, and **your own text + the settings button** on the right (text is editable)
- Every service can be shown or hidden in Settings → Home page
- Lighting / Shades / Climate / Media pages are grouped by room; Cameras and Security have their own pages
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

## Screen layouts (phone / tablet / desktop)
The dashboard measures its own width and picks a layout automatically:
- **Phone** (< 600 px): one column, icon tabs in the bottom bar, bottom-sheet dialogs.
- **Tablet** (600–899 px): clock and greeting on top, two columns of cards.
- **Wide screens / wall panels** (≥ 900 px): clock, greeting and scenes in a fixed left column, cards on the right, rooms list on the left of the Rooms page.

Admins can force a layout per device in **Settings → Screen layout**.

## Settings page (admin only)
Left menu, right panels, with **Save / Reset everything / Close** at the top. Changes are staged: nothing is stored on the server until you press **Save**, and **Close** (or leaving the page) asks before discarding.
- **General** – settings file (export / import JSON), **Client name** (top left), **Bottom text** (next to the settings button, default *By Quinteca*, empty hides it), greeting name, **Background**, and per-device screen layout and fullscreen.
- **Pages** – rename, show/hide and re-order the services (home tiles and bottom bar).
- **Rooms** – rename, show/hide, re-order, add, delete, re-import from HA areas.
- **Devices** – search, assign a room, hide.
- **Home page** – turn the clock, weather line, scenes and Rooms tab on/off; **show or hide each service** (card + tab); choose which scenes appear.
- **Home tiles** – choose exactly which devices appear on each home tile (Security, Cameras, Lighting, Climate, Media, Shades). Every chosen camera becomes its own tile. *Back to automatic* undoes it.
- **Intercom** – pick the camera, the doorbell (binary_sensor or event), and the action for **Video call**, **Audio call** and **Open door**. An action can be a link (`https:`, `tel:`, `sip:`), an HA path (`/lovelace/x`), an entity (lock, script, button…) or `domain.service` + target + JSON data. **Video / Audio / Open door buttons can each be hidden** in Settings → Intercom. **Open door needs two taps** so it cannot open by accident. There is no built-in two-way audio: use your own script, SIP link or app for the audio call.
- **Scenes** – list, edit and delete shared scenes. Choose which HA `scene.*` entities show.
- **Cards** – every custom card you added, with delete and add.

### Scenes
Scenes are added in **Settings → Scenes** (the home page only shows and runs them). Set your devices the way you want, press **＋ New scene**, pick a room (optional), choose the devices and save. A scene with a room also shows on that room's page. Admins can save a scene for **everyone** (stored on the server) or **only this device**. Normal users also have the Settings button, but only with **Scenes** and **Background**, and everything they save stays on their own device.

### Floors
In **Settings → Rooms** add floors (or let Quint import your Home Assistant floors), then choose a floor for each room. The Rooms page shows one tab per floor (rooms without a floor are under **Other**).

### Room photos
**Settings → Room photos** lists every room. Admins choose a photo per room (stored on the HA server in `.storage/quint.roomimg`, shared by everyone) and use the switch to show or hide it as the full-screen background of that room's page. Normal users see the same tab and can pick their own photo for a room; it is saved in their browser only.

### Background
Pick a colour theme, or upload your own photo (shrunk to 1920 px and stored on the HA server in `.storage/quint.background`). **Darken** and **Blur** keep text readable. The shared background is set by admins. Every user can also press the palette button in the bottom bar to choose a theme or their **own photo for this device only** (stored in the browser). Normal users can also do this in Settings → Background.

### More (admin)
**More** is always shown to admins so they can add extra cards to any room (＋ Add card in every room). Other users only see it once it has cards.
