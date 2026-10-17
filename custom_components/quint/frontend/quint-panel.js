/* Quint Dashboard – Savant-style full-page dashboard for Home Assistant (HACS plugin) */
const ic = (p) => `<svg class="si" viewBox="0 0 24 24">${p}</svg>`;
const SV = {
  security:{ n: "Security", c: "#34c98b", i: ic('<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>') },
  cameras: { n: "Cameras",  c: "#4aa3ff", i: ic('<path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2"/>') },
  lights:  { n: "Lighting", c: "#f5a623", i: ic('<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.7.7 1 1.5 1 2.5h6c0-1 .3-1.8 1-2.5A6 6 0 0 0 12 3z"/>') },
  climate: { n: "Climate",  c: "#ff7a59", i: ic('<path d="M14 14.8V5a2 2 0 0 0-4 0v9.8a4 4 0 1 0 4 0z"/>') },
  media:   { n: "Media",    c: "#b388ff", i: ic('<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>') },
  shades:  { n: "Shades",   c: "#2dd4bf", i: ic('<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 8h18M3 13h18M12 13v6"/>') },
  more:    { n: "More",     c: "#ff6fae", i: ic('<circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/>') },
};
const SV_DEF = Object.fromEntries(Object.entries(SV).map(([k, v]) => [k, v.n]));
const HOME_I = ic('<path d="M3 11l9-8 9 8v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/>');
const GEAR_I = ic('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>');
const SHIELD_I = ic('<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/>');
const SUN_I = ic('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>');
const MOON_I = ic('<path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z"/>');
const CLOUD_I = ic('<path d="M18 18H7a4 4 0 1 1 .9-7.9A6 6 0 0 1 19 11a3.5 3.5 0 0 1-1 7z"/>');
const MUSIC_I = ic('<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>');
const PREV_I = ic('<path d="M19 20L9 12l10-8z"/><path d="M5 19V5"/>');
const NEXT_I = ic('<path d="M5 4l10 8-10 8z"/><path d="M19 5v14"/>');
const PLAY_I = ic('<path d="M7 4l13 8-13 8z" fill="currentColor"/>');
const PAUSE_I = ic('<path d="M8 5v14M16 5v14" stroke-width="3"/>');
const VOL_I = ic('<path d="M11 5L6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/>');
const WX = { "clear-night": "Clear night", cloudy: "Cloudy", exceptional: "Exceptional", fog: "Foggy", hail: "Hail", lightning: "Thunderstorm", "lightning-rainy": "Thunderstorm", partlycloudy: "Partly cloudy", pouring: "Heavy rain", rainy: "Rain", snowy: "Snow", "snowy-rainy": "Sleet", sunny: "Sunny", windy: "Windy", "windy-variant": "Windy" };
(() => {
  try {
    if (document.getElementById("quint-fonts")) return;
    const l = document.createElement("link"); l.id = "quint-fonts"; l.rel = "stylesheet";
    l.href = "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Inter:wght@300;400;500;600;700&display=swap";
    document.head.appendChild(l);
  } catch (e) {}
})();
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
const SET_I = {
  general: ic('<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>'),
  pages: ic('<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 17h7M17.5 14v7"/>'),
  rooms: ICONS.door, devices: ICONS.plug, home: ICONS.home,
  cards: ic('<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M12 8v8M8 12h8"/>'),
};
const SHADE_DC = ["shutter", "blind", "curtain", "shade", "awning", "window"];
const SEC_BS = ["door", "window", "opening", "garage_door", "lock", "occupancy", "motion", "tamper"];
const OFF = ["off", "unavailable", "unknown", "standby", "closed", "locked", "idle"];
const KEY = "quint_cfg";
const VER = "1.8.0";
const isCs = (s) => typeof s === "string" && (s === "more" || s.startsWith("cs:"));
const BG = {
  midnight: "radial-gradient(900px 560px at 88% -6%,rgba(176,122,74,.55),transparent),radial-gradient(760px 620px at -6% 92%,rgba(46,104,150,.50),transparent),linear-gradient(160deg,#17233a,#0c1220 55%,#0a0e18)",
  graphite: "linear-gradient(160deg,#15171c,#2b2f38)",
  aurora: "radial-gradient(900px 600px at 20% 0%,rgba(52,201,139,.30),transparent),radial-gradient(800px 600px at 90% 100%,rgba(179,136,255,.26),transparent),linear-gradient(160deg,#07121a,#10202c)",
  sunset: "radial-gradient(900px 600px at 80% 0%,rgba(255,122,89,.36),transparent),radial-gradient(800px 600px at 0% 100%,rgba(179,136,255,.26),transparent),linear-gradient(160deg,#1a0f1f,#2a1a2e)",
  ocean: "radial-gradient(900px 600px at 10% 0%,rgba(74,163,255,.38),transparent),linear-gradient(160deg,#04111f,#0a2540)",
  forest: "radial-gradient(900px 600px at 90% 0%,rgba(52,201,139,.30),transparent),linear-gradient(160deg,#07140f,#10261c)",
};
const SWATCH = {
  midnight: "linear-gradient(135deg,#2e6896,#0c1220 55%,#b07a4a)",
  graphite: "linear-gradient(135deg,#454b58,#15171c)",
  aurora: "linear-gradient(135deg,#34c98b,#07121a 58%,#b388ff)",
  sunset: "linear-gradient(135deg,#ff7a59,#2a1a2e 58%,#b388ff)",
  ocean: "linear-gradient(135deg,#4aa3ff,#04111f)",
  forest: "linear-gradient(135deg,#34c98b,#07140f)",
};
const FRESH = () => ({ rooms: [], map: {}, hide: [], name: "", custom: {}, order: {} });

const CSS = `
:host{display:block;--vh:100vh;height:var(--vh);overflow-y:auto;--ac:#e8c98f;--ok:#5fd39a;--warn:#f0b35a;--bad:#ff6b6b;--mu:#9aa6bd;--tx:#eef1f6;--bd:rgba(255,255,255,.10);--cd:rgba(12,16,26,.55);--serif:"Cormorant Garamond","Quint Serif",Georgia,"Times New Roman",serif;color:var(--tx);font-family:"Inter","Quint Sans",-apple-system,"SF Pro Display","Segoe UI",Roboto,sans-serif}
@supports (height:100dvh){:host{--vh:100dvh}}
*{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
.si{width:1em;height:1em;stroke:currentColor;fill:none;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round;vertical-align:-.12em}
.app{flex:1 0 auto;display:flex;flex-direction:column;position:relative;z-index:1}
#r{position:relative;display:flex;flex-direction:column;min-height:100%}
.bgl{flex:none;position:sticky;top:0;height:var(--vh,100vh);margin-bottom:calc(var(--vh,100vh) * -1);overflow:hidden;pointer-events:none;z-index:0;background:#0b1220}
.bgl i{position:absolute;inset:-30px;background-image:var(--qbg-img,none);background-size:cover;background-position:center;filter:blur(var(--qbg-blur,0px))}
.bgl::after{content:"";position:absolute;inset:0;background:rgba(5,8,16,var(--qbg-dim,0))}
button{font:inherit;color:inherit;cursor:pointer}
main{flex:1;display:flex;flex-direction:column;min-width:0}
.serif{font-family:var(--serif)}
.brand{display:flex;align-items:center;gap:12px;font-size:19px;letter-spacing:7px;font-weight:500;text-transform:uppercase;min-height:34px}
.ib{background:rgba(255,255,255,.07);border:1px solid var(--bd);border-radius:50%;width:38px;height:38px;font-size:18px;display:grid;place-items:center;padding:0;flex:none;letter-spacing:0}
.top{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:18px}
.page{padding:34px 44px 30px;max-width:1500px;width:100%;margin:0 auto;flex:1}
h1{font-family:var(--serif);font-weight:400;font-size:46px;line-height:1.05;margin:6px 0 8px}
.page>h1,.page>.top+h1{margin-bottom:14px}
h2{font-weight:600;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:var(--mu);margin:30px 0 12px}
.sub{color:var(--mu);font-size:15px;margin-top:4px}.lbl{color:var(--mu);font-size:13px}
.cap{font-size:11px;letter-spacing:2.5px;text-transform:uppercase;font-weight:600;color:#a9b4c9;margin-bottom:12px}
.back{background:rgba(255,255,255,.07);border:1px solid var(--bd);border-radius:10px;color:#fff;padding:9px 16px;font-size:14px}
/* ===== home ===== */
.home{display:grid;grid-template-columns:minmax(0,1fr);gap:24px;padding:26px 18px 22px;flex:1;align-content:start}
.hl{display:flex;flex-direction:column;min-width:0}
.hr{min-width:0;display:flex;flex-direction:column}
.clk{font-family:var(--serif);font-size:84px;font-weight:400;line-height:.95;margin-top:26px;letter-spacing:-1px;white-space:nowrap}
.dt{font-size:16px;color:#d3d9e6;margin-top:8px}
.wx{display:flex;align-items:center;gap:10px;margin-top:16px;color:#d3d9e6;font-size:15px}.wx .si{font-size:20px;color:var(--ac);flex:none}
.gr{font-family:var(--serif);font-style:italic;font-size:34px;margin-top:26px;font-weight:400;line-height:1.1}
.scn{margin-top:26px}
.scg{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
.scb{display:flex;align-items:center;gap:10px;text-align:left;padding:14px 14px;border-radius:8px;border:1px solid rgba(120,160,220,.22);background:rgba(28,52,90,.50);font-size:14px;font-weight:500;min-width:0;transition:background .15s}
.scb i{width:8px;height:8px;border-radius:50%;border:1.5px solid #cfd8ea;flex:none}
.scb span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.scb.on{background:#f1efec;color:#12151c;border-color:#f1efec}.scb.on i{background:#12151c;border-color:#12151c}
.scb:active{transform:scale(.98)}
.bento{display:grid;grid-template-columns:minmax(0,1fr);gap:16px;align-content:start}
.bc{background:var(--cd);border:1px solid var(--bd);border-radius:20px;padding:20px 22px 20px;position:relative;min-width:0;display:flex;flex-direction:column}
.bc.wide{grid-column:1/-1}
.bh{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:14px;font-size:11px;letter-spacing:2px;text-transform:uppercase;font-weight:600;color:#aeb8cc;cursor:pointer}
.bh .bs{letter-spacing:0;text-transform:none;font-weight:500;font-size:13px;color:#c3cbdb;display:flex;align-items:center;gap:6px}.bh .si{font-size:17px}
.rw{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:5px 0;font-size:15px;min-height:36px}
.rw .nmx{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#dde2ec}
.rw .rr{display:flex;align-items:center;gap:14px;flex:none}.rw .mu{color:#b7c0d1;font-size:14px}
.rw .v{font-weight:600;color:#fff;text-align:right}.rw .v.w{color:var(--warn)}.rw .v.b{color:var(--bad)}
.st2{font-family:var(--serif);font-size:34px;display:flex;align-items:center;gap:12px;margin:0 0 12px;line-height:1.1}
.sd{width:14px;height:14px;border-radius:50%;background:var(--ok);box-shadow:0 0 0 4px rgba(95,211,154,.18);flex:none}.sd.w{background:var(--warn);box-shadow:0 0 0 4px rgba(240,179,90,.2)}.sd.b{background:var(--bad);box-shadow:0 0 0 4px rgba(255,107,107,.22)}
.seg{display:flex;background:rgba(0,0,0,.30);border:1px solid var(--bd);border-radius:12px;padding:4px;margin-top:auto}
.seg button{flex:1;padding:11px 0;border:0;background:none;border-radius:9px;font-weight:600;font-size:14px;color:#dfe4ee}
.seg button.on{background:#f1efec;color:#12151c}
.bc>.rows{margin-bottom:12px}
.cvw{position:relative;border-radius:14px;overflow:hidden;aspect-ratio:16/9;background:linear-gradient(135deg,#2b2016,#14100c);cursor:pointer;display:grid;place-items:center;color:#8b7d6c}
.cvw img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.cvw .cn{position:absolute;left:12px;top:10px;font-size:12px;font-weight:600;text-shadow:0 1px 4px #000a;z-index:1}
.cvw .live{position:absolute;right:12px;top:10px;z-index:1;text-shadow:0 1px 4px #000a}
.live{display:inline-flex;gap:6px;align-items:center;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase}.live::before{content:"";width:7px;height:7px;border-radius:50%;background:#ff5d5d}
.cb{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:10px}
.wb,.ob{padding:13px 10px;border-radius:9px;font-weight:600;font-size:14px;border:1px solid rgba(255,255,255,.28);background:none;color:#fff}.wb{background:#f1efec;color:#12151c;border-color:#f1efec}
.cl{display:flex;align-items:flex-end;justify-content:space-between;gap:12px;margin-top:auto;padding-top:10px}
.sbig{font-family:var(--serif);font-size:68px;line-height:.9;font-weight:400}.sbig sup{font-size:.5em;vertical-align:.75em;margin-left:2px}
.cap2{font-size:13px;color:#c3cbdb;margin-top:8px}
.rb2{width:46px;height:46px;border-radius:50%;border:1px solid rgba(255,255,255,.3);background:none;font-size:22px;line-height:1;padding:0;display:grid;place-items:center;flex:none}.rb2:active{background:var(--ac);color:#000}
.rbs{display:flex;gap:12px}
.md{display:flex;align-items:center;gap:20px;flex-wrap:wrap}
.art{width:68px;height:68px;border-radius:9px;background:rgba(255,255,255,.1);display:grid;place-items:center;font-size:28px;color:var(--ac);flex:none;overflow:hidden}.art img{width:100%;height:100%;object-fit:cover}
.mt{flex:1 1 200px;min-width:0}.mt .pc{font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#aeb8cc;font-weight:600}
.mt .tt{font-family:var(--serif);font-size:30px;line-height:1.1;margin-top:5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.mt .ar{color:#b7c0d1;font-size:14px;margin-top:2px}
.mc{display:flex;align-items:center;gap:14px}.mc button{background:none;border:0;padding:6px;font-size:22px;color:#e6eaf2;display:grid;place-items:center}
.mc button.pp{width:54px;height:54px;border-radius:50%;background:#f1efec;color:#12151c;padding:0;font-size:22px}
.vol{display:flex;align-items:center;gap:10px;flex:1 1 150px;min-width:130px;color:#b7c0d1;font-size:16px}
.shv{width:62px;height:70px;border:1px solid rgba(255,255,255,.35);border-radius:6px;overflow:hidden;flex:none;background:rgba(255,255,255,.04)}
.shv i{display:block;background:repeating-linear-gradient(#8f8f93 0 4px,#4f5157 4px 7px);transition:height .3s}
.bigs{font-family:var(--serif);font-size:48px;line-height:1;font-weight:400}.bigs small{display:block;font-family:inherit;font-size:14px;color:#c3cbdb;margin-top:6px}
.cen{display:flex;align-items:flex-start;gap:18px}
.btn3{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:auto;padding-top:14px}
.btn3 button{padding:12px 6px;border-radius:8px;border:1px solid rgba(255,255,255,.28);background:none;font-size:14px;font-weight:500}.btn3 button:active{background:var(--ac);color:#000}
.cnt{font-family:var(--serif);font-size:56px;line-height:1}
/* ===== common cards (service pages / custom cards) ===== */
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:16px}
.tile,.card{position:relative;background:var(--cd);border:1px solid var(--bd);border-radius:18px;padding:18px}
.tile{cursor:pointer;min-height:120px;display:flex;flex-direction:column;justify-content:space-between}
.tile:active{transform:scale(.98)}
.bdg{width:46px;height:46px;border-radius:50%;display:grid;place-items:center;font-size:22px;flex:none;background:color-mix(in srgb,var(--c) 16%,transparent);color:var(--c);transition:.2s}
.card.on .bdg{background:var(--c);color:#10131c}
.num{font-size:38px;font-weight:300;line-height:1.05}.nm{font-weight:500;font-size:16px}
.card.on{border-color:rgba(232,201,143,.38)}
.row{display:flex;align-items:center;gap:14px}.grow{flex:1;min-width:0}
.st{color:var(--mu);font-size:13px;margin-top:2px;text-transform:capitalize}
.btns{display:flex;gap:8px;margin-top:14px}
.btns button{flex:1;background:rgba(255,255,255,.09);border:0;border-radius:12px;padding:11px;min-width:44px;transition:.15s}
.btns button:active{background:var(--ac);color:#000}
input[type=range]{-webkit-appearance:none;appearance:none;width:100%;height:20px;background:transparent;margin:0;outline:0}
input[type=range]::-webkit-slider-runnable-track{height:4px;border-radius:2px;background:rgba(255,255,255,.2)}
input[type=range]::-moz-range-track{height:4px;border-radius:2px;background:rgba(255,255,255,.2)}
input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:20px;height:20px;margin-top:-8px;border-radius:50%;background:var(--ac);border:2px solid #14110c;box-shadow:0 1px 6px #0008}
input[type=range]::-moz-range-thumb{width:16px;height:16px;border-radius:50%;background:var(--ac);border:2px solid #14110c}
.card input[type=range]{margin-top:14px}
.sw{width:46px;height:28px;border-radius:14px;background:#4b505b;position:relative;border:0;flex:none;transition:.2s;padding:0}
.sw::after{content:"";position:absolute;top:3px;left:3px;width:22px;height:22px;border-radius:50%;background:#d7dae1;transition:.2s}
.sw.on{background:var(--ac)}.sw.on::after{left:21px;background:#15120d}
.big{font-size:44px;font-weight:200;margin-top:10px}
img.cam{width:100%;border-radius:14px;margin-top:12px;background:#000;aspect-ratio:16/9;object-fit:cover;cursor:pointer}
.cvw img.cam{margin:0;border-radius:0;aspect-ratio:auto}
.tabs{display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap}.tabs button{display:flex;gap:7px;align-items:center;background:rgba(255,255,255,.07);border:1px solid var(--bd);border-radius:10px;padding:9px 18px}.tabs button.act{background:#f1efec;color:#12151c;border-color:#f1efec}
input[type=text],select{width:100%;background:rgba(0,0,0,.3);border:1px solid var(--bd);color:#eef2fa;border-radius:10px;padding:11px;font:inherit}
table{width:100%;border-collapse:collapse;font-size:14px}td{padding:8px 6px;border-bottom:1px solid var(--bd)}
.dot{display:inline-block;width:9px;height:9px;border-radius:50%;background:var(--bad);margin-right:6px}.dot.ok{background:var(--ok)}
.cw{position:relative}.rm{position:absolute;top:8px;right:8px;width:26px;height:26px;border-radius:50%;border:0;background:rgba(0,0,0,.45);color:#fff;font-size:12px;opacity:.55;z-index:2}.rm:hover{opacity:1;background:var(--bad)}
.tile.add{min-height:96px;border-style:dashed;background:transparent;opacity:.85;align-items:flex-start}.lvw{grid-column:span 2}
.ov{position:fixed;inset:0;background:rgba(5,8,16,.7);display:grid;place-items:center;z-index:99;padding:16px}
.dlg{width:min(520px,100%);background:#141c2e;border:1px solid var(--bd);border-radius:24px;padding:24px;max-height:90vh;overflow:auto}.dlg input{margin-top:4px}
textarea{width:100%;min-height:96px;background:rgba(0,0,0,.3);border:1px solid var(--bd);color:#eef2fa;border-radius:10px;padding:11px;font:13px monospace;margin-top:4px}
.err{color:var(--bad);font-size:13px;min-height:18px;margin-top:6px}.pri{background:var(--ac)!important;color:#000!important;font-weight:600}
.rh{display:flex;align-items:center;gap:12px;margin:26px 0 12px}.rh .grow{cursor:pointer}.rn{font-family:var(--serif);font-size:30px;font-weight:400}.rb{margin:0}.rb button{flex:none;padding:8px 14px;font-size:13px}
.kw{position:relative}.kw,.cw{border-radius:18px;-webkit-touch-callout:none;-webkit-user-select:none;user-select:none}
.holding{animation:hold 5s linear forwards}@keyframes hold{from{box-shadow:0 0 0 0 transparent}to{box-shadow:0 0 0 5px var(--ac)}}
.moving{transform:scale(1.04);box-shadow:0 20px 50px -10px #000c,0 0 0 3px var(--ac);z-index:5;opacity:.93;transition:transform .15s}
.hint{position:fixed;left:50%;bottom:96px;transform:translateX(-50%);background:var(--ac);color:#000;padding:10px 18px;border-radius:24px;font-weight:600;z-index:130;white-space:nowrap}
ha-icon{--mdc-icon-size:24px;display:inline-flex}.tpl{cursor:pointer;min-height:96px}.tv{font-size:30px;font-weight:300;line-height:1.15;margin:4px 0 2px;word-break:break-word}
/* ===== rooms page ===== */
.area{display:grid;grid-template-columns:minmax(0,1fr);gap:18px;padding:22px 16px 20px;flex:1;align-content:start}
.rl{display:flex;flex-direction:column;min-width:0}
.rlist{display:flex;gap:8px;overflow-x:auto;padding-bottom:4px;scrollbar-width:none}
.rli{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:11px 14px;border-radius:10px;background:rgba(255,255,255,.06);border:1px solid var(--bd);color:#e3e7ef;font-size:15px;text-align:left;flex:none;white-space:nowrap}
.rli.act{background:rgba(255,255,255,.16);border-color:rgba(255,255,255,.18)}
.rli small{color:var(--ac);font-weight:600;font-size:13px}.rli small.off{color:var(--mu)}
.rl .ft{display:none;margin-top:auto;padding-top:20px;color:#b9c2d3;font-size:13px}
.ah{display:flex;justify-content:space-between;align-items:flex-start;gap:16px}
.ah h1{font-size:46px;margin:0}
.ob2{padding:11px 20px;border-radius:8px;border:1px solid rgba(255,255,255,.32);background:none;font-weight:600;font-size:14px;flex:none}
.chips{display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:10px;margin:16px 0}
.abody{display:grid;grid-template-columns:minmax(0,1fr);gap:16px;align-items:start}
.lr{display:grid;grid-template-columns:minmax(70px,30%) minmax(0,1fr) 52px;align-items:center;gap:14px;padding:13px 0;border-top:1px solid var(--bd)}.lr:first-of-type{border-top:0}
.lr .ln{background:none;border:0;text-align:left;padding:0;font-size:15px;font-weight:500;color:#e6eaf2;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.lr .lp{text-align:right;font-size:14px;color:#c3cbdb}
.bc .grid{grid-template-columns:repeat(auto-fill,minmax(230px,1fr))}.bc .card{background:rgba(255,255,255,.05)}
.span2{grid-column:1/-1}
.tall{grid-row:span 2}
:host([data-dev="phone"]) .tall{grid-row:auto}
/* ===== bottom bar ===== */
.rl .rcap{margin:18px 0 10px}
:host([data-wide="1"]) .rl .rcap{margin:40px 0 12px}
:host([data-wide="1"]) .cr{display:block}
:host([data-wide="1"]) .crm{display:none}
nav{position:sticky;bottom:0;z-index:5;display:flex;align-items:center;gap:10px;padding:8px 8px calc(8px + env(safe-area-inset-bottom));background:rgba(8,11,18,.97);border-top:1px solid var(--bd)}
.tabs2{display:flex;gap:2px;flex:1;min-width:0;overflow-x:auto;scrollbar-width:none}.tabs2::-webkit-scrollbar{display:none}
nav button.t{flex:1 1 0;min-width:58px;padding:7px 4px;border-radius:10px;border:0;background:none;color:#cfd5e2;font-size:10px;display:flex;flex-direction:column;align-items:center;gap:3px;white-space:nowrap}
nav button.t .si{font-size:22px}nav button.t ha-icon{--mdc-icon-size:22px}
nav button.t span{overflow:hidden;text-overflow:ellipsis;max-width:100%}
nav button.t.act{background:#f1efec;color:#12151c}
.nr{display:flex;align-items:center;gap:12px;flex:none}
.cr{letter-spacing:2px;font-size:11px;text-transform:uppercase;color:var(--mu);white-space:nowrap;display:none}
.gb{width:40px;height:40px;border-radius:50%;border:1px solid rgba(255,255,255,.25);background:none;display:grid;place-items:center;font-size:19px;padding:0}
.crm{text-align:center;letter-spacing:2px;font-size:11px;text-transform:uppercase;color:var(--mu);padding:10px 0 4px}
/* ===== camera viewer ===== */
.camv{position:fixed;inset:0;z-index:120;background:rgba(3,5,10,.985);display:flex;flex-direction:column}
.camv .vh{display:flex;align-items:center;gap:14px;padding:16px 20px}
.camv .vt{font-family:var(--serif);font-size:30px;line-height:1}
.camv .vb{flex:1;min-height:0;display:flex;align-items:center;justify-content:center;padding:0 20px}
.camv img{max-width:100%;max-height:100%;width:100%;height:100%;object-fit:contain;border-radius:12px;background:#000}
.camv .vf{display:flex;gap:8px;padding:14px 20px calc(16px + env(safe-area-inset-bottom));overflow-x:auto;justify-content:center;scrollbar-width:none}
.cc2{flex:none;padding:10px 16px;border-radius:9px;border:1px solid rgba(255,255,255,.25);background:none;font-size:13px;font-weight:500}.cc2.on{background:#f1efec;color:#12151c;border-color:#f1efec}
/* ===== settings page ===== */
.sbar{display:flex;align-items:flex-end;justify-content:space-between;gap:16px;flex-wrap:wrap;margin:6px 0 20px}
.sbar h1{font-size:56px;margin:0;line-height:1}
.sbar .sub{font-size:14px;margin:8px 0 0}
.sbtns{display:flex;gap:10px;flex-wrap:wrap}
.sbtn{border:0;border-radius:10px;padding:13px 22px;background:rgba(255,255,255,.14);color:#fff;font-weight:700;font-size:12px;letter-spacing:1.5px;text-transform:uppercase}
.sbtn.pri2{background:var(--ac);color:#000}
.sc .sbtn{padding:9px 16px;font-size:12px}
.sg{display:grid;grid-template-columns:270px minmax(0,1fr);gap:18px;align-items:start}
.snav{display:flex;flex-direction:column;gap:8px}
.sti{display:flex;gap:14px;align-items:center;text-align:left;width:100%;padding:14px 16px;border-radius:14px;border:1px solid var(--bd);background:rgba(255,255,255,.06)}
.sti.act{background:rgba(255,255,255,.2)}
.sti .si{font-size:22px;flex:none;color:#cfd6e6}
.sti b{display:block;font-size:16px;font-weight:600}.sti small{display:block;color:var(--mu);font-size:12px;margin-top:2px}
.ssec{background:var(--cd);border:1px solid var(--bd);border-radius:20px;padding:22px;margin-bottom:18px}
.shd{display:flex;justify-content:space-between;align-items:baseline;gap:12px;flex-wrap:wrap;margin-bottom:14px;font-size:12px;letter-spacing:3px;text-transform:uppercase;font-weight:700}
.shd small{letter-spacing:0;text-transform:none;font-weight:400;color:var(--mu);font-size:12px;text-align:right}
.srow{display:grid;grid-template-columns:minmax(0,34%) minmax(0,1fr);gap:16px;align-items:center;background:rgba(255,255,255,.05);border:1px solid var(--bd);border-radius:14px;padding:12px 16px;margin-bottom:8px}
.sn{font-weight:600}.ss{color:var(--mu);font-size:12px;margin-top:2px;overflow-wrap:anywhere}
.sc{display:flex;gap:8px;align-items:center;flex-wrap:wrap;min-width:0}.sc>input[type=text],.sc>select{flex:1;min-width:120px}
.sc input[type=range]{flex:1;min-width:140px}.sc input[type=file]{color:var(--mu);font-size:13px;max-width:100%}
.ib2{background:rgba(255,255,255,.1);border:0;border-radius:10px;width:36px;height:36px;flex:none}.ib2:disabled{opacity:.3}
.swt{width:44px;height:44px;border-radius:50%;border:2px solid rgba(255,255,255,.18);cursor:pointer;padding:0;flex:none}.swt.sel{border-color:#fff;box-shadow:0 0 0 2px var(--ac)}
/* ===== screen sizes (set by JS from the panel width): phone / tablet / desktop, plus data-wide for the two-column layouts ===== */
:host([data-dev="phone"]) .brand{font-size:15px;letter-spacing:5px}
:host([data-dev="phone"]) .page{padding:18px 14px 20px}
:host([data-dev="phone"]) h1{font-size:36px}
:host([data-dev="phone"]) .clk{font-size:72px}
:host([data-dev="phone"]) .bc{padding:16px 16px 16px;border-radius:18px}
:host([data-dev="phone"]) .grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
:host([data-dev="phone"]) .grid[data-grid^="list:cameras"]{grid-template-columns:minmax(0,1fr)!important}
:host([data-dev="phone"]) .bc .grid{grid-template-columns:minmax(0,1fr)}
:host([data-dev="phone"]) .card{padding:14px;border-radius:16px}
:host([data-dev="phone"]) .rn{font-size:24px}
:host([data-dev="phone"]) .rh{flex-wrap:wrap;margin:20px 0 10px}
:host([data-dev="phone"]) .ov{place-items:end center;padding:0}
:host([data-dev="phone"]) .dlg{width:100%;max-height:92vh;border-radius:24px 24px 0 0}
:host([data-dev="phone"]) .hint{bottom:78px}
:host([data-dev="phone"]) .sg{grid-template-columns:minmax(0,1fr)}
:host([data-dev="phone"]) .snav{flex-direction:row;overflow-x:auto;padding-bottom:4px}
:host([data-dev="phone"]) .sti{width:auto;flex:none;white-space:nowrap;padding:10px 14px}
:host([data-dev="phone"]) .sti small{display:none}
:host([data-dev="phone"]) .srow{grid-template-columns:minmax(0,1fr);gap:8px}
:host([data-dev="phone"]) .sbar h1{font-size:38px}
:host([data-dev="phone"]) .sbtn{padding:11px 16px}
:host([data-dev="phone"]) .ssec{padding:16px;border-radius:18px}
:host([data-dev="phone"]) .ah h1{font-size:38px}
:host([data-dev="phone"]) .gr{font-size:30px}
:host([data-dev="phone"]) .lr{grid-template-columns:minmax(60px,28%) minmax(0,1fr) 44px;gap:10px}
:host([data-dev="phone"]) .camv .vt{font-size:24px}
:host([data-dev="tablet"]) .home,:host([data-dev="tablet"]) .area{padding:28px 28px 22px}
:host([data-dev="tablet"]) .page{padding:28px 28px 24px}
:host([data-dev="tablet"]) .clk{font-size:96px}
:host([data-dev="tablet"]) .bento,:host([data-dev="tablet"]) .abody{grid-template-columns:repeat(2,minmax(0,1fr))}
:host([data-dev="phone"]) .scg{grid-template-columns:repeat(2,minmax(0,1fr))}
:host([data-dev="tablet"]) .scg{grid-template-columns:repeat(3,minmax(0,1fr))}
:host([data-dev="tablet"]) nav{padding:10px 20px calc(10px + env(safe-area-inset-bottom))}
:host([data-dev="tablet"]) nav button.t,:host([data-dev="desktop"]) nav button.t{flex:none;flex-direction:row;font-size:15px;font-weight:500;padding:12px 20px;gap:0}
:host([data-dev="tablet"]) nav button.t .si,:host([data-dev="desktop"]) nav button.t .si,:host([data-dev="tablet"]) nav button.t ha-icon,:host([data-dev="desktop"]) nav button.t ha-icon{display:none}
:host([data-dev="desktop"]) nav{padding:12px 44px calc(12px + env(safe-area-inset-bottom))}
:host([data-dev="desktop"]) .home,:host([data-dev="desktop"]) .area{padding:40px 44px 28px}
:host([data-dev="desktop"]) .bento,:host([data-dev="desktop"]) .abody{grid-template-columns:repeat(2,minmax(0,1fr));gap:18px}
:host([data-dev="desktop"]) .scg{grid-template-columns:repeat(2,minmax(0,1fr))}
:host([data-dev="desktop"]) .camv .vh,:host([data-dev="desktop"]) .camv .vb,:host([data-dev="desktop"]) .camv .vf{padding-left:44px;padding-right:44px}
:host([data-wide="1"]) .home{grid-template-columns:minmax(260px,360px) minmax(0,1fr);gap:40px}
:host([data-wide="1"]) .scg{grid-template-columns:repeat(2,minmax(0,1fr))}
:host([data-wide="1"]) .hl{position:sticky;top:28px;align-self:start;height:max(calc(var(--vh) - 116px),540px)}
:host([data-dev="desktop"][data-wide="1"]) .hl{top:40px;height:max(calc(var(--vh) - 132px),540px)}
:host([data-wide="1"]) .clk{font-size:clamp(88px,9.4vw,150px);margin-top:56px}
:host([data-wide="1"]) .gr{font-size:36px;margin-top:34px}
:host([data-wide="1"]) .scn{margin-top:auto;padding-top:26px}
:host([data-wide="1"]) .area{grid-template-columns:minmax(220px,270px) minmax(0,1fr);gap:40px}
:host([data-wide="1"]) .rlist{flex-direction:column;overflow:visible}
:host([data-wide="1"]) .rli{width:100%;padding:13px 14px;background:none;border-color:transparent;font-size:16px}
:host([data-wide="1"]) .rli.act{background:rgba(255,255,255,.12);border-color:rgba(255,255,255,.12)}
:host([data-wide="1"]) .rl .ft{display:block}
:host([data-wide="1"]) .ah h1{font-size:clamp(46px,5vw,66px)}
:host([data-wide="1"]) .chips{grid-template-columns:repeat(4,minmax(0,1fr))}
`;

class QuintDashboard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.innerHTML = `<style>${CSS}</style><div id="r"></div>`;
    this._root = this.shadowRoot.getElementById("r");
    this._tres = {}; this._tsub = {};
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
    R.addEventListener("input", (e) => this._input(e));
    R.addEventListener("touchmove", (e) => { if (this._mv) e.preventDefault(); }, { passive: false });
    R.addEventListener("contextmenu", (e) => { if (this._hold || this._mv) e.preventDefault(); });
    R.addEventListener("error", (e) => { const t = e.target; if (t && t.classList && t.classList.contains("camx") && !this._camFb) { this._camFb = true; if (t.dataset.snap) t.src = t.dataset.snap; } }, true);
  }
  _pdown(e) {
    if (e.button > 0 || e.target.type === "range" || this._mv) return;
    const path = e.composedPath(), k = path.find((n) => n.dataset && n.dataset.k), tp = path.find((n) => n.dataset && n.dataset.tpl);
    if (!k || (!tp && !this._admin())) return;
    this._hold = { k, x: e.clientX, y: e.clientY, id: e.pointerId, t: Date.now(), tpl: tp ? tp.dataset.tpl : "" };
    if (this._admin()) { k.classList.add("holding"); this._ht = setTimeout(() => this._startMove(), 5000); }
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
    if (this._hold) {
      const h = this._hold;
      if (h.tpl && Date.now() - h.t >= 600) { this._sup = Date.now() + 500; this._details(this._findTpl(h.tpl)); }
      return this._cancelHold();
    }
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
  _relevant(h) {
    if (Object.keys(h.states).length !== this._n) return true;
    for (const id of this._track) if (h.states[id] !== this._seen[id]) return true;
    return false;
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
  _kof(x) { return x.nodeType === 1 ? x.getAttribute("data-k") || x.getAttribute("data-id") : null; }
  _patch(o, n, act) {
    if (n.nodeType === 3) { if (o.nodeValue !== n.nodeValue) o.nodeValue = n.nodeValue; return; }
    if (n.nodeType !== 1) return;
    if (o.hasAttribute("data-lv")) { const v = n.getAttribute("data-lv"); if (o.getAttribute("data-lv") !== v) o.setAttribute("data-lv", v); return; }
    this._attrs(o, n);
    this._morph(o, n);
    if (o === act) return;
    if (o.tagName === "INPUT" && (o.type === "range" ? !this._drag : o.hasAttribute("data-rname") || o.hasAttribute("data-uname"))) o.value = n.getAttribute("value") ?? "";
    if (o.tagName === "SELECT") { const sel = n.querySelector("option[selected]"); o.value = sel ? sel.value : ""; }
  }
  _morph(from, to) {
    const act = this.shadowRoot.activeElement, pool = new Map(), used = new Set();
    Array.from(from.childNodes).forEach((o) => { const k = this._kof(o); if (k) pool.set(k, o); });
    let cur = from.firstChild;
    Array.from(to.childNodes).forEach((n) => {
      const k = this._kof(n);
      let o = null, cand = null;
      if (k) { o = pool.get(k) || null; if (o) pool.delete(k); }
      else {
        cand = cur;
        while (cand && (used.has(cand) || this._kof(cand))) cand = cand.nextSibling;
        if (cand && cand.nodeType === n.nodeType && cand.nodeName === n.nodeName) o = cand;
      }
      if (o) {
        if (o === cur) cur = cur.nextSibling; else from.insertBefore(o, cur);
        used.add(o); this._patch(o, n, act); return;
      }
      const c = n.cloneNode(true);
      if (cand === cur && cand) { const nx = cur.nextSibling; from.replaceChild(c, cur); cur = nx; }
      else { from.insertBefore(c, cur); if (cand) from.removeChild(cand); }
      used.add(c);
    });
    Array.from(from.childNodes).forEach((x) => { if (!used.has(x)) from.removeChild(x); });
  }
  _refreshCams() {
    if (document.hidden) return;
    this.shadowRoot.querySelectorAll("img.cam[data-src]").forEach((img) => {
      const b = img.dataset.src, u = b + (b.includes("?") ? "&" : "?") + "t=" + Date.now(), t = new Image();
      t.onload = () => { img.src = u; }; t.src = u;
    });
  }
  _layout() {
    const w = this.clientWidth || window.innerWidth || 1024, auto = w < 600 ? "phone" : w < 1200 ? "tablet" : "desktop";
    let dev = localStorage.getItem("quint_dev") || "auto";
    if (!["phone", "tablet", "desktop"].includes(dev)) dev = auto;
    const wide = dev !== "phone" && w >= 900 ? "1" : "0";
    if (this.getAttribute("data-dev") !== dev) this.setAttribute("data-dev", dev);
    if (this.getAttribute("data-wide") !== wide) this.setAttribute("data-wide", wide);
    if (this.getAttribute("data-nav") !== "bar") this.setAttribute("data-nav", "bar");
    if (this._auto !== auto || this._w !== w) { this._auto = auto; this._w = w; }
  }
  _time() { return this._clock(); }
  connectedCallback() {
    this._applyBg(); this._layout();
    if (typeof ResizeObserver !== "undefined") { this._ro = new ResizeObserver(() => this._layout()); this._ro.observe(this); }
    this._kd = (e) => { if (e.key === "Escape" && this._cam) { this._cam = null; this._camFb = false; this._draw(true); } };
    window.addEventListener("keydown", this._kd);
    this._iv2 = setInterval(() => this._refreshCams(), 5000);
    this._iv3 = setInterval(() => {
      if (!this._cam || !this._camFb || document.hidden) return;
      const img = this.shadowRoot.querySelector("img.camx"); if (!img || !img.dataset.snap) return;
      const b = img.dataset.snap, u = b + (b.includes("?") ? "&" : "?") + "t=" + Date.now(), t = new Image();
      t.onload = () => { img.src = u; }; t.src = u;
    }, 1500);
    this._iv = setInterval(() => { const r = this.shadowRoot; [".clk", ".tm"].forEach((q) => { const e = r.querySelector(q); if (e) e.textContent = this._time(); }); }, 10000);
  }
  disconnectedCallback() { clearInterval(this._iv); clearInterval(this._iv2); clearInterval(this._iv3); window.removeEventListener("keydown", this._kd); if (this._ro) { this._ro.disconnect(); this._ro = null; } Object.values(this._tsub || {}).forEach((p) => p.then((u) => u()).catch(() => {})); this._tsub = {}; this._conn = null; }
  set panel(p) { this._title = (p && p.config && p.config.title) || "Quint"; }
  set narrow(n) { if (n === this._narrow) return; this._narrow = n; this._draw(true); }
  set route(r) {}
  setConfig(config) { this._title = (config && config.title) || "Quint"; }
  getCardSize() { return 12; }
  static getStubConfig() { return { title: "Quint" }; }

  set hass(h) {
    this._h = h;
    if (!this._loading) { this._loading = true; this._loadCfg(); }
    if (this._lvc) Object.values(this._lvc).forEach((e) => (e.hass = h));
    if (this._loaded && h.connection !== this._conn) { this._conn = h.connection; this._tsub = {}; this._syncTpl(); }
    if (!this._c.rooms.length && h.areas && Object.keys(h.areas).length) this._importRooms(false);
    if (this._loaded && this._track && !this._relevant(h)) return;
    if (this._pending) return;
    this._pending = setTimeout(() => { this._pending = null; this._draw(); }, 250);
  }

  /* ---------- helpers ---------- */
  _save(now) {
    localStorage.setItem(KEY, JSON.stringify(this._c));
    if (this._v.p === "settings" && !now) { this._dirty = true; return; }
    if (now) { this._dirty = false; this._snap = JSON.stringify(this._c); }
    this._push();
  }
  _push() {
    if (!this._h || !this._srv) return;
    clearTimeout(this._st);
    this._st = setTimeout(() => this._h.callApi("POST", "quint/config", this._c).catch(() => {}), 300);
  }
  _revert() {
    try { this._c = { ...FRESH(), ...JSON.parse(this._snap) }; } catch (e) {}
    localStorage.setItem(KEY, JSON.stringify(this._c));
    this._dirty = false; this._applyBg(); this._syncTpl();
  }
  _toast(t) { this._hint(t); clearTimeout(this._tt); this._tt = setTimeout(() => this._hint(""), 1800); }
  _applyBg() {
    const b = { preset: "midnight", mode: "preset", dim: 0, blur: 0, ...(this._c.bg || {}) };
    const img = b.mode === "image" && this._bgData ? `url("${this._bgData}")` : BG[b.preset] || BG.midnight;
    this.style.setProperty("--qbg-img", img);
    this.style.setProperty("--qbg-dim", String(Math.max(0, Math.min(80, +b.dim || 0)) / 100));
    this.style.setProperty("--qbg-blur", Math.max(0, Math.min(20, +b.blur || 0)) + "px");
  }
  _loadBg() {
    this._h.callApi("GET", "quint/background").then((d) => { this._bgData = (d && d.data) || ""; this._applyBg(); this._draw(); }).catch(() => {});
  }
  async _pickBg(file) {
    try {
      const url = URL.createObjectURL(file), img = new Image();
      await new Promise((ok, no) => { img.onload = ok; img.onerror = no; img.src = url; });
      const sc = Math.min(1, 1920 / Math.max(img.width, img.height)), cv = document.createElement("canvas");
      cv.width = Math.round(img.width * sc); cv.height = Math.round(img.height * sc);
      cv.getContext("2d").drawImage(img, 0, 0, cv.width, cv.height);
      URL.revokeObjectURL(url);
      const data = cv.toDataURL("image/jpeg", 0.8);
      await this._h.callApi("POST", "quint/background", { data });
      this._bgData = data;
      this._c.bg = { dim: 35, ...(this._c.bg || {}), mode: "image" };
      this._save(); this._applyBg(); this._draw(true); this._toast("Photo uploaded — press Save");
    } catch (e) { this._toast("Could not use that photo"); }
  }
  _importCfg(o) {
    const c = this._c;
    (o.rooms || []).forEach((r) => { if (r && r.id && !c.rooms.some((x) => x.id === r.id)) c.rooms.push(r); });
    Object.assign(c.map, o.map || {}); c.hide = [...new Set([...(c.hide || []), ...(o.hide || [])])];
    Object.entries(o.custom || {}).forEach(([k, a]) => { c.custom[k] = c.custom[k] || []; (a || []).forEach((it) => { if (it && !c.custom[k].some((x) => x.uid && x.uid === it.uid)) c.custom[k].push(it); }); });
    c.order = { ...(c.order || {}), ...(o.order || {}) };
    ["name", "title", "bg", "pills"].forEach((k) => { if (o[k]) c[k] = o[k]; });
    if (typeof o.credit === "string") c.credit = o.credit;
    ["noClock", "noScenes", "noWeather", "noRooms"].forEach((k) => { if (typeof o[k] === "boolean") c[k] = o[k]; });
    c.svcTitle = { ...(c.svcTitle || {}), ...(o.svcTitle || {}) };
    c.svcHide = [...new Set([...(c.svcHide || []), ...(o.svcHide || [])])];
    if (o.svcOrder) c.svcOrder = o.svcOrder;
    this._save(); this._applyBg(); this._syncTpl(); this._draw(true);
  }
  _swap(arr, i, d) { const j = i + d; if (j < 0 || j >= arr.length) return; [arr[i], arr[j]] = [arr[j], arr[i]]; }
  _sact(a, v) {
    const c = this._c;
    if (a === "save") { this._push(); this._dirty = false; this._snap = JSON.stringify(c); this._toast("Saved"); this._draw(true); return; }
    if (a === "close") { if (this._dirty && !confirm("Discard unsaved changes?")) return; if (this._dirty) this._revert(); return this._nav("home"); }
    if (a === "reset") {
      if (!confirm("Reset everything? Rooms, device assignments, titles and custom cards are cleared. Press Close afterwards to undo, or Save to keep it.")) return;
      this._c = FRESH(); this._importRooms(false); this._applyBg(); this._syncTpl(); this._save(); this._draw(true); return;
    }
    if (a === "export") {
      const al = document.createElement("a"); al.href = URL.createObjectURL(new Blob([JSON.stringify({ quint: VER, ...c }, null, 2)], { type: "application/json" }));
      al.download = "quint-settings.json"; al.click(); setTimeout(() => URL.revokeObjectURL(al.href), 2000); return;
    }
    if (a === "bgp") c.bg = { ...(c.bg || {}), preset: v, mode: "preset" };
    else if (a === "bgm") c.bg = { ...(c.bg || {}), mode: "image" };
    else if (a === "bgx") { this._h.callApi("DELETE", "quint/background").catch(() => {}); this._bgData = ""; c.bg = { ...(c.bg || {}), mode: "preset" }; }
    else if (a === "svcvis") c.svcHide = (c.svcHide || []).includes(v) ? c.svcHide.filter((x) => x !== v) : [...(c.svcHide || []), v];
    else if (a === "svcup" || a === "svcdn") { const l = this._svcsAll(); this._swap(l, l.indexOf(v), a === "svcup" ? -1 : 1); c.svcOrder = l; }
    else if (a === "rup" || a === "rdn") this._swap(c.rooms, +v, a === "rup" ? -1 : 1);
    else if (a === "pill") { const P = c.pills || ["lights", "climate", "security"]; c.pills = P.includes(v) ? P.filter((x) => x !== v) : [...P, v]; }
    else if (a === "clk") c.noClock = !c.noClock;
    else if (a === "flag" && ["noClock", "noScenes", "noWeather", "noRooms"].includes(v)) c[v] = !c[v];
    else return;
    this._save(); this._applyBg(); this._draw(true);
  }
  _input(e) {
    const t = e.target, d = t.dataset;
    if (d.bg && this._admin()) { this._c.bg = { ...(this._c.bg || {}), [d.bg]: +t.value }; this._applyBg(); }
    if (d.dfilter !== undefined) { this._dflt = t.value; this._draw(true); }
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
    this._conn = this._h.connection; this._syncTpl();
    this._applyBg(); this._loadBg();
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
  _svcsAll() {
    const o = this._c.svcOrder || [], keys = Object.keys(SV).filter((x) => (isCs(x) ? this._csHas(x) || (x === "more" && this._admin()) : this._ents(x).length));
    const r = (k) => { const i = o.indexOf(k); return i < 0 ? 1000 + keys.indexOf(k) : i; };
    return keys.slice().sort((p, q) => r(p) - r(q));
  }
  _svcs() { const h = this._c.svcHide || []; return this._svcsAll().filter((x) => !h.includes(x)); }
  _titles() { const T = this._c.svcTitle || {}; Object.keys(SV).forEach((k) => { SV[k].n = T[k] || (k.startsWith("cs:") ? k.slice(3) : SV_DEF[k]); }); }
  _rooms() { return this._c.rooms.filter((r) => r.on !== false); }
  _isOn(id) { return !OFF.includes(this._h.states[id].state); }
  _stats(svc) {
    const e = this._ents(svc), st = (i) => this._h.states[i].state;
    if (isCs(svc)) { const all = Object.entries(this._c.custom).filter(([k]) => k !== "home").flatMap(([, v]) => v.filter((x) => this._csKey(x) === svc)); const n = all.filter((x) => x.entity && this._h.states[x.entity] && this._isOn(x.entity)).length; return { big: all.length, lbl: `cards · ${n} on`, on: n > 0 }; }
    if (svc === "lights") { const n = e.filter((i) => st(i) === "on").length; return { big: n, lbl: `of ${e.length} on`, on: n > 0 }; }
    if (svc === "cameras") { const n = e.filter((i) => !["unavailable", "unknown"].includes(st(i))).length; return { big: n, lbl: `of ${e.length} online`, on: n > 0 }; }
    if (svc === "shades") { const o = e.filter((i) => ["open", "opening"].includes(st(i))).length; return { big: `${o} / ${e.length - o}`, lbl: "open / closed", on: o > 0 }; }
    if (svc === "climate") { const n = e.filter((i) => !["off", "unavailable"].includes(st(i))).length; return { big: n, lbl: `of ${e.length} on`, on: n > 0 }; }
    if (svc === "media") { const n = e.filter((i) => ["on", "playing", "paused", "idle"].includes(st(i))).length; return { big: n, lbl: `of ${e.length} on`, on: n > 0 }; }
    const o = e.filter((i) => ["on", "open", "unlocked"].includes(st(i))).length;
    return { big: o ? `${o} open` : "Secure", lbl: o ? "doors & locks" : "all closed & locked", on: o > 0 };
  }
  _roomCount(svc, r) {
    if (isCs(svc)) { const it = this._csItems(r, svc).map((x) => x.it); return { n: it.filter((x) => x.entity && this._h.states[x.entity] && this._isOn(x.entity)).length, t: it.length }; }
    const e = this._ents(svc, r); if (!e.length) return null;
    const n = e.filter((i) => { const s = this._h.states[i].state; return svc === "shades" ? ["open", "opening"].includes(s) : svc === "lights" ? s === "on" : this._isOn(i); }).length;
    return { n, t: e.length };
  }
  _admin() { return !!(this._h && this._h.user && this._h.user.is_admin); }
  _nav(p, x = {}) {
    if (this._v.p === "settings" && p !== "settings" && this._dirty) { if (!confirm("Discard unsaved settings changes?")) return; this._revert(); }
    if (p === "settings" && this._v.p !== "settings") { this._snap = JSON.stringify(this._c); this._dirty = false; }
    this._v = { p, ...x }; this._draw(true);
  }
  _tileGo(s) { return s === "cameras" || s === "security" ? `data-go='${JSON.stringify({ p: s })}'` : `data-go='${JSON.stringify({ p: "rooms", svc: s })}'`; }

  /* ---------- events ---------- */
  _click(e) {
    if (this._sup && Date.now() < this._sup) return;
    const t = e.composedPath().find((n) => n.dataset && (n.dataset.go || n.dataset.act || n.dataset.tog || n.dataset.cc || n.dataset.tpl || n.dataset.s || n.dataset.cam));
    if (!t) return;
    const d = t.dataset;
    if ((d.cc || d.s || (d.tog && !d.tog.startsWith("menu"))) && !this._admin()) return;
    if (d.cam) {
      const v = d.cam, cams = this._ents("cameras").filter((i) => this._h.states[i].attributes.entity_picture);
      if (v === "keep") return;
      if (v === "prev" || v === "next") { const n = cams.length, i = cams.indexOf(this._cam); if (n) this._cam = cams[(i + (v === "next" ? 1 : -1) + n) % n]; }
      else this._cam = v === "close" || v === "bg" ? null : v;
      this._camFb = false; return this._draw(true);
    }
    if (d.tpl) return this._tap(d.tpl);
    if (d.s) { const i = d.s.indexOf("|"); return this._sact(d.s.slice(0, i), d.s.slice(i + 1)); }
    if (d.go) { const { p, ...x } = JSON.parse(d.go); return this._nav(p, x); }
    if (d.cc) {
      const [k, r, i] = d.cc.split(":");
      if (k === "open") { const cv = this._v.svc || ""; this._dlg = { room: r, place: r, mode: "entity", tap: "details", sn: cv.startsWith("cs:") ? cv.slice(3) : cv === "more" ? "More" : "" }; return this._draw(true); }
      if (k === "cancel") { this._dlg = null; return this._draw(true); }
      if (k === "del") { this._c.custom[r].splice(+i, 1); this._save(this._v.p !== "settings"); this._syncTpl(); return this._draw(true); }
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
    if (d.devsel !== undefined) { localStorage.setItem("quint_dev", t.value); this._layout(); this._draw(true); return; }
    if (adm && d.bgfile !== undefined) { const fl = t.files && t.files[0]; if (fl) this._pickBg(fl); t.value = ""; return; }
    if (adm && d.import !== undefined) {
      const fl = t.files && t.files[0];
      if (fl) fl.text().then((tx) => { try { this._importCfg(JSON.parse(tx)); this._toast("Imported — press Save"); } catch (er) { this._toast("Not a valid settings file"); } });
      t.value = ""; return;
    }
    if (adm && d.bg) { this._save(); return; }
    if (adm && d.cred !== undefined) { this._c.credit = t.value.trim().slice(0, 30); this._save(); this._draw(true); return; }
    if (adm && d.ttl !== undefined) { this._c.title = t.value.trim().slice(0, 30); this._save(); this._draw(true); return; }
    if (adm && d.svct) { this._c.svcTitle = this._c.svcTitle || {}; this._c.svcTitle[d.svct] = t.value.trim().replace(/['"<>\\&]/g, "").slice(0, 24); this._save(); this._draw(true); return; }
    if (d.slider) { const [dom, srv, key, div] = d.slider.split("|"); this._h.callService(dom, srv, { entity_id: d.e, [key]: +t.value / +div }); }
    if (adm && d.rname !== undefined) { this._c.rooms[+d.rname].name = t.value; this._save(); }
    if (adm && d.map) { this._c.map[d.map] = t.value; this._save(); }
    if (d.sel) { const [dom, srv, key] = d.sel.split("|"); this._h.callService(dom, srv, { entity_id: d.e, [key]: t.value }); }
    if (adm && d.dd && this._dlg) { this._dlg[d.dd] = t.value; if (d.dd === "dom") this.shadowRoot.getElementById("cc-list").innerHTML = this._opts(t.value); if (d.dd === "mode" || d.dd === "tap" || d.dd === "place") this._draw(true); }
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
      return `<div class="card" ${off || !src ? "" : `data-cam="${id}"`}>${hd(`<span class="dot ${off ? "" : "ok"}"></span>${off ? "Offline" : "Online"}`)}</div>${off || !src ? "" : `<img class="cam" data-src="${src}" src="${src}">`}</div>`;
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
  _csKey(it) { const n = (it.svc || "").trim(); return !n || n.toLowerCase() === "more" ? "more" : "cs:" + n; }
  _csItems(rid, key) { return (this._c.custom[rid] || []).map((it, i) => ({ it, i })).filter((x) => this._csKey(x.it) === key); }
  _csHas(key) { return Object.entries(this._c.custom).some(([r, a]) => r !== "home" && a.some((x) => this._csKey(x) === key)); }
  _syncSv() {
    const PAL = ["#4aa3ff", "#2dd4bf", "#f5a623", "#b388ff", "#34c98b", "#ff7a59", "#7dd3fc", "#f472b6"], found = {};
    Object.entries(this._c.custom).forEach(([r, a]) => { if (r === "home") return; a.forEach((x) => { const k = this._csKey(x); if (k === "more") return; const f = (found[k] = found[k] || { ic: "" }); if (!f.ic && x.svcIcon) f.ic = x.svcIcon; }); });
    Object.keys(SV).forEach((k) => { if (k.startsWith("cs:") && !found[k]) delete SV[k]; });
    Object.entries(found).forEach(([k, f]) => {
      let h = 0; for (const ch of k) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
      SV[k] = { n: k.slice(3), c: PAL[h % PAL.length], i: f.ic ? `<ha-icon icon="${this._esc(f.ic)}"></ha-icon>` : SV.more.i };
    });
  }
  _sched() { if (this._pending) return; this._pending = setTimeout(() => { this._pending = null; this._draw(); }, 150); }
  _csPage(s) {
    const adm = this._admin();
    const parts = this._rooms().map((r) => [r, this._csItems(r.id, s)]).filter(([, e]) => adm || e.length).map(([r, e]) => {
      const n = e.filter((x) => x.it.entity && this._h.states[x.it.entity] && this._isOn(x.it.entity)).length;
      const add = adm ? `<div class="tile add" data-cc="open:${r.id}"><div class="bdg" style="--c:#8d9ab8">＋</div><div class="nm">Add card</div></div>` : "";
      return `<section><div class="rh"><div class="grow" data-go='${JSON.stringify({ p: "room", room: r.id, svc: s })}'><div class="rn">${r.name}</div><div class="lbl">${n} active of ${e.length}</div></div></div><div class="grid" data-grid="room:${r.id}:${s}">${this._customCards(r.id, "room:" + r.id + ":" + s, s)}${add}</div></section>`;
    });
    return `${this._top()}<h1>${SV[s].i} ${SV[s].n}</h1><div class="sub">${adm ? "Admin · add cards to any room with ＋" : "Grouped by room"}</div>${parts.join("") || '<div class="card">No cards yet.</div>'}`;
  }
  _homeCards() {
    const n = (this._c.custom.home || []).length, adm = this._admin();
    if (!n && !adm) return "";
    return `${n ? "<h2>My cards</h2>" : ""}<div class="grid" data-grid="home:cards" style="margin-top:${n ? 0 : 16}px">${this._customCards("home", "home:cards")}${adm ? `<div class="tile add" data-cc="open:home"><div class="bdg" style="--c:#8d9ab8">＋</div><div class="nm">Add card</div></div>` : ""}</div>`;
  }
  _esc(t) { return String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
  _findTpl(uid) { return Object.values(this._c.custom).flat().find((x) => x.uid === uid); }
  _syncTpl() {
    if (!this._h || !this._h.connection) return;
    const want = new Set();
    Object.values(this._c.custom).flat().forEach((x) => { if (x.type === "template") [x.text, x.label].forEach((t) => t && want.add(t)); });
    Object.keys(this._tsub).forEach((t) => { if (!want.has(t)) { this._tsub[t].then((u) => u()).catch(() => {}); delete this._tsub[t]; } });
    want.forEach((t) => {
      if (this._tsub[t]) return;
      this._tsub[t] = this._h.connection.subscribeMessage((m) => {
        this._tres[t] = m.result !== undefined ? m.result : m.error ? "⚠ " + m.error : "";
        this._sched();
      }, { type: "render_template", template: t, strict: false, report_errors: true }).catch(() => () => {});
    });
  }
  _tplCard(it) {
    const s = it.entity && this._h.states[it.entity], on = s && !OFF.includes(s.state);
    const r = (t) => (t ? (this._tres[t] !== undefined ? this._esc(this._tres[t]) : "…") : "");
    const label = it.label ? r(it.label) : "";
    return `<div class="card tpl ${on ? "on" : ""}" data-tpl="${it.uid}"><div class="row"><div class="bdg" style="--c:${SV.more.c}"><ha-icon icon="${this._esc(it.icon || "mdi:code-braces")}"></ha-icon></div><div class="grow"><div class="st" style="margin:0">${this._esc(it.name || "")}</div><div class="tv">${r(it.text)}</div>${label ? `<div class="lbl">${label}</div>` : ""}</div></div></div>`;
  }
  _details(it) { if (it && it.entity) this.dispatchEvent(new CustomEvent("hass-more-info", { bubbles: true, composed: true, detail: { entityId: it.entity } })); }
  _tap(uid) {
    const it = this._findTpl(uid); if (!it) return;
    const t = it.tap || "details";
    if (t === "details") return this._details(it);
    if (t === "toggle") { if (it.entity) this._h.callService("homeassistant", "toggle", { entity_id: it.entity }); return; }
    if (t === "action") { const [d, sv] = (it.service || "").split("."); if (d && sv) this._h.callService(d, sv, { ...(it.entity ? { entity_id: it.entity } : {}), ...(it.data || {}) }); return; }
    if (t === "path" && it.path) {
      if (/^https?:/.test(it.path)) window.open(it.path, "_blank");
      else if (it.path.startsWith("/")) { history.pushState(null, "", it.path); window.dispatchEvent(new CustomEvent("location-changed")); }
    }
  }
  _customCards(rid, ctx, key) {
    const items = (this._c.custom[rid] || []).map((it, i) => ({ it, i })).filter((x) => !key || this._csKey(x.it) === key);
    return this._sort(ctx, items, (x) => "c:" + x.it.uid).map(({ it, i }) => {
      const rm = this._admin() ? `<button class="rm" data-cc="del:${rid}:${i}">✕</button>` : "", k = "c:" + it.uid;
      return it.type === "template" ? `<div class="cw" data-k="${k}">${this._tplCard(it)}${rm}</div>` : it.type === "lovelace" ? `<div class="cw lvw" data-k="${k}"><div data-lv="${rid}:${i}"></div>${rm}</div>` : `<div class="cw" data-k="${k}">${this._gen(it)}${rm}</div>`;
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
    const D = this._dlg, mode = D.mode || "entity", doms = {};
    Object.keys(this._h.states).forEach((i) => { const k = i.split(".")[0]; doms[k] = (doms[k] || 0) + 1; });
    const sel = (key, list) => `<select data-dd="${key}">${list.map(([v, l]) => `<option value="${v}" ${(D[key] || "") === v ? "selected" : ""}>${l}</option>`).join("")}</select>`;
    const L = (t, sub) => `<div class="lbl" style="margin:12px 0 4px">${t}${sub ? ` · ${sub}` : ""}</div>`;
    const inp = (id, ph, val) => `<input type="text" id="${id}" placeholder="${this._esc(ph)}" ${val ? `value="${val}"` : ""}>`;
    let body = "";
    if (mode === "template") {
      const tap = D.tap || "details";
      body = `${L("Name")}${inp("cc-name", "e.g. Outside")}
      ${L("Icon", "mdi name")}${inp("cc-icon", "mdi:code-braces", "mdi:code-braces")}
      ${L("Text", "Jinja template for the state")}${inp("cc-tt", "{{ states('sensor.outside_temperature') }} °C")}
      ${L("Label", "optional, small line below")}${inp("cc-tl", "{{ relative_time(states.sensor.x.last_changed) }} ago")}
      ${L("Entity", "for details (hold) and toggling")}<input type="text" id="cc-ent" list="cc-list" placeholder="sensor.x"><datalist id="cc-list">${this._opts("")}</datalist>
      ${L("Tap")}${sel("tap", [["details", "entity details"], ["toggle", "toggle entity"], ["action", "run action"], ["path", "go to path"]])}
      ${tap === "action" ? `${L("Action", "domain.service")}${inp("cc-svc", "light.turn_on")}${L("Action data", "optional JSON")}${inp("cc-data", '{"brightness": 200}')}` : ""}
      ${tap === "path" ? `${L("Path", "e.g. /lovelace/0 or https://…")}${inp("cc-path", "/lovelace/0")}` : ""}
      <div class="lbl" style="margin-top:10px">Hold a card for about 1 second to open entity details. Hold 5 seconds to move it.</div>`;
    } else if (mode === "lovelace") {
      body = `${L("Lovelace card as JSON", "custom cards supported")}<textarea id="cc-json" placeholder='{"type":"custom:mushroom-light-card","entity":"light.x"}'></textarea>`;
    } else {
      body = `${L("Device type")}${sel("dom", [["", "All device types (" + Object.keys(this._h.states).length + ")"], ...Object.keys(doms).sort().map((k) => [k, k.replace(/_/g, " ") + " (" + doms[k] + ")"])])}
      ${L("Entity")}<input type="text" id="cc-ent" list="cc-list" placeholder="Start typing a name or entity id"><datalist id="cc-list">${this._opts(D.dom || "")}</datalist>
      ${L("Display name (optional)")}<input type="text" id="cc-name">
      ${L("Card style")}${sel("style", [["auto", "Auto – best control for this device"], ["toggle", "On / Off switch"], ["button", "Run button"], ["value", "Value / status only"]])}
      ${L("Icon")}${sel("icon", [["", "Default"], ...Object.keys(ICONS).map((k) => [k, k])])}`;
    }
    const names = [...new Set(Object.entries(this._c.custom).filter(([k]) => k !== "home").flatMap(([, a]) => a.map((x) => { const k = this._csKey(x); return k === "more" ? "More" : k.slice(3); })))];
    const svcFields = (D.place || D.room) === "home" ? "" : `${L("Service", "tile name on the home screen")}<input type="text" id="cc-sn" list="cc-sl" placeholder="More" value="${this._esc(D.sn || "")}"><datalist id="cc-sl">${names.map((n) => `<option value="${this._esc(n)}">`).join("")}</datalist>${L("Service icon", "optional, mdi name")}${inp("cc-sico", "mdi:gate")}`;
    return `<div class="ov"><div class="dlg"><h1 style="font-size:26px">New card</h1>
      ${L("Card type")}${sel("mode", [["entity", "Device card (any entity)"], ["template", "Template card (Jinja)"], ["lovelace", "Lovelace card (JSON)"]])}
      ${L("Place", "home page or a room")}${sel("place", [["home", "Home"], ...this._c.rooms.map((r) => [r.id, r.name])])}
      ${svcFields}
      ${body}
      <div class="err" id="cc-err"></div><div class="btns"><button data-cc="cancel">Cancel</button><button class="pri" data-cc="save">Add card</button></div></div></div>`;
  }
  _saveCC() {
    const q = (i) => this.shadowRoot.getElementById(i), err = (t) => { q("cc-err").textContent = t; };
    const v = (i) => (q(i) ? q(i).value.trim() : ""), D = this._dlg, mode = D.mode || "entity", place = D.place || D.room;
    let item;
    if (mode === "lovelace") {
      try { const c = JSON.parse(v("cc-json")); if (!c.type) throw new Error('"type" is missing'); item = { type: "lovelace", config: c }; } catch (e) { return err("Invalid JSON: " + e.message); }
    } else if (mode === "template") {
      const tap = D.tap || "details", ent = v("cc-ent");
      if (!v("cc-tt") && !v("cc-tl")) return err("Enter a text template");
      if (ent && !this._h.states[ent]) return err("Entity not found: " + ent);
      let data = {};
      if (tap === "action") {
        if (!/^[a-z_]+\.[a-z0-9_]+$/i.test(v("cc-svc"))) return err("Action must look like light.turn_on");
        if (v("cc-data")) { try { data = JSON.parse(v("cc-data")); } catch (e) { return err("Action data is not valid JSON"); } }
      }
      if (tap === "path" && !/^(\/|https?:)/.test(v("cc-path"))) return err("Path must start with / or http");
      item = { type: "template", name: v("cc-name"), icon: v("cc-icon") || "mdi:code-braces", text: v("cc-tt"), label: v("cc-tl"), entity: ent, tap, service: v("cc-svc"), data, path: v("cc-path") };
    } else {
      const ent = v("cc-ent");
      if (!ent || !this._h.states[ent]) return err("Pick a valid entity");
      item = { type: "entity", entity: ent, name: v("cc-name"), style: D.style || "auto", icon: D.icon || "" };
    }
    if (place !== "home") { item.svc = v("cc-sn").replace(/['"<>\\&]/g, "").slice(0, 24); const ic = v("cc-sico"); if (/^mdi:[a-z0-9-]+$/i.test(ic)) item.svcIcon = ic; }
    item.uid = this._uid();
    (this._c.custom[place] = this._c.custom[place] || []).push(item);
    this._save(true); this._dlg = null; this._syncTpl();
    this._v = place === "home" ? { p: "home" } : { p: "rooms", svc: this._csKey(item) };
    this._last = null; this._draw(true);
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
  _brand() {
    const menu = this._narrow || localStorage.getItem("quint_full") === "1" ? `<button class="ib" data-tog="menu:0">☰</button>` : "";
    return `<div class="brand">${menu}<span>${this._esc(this._c.title || this._title || "Quint")}</span></div>`;
  }
  _top(back = true) { return `<div class="top">${this._brand()}${back ? `<button class="back" data-go='{"p":"home"}'>‹ Home</button>` : ""}</div>`; }
  _credit() { const t = this._c.credit; return this._esc(t === undefined ? "By Quinteca" : t); }
  _clock(d) {
    const L = this._h && this._h.locale, f = L && L.time_format, o = { hour: "2-digit", minute: "2-digit" }, dt = d || new Date();
    if (f === "24") o.hourCycle = "h23"; else if (f === "12") o.hour12 = true;
    try { return dt.toLocaleTimeString((L && L.language) || [], o); } catch (e) { return dt.toLocaleTimeString([], o); }
  }
  _fmt(n) { const v = Math.round(+n * 10) / 10; return Number.isInteger(v) ? String(v) : v.toFixed(1); }
  _sw(on, act, ids) { return `<button class="sw ${on ? "on" : ""}" data-act="${act}" data-e="${ids.join(",")}"></button>`; }
  _groups(svc) {
    const out = [], seen = new Set();
    this._rooms().forEach((r) => { const ids = this._ents(svc, r.id); if (ids.length) out.push({ id: r.id, name: r.name, ids }); ids.forEach((i) => seen.add(i)); });
    const rest = this._ents(svc).filter((i) => !seen.has(i));
    if (rest.length) { if (!out.length) rest.forEach((i) => out.push({ id: i, name: this._nm(i), ids: [i] })); else out.push({ id: "other", name: "Other", ids: rest }); }
    return out;
  }
  _wx() {
    const S = this._h.states, id = Object.keys(S).find((i) => i.startsWith("weather."));
    if (!id) return null;
    const s = S[id], a = s.attributes;
    if (a.temperature == null) return null;
    const cond = WX[s.state] || String(s.state).replace(/[-_]/g, " "), ic = s.state === "sunny" ? SUN_I : s.state === "clear-night" ? MOON_I : CLOUD_I;
    let t = `${this._fmt(a.temperature)}° · ${cond}`;
    const sun = S["sun.sun"];
    if (sun) { const below = sun.state === "below_horizon", iso = below ? sun.attributes.next_rising : sun.attributes.next_setting; if (iso && !isNaN(Date.parse(iso))) t += ` · ${below ? "Sunrise" : "Sunset"} ${this._clock(new Date(iso))}`; }
    return { ic, t: this._esc(t), s: this._esc(`${Math.round(a.temperature)}° ${cond.toLowerCase()}`) };
  }
  _scenes() {
    const ids = Object.keys(this._h.states).filter((i) => i.startsWith("scene.") && !this._c.hide.includes(i)).slice(0, 6);
    let best = "", bt = 0;
    ids.forEach((i) => { const t = Date.parse(this._h.states[i].state); if (t > bt) { bt = t; best = i; } });
    return ids.map((i) => ({ id: i, nm: this._nm(i), on: i === best && Date.now() - bt < 6 * 3600e3 }));
  }
  _sec(i) {
    const s = this._h.states[i], d = i.split(".")[0], dc = s.attributes.device_class, v = s.state, cap = (x) => x.charAt(0).toUpperCase() + x.slice(1).replace(/_/g, " ");
    if (v === "unavailable" || v === "unknown") return ["Unavailable", ""];
    if (d === "alarm_control_panel") { const M = { disarmed: "Disarmed", armed_home: "Armed, home", armed_away: "Armed, away", armed_night: "Armed, night", armed_vacation: "Armed, vacation", armed_custom_bypass: "Armed, custom", arming: "Arming…", pending: "Pending", disarming: "Disarming…", triggered: "Triggered" }; return [M[v] || cap(v), v === "triggered" ? "b" : ""]; }
    if (d === "lock") return v === "locked" ? ["Locked", ""] : [cap(v), "w"];
    if (d === "cover") return v === "closed" ? ["Closed", ""] : [cap(v), "w"];
    if (["motion", "occupancy", "presence"].includes(dc)) return [v === "on" ? "Detected" : "Clear", ""];
    if (dc === "tamper") return v === "on" ? ["Tampered", "w"] : ["OK", ""];
    return v === "on" ? ["Open", "w"] : ["Closed", ""];
  }
  _bento(k) {
    const H = this._h.states, st = (i) => H[i].state, S = SV[k], go = this._tileGo(k), E = (t) => this._esc(t);
    const hd = (r, ic) => `<div class="bh" ${go}><span>${S.n}</span><span class="bs">${r || ""}${ic || ""}</span></div>`;
    const wrap = (cls, inner) => `<div class="bc ${cls}" data-id="b:${E(k)}">${inner}</div>`;
    if (k === "lights") {
      const gr = this._groups("lights"), all = gr.flatMap((g) => g.ids), onN = all.filter((i) => st(i) === "on").length, rooms = gr.filter((g) => g.ids.some((i) => st(i) === "on")).length;
      const rows = gr.slice(0, 5).map((g) => {
        const on = g.ids.filter((i) => st(i) === "on"), br = on.map((i) => H[i].attributes.brightness).filter((b) => b != null);
        const lab = !on.length ? "Off" : br.length ? Math.round(br.reduce((a, b) => a + b, 0) / br.length / 2.55) + "%" : "On";
        return `<div class="rw" data-id="lr:${E(g.id)}"><span class="nmx">${E(g.name)}</span><span class="rr"><span class="mu">${lab}</span>${this._sw(on.length > 0, on.length ? "light.turn_off" : "light.turn_on", g.ids)}</span></div>`;
      }).join("");
      const r = gr.length > 1 && this._rooms().length ? `${rooms} room${rooms === 1 ? "" : "s"} on` : `${onN} of ${all.length} on`;
      return wrap("", `${hd(r)}<div class="rows">${rows}</div>${gr.length > 5 ? `<div class="lbl" ${go} style="cursor:pointer">+ ${gr.length - 5} more ›</div>` : ""}`);
    }
    if (k === "cameras") {
      const cams = this._ents("cameras"), live = cams.filter((i) => H[i].attributes.entity_picture && !["unavailable", "unknown"].includes(st(i))), id = live[0];
      if (!id) return wrap("", `${hd(`${cams.length} camera${cams.length === 1 ? "" : "s"}`)}<div class="cvw" style="cursor:default"><span>No camera online</span></div>`);
      const src = this._h.hassUrl(H[id].attributes.entity_picture);
      return wrap("", `<div class="cvw" data-cam="${id}"><img class="cam" data-src="${src}" src="${src}"><span class="cn">${E(this._nm(id))}</span><span class="live">Live</span></div><div class="cb"><button class="wb" data-cam="${id}">Open</button><button class="ob" ${go}>All cameras · ${cams.length}</button></div>`);
    }
    if (k === "security") {
      const ids = this._ents("security"), dom = (i) => i.split(".")[0], isM = (i) => ["motion", "occupancy", "presence"].includes(H[i].attributes.device_class);
      const al = ids.filter((i) => dom(i) === "alarm_control_panel"), lk = ids.filter((i) => dom(i) === "lock"), oth = ids.filter((i) => !al.includes(i) && !lk.includes(i));
      const rows = [...al, ...lk, ...oth.filter((i) => !isM(i)), ...oth.filter(isM)].slice(0, 4).map((i) => { const [t, c] = this._sec(i); return `<div class="rw" data-id="sr:${i}"><span class="nmx">${E(this._nm(i))}</span><span class="v ${c}">${E(t)}</span></div>`; }).join("");
      const lv = ids.map((i) => this._sec(i)[1]), nb = lv.filter((x) => x === "b").length, nw = lv.filter((x) => x === "w").length, cls = nb ? "b" : nw ? "w" : "";
      const ap = al[0], seg = ap ? `<div class="seg">${[["Off", "alarm_disarm", "disarmed"], ["Home", "alarm_arm_home", "armed_home"], ["Night", "alarm_arm_night", "armed_night"], ["Away", "alarm_arm_away", "armed_away"]].map(([l, s, x]) => `<button class="${st(ap) === x ? "on" : ""}" data-act="alarm_control_panel.${s}" data-e="${ap}">${l}</button>`).join("")}</div>` : "";
      return wrap("", `${hd("", SHIELD_I)}<div class="st2"><span class="sd ${cls}"></span>${nb ? "Alarm triggered" : nw ? `${nw} open` : "All secure"}</div><div class="rows">${rows}</div>${seg}`);
    }
    if (k === "climate") {
      const cl = this._ents("climate"), isOff = (i) => ["off", "unavailable", "unknown"].includes(st(i)), id = cl.find((i) => !isOff(i)) || cl[0], a = H[id].attributes, off = isOff(id);
      const cur = a.current_temperature != null ? a.current_temperature : a.temperature, tg = a.temperature, step = a.target_temp_step || 0.5, rm = this._rooms().find((r) => r.id === this._roomOf(id));
      const verb = a.hvac_action === "heating" ? "Heating to " : a.hvac_action === "cooling" ? "Cooling to " : "Set to ";
      const cap = (off ? "Off" : tg != null ? verb + this._fmt(tg) + "°" : st(id)) + (a.current_humidity != null ? ` · humidity ${a.current_humidity}%` : "");
      const x = (v) => `{"temperature":${Math.round(v * 10) / 10}}`;
      const bt = tg != null && !off ? `<div class="rbs"><button class="rb2" data-act="climate.set_temperature" data-e="${id}" data-x='${x(tg - step)}'>−</button><button class="rb2" data-act="climate.set_temperature" data-e="${id}" data-x='${x(+tg + step)}'>+</button></div>` : "";
      return wrap("", `${hd(E(rm ? rm.name : this._nm(id)))}<div class="cl"><div><div class="sbig">${cur != null ? this._fmt(cur) : "–"}<sup>°</sup></div><div class="cap2">${E(cap)}</div></div>${bt}</div>`);
    }
    if (k === "media") {
      const pl = this._ents("media"), pick = ["playing", "paused", "on", "idle"].map((s) => pl.find((i) => st(i) === s)).find(Boolean) || pl[0], a = H[pick].attributes, playing = pl.filter((i) => st(i) === "playing");
      const art = a.entity_picture ? this._h.hassUrl(a.entity_picture) : "", names = (playing.length ? playing : [pick]).map((i) => this._nm(i));
      const joined = names.length > 1 ? names.slice(0, -1).join(", ") + " and " + names[names.length - 1] : names[0], isP = st(pick) === "playing";
      const cap = (playing.length ? "Playing on " : st(pick) === "paused" ? "Paused on " : "") + joined;
      const ctl = (act, ic, cls) => `<button ${cls ? `class="${cls}"` : ""} data-act="media_player.${act}" data-e="${pick}">${ic}</button>`;
      return wrap("wide", `<div class="md"><div class="art">${art ? `<img src="${art}">` : MUSIC_I}</div><div class="mt"><div class="pc" ${go} style="cursor:pointer">${E(cap)}</div><div class="tt">${E(a.media_title || (isP ? "Playing" : "Nothing playing"))}</div>${a.media_artist ? `<div class="ar">${E(a.media_artist)}</div>` : ""}</div><div class="mc">${ctl("media_previous_track", PREV_I)}${ctl("media_play_pause", isP ? PAUSE_I : PLAY_I, "pp")}${ctl("media_next_track", NEXT_I)}</div><div class="vol">${VOL_I}<input type=range min=0 max=100 value=${Math.round((a.volume_level || 0) * 100)} data-slider="media_player|volume_set|volume_level|100" data-e="${pick}"></div></div>`);
    }
    if (k === "shades") {
      const sh = this._ents("shades"), pos = sh.map((i) => H[i].attributes.current_position).filter((p) => p != null), avg = pos.length ? Math.round(pos.reduce((a, b) => a + b, 0) / pos.length) : null;
      const open = sh.filter((i) => ["open", "opening"].includes(st(i))).length, all = sh.join(",");
      return wrap("", `${hd(`${sh.length} window${sh.length === 1 ? "" : "s"}`)}<div class="cen"><div class="shv"><i style="height:${avg != null ? 100 - avg : open ? 0 : 100}%"></i></div><div class="bigs">${avg != null ? avg + "%" : `${open}/${sh.length}`}<small>${avg != null ? "open" : "open / total"}</small></div></div><div class="btn3"><button data-act="cover.open_cover" data-e="${all}">Open</button><button data-act="cover.set_cover_position" data-e="${all}" data-x='{"position":50}'>Half</button><button data-act="cover.close_cover" data-e="${all}">Close</button></div>`);
    }
    const t = this._stats(k);
    return wrap("", `${hd("", S.i)}<div class="cnt">${t.big}</div><div class="cap2">${t.big ? t.lbl : "No cards yet · tap to open"}</div>`);
  }
  _home() {
    const c = this._c, hr = new Date().getHours(), g = hr < 12 ? "Good morning" : hr < 18 ? "Good afternoon" : "Good evening";
    const who = c.name || (this._h.user && this._h.user.name) || "", L = this._svcs(), wx = c.noWeather ? null : this._wx(), sc = c.noScenes ? [] : this._scenes();
    const date = new Date().toLocaleDateString((this._h.locale && this._h.locale.language) || undefined, { weekday: "long", day: "numeric", month: "long" });
    const left = `<div class="hl">${this._brand()}${c.noClock ? "" : `<div class="clk">@@T@@</div>`}<div class="dt">${this._esc(date)}</div>${wx ? `<div class="wx">${wx.ic}<span>${wx.t}</span></div>` : ""}<div class="gr">${g}${who ? ", " + this._esc(who) : ""}</div>${sc.length ? `<div class="scn"><div class="cap">Scenes</div><div class="scg">${sc.map((s) => `<button class="scb ${s.on ? "on" : ""}" data-id="sc:${s.id}" data-act="scene.turn_on" data-e="${s.id}"><i></i><span>${this._esc(s.nm)}</span></button>`).join("")}</div></div>` : ""}</div>`;
    const cards = L.map((k) => this._bento(k)).join(""), cr = this._credit();
    return `<div class="home">${left}<div class="hr"><div class="bento">${cards || '<div class="bc wide">No supported devices found.</div>'}</div>${this._homeCards()}${cr ? `<div class="crm">${cr}</div>` : ""}</div></div>`;
  }
  _areaPage() {
    const rs = this._rooms(), L = this._svcs(), adm = this._admin(), H = this._h.states, st = (i) => H[i].state, E = (t) => this._esc(t);
    const has = (r, s) => (isCs(s) ? this._csItems(r.id, s).length : this._ents(s, r.id).length);
    const room = rs.find((r) => r.id === this._v.room) || rs.find((r) => L.some((s) => has(r, s))) || rs[0];
    if (!room) return `<div class="area"><div class="rl">${this._brand()}</div><div class="bc">No rooms yet. Add rooms in Settings.</div></div>`;
    const rid = room.id, wx = this._c.noWeather ? null : this._wx();
    const list = rs.map((r) => { const l = L.includes("lights") ? this._ents("lights", r.id) : [], on = l.filter((i) => st(i) === "on").length; return `<button class="rli ${r.id === rid ? "act" : ""}" data-id="rl:${E(r.id)}" data-go='${JSON.stringify({ p: "room", room: r.id })}'><span>${E(r.name)}</span><small class="${on ? "" : "off"}">${l.length ? (on ? on + " on" : "Off") : ""}</small></button>`; }).join("");
    const lights = L.includes("lights") ? this._ents("lights", rid) : [], onL = lights.filter((i) => st(i) === "on");
    const cl = L.includes("climate") ? this._ents("climate", rid) : [], sh = L.includes("shades") ? this._ents("shades", rid) : [];
    const pos = sh.map((i) => H[i].attributes.current_position).filter((p) => p != null), avg = pos.length ? Math.round(pos.reduce((a, b) => a + b, 0) / pos.length) : null;
    const sub = [lights.length ? `${onL.length} of ${lights.length} lights on` : "", cl.length && H[cl[0]].attributes.current_temperature != null ? this._fmt(H[cl[0]].attributes.current_temperature) + "°" : "", avg != null ? `${SV.shades.n.toLowerCase()} ${avg}% open` : ""].filter(Boolean).join(" · ");
    const scenes = Object.keys(H).filter((i) => i.startsWith("scene.") && !this._c.hide.includes(i) && this._roomOf(i) === rid);
    const chips = scenes.length ? `<div class="chips">${scenes.map((i) => `<button class="scb" data-id="sc:${i}" data-act="scene.turn_on" data-e="${i}"><i></i><span>${E(this._nm(i))}</span></button>`).join("")}</div>` : "";
    const sec = [];
    [...L.filter((x) => ["lights", "shades", "climate"].includes(x)).sort((p, q) => ["lights", "shades", "climate"].indexOf(p) - ["lights", "shades", "climate"].indexOf(q)), ...L.filter((x) => !["lights", "shades", "climate"].includes(x))].forEach((s) => {
      if (!has(room, s)) return;
      if (s === "lights") {
        const rows = lights.map((i) => {
          const a = H[i].attributes, isOn = st(i) === "on", b = a.brightness || 0, dim = !(a.supported_color_modes || []).every((m) => m === "onoff") && st(i) !== "unavailable";
          return `<div class="lr" data-id="l:${i}"><button class="ln" data-act="light.toggle" data-e="${i}">${E(this._nm(i))}</button>${dim ? `<input type=range min=1 max=255 value=${b} data-slider="light|turn_on|brightness|1" data-e="${i}"><span class="lp">${isOn ? Math.round(b / 2.55) + "%" : "Off"}</span>` : `<span></span>${this._sw(isOn, "light.toggle", [i])}`}</div>`;
        }).join("");
        sec.push(`<div class="bc tall" data-id="a:lights"><div class="bh" ${this._tileGo(s)}><span>${SV.lights.n}</span><span class="bs">${onL.length} on</span></div>${rows}</div>`);
      } else if (s === "shades") {
        const all = sh.join(","), open = sh.filter((i) => ["open", "opening"].includes(st(i))).length;
        sec.push(`<div class="bc" data-id="a:shades"><div class="bh" ${this._tileGo(s)}><span>${SV.shades.n}</span><span class="bs">${sh.length} window${sh.length === 1 ? "" : "s"}</span></div><div class="cen"><div class="shv"><i style="height:${avg != null ? 100 - avg : open ? 0 : 100}%"></i></div><div class="bigs">${avg != null ? avg + "%" : `${open}/${sh.length}`}<small>${avg != null ? "open" : "open / total"}</small></div></div><div class="btn3"><button data-act="cover.open_cover" data-e="${all}">Open</button><button data-act="cover.set_cover_position" data-e="${all}" data-x='{"position":50}'>Half</button><button data-act="cover.close_cover" data-e="${all}">Close</button></div></div>`);
      } else if (s === "climate") {
        const id = cl[0], a = H[id].attributes, off = ["off", "unavailable", "unknown"].includes(st(id)), tg = a.temperature, step = a.target_temp_step || 0.5, x = (v) => `{"temperature":${Math.round(v * 10) / 10}}`;
        const verb = a.hvac_action === "heating" ? "heating to " : a.hvac_action === "cooling" ? "cooling to " : "set to ";
        const txt = `${a.current_temperature != null ? this._fmt(a.current_temperature) + "° now" : st(id)}${off ? " · off" : tg != null ? " · " + verb + this._fmt(tg) + "°" : ""}`;
        sec.push(`<div class="bc" data-id="a:climate"><div class="bh" ${this._tileGo(s)}><span>${SV.climate.n}</span></div><div class="cl"><div class="cap2" style="margin:0;font-size:15px">${E(txt)}</div>${tg != null && !off ? `<div class="rbs"><button class="rb2" data-act="climate.set_temperature" data-e="${id}" data-x='${x(tg - step)}'>−</button><button class="rb2" data-act="climate.set_temperature" data-e="${id}" data-x='${x(+tg + step)}'>+</button></div>` : ""}</div></div>`);
      } else {
        const inner = isCs(s) ? this._customCards(rid, "room:" + rid + ":" + s, s) : this._cardsOf(this._ents(s, rid), "room:" + rid + ":" + s);
        sec.push(`<div class="bc ${s === "media" || s === "cameras" ? "span2" : ""}" data-id="a:${E(s)}"><div class="bh" ${this._tileGo(s)}><span>${SV[s].n}</span></div><div class="grid" data-grid="room:${rid}:${s}">${inner}</div></div>`);
      }
    });
    if (!sec.length) sec.push(`<div class="bc span2" data-id="a:none"><div class="lbl">Nothing in this room yet.</div></div>`);
    if (adm) sec.push(`<div class="tile add span2" data-id="a:add" data-cc="open:${rid}"><div class="bdg" style="--c:#8d9ab8">＋</div><div class="nm">Add card</div></div>`);
    return `<div class="area"><div class="rl">${this._brand()}<div class="cap rcap">Rooms</div><div class="rlist">${list}</div><div class="ft"><span class="tm">@@T@@</span>${wx ? " · " + wx.s : ""}</div></div><div class="rm2"><div class="ah"><div><h1>${E(room.name)}</h1>${sub ? `<div class="sub">${E(sub)}</div>` : ""}</div>${lights.length ? `<button class="ob2" data-act="light.turn_off" data-e="${lights.join(",")}">All off</button>` : ""}</div>${chips}<div class="abody">${sec.join("")}</div></div></div>`;
  }
  _camView() {
    const id = this._cam, s = id && this._h.states[id];
    if (!s || !s.attributes.entity_picture) return "";
    const E = (t) => this._esc(t), cams = this._ents("cameras").filter((i) => this._h.states[i].attributes.entity_picture);
    const snap = this._h.hassUrl(s.attributes.entity_picture), stream = snap.replace("/camera_proxy/", "/camera_proxy_stream/");
    const arrows = cams.length > 1 ? `<button class="ib" data-cam="prev">‹</button><button class="ib" data-cam="next">›</button>` : "";
    return `<div class="camv" data-cam="bg"><div class="vh"><span class="live">Live</span><span class="vt">${E(this._nm(id))}</span><span class="grow"></span>${arrows}<button class="ib" data-cam="close">✕</button></div><div class="vb"><img class="camx" data-cam="keep" data-src="${stream}" data-snap="${snap}" src="${this._camFb ? snap : stream}"></div><div class="vf">${cams.map((i) => `<button class="cc2 ${i === id ? "on" : ""}" data-id="cc:${i}" data-cam="${i}">${E(this._nm(i))}</button>`).join("")}</div></div>`;
  }
  _roomsPage() {
    const s = this._v.svc;
    if (isCs(s)) return this._csPage(s);
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
    return `${this._top()}<h1>${SV[s].i} ${SV[s].n}</h1><div class="sub">${total} active · grouped by room</div>${parts.join("")}`;
  }
  _list(s) {
    return `${this._top()}<h1>${SV[s].i} ${SV[s].n}</h1><div class="grid" data-grid="list:${s}" style="grid-template-columns:repeat(auto-fill,minmax(${s === "cameras" ? 320 : 200}px,1fr))">${this._cardsOf(this._ents(s), "list:" + s)}</div>`;
  }
  _settings() {
    const E = (t) => this._esc(t), c = this._c, tab = this._v.tab || "general";
    const row = (l, sub, ctl) => `<div class="srow"><div class="sl"><div class="sn">${l}</div>${sub ? `<div class="ss">${sub}</div>` : ""}</div><div class="sc">${ctl}</div></div>`;
    const sec = (t, note, rows) => `<div class="ssec"><div class="shd"><span>${t}</span>${note ? `<small>${note}</small>` : ""}</div>${rows}</div>`;
    const tg = (on, a) => `<button class="sw ${on ? "on" : ""}" ${a}></button>`;
    const up = (a, v, off) => `<button class="ib2" data-s="${a}|${v}" ${off ? "disabled" : ""}>${a.endsWith("up") ? "▲" : "▼"}</button>`;
    const tabs = [["general", "General", "title, background, layout"], ["pages", "Pages", "services, order, titles"], ["rooms", "Rooms", "which ones and in which order"], ["devices", "Devices", "room and visibility per device"], ["home", "Home page", "clock, weather, scenes, services"], ["cards", "Cards", "custom cards you added"]];
    let body = "";
    if (tab === "general") {
      const bg = { preset: "midnight", mode: "preset", dim: 0, blur: 0, ...(c.bg || {}) }, dv = localStorage.getItem("quint_dev") || "auto";
      body = sec("Settings file", "settings are stored on the server and shared by every user; a file makes them portable",
        row("Export", "download all settings as JSON", `<button class="sbtn" data-s="export|">Download</button>`) +
        row("Import", "an export; merged with what is already there", `<input type="file" accept=".json,application/json" data-import="1">`)) +
      sec("Appearance", "",
        row("Client name", "written top left on every page", `<input type="text" data-ttl value="${E(c.title || "")}" placeholder="${E(this._title || "Quint")}">`) +
        row("Bottom text", "written next to the settings button, bottom right (empty = hide)", `<input type="text" data-cred value="${E(c.credit === undefined ? "By Quinteca" : c.credit)}" placeholder="By Quinteca">`) +
        row("Greeting name", "shown on the home page", `<input type="text" data-uname value="${E(c.name || "")}" placeholder="${E((this._h.user && this._h.user.name) || "")}">`)) +
      sec("Background", "everything sits on top of this",
        row("Theme", "colour themes", Object.keys(BG).map((k) => `<button class="swt ${bg.mode !== "image" && bg.preset === k ? "sel" : ""}" style="background:${SWATCH[k]}" title="${k}" data-s="bgp|${k}"></button>`).join("")) +
        row("Photo", "your own picture; jpg or png, shrunk to fit automatically", `<input type="file" accept="image/*" data-bgfile="1">${this._bgData ? `<button class="sbtn" data-s="bgm|">${bg.mode === "image" ? "In use" : "Use photo"}</button><button class="sbtn" data-s="bgx|">Remove</button>` : ""}`) +
        row("Darken", "easier to read text on a bright photo", `<input type="range" min="0" max="80" value="${+bg.dim || 0}" data-bg="dim">`) +
        row("Blur", "soften the background", `<input type="range" min="0" max="20" value="${+bg.blur || 0}" data-bg="blur">`)) +
      sec("This device", "saved on this device only",
        row("Screen layout", `Detected: ${this._auto || "–"} · ${this._w || 0}px wide`, `<select data-devsel="1">${[["auto", "Auto"], ["phone", "Phone"], ["tablet", "Tablet"], ["desktop", "Desktop / wall panel"]].map(([v, l]) => `<option value="${v}" ${dv === v ? "selected" : ""}>${l}</option>`).join("")}</select>`) +
        row("Fullscreen", "hide the Home Assistant sidebar", tg(localStorage.getItem("quint_full") === "1", 'data-tog="full:0"')));
    } else if (tab === "pages") {
      const all = this._svcsAll(), H = c.svcHide || [], T = c.svcTitle || {};
      body = sec("Pages", "name, show and order the services on the home screen and bottom bar", all.map((k, i) => {
        const def = SV_DEF[k] || k.slice(3);
        return row(`${SV[k].i} ${E(def)}`, H.includes(k) ? "hidden" : "shown", `<input type="text" data-svct="${E(k)}" value="${E(T[k] || "")}" placeholder="${E(def)}">${tg(!H.includes(k), `data-s="svcvis|${E(k)}"`)}${up("svcup", E(k), i === 0)}${up("svcdn", E(k), i === all.length - 1)}`);
      }).join(""));
    } else if (tab === "rooms") {
      body = sec("Rooms", "which ones and in which order", c.rooms.map((r, i) => row(E(r.id), "", `<input type="text" data-rname="${i}" value="${E(r.name)}">${tg(r.on !== false, `data-tog="room:${i}"`)}${up("rup", i, i === 0)}${up("rdn", i, i === c.rooms.length - 1)}<button class="ib2" data-tog="del:${i}">✕</button>`)).join("") +
        `<div class="btns"><button data-tog="add:0">＋ Add room</button><button data-tog="import:0">Re-import from HA areas</button></div>`);
    } else if (tab === "devices") {
      const q = (this._dflt || "").toLowerCase(), H = c.hide || [];
      const list = Object.keys(this._h.states).filter((i) => this._svcOf(i)).filter((i) => !q || i.includes(q) || this._nm(i).toLowerCase().includes(q));
      body = sec("Devices", `${Math.min(list.length, 200)} of ${list.length} shown`, row("Search", "filter by name or entity id", `<input type="text" data-dfilter value="${E(this._dflt || "")}" placeholder="light.kitchen">`) +
        list.slice(0, 200).map((id) => row(`${SV[this._svcOf(id)].i} ${E(this._nm(id))}`, E(id), `<select data-map="${E(id)}"><option value="">(no room)</option>${c.rooms.map((r) => `<option value="${E(r.id)}" ${this._roomOf(id) === r.id ? "selected" : ""}>${E(r.name)}</option>`).join("")}</select>${tg(!H.includes(id), `data-tog="hide:${E(id)}"`)}`)).join(""));
    } else if (tab === "home") {
      const all = this._svcsAll(), H = c.svcHide || [], hid = c.hide || [], sc = Object.keys(this._h.states).filter((i) => i.startsWith("scene.")).slice(0, 40);
      body = sec("Home screen", "what the home page shows",
        row("Clock", "the big clock on the left", tg(!c.noClock, 'data-s="flag|noClock"')) +
        row("Weather line", "temperature, condition and sunset", tg(!c.noWeather, 'data-s="flag|noWeather"')) +
        row("Scenes", "buttons under the greeting (your Home Assistant scenes)", tg(!c.noScenes, 'data-s="flag|noScenes"')) +
        row("Rooms tab", "the page with the list of rooms", tg(!c.noRooms, 'data-s="flag|noRooms"'))) +
      sec("Services", "show or hide a card on the home page and its tab in the bottom bar",
        all.map((k) => row(`${SV[k].i} ${E(SV[k].n)}`, H.includes(k) ? "hidden" : "shown", tg(!H.includes(k), `data-s="svcvis|${E(k)}"`))).join("")) +
      (sc.length ? sec("Scenes", "choose which scenes are shown (the first 6 are used)", sc.map((id) => row(E(this._nm(id)), E(id), tg(!hid.includes(id), `data-tog="hide:${E(id)}"`))).join("")) : "");
    } else {
      const items = Object.entries(c.custom).flatMap(([pl, arr]) => arr.map((it, i) => ({ pl, it, i })));
      body = sec("Cards", "custom cards you added", (items.map(({ pl, it, i }) => {
        const room = pl === "home" ? "Home page" : (c.rooms.find((r) => r.id === pl) || { name: pl }).name, k = this._csKey(it);
        const st = this._h.states[it.entity], nm = it.name || (it.type === "lovelace" ? (it.config && it.config.type) || "Lovelace card" : it.text) || (st && st.attributes.friendly_name) || it.entity;
        return row(E(nm), `${E(room)} · ${pl === "home" ? "My cards" : k === "more" ? "More" : E(k.slice(3))} · ${it.type}`, `<button class="ib2" data-cc="del:${pl}:${i}">✕</button>`);
      }).join("") || '<div class="lbl" style="padding:6px 4px 12px">No custom cards yet.</div>') + `<div class="btns"><button class="pri" data-cc="open:home">＋ Add card</button></div>`);
    }
    const tabsHtml = tabs.map(([id, t, sub]) => `<button class="sti ${tab === id ? "act" : ""}" data-go='${JSON.stringify({ p: "settings", tab: id })}'>${SET_I[id]}<span><b>${t}</b><small>${sub}</small></span></button>`).join("");
    return `${this._top(false)}<div class="sbar"><div><h1>Settings</h1><div class="sub">Stored on the server for every user · Quint v${VER} · ${this._rn || 0} screen updates</div></div><div class="sbtns"><button class="sbtn ${this._dirty ? "pri2" : ""}" data-s="save|">Save</button><button class="sbtn" data-s="reset|">Reset everything</button><button class="sbtn" data-s="close|">Close</button></div></div><div class="sg"><div class="snav">${tabsHtml}</div><div>${body}</div></div>`;
  }

  /* ---------- render ---------- */
  _draw(force) {
    if (!this._h || !this._loaded || this._mv || this._hold) return;
    this._syncSv(); this._titles();
    const ae = this.shadowRoot.activeElement;
    if (!force && (this._drag || (ae && ["INPUT", "SELECT"].includes(ae.tagName)))) return;
    if (this._v.p === "settings" && !this._admin()) this._v = { p: "home" };
    this._track = new Set(Object.keys(this._h.states).filter((i) => this._svcOf(i) || i.startsWith("scene.") || i.startsWith("weather.") || i === "sun.sun"));
    Object.values(this._c.custom).flat().forEach((x) => x.entity && this._track.add(x.entity));
    this._seen = {}; this._track.forEach((i) => (this._seen[i] = this._h.states[i]));
    this._n = Object.keys(this._h.states).length;
    const p = this._v.p, V = this._v, c = this._c;
    if (this._cam && !(this._h.states[this._cam] && this._h.states[this._cam].attributes.entity_picture)) this._cam = null;
    let body = p === "home" ? this._home() : p === "rooms" ? this._roomsPage() : p === "room" ? this._areaPage() : p === "cameras" ? this._list("cameras") : p === "security" ? this._list("security") : this._settings();
    if (p !== "home" && p !== "room") body = `<div class="page">${body}</div>`;
    const tab = (cls, go, ic, t, st) => `<button class="t ${cls}" ${st || ""} ${go}>${ic}<span>${t}</span></button>`;
    const tabs = tab(p === "home" ? "act" : "", `data-go='{"p":"home"}'`, HOME_I, "Home") +
      (c.noRooms || !this._rooms().length ? "" : tab(p === "room" ? "act" : "", `data-go='{"p":"room"}'`, ICONS.door, "Rooms")) +
      this._svcs().map((s) => tab((p === "rooms" && V.svc === s) || p === s ? "act" : "", this._tileGo(s), SV[s].i, SV[s].n)).join("");
    const cr = this._credit(), adm = this._admin();
    const sy = this.scrollTop;
    const vk = JSON.stringify(V), changed = this._vk !== vk;
    const html = `<div class="bgl"><i></i></div><div class="app"><main class="${changed ? "anim" : ""}">${body}</main><nav><div class="tabs2">${tabs}</div><div class="nr">${cr ? `<span class="cr">${cr}</span>` : ""}${adm ? `<button class="gb" data-go='{"p":"settings"}'>${GEAR_I}</button>` : ""}</div></nav></div>${this._dialog()}${this._camView()}`;
    if (html === this._last) { Object.values(this._lvc || {}).forEach((e) => (e.hass = this._h)); return; }
    this._last = html; this._vk = vk;
    const tpl = document.createElement("template");
    tpl.innerHTML = html.replaceAll("@@T@@", this._time());
    this._morph(this._root, tpl.content);
    this._rn = (this._rn || 0) + 1;
    this.scrollTop = changed ? 0 : sy;
    this._mountLv();
  }
}
customElements.define("quint-panel", QuintDashboard);
console.info("%c QUINT %c panel v" + VER + " loaded", "background:#f5a623;color:#000", "");
