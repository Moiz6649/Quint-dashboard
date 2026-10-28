/* Quint auto house: builds a tidy house plan from the floors and rooms of the dashboard.
 *
 * One plan, one result:
 *   - toBuilding(): the building of Quinteca 3D (rooms, walls, doors, windows, furniture, lamps)
 * The plan is deterministic: the same floors, rooms and sizes always give the same house.
 * Plain functions only, no access to the page, so it can be tested on its own.
 */

/* ---------- what a room is ---------- */
// the first rule that matches the name (or the id) wins; the order matters ("Waschküche" is a laundry, not a kitchen)
const KIND_RULES = [
  ["garage", /garage|carport|كراج|جراج|garaje/],
  ["outdoor", /garten|garden|terrass|terrace|balkon|balcony|patio|\bpool|\bhof\b|yard|outdoor|außen|aussen|\bdach\b|roof|veranda|حديقة|شرفة|بلكونة|مسبح|فناء|سطح/],
  ["laundry", /wasch|laundry|hauswirtschaft|lavander|مغسلة|غسيل/],
  ["kitchen", /küche|kueche|kitchen|cocina|cuisine|cucina|keuken|مطبخ/],
  ["dining", /essz|dining|comedor|salle à manger|سفرة|طعام/],
  ["wc", /\bwc\b|toilet|toilette|aseo|دورة مياه|مرحاض/],
  ["bath", /(^|[^a-zäöü])bad|bath|dusch|shower|ba[nñ]o|salle de bain|حمام|wellness|sauna/],
  ["tech", /heizung|technik|heizraum|boiler|server|\bhwr\b|غرفة الخدمات/],
  ["storage", /vorrat|abstell|storage|kammer|speicher|closet|ankleide|dressing|pantry|lager|مخزن|خزانة|\bboden\b/],
  ["hall", /flur|diele|korridor|\bhall\b|entry|entr[ée]e|eingang|vestibul|foyer|corridor|treppe|stair|ممر|مدخل|دهليز|درج/],
  ["office", /büro|buero|office|arbeit|study|escritorio|مكتب|home ?office/],
  ["kids", /kind|\bkid|child|baby|nursery|jugend|teen|أطفال|طفل/],
  ["guest", /gäste|gaeste|guest|besuch|ضيوف|ضيف/],
  ["bed", /schlaf|bed|master|suite|dormitor|chambre|غرفة نوم|نوم|ماستر/],
  ["living", /wohn|living|lounge|salon|stube|\bsala\b|majlis|family|مجلس|صالة|معيشة|جلوس/],
  ["hobby", /hobby|spiel|game|play|gym|fitness|keller|basement|cellar|werkstatt|workshop|musik|music|kino|cinema|نادي|رياضة|ألعاب|قبو/],
];
export function kindOf(name, id) {
  const t = (String(name || "") + " " + String(id || "").replace(/_/g, " ")).toLowerCase();
  for (const [k, re] of KIND_RULES) if (re.test(t)) return k;
  return "other";
}
export const KIND_LABEL = {
  living: "Living room", dining: "Dining room", kitchen: "Kitchen", bed: "Bedroom", kids: "Kids' room", guest: "Guest room", bath: "Bathroom", wc: "WC",
  hall: "Hall", office: "Office", garage: "Garage", laundry: "Laundry", storage: "Storage", tech: "Utility room", hobby: "Hobby room", outdoor: "Outdoor", other: "Room",
};
// the area a room gets (m²) and its place in the reading order of the plan: public rooms first, bedrooms and baths after
const KIND_AREA = { living: 30, dining: 14, kitchen: 15, bed: 15, kids: 13, guest: 12, bath: 8, wc: 3.6, hall: 9, office: 11, garage: 22, laundry: 7, storage: 6, tech: 6, hobby: 20, other: 10 };
const KIND_ORDER = { living: 1, dining: 1.2, kitchen: 1.4, hall: 2, wc: 2.2, office: 2.5, laundry: 2.8, storage: 3, tech: 3.1, hobby: 3.5, other: 3.8, bed: 4, bath: 4.2, kids: 4.4, guest: 4.6, garage: 4.8 };
const SIZE_MUL = { s: 0.72, m: 1, l: 1.4 };
const KIND_MIN = { wc: 1.3, bath: 1.7, storage: 1.4, tech: 1.4, laundry: 1.6, hall: 1.5 };
// floor material of Quinteca 3D and the colourful floor of the picture
const KIND_MAT = { living: "oak", dining: "oak", kitchen: "tiles", bed: "wood", kids: "carpet", guest: "wood", bath: "tiles", wc: "tiles", hall: "stone", office: "wood", garage: "concrete", laundry: "tiles", storage: "concrete", tech: "concrete", hobby: "carpet", other: "wood" };

/* ---------- furniture catalog of Quinteca 3D: [width, depth, height] in m ---------- */
const CAT = {
  sofa: [2.2, 0.92, 0.82], armchair: [0.85, 0.85, 0.8], tv_board: [1.8, 0.42, 0.5], coffee_table: [1.1, 0.6, 0.42], rug: [2.4, 1.6, 0.01], plant: [0.45, 0.45, 1.1],
  shelf: [0.9, 0.35, 1.9], sideboard: [1.6, 0.45, 0.8], table: [1.6, 0.9, 0.75], table_round: [1.1, 1.1, 0.75], chair: [0.46, 0.5, 0.9], bed: [1.6, 2.05, 0.9], nightstand: [0.45, 0.4, 0.5],
  wardrobe: [1.8, 0.6, 2.1], dresser: [1, 0.5, 0.9], kitchen: [0.6, 0.62, 0.92], fridge: [0.6, 0.65, 1.8], sink: [0.9, 0.62, 0.92], stove: [0.6, 0.62, 0.92], dishwasher: [0.6, 0.62, 0.92],
  kitchen_wall: [0.8, 0.35, 0.7], island: [1.8, 0.9, 0.92], bathtub: [1.7, 0.75, 0.58], shower: [0.9, 0.9, 2], wc: [0.38, 0.6, 0.8], washbasin: [0.6, 0.46, 0.85], washer: [0.6, 0.6, 0.85],
  dryer: [0.6, 0.6, 0.85], desk: [1.4, 0.7, 0.75], office_chair: [0.65, 0.65, 1.1], tall_cabinet: [0.6, 0.6, 2.1], coat_rack: [1, 0.35, 1.9], stairs: [1, 3.2, 2.75], stairwell: [1, 2.6, 0.02],
  parking: [2.6, 5.2, 0.02], lamp_floor: [0.4, 0.4, 1.7], water_heater: [0.56, 0.56, 1.5], bench: [1.4, 0.45, 0.85], stool: [0.55, 0.55, 0.42], lamp_pendant: [0.4, 0.4, 0.8],
};
const TALL = 1.0;

/* ---------- small helpers ---------- */
const r1 = (v) => Math.round(v * 10) / 10;
const r2 = (v) => Math.round(v * 100) / 100;
const hash = (s) => { let h = 7; for (let i = 0; i < String(s).length; i++) h = (h * 31 + String(s).charCodeAt(i)) >>> 0; return h; };
const pick = (list, key) => list[hash(key) % list.length];
const safeId = (s, d) => String(s || d || "x").replace(/[^A-Za-z0-9_\-.]/g, "_").slice(0, 60) || "x";

/* ---------- 1. rooms in rows: a neat rectangle ---------- */
function splitRows(items, R) {
  const total = items.reduce((s, x) => s + x.area, 0), rows = [];
  let acc = 0, row = [];
  items.forEach((it, i) => {
    row.push(it); acc += it.area;
    const left = items.length - i - 1, rowsLeft = R - rows.length - 1;
    if (rowsLeft > 0 && (acc >= ((rows.length + 1) * total) / R - it.area / 2 || left === rowsLeft)) { if (left >= rowsLeft) { rows.push(row); row = []; } }
  });
  if (row.length) rows.push(row);
  return rows;
}
function scoreRows(rows, W, D) {
  const total = rows.reduce((s, r) => s + r.reduce((q, x) => q + x.area, 0), 0);
  let worst = 1;
  rows.forEach((r) => {
    const S = r.reduce((q, x) => q + x.area, 0), h = (S / total) * D;
    r.forEach((x) => { const w = (x.area / S) * W, a = Math.max(w / h, h / w), small = Math.min(w, h) < (KIND_MIN[x.kind] || 1.8) ? 3 : 1; worst = Math.max(worst, a * small); });
  });
  return worst;
}
export function layoutRooms(items, aspect = 1.5, fixed) {
  const list = items.slice().sort((a, b) => a.order - b.order || String(a.id).localeCompare(String(b.id)));
  const total = list.reduce((s, x) => s + x.area, 0);
  let D = fixed ? fixed.D : Math.sqrt(total / aspect), W = fixed ? fixed.W : total / D;
  let best = null;
  for (let R = 1; R <= Math.min(4, list.length); R++) {
    const rows = splitRows(list, R); if (rows.length !== R) continue;
    const s = scoreRows(rows, W, D);
    if (!best || s < best.s - 0.05) best = { s, rows };
  }
  const rows = best ? best.rows : [list];
  W = r1(W); D = r1(D);
  // heights of the rows, widths of the rooms: all on a 10 cm grid, the last one takes the rest
  const rects = [];
  let z = 0;
  rows.forEach((r, ri) => {
    const S = r.reduce((q, x) => q + x.area, 0), z1 = ri === rows.length - 1 ? D : r1(z + (S / total) * D);
    let x = 0;
    r.forEach((it, i) => {
      const x1 = i === r.length - 1 ? W : r1(x + (it.area / S) * W);
      rects.push({ id: it.id, row: ri, x0: x, z0: z, x1, z1 }); x = x1;
    });
    z = z1;
  });
  alignWalls(rects, W, rows.length);
  return { W, D, rects };
}
// walls that stand close together in different rows are moved onto one line
function alignWalls(rects, W, nRows) {
  const byRow = [];
  rects.forEach((q) => (byRow[q.row] = byRow[q.row] || []).push(q));
  const xs = [];
  byRow.forEach((r, ri) => r.forEach((q, i) => { if (i > 0) xs.push({ ri, i, v: q.x0 }); }));
  xs.sort((a, b) => a.v - b.v);
  let c = [];
  const groups = [];
  xs.forEach((p) => { if (c.length && p.v - c[c.length - 1].v > 0.5) { groups.push(c); c = []; } if (!c.some((q) => q.ri === p.ri)) c.push(p); else { groups.push(c); c = [p]; } });
  if (c.length) groups.push(c);
  groups.forEach((g) => {
    if (g.length < 2) return;
    const m = r1(g.reduce((s, p) => s + p.v, 0) / g.length);
    const ok = g.every((p) => { const row = byRow[p.ri], a = row[p.i - 1], b = row[p.i]; return m - a.x0 >= 1.4 && b.x1 - m >= 1.4; });
    if (!ok) return;
    g.forEach((p) => { const row = byRow[p.ri]; row[p.i - 1].x1 = m; row[p.i].x0 = m; });
  });
}

/* ---------- 2. doors between the rooms ---------- */
function shared(a, b) {
  const e = 0.001;
  if (Math.abs(a.x1 - b.x0) < e || Math.abs(b.x1 - a.x0) < e) {
    const lo = Math.max(a.z0, b.z0), hi = Math.min(a.z1, b.z1);
    if (hi - lo > 0.01) return { vert: true, pos: Math.abs(a.x1 - b.x0) < e ? a.x1 : a.x0, lo, hi, aSide: Math.abs(a.x1 - b.x0) < e ? "E" : "W" };
  }
  if (Math.abs(a.z1 - b.z0) < e || Math.abs(b.z1 - a.z0) < e) {
    const lo = Math.max(a.x0, b.x0), hi = Math.min(a.x1, b.x1);
    if (hi - lo > 0.01) return { vert: false, pos: Math.abs(a.z1 - b.z0) < e ? a.z1 : a.z0, lo, hi, aSide: Math.abs(a.z1 - b.z0) < e ? "S" : "N" };
  }
  return null;
}
// edge index and offset (m from the start of the edge) of a point on a side of a room rectangle: edges run clockwise from the top-left corner
function edgeOf(q, side, c) {
  if (side === "N") return { edge: 0, offset: c - q.x0, len: q.x1 - q.x0 };
  if (side === "E") return { edge: 1, offset: c - q.z0, len: q.z1 - q.z0 };
  if (side === "S") return { edge: 2, offset: q.x1 - c, len: q.x1 - q.x0 };
  return { edge: 3, offset: q.z1 - c, len: q.z1 - q.z0 };
}
const OPP = { N: "S", S: "N", E: "W", W: "E" };

/* ---------- 3. one floor: rooms, openings, furniture ---------- */
class Floor {
  constructor(id) { this.id = id; this.openings = []; this.furniture = []; this.placements = []; this.n = 0; }
  nid(p) { return p + ++this.n; }
}
const WINDOW = {
  living: { w: 1.8, n: 3 }, dining: { w: 1.4, n: 2 }, kitchen: { w: 1.3, n: 2 }, bed: { w: 1.4, n: 2 }, kids: { w: 1.3, n: 2 }, guest: { w: 1.3, n: 2 }, office: { w: 1.4, n: 2 },
  bath: { w: 0.7, n: 1, sill: 1.3, h: 0.8 }, wc: { w: 0.5, n: 1, sill: 1.4, h: 0.6 }, laundry: { w: 0.8, n: 1, sill: 1.2, h: 0.8 }, storage: { w: 0.6, n: 1, sill: 1.3, h: 0.7 },
  hobby: { w: 1.3, n: 2 }, other: { w: 1.2, n: 1 }, hall: { w: 0, n: 0 }, tech: { w: 0, n: 0 }, garage: { w: 0, n: 0 },
};

function buildOpenings(F, rooms, opts, ctx) {
  const by = Object.fromEntries(rooms.map((r) => [r.id, r]));
  const W = ctx.W, D = ctx.D;
  const ext = (q) => ({ N: q.z0 < 0.001, S: q.z1 > D - 0.001, W: q.x0 < 0.001, E: q.x1 > W - 0.001 });
  // who touches whom
  const links = [];
  for (let i = 0; i < rooms.length; i++) for (let j = i + 1; j < rooms.length; j++) {
    const s = shared(rooms[i], rooms[j]); if (s && s.hi - s.lo >= 1.0) links.push({ a: rooms[i], b: rooms[j], s });
  }
  // the room with the front door: hall, living room, ... whichever reaches the outside
  const prefer = ["hall", "living", "kitchen", "dining", "hobby", "bed", "office", "other"];
  let hub = null;
  for (const k of prefer) { hub = rooms.find((r) => r.kind === k && Object.values(ext(r)).some(Boolean)); if (hub) break; }
  hub = hub || rooms.find((r) => Object.values(ext(r)).some(Boolean)) || rooms[0];
  const doorsOn = {}; // room id -> list of {side, c, w}
  const addOpening = (room, side, c, o) => {
    const e = edgeOf(room, side, c);
    F.openings.push({ id: F.nid("o"), room_id: room.rid, edge: e.edge, offset: r2(e.offset), width: o.width, type: o.type, sill: o.sill, height: o.height, hinge: o.hinge || "left", swing: o.swing || "in", leaves: o.leaves || 1, style: o.style || null, ...(o.extra || {}) });
    (doorsOn[room.id] = doorsOn[room.id] || []).push({ side, c, w: o.width, type: o.type, sill: o.sill, h: o.height });
  };
  // inner doors: a cheapest-first tree from the hub (not through a bath or the garage), then wide passages between the living areas
  const seen = new Set([hub.id]), used = new Set();
  const LEAF = ["bath", "wc", "storage", "tech", "laundry", "garage", "office", "kids", "guest", "bed"];
  const wide = (l) => ["living", "dining", "kitchen"].includes(l.a.kind) && ["living", "dining", "kitchen"].includes(l.b.kind);
  const cost = (l, from, to) => {
    let c = 2 - Math.min(1, (l.s.hi - l.s.lo) / 6);
    if (from.kind === "hall" || to.kind === "hall") c -= 1.2;
    if (wide(l)) c -= 0.6;
    const suite = ["bed", "kids", "guest"].includes(from.kind) && ["bath", "wc"].includes(to.kind);
    if (LEAF.includes(from.kind) && from.id !== hub.id && !suite) c += 5;
    if (["bed", "kids", "guest"].includes(to.kind) && ["kitchen", "dining", "garage"].includes(from.kind)) c += 3;
    if (to.kind === "garage" && !["hall", "living", "kitchen"].includes(from.kind)) c += 3;
    if (["bath", "wc"].includes(to.kind) && !["bed", "hall", "kids", "guest"].includes(from.kind)) c += 2.5;
    return c;
  };
  const door = (l, w, style) => {
    const len = l.s.hi - l.s.lo, lo = l.s.lo + w / 2 + 0.3, hi = l.s.hi - w / 2 - 0.3;
    const c = style === "passage" || hi <= lo || len < 2.6 ? r2((l.s.lo + l.s.hi) / 2) : r2((hash(l.a.id + l.b.id) & 1) ? lo + (hi - lo) * 0.18 : hi - (hi - lo) * 0.18), a = l.a, side = l.s.aSide;
    addOpening(a, side, c, { type: "door", width: w, sill: 0, height: 2.05, hinge: (hash(a.id + l.b.id) & 1) ? "left" : "right", style });
    used.add(l.a.id + "|" + l.b.id);
    (doorsOn[l.b.id] = doorsOn[l.b.id] || []).push({ side: OPP[side], c, w, type: "door", sill: 0, h: 2.05, noOpening: true });
  };
  for (;;) {
    let best = null;
    links.forEach((l) => {
      const ia = seen.has(l.a.id), ib = seen.has(l.b.id); if (ia === ib) return;
      const from = ia ? l.a : l.b, to = ia ? l.b : l.a, c = cost(l, from, to);
      if (!best || c < best.c) best = { l, from, to, c };
    });
    if (!best) break;
    seen.add(best.to.id);
    const l = best.l, len = l.s.hi - l.s.lo, small = ["bath", "wc", "storage", "tech", "laundry"].includes(l.a.kind) || ["bath", "wc", "storage", "tech", "laundry"].includes(l.b.kind);
    if (wide(l) && len >= 2.4) door(l, r2(Math.min(2.0, len - 0.8)), "passage"); else door(l, small ? 0.8 : 0.9, null);
  }
  links.forEach((l) => { if (!used.has(l.a.id + "|" + l.b.id) && wide(l) && l.s.hi - l.s.lo >= 2.4 && (l.a.kind === "living" || l.b.kind === "living")) door(l, r2(Math.min(2.0, l.s.hi - l.s.lo - 0.8)), "passage"); });
  // rooms the tree could not reach (they touch only at a corner): none expected; the rest have a door now
  // the front door
  let sideFront = null;
  if (ctx.front) {
    const e = ext(hub), order = ["S", "W", "E", "N"].filter((s) => e[s]);
    sideFront = order[0];
    if (sideFront) {
      const q = hub, len = sideFront === "N" || sideFront === "S" ? q.x1 - q.x0 : q.z1 - q.z0, start = sideFront === "N" || sideFront === "S" ? q.x0 : q.z0;
      const c = r2(start + len * (sideFront === "S" ? 0.3 : 0.5));
      addOpening(q, sideFront, c, { type: "door", width: 1.0, sill: 0, height: 2.15, swing: "out", style: "front", hinge: "left" });
    }
  }
  // garage door
  rooms.filter((r) => r.kind === "garage").forEach((g) => {
    const e = ext(g), s = ["S", "N", "W", "E"].find((k) => e[k]); if (!s) return;
    const len = s === "N" || s === "S" ? g.x1 - g.x0 : g.z1 - g.z0, start = s === "N" || s === "S" ? g.x0 : g.z0;
    addOpening(g, s, r2(start + len / 2), { type: "garage", width: Math.min(2.5, r2(len - 0.6)), sill: 0, height: 2.1 });
  });
  // windows in the outer walls
  if (opts.windows !== false) rooms.forEach((q) => {
    const spec = WINDOW[q.kind] || WINDOW.other; if (!spec.n) return;
    const e = ext(q);
    ["S", "N", "E", "W"].forEach((side) => {
      if (!e[side]) return;
      const len = side === "N" || side === "S" ? q.x1 - q.x0 : q.z1 - q.z0, start = side === "N" || side === "S" ? q.x0 : q.z0;
      const n = Math.min(spec.n, Math.floor((len - 0.4) / (spec.w + 0.9)));
      if (n < 1) return;
      for (let k = 0; k < n; k++) {
        let c = start + ((k + 1) / (n + 1)) * len; const blocked = (cc) => (doorsOn[q.id] || []).some((d) => d.side === side && Math.abs(d.c - cc) < d.w / 2 + spec.w / 2 + 0.15);
        if (blocked(c)) { const alt = [c + 0.7, c - 0.7, c + 1.2, c - 1.2].find((x) => x - spec.w / 2 > start + 0.25 && x + spec.w / 2 < start + len - 0.25 && !blocked(x)); if (alt === undefined) continue; c = alt; }
        const patio = q.kind === "living" && ctx.ground && side === "S" && k === n - 1 && n >= 2;
        addOpening(q, side, r2(c), patio
          ? { type: "window", width: 1.8, sill: 0, height: 2.15, leaves: 2, hinge: "right" }
          : { type: "window", width: spec.w, sill: spec.sill || 0.9, height: spec.h || 1.3, hinge: (k & 1) ? "right" : "left" });
      }
    });
  });
  return { doorsOn, hub, front: sideFront, ext };
}

/* ---------- 4. furniture ---------- */
const SIDE_ROT = { N: 0, S: 180, W: 270, E: 90 };
class Placer {
  constructor(F, q, doorsOn) {
    this.F = F; this.q = q; this.items = []; this.block = [];
    (doorsOn[q.id] || []).forEach((d) => {
      const half = d.w / 2 + 0.08, depth = d.type === "garage" ? 0.4 : d.type === "window" ? 0.35 : d.w > 1.3 ? 0.6 : 1.0;
      let b;
      if (d.side === "N") b = [d.c - half, q.z0, d.c + half, q.z0 + depth]; else if (d.side === "S") b = [d.c - half, q.z1 - depth, d.c + half, q.z1];
      else if (d.side === "W") b = [q.x0, d.c - half, q.x0 + depth, d.c + half]; else b = [q.x1 - depth, d.c - half, q.x1, d.c + half];
      this.block.push({ b, tallOnly: d.type === "window" && d.sill >= 0.3 ? false : false, window: d.type === "window" });
    });
  }
  free(b, tall, noBounds) {
    const q = this.q;
    const E = 0.015; if (!noBounds && (b[0] < q.x0 + 0.02 - E || b[2] > q.x1 - 0.02 + E || b[1] < q.z0 + 0.02 - E || b[3] > q.z1 - 0.02 + E)) return false;
    for (const k of this.block) { if (k.window && !tall) continue; if (b[0] < k.b[2] && b[2] > k.b[0] && b[1] < k.b[3] && b[3] > k.b[1]) return false; }
    for (const it of this.items) { if (it.soft) continue; if (b[0] < it.b[2] - 0.02 && b[2] > it.b[0] + 0.02 && b[1] < it.b[3] - 0.02 && b[3] > it.b[1] + 0.02) return false; }
    return true;
  }
  add(type, cx, cz, rot, w, d, h, extra, soft) {
    const sw = rot === 90 || rot === 270, bw = sw ? d : w, bd = sw ? w : d, b = [cx - bw / 2, cz - bd / 2, cx + bw / 2, cz + bd / 2];
    const it = { id: this.F.nid("m"), type, x: r2(cx), z: r2(cz), rotation: rot, w: r2(w), d: r2(d), h: r2(h), variant: null, ...(extra || {}), b, soft: !!soft, room: this.q.id };
    this.items.push(it); return it;
  }
  size(type, o) { const c = CAT[type] || [0.6, 0.6, 0.8]; return [o && o.w || c[0], o && o.d || c[1], o && o.h || c[2]]; }
  // against a wall: t from 0 (start of the wall) to 1 (end)
  against(type, side, ts, o) {
    const [w, d, h] = this.size(type, o), q = this.q, tall = h > TALL, rot = SIDE_ROT[side];
    const horiz = side === "N" || side === "S", len = horiz ? q.x1 - q.x0 : q.z1 - q.z0, lo = (horiz ? q.x0 : q.z0) + w / 2 + 0.08, hi = (horiz ? q.x1 : q.z1) - w / 2 - 0.08;
    if (hi < lo) return null;
    for (const t of [].concat(ts)) {
      const a = lo + t * (hi - lo), gap = 0.02;
      const cx = horiz ? a : side === "W" ? q.x0 + d / 2 + gap : q.x1 - d / 2 - gap, cz = horiz ? (side === "N" ? q.z0 + d / 2 + gap : q.z1 - d / 2 - gap) : a;
      const sw = rot === 90 || rot === 270, bw = sw ? d : w, bd = sw ? w : d, b = [cx - bw / 2, cz - bd / 2, cx + bw / 2, cz + bd / 2];
      if (this.free(b, h > TALL) && (!o || !o.keep || this.free([b[0] - o.keep, b[1] - o.keep, b[2] + o.keep, b[3] + o.keep], h > TALL, true))) return this.add(type, cx, cz, rot, w, d, h, o && o.extra, o && o.soft);
    }
    return null;
  }
  at(type, cx, cz, rot, o) {
    const [w, d, h] = this.size(type, o), sw = rot === 90 || rot === 270, bw = sw ? d : w, bd = sw ? w : d, b = [cx - bw / 2, cz - bd / 2, cx + bw / 2, cz + bd / 2];
    if (!(o && o.soft) && !this.free(b, h > TALL)) return null;
    if (o && o.soft && (b[0] < this.q.x0 || b[2] > this.q.x1 || b[1] < this.q.z0 || b[3] > this.q.z1)) return null;
    return this.add(type, cx, cz, rot, w, d, h, o && o.extra, o && o.soft);
  }
  // the first wall (of those given) that has room for an item of this size; its opposite wall is "facing"
  wallFor(type, sides) {
    const [w, d] = this.size(type), q = this.q;
    return sides.find((s) => { const horiz = s === "N" || s === "S", len = horiz ? q.x1 - q.x0 : q.z1 - q.z0; if (len < w + 0.4) return false; const saved = this.items.length; const it = this.against(type, s, [0.5, 0.25, 0.75, 0.1, 0.9]); if (it) { this.items.pop(); return true; } return false; });
  }
  center() { const q = this.q; return [(q.x0 + q.x1) / 2, (q.z0 + q.z1) / 2]; }
}

function longSides(q) { return q.x1 - q.x0 >= q.z1 - q.z0 ? ["N", "S", "W", "E"] : ["W", "E", "N", "S"]; }

const RUGS = ["#e7b53c", "#3f8f9b", "#c2564b", "#6d8f4e", "#7d6bb3", "#d98a3d"];
function furnishRoom(F, q, doorsOn, opts) {
  const P = new Placer(F, q, doorsOn), [cx, cz] = P.center(), w = q.x1 - q.x0, d = q.z1 - q.z0, area = w * d, col = hash(q.id);
  const sides = longSides(q);
  const color = (it, c) => { if (it) it.color = c; return it; };
  const rug = (c, rw, rd) => { const it = P.at("rug", cx, cz, w >= d ? 0 : 90, { w: rw, d: rd, soft: true }); if (it) color(it, c); return it; };
  switch (q.kind) {
    case "living": case "hobby": {
      rug(pick(RUGS, q.id), Math.min(2.8, w * 0.55), Math.min(1.9, d * 0.42));
      const tvSide = P.wallFor("tv_board", ["N", "W", "E", "S"]) || "N", sofaSide = OPP[tvSide];
      const tv = P.against("tv_board", tvSide, [0.5, 0.3, 0.7]);
      let sofa = null; for (const s of [sofaSide, ...["N", "S", "W", "E"].filter((x) => x !== tvSide && x !== sofaSide)]) { sofa = P.against("sofa", s, [0.5, 0.3, 0.7, 0.1, 0.9], { keep: 0.05 }); if (sofa) break; }
      color(sofa, pick(["#3b6ea5", "#c8553d", "#5a8f6b", "#7d6bb3", "#d6a23a"], q.id + "s"));
      P.at("coffee_table", cx, cz, sideRot(tvSide), { soft: false });
      const arm = P.against("armchair", ["W", "E", "N", "S"].find((s) => s !== tvSide && s !== sofaSide) || "W", [0.5, 0.2, 0.8]); if (arm) arm.rotation = (arm.rotation + 0) % 360, color(arm, pick(["#d6a23a", "#3f8f9b", "#c2564b"], q.id + "a"));
      P.against("plant", sides[0], [0.02, 0.98]); P.against("plant", sides[1], [0.98, 0.02]);
      P.against("shelf", sides.find((s) => s !== tvSide && s !== sofaSide) || sides[2], [0.9, 0.1]);
      if (area > 22) P.against("sideboard", sofaSide, [0.05, 0.95]);
      if (tv) tv.tv = true;
      break;
    }
    case "dining": {
      const tw = Math.min(1.8, Math.max(1.2, w - 2.4)), td = 0.9;
      const t = P.at("table", cx, cz, w >= d ? 0 : 90, { w: tw, d: td });
      if (t) { const hz = w >= d, n = tw > 1.5 ? 3 : 2; for (let i = 0; i < n; i++) { const o = (i - (n - 1) / 2) * 0.62; [-1, 1].forEach((sd) => { const it = hz ? P.at("chair", cx + o, cz + sd * 0.7, sd < 0 ? 0 : 180) : P.at("chair", cx + sd * 0.7, cz + o, sd < 0 ? 270 : 90); if (it) color(it, pick(["#c2564b", "#3f8f9b", "#d6a23a", "#6d8f4e"], q.id + "c")); }); } P.at("lamp_pendant", cx, cz, 0, { soft: true }); }
      P.against("sideboard", sides[1], [0.5, 0.2, 0.8]); P.against("plant", sides[0], [0.02, 0.98]);
      break;
    }
    case "kitchen": {
      // the cooking line along the longest free wall, from a corner
      const order = ["fridge", "kitchen", "sink", "dishwasher", "stove", "kitchen"];
      let side = sides.find((s) => { const len = s === "N" || s === "S" ? w : d; return len >= 2.8 && P.against("kitchen", s, 0) && (P.items.pop(), true); }) || sides[0];
      const horiz = side === "N" || side === "S", len = horiz ? w : d, start = (horiz ? q.x0 : q.z0) + 0.08;
      let pos = start;
      order.forEach((tp) => {
        const [iw, id_, ih] = P.size(tp), rot = SIDE_ROT[side];
        const a = pos + iw / 2;
        if (a + iw / 2 > start + len - 0.16) return;
        const gap = 0.02, x = horiz ? a : side === "W" ? q.x0 + id_ / 2 + gap : q.x1 - id_ / 2 - gap, z = horiz ? (side === "N" ? q.z0 + id_ / 2 + gap : q.z1 - id_ / 2 - gap) : a;
        const sw = rot === 90 || rot === 270, bw = sw ? id_ : iw, bd = sw ? iw : id_, b = [x - bw / 2, z - bd / 2, x + bw / 2, z + bd / 2];
        if (P.free(b, ih > TALL)) { P.add(tp, x, z, rot, iw, id_, ih); if (tp !== "fridge") P.add("kitchen_wall", x, z + (horiz ? (side === "N" ? -0.135 : 0.135) : 0), rot, iw, 0.35, 0.7, null, true).b = [0, 0, 0, 0]; pos += iw; } else pos += iw;
      });
      if (area > 11) {
        const tw = 1.3, dz = side === "N" ? 1 : side === "S" ? -1 : 0;
        let t = null;
        for (const [ax, az] of [[0, 0.5], [0, 0.2], [0, 0], [-0.6, 0.3], [0.6, 0.3], [-0.9, 0], [0.9, 0]]) { t = P.at("table", cx + ax, cz + az * dz, 0, { w: tw, d: 0.85 }); if (t) break; }
        if (t) [-1, 1].forEach((sd) => { const it = P.at("chair", t.x, t.z + sd * 0.68, sd < 0 ? 0 : 180); if (it) color(it, pick(["#c2564b", "#3f8f9b", "#d6a23a"], q.id)); });
      }
      if (area > 20) P.at("island", cx, cz, 0, { w: 1.8, d: 0.9 });
      break;
    }
    case "bed": case "kids": case "guest": {
      const kid = q.kind === "kids", single = kid || (q.kind === "guest" && area < 11);
      const bs = P.wallFor("bed", ["N", "W", "E", "S"].sort((a, b) => (a === "N" ? -1 : 0) - (b === "N" ? -1 : 0))) || sides[0];
      rug(pick(["#7ba4c9", "#c98f6a", "#8fb38a", "#b78fc9"], q.id), Math.min(2.4, w * 0.6), Math.min(1.6, d * 0.4));
      const bed = single ? P.against("bed", bs, [0.5, 0.2, 0.8], { w: 0.95, d: 2.0 }) : P.against("bed", bs, [0.5, 0.3, 0.7]);
      if (bed) {
        color(bed, pick(["#3f8f9b", "#c2564b", "#6d8f4e", "#7d6bb3", "#d6a23a"], q.id + "b"));
        const horiz = bs === "N" || bs === "S", off = (single ? 0.95 : 1.6) / 2 + 0.26;
        if (horiz) { P.at("nightstand", bed.x - off, bed.z + (bs === "N" ? -0.78 : 0.78), SIDE_ROT[bs]); if (!single) P.at("nightstand", bed.x + off, bed.z + (bs === "N" ? -0.78 : 0.78), SIDE_ROT[bs]); }
        else { P.at("nightstand", bed.x + (bs === "W" ? -0.78 : 0.78), bed.z - off, SIDE_ROT[bs]); if (!single) P.at("nightstand", bed.x + (bs === "W" ? -0.78 : 0.78), bed.z + off, SIDE_ROT[bs]); }
      }
      const ws = sides.filter((s) => s !== bs);
      let wr = null; for (const s of ws) { wr = P.against("wardrobe", s, [0.5, 0.15, 0.85], { w: Math.min(1.8, (s === "N" || s === "S" ? w : d) - 0.8) }); if (wr) break; }
      if (wr) color(wr, "#9a6b43");
      if (kid || (q.kind === "bed" && area > 13)) { for (const s of ws) if (P.against("desk", s, [0.8, 0.2, 0.5], { w: 1.2 })) break; }
      P.against("dresser", ws[ws.length - 1], [0.5, 0.9, 0.1]);
      P.against("plant", ws[0], [0.02, 0.98]);
      break;
    }
    case "bath": {
      const big = area >= 6.5;
      const tubeSide = ["S", "N", "W", "E"].find((s) => (s === "N" || s === "S" ? w : d) >= 1.9 && P.against("bathtub", s, [0.5, 0.2, 0.8], { keep: 0 }) && (P.items.pop(), true));
      if (big && tubeSide) { const it = P.against("bathtub", tubeSide, [0.5, 0.2, 0.8]); if (it) color(it, "#e9f3f7"); }
      else { const s2 = sides[1]; P.against("shower", s2, [1, 0, 0.5]); }
      const rest = ["N", "S", "W", "E"].filter((s) => s !== tubeSide);
      for (const s of rest) { if (P.against("wc", s, [0.2, 0.8, 0.5])) break; }
      for (const s of rest.slice().reverse()) { if (P.against("washbasin", s, [0.5, 0.2, 0.8])) break; }
      if (area >= 5.5) for (const s of rest) { if (P.against("washer", s, [0.95, 0.05, 0.5])) break; }
      break;
    }
    case "wc": { for (const s of ["N", "S", "W", "E"]) if (P.against("wc", s, [0.5, 0.2, 0.8])) break; for (const s of ["S", "N", "E", "W"]) if (P.against("washbasin", s, [0.5, 0.2, 0.8], { w: 0.45 })) break; break; }
    case "hall": {
      P.against("coat_rack", sides[0], [0.1, 0.9, 0.5]); P.against("sideboard", sides[1], [0.5, 0.2, 0.8], { w: Math.min(1.2, (sides[1] === "N" || sides[1] === "S" ? w : d) - 0.8) });
      P.against("plant", sides[0], [0.98, 0.02]); rug("#b9623f", Math.min(1.8, w * 0.6), Math.min(0.9, d * 0.4));
      break;
    }
    case "office": {
      const ds = P.wallFor("desk", ["N", "W", "E", "S"]) || "N";
      const desk = P.against("desk", ds, [0.5, 0.25, 0.75]);
      if (desk) { const off = ds === "N" ? [0, 0.75] : ds === "S" ? [0, -0.75] : ds === "W" ? [0.75, 0] : [-0.75, 0]; const ch = P.at("office_chair", desk.x + off[0], desk.z + off[1], SIDE_ROT[OPP[ds]], { soft: false }); if (ch) color(ch, "#2f3744"); }
      for (const s of sides.filter((x) => x !== ds)) { if (P.against("shelf", s, [0.5, 0.2, 0.8])) break; }
      P.against("shelf", sides.filter((x) => x !== ds)[1] || sides[1], [0.2, 0.8]); P.against("plant", ds, [0.02, 0.98]);
      break;
    }
    case "garage": {
      const hz = w >= d, pw = Math.min(2.6, (hz ? d : w) - 0.5), pl = Math.min(5.2, (hz ? w : d) - 0.6);
      const car = P.at("parking", cx, cz, hz ? 90 : 0, { w: pw, d: pl, soft: true }); if (car) car.color = pick(["#d9dde4", "#c0392b", "#2c5aa0", "#2f3744"], q.id);
      P.against("shelf", sides[1], [0.1, 0.9]);
      break;
    }
    case "laundry": { for (const s of ["N", "S", "W", "E"]) { if (P.against("washer", s, [0.1, 0.5])) { P.against("dryer", s, [0.45, 0.9, 0.7]); break; } } P.against("sink", sides[1], [0.9, 0.1]); P.against("tall_cabinet", sides[0], [0.98, 0.02]); break; }
    case "tech": { P.against("water_heater", sides[0], [0.1, 0.9]); P.against("shelf", sides[1], [0.5, 0.2, 0.8]); break; }
    case "storage": { P.against("shelf", sides[0], [0.1, 0.5, 0.9]); P.against("shelf", sides[1], [0.9, 0.5, 0.1]); P.against("tall_cabinet", sides[2], [0.5]); break; }
    default: { rug(pick(RUGS, q.id), Math.min(2, w * 0.5), Math.min(1.4, d * 0.4)); P.against("bench", sides[0], [0.5, 0.2, 0.8]); P.against("plant", sides[1], [0.02, 0.98]); P.against("shelf", sides[2], [0.5, 0.2, 0.8]); }
  }
  return P;
}
function sideRot(side) { return side === "N" || side === "S" ? 0 : 90; }

/* ---------- 5. the whole house ---------- */
export function planHouse(input) {
  const opts = input.opts || {};
  const floorsIn = (input.floors || []).slice();
  const roomsIn = (input.rooms || []).filter((r) => r.mark !== false);
  const lv = (f, i) => (f.level === null || f.level === undefined || isNaN(+f.level) ? i : +f.level);
  let fl = floorsIn.map((f, i) => ({ id: f.id, name: f.name || "Floor " + (i + 1), level: lv(f, i) })).sort((a, b) => a.level - b.level);
  if (!fl.length) fl = [{ id: "main", name: "House", level: 0 }];
  const ground = (fl.find((f) => f.level === 0) || fl[0]).id;
  const first = fl.find((f) => f.level >= 0) || fl[0];
  // a room of no floor goes to the ground floor
  const byFloor = {};
  roomsIn.forEach((r) => {
    const kind = kindOf(r.name, r.id); if (kind === "outdoor" && r.mark !== true) return;
    const fid = fl.some((f) => f.id === r.floor) ? r.floor : ground;
    (byFloor[fid] = byFloor[fid] || []).push({ ...r, kind: kind === "outdoor" ? "other" : kind, fid });
  });
  const used = fl.filter((f) => (byFloor[f.id] || []).length);
  const frontFloor = used.find((f) => f.level >= 0) || used[0] || first;
  const out = { floors: [], dims: null, warnings: [] };
  let footprint = null;
  used.forEach((f, fi) => {
    const items = byFloor[f.id].map((r) => ({ id: r.id, kind: r.kind, order: KIND_ORDER[r.kind] || 3.8, area: Math.max(2.4, (KIND_AREA[r.kind] || 10) * (SIZE_MUL[r.size] || 1)) }));
    let fixed = null;
    const total = items.reduce((s, x) => s + x.area, 0);
    if (footprint) {
      // the upper floors keep the outline of the first one when their rooms fill it about right
      const ratio = total / (footprint.W * footprint.D);
      if (ratio > 0.62 && ratio < 1.6) { fixed = { W: footprint.W, D: footprint.D }; }
    }
    const lay = layoutRooms(items, 1.5, fixed);
    if (!footprint) footprint = { W: lay.W, D: lay.D };
    const idx = Object.fromEntries(byFloor[f.id].map((r) => [r.id, r]));
    const rooms = lay.rects.map((q) => ({ ...q, ...idx[q.id], rid: safeId(q.id), mat: KIND_MAT[idx[q.id].kind] || "wood" }));
    const F = new Floor(safeId(f.id, "f" + fi));
    const isGround = f.id === ground || f.level <= 0;
    const ctx = { W: lay.W, D: lay.D, front: f.id === frontFloor.id, ground: isGround };
    const op = buildOpenings(F, rooms, opts, ctx);
    const placers = rooms.map((q) => furnishRoom(F, q, op.doorsOn, opts));
    out.floors.push({ id: F.id, qid: f.id, name: f.name, level: f.level, elevation: 0, W: lay.W, D: lay.D, rooms, openings: F.openings, furniture: placers.flatMap((p) => p.items), placers, F, hub: op.hub.id });
  });
  // stairs: where there is a floor above, in the hub room of each floor
  for (let i = 0; i < out.floors.length - 1; i++) {
    const a = out.floors[i], b = out.floors[i + 1], hub = a.rooms.find((r) => r.id === a.hub); if (!hub) continue;
    const P = a.placers[a.rooms.indexOf(hub)];
    if (hub.x1 - hub.x0 >= 1.8 && hub.z1 - hub.z0 >= 3.6) {
      const sides = ["W", "E"], s = sides.find((x) => P.against("stairs", x, [0.5, 0.3, 0.7, 0.1, 0.9], { keep: 0.2 }) && (P.items.pop(), true));
      if (s) { const it = P.against("stairs", s, [0.5, 0.3, 0.7, 0.1, 0.9], { keep: 0.2 }); if (it) { a.furniture.push(it); const P2 = b.placers[0]; b.furniture.push({ id: b.F.nid("m"), type: "stairwell", x: it.x, z: it.z, rotation: it.rotation, w: 1, d: 2.6, h: 0.02, variant: null, b: [0, 0, 0, 0], room: b.rooms[0].id }); } }
    }
  }
  // heights: the floors stand on each other, the cellar below ground
  const H = 2.75;
  out.floors.forEach((f) => { f.elevation = r2(f.level * H); });
  const W = Math.max(...out.floors.map((f) => f.W), 4), D = Math.max(...out.floors.map((f) => f.D), 4);
  out.dims = { cx: r2(W / 2), cz: r2(D / 2), w: W, d: D, h: r2((out.floors.length ? Math.max(...out.floors.map((f) => f.elevation)) : 0) + 2.5) };
  return out;
}

/* ---------- 6. lamps, cameras and TV from the dashboard ---------- */
export function addDevices(plan, ents) {
  ents = ents || {};
  plan.floors.forEach((f) => {
    f.placements = []; f.devs = [];
    f.rooms.forEach((q) => {
      const E = ents[q.id] || {}, w = q.x1 - q.x0, d = q.z1 - q.z0;
      const L = E.lights || [], n = L.length;
      const cols = Math.max(1, Math.round(Math.sqrt((n * w) / d))), rows = Math.max(1, Math.ceil(n / cols));
      L.forEach((l, i) => {
        const c = i % cols, r = Math.floor(i / cols);
        const x = q.x0 + ((c + 0.5) / cols) * w, z = q.z0 + ((r + 0.5) / rows) * d;
        const nm = String(l.name || l.id).toLowerCase(), mount = /steh|floor|stand|tower|ecke/.test(nm) ? "floor" : /nacht|tisch|desk|table|schreib|lese|bedside|nightstand/.test(nm) ? "table" : null;
        f.placements.push({ entity_id: l.id, x: r2(x), z: r2(z), y: null, mount, rotation: 0 });
        f.devs.push({ ent: l.id, x: x, z: z });
      });
      (E.cams || []).slice(0, 2).forEach((c, i) => { const x = i ? q.x1 - 0.2 : q.x0 + 0.2, z = q.z0 + 0.2; f.placements.push({ entity_id: c, x: r2(x), z: r2(z), y: 2.2, mount: "wall", rotation: i ? 225 : 315 }); f.devs.push({ ent: c, x, z }); });
      // the TV and the climate unit of the room sit on the pieces that suit them
      const tvItem = f.furniture.find((it) => it.room === q.id && it.tv);
      if (tvItem && (E.tv || [])[0]) { tvItem.entity = E.tv[0]; f.devs.push({ ent: E.tv[0], x: tvItem.x, z: tvItem.z }); }
      if ((E.clim || [])[0]) { const x = q.x0 + w * 0.5, z = q.z1 - 0.25; f.devs.push({ ent: E.clim[0], x, z }); }
      // blinds: one per window of the room, in the order of the dashboard
      const wins = f.openings.filter((o) => o.room_id === q.rid && o.type === "window");
      (E.covers || []).forEach((cv, i) => { if (wins[i]) wins[i].cover = cv; });
    });
  });
  return plan;
}

/* ---------- 7. the building of Quinteca 3D ---------- */
export function cameraView(plan, preset) {
  const d = plan.dims; if (!d || !preset || preset === "default") return null;
  const diag = Math.hypot(d.w, d.d), tgt = { x: d.cx, y: 0, z: d.cz };
  const P = {
    top: { theta: 0, phi: 0.08, radius: diag * 1.25 },
    corner: { theta: -0.78, phi: 0.95, radius: diag * 1.2 },
    dollhouse: { theta: 0.62, phi: 0.72, radius: diag * 1.15 },
    front: { theta: 0, phi: 1.2, radius: diag * 1.3 },
    side: { theta: 1.5708, phi: 1.1, radius: diag * 1.3 },
  }[preset];
  return P ? { ...P, radius: r2(Math.max(4, P.radius)), target: tgt } : null;
}
export function toBuilding(plan, o) {
  o = o || {};
  const floors = plan.floors.map((f) => ({
    id: f.id, name: f.name, elevation: f.elevation, height: 2.5, cut_height: 1.15,
    rooms: f.rooms.map((q) => ({ id: q.rid, name: q.name, area_id: q.rid, points: [[q.x0, q.z0], [q.x1, q.z0], [q.x1, q.z1], [q.x0, q.z1]], floor_material: q.mat })),
    openings: f.openings.map((p) => { const { style, ...rest } = p; return { ...rest, style: style || null, cover: p.cover || null, contact: null, tilt: null }; }),
    furniture: o.furniture === false ? [] : f.furniture.map((it) => {
      const { b, soft, room, tv, color, ...rest } = it; return { ...rest, name: null };
    }),
    placements: (f.placements || []).map((p) => ({ ...p })),
    background: null, walls: [], outdoor: [], ha_floor: f.qid === "main" ? null : String(f.qid), start_view: null,
  }));
  return floors;
}

export const AUTO_VERSION = 2;
