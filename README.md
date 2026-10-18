# Quint Dashboard

Standalone Savant-style dashboard for Home Assistant. Installs as an integration and adds its own **sidebar panel**. No Lovelace setup, no token, no YAML.

- Home page (wall-panel style): client name top left, big clock, date, weather + sunset, greeting, scene buttons, and one live card per service – Security (status, doors/locks, alarm mode), Cameras (live picture), Lighting (rooms with on/off), Climate, Media (now playing + controls), Shades
- **v1.12.0**: **automatic updates** – publish on GitHub and everything else happens by itself: a GitHub release is created when the version number changes, HACS notices it, Quint installs it, restarts Home Assistant, and every open screen reloads itself. New *Settings → Updates* page (version, *Check now*, *Update now*, *Restart now* and switches for each automatic step)
- **v1.11.0**: new **shutter / curtain / roller / awning cards**: a drawn window that shows the real position (slats for shutters and blinds, fabric panels for curtains, a striped canopy for awnings, night sky after sunset), **drag the window** to set the position, presets (Open · 75 · 50 · 25 · Closed), ▲ ■ ▼ buttons and a tilt slider when the blind supports tilt. Used on the home tile (a small window per shade), room pages and the Shades page
- **v1.10.0**: **several intercoms** (Settings → Intercoms: add one per door station, each with its own tile, camera, bell and buttons); **Automations** (choose automations and scripts in Settings → Automations: a home tile and tab with an on/off switch and ▶ run button); **Access** (Settings → Access: *Open Quint first* and *Lock to Quint* for normal users, for all of them or only chosen ones)
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

### Automatic updates
The whole chain runs without you:
1. You push a new version to `main` (the version number in `manifest.json` goes up). The workflow `.github/workflows/release.yml` creates the GitHub release `vX.Y.Z` by itself.
2. HACS notices the release (it looks about every two hours). **Settings → Updates → Check now** asks HACS right away.
3. Quint asks HACS to install it (switch *Install new versions*).
4. About a minute after the files change, Quint restarts Home Assistant (switch *Restart Home Assistant*). A notification tells you what is happening. If the configuration is invalid Home Assistant refuses to restart and nothing is lost.
5. Every open Quint screen notices the new version and reloads itself: no hard refresh.

Both switches are on by default. This also works when you update by hand in HACS: as soon as Quint sees newer files than the running version, it restarts Home Assistant. It needs HACS only for step 3; without HACS, install the files yourself and Quint still does steps 4 and 5.

### Shutter, curtain and roller cards
Every cover that Home Assistant calls a shutter, blind, shade, curtain, awning or window gets a drawn window card. The kind is chosen from the device class, or from words in its name (*curtain*, *drape*, *awning*, *pergola*). **Drag** the window up/down (curtains: from the side) to set the position; nothing is sent until you let go. Covers that cannot report a position only show the ▲ ■ ▼ buttons.

### Several intercoms
**Settings → Intercoms**: press **＋ Add intercom** for every door station, pick it in the list and set its name, camera, doorbell sensor, button visibility and the Open door / Audio call / Video call actions. Each intercom gets its own tile (and rings on its own doorbell). Settings saved by older versions become the first intercom automatically.

### Automations
**Settings → Automations** lists every Home Assistant automation and script. Switch on the ones you want on the dashboard: they appear in an **Automations** tile and tab, where users can switch an automation on/off or press **▶** to run it (scripts only have ▶).

### Users: one Quint admin, limits per user (v1.13)
**Settings → Users**
- **Quint admin** – a Home Assistant admin picks **one** normal user. That person has the same rights as every other user, **plus** the Users tab: they can add users, remove users and choose what each user may use. They cannot become a Home Assistant admin and cannot change their own limits (only a Home Assistant admin can).
- **Add a user** – name, login name and password (8+ characters). The account is a normal Home Assistant user.
- **Limits** – for each user switch services (Lights, Cameras, Intercom, Rooms page, …) and rooms off. A hidden room hides its devices and any scene that uses them. Limits are saved right away (no Save button) and apply the next time that user opens Quint.
- New users start with everything allowed. Home Assistant admins are never limited.

- **Updates** – the Quint admin also gets the **Updates** tab: check for a new version, install it, restart Home Assistant, and switch the automatic steps on or off (saved right away).

Limits hide things inside Quint; they are **not a security wall**. Also use **Access → Lock to Quint** so users cannot open Home Assistant itself.

### Sign out (v1.15)
Every user (admin, Quint admin and normal users) has a **Sign out** button at the top of **Settings**. It signs the user out of Home Assistant on that device, which is handy when the sidebar is hidden by **Lock to Quint**.

### Access (default page and lock)
**Settings → Access** (admin only):
- **Open Quint first** – after signing in, normal users land on Quint instead of the default Home Assistant page (once per browser session; they can still go elsewhere).
- **Lock to Quint** – normal users cannot open other Home Assistant pages: the sidebar is hidden and any other address sends them back to Quint.
- **Who is locked** – leave all users off to lock every normal user, or switch on only the users you want to lock. Admins are never affected.

This works through a small script (`quint-guard.js`) that Quint loads on every Home Assistant page. It hides and redirects the screens; it is **not a security wall**. For real limits keep these users non-admin. Restart Home Assistant once after updating so the script is loaded.

### Floors
In **Settings → Rooms** add floors (or let Quint import your Home Assistant floors), then choose a floor for each room. The Rooms page shows one tab per floor (rooms without a floor are under **Other**).

### Room photos
**Settings → Room photos** lists every room. Admins choose a photo per room (stored on the HA server in `.storage/quint.roomimg`, shared by everyone) and use the switch to show or hide it as the full-screen background of that room's page. Normal users see the same tab and can pick their own photo for a room; it is saved in their browser only.

### Background
Pick a colour theme, or upload your own photo (shrunk to 1920 px and stored on the HA server in `.storage/quint.background`). **Darken** and **Blur** keep text readable. The shared background is set by admins. Every user can also press the palette button in the bottom bar to choose a theme or their **own photo for this device only** (stored in the browser). Normal users can also do this in Settings → Background.

### More (admin)
**More** is always shown to admins so they can add extra cards to any room (＋ Add card in every room). Other users only see it once it has cards.
