// Quint: 3D model import for the furniture editor.
// Reads a GLB / GLTF / OBJ / STL file and rebuilds it from a few coloured boxes (the parts of a furniture
// pack item). Everything happens in the browser; the file is never uploaded. The result is an approximation
// of the shape (a voxel model merged into at most MAX_PARTS boxes), not the original mesh.

export const MAX_PARTS = 56;
export const MAX_BYTES = 80 * 1024 * 1024;

const COMPONENT = {
  5120: [1, Int8Array],
  5121: [1, Uint8Array],
  5122: [2, Int16Array],
  5123: [2, Uint16Array],
  5125: [4, Uint32Array],
  5126: [4, Float32Array],
};
const TYPE_SIZE = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT4: 16 };

class ModelError extends Error {
  constructor(code, detail = "") {
    super(detail || code);
    this.code = code;
  }
}

const toSrgb = (c) => {
  const x = Math.max(0, Math.min(1, c));
  return Math.round((x <= 0.0031308 ? x * 12.92 : 1.055 * Math.pow(x, 1 / 2.4) - 0.055) * 255);
};

// ---------------------------------------------------------------------------------------- glTF / GLB

function b64(uri) {
  const bin = atob(uri.slice(uri.indexOf(",") + 1));
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function mul(a, b) {
  const o = new Array(16).fill(0);
  for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) for (let k = 0; k < 4; k++) o[c * 4 + r] += a[k * 4 + r] * b[c * 4 + k];
  return o;
}

function nodeMatrix(n) {
  if (Array.isArray(n.matrix) && n.matrix.length === 16) return n.matrix;
  const [x, y, z, w] = n.rotation ?? [0, 0, 0, 1];
  const [sx, sy, sz] = n.scale ?? [1, 1, 1];
  const [tx, ty, tz] = n.translation ?? [0, 0, 0];
  const xx = x * x, yy = y * y, zz = z * z, xy = x * y, xz = x * z, yz = y * z, wx = w * x, wy = w * y, wz = w * z;
  return [
    (1 - 2 * (yy + zz)) * sx, 2 * (xy + wz) * sx, 2 * (xz - wy) * sx, 0,
    2 * (xy - wz) * sy, (1 - 2 * (xx + zz)) * sy, 2 * (yz + wx) * sy, 0,
    2 * (xz + wy) * sz, 2 * (yz - wx) * sz, (1 - 2 * (xx + yy)) * sz, 0,
    tx, ty, tz, 1,
  ];
}

async function loadImage(bytes, mime) {
  if (typeof createImageBitmap !== "function" || typeof document === "undefined") return null;
  try {
    const bmp = await createImageBitmap(new Blob([bytes], { type: mime || "image/png" }));
    const k = Math.min(1, 256 / Math.max(bmp.width, bmp.height));
    const w = Math.max(1, Math.round(bmp.width * k)), h = Math.max(1, Math.round(bmp.height * k));
    const cv = document.createElement("canvas");
    cv.width = w;
    cv.height = h;
    const cx = cv.getContext("2d", { willReadFrequently: true });
    cx.drawImage(bmp, 0, 0, w, h);
    return { w, h, data: cx.getImageData(0, 0, w, h).data };
  } catch {
    return null;
  }
}

async function parseGltf(json, bin, files) {
  if ((json.extensionsRequired ?? []).some((e) => /draco|meshopt/i.test(e))) throw new ModelError("compressed");
  const buffers = (json.buffers ?? []).map((b, i) => {
    if (i === 0 && !b.uri && bin) return bin;
    if (typeof b.uri === "string" && b.uri.startsWith("data:")) return b64(b.uri);
    const f = files?.get(decodeURIComponent(b.uri ?? "").split("/").pop());
    if (f) return f;
    throw new ModelError("external_buffer", b.uri ?? "");
  });
  const view = (i) => {
    const v = json.bufferViews[i];
    return { buf: buffers[v.buffer], off: v.byteOffset ?? 0, len: v.byteLength, stride: v.byteStride ?? 0 };
  };
  const read = (ai) => {
    const a = json.accessors[ai];
    if (a.sparse) throw new ModelError("unsupported", "sparse accessor");
    const [csize, Arr] = COMPONENT[a.componentType];
    const n = TYPE_SIZE[a.type];
    const out = new Float64Array(a.count * n);
    if (a.bufferView === undefined) return out;
    const v = view(a.bufferView);
    const stride = v.stride || csize * n;
    const base = v.buf.byteOffset + v.off + (a.byteOffset ?? 0);
    const dv = new DataView(v.buf.buffer);
    const get = { 5120: "getInt8", 5121: "getUint8", 5122: "getInt16", 5123: "getUint16", 5125: "getUint32", 5126: "getFloat32" }[a.componentType];
    const norm = a.normalized ? { 5120: 127, 5121: 255, 5122: 32767, 5123: 65535 }[a.componentType] : 0;
    for (let i = 0; i < a.count; i++)
      for (let j = 0; j < n; j++) {
        const x = csize === 1 ? dv[get](base + i * stride + j) : dv[get](base + i * stride + j * csize, true);
        out[i * n + j] = norm ? Math.max(-1, x / norm) : x;
      }
    void Arr;
    return out;
  };

  const images = [];
  for (let i = 0; i < (json.images ?? []).length; i++) {
    const im = json.images[i];
    let bytes = null;
    if (im.bufferView !== undefined) {
      const v = view(im.bufferView);
      bytes = v.buf.subarray(v.off, v.off + v.len);
    } else if (typeof im.uri === "string" && im.uri.startsWith("data:")) bytes = b64(im.uri);
    images.push(bytes ? await loadImage(bytes, im.mimeType) : null);
  }
  const mats = (json.materials ?? []).map((m) => {
    const p = m.pbrMetallicRoughness ?? {};
    const f = p.baseColorFactor ?? [1, 1, 1, 1];
    const tex = p.baseColorTexture;
    const src = tex ? json.textures?.[tex.index]?.source : undefined;
    return {
      rgb: [toSrgb(f[0]), toSrgb(f[1]), toSrgb(f[2])],
      alpha: f[3],
      img: src !== undefined ? images[src] ?? null : null,
      uvset: tex?.texCoord ?? 0,
    };
  });
  const dflt = { rgb: [200, 200, 200], alpha: 1, img: null, uvset: 0 };

  const prims = [];
  const visit = (ni, parent, depth) => {
    if (depth > 64) return;
    const node = json.nodes[ni];
    const m = mul(parent, nodeMatrix(node));
    if (node.mesh !== undefined) {
      for (const pr of json.meshes[node.mesh].primitives ?? []) {
        const mode = pr.mode ?? 4;
        if (mode !== 4 && mode !== 5 && mode !== 6) continue;
        if (pr.attributes?.POSITION === undefined) continue;
        const pos = read(pr.attributes.POSITION);
        const uvAcc = pr.attributes["TEXCOORD_" + 0];
        const uv = uvAcc !== undefined ? read(uvAcc) : null;
        let idx;
        if (pr.indices !== undefined) idx = read(pr.indices);
        else idx = Float64Array.from({ length: pos.length / 3 }, (_, i) => i);
        const tri = [];
        if (mode === 4) for (let i = 0; i + 2 < idx.length; i += 3) tri.push(idx[i], idx[i + 1], idx[i + 2]);
        else if (mode === 5) for (let i = 0; i + 2 < idx.length; i++) tri.push(...(i % 2 ? [idx[i + 1], idx[i], idx[i + 2]] : [idx[i], idx[i + 1], idx[i + 2]]));
        else for (let i = 1; i + 1 < idx.length; i++) tri.push(idx[0], idx[i], idx[i + 1]);
        const n = tri.length / 3;
        const P = new Float32Array(n * 9);
        const U = uv ? new Float32Array(n * 6) : null;
        for (let t = 0; t < n; t++)
          for (let k = 0; k < 3; k++) {
            const vi = tri[t * 3 + k];
            const x = pos[vi * 3], y = pos[vi * 3 + 1], z = pos[vi * 3 + 2];
            P[t * 9 + k * 3] = m[0] * x + m[4] * y + m[8] * z + m[12];
            P[t * 9 + k * 3 + 1] = m[1] * x + m[5] * y + m[9] * z + m[13];
            P[t * 9 + k * 3 + 2] = m[2] * x + m[6] * y + m[10] * z + m[14];
            if (U) {
              U[t * 6 + k * 2] = uv[vi * 2];
              U[t * 6 + k * 2 + 1] = uv[vi * 2 + 1];
            }
          }
        const mat = pr.material !== undefined ? mats[pr.material] ?? dflt : dflt;
        prims.push({ pos: P, uv: U, mat });
      }
    }
    for (const c of node.children ?? []) visit(c, m, depth + 1);
  };
  const id = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
  const scene = json.scenes?.[json.scene ?? 0];
  const roots = scene?.nodes ?? (json.nodes ?? []).map((_, i) => i).filter((i) => !(json.nodes ?? []).some((n) => (n.children ?? []).includes(i)));
  for (const r of roots) visit(r, id, 0);
  return prims;
}

// ---------------------------------------------------------------------------------------- OBJ / MTL / STL

function parseMtl(text) {
  const out = new Map();
  let cur = null;
  for (const line of text.split(/\r?\n/)) {
    const p = line.trim().split(/\s+/);
    if (p[0] === "newmtl") cur = p.slice(1).join(" ");
    else if (p[0] === "Kd" && cur) out.set(cur, [0, 1, 2].map((i) => Math.round(Math.max(0, Math.min(1, +p[i + 1] || 0)) * 255)));
  }
  return out;
}

function parseObj(text, mtl) {
  const V = [];
  const groups = new Map();
  let cur = "";
  const key = () => {
    if (!groups.has(cur)) groups.set(cur, []);
    return groups.get(cur);
  };
  for (const line of text.split(/\r?\n/)) {
    const c = line.charCodeAt(0);
    if (c === 118 && line.charCodeAt(1) === 32) {
      const p = line.trim().split(/\s+/);
      V.push([+p[1], +p[2], +p[3]]);
    } else if (c === 102 && line.charCodeAt(1) === 32) {
      const ids = line.trim().split(/\s+/).slice(1).map((s) => {
        const i = parseInt(s, 10);
        return i < 0 ? V.length + i : i - 1;
      });
      const g = key();
      for (let i = 1; i + 1 < ids.length; i++) g.push(ids[0], ids[i], ids[i + 1]);
    } else if (line.startsWith("usemtl")) cur = line.slice(6).trim();
  }
  const prims = [];
  for (const [name, idx] of groups) {
    const n = idx.length / 3;
    const P = new Float32Array(n * 9);
    for (let t = 0; t < n; t++)
      for (let k = 0; k < 3; k++) {
        const v = V[idx[t * 3 + k]] ?? [0, 0, 0];
        P[t * 9 + k * 3] = v[0];
        P[t * 9 + k * 3 + 1] = v[1];
        P[t * 9 + k * 3 + 2] = v[2];
      }
    prims.push({ pos: P, uv: null, mat: { rgb: mtl?.get(name) ?? [200, 200, 200], alpha: 1, img: null, uvset: 0 } });
  }
  return prims;
}

function parseStl(buf) {
  const dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  const grey = { rgb: [200, 200, 200], alpha: 1, img: null, uvset: 0 };
  if (buf.byteLength >= 84) {
    const n = dv.getUint32(80, true);
    if (84 + n * 50 === buf.byteLength) {
      const P = new Float32Array(n * 9);
      for (let t = 0; t < n; t++)
        for (let k = 0; k < 9; k++) P[t * 9 + k] = dv.getFloat32(84 + t * 50 + 12 + k * 4, true);
      return [{ pos: P, uv: null, mat: grey }];
    }
  }
  const text = new TextDecoder().decode(buf);
  const nums = [...text.matchAll(/vertex\s+(\S+)\s+(\S+)\s+(\S+)/g)];
  const n = Math.floor(nums.length / 3);
  if (!n) throw new ModelError("not_a_model");
  const P = new Float32Array(n * 9);
  for (let i = 0; i < n * 3; i++) for (let k = 0; k < 3; k++) P[i * 3 + k] = +nums[i][k + 1];
  return [{ pos: P, uv: null, mat: grey }];
}

/** Read the files of one model (one .glb/.gltf/.obj/.stl, optionally with its .mtl and .bin). */
export async function loadModel(fileList) {
  const files = [...fileList];
  if (!files.length) throw new ModelError("no_file");
  for (const f of files) if (f.size > MAX_BYTES) throw new ModelError("too_large");
  const ext = (f) => (f.name.split(".").pop() ?? "").toLowerCase();
  const main = files.find((f) => ["glb", "gltf", "obj", "stl"].includes(ext(f)));
  if (!main) throw new ModelError("unsupported_type");
  const kind = ext(main);
  const bytes = new Uint8Array(await main.arrayBuffer());
  let prims;
  if (kind === "glb") {
    const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    if (bytes.byteLength < 20 || dv.getUint32(0, true) !== 0x46546c67) throw new ModelError("not_a_model");
    let off = 12, json = null, bin = null;
    while (off + 8 <= bytes.byteLength) {
      const len = dv.getUint32(off, true), type = dv.getUint32(off + 4, true);
      const chunk = bytes.subarray(off + 8, off + 8 + len);
      if (type === 0x4e4f534a) json = JSON.parse(new TextDecoder().decode(chunk));
      else if (type === 0x004e4942 && !bin) bin = chunk;
      off += 8 + len + ((4 - (len % 4)) % 4);
    }
    if (!json) throw new ModelError("not_a_model");
    prims = await parseGltf(json, bin, null);
  } else if (kind === "gltf") {
    let json;
    try {
      json = JSON.parse(new TextDecoder().decode(bytes));
    } catch {
      throw new ModelError("not_a_model");
    }
    const ext = new Map();
    for (const f of files) if (f !== main) ext.set(f.name, new Uint8Array(await f.arrayBuffer()));
    prims = await parseGltf(json, null, ext);
  } else if (kind === "obj") {
    const mtlFile = files.find((f) => ext(f) === "mtl");
    prims = parseObj(new TextDecoder().decode(bytes), mtlFile ? parseMtl(await mtlFile.text()) : null);
  } else prims = parseStl(bytes);
  let tris = 0;
  for (const p of prims) tris += p.pos.length / 9;
  if (!tris) throw new ModelError("not_a_model");
  return { name: main.name.replace(/\.[^.]+$/, ""), kind, prims, tris, up: kind === "stl" ? "z" : "y" };
}

// ---------------------------------------------------------------------------------------- voxels -> boxes

function orient(model, up, turn) {
  // up axis to +y, then a turn of the front around the vertical axis (0, 90, 180, 270 degrees)
  const q = ((turn % 360) + 360) % 360;
  const out = [];
  let lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
  for (const p of model.prims) {
    const P = new Float32Array(p.pos.length);
    for (let i = 0; i < p.pos.length; i += 3) {
      let x = p.pos[i], y = p.pos[i + 1], z = p.pos[i + 2];
      if (up === "z") [y, z] = [z, -y];
      else if (up === "x") [x, y] = [-y, x];
      let a = x, b = z;
      if (q === 90) [a, b] = [z, -x];
      else if (q === 180) [a, b] = [-x, -z];
      else if (q === 270) [a, b] = [-z, x];
      P[i] = a;
      P[i + 1] = y;
      P[i + 2] = b;
      if (a < lo[0]) lo[0] = a;
      if (a > hi[0]) hi[0] = a;
      if (y < lo[1]) lo[1] = y;
      if (y > hi[1]) hi[1] = y;
      if (b < lo[2]) lo[2] = b;
      if (b > hi[2]) hi[2] = b;
    }
    out.push({ pos: P, uv: p.uv, mat: p.mat });
  }
  return { prims: out, lo, hi };
}

/** Size of the model in metres as read from the file (guessing metres, centimetres or millimetres). */
export function guessSize(model, up = model.up, turn = 0) {
  const o = orient(model, up, turn);
  const d = [o.hi[0] - o.lo[0], o.hi[1] - o.lo[1], o.hi[2] - o.lo[2]];
  const big = Math.max(...d);
  const k = big > 60 ? 0.001 : big > 8 ? 0.01 : 1;
  return { w: d[0] * k, d: d[2] * k, h: d[1] * k, ratio: d };
}

function sampleColor(mat, uv, a, b, c, wa, wb, wc) {
  if (mat.img && uv) {
    const u = uv[a] * wa + uv[b] * wb + uv[c] * wc;
    const v = uv[a + 1] * wa + uv[b + 1] * wb + uv[c + 1] * wc;
    const im = mat.img;
    const px = Math.min(im.w - 1, Math.max(0, Math.floor((u - Math.floor(u)) * im.w)));
    const py = Math.min(im.h - 1, Math.max(0, Math.floor((v - Math.floor(v)) * im.h)));
    const i = (py * im.w + px) * 4;
    return [(im.data[i] * mat.rgb[0]) / 255, (im.data[i + 1] * mat.rgb[1]) / 255, (im.data[i + 2] * mat.rgb[2]) / 255];
  }
  return mat.rgb;
}

const tick = () => new Promise((r) => setTimeout(r, 0));

function rasterize(o, n) {
  const [nx, ny, nz] = n;
  const total = nx * ny * nz;
  // the colour of a cell is the one most of its samples have (a vote), not a blend: a table's top and legs stay
  // brown and grey where they meet
  const cnt = new Uint32Array(total);
  const key = new Uint16Array(total);
  const votes = new Int32Array(total);
  const sum = new Float32Array(total * 3);
  const sx = (o.hi[0] - o.lo[0]) / nx || 1, sy = (o.hi[1] - o.lo[1]) / ny || 1, sz = (o.hi[2] - o.lo[2]) / nz || 1;
  const step = Math.min(sx, sy, sz) * 0.6;
  const cell = (x, y, z) => {
    const i = Math.min(nx - 1, Math.max(0, Math.floor((x - o.lo[0]) / sx)));
    const j = Math.min(ny - 1, Math.max(0, Math.floor((y - o.lo[1]) / sy)));
    const k = Math.min(nz - 1, Math.max(0, Math.floor((z - o.lo[2]) / sz)));
    return (j * nz + k) * nx + i;
  };
  for (const pr of o.prims) {
    if (pr.mat.alpha < 0.1) continue;
    const P = pr.pos;
    const tn = P.length / 9;
    for (let t = 0; t < tn; t++) {
      const b = t * 9;
      const ax = P[b], ay = P[b + 1], az = P[b + 2], bx = P[b + 3], by = P[b + 4], bz = P[b + 5], cx = P[b + 6], cy = P[b + 7], cz = P[b + 8];
      const e = Math.max(Math.hypot(bx - ax, by - ay, bz - az), Math.hypot(cx - ax, cy - ay, cz - az), Math.hypot(cx - bx, cy - by, cz - bz));
      const m = Math.min(40, Math.max(1, Math.ceil(e / step)));
      for (let i = 0; i <= m; i++)
        for (let j = 0; j <= m - i; j++) {
          const wb = i / m, wc = j / m, wa = 1 - wb - wc;
          const x = ax * wa + bx * wb + cx * wc, y = ay * wa + by * wb + cy * wc, z = az * wa + bz * wb + cz * wc;
          const ci = cell(x, y, z);
          const col = sampleColor(pr.mat, pr.uv, t * 6, t * 6 + 2, t * 6 + 4, wa, wb, wc);
          const kq = ((col[0] >> 5) << 6) | ((col[1] >> 5) << 3) | (col[2] >> 5);
          if (!cnt[ci]) {
            key[ci] = kq;
            votes[ci] = 1;
            sum[ci * 3] = col[0];
            sum[ci * 3 + 1] = col[1];
            sum[ci * 3 + 2] = col[2];
          } else if (key[ci] === kq) {
            votes[ci]++;
            sum[ci * 3] += (col[0] - sum[ci * 3]) / votes[ci];
            sum[ci * 3 + 1] += (col[1] - sum[ci * 3 + 1]) / votes[ci];
            sum[ci * 3 + 2] += (col[2] - sum[ci * 3 + 2]) / votes[ci];
          } else if (--votes[ci] <= 0) {
            key[ci] = kq;
            votes[ci] = 1;
            sum[ci * 3] = col[0];
            sum[ci * 3 + 1] = col[1];
            sum[ci * 3 + 2] = col[2];
          }
          cnt[ci]++;
        }
    }
  }
  return { cnt, sum };
}

/** Fill the inside: empty cells the outside cannot reach become solid and take the colour of the nearest wall. */
function fillInside(solid, rgb, n) {
  const [nx, ny, nz] = n;
  const total = nx * ny * nz;
  const outside = new Uint8Array(total);
  const stack = [];
  const idx = (i, j, k) => (j * nz + k) * nx + i;
  const push = (i, j, k) => {
    const c = idx(i, j, k);
    if (!solid[c] && !outside[c]) {
      outside[c] = 1;
      stack.push(i, j, k);
    }
  };
  for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) { push(i, j, 0); push(i, j, nz - 1); }
  for (let k = 0; k < nz; k++) for (let j = 0; j < ny; j++) { push(0, j, k); push(nx - 1, j, k); }
  for (let i = 0; i < nx; i++) for (let k = 0; k < nz; k++) { push(i, 0, k); push(i, ny - 1, k); }
  while (stack.length) {
    const k = stack.pop(), j = stack.pop(), i = stack.pop();
    if (i > 0) push(i - 1, j, k);
    if (i < nx - 1) push(i + 1, j, k);
    if (j > 0) push(i, j - 1, k);
    if (j < ny - 1) push(i, j + 1, k);
    if (k > 0) push(i, j, k - 1);
    if (k < nz - 1) push(i, j, k + 1);
  }
  // inner cells: breadth-first from the walls so the colour spreads inwards
  const q = [];
  for (let c = 0; c < total; c++) if (solid[c]) q.push(c);
  let h = 0;
  while (h < q.length) {
    const c = q[h++];
    const i = c % nx, k = Math.floor(c / nx) % nz, j = Math.floor(c / (nx * nz));
    const nb = [i > 0 ? c - 1 : -1, i < nx - 1 ? c + 1 : -1, k > 0 ? c - nx : -1, k < nz - 1 ? c + nx : -1, j > 0 ? c - nx * nz : -1, j < ny - 1 ? c + nx * nz : -1];
    for (const d of nb) {
      if (d < 0 || solid[d] || outside[d]) continue;
      solid[d] = 1;
      rgb[d * 3] = rgb[c * 3];
      rgb[d * 3 + 1] = rgb[c * 3 + 1];
      rgb[d * 3 + 2] = rgb[c * 3 + 2];
      q.push(d);
    }
  }
}

/** Median cut: reduce the colours of the cells to at most k. Returns the palette and the palette index of each cell. */
function quantize(cells, rgb, k) {
  let boxes = [cells.slice()];
  const range = (b, ch) => {
    let lo = 255, hi = 0;
    for (const c of b) {
      const v = rgb[c * 3 + ch];
      if (v < lo) lo = v;
      if (v > hi) hi = v;
    }
    return hi - lo;
  };
  while (boxes.length < k) {
    let bi = -1, best = 0, bch = 0;
    boxes.forEach((b, i) => {
      if (b.length < 2) return;
      for (let ch = 0; ch < 3; ch++) {
        const r = range(b, ch);
        if (r * Math.sqrt(b.length) > best) {
          best = r * Math.sqrt(b.length);
          bi = i;
          bch = ch;
        }
      }
    });
    if (bi < 0 || best < 12) break;
    const b = boxes[bi].sort((p, q) => rgb[p * 3 + bch] - rgb[q * 3 + bch]);
    const mid = b.length >> 1;
    boxes.splice(bi, 1, b.slice(0, mid), b.slice(mid));
  }
  const pal = [];
  const of = new Map();
  boxes.forEach((b, i) => {
    let r = 0, g = 0, bl = 0;
    for (const c of b) {
      r += rgb[c * 3];
      g += rgb[c * 3 + 1];
      bl += rgb[c * 3 + 2];
      of.set(c, i);
    }
    pal.push([Math.round(r / b.length), Math.round(g / b.length), Math.round(bl / b.length)]);
  });
  return { pal, of };
}

function mesh(cells, of, n) {
  const [nx, ny, nz] = n;
  const used = new Uint8Array(nx * ny * nz);
  const at = (i, j, k) => (j * nz + k) * nx + i;
  const boxes = [];
  for (let j = 0; j < ny; j++)
    for (let k = 0; k < nz; k++)
      for (let i = 0; i < nx; i++) {
        const c = at(i, j, k);
        if (!of.has(c) || used[c]) continue;
        const col = of.get(c);
        const ok = (x, y, z) => {
          const d = at(x, y, z);
          return !used[d] && of.get(d) === col;
        };
        let x1 = i;
        while (x1 + 1 < nx && ok(x1 + 1, j, k)) x1++;
        let z1 = k;
        grow: while (z1 + 1 < nz) {
          for (let x = i; x <= x1; x++) if (!ok(x, j, z1 + 1)) break grow;
          z1++;
        }
        let y1 = j;
        grow2: while (y1 + 1 < ny) {
          for (let z = k; z <= z1; z++) for (let x = i; x <= x1; x++) if (!ok(x, y1 + 1, z)) break grow2;
          y1++;
        }
        for (let y = j; y <= y1; y++) for (let z = k; z <= z1; z++) for (let x = i; x <= x1; x++) used[at(x, y, z)] = 1;
        boxes.push({ x0: i, x1: x1 + 1, y0: j, y1: y1 + 1, z0: k, z1: z1 + 1, col });
      }
  return boxes;
}

const hex = (c) => "#" + c.map((v) => Math.max(0, Math.min(255, v)).toString(16).padStart(2, "0")).join("");
const r4 = (x) => Math.round(x * 10000) / 10000;

/**
 * Build the furniture parts of a model.
 * opts: { height (m, the finished item's height), detail (1 low .. 3 high), up ("y"|"z"|"x"), turn (0|90|180|270) }
 * Returns { size:[w,d,h], parts, colors, cells }.
 */
export async function buildParts(model, opts = {}) {
  const up = opts.up ?? model.up, turn = opts.turn ?? 0, detail = opts.detail ?? 2;
  const o = orient(model, up, turn);
  const dim = [o.hi[0] - o.lo[0], o.hi[1] - o.lo[1], o.hi[2] - o.lo[2]].map((x) => Math.max(x, 1e-9));
  const g = guessSize(model, up, turn);
  const height = Math.min(10, Math.max(0.01, opts.height ?? g.h));
  const k = height / dim[1];
  const size = [Math.min(10, Math.max(0.01, dim[0] * k)), Math.min(10, Math.max(0.01, dim[2] * k)), height].map((x) => Math.round(x * 100) / 100);
  const longest = Math.max(...dim);
  let N = { 1: 12, 2: 20, 3: 32 }[detail] ?? 20;
  let K = { 1: 4, 2: 6, 3: 8 }[detail] ?? 6;
  await tick();
  for (let round = 0; round < 24; round++) {
    const s = longest / N;
    const n = dim.map((d) => Math.min(64, Math.max(1, Math.round(d / s))));
    const { cnt, sum } = rasterize(o, n);
    const total = n[0] * n[1] * n[2];
    const solid = new Uint8Array(total);
    const rgb = new Float32Array(total * 3);
    for (let c = 0; c < total; c++)
      if (cnt[c]) {
        solid[c] = 1;
        rgb[c * 3] = sum[c * 3];
        rgb[c * 3 + 1] = sum[c * 3 + 1];
        rgb[c * 3 + 2] = sum[c * 3 + 2];
      }
    fillInside(solid, rgb, n);
    const cells = [];
    for (let c = 0; c < total; c++) if (solid[c]) cells.push(c);
    if (!cells.length) throw new ModelError("empty");
    const { pal, of } = quantize(cells, rgb, K);
    let boxes = mesh(cells, of, n);
    // too many boxes: first fewer colours, then a coarser grid
    while (boxes.length > MAX_PARTS && pal.length > 1) {
      K = Math.max(1, Math.floor(K * 0.7));
      const q2 = quantize(cells, rgb, K);
      boxes = mesh(cells, q2.of, n);
      pal.length = 0;
      pal.push(...q2.pal);
      if (boxes.length <= MAX_PARTS) {
        return finish(boxes, pal, n, size, cells.length);
      }
      if (K === 1) break;
    }
    if (boxes.length <= MAX_PARTS) return finish(boxes, pal, n, size, cells.length);
    N = Math.max(4, Math.floor(N * 0.8));
    K = { 1: 4, 2: 6, 3: 8 }[detail] ?? 6;
    await tick();
  }
  throw new ModelError("too_complex");
}

function finish(boxes, pal, n, size, cells) {
  const parts = boxes.map((b) => ({
    shape: "box",
    x: r4(((b.x0 + b.x1) / 2 / n[0]) - 0.5),
    z: r4(((b.z0 + b.z1) / 2 / n[2]) - 0.5),
    w: Math.max(0.001, r4((b.x1 - b.x0) / n[0])),
    d: Math.max(0.001, r4((b.z1 - b.z0) / n[2])),
    y: r4(b.y0 / n[1]),
    h: Math.max(0.001, r4((b.y1 - b.y0) / n[1])),
    color: hex(pal[b.col]),
  }));
  return { size, parts, colors: pal.length, cells };
}

/** Draw the parts on a canvas as a small isometric picture. */
export function drawParts(canvas, parts, size) {
  const cx = canvas.getContext("2d");
  const W = canvas.width, H = canvas.height;
  cx.clearRect(0, 0, W, H);
  const ang = Math.PI / 6;
  const ca = Math.cos(ang), sa = Math.sin(ang);
  const sc = Math.max(size[0], size[1], size[2]);
  const proj = (x, y, z) => [(x - z) * ca, (x + z) * sa - y];
  const faces = [];
  for (const p of parts) {
    const x0 = (p.x - p.w / 2) * size[0], x1 = (p.x + p.w / 2) * size[0];
    const z0 = (p.z - p.d / 2) * size[1], z1 = (p.z + p.d / 2) * size[1];
    const y0 = p.y * size[2], y1 = (p.y + p.h) * size[2];
    const key = (x0 + x1 + z0 + z1) / 2 - (y0 + y1) * 0.2;
    faces.push({ p, x0, x1, z0, z1, y0, y1, key });
  }
  faces.sort((a, b) => a.key - b.key);
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const f of faces)
    for (const x of [f.x0, f.x1])
      for (const z of [f.z0, f.z1])
        for (const y of [f.y0, f.y1]) {
          const [a, b] = proj(x, y, z);
          minX = Math.min(minX, a); maxX = Math.max(maxX, a); minY = Math.min(minY, b); maxY = Math.max(maxY, b);
        }
  const k = Math.min((W - 16) / (maxX - minX || 1), (H - 16) / (maxY - minY || 1));
  const ox = W / 2 - ((minX + maxX) / 2) * k, oy = H / 2 - ((minY + maxY) / 2) * k;
  const P = (x, y, z) => {
    const [a, b] = proj(x, y, z);
    return [ox + a * k, oy + b * k];
  };
  void sc;
  const shade = (c, f) => {
    const m = /^#(..)(..)(..)$/.exec(c);
    if (!m) return c;
    const v = [1, 2, 3].map((i) => Math.round(parseInt(m[i], 16) * f));
    return `rgb(${v[0]},${v[1]},${v[2]})`;
  };
  const poly = (pts, fill) => {
    cx.beginPath();
    pts.forEach(([x, y], i) => (i ? cx.lineTo(x, y) : cx.moveTo(x, y)));
    cx.closePath();
    cx.fillStyle = fill;
    cx.fill();
    cx.strokeStyle = "rgba(0,0,0,.25)";
    cx.lineWidth = 0.6;
    cx.stroke();
  };
  for (const f of faces) {
    const c = f.p.color;
    poly([P(f.x0, f.y1, f.z0), P(f.x1, f.y1, f.z0), P(f.x1, f.y1, f.z1), P(f.x0, f.y1, f.z1)], shade(c, 1.1));
    poly([P(f.x0, f.y0, f.z1), P(f.x1, f.y0, f.z1), P(f.x1, f.y1, f.z1), P(f.x0, f.y1, f.z1)], shade(c, 0.85));
    poly([P(f.x1, f.y0, f.z0), P(f.x1, f.y0, f.z1), P(f.x1, f.y1, f.z1), P(f.x1, f.y1, f.z0)], shade(c, 0.65));
  }
}

export { ModelError };
