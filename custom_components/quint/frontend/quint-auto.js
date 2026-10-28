/* Quint auto house: builds a tidy house plan from the floors and rooms of the dashboard.
 *
 * One plan, two results:
 *   - toBuilding(): the building of Quinteca 3D (rooms, walls, doors, windows, furniture, lamps)
 *   - toSvg():      a colourful top-down picture of each floor (floors, walls, furniture, doors, windows)
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

/* ---------- 8. the picture: a colourful top-down view ---------- */
const S = 100;        // pixels per metre
const PAD = 1.4;      // metres around the house
const FLOOR_FILL = {
  oak: ["#d9ad78", "#c99a62"], wood: ["#c98f5b", "#b97f4c"], tiles: ["#dde6ee", "#c5d1dc"], carpet: ["#9fb3c8", "#8aa1b8"], stone: ["#c9c3b8", "#b3ad9f"], concrete: ["#aab2bc", "#99a2ad"],
};
const KIND_TINT = { living: "#e8c98f", dining: "#e6c08d", kitchen: "#cfe0ea", bed: "#b9c9e0", kids: "#f2c9a0", guest: "#c9d6c0", bath: "#bfe0e6", wc: "#bfe0e6", hall: "#d8cfc0", office: "#c9d0e0", garage: "#aab2bc", laundry: "#cfe0ea", storage: "#b8bfc8", tech: "#b0b8c2", hobby: "#c9b8d8", other: "#d6cdbf" };
const x = (v) => r1(v * S + 0);
function patterns() {
  const mk = (id, base, line, kind) => {
    if (kind === "plank") return `<pattern id="${id}" width="${S * 1.2}" height="${S * 0.36}" patternUnits="userSpaceOnUse"><rect width="100%" height="100%" fill="${base}"/><rect y="0" width="100%" height="${S * 0.18}" fill="#fff" opacity=".05"/><path d="M0 ${S * 0.18}H${S * 1.2}M0 ${S * 0.36}H${S * 1.2}M${S * 0.5} 0V${S * 0.18}M${S * 0.95} ${S * 0.18}V${S * 0.36}" stroke="${line}" stroke-width="1.4" opacity=".55"/></pattern>`;
    if (kind === "tile") return `<pattern id="${id}" width="${S * 0.5}" height="${S * 0.5}" patternUnits="userSpaceOnUse"><rect width="100%" height="100%" fill="${base}"/><path d="M0 0H${S * 0.5}V${S * 0.5}" fill="none" stroke="${line}" stroke-width="1.6" opacity=".7"/><rect x="2" y="2" width="${S * 0.18}" height="${S * 0.18}" fill="#fff" opacity=".18"/></pattern>`;
    if (kind === "stone") return `<pattern id="${id}" width="${S * 0.9}" height="${S * 0.6}" patternUnits="userSpaceOnUse"><rect width="100%" height="100%" fill="${base}"/><path d="M0 0H${S * 0.9}M${S * 0.45} 0V${S * 0.3}M0 ${S * 0.3}H${S * 0.9}M${S * 0.2} ${S * 0.3}V${S * 0.6}M${S * 0.7} ${S * 0.3}V${S * 0.6}" stroke="${line}" stroke-width="1.5" opacity=".6"/></pattern>`;
    return `<pattern id="${id}" width="${S * 0.3}" height="${S * 0.3}" patternUnits="userSpaceOnUse"><rect width="100%" height="100%" fill="${base}"/><circle cx="${S * 0.07}" cy="${S * 0.09}" r="1.2" fill="${line}" opacity=".35"/><circle cx="${S * 0.21}" cy="${S * 0.22}" r="1.1" fill="${line}" opacity=".3"/></pattern>`;
  };
  return [mk("f-oak", ...FLOOR_FILL.oak, "plank"), mk("f-wood", ...FLOOR_FILL.wood, "plank"), mk("f-tiles", ...FLOOR_FILL.tiles, "tile"), mk("f-carpet", ...FLOOR_FILL.carpet, "fleece"), mk("f-stone", ...FLOOR_FILL.stone, "stone"), mk("f-concrete", ...FLOOR_FILL.concrete, "fleece")].join("");
}
const wood = ["#b98552", "#a3703f"];
function furn(it) {
  const w = it.w * S, d = it.d * S, hw = w / 2, hd = d / 2, c = it.color, T = it.type;
  const rr = (X, Y, W, H, R, fill, extra) => `<rect x="${r1(X)}" y="${r1(Y)}" width="${r1(W)}" height="${r1(H)}" rx="${r1(R)}" fill="${fill}" ${extra || ""}/>`;
  let g = "";
  switch (T) {
    case "rug": g = rr(-hw, -hd, w, d, 6, c || "#e7b53c") + rr(-hw + 7, -hd + 7, w - 14, d - 14, 4, "none", `stroke="#fff" stroke-opacity=".55" stroke-width="2" stroke-dasharray="6 5"`) + rr(-hw + 16, -hd + 16, w - 32, d - 32, 3, "#000", `opacity=".05"`); break;
    case "sofa": { const b = c || "#3b6ea5"; g = rr(-hw, -hd, w, d, 12, b) + rr(-hw, -hd, w, d * 0.28, 10, "#000", `opacity=".16"`) + rr(-hw, -hd + 4, d * 0.2, d - 4, 8, "#000", `opacity=".12"`) + rr(hw - d * 0.2, -hd + 4, d * 0.2, d - 4, 8, "#000", `opacity=".12"`) + [0, 1, 2].map((i) => rr(-hw + d * 0.22 + i * ((w - d * 0.44) / 3) + 2, -hd + d * 0.3, (w - d * 0.44) / 3 - 4, d * 0.62, 9, "#fff", `opacity=".18"`)).join(""); break; }
    case "armchair": g = rr(-hw, -hd, w, d, 14, c || "#d6a23a") + rr(-hw, -hd, w, d * 0.28, 10, "#000", `opacity=".16"`) + rr(-hw + 10, -hd + d * 0.3, w - 20, d * 0.62, 10, "#fff", `opacity=".2"`); break;
    case "tv_board": g = rr(-hw, -hd, w, d, 4, "#2b2f38") + rr(-hw * 0.7, -hd + 5, w * 0.7, 7, 2, "#0b1220") + rr(-hw * 0.7 + 2, -hd + 6, w * 0.7 - 4, 3, 1, it.tv ? "#7ec8ff" : "#1b2740"); break;
    case "coffee_table": g = rr(-hw, -hd, w, d, 8, "#e8dcc8") + rr(-hw + 5, -hd + 5, w - 10, d - 10, 6, "#fff", `opacity=".4"`) + `<circle cx="${-hw * 0.4}" cy="0" r="7" fill="#7aa874"/><circle cx="${hw * 0.3}" cy="0" r="5" fill="#d6a23a"/>`; break;
    case "plant": g = `<circle r="${hw}" fill="#2f6b3a"/>` + [0, 60, 120, 180, 240, 300].map((a) => `<ellipse cx="${r1(Math.cos((a * Math.PI) / 180) * hw * 0.5)}" cy="${r1(Math.sin((a * Math.PI) / 180) * hw * 0.5)}" rx="${hw * 0.55}" ry="${hw * 0.28}" transform="rotate(${a} ${r1(Math.cos((a * Math.PI) / 180) * hw * 0.5)} ${r1(Math.sin((a * Math.PI) / 180) * hw * 0.5)})" fill="${a % 120 ? "#4c9a54" : "#63b46a"}"/>`).join("") + `<circle r="${hw * 0.22}" fill="#8a5a2b"/>`; break;
    case "shelf": case "tall_cabinet": g = rr(-hw, -hd, w, d, 3, "#5b4030") + rr(-hw + 3, -hd + 3, w - 6, d - 6, 2, "#7a5a3f") + `<path d="M${-hw + 3} 0H${hw - 3}" stroke="#3d2a1e" stroke-width="1.5"/>`; break;
    case "sideboard": case "dresser": g = rr(-hw, -hd, w, d, 5, wood[0]) + rr(-hw + 3, -hd + 3, w - 6, d - 6, 3, "#c79a6a") + `<path d="M0 ${-hd + 3}V${hd - 3}" stroke="${wood[1]}" stroke-width="1.5"/>`; break;
    case "table": g = rr(-hw, -hd, w, d, 8, "#b98552") + rr(-hw + 4, -hd + 4, w - 8, d - 8, 6, "#d1a06c") + `<path d="M${-hw + 14} ${-hd + 12}H${hw - 14}M${-hw + 14} ${hd - 12}H${hw - 14}" stroke="#fff" stroke-opacity=".2" stroke-width="2"/>`; break;
    case "table_round": g = `<circle r="${hw}" fill="#b98552"/><circle r="${hw - 4}" fill="#d1a06c"/>`; break;
    case "chair": g = rr(-hw, -hd, w, d, 8, c || "#c2564b") + rr(-hw, -hd, w, d * 0.22, 4, "#000", `opacity=".22"`); break;
    case "bed": { const b = c || "#3f8f9b", head = -hd; g = rr(-hw, -hd, w, d, 6, wood[1]) + rr(-hw + 4, -hd + 4, w - 8, d - 8, 6, "#f4f4f1") + rr(-hw + 8, -hd + 10, w / 2 - 12, d * 0.17, 8, "#fff", `stroke="#d9dde2" stroke-width="1.5"`) + (w > 120 ? rr(4, -hd + 10, w / 2 - 12, d * 0.17, 8, "#fff", `stroke="#d9dde2" stroke-width="1.5"`) : "") + rr(-hw + 4, -hd + d * 0.38, w - 8, d * 0.58, 6, b) + rr(-hw + 4, -hd + d * 0.38, w - 8, 9, 3, "#fff", `opacity=".35"`) + rr(-hw + 4, -hd + d * 0.38, w - 8, d * 0.58, 6, "#000", `opacity=".05"`); break; }
    case "nightstand": g = rr(-hw, -hd, w, d, 4, "#a3703f") + rr(-hw + 4, -hd + 4, w - 8, d - 8, 3, "#c79a6a") + `<circle cx="${hw * 0.1}" cy="${hd * 0.1}" r="5" fill="#f6e2a8"/>`; break;
    case "wardrobe": g = rr(-hw, -hd, w, d, 3, "#8a5d3a") + rr(-hw + 3, -hd + 3, w - 6, d - 6, 2, "#a37249") + `<path d="M0 ${-hd + 3}V${hd - 3}" stroke="#6c4528" stroke-width="2"/><circle cx="-6" cy="0" r="2" fill="#f3e3c3"/><circle cx="6" cy="0" r="2" fill="#f3e3c3"/>`; break;
    case "kitchen": g = rr(-hw, -hd, w, d, 3, "#e9edf1") + rr(-hw + 3, -hd + 3, w - 6, d - 6, 2, "#f9fafb") + `<path d="M${-hw + 3} ${hd - 10}H${hw - 3}" stroke="#c9d0d8" stroke-width="1.5"/>`; break;
    case "fridge": g = rr(-hw, -hd, w, d, 4, "#cfd6de") + rr(-hw + 3, -hd + 3, w - 6, d - 6, 3, "#eef2f6") + `<path d="M${-hw + 8} ${hd - 14}V${hd - 4}" stroke="#7f8a96" stroke-width="3"/>`; break;
    case "sink": g = rr(-hw, -hd, w, d, 3, "#e9edf1") + rr(-hw * 0.55, -hd + 8, hw * 0.9, d - 18, 7, "#9fb4c4") + rr(-hw * 0.55 + 4, -hd + 12, hw * 0.9 - 8, d - 26, 5, "#c0d2de") + `<circle cx="${hw * 0.3}" cy="${-hd + 8}" r="3.5" fill="#6d7b87"/>`; break;
    case "stove": g = rr(-hw, -hd, w, d, 3, "#2b2f38") + [[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b]) => `<circle cx="${a * w * 0.22}" cy="${b * d * 0.22}" r="${w * 0.15}" fill="#14171d" stroke="#59606b" stroke-width="2"/>`).join(""); break;
    case "dishwasher": g = rr(-hw, -hd, w, d, 3, "#cfd6de") + rr(-hw + 4, -hd + 4, w - 8, d - 8, 3, "#e9edf1") + `<path d="M${-hw + 8} ${hd - 8}H${hw - 8}" stroke="#7f8a96" stroke-width="2.5"/>`; break;
    case "island": g = rr(-hw, -hd, w, d, 5, "#7a8794") + rr(-hw + 4, -hd + 4, w - 8, d - 8, 4, "#e7ecf0"); break;
    case "bathtub": g = rr(-hw, -hd, w, d, 18, "#f4f7f9") + rr(-hw + 7, -hd + 7, w - 14, d - 14, 14, "#bfe3f0") + rr(-hw + 7, -hd + 7, w - 14, d - 14, 14, "#fff", `opacity=".25"`) + `<circle cx="${hw - 20}" cy="0" r="4" fill="#8aa3b0"/>`; break;
    case "shower": g = rr(-hw, -hd, w, d, 3, "#cfeaf3") + `<path d="M${-hw} ${-hd}L${hw} ${hd}M${hw} ${-hd}L${-hw} ${hd}" stroke="#fff" stroke-opacity=".45" stroke-width="2"/><circle r="6" fill="#8aa3b0"/><rect x="${-hw}" y="${-hd}" width="${w}" height="${d}" fill="none" stroke="#fff" stroke-opacity=".8" stroke-width="3"/>`; break;
    case "wc": g = rr(-hw, -hd, w, d * 0.34, 4, "#f4f7f9", `stroke="#cfd6de"`) + `<ellipse cx="0" cy="${hd * 0.3}" rx="${hw * 0.88}" ry="${hd * 0.62}" fill="#f9fbfc" stroke="#cfd6de" stroke-width="1.5"/><ellipse cx="0" cy="${hd * 0.34}" rx="${hw * 0.5}" ry="${hd * 0.36}" fill="#d7e6ee"/>`; break;
    case "washbasin": g = rr(-hw, -hd, w, d, 8, "#f4f7f9", `stroke="#cfd6de"`) + `<ellipse cx="0" cy="${hd * 0.1}" rx="${hw * 0.62}" ry="${hd * 0.55}" fill="#d7e6ee"/><circle cx="0" cy="${-hd + 6}" r="3" fill="#8aa3b0"/>`; break;
    case "washer": case "dryer": g = rr(-hw, -hd, w, d, 4, "#f1f4f7", `stroke="#cfd6de"`) + `<circle cx="0" cy="${hd * 0.12}" r="${hw * 0.58}" fill="#dfe8ef" stroke="#9fb0bd" stroke-width="3"/><circle cx="0" cy="${hd * 0.12}" r="${hw * 0.36}" fill="#8fb1c9" opacity=".7"/>`; break;
    case "desk": g = rr(-hw, -hd, w, d, 4, "#c79a6a") + rr(-hw + 3, -hd + 3, w - 6, d - 6, 3, "#dcb583") + rr(-hw * 0.3, -hd + 6, hw * 0.6, 4, 1, "#14171d") + rr(-hw * 0.55, -hd + 14, 12, 8, 2, "#2b2f38") ; break;
    case "office_chair": g = `<circle r="${hw * 0.85}" fill="${c || "#2f3744"}"/><circle r="${hw * 0.5}" fill="#fff" opacity=".12"/>`; break;
    case "coat_rack": g = rr(-hw, -hd, w, d, 3, "#6a4a32") + [-0.6, -0.2, 0.2, 0.6].map((a) => `<circle cx="${a * hw}" cy="0" r="4" fill="#c9cdd3"/>`).join(""); break;
    case "stairs": g = rr(-hw, -hd, w, d, 2, "#caa77c") + Array.from({ length: Math.round(it.d / 0.26) }, (_, i) => `<path d="M${-hw} ${-hd + i * 26}H${hw}" stroke="#8a6b44" stroke-width="1.5"/>`).join("") + `<path d="M0 ${hd - 12}V${-hd + 14}M-6 ${-hd + 22}L0 ${-hd + 12}L6 ${-hd + 22}" stroke="#fff" stroke-opacity=".7" stroke-width="2.5" fill="none"/>`; break;
    case "stairwell": g = ""; break;
    case "parking": g = `<g opacity=".95">${rr(-hw, -hd, w, d, 6, "#2b2f38", `opacity=".1"`)}${rr(-hw * 0.78, -hd * 0.9, w * 0.78, d * 0.9, 26, c || "#d9dde4")}${rr(-hw * 0.6, -hd * 0.62, w * 0.6, d * 0.2, 12, "#2b3a4d")}${rr(-hw * 0.6, hd * 0.05, w * 0.6, d * 0.26, 10, "#2b3a4d")}</g>`; break;
    case "lamp_floor": g = `<circle r="${hw}" fill="#f6e2a8" opacity=".9"/><circle r="${hw * 0.4}" fill="#fff"/>`; break;
    case "water_heater": g = `<circle r="${hw}" fill="#cfd6de"/><circle r="${hw * 0.7}" fill="#eef2f6"/><circle r="4" fill="#d9534f"/>`; break;
    case "bench": g = rr(-hw, -hd, w, d, 6, "#b98552") + rr(-hw + 3, -hd + 3, w - 6, d - 6, 4, "#d1a06c"); break;
    case "kitchen_wall": case "lamp_pendant": g = ""; break;
    default: g = rr(-hw, -hd, w, d, 5, "#9aa3ad");
  }
  return g ? `<g transform="translate(${x(it.x)} ${x(it.z)}) rotate(${it.rotation})">${g}</g>` : "";
}

export function toSvg(plan, floorId, o) {
  o = o || {};
  const f = plan.floors.find((q) => q.id === floorId); if (!f) return null;
  const W = f.W, D = f.D, vw = r1((W + PAD * 2) * S), vh = r1((D + PAD * 2) * S), ox = PAD * S, oz = PAD * S, night = !!o.night;
  const gap = [];
  const walls = [];
  const wt = (e) => (e ? 0.24 : 0.12);
  // walls: every room edge once (shared ones are drawn by both rooms in the same place)
  f.rooms.forEach((q) => {
    const E = { N: q.z0 < 0.001, S: q.z1 > D - 0.001, W: q.x0 < 0.001, E: q.x1 > W - 0.001 };
    walls.push(`<rect x="${x(q.x0)}" y="${x(q.z0)}" width="${x(q.x1 - q.x0)}" height="${x(q.z1 - q.z0)}" fill="none" stroke-width="${x(0.12)}"/>`);
    ["N", "S", "W", "E"].forEach((s) => { if (!E[s]) return; const t = x(0.24); walls.push(s === "N" ? `<rect x="${x(q.x0) - t / 2}" y="${x(q.z0) - t / 2}" width="${x(q.x1 - q.x0) + t}" height="${t}" stroke="none" class="ex"/>` : s === "S" ? `<rect x="${x(q.x0) - t / 2}" y="${x(q.z1) - t / 2}" width="${x(q.x1 - q.x0) + t}" height="${t}" stroke="none" class="ex"/>` : s === "W" ? `<rect x="${x(q.x0) - t / 2}" y="${x(q.z0) - t / 2}" width="${t}" height="${x(q.z1 - q.z0) + t}" stroke="none" class="ex"/>` : `<rect x="${x(q.x1) - t / 2}" y="${x(q.z0) - t / 2}" width="${t}" height="${x(q.z1 - q.z0) + t}" stroke="none" class="ex"/>`); });
  });
  // openings: cut through the wall and draw the leaf or the glass
  let ops = "", cuts = "";
  f.openings.forEach((p) => {
    const q = f.rooms.find((r) => r.rid === p.room_id); if (!q) return;
    const side = ["N", "E", "S", "W"][p.edge], c = side === "N" ? q.x0 + p.offset : side === "S" ? q.x1 - p.offset : side === "E" ? q.z0 + p.offset : q.z1 - p.offset;
    const horiz = side === "N" || side === "S", pos = side === "N" ? q.z0 : side === "S" ? q.z1 : side === "W" ? q.x0 : q.x1, w = p.width, th = 0.34;
    const X = horiz ? c - w / 2 : pos - th / 2, Y = horiz ? pos - th / 2 : c - w / 2, WW = horiz ? w : th, HH = horiz ? th : w;
    cuts += `<rect x="${x(X)}" y="${x(Y)}" width="${x(WW)}" height="${x(HH)}" fill="#000"/>`;
    const ex = (side === "N" && q.z0 < 0.001) || (side === "S" && q.z1 > D - 0.001) || (side === "W" && q.x0 < 0.001) || (side === "E" && q.x1 > W - 0.001);
    if (p.type === "window") {
      ops += `<g><rect x="${x(X)}" y="${x(Y)}" width="${x(WW)}" height="${x(HH)}" fill="#bfe6ff"/><rect x="${x(X)}" y="${x(Y)}" width="${x(WW)}" height="${x(HH)}" fill="url(#glass)" opacity=".9"/>${horiz ? `<path d="M${x(X)} ${x(pos)}H${x(X + w)}${p.leaves === 2 ? `M${x(c)} ${x(pos - 0.12)}V${x(pos + 0.12)}` : ""}" stroke="#fff" stroke-width="3"/>` : `<path d="M${x(pos)} ${x(Y)}V${x(Y + w)}" stroke="#fff" stroke-width="3"/>`}<rect x="${x(X)}" y="${x(Y)}" width="${x(WW)}" height="${x(HH)}" fill="none" stroke="#5f7894" stroke-width="2"/></g>`;
    } else if (p.type === "garage") {
      ops += `<rect x="${x(X)}" y="${x(Y)}" width="${x(WW)}" height="${x(HH)}" fill="#d5d9df" stroke="#7d8793" stroke-width="2"/>` + Array.from({ length: 5 }, (_, i) => horiz ? `<path d="M${x(X) + ((i + 1) * x(WW)) / 6} ${x(Y)}V${x(Y + th)}" stroke="#7d8793" stroke-width="1.5"/>` : `<path d="M${x(X)} ${x(Y) + ((i + 1) * x(HH)) / 6}H${x(X + th)}" stroke="#7d8793" stroke-width="1.5"/>`).join("");
    } else if (p.style === "passage") {
      ops += `<rect x="${x(X)}" y="${x(Y)}" width="${x(WW)}" height="${x(HH)}" fill="#fff" opacity=".08"/>`;
    } else {
      // a door: the leaf stands open at 90 degrees, with its swing as a thin arc
      const into = p.swing === "out" ? -1 : 1, hl = p.hinge === "left" ? 1 : -1;
      const nx = side === "N" ? 1 : side === "S" ? -1 : side === "E" ? 1 : -1, ny = side === "N" ? 1 : side === "S" ? -1 : side === "W" ? 1 : -1;
      let hx, hy, lx, ly, ax, ay;
      if (horiz) { const dirx = side === "N" ? 1 : -1; hx = c - (hl * dirx * w) / 2; hy = pos; lx = hx; ly = pos + into * ny * w; ax = c + (hl * dirx * w) / 2; ay = pos; }
      else { const diry = side === "W" ? -1 : 1; hx = pos; hy = c - (hl * diry * w) / 2; lx = pos + into * (side === "W" ? 1 : -1) * w; ly = hy; ax = pos; ay = c + (hl * diry * w) / 2; }
      ops += `<path d="M${x(ax)} ${x(ay)}A${x(w)} ${x(w)} 0 0 ${horiz ? (hl * (side === "N" ? 1 : -1) * into > 0 ? 0 : 1) : (hl * (side === "W" ? -1 : 1) * into > 0 ? 1 : 0)} ${x(lx)} ${x(ly)}" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="1.6" stroke-dasharray="4 4"/><path d="M${x(hx)} ${x(hy)}L${x(lx)} ${x(ly)}" stroke="${p.style === "front" ? "#7a4a22" : "#8a5a2b"}" stroke-width="${p.style === "front" ? 6 : 5}" stroke-linecap="round"/>`;
    }
  });
  const rooms = f.rooms.map((q) => {
    const m = FLOOR_FILL[q.mat] ? q.mat : "wood";
    return `<g><rect x="${x(q.x0)}" y="${x(q.z0)}" width="${x(q.x1 - q.x0)}" height="${x(q.z1 - q.z0)}" fill="url(#f-${m})"/><rect x="${x(q.x0)}" y="${x(q.z0)}" width="${x(q.x1 - q.x0)}" height="${x(q.z1 - q.z0)}" fill="${KIND_TINT[q.kind] || "#ddd"}" opacity=".22"/><rect x="${x(q.x0)}" y="${x(q.z0)}" width="${x(q.x1 - q.x0)}" height="${x(q.z1 - q.z0)}" fill="url(#vig)"/></g>`;
  }).join("");
  const low = f.furniture.filter((it) => it.h <= 0.1 || it.type === "stairwell"), mid = f.furniture.filter((it) => it.h > 0.1 && it.h <= TALL), tall = f.furniture.filter((it) => it.h > TALL);
  const layer = (arr, filt) => `<g ${filt ? `filter="url(#${filt})"` : ""}>${arr.map(furn).join("")}</g>`;
  const tx = `translate(${ox} ${oz})`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${vw} ${vh}" width="${vw}" height="${vh}">
<defs>${patterns()}
<linearGradient id="glass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e9f7ff"/><stop offset="1" stop-color="#7fb9e0"/></linearGradient>
<radialGradient id="vig" cx=".5" cy=".5" r=".75"><stop offset="0" stop-color="#fff" stop-opacity=".12"/><stop offset=".7" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".16"/></radialGradient>
<filter id="sh" x="-10%" y="-10%" width="125%" height="125%"><feDropShadow dx="${S * 0.04}" dy="${S * 0.06}" stdDeviation="${S * 0.035}" flood-color="#1a1208" flood-opacity=".42"/></filter>
<filter id="sh2" x="-10%" y="-10%" width="130%" height="130%"><feDropShadow dx="${S * 0.09}" dy="${S * 0.13}" stdDeviation="${S * 0.07}" flood-color="#1a1208" flood-opacity=".5"/></filter>
<filter id="gr" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="${S * 0.35}"/></filter>
<mask id="cut" maskUnits="userSpaceOnUse" x="-${ox}" y="-${oz}" width="${vw}" height="${vh}"><rect x="-${ox}" y="-${oz}" width="${vw}" height="${vh}" fill="#fff"/>${cuts}</mask>
</defs>
<g transform="${tx}">
<rect x="${-S * 0.5}" y="${-S * 0.5}" width="${x(W + 1)}" height="${x(D + 1)}" rx="${S * 0.5}" fill="#000" opacity=".5" filter="url(#gr)" transform="translate(${S * 0.2} ${S * 0.35})"/>
${rooms}
${layer(low, null)}
${layer(mid, "sh")}
<g mask="url(#cut)">
<g fill="none" stroke="#000" opacity=".3" filter="url(#sh2)" transform="translate(${S * 0.05} ${S * 0.07})" style="stroke-linejoin:miter">${walls.join("")}</g>
<g fill="none" stroke="#3a4351" stroke-linejoin="miter" transform="translate(${S * 0.025} ${S * 0.035})">${walls.join("").replace(/class="ex"/g, 'fill="#3a4351"')}</g>
<g fill="none" stroke="#f1f3f6" stroke-linejoin="miter">${walls.join("").replace(/class="ex"/g, 'fill="#f1f3f6"')}</g>
</g>
${layer(tall, "sh2")}
${ops}
</g>
${night ? `<rect width="${vw}" height="${vh}" fill="#0a1226" opacity=".42" style="mix-blend-mode:multiply"/><rect width="${vw}" height="${vh}" fill="#16264a" opacity=".18"/>` : ""}
</svg>`;
  return { svg, w: vw, h: vh, ox, oz };
}

// the polygons of the rooms and the places of the devices on the picture, as fractions of its size
export function picGeometry(plan, floorId) {
  const f = plan.floors.find((q) => q.id === floorId); if (!f) return null;
  const vw = (f.W + PAD * 2) * S, vh = (f.D + PAD * 2) * S, n = (X, Z) => [r2((X * S + PAD * S) / vw), r2((Z * S + PAD * S) / vh)];
  return {
    w: Math.round(vw), h: Math.round(vh),
    rooms: f.rooms.map((q) => ({ id: q.rid, room: q.id, pts: [n(q.x0, q.z0), n(q.x1, q.z0), n(q.x1, q.z1), n(q.x0, q.z1)] })),
    devs: (f.devs || []).map((d, i) => { const p = n(d.x, d.z); return { id: "a" + i, ent: d.ent, x: p[0], y: p[1] }; }),
  };
}
/* ---------- 9. the solid house: an own 3D drawing, no 3D engine. Full colour walls, floors and furniture, turnable ---------- */
const SC = 84; // pixels per metre
export const SOLID_CAM = { default: [38, 46], corner: [45, 40], dollhouse: [-32, 56], top: [0, 78], front: [0, 32], side: [90, 34] };
const WALL_COL = { living: "#f0cf8f", dining: "#efc48a", kitchen: "#bfe0ee", bed: "#b8cdf0", kids: "#f7c48f", guest: "#c6e0b8", bath: "#b4e4ee", wc: "#b4e4ee", hall: "#e8d9c2", office: "#c4cdf0", garage: "#bcc4d0", laundry: "#c4e6ee", storage: "#c8cfd8", tech: "#b6c0cc", hobby: "#d9c2ee", other: "#e6dccb" };
const EXT_COL = "#f3ece0", CAP_COL = "#fbf9f4";
const hexRgb = (h) => { h = String(h).replace("#", ""); if (h.length === 3) h = h.split("").map((c) => c + c).join(""); const n = parseInt(h, 16) || 0; return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const rgbHex = (a) => "#" + a.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("");
const shade = (c, f) => { const a = hexRgb(c); return rgbHex(a.map((v) => (f > 1 ? v + (255 - v) * (f - 1) : v * f))); };
const mixc = (a, b, t) => { const A = hexRgb(a), B = hexRgb(b); return rgbHex(A.map((v, i) => v + (B[i] - v) * t)); };

function mkView(W, D, yaw, pitch) {
  const a = (yaw * Math.PI) / 180, p = (pitch * Math.PI) / 180, c = Math.cos(a), s = Math.sin(a), sp = Math.sin(p), cp = Math.cos(p), cx = W / 2, cz = D / 2;
  const rot = (X, Z) => { const u = X - cx, v = Z - cz; return [u * c - v * s, u * s + v * c]; };
  const V = { tx: 0, ty: 0, rot, nb: (nx, nz) => nx * s + nz * c, na: (nx, nz) => nx * c - nz * s };
  V.raw = (X, Y, Z) => { const q = rot(X, Z); return [q[0] * SC, (q[1] * sp - Y * cp) * SC]; };
  V.P = (X, Y, Z) => { const q = V.raw(X, Y, Z); return [q[0] + V.tx, q[1] + V.ty]; };
  // the box around the house fixes the size of the picture
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  [-0.6, W + 0.6].forEach((X) => [-0.6, D + 0.6].forEach((Z) => [-0.4, 2.7].forEach((Y) => { const q = V.raw(X, Y, Z); x0 = Math.min(x0, q[0]); x1 = Math.max(x1, q[0]); y0 = Math.min(y0, q[1]); y1 = Math.max(y1, q[1]); })));
  const M = 18; V.tx = M - x0; V.ty = M - y0; V.w = Math.round(x1 - x0 + M * 2); V.h = Math.round(y1 - y0 + M * 2);
  return V;
}
const f1 = (v) => Math.round(v * 10) / 10;
const path = (pts) => "M" + pts.map((p) => f1(p[0]) + " " + f1(p[1])).join("L") + "Z";

// a prism standing on the floor: its side faces that look at the viewer and its top
function prism(V, pts, y0, y1, col) {
  const fn = col && col.fn, c = typeof col === "string" ? col : col.c || "#ccc", top = (col && col.top) || shade(c, 1.14), op = col && col.op != null ? ` fill-opacity="${col.op}"` : "";
  let A = 0; for (let i = 0; i < pts.length; i++) { const p = pts[i], q = pts[(i + 1) % pts.length]; A += p[0] * q[1] - q[0] * p[1]; }
  const sg = A >= 0 ? 1 : -1; let out = "";
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i], q = pts[(i + 1) % pts.length], dx = q[0] - p[0], dz = q[1] - p[1], L = Math.hypot(dx, dz) || 1, nx = (sg * dz) / L, nz = (-sg * dx) / L;
    const nb = V.nb(nx, nz); if (nb <= 0.02) continue;
    const f = Math.max(0.62, Math.min(1.1, 0.86 - 0.17 * V.na(nx, nz) + 0.08 * nb));
    out += `<path d="${path([V.P(p[0], y1, p[1]), V.P(q[0], y1, q[1]), V.P(q[0], y0, q[1]), V.P(p[0], y0, p[1])])}" fill="${shade(fn ? fn(nx, nz) : c, f)}"${op}/>`;
  }
  return out + `<path d="${path(pts.map((p) => V.P(p[0], y1, p[1])))}" fill="${top}"${op}/>`;
}
const rectPts = (xa, xb, za, zb) => [[xa, za], [xb, za], [xb, zb], [xa, zb]];
const circPts = (X, Z, r, n) => Array.from({ length: n || 14 }, (_, i) => [X + Math.cos((i / (n || 14)) * 6.2832) * r, Z + Math.sin((i / (n || 14)) * 6.2832) * r]);

// one piece of furniture as a list of parts in its own frame (back = -z, as in the flat picture)
function furnParts(it) {
  const w = it.w, d = it.d, h = Math.min(it.h || 0.8, 2.45), hw = w / 2, hd = d / 2, c = it.color, T = it.type, P = [];
  const rad = ((it.rotation || 0) * Math.PI) / 180, cs = Math.cos(rad), sn = Math.sin(rad);
  const tr = (lx, lz) => [it.x + lx * cs - lz * sn, it.z + lx * sn + lz * cs];
  const B = (lx, lz, W, D, y0, y1, col) => { if (y1 <= y0) return; P.push({ pts: [[-W / 2, -D / 2], [W / 2, -D / 2], [W / 2, D / 2], [-W / 2, D / 2]].map((q) => tr(lx + q[0], lz + q[1])), y0, y1, col }); };
  const C = (lx, lz, r, y0, y1, col, n) => { if (y1 <= y0) return; const m = tr(lx, lz); P.push({ pts: circPts(m[0], m[1], r, n), y0, y1, col }); };
  const legs = (inset, th, hh, col) => [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => B(a * (hw - inset), b * (hd - inset), th, th, 0, hh, col));
  switch (T) {
    case "rug": B(0, 0, w, d, 0, 0.014, c || "#e7b53c"); B(0, 0, w - 0.22, d - 0.22, 0.014, 0.018, shade(c || "#e7b53c", 1.25)); B(0, 0, w - 0.6, d - 0.6, 0.018, 0.02, shade(c || "#e7b53c", 0.9)); break;
    case "sofa": { const b = c || "#3b6ea5"; B(0, 0.02, w, d - 0.04, 0.08, 0.4, shade(b, 0.85)); B(0, -hd + 0.14, w, 0.28, 0.08, h, b); B(-hw + 0.12, 0.05, 0.24, d - 0.1, 0.08, 0.62, b); B(hw - 0.12, 0.05, 0.24, d - 0.1, 0.08, 0.62, b); const n = w > 1.5 ? 3 : 2, cw = (w - 0.48) / n; for (let i = 0; i < n; i++) B(-hw + 0.24 + cw * (i + 0.5), 0.12, cw - 0.03, d - 0.36, 0.4, 0.5, shade(b, 1.18)); B(0, -hd + 0.32, w - 0.5, 0.2, 0.5, 0.78, shade(b, 1.05)); legs(0.05, 0.05, 0.08, "#3a2f2a"); break; }
    case "armchair": { const b = c || "#d6a23a"; B(0, 0.02, w, d - 0.04, 0.08, 0.4, shade(b, 0.85)); B(0, -hd + 0.12, w, 0.24, 0.08, h, b); B(-hw + 0.1, 0.05, 0.2, d - 0.1, 0.08, 0.6, b); B(hw - 0.1, 0.05, 0.2, d - 0.1, 0.08, 0.6, b); B(0, 0.1, w - 0.4, d - 0.4, 0.4, 0.5, shade(b, 1.2)); break; }
    case "tv_board": B(0, 0, w, d, 0, 0.5, "#4a3a31"); B(0, 0.04, w - 0.06, d - 0.1, 0.5, 0.52, "#6b5547"); B(0, -0.04, w * 0.62, 0.05, 0.55, 1.1, it.tv ? "#2c6aa0" : "#10151f"); B(0, -0.04, 0.2, 0.1, 0.52, 0.56, "#20252e"); break;
    case "coffee_table": B(0, 0, w, d, 0.34, 0.4, "#e8dcc8"); B(0, 0, w - 0.1, d - 0.1, 0.4, 0.405, "#fff"); legs(0.06, 0.05, 0.34, "#8a6a4a"); B(-w * 0.2, 0, 0.18, 0.18, 0.405, 0.46, "#7aa874"); B(w * 0.2, 0.05, 0.14, 0.1, 0.405, 0.43, "#d6a23a"); break;
    case "plant": C(0, 0, hw * 0.55, 0, 0.3, "#b5653a", 10); C(0, 0, hw, 0.3, h * 0.62, "#2f7a3e", 10); C(0, 0, hw * 0.72, h * 0.62, h * 0.88, "#4c9a54", 10); C(0, 0, hw * 0.4, h * 0.88, h, "#69bd70", 10); break;
    case "shelf": case "tall_cabinet": { B(0, 0, w, d, 0, h, "#7a5a3f"); B(0, hd, w - 0.06, 0.02, 0.05, h - 0.05, "#97724c"); const lv = T === "shelf" ? 4 : 2; for (let i = 1; i <= lv; i++) { const y = (h / (lv + 1)) * i; B(0, hd + 0.012, w - 0.06, 0.012, y, y + 0.025, "#5b4030"); if (T === "shelf") ["#c2564b", "#3f8f9b", "#e7b53c", "#7d6bb3"].forEach((bc, k) => B(-hw + 0.14 + k * 0.18, hd + 0.03, 0.12, 0.05, y + 0.025, y + 0.25 + (k % 2) * 0.06, bc)); } break; }
    case "sideboard": case "dresser": B(0, 0, w, d, 0, h, "#b98552"); B(0, 0, w + 0.03, d + 0.02, h, h + 0.03, "#d1a06c"); B(-w / 4, hd, w / 2 - 0.05, 0.015, 0.06, h - 0.06, "#cb9a68"); B(w / 4, hd, w / 2 - 0.05, 0.015, 0.06, h - 0.06, "#cb9a68"); B(-0.05, hd + 0.02, 0.05, 0.02, h * 0.55, h * 0.62, "#f3e3c3"); B(0.05, hd + 0.02, 0.05, 0.02, h * 0.55, h * 0.62, "#f3e3c3"); break;
    case "nightstand": B(0, 0, w, d, 0, h, "#a3703f"); B(0, 0, w + 0.02, d + 0.02, h, h + 0.025, "#c79a6a"); B(0, hd, w - 0.06, 0.015, 0.06, h - 0.06, "#b98552"); C(0, -0.02, 0.09, h + 0.025, h + 0.04, "#444", 8); C(0, -0.02, 0.07, h + 0.04, h + 0.3, "#f6e2a8", 8); break;
    case "table": B(0, 0, w, d, 0.69, 0.75, "#d1a06c"); B(0, 0, w - 0.08, d - 0.08, 0.75, 0.755, "#e0b784"); legs(0.07, 0.07, 0.69, "#8a5d3a"); break;
    case "table_round": C(0, 0, hw, 0.69, 0.75, "#d1a06c", 18); C(0, 0, hw * 0.12, 0, 0.69, "#8a5d3a", 8); C(0, 0, hw * 0.4, 0, 0.04, "#8a5d3a", 10); break;
    case "chair": { const b = c || "#c2564b"; B(0, 0.02, w * 0.92, d * 0.84, 0.4, 0.46, b); B(0, -hd + 0.05, w * 0.92, 0.05, 0.46, 0.9, shade(b, 0.9)); legs(0.05, 0.04, 0.4, "#6a4a32"); break; }
    case "bed": { const b = c || "#3f8f9b"; B(0, 0, w, d, 0, 0.3, "#8a5d3a"); B(0, -hd + 0.04, w + 0.04, 0.08, 0.3, 1.0, "#6c4528"); B(0, 0.04, w - 0.1, d - 0.16, 0.3, 0.5, "#f6f6f2"); B(0, 0.3, w - 0.04, d * 0.62, 0.5, 0.57, b); B(0, 0.3 - d * 0.31 + 0.1, w - 0.04, 0.16, 0.57, 0.6, shade(b, 1.25)); if (w > 1.2) { B(-w / 4, -hd + 0.34, w / 2 - 0.16, 0.36, 0.5, 0.63, "#fff"); B(w / 4, -hd + 0.34, w / 2 - 0.16, 0.36, 0.5, 0.63, "#fff"); } else B(0, -hd + 0.34, w - 0.2, 0.36, 0.5, 0.63, "#fff"); break; }
    case "wardrobe": B(0, 0, w, d, 0, h, "#8a5d3a"); B(0, 0, w + 0.03, d + 0.02, h, h + 0.04, "#a37249"); B(-w / 4, hd, w / 2 - 0.04, 0.02, 0.05, h - 0.06, "#b4824f"); B(w / 4, hd, w / 2 - 0.04, 0.02, 0.05, h - 0.06, "#b4824f"); B(-0.05, hd + 0.03, 0.025, 0.02, h * 0.45, h * 0.58, "#f3e3c3"); B(0.05, hd + 0.03, 0.025, 0.02, h * 0.45, h * 0.58, "#f3e3c3"); break;
    case "kitchen": B(0, 0, w, d, 0, 0.86, "#f2f4f6"); B(0, 0, w + 0.01, d + 0.02, 0.86, 0.92, "#7f8a96"); B(0, hd, w - 0.05, 0.015, 0.07, 0.8, "#ffffff"); B(0, hd + 0.02, 0.2, 0.02, 0.72, 0.75, "#9aa4af"); break;
    case "kitchen_wall": B(0, 0, w, d, 1.45, 2.15, "#f2f4f6"); B(0, hd, w - 0.05, 0.015, 1.5, 2.1, "#ffffff"); B(0, hd + 0.02, 0.2, 0.02, 1.55, 1.58, "#9aa4af"); break;
    case "fridge": B(0, 0, w, d, 0, h, "#d5dce3"); B(0, hd, w - 0.05, 0.015, 0.05, h * 0.62, "#eef2f6"); B(0, hd, w - 0.05, 0.015, h * 0.64, h - 0.05, "#eef2f6"); B(-hw + 0.1, hd + 0.025, 0.03, 0.03, h * 0.7, h * 0.9, "#59606b"); B(-hw + 0.1, hd + 0.025, 0.03, 0.03, h * 0.3, h * 0.55, "#59606b"); break;
    case "sink": B(0, 0, w, d, 0, 0.86, "#f2f4f6"); B(0, 0, w + 0.01, d + 0.02, 0.86, 0.92, "#7f8a96"); B(-w * 0.12, 0.02, w * 0.5, d * 0.62, 0.92, 0.925, "#9fb4c4"); C(w * 0.3, -hd + 0.1, 0.025, 0.92, 1.1, "#9aa4af", 6); B(0, hd, w - 0.05, 0.015, 0.07, 0.8, "#fff"); break;
    case "stove": B(0, 0, w, d, 0, 0.86, "#e9edf1"); B(0, 0, w + 0.01, d + 0.02, 0.86, 0.92, "#2b2f38"); [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => C(a * w * 0.22, b * d * 0.2, w * 0.14, 0.92, 0.935, "#14171d", 10)); B(0, hd, w - 0.06, 0.015, 0.1, 0.7, "#2b2f38"); break;
    case "dishwasher": B(0, 0, w, d, 0, 0.86, "#d5dce3"); B(0, 0, w + 0.01, d + 0.02, 0.86, 0.92, "#7f8a96"); B(0, hd, w - 0.05, 0.015, 0.07, 0.8, "#eef2f6"); B(0, hd + 0.02, w - 0.2, 0.02, 0.75, 0.78, "#7f8a96"); break;
    case "island": B(0, 0, w, d, 0, 0.86, "#7a8794"); B(0, 0, w + 0.08, d + 0.08, 0.86, 0.92, "#e7ecf0"); B(0, hd, w - 0.1, 0.015, 0.07, 0.8, "#94a0ad"); break;
    case "bathtub": B(0, 0, w, d, 0, 0.58, "#f4f7f9"); B(0, 0, w - 0.16, d - 0.16, 0.58, 0.585, "#9fd3e8"); C(hw - 0.12, 0, 0.03, 0.58, 0.7, "#8aa3b0", 6); break;
    case "shower": B(0, 0, w, d, 0, 0.05, "#cfeaf3"); B(0, hd - 0.02, w, 0.03, 0.05, 2.0, { c: "#bfe6f5", op: 0.38, top: "#e3f5fb" }); B(hw - 0.02, 0, 0.03, d, 0.05, 2.0, { c: "#bfe6f5", op: 0.38, top: "#e3f5fb" }); C(-hw + 0.15, -hd + 0.15, 0.07, 1.9, 1.95, "#8aa3b0", 8); break;
    case "wc": B(0, -hd + 0.1, w, 0.2, 0, 0.8, "#f4f7f9"); B(0, 0.08, w * 0.9, d * 0.56, 0, 0.4, "#f9fbfc"); B(0, 0.1, w * 0.62, d * 0.4, 0.4, 0.42, "#d7e6ee"); C(0, -hd + 0.1, 0.03, 0.8, 0.84, "#9aa4af", 6); break;
    case "washbasin": B(0, -0.06, 0.14, 0.14, 0, 0.7, "#f4f7f9"); B(0, 0, w, d, 0.7, 0.85, "#f4f7f9"); B(0, 0.02, w * 0.66, d * 0.56, 0.85, 0.855, "#d7e6ee"); C(0, -hd + 0.05, 0.025, 0.85, 1.0, "#8aa3b0", 6); break;
    case "washer": case "dryer": B(0, 0, w, d, 0, h, "#f1f4f7"); B(0, hd, w * 0.62, 0.015, h * 0.2, h * 0.78, "#9fb0bd"); B(0, hd + 0.015, w * 0.4, 0.012, h * 0.3, h * 0.66, "#6e8ca5"); B(0, 0, w - 0.04, d - 0.04, h, h + 0.015, "#dfe8ef"); break;
    case "desk": B(0, 0, w, d, 0.7, 0.75, "#dcb583"); B(-hw + 0.04, 0, 0.06, d - 0.06, 0, 0.7, "#a3703f"); B(hw - 0.04, 0, 0.06, d - 0.06, 0, 0.7, "#a3703f"); B(0, -hd + 0.06, w - 0.1, 0.03, 0.2, 0.7, "#b98552"); B(0, -hd + 0.18, 0.62, 0.03, 0.78, 1.18, "#12161d"); B(0, -hd + 0.18, 0.16, 0.12, 0.75, 0.8, "#2b2f38"); B(0, 0.02, 0.4, 0.14, 0.75, 0.765, "#20252e"); break;
    case "office_chair": { const b = c || "#2f3744"; C(0, 0, hw * 0.75, 0, 0.05, "#1b1e24", 8); C(0, 0, 0.04, 0.05, 0.42, "#444c58", 6); C(0, 0, hw * 0.7, 0.42, 0.52, b, 12); B(0, -hw * 0.6, hw * 1.1, 0.09, 0.52, 1.1, shade(b, 1.1)); break; }
    case "coat_rack": B(0, -hd + 0.03, w, 0.05, 1.3, 1.85, "#6a4a32"); [-0.6, -0.2, 0.2, 0.6].forEach((a) => B(a * hw, -hd + 0.1, 0.04, 0.1, 1.55, 1.59, "#c9cdd3")); break;
    case "stairs": { const n = Math.max(6, Math.round(d / 0.27)), sd = d / n; for (let i = 0; i < n; i++) B(0, hd - (i + 0.5) * sd, w, sd, 0, ((i + 1) / n) * h, i % 2 ? "#cfae83" : "#caa77c"); B(-hw + 0.03, 0, 0.06, d, 0, h + 0.9, { c: "#8a6b44", top: "#a9895f" }); break; }
    case "parking": { const b = c || "#d9dde4"; B(0, 0.05, 1.75, 4.3, 0.2, 0.66, b); B(0, 0.25, 1.6, 2.1, 0.66, 1.2, "#2b3a4d"); B(0, 0.25, 1.5, 1.95, 1.2, 1.25, shade(b, 1.05)); B(0, -2.1, 1.5, 0.05, 0.38, 0.5, "#f6e2a8"); [[-0.86, -1.35], [0.86, -1.35], [-0.86, 1.4], [0.86, 1.4]].forEach(([a, z]) => B(a, z, 0.2, 0.62, 0, 0.4, "#1b1e24")); break; }
    case "lamp_floor": C(0, 0, 0.14, 0, 0.03, "#3a3f48", 10); C(0, 0, 0.02, 0.03, 1.5, "#555d68", 6); C(0, 0, 0.2, 1.42, 1.72, "#f6e2a8", 12); break;
    case "water_heater": C(0, 0, hw, 0, h, "#d5dce3", 14); C(0, 0, hw * 0.8, h, h + 0.05, "#eef2f6", 14); C(0, hw * 0.7, 0.04, 0.9, 0.95, "#d9534f", 6); break;
    case "bench": B(0, 0, w, d, 0.4, 0.46, "#d1a06c"); legs(0.06, 0.06, 0.4, "#8a5d3a"); break;
    case "stool": C(0, 0, hw, 0.36, 0.42, c || "#d1a06c", 12); C(0, 0, hw * 0.2, 0, 0.36, "#8a5d3a", 6); break;
    case "stairwell": case "lamp_pendant": break;
    default: B(0, 0, w, d, 0, h, "#9aa3ad");
  }
  return P;
}

// everything of one floor as a picture
function solidFloor(plan, f, o) {
  const yaw = o.yaw, pitch = o.pitch, V = mkView(f.W, f.D, yaw, pitch), W = f.W, D = f.D;
  // openings in the coordinates of the floor
  const ops = f.openings.map((p) => {
    const q = f.rooms.find((r) => r.rid === p.room_id); if (!q) return null;
    const side = ["N", "E", "S", "W"][p.edge], c = side === "N" ? q.x0 + p.offset : side === "S" ? q.x1 - p.offset : side === "E" ? q.z0 + p.offset : q.z1 - p.offset;
    const horiz = side === "N" || side === "S", pos = side === "N" ? q.z0 : side === "S" ? q.z1 : side === "W" ? q.x0 : q.x1;
    return { p, horiz, pos, a: c - p.width / 2, b: c + p.width / 2, c };
  }).filter(Boolean);
  let under = "", things = [];
  const T = (X, Z, svg) => { if (svg) things.push({ k: V.rot(X, Z)[1], s: svg }); };
  // the plinth and the soft ground shadow
  const bp = rectPts(-0.2, W + 0.2, -0.2, D + 0.2);
  under += `<path d="${path(rectPts(-0.1, W + 0.5, 0.1, D + 0.6).map((p) => V.P(p[0], -0.35, p[1])))}" fill="#000" opacity=".4" filter="url(#bl)"/>`;
  under += prism(V, bp, -0.32, 0, { c: "#6b7686", top: "#8792a3" });
  // floors
  f.rooms.forEach((q) => {
    const m = FLOOR_FILL[q.mat] ? q.mat : "wood", base = mixc(FLOOR_FILL[m][0], KIND_TINT[q.kind] || "#ddd", 0.22), line = shade(base, 0.8);
    const pts = rectPts(q.x0, q.x1, q.z0, q.z1).map((p) => V.P(p[0], 0, p[1]));
    under += `<path d="${path(pts)}" fill="${base}"/>`;
    let ln = "";
    if (m === "oak" || m === "wood") { for (let z = q.z0 + 0.2; z < q.z1 - 0.01; z += 0.2) ln += `M${V.P(q.x0, 0, z).map(f1).join(" ")}L${V.P(q.x1, 0, z).map(f1).join(" ")}`; }
    else if (m === "tiles" || m === "stone") { const st = m === "tiles" ? 0.5 : 0.6; for (let z = q.z0 + st; z < q.z1 - 0.01; z += st) ln += `M${V.P(q.x0, 0, z).map(f1).join(" ")}L${V.P(q.x1, 0, z).map(f1).join(" ")}`; for (let X = q.x0 + st; X < q.x1 - 0.01; X += st) ln += `M${V.P(X, 0, q.z0).map(f1).join(" ")}L${V.P(X, 0, q.z1).map(f1).join(" ")}`; }
    if (ln) under += `<path d="${ln}" stroke="${line}" stroke-width=".9" fill="none" opacity=".55"/>`;
  });
  // soft shadows of the furniture on the floor
  f.furniture.forEach((it) => {
    if ((it.h || 0) < 0.06 || it.type === "stairwell") return;
    const rad = (it.rotation * Math.PI) / 180, cs = Math.cos(rad), sn = Math.sin(rad), hw = it.w / 2, hd = it.d / 2;
    const pts = [[-hw, -hd], [hw, -hd], [hw, hd], [-hw, hd]].map((q) => [it.x + q[0] * cs - q[1] * sn + 0.07, it.z + q[0] * sn + q[1] * cs + 0.09]).map((p) => V.P(p[0], 0, p[1]));
    under += `<path d="${path(pts)}" fill="#1a1208" opacity=".2"/>`;
  });
  // walls
  const HW = 2.5, HI = 1.25, HL = 0.28, TI = 0.07, TE = 0.14, MAXP = 0.8;
  const winCol = { c: "#bfe4fb", op: 0.8, top: "#e3f3ff" };
  f.rooms.forEach((q) => {
    const E = { N: q.z0 < 0.001, S: q.z1 > D - 0.001, W: q.x0 < 0.001, E: q.x1 > W - 0.001 };
    const wc = WALL_COL[q.kind] || "#e6dccb", wcol = { c: wc, top: CAP_COL };
    [["N", true, q.z0, q.x0, q.x1, [0, 1]], ["S", true, q.z1, q.x0, q.x1, [0, -1]], ["W", false, q.x0, q.z0, q.z1, [1, 0]], ["E", false, q.x1, q.z0, q.z1, [-1, 0]]].forEach(([s, horiz, pos, a0, a1, inw]) => {
      const ext = E[s], near = ext && V.nb(-inw[0], -inw[1]) > 0.2, Hw = ext ? (near ? HL : HW) : HI;
      // the openings on this line
      const cuts = ops.filter((op) => op.horiz === horiz && Math.abs(op.pos - pos) < 0.03 && op.b > a0 + 0.01 && op.a < a1 - 0.01).map((op) => ({ ...op, a: Math.max(a0, op.a), b: Math.min(a1, op.b) })).sort((x, y) => x.a - y.a);
      const slab = (ta, tb, ca, cb, y0, y1, col) => { if (y1 - y0 < 0.005 || cb - ca < 0.004) return ""; const z0 = pos + inw[horiz ? 1 : 0] * ta, z1 = pos + inw[horiz ? 1 : 0] * tb; return prism(V, horiz ? rectPts(ca, cb, Math.min(z0, z1), Math.max(z0, z1)) : rectPts(Math.min(z0, z1), Math.max(z0, z1), ca, cb), y0, y1, col); };
      // one wall piece: the room's colour on the inside, the neighbour's (or the outer plaster) on the other side
      const both = (ca, cb, y0, y1, fixed) => {
        const mid = (ca + cb) / 2, X = horiz ? mid : pos, Z = horiz ? pos : mid, px = horiz ? mid : pos - inw[0] * 0.1, pz = horiz ? pos - inw[1] * 0.1 : mid;
        const nr = ext ? null : f.rooms.find((r) => r !== q && px > r.x0 - 0.001 && px < r.x1 + 0.001 && pz > r.z0 - 0.001 && pz < r.z1 + 0.001);
        if (nr && nr.id < q.id && !fixed) return;
        const outC = ext ? EXT_COL : nr ? WALL_COL[nr.kind] || "#e6dccb" : wc;
        const col = fixed ? { c: fixed, top: fixed } : { fn: (nx, nz) => (nx * inw[0] + nz * inw[1] > 0 ? wc : outC), top: CAP_COL };
        T(X, Z, slab(ext ? -TE : -TI, TI, ca, cb, y0, y1, col));
      };
      const solid = (ca, cb) => { const n = Math.max(1, Math.ceil((cb - ca) / MAXP)), st = (cb - ca) / n; for (let i = 0; i < n; i++) both(ca + i * st, ca + (i + 1) * st, 0, Hw); };
      let cur = a0;
      cuts.forEach((op) => {
        if (op.a > cur) solid(cur, op.a);
        const p = op.p, ca = op.a, cb = op.b, jam = 0.05;
        if (p.type === "window") {
          const sill = Math.min(p.sill || 0.9, Hw), top = Math.min((p.sill || 0.9) + (p.height || 1.3), Hw);
          if (sill > 0.01) both(ca, cb, 0, sill);
          if (Hw > top + 0.01) both(ca, cb, top, Hw);
          if (top > sill + 0.02) {
            both(ca, ca + jam, sill, top, "#f6f6f4"); both(cb - jam, cb, sill, top, "#f6f6f4");
            if (p.leaves === 2) both((ca + cb) / 2 - 0.02, (ca + cb) / 2 + 0.02, sill, top, "#f6f6f4");
            const mid = (ca + cb) / 2, X = horiz ? mid : pos, Z = horiz ? pos : mid;
            T(X, Z, slab(-0.02, 0.03, ca + jam, cb - jam, sill, top, winCol) + (top - sill > 0.4 ? slab(-0.03, 0.04, ca + jam, cb - jam, sill + (top - sill) * 0.5 - 0.015, sill + (top - sill) * 0.5 + 0.015, { c: "#f6f6f4", top: "#fff" }) : ""));
          }
        } else if (p.type === "garage") {
          const hh = Math.min(2.15, Hw), mid = (ca + cb) / 2, X = horiz ? mid : pos, Z = horiz ? pos : mid;
          let sv = ""; const n = 6; for (let i = 0; i < n; i++) sv += slab(0.02, 0.07, ca, cb, (hh / n) * i, (hh / n) * (i + 1) - 0.01, { c: i % 2 ? "#dfe3e8" : "#cdd2d9", top: "#eef0f3" });
          T(X, Z, sv); if (Hw > hh + 0.01) both(ca, cb, hh, Hw);
        } else if (p.style === "front") {
          const hh = Math.min(2.1, Hw), mid = (ca + cb) / 2, X = horiz ? mid : pos, Z = horiz ? pos : mid;
          T(X, Z, slab(0.0, 0.06, ca, cb, 0, hh, { c: "#8a4f22", top: "#a86a36" }) + slab(0.06, 0.075, cb - 0.18, cb - 0.12, hh * 0.45, hh * 0.5, { c: "#f0d68a", top: "#fff2c0" }));
          if (Hw > hh + 0.01) both(ca, cb, hh, Hw);
        } else {
          const hh = Math.min(p.style === "passage" ? 2.1 : 2.05, Hw);
          if (Hw > hh + 0.01) both(ca, cb, hh, Hw);
          if (p.style !== "passage") { both(ca, ca + 0.04, 0, hh, "#ffffff"); both(cb - 0.04, cb, 0, hh, "#ffffff"); }
        }
        cur = Math.max(cur, op.b);
      });
      if (cur < a1) solid(cur, a1);
    });
  });
  // furniture
  f.furniture.forEach((it) => {
    const parts = furnParts(it); if (!parts.length) return;
    const sv = parts.map((q) => prism(V, q.pts, q.y0, q.y1, q.col)).join("");
    if (it.type === "rug") under += sv; else T(it.x, it.z, sv);
  });
  things.sort((a, b) => a.k - b.k);
  return { V, under, body: things.map((t) => t.s).join("") };
}

export function toSolid(plan, floorId, o) {
  o = o || {};
  const f = plan.floors.find((q) => q.id === floorId); if (!f) return null;
  const cam = SOLID_CAM.default, yaw = o.yaw != null ? o.yaw : cam[0], pitch = o.pitch != null ? o.pitch : cam[1];
  const r = solidFloor(plan, f, { yaw, pitch }), V = r.V, night = !!o.night;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${V.w} ${V.h}" width="${V.w}" height="${V.h}">
<defs><filter id="bl" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="${SC * 0.22}"/></filter>
<filter id="nt" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values=".62 0 0 0 0  0 .68 0 0 0  0 0 .82 0 .02  0 0 0 1 0"/></filter></defs>
<g${night ? ' filter="url(#nt)"' : ""}>${r.under}<g stroke="rgba(14,18,30,.3)" stroke-width=".7" stroke-linejoin="round" stroke-linecap="round">${r.body}</g></g>
</svg>`;
  return { svg, w: V.w, h: V.h };
}

// the room shapes and the places of the devices on the solid picture, as fractions of its size
export function solidGeometry(plan, floorId, o) {
  o = o || {};
  const f = plan.floors.find((q) => q.id === floorId); if (!f) return null;
  const cam = SOLID_CAM.default, V = mkView(f.W, f.D, o.yaw != null ? o.yaw : cam[0], o.pitch != null ? o.pitch : cam[1]);
  const n = (X, Y, Z) => { const p = V.P(X, Y, Z); return [r2(p[0] / V.w), r2(p[1] / V.h)]; };
  return {
    w: V.w, h: V.h, solid: true,
    rooms: f.rooms.map((q) => ({ id: q.rid, room: q.id, pts: [n(q.x0, 0, q.z0), n(q.x1, 0, q.z0), n(q.x1, 0, q.z1), n(q.x0, 0, q.z1)] })),
    devs: (f.devs || []).map((d, i) => { const p = n(d.x, 0.9, d.z); return { id: "a" + i, ent: d.ent, x: p[0], y: p[1] }; }),
  };
}
export const AUTO_VERSION = 2;
