/* Quint Dashboard – Savant-style full-page dashboard for Home Assistant (HACS plugin) */
const ic = (p) => `<svg class="si" viewBox="0 0 24 24">${p}</svg>`;
const SV = {
  lights:  { n: "Lighting", c: "#f5a623", i: ic('<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.7.7 1 1.5 1 2.5h6c0-1 .3-1.8 1-2.5A6 6 0 0 0 12 3z"/>') },
  cameras: { n: "Cameras",  c: "#4aa3ff", i: ic('<path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2"/>') },
  shades:  { n: "Shades",   c: "#2dd4bf", i: ic('<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 8h18M3 13h18M12 13v6"/>') },
  climate: { n: "Climate",  c: "#ff7a59", i: ic('<path d="M14 14.8V5a2 2 0 0 0-4 0v9.8a4 4 0 1 0 4 0z"/>') },
  media:   { n: "Media",    c: "#b388ff", i: ic('<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>') },
  security:{ n: "Security", c: "#34c98b", i: ic('<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>') },
  more:    { n: "More",     c: "#ff6fae", i: ic('<circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/>') },
};
const HOME_I = ic('<path d="M3 11l9-8 9 8v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/>');
const GEAR_I = ic('<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9L17 7M7 17l-2.1 2.1"/>');
const ICONS = {
  bulb: SV.lights.i, plug: ic('<path d="M9 2v6M15 2v6M6 8h12v4a6 6 0 0 1-12 0zM12 18v4"/>'),
  fan: ic('<circle cx="12" cy="12" r="2"/><path d="M12 10C12 4 17 3 17 6s-3 4-5 4zM14 12c6 0 7 5 4 5s-4-3-4-5zM12 14c0 6-5 7-5 4s3-4 5-4zM10 12C4 12 3 7 6 7s4 3 4 5z"/>'),
  tv: ic('<rect x="2" y="5" width="20" height="13" rx="2"/><path d="M8 21h8"/>'),
  speaker: ic('<rect x="5" y="2" width="14" height="20" rx="2"/><circle cx="12" cy="15" r="3"/><circle cx="12" cy="7" r="1"/>'),
  door: ic('<path d="M5 21V3h10l4 2v16M5 21h14"/><circle cx="13" cy="12" r=".8"/>'),
  water: ic('<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/>'),
  flame: ic('<path d="M12 22c4 0 7-3 7-7 0-3-2-5-3-7-1 2-2 3-3 3 0-4-2-7-4-9 0 5-4 7-4 12 0 4 3 8 7 8z"/>'),
  snow: ic('<path d="M12 2v20M4 7l16 10M20 7L4 17"/>'),
  bell: ic('<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M10 21h4"/>'),
  power: ic('<path d="M12 3v9M6.4 6.6a8 8 0 1 0 11.2 0"/>'),
  lock: ic('<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>'),
  camera: ic('<path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2"/>'),
  home: ic('<path d="M3 11l9-8 9 8v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/>'),
};
const LOGO_I = ic('<path d="M12 2l9 5v10l-9 5-9-5V7z"/><path d="M12 8v8M8 10l4 2 4-2"/>');
const SHADE_DC = ["shutter", "blind", "curtain", "shade", "awning", "window"];
const SEC_BS = ["door", "window", "opening", "garage_door", "lock", "occupancy", "motion", "tamper"];
const OFF = ["off", "unavailable", "unknown", "standby", "closed", "locked", "idle"];
const KEY = "quint_cfg";

const CSS = `
:host{display:block;height:100vh;overflow-y:auto;--ac:#f5a623;--ok:#34c98b;--bad:#ff5d6c;--mu:#8d9ab8;--bd:rgba(255,255,255,.10);color:#eef2fa;font-family:"Inter",-apple-system,"SF Pro Display","Segoe UI",Roboto,sans-serif}
*{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
.si{width:1em;height:1em;stroke:currentColor;fill:none;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round;vertical-align:-.12em}
.app{min-height:100%;display:flex;flex-direction:column;background:radial-gradient(900px 520px at 88% -8%,rgba(245,166,35,.16),transparent),radial-gradient(800px 520px at -10% 108%,rgba(74,163,255,.15),transparent),linear-gradient(160deg,#080d19,#131c34)}
header{display:flex;justify-content:space-between;align-items:center;padding:18px 28px}
.brand{display:flex;align-items:center;gap:12px;font-size:20px;letter-spacing:7px;font-weight:600;text-transform:uppercase}
.brand .si{font-size:30px;color:var(--ac)}
.hb{display:flex;gap:12px;align-items:center;color:var(--mu);font-size:15px}
button{font:inherit;color:inherit;cursor:pointer}
.ib{background:rgba(255,255,255,.07);border:1px solid var(--bd);border-radius:50%;width:42px;height:42px;font-size:20px;display:grid;place-items:center;padding:0}
main{flex:1;padding:6px 28px 24px;max-width:1240px;width:100%;margin:0 auto}
main.anim{animation:in .3s ease}
@keyframes in{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
.hero{display:flex;justify-content:space-between;align-items:flex-end;gap:20px;flex-wrap:wrap;margin:8px 0 26px}
.clk{font-size:76px;font-weight:200;line-height:1;letter-spacing:-2px}
h1{font-weight:300;font-size:30px;margin:6px 0 10px}h2{font-weight:500;font-size:13px;letter-spacing:2px;text-transform:uppercase;color:var(--mu);margin:28px 0 12px}
.sub{color:var(--mu);font-size:16px;margin-top:6px}.lbl{color:var(--mu);font-size:13px}
.pills{display:flex;gap:8px;flex-wrap:wrap}
.pill{display:inline-flex;gap:7px;align-items:center;padding:8px 14px;border-radius:30px;background:color-mix(in srgb,var(--c) 14%,transparent);border:1px solid color-mix(in srgb,var(--c) 35%,transparent);color:var(--c);font-size:13px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:16px}
.tile,.card{position:relative;background:linear-gradient(145deg,rgba(255,255,255,.09),rgba(255,255,255,.03));border:1px solid var(--bd);border-radius:28px;padding:20px}
.card{border-radius:24px;padding:18px}
.tile{cursor:pointer;min-height:180px;display:flex;flex-direction:column;justify-content:space-between;transition:transform .18s,box-shadow .18s}
.tile:hover{transform:translateY(-3px)}.tile:active{transform:scale(.97)}
.tile.on{background:linear-gradient(150deg,color-mix(in srgb,var(--c) 42%,#0b1220),color-mix(in srgb,var(--c) 8%,#0b1220));border-color:color-mix(in srgb,var(--c) 60%,transparent);box-shadow:0 14px 40px -16px var(--c)}
.bdg{width:50px;height:50px;border-radius:50%;display:grid;place-items:center;font-size:24px;flex:none;background:color-mix(in srgb,var(--c) 18%,transparent);color:var(--c);transition:.2s}
.tile.on .bdg,.card.on .bdg{background:var(--c);color:#10131c}
.num{font-size:38px;font-weight:300;line-height:1.05}.nm{font-weight:500;font-size:16px}
.card.on{border-color:rgba(245,166,35,.45);box-shadow:0 10px 30px -16px var(--ac)}
.row{display:flex;align-items:center;gap:14px}.grow{flex:1;min-width:0}
.st{color:var(--mu);font-size:13px;margin-top:2px;text-transform:capitalize}
.btns{display:flex;gap:8px;margin-top:14px}
.btns button{flex:1;background:rgba(255,255,255,.09);border:0;border-radius:14px;padding:11px;min-width:44px;transition:.15s}
.btns button:active{background:var(--ac);color:#000}
input[type=range]{-webkit-appearance:none;appearance:none;width:100%;height:12px;border-radius:6px;background:rgba(255,255,255,.14);margin-top:16px;outline:0}
input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:26px;height:26px;border-radius:50%;background:#fff;box-shadow:0 2px 10px #0009}
input[type=range]::-moz-range-thumb{width:26px;height:26px;border:0;border-radius:50%;background:#fff}
.sw{width:50px;height:30px;border-radius:15px;background:#37425e;position:relative;border:0;flex:none;transition:.2s}
.sw::after{content:"";position:absolute;top:3px;left:3px;width:24px;height:24px;border-radius:50%;background:#fff;transition:.2s}
.sw.on{background:var(--ac)}.sw.on::after{left:23px}
.big{font-size:44px;font-weight:200;margin-top:10px}
img.cam{width:100%;border-radius:16px;margin-top:12px;background:#000;aspect-ratio:16/9;object-fit:cover}
nav{position:sticky;bottom:16px;margin:0 auto 16px;display:flex;gap:4px;padding:8px;border-radius:36px;background:rgba(18,26,46,.72);backdrop-filter:blur(22px);border:1px solid var(--bd);max-width:calc(100% - 24px);overflow-x:auto;box-shadow:0 18px 50px -10px #000c}
nav button{background:none;border:0;padding:9px 16px;border-radius:28px;display:flex;flex-direction:column;align-items:center;gap:3px;font-size:11px;color:var(--mu);min-width:74px;transition:.2s}
nav button .si{font-size:23px}
nav button.act{background:color-mix(in srgb,var(--c,#fff) 20%,transparent);color:var(--c,#fff)}
.tabs{display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap}.tabs button{display:flex;gap:7px;align-items:center;background:rgba(255,255,255,.07);border:1px solid var(--bd);border-radius:30px;padding:9px 18px}.tabs button.act{background:var(--ac);color:#000;border-color:var(--ac)}
.back{background:rgba(255,255,255,.07);border:1px solid var(--bd);border-radius:30px;color:#fff;padding:7px 16px;margin:6px 0 10px;font-size:14px}
input[type=text],select{width:100%;background:rgba(0,0,0,.3);border:1px solid var(--bd);color:#eef2fa;border-radius:12px;padding:11px;font:inherit}
table{width:100%;border-collapse:collapse;font-size:14px}td{padding:8px 6px;border-bottom:1px solid var(--bd)}
.dot{display:inline-block;width:9px;height:9px;border-radius:50%;background:var(--bad);margin-right:6px}.dot.ok{background:var(--ok)}
.cw{position:relative}.rm{position:absolute;top:8px;right:8px;width:26px;height:26px;border-radius:50%;border:0;background:rgba(0,0,0,.45);color:#fff;font-size:12px;opacity:.55;z-index:2}.rm:hover{opacity:1;background:var(--bad)}
.tile.add{min-height:120px;border-style:dashed;background:transparent;opacity:.85}.lvw{grid-column:span 2}
.ov{position:fixed;inset:0;background:rgba(5,8,16,.7);backdrop-filter:blur(6px);display:grid;place-items:center;z-index:99;padding:16px}
.dlg{width:min(520px,100%);background:#141c33;border:1px solid var(--bd);border-radius:28px;padding:24px;max-height:90vh;overflow:auto}.dlg input{margin-top:4px}
textarea{width:100%;min-height:96px;background:rgba(0,0,0,.3);border:1px solid var(--bd);color:#eef2fa;border-radius:12px;padding:11px;font:13px monospace;margin-top:4px}
.err{color:var(--bad);font-size:13px;min-height:18px;margin-top:6px}.pri{background:var(--ac)!important;color:#000!important;font-weight:600}
.rh{display:flex;align-items:center;gap:12px;margin:28px 0 12px}.rh .grow{cursor:pointer}.rn{font-size:22px;font-weight:500}.rb{margin:0}.rb button{flex:none;padding:8px 14px;font-size:13px}
.kw{position:relative}.kw,.cw{border-radius:24px;-webkit-touch-callout:none;-webkit-user-select:none;user-select:none}
.holding{animation:hold 5s linear forwards}@keyframes hold{from{box-shadow:0 0 0 0 transparent}to{box-shadow:0 0 0 5px var(--ac)}}
.moving{transform:scale(1.04);box-shadow:0 20px 50px -10px #000c,0 0 0 3px var(--ac);z-index:5;opacity:.93;transition:transform .15s}
.hint{position:fixed;left:50%;bottom:96px;transform:translateX(-50%);background:var(--ac);color:#000;padding:10px 18px;border-radius:24px;font-weight:600;z-index:100;white-space:nowrap}
@media(max-width:600px){.clk{font-size:56px}main,header{padding-left:16px;padding-right:16px}.grid{grid-template-columns:repeat(2,1fr);gap:12px}.tile{min-height:150px}}
`;

class QuintDashboard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.innerHTML = `<style>${CSS}</style><div id="r"></div>`;
    this._root = this.shadowRoot.getElementById("r");
    this._v = { p: "home" };
    let c = {};
    try { c = JSON.parse(localStorage.getItem(KEY) || "{}"); } catch (e) {}
    this._c = { rooms: [], map: {}, hide: [], name: "", custom: {}, order: {}, ...c };
    this.shadowRoot.addEventListener("click", (e) => this._click(e));
    this.shadowRoot.addEventListener("change", (e) => this._change(e));
    this.shadowRoot.addEventListener("pointerdown", (e) => { if (e.target.type === "range") this._drag = true; });
    window.addEventListener("pointerup", () => { this._drag = false; });
    const R = this.shadowRoot;
    R.addEventListener("pointerdown", (e) => this._pdown(e));
    R.addEventListener("pointermove", (e) => this._pmove(e));
    R.addEventListener("pointerup", () => this._pup());
    R.addEventListener("pointercancel", () => this._pup());
    R.addEventListener("touchmove", (e) => { if (this._mv) e.preventDefault(); }, { passive: false });
    R.addEventListener("contextmenu", (e) => { if (this._hold || this._mv) e.preventDefault(); });
  }
  _pdown(e) {
    if (!this._admin() || e.button > 0 || e.target.type === "range" || this._mv) return;
    const k = e.composedPath().find((n) => n.dataset && n.dataset.k); if (!k) return;
    this._hold = { k, x: e.clientX, y: e.clientY, id: e.pointerId };
    k.classList.add("holding");
    this._ht = setTimeout(() => this._startMove(), 5000);
  }
  _startMove() {
    if (!this._hold) return;
    const el = this._hold.k; el.classList.remove("holding"); el.classList.add("moving");
    try { el.setPointerCapture(this._hold.id); } catch (e) {}
    this._mv = { el }; this._hold = null;
    if (navigator.vibrate) navigator.vibrate(40);
    this._hint("Drag to a new position, then release");
  }
  _pmove(e) {
    if (this._hold && !this._mv) { if (Math.hypot(e.clientX - this._hold.x, e.clientY - this._hold.y) > 12) this._cancelHold(); return; }
    if (!this._mv) return;
    const el = this._mv.el, grid = el.parentNode, hit = this.shadowRoot.elementFromPoint(e.clientX, e.clientY);
    const t = hit && hit.closest && hit.closest("[data-k]");
    if (!t || t === el || t.parentNode !== grid) return;
    grid.insertBefore(el, t.compareDocumentPosition(el) & 2 ? t.nextSibling : t);
  }
  _cancelHold() { clearTimeout(this._ht); if (this._hold) this._hold.k.classList.remove("holding"); this._hold = null; this._draw(); }
  _pup() {
    if (this._hold) return this._cancelHold();
    if (!this._mv) return;
    const el = this._mv.el, grid = el.parentNode;
    el.classList.remove("moving");
    const ctx = grid && grid.dataset.grid;
    if (ctx) { this._c.order[ctx] = Array.from(grid.children).filter((c) => c.dataset && c.dataset.k).map((c) => c.dataset.k); this._save(); }
    this._mv = null; this._sup = Date.now() + 400; this._hint("");
    this._last = null; this._draw(true);
  }
  _hint(t) {
    const old = this.shadowRoot.getElementById("hint"); if (old) old.remove();
    if (!t) return;
    const h = document.createElement("div"); h.id = "hint"; h.className = "hint"; h.textContent = t; this.shadowRoot.appendChild(h);
  }
  _attrs(o, n) {
    const keepSrc = o.tagName === "IMG" && o.getAttribute("data-src") === n.getAttribute("data-src");
    for (const a of Array.from(n.attributes)) {
      if (keepSrc && a.name === "src") continue;
      if (o.getAttribute(a.name) !== a.value) o.setAttribute(a.name, a.value);
    }
    for (const a of Array.from(o.attributes)) {
      if (keepSrc && a.name === "src") continue;
      if (!n.hasAttribute(a.name)) o.removeAttribute(a.name);
    }
  }
  _morph(from, to) {
    const a = Array.from(from.childNodes), b = Array.from(to.childNodes), act = this.shadowRoot.activeElement;
    b.forEach((n, i) => {
      const o = a[i];
      if (!o) { from.appendChild(n.cloneNode(true)); return; }
      if (o.nodeType !== n.nodeType || o.nodeName !== n.nodeName) { from.replaceChild(n.cloneNode(true), o); return; }
      if (n.nodeType === 3) { if (o.nodeValue !== n.nodeValue) o.nodeValue = n.nodeValue; return; }
      if (n.nodeType !== 1) return;
      if (o.hasAttribute("data-lv")) {
        if (o.getAttribute("data-lv") !== n.getAttribute("data-lv")) from.replaceChild(n.cloneNode(true), o);
        return; // keep the mounted Lovelace card untouched
      }
      this._attrs(o, n);
      this._morph(o, n);
      if (o === act) return;
      if (o.tagName === "INPUT" && (o.type === "range" ? !this._drag : o.hasAttribute("data-rname") || o.hasAttribute("data-uname"))) o.value = n.getAttribute("value") ?? "";
      if (o.tagName === "SELECT") { const sel = n.querySelector("option[selected]"); o.value = sel ? sel.value : ""; }
    });
    while (from.childNodes.length > b.length) from.removeChild(from.lastChild);
  }
  _refreshCams() {
    this.shadowRoot.querySelectorAll("img.cam[data-src]").forEach((img) => {
      const b = img.dataset.src, u = b + (b.includes("?") ? "&" : "?") + "t=" + Date.now(), t = new Image();
      t.onload = () => { img.src = u; }; t.src = u;
    });
  }
  _time() { return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }); }
  connectedCallback() { this._iv2 = setInterval(() => this._refreshCams(), 5000); this._iv = setInterval(() => { const r = this.shadowRoot; [".clk", ".tm"].forEach((q) => { const e = r.querySelector(q); if (e) e.textContent = this._time(); }); }, 15000); }
  disconnectedCallback() { clearInterval(this._iv); clearInterval(this._iv2); }
  set panel(p) { this._title = (p && p.config && p.config.title) || "Quint"; }
  set narrow(n) { this._narrow = n; this._draw(true); }
  set route(r) {}
  setConfig(config) { this._title = (config && config.title) || "Quint"; }
  getCardSize() { return 12; }
  static getStubConfig() { return { title: "Quint" }; }

  set hass(h) {
    this._h = h;
    if (!this._loading) { this._loading = true; this._loadCfg(); }
    if (!this._c.rooms.length && h.areas) this._importRooms(false);
    if (this._pending) return;
    this._pending = setTimeout(() => { this._pending = null; this._draw(); }, 250);
  }

  /* ---------- helpers ---------- */
  _save() {
    localStorage.setItem(KEY, JSON.stringify(this._c));
    if (!this._h || !this._srv) return;
    clearTimeout(this._st);
    this._st = setTimeout(() => this._h.callApi("POST", "quint/config", this._c).catch(() => {}), 400);
  }
  async _loadCfg() {
    try {
      const d = await this._h.callApi("GET", "quint/config");
      this._srv = true;
      if (d && Object.keys(d).length) { this._c = { rooms: [], map: {}, hide: [], name: "", custom: {}, order: {}, ...d }; localStorage.setItem(KEY, JSON.stringify(this._c)); }
      else if (this._c.rooms.length) this._save();
    } catch (e) {}
    let ch = false;
    Object.values(this._c.custom).flat().forEach((it) => { if (!it.uid) { it.uid = this._uid(); ch = true; } });
    if (ch && this._admin()) this._save();
    if (this._h && !this._c.rooms.length) this._importRooms(false);
    this._loaded = true;
    this._applyFull(); this._draw(true);
  }
  _applyFull() {
    const v = localStorage.getItem("quint_full"); if (v === null) return;
    const full = v === "1";
    this.dispatchEvent(new CustomEvent("hass-dock-sidebar", { bubbles: true, composed: true, detail: { dock: full ? "always_hidden" : "docked" } }));
  }
  _importRooms(redraw = true) {
    const a = this._h.areas || {};
    this._c.rooms = Object.values(a).map((x) => ({ id: x.area_id, name: x.name }));
    this._save(); if (redraw) this._draw(true);
  }
  _roomOf(id) {
    if (this._c.map[id]) return this._c.map[id];
    const e = this._h.entities && this._h.entities[id];
    if (!e) return "";
    return e.area_id || (this._h.devices && this._h.devices[e.device_id] && this._h.devices[e.device_id].area_id) || "";
  }
  _svcOf(id) {
    const s = this._h.states[id]; if (!s) return;
    const d = id.split(".")[0], dc = s.attributes.device_class;
    if (d === "light") return "lights";
    if (d === "camera") return "cameras";
    if (d === "climate") return "climate";
    if (d === "media_player") return "media";
    if (d === "cover") return !dc || SHADE_DC.includes(dc) ? "shades" : "security";
    if (d === "lock" || d === "alarm_control_panel") return "security";
    if (d === "binary_sensor" && SEC_BS.includes(dc)) return "security";
  }
  _ents(svc, room) {
    return Object.keys(this._h.states).filter((id) => this._svcOf(id) === svc && !this._c.hide.includes(id) && (!room || this._roomOf(id) === room));
  }
  _nm(id) { return this._h.states[id].attributes.friendly_name || id; }
  _svcs() { return Object.keys(SV).filter((s) => s === "more" ? this._admin() || Object.values(this._c.custom).some((a) => a.length) : this._ents(s).length); }
  _rooms() { return this._c.rooms.filter((r) => r.on !== false); }
  _isOn(id) { return !OFF.includes(this._h.states[id].state); }
  _stats(svc) {
    const e = this._ents(svc), st = (i) => this._h.states[i].state;
    if (svc === "more") { const all = Object.values(this._c.custom).flat(); const n = all.filter((x) => x.type === "entity" && this._h.states[x.entity] && this._isOn(x.entity)).length; return { big: all.length, lbl: all.length ? `custom cards · ${n} on` : "add custom cards", on: n > 0 }; }
    if (svc === "lights") { const n = e.filter((i) => st(i) === "on").length; return { big: n, lbl: `on of ${e.length}`, on: n > 0 }; }
    if (svc === "cameras") { const n = e.filter((i) => !["unavailable", "unknown"].includes(st(i))).length; return { big: n, lbl: `online of ${e.length}`, on: n > 0 }; }
    if (svc === "shades") { const o = e.filter((i) => ["open", "opening"].includes(st(i))).length; return { big: `${o} / ${e.length - o}`, lbl: "open / closed", on: o > 0 }; }
    if (svc === "climate") { const n = e.filter((i) => !["off", "unavailable"].includes(st(i))).length; return { big: n, lbl: `HVAC on of ${e.length}`, on: n > 0 }; }
    if (svc === "media") { const n = e.filter((i) => ["on", "playing", "paused", "idle"].includes(st(i))).length; return { big: n, lbl: `audio on of ${e.length}`, on: n > 0 }; }
    const o = e.filter((i) => ["on", "open", "unlocked"].includes(st(i))).length;
    return { big: o ? `${o} open` : "Secure", lbl: o ? "doors / locks open" : "all closed & locked", on: o > 0 };
  }
  _roomCount(svc, r) {
    if (svc === "more") { const it = this._c.custom[r] || []; return { n: it.filter((x) => x.type === "entity" && this._h.states[x.entity] && this._isOn(x.entity)).length, t: it.length }; }
    const e = this._ents(svc, r); if (!e.length) return null;
    const n = e.filter((i) => { const s = this._h.states[i].state; return svc === "shades" ? ["open", "opening"].includes(s) : svc === "lights" ? s === "on" : this._isOn(i); }).length;
    return { n, t: e.length };
  }
  _admin() { return !!(this._h && this._h.user && this._h.user.is_admin); }
  _nav(p, x = {}) { this._v = { p, ...x }; this._draw(true); }
  _tileGo(s) { return s === "cameras" || s === "security" ? `data-go='${JSON.stringify({ p: s })}'` : `data-go='${JSON.stringify({ p: "rooms", svc: s })}'`; }

  /* ---------- events ---------- */
  _click(e) {
    if (this._sup && Date.now() < this._sup) return;
    const t = e.composedPath().find((n) => n.dataset && (n.dataset.go || n.dataset.act || n.dataset.tog || n.dataset.cc));
    if (!t) return;
    const d = t.dataset;
    if ((d.cc || (d.tog && !d.tog.startsWith("menu"))) && !this._admin()) return;
    if (d.go) { const { p, ...x } = JSON.parse(d.go); return this._nav(p, x); }
    if (d.cc) {
      const [k, r, i] = d.cc.split(":");
      if (k === "open") { this._dlg = { room: r }; return this._draw(true); }
      if (k === "cancel") { this._dlg = null; return this._draw(true); }
      if (k === "del") { this._c.custom[r].splice(+i, 1); this._save(); return this._draw(true); }
      if (k === "save") return this._saveCC();
    }
    if (d.act) { const [dom, srv] = d.act.split("."); const data = d.x ? JSON.parse(d.x) : {}; this._h.callService(dom, srv, { entity_id: d.e, ...data }); return; }
    if (d.tog) {
      const [k, v] = d.tog.split(":");
      if (k === "menu") return this.dispatchEvent(new CustomEvent("hass-toggle-menu", { bubbles: true, composed: true }));
      if (k === "full") { localStorage.setItem("quint_full", localStorage.getItem("quint_full") === "1" ? "0" : "1"); this._applyFull(); return this._draw(true); }
      if (k === "room") this._c.rooms[+v].on = this._c.rooms[+v].on === false;
      if (k === "hide") this._c.hide = this._c.hide.includes(v) ? this._c.hide.filter((x) => x !== v) : [...this._c.hide, v];
      if (k === "del") this._c.rooms.splice(+v, 1);
      if (k === "add") { const n = prompt("Room name"); if (n) this._c.rooms.push({ id: "r" + Date.now(), name: n }); }
      if (k === "import") return this._importRooms();
      this._save(); this._draw(true);
    }
  }
  _change(e) {
    const t = e.target, d = t.dataset, adm = this._admin();
    if (d.slider) { const [dom, srv, key, div] = d.slider.split("|"); this._h.callService(dom, srv, { entity_id: d.e, [key]: +t.value / +div }); }
    if (adm && d.rname !== undefined) { this._c.rooms[+d.rname].name = t.value; this._save(); }
    if (adm && d.map) { this._c.map[d.map] = t.value; this._save(); }
    if (d.sel) { const [dom, srv, key] = d.sel.split("|"); this._h.callService(dom, srv, { entity_id: d.e, [key]: t.value }); }
    if (adm && d.dd && this._dlg) { this._dlg[d.dd] = t.value; if (d.dd === "dom") this.shadowRoot.getElementById("cc-list").innerHTML = this._opts(t.value); }
    if (adm && d.uname !== undefined) { this._c.name = t.value; this._save(); this._draw(true); }
  }

  /* ---------- cards ---------- */
  _card(id) {
    const s = this._h.states[id], d = id.split(".")[0], a = s.attributes, n = this._nm(id), on = this._isOn(id);
    const sv = SV[this._svcOf(id)];
    const hd = (st) => `<div class="row"><div class="bdg" style="--c:${sv.c}">${sv.i}</div><div class="grow"><div class="nm">${n}</div><div class="st">${st}</div></div>`;
    const tg = (o) => `<button class="sw ${o ? "on" : ""}" data-act="${d === "media_player" ? "media_player.toggle" : d + ".toggle"}" data-e="${id}"></button>`;
    const bt = (act, label, x) => `<button data-act="${act}" data-e="${id}" ${x ? `data-x='${x}'` : ""}>${label}</button>`;
    if (d === "light") {
      const b = a.brightness || 0, dim = !(a.supported_color_modes || []).every((m) => m === "onoff");
      return `<div class="card ${s.state === "on" ? "on" : ""}">${hd(s.state === "on" ? Math.round(b / 2.55) + "%" : "Off")}${tg(s.state === "on")}</div>${dim && s.state !== "unavailable" ? `<input type=range min=1 max=255 value=${b} data-slider="light|turn_on|brightness_pct|2.55" data-e="${id}">` : ""}</div>`.replace("brightness_pct|2.55", "brightness|1");
    }
    if (d === "cover") return `<div class="card ${on && s.state !== "closed" ? "on" : ""}">${hd(s.state + (a.current_position != null ? " · " + a.current_position + "%" : ""))}</div><div class="btns">${bt("cover.open_cover", "▲ Open")}${bt("cover.stop_cover", "■")}${bt("cover.close_cover", "▼ Close")}</div></div>`;
    if (d === "climate") {
      const t = a.temperature || 22;
      return `<div class="card ${on ? "on" : ""}">${hd(`${s.state} · now ${a.current_temperature ?? "–"}°`)}<div class="big">${t}°</div></div><div class="btns">${bt("climate.set_temperature", "−", `{"temperature":${t - 0.5}}`)}${bt("climate.set_temperature", "+", `{"temperature":${t + 0.5}}`)}${bt(on ? "climate.turn_off" : "climate.turn_on", on ? "Off" : "On")}</div></div>`;
    }
    if (d === "media_player") {
      const v = Math.round((a.volume_level || 0) * 100);
      return `<div class="card ${on ? "on" : ""}">${hd(s.state + (a.media_title ? " · " + a.media_title : ""))}${tg(on)}</div><div class="btns">${bt("media_player.media_previous_track", "⏮")}${bt("media_player.media_play_pause", "⏯")}${bt("media_player.media_next_track", "⏭")}</div><input type=range min=0 max=100 value=${v} data-slider="media_player|volume_set|volume_level|100" data-e="${id}"></div>`;
    }
    if (d === "camera") {
      const off = ["unavailable", "unknown"].includes(s.state);
      const src = a.entity_picture ? this._h.hassUrl(a.entity_picture) : "";
      return `<div class="card">${hd(`<span class="dot ${off ? "" : "ok"}"></span>${off ? "Offline" : "Online"}`)}</div>${off || !src ? "" : `<img class="cam" data-src="${src}" src="${src}">`}</div>`;
    }
    if (d === "lock") { const l = s.state === "locked"; return `<div class="card ${l ? "" : "on"}">${hd(l ? "🔒 Locked" : "🔓 " + s.state)}</div><div class="btns">${bt("lock.lock", "Lock")}${bt("lock.unlock", "Unlock")}</div></div>`; }
    if (d === "binary_sensor") { const o = s.state === "on"; return `<div class="card ${o ? "on" : ""}">${hd(o ? "Open / Active" : "Closed / Clear")}</div></div>`; }
    if (d === "alarm_control_panel") return this._gen({ entity: id, style: "x" });
    return `<div class="card">${hd(s.state)}</div></div>`;
  }

  /* ---------- custom cards ---------- */
  _uid() { return Math.random().toString(36).slice(2, 9); }
  _sort(ctx, arr, key) {
    const o = this._c.order && this._c.order[ctx]; if (!o) return arr;
    const r = (x) => { const i = o.indexOf(key(x)); return i < 0 ? 1e6 : i; };
    return arr.map((x, i) => [x, i]).sort((p, q) => r(p[0]) - r(q[0]) || p[1] - q[1]).map((x) => x[0]);
  }
  _kw(k, html) { return `<div class="kw" data-k="${k}">${html}</div>`; }
  _cardsOf(ids, ctx) { return this._sort(ctx, ids, (i) => "e:" + i).map((i) => this._kw("e:" + i, this._card(i))).join(""); }
  _customCards(rid, ctx) {
    const items = (this._c.custom[rid] || []).map((it, i) => ({ it, i }));
    return this._sort(ctx, items, (x) => "c:" + x.it.uid).map(({ it, i }) => {
      const rm = this._admin() ? `<button class="rm" data-cc="del:${rid}:${i}">✕</button>` : "", k = "c:" + it.uid;
      return it.type === "lovelace" ? `<div class="cw lvw" data-k="${k}"><div data-lv="${rid}:${i}"></div>${rm}</div>` : `<div class="cw" data-k="${k}">${this._gen(it)}${rm}</div>`;
    }).join("");
  }
  _gen(it) {
    const id = it.entity, s = this._h.states[id], st = it.style || "auto";
    if (!s) return `<div class="card"><div class="nm">${it.name || id}</div><div class="st">Entity not found</div></div>`;
    if (st === "auto" && this._svcOf(id)) return this._card(id);
    const d = id.split(".")[0], a = s.attributes, n = it.name || a.friendly_name || id, on = !OFF.includes(s.state);
    const hd = (t) => `<div class="row"><div class="bdg" style="--c:${SV.more.c}">${ICONS[it.icon] || SV.more.i}</div><div class="grow"><div class="nm">${n}</div><div class="st">${t}</div></div>`;
    const b = (act, l) => `<button data-act="${act}" data-e="${id}">${l}</button>`;
    const tog = `<button class="sw ${on ? "on" : ""}" data-act="homeassistant.toggle" data-e="${id}"></button>`;
    const val = `${s.state} ${a.unit_of_measurement || ""}`;
    const sl = (dom, srv, key, min, max, step, v) => `<input type=range min=${min} max=${max} step=${step} value=${v} data-slider="${dom}|${srv}|${key}|1" data-e="${id}">`;
    const C = (o) => `<div class="card ${o ? "on" : ""}">`;
    if (st === "value") return `${C(on)}${hd(d.replace("_", " "))}<div class="nm">${val}</div></div></div>`;
    if (st === "toggle") return `${C(on)}${hd(s.state)}${tog}</div></div>`;
    if (st === "button") return `${C(0)}${hd("Tap to run")}</div><div class="btns">${b("homeassistant.turn_on", "▶ Run")}</div></div>`;
    if (["scene", "script", "button", "input_button"].includes(d)) return `${C(0)}${hd("Tap to run")}</div><div class="btns">${b(d === "button" || d === "input_button" ? d + ".press" : d + ".turn_on", "▶ Run")}</div></div>`;
    if (d === "vacuum") return `${C(on)}${hd(s.state + (a.battery_level != null ? " · " + a.battery_level + "%" : ""))}</div><div class="btns">${b("vacuum.start", "▶")}${b("vacuum.pause", "❚❚")}${b("vacuum.return_to_base", "⌂")}</div></div>`;
    if (d === "lawn_mower") return `${C(on)}${hd(s.state)}</div><div class="btns">${b("lawn_mower.start_mowing", "▶")}${b("lawn_mower.pause", "❚❚")}${b("lawn_mower.dock", "⌂")}</div></div>`;
    if (d === "fan") { const p = a.percentage; return `${C(on)}${hd(on ? (p != null ? p + "%" : "On") : "Off")}${tog}</div>${p != null ? sl("fan", "set_percentage", "percentage", 0, 100, a.percentage_step || 1, p) : ""}</div>`; }
    if (d === "humidifier") return `${C(on)}${hd((on ? "On" : "Off") + " · now " + (a.current_humidity ?? "–") + "%")}${tog}</div>${sl("humidifier", "set_humidity", "humidity", a.min_humidity || 0, a.max_humidity || 100, 1, a.humidity || 0)}</div>`;
    if (d === "number" || d === "input_number") return `${C(0)}${hd(val)}</div>${sl(d, "set_value", "value", a.min ?? 0, a.max ?? 100, a.step ?? 1, +s.state || 0)}</div>`;
    if (d === "select" || d === "input_select") return `${C(0)}${hd(d.replace("_", " "))}</div><select data-sel="${d}|select_option|option" data-e="${id}" style="margin-top:12px">${(a.options || []).map((o) => `<option ${o === s.state ? "selected" : ""}>${o}</option>`).join("")}</select></div>`;
    if (d === "water_heater") { const t = a.temperature || 50; return `${C(on)}${hd(s.state + " · now " + (a.current_temperature ?? "–") + "°")}<div class="nm">${t}°</div></div><div class="btns">${b2("water_heater.set_temperature", "−", t - 1)}${b2("water_heater.set_temperature", "+", t + 1)}</div></div>`; }
    if (d === "alarm_control_panel") return `${C(s.state !== "disarmed")}${hd(s.state.replace(/_/g, " "))}</div><div class="btns">${b("alarm_control_panel.alarm_disarm", "Disarm")}${b("alarm_control_panel.alarm_arm_home", "Home")}${b("alarm_control_panel.alarm_arm_away", "Away")}</div></div>`;
    if (d === "weather") return `${C(1)}${hd(s.state)}<div class="nm">${a.temperature ?? "–"}${a.temperature_unit || "°"}</div></div></div>`;
    if (["switch", "input_boolean", "automation", "valve", "siren", "remote", "group"].includes(d)) return `${C(on)}${hd(s.state)}${tog}</div></div>`;
    return `${C(s.state === "on")}${hd(d.replace(/_/g, " "))}<div class="nm">${val}</div></div></div>`;
    function b2(act, l, v) { return `<button data-act="${act}" data-e="${id}" data-x='{"temperature":${v}}'>${l}</button>`; }
  }
  _opts(dom) {
    return Object.keys(this._h.states).filter((i) => !dom || i.startsWith(dom + ".")).sort().map((i) => `<option value="${i}">${this._h.states[i].attributes.friendly_name || ""}</option>`).join("");
  }
  _dialog() {
    if (!this._dlg || !this._admin()) return "";
    const D = this._dlg, r = this._c.rooms.find((x) => x.id === D.room) || { name: D.room }, doms = {};
    Object.keys(this._h.states).forEach((i) => { const k = i.split(".")[0]; doms[k] = (doms[k] || 0) + 1; });
    const sel = (key, list) => `<select data-dd="${key}">${list.map(([v, l]) => `<option value="${v}" ${(D[key] || "") === v ? "selected" : ""}>${l}</option>`).join("")}</select>`;
    const L = (t) => `<div class="lbl" style="margin:12px 0 4px">${t}</div>`;
    return `<div class="ov"><div class="dlg"><h1 style="font-size:22px">Add card · ${r.name}</h1>
      ${L("Device type")}${sel("dom", [["", "All device types (" + Object.keys(this._h.states).length + ")"], ...Object.keys(doms).sort().map((k) => [k, k.replace(/_/g, " ") + " (" + doms[k] + ")"])])}
      ${L("Entity")}<input type="text" id="cc-ent" list="cc-list" placeholder="Start typing a name or entity id"><datalist id="cc-list">${this._opts(D.dom || "")}</datalist>
      ${L("Display name (optional)")}<input type="text" id="cc-name">
      ${L("Card style")}${sel("style", [["auto", "Auto – best control for this device"], ["toggle", "On / Off switch"], ["button", "Run button"], ["value", "Value / status only"]])}
      ${L("Icon")}${sel("icon", [["", "Default"], ...Object.keys(ICONS).map((k) => [k, k])])}
      ${L("…or paste any Lovelace card as JSON (custom cards supported)")}<textarea id="cc-json" placeholder='{"type":"custom:mushroom-light-card","entity":"light.x"}'></textarea>
      <div class="err" id="cc-err"></div><div class="btns"><button data-cc="cancel">Cancel</button><button class="pri" data-cc="save">Add card</button></div></div></div>`;
  }
  _saveCC() {
    const q = (i) => this.shadowRoot.getElementById(i), err = (t) => { q("cc-err").textContent = t; };
    const ent = q("cc-ent").value.trim(), name = q("cc-name").value.trim(), js = q("cc-json").value.trim(), D = this._dlg;
    let item;
    if (js) { try { const c = JSON.parse(js); if (!c.type) throw new Error('"type" is missing'); item = { type: "lovelace", config: c }; } catch (e) { return err("Invalid JSON: " + e.message); } }
    else if (ent && this._h.states[ent]) item = { type: "entity", entity: ent, name, style: D.style || "auto", icon: D.icon || "" };
    else return err("Pick a valid entity or paste card JSON");
    item.uid = this._uid();
    (this._c.custom[D.room] = this._c.custom[D.room] || []).push(item);
    this._save(); this._dlg = null; this._v = { p: "room", room: D.room, svc: "more" }; this._draw(true);
  }
  async _mountLv() {
    const ph = this.shadowRoot.querySelectorAll("[data-lv]"); if (!ph.length) return;
    this._lvc = this._lvc || {};
    for (const p of ph) {
      const [r, i] = p.dataset.lv.split(":"), it = (this._c.custom[r] || [])[+i]; if (!it) continue;
      const k = JSON.stringify(it.config); let el = this._lvc[k];
      if (!el) { try { const hp = await window.loadCardHelpers(); el = await hp.createCardElement(it.config); } catch (e) { el = document.createElement("div"); el.textContent = "Card error: " + e.message; } this._lvc[k] = el; }
      el.hass = this._h; if (el.parentNode !== p) p.appendChild(el);
    }
  }

  /* ---------- pages ---------- */
  _home() {
    const h = new Date().getHours(), g = h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
    const who = this._c.name || (this._h.user && this._h.user.name) || "";
    const L = this._svcs();
    const pill = (k) => { const t = this._stats(k); return `<span class="pill" style="--c:${SV[k].c}">${SV[k].i}${t.big} ${t.lbl}</span>`; };
    return `<section class="hero"><div><div class="clk">@@T@@</div><div class="sub">${new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })}</div></div>
    <div><h1>${g}${who ? ", " + who : ""}</h1><div class="pills">${["lights", "climate", "security"].filter((k) => L.includes(k)).map(pill).join("")}</div></div></section>
    <div class="grid">${L.map((k) => { const t = this._stats(k); return `<div class="tile ${t.on ? "on" : ""}" style="--c:${SV[k].c}" ${this._tileGo(k)}><div class="bdg">${SV[k].i}</div><div><div class="num">${t.big}</div><div class="nm">${SV[k].n}</div><div class="lbl">${t.lbl}</div></div></div>`; }).join("") || '<div class="card">No supported devices found.</div>'}</div>`;
  }
  _roomsTiles() {
    const s = this._v.svc;
    return `<button class="back" data-go='{"p":"home"}'>‹ Home</button><h1>${SV[s].i} ${SV[s].n}</h1><div class="sub">Select a room</div><div class="grid">${this._rooms().map((r) => { const c = this._roomCount(s, r.id); if (!c || (s === "more" && !c.t && !this._admin())) return ""; return `<div class="tile ${c.n ? "on" : ""}" style="--c:${SV[s].c}" data-go='${JSON.stringify({ p: "room", room: r.id, svc: s })}'><div class="bdg">${SV[s].i}</div><div><div class="num">${c.n}<span class="lbl"> / ${c.t}</span></div><div class="nm">${r.name}</div></div></div>`; }).join("")}</div>`;
  }
  _roomsPage() {
    const s = this._v.svc;
    if (s === "more") return this._roomsTiles();
    const act = (i) => { const st = this._h.states[i].state; return s === "lights" ? st === "on" : s === "shades" ? ["open", "opening"].includes(st) : this._isOn(i); };
    const sec = (title, ids, rid) => {
      const on = ids.filter(act).length, all = ids.join(",");
      const btn = s === "lights" ? `<button data-act="light.turn_on" data-e="${all}">All on</button><button data-act="light.turn_off" data-e="${all}">All off</button>`
        : s === "shades" ? `<button data-act="cover.open_cover" data-e="${all}">Open all</button><button data-act="cover.close_cover" data-e="${all}">Close all</button>` : "";
      const go = rid ? `data-go='${JSON.stringify({ p: "room", room: rid, svc: s })}'` : "";
      return `<section><div class="rh"><div class="grow" ${go}><div class="rn">${title}</div><div class="lbl">${on} active of ${ids.length}</div></div><div class="btns rb">${btn}</div></div><div class="grid" data-grid="svc:${s}:${rid || "other"}">${this._cardsOf(ids, "svc:" + s + ":" + (rid || "other"))}</div></section>`;
    };
    const rs = this._rooms(), known = new Set(rs.map((r) => r.id));
    const parts = rs.map((r) => [r, this._ents(s, r.id)]).filter(([, e]) => e.length).map(([r, e]) => sec(r.name, e, r.id));
    const other = this._ents(s).filter((i) => !known.has(this._roomOf(i)));
    if (other.length) parts.push(sec("Other", other, ""));
    const total = this._ents(s).filter(act).length;
    return `<button class="back" data-go='{"p":"home"}'>‹ Home</button><h1>${SV[s].i} ${SV[s].n}</h1><div class="sub">${total} active · grouped by room</div>${parts.join("")}`;
  }
  _roomPage() {
    const rid = this._v.room, r = this._rooms().find((x) => x.id === rid) || { name: rid };
    const av = this._svcs().filter((s) => s === "more" ? (this._c.custom[rid] || []).length : this._ents(s, rid).length);
    const s = av.includes(this._v.svc) ? this._v.svc : av[0];
    return `<button class="back" data-go='${JSON.stringify({ p: "rooms", svc: this._v.svc })}'>‹ Rooms</button><h1>${r.name}</h1>
    <div class="tabs">${av.map((x) => `<button class="${x === s ? "act" : ""}" data-go='${JSON.stringify({ p: "room", room: rid, svc: x })}'>${SV[x].i} ${SV[x].n}</button>`).join("")}</div>
    <div class="grid" data-grid="room:${rid}:${s}">${s === "more" ? this._customCards(rid, "room:" + rid + ":more") : s ? this._cardsOf(this._ents(s, rid), "room:" + rid + ":" + s) : ""}${this._admin() ? `<div class="tile add" data-cc="open:${rid}"><div class="bdg" style="--c:#8d9ab8">＋</div><div class="nm">Add card</div></div>` : ""}</div>`;
  }
  _list(s) {
    return `<button class="back" data-go='{"p":"home"}'>‹ Home</button><h1>${SV[s].i} ${SV[s].n}</h1><div class="grid" data-grid="list:${s}" style="grid-template-columns:repeat(auto-fill,minmax(${s === "cameras" ? 320 : 200}px,1fr))">${this._cardsOf(this._ents(s), "list:" + s)}</div>`;
  }
  _settings() {
    const all = Object.keys(this._h.states).filter((i) => this._svcOf(i));
    return `<button class="back" data-go='{"p":"home"}'>‹ Home</button><h1>Settings</h1>
    <div class="card"><div class="nm">Greeting name</div><input type=text data-uname value="${this._c.name}" placeholder="${(this._h.user && this._h.user.name) || ""}"></div>
    <div class="card" style="margin-top:12px"><div class="row"><div class="grow"><div class="nm">Fullscreen</div><div class="st">Hide the Home Assistant sidebar on this device</div></div><button class="sw ${localStorage.getItem("quint_full") === "1" ? "on" : ""}" data-tog="full:0"></button></div></div>
    <h2>Rooms</h2><div class="card">${this._c.rooms.map((r, i) => `<div class="row" style="margin:6px 0"><input type=text data-rname="${i}" value="${r.name}"><button class="sw ${r.on !== false ? "on" : ""}" data-tog="room:${i}"></button><button class="ib" data-tog="del:${i}">✕</button></div>`).join("")}
    <div class="btns"><button data-tog="add:0">＋ Add room</button><button data-tog="import:0">Re-import from HA areas</button></div></div>
    <h2>Devices → room &amp; visibility</h2><div class="card"><table>${all.map((id) => `<tr><td>${SV[this._svcOf(id)].i} ${this._nm(id)}<div class="lbl">${id}</div></td><td><select data-map="${id}"><option value="">(none)</option>${this._c.rooms.map((r) => `<option value="${r.id}" ${this._roomOf(id) === r.id ? "selected" : ""}>${r.name}</option>`).join("")}</select></td><td><button class="sw ${this._c.hide.includes(id) ? "" : "on"}" data-tog="hide:${id}"></button></td></tr>`).join("")}</table></div>`;
  }

  /* ---------- render ---------- */
  _draw(force) {
    if (!this._h || !this._loaded || this._mv || this._hold) return;
    const ae = this.shadowRoot.activeElement;
    if (!force && (this._drag || (ae && ["INPUT", "SELECT"].includes(ae.tagName)))) return;
    if (this._v.p === "settings" && !this._admin()) this._v = { p: "home" };
    const p = this._v.p, V = this._v;
    const body = p === "home" ? this._home() : p === "rooms" ? this._roomsPage() : p === "room" ? this._roomPage() : p === "cameras" ? this._list("cameras") : p === "security" ? this._list("security") : this._settings();
    const nav = `<button class="${p === "home" ? "act" : ""}" data-go='{"p":"home"}'>${HOME_I}Home</button>` + this._svcs().map((s) => `<button style="--c:${SV[s].c}" class="${V.svc === s || p === s ? "act" : ""}" ${this._tileGo(s)}>${SV[s].i}${SV[s].n}</button>`).join("");
    const sy = this.scrollTop;
    const vk = JSON.stringify(V), changed = this._vk !== vk;
    const html = `<div class="app"><header><div class="brand">${this._narrow || localStorage.getItem("quint_full") === "1" ? `<button class="ib" data-tog="menu:0">☰</button>` : ""}${LOGO_I}${this._title || "Quint"}</div><div class="hb"><span class="tm">@@T@@</span>${this._admin() ? `<button class="ib" data-go='{"p":"settings"}'>${GEAR_I}</button>` : ""}</div></header><main class="${changed ? "anim" : ""}">${body}</main><nav>${nav}</nav></div>${this._dialog()}`;
    if (html === this._last) { Object.values(this._lvc || {}).forEach((e) => (e.hass = this._h)); return; }
    this._last = html; this._vk = vk;
    const tpl = document.createElement("template");
    tpl.innerHTML = html.replaceAll("@@T@@", this._time());
    this._morph(this._root, tpl.content);
    this.scrollTop = changed ? 0 : sy;
    this._mountLv();
  }
}
customElements.define("quint-panel", QuintDashboard);
console.info("%c QUINT %c panel loaded", "background:#f5a623;color:#000", "");
