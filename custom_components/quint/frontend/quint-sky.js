/* Quint live sky: the living background behind the 3D house.
   Painted on a plain 2D canvas that sits behind the house: a sky that follows the real sun (night, sunrise, day, sunset), the sun and the
   moon crossing it, stars, clouds that drift all the time, birds in the morning, distant hills and a haze at the horizon.
   mount(canvas, state) starts it; state() is asked for { e: sun height in degrees, h: hour of the day, cover: 0..1 clouds, rain: 0..1, snow: 0..1,
   fog: 0..1, anim: true|false, test: bool } on every frame. It stops by itself when the canvas leaves the page, hides while the page is
   hidden or the card is off screen, and paints a still picture when animation is off. */

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const mixc = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
const rgb = (c, a) => (a === undefined ? `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})` : `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`);

/* sun height -> sky colours (top, middle, horizon) */
const SKY = [
  [-18, [7, 11, 34], [13, 19, 54], [28, 36, 76]],
  [-9, [14, 20, 58], [36, 42, 90], [88, 70, 108]],
  [-3, [40, 56, 122], [140, 100, 138], [236, 142, 108]],
  [2, [64, 104, 186], [188, 148, 160], [255, 178, 122]],
  [9, [78, 142, 222], [158, 194, 232], [255, 222, 172]],
  [24, [60, 148, 236], [130, 192, 244], [212, 238, 255]],
  [60, [42, 132, 230], [108, 182, 242], [198, 230, 255]],
];
export function skyColors(e) {
  let i = 0;
  while (i < SKY.length - 2 && e > SKY[i + 1][0]) i++;
  const a = SKY[i], b = SKY[i + 1], t = clamp((e - a[0]) / (b[0] - a[0]), 0, 1);
  return { top: mixc(a[1], b[1], t), mid: mixc(a[2], b[2], t), hor: mixc(a[3], b[3], t) };
}

function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }

export function mount(canvas, state) {
  const g = canvas.getContext("2d");
  if (!g) return { stop() {}, redraw() {} };
  const R = rng(20261030);
  let W = 0, H = 0, raf = 0, dead = false, lastDraw = 0, lastT = 0, visible = true, still = 0;
  const stars = Array.from({ length: 170 }, () => ({ x: R(), y: Math.pow(R(), 1.35) * 0.78, r: 0.4 + R() * 1.1, ph: R() * 6.28, sp: 0.6 + R() * 2.2 }));
  let shoot = null, nextShoot = 8 + R() * 14;
  let clouds = [], sprites = [], spriteKey = "", cloudN = -1;
  const birds = []; let nextFlock = 0.4;
  const tm = { v: 0 };   /* seconds of animation (does not run while hidden) */

  const size = () => {
    const w = canvas.clientWidth || 800, h = canvas.clientHeight || 500, k = clamp(Math.min(1, 900 / Math.max(w, 1)), 0.55, 1);
    const nw = Math.max(240, Math.round(w * k)), nh = Math.max(160, Math.round(h * k));
    if (nw !== canvas.width || nh !== canvas.height) { canvas.width = nw; canvas.height = nh; }
    W = canvas.width; H = canvas.height;
  };

  /* a cumulus cloud sprite: a heap of round puffs, lit from above, shaded below */
  function cloudSprite(tone, idx) {
    const r = rng(7001 + idx * 131), w = 420, h = 190, c = document.createElement("canvas"); c.width = w; c.height = h;
    const x = c.getContext("2d"), n = 7 + ((r() * 4) | 0), puffs = [];
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1), px = 70 + t * 280 + (r() - 0.5) * 30, pr = (0.5 + Math.sin(t * Math.PI) * 0.75) * 48 * (0.7 + r() * 0.5);
      puffs.push({ x: px, y: 118 - Math.sin(t * Math.PI) * 30 + (r() - 0.5) * 16, r: pr });
    }
    puffs.push({ x: 210, y: 84, r: 58 + r() * 12 });
    for (const p of puffs) {
      const gr = x.createRadialGradient(p.x - p.r * 0.25, p.y - p.r * 0.45, p.r * 0.1, p.x, p.y, p.r);
      gr.addColorStop(0, rgb(tone.lit)); gr.addColorStop(0.62, rgb(mixc(tone.lit, tone.shade, 0.45))); gr.addColorStop(1, rgb(tone.shade, 0.0));
      x.fillStyle = gr; x.beginPath(); x.arc(p.x, p.y, p.r, 0, 7); x.fill();
    }
    /* flat underside */
    x.globalCompositeOperation = "destination-in";
    const fl = x.createLinearGradient(0, 100, 0, 168); fl.addColorStop(0, "rgba(0,0,0,1)"); fl.addColorStop(1, "rgba(0,0,0,0)");
    x.fillStyle = fl; x.fillRect(0, 0, w, h);
    return c;
  }
  function tones(e, cover, rain) {
    const day = clamp((e + 4) / 14, 0, 1), glow = clamp(1 - Math.abs(e - 1) / 9, 0, 1);   /* glow: sunrise / sunset colours */
    let lit = mixc([46, 52, 84], [255, 255, 255], day), shade = mixc([24, 28, 52], [190, 205, 226], day);
    lit = mixc(lit, [255, 196, 150], glow * 0.62); shade = mixc(shade, [196, 130, 130], glow * 0.55);
    const grey = clamp(cover * 0.55 + rain * 0.5, 0, 0.8);
    lit = mixc(lit, [168, 174, 186].map((v) => v * (0.3 + 0.7 * day)), grey); shade = mixc(shade, [104, 112, 128].map((v) => v * (0.3 + 0.7 * day)), grey);
    return { lit, shade };
  }
  function ensureClouds(e, cover, rain) {
    const t = tones(e, cover, rain), key = [t.lit, t.shade].map((c) => c.map((v) => Math.round(v / 10)).join(",")).join("|");
    if (key !== spriteKey) { spriteKey = key; sprites = [0, 1, 2, 3, 4].map((i) => cloudSprite(t, i)); }
    const want = Math.round(4 + cover * 8);
    if (want !== cloudN) {
      const r = rng(991);
      clouds = Array.from({ length: 13 }, (_, i) => ({ x: r(), y: 0.07 + r() * 0.42, s: 0.55 + r() * 0.95, v: 0.006 + r() * 0.012, sp: i % 5, a: 0.55 + r() * 0.4 }));
      clouds.forEach((c) => { c.v *= 0.5 + c.s * 0.5; });
      cloudN = want;
    }
    return want;
  }

  function spawnFlock(h, x0) {
    const left = R() < 0.5, n = h < 11 ? 3 + ((R() * 5) | 0) : 1 + ((R() * 2) | 0), y = 0.1 + R() * 0.32, v = (0.035 + R() * 0.03) * (left ? 1 : -1);
    for (let i = 0; i < n; i++) {
      birds.push({ x: x0 !== undefined ? x0 + i * -0.018 * Math.sign(v) : (left ? -0.06 : 1.06) + i * (left ? -0.02 : 0.02), y: y + (i % 2 ? 0.014 : -0.014) * ((i + 1) >> 1) + R() * 0.01, v: v * (0.92 + R() * 0.16), vy: (R() - 0.5) * 0.004, ph: R() * 6.28, f: 5 + R() * 3, s: 0.8 + R() * 0.35 });
    }
  }
  function bird(b, col, k) {
    const s = 10 * k * b.s, w = Math.sin(b.ph) * s * 0.9, dir = Math.sign(b.v) || 1;
    g.strokeStyle = col; g.lineWidth = Math.max(1, 1.4 * k); g.lineCap = "round";
    g.beginPath(); g.moveTo(b.px - s * 1.5 * dir, b.py - w * 0.3); g.quadraticCurveTo(b.px - s * 0.6 * dir, b.py - w - s * 0.2, b.px, b.py);
    g.quadraticCurveTo(b.px + s * 0.6 * dir, b.py - w - s * 0.2, b.px + s * 1.5 * dir, b.py - w * 0.3); g.stroke();
  }

  function frame(now) {
    raf = 0;
    if (dead) return;
    if (!canvas.isConnected) return;   /* the card is away from the page: the observers wake the sky when it comes back */
    const st = state() || {}, animate = st.anim !== false && !(typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches);
    const gap = animate ? 33 : 4000;
    if (now - lastDraw >= gap - 2 || still) {
      lastDraw = now; still = 0;
      const dt = lastT ? Math.min(0.1, (now - lastT) / 1000) : 0.033; lastT = now;
      if (animate) tm.v += dt;
      draw(st, animate ? dt : 0);
    }
    schedule(animate);
  }
  let timer = 0;
  function schedule(animate) {
    if (dead || raf || timer) return;
    if (document.hidden || !visible) return;
    if (animate === false) { timer = setTimeout(() => { timer = 0; frame(performance.now()); }, 5000); return; }
    raf = requestAnimationFrame(frame);
  }

  function draw(st, dt) {
    size();
    const e = Number.isFinite(st.e) ? st.e : 30, h = Number.isFinite(st.h) ? st.h : 12, cover = clamp(st.cover ?? 0.35, 0, 1), rain = clamp(st.rain || 0, 0, 1), snow = clamp(st.snow || 0, 0, 1), fog = clamp(st.fog || 0, 0, 1);
    const sk = skyColors(e), hz = H * 0.66;
    const dull = clamp(cover * 0.45 + rain * 0.5 + fog * 0.4, 0, 0.7), lum = (c) => (c[0] + c[1] + c[2]) / 3;
    const dm = (c) => mixc(c, [lum(c) * 0.9 + 12, lum(c) * 0.92 + 12, lum(c) * 0.98 + 14], dull);
    const top = dm(sk.top), mid = dm(sk.mid), hor = dm(sk.hor);
    const gr = g.createLinearGradient(0, 0, 0, H);
    gr.addColorStop(0, rgb(top)); gr.addColorStop(0.45, rgb(mid)); gr.addColorStop(0.7, rgb(hor)); gr.addColorStop(1, rgb(mixc(hor, mid, 0.4)));
    g.globalCompositeOperation = "source-over"; g.fillStyle = gr; g.fillRect(0, 0, W, H);

    /* stars */
    const night = clamp((-e - 4) / 10, 0, 1) * (1 - dull);
    if (night > 0.01) {
      for (const s of stars) {
        const tw = 0.62 + 0.38 * Math.sin(tm.v * s.sp + s.ph);
        g.fillStyle = `rgba(255,250,240,${(night * tw * (0.45 + s.r * 0.35)).toFixed(3)})`;
        g.beginPath(); g.arc(s.x * W, s.y * H * 0.9, s.r * (W / 900 + 0.4), 0, 7); g.fill();
      }
      if (dt) {
        nextShoot -= dt;
        if (nextShoot <= 0 && !shoot) { shoot = { x: 0.15 + R() * 0.6, y: 0.04 + R() * 0.25, t: 0 }; nextShoot = 14 + R() * 30; }
        if (shoot) {
          shoot.t += dt; const k = shoot.t / 0.9;
          if (k >= 1) shoot = null;
          else { const x = shoot.x + k * 0.18, y = shoot.y + k * 0.1; const lg = g.createLinearGradient(x * W, y * H, (x - 0.07) * W, (y - 0.04) * H); lg.addColorStop(0, `rgba(255,255,255,${(1 - k) * night})`); lg.addColorStop(1, "rgba(255,255,255,0)"); g.strokeStyle = lg; g.lineWidth = 1.6; g.beginPath(); g.moveTo(x * W, y * H); g.lineTo((x - 0.07) * W, (y - 0.04) * H); g.stroke(); }
        }
      }
    }

    /* sun and moon: the sun's height from the real sun, its place across the sky from the clock */
    const dayT = (h - 6) / 13, nightT = h >= 18 ? (h - 18) / 12 : h < 6 ? (h + 6) / 12 : -1;
    const sunX = lerp(0.24, 0.9, clamp(dayT, -0.05, 1.05)), sunY = hz - clamp((e + 2) / 62, -0.2, 1) * (hz - H * 0.1);
    if (e > -9) {
      const a = clamp((e + 8) / 8, 0, 1) * (1 - dull * 0.7), x = sunX * W, y = sunY, R0 = Math.max(18, W * 0.028);
      const glow = g.createRadialGradient(x, y, R0 * 0.4, x, y, R0 * 9);
      glow.addColorStop(0, `rgba(255,${e < 6 ? 190 : 238},${e < 6 ? 130 : 190},${(0.55 * a).toFixed(3)})`); glow.addColorStop(1, "rgba(255,200,140,0)");
      g.fillStyle = glow; g.fillRect(0, 0, W, H);
      g.fillStyle = `rgba(255,${e < 6 ? 214 : 246},${e < 6 ? 150 : 214},${a.toFixed(3)})`; g.beginPath(); g.arc(x, y, R0, 0, 7); g.fill();
    }
    if (nightT >= 0 && nightT <= 1 && e < 4) {
      const a = clamp((4 - e) / 8, 0, 1) * (1 - dull * 0.8), x = lerp(0.26, 0.9, nightT) * W, y = hz - Math.sin(nightT * Math.PI) * (hz - H * 0.12) * 0.92, R0 = Math.max(14, W * 0.022);
      const glow = g.createRadialGradient(x, y, R0 * 0.5, x, y, R0 * 8);
      glow.addColorStop(0, `rgba(190,210,255,${(0.32 * a).toFixed(3)})`); glow.addColorStop(1, "rgba(150,180,255,0)");
      g.fillStyle = glow; g.fillRect(0, 0, W, H);
      g.fillStyle = `rgba(244,244,232,${a.toFixed(3)})`; g.beginPath(); g.arc(x, y, R0, 0, 7); g.fill();
      g.fillStyle = `rgba(190,196,206,${(0.5 * a).toFixed(3)})`;
      for (const [dx, dy, r] of [[-0.3, -0.2, 0.26], [0.25, 0.1, 0.2], [-0.05, 0.35, 0.16], [0.3, -0.35, 0.12]]) { g.beginPath(); g.arc(x + dx * R0, y + dy * R0, r * R0, 0, 7); g.fill(); }
    }

    /* clouds (they always drift) */
    const nCl = ensureClouds(e, cover, rain);
    for (let i = 0; i < nCl; i++) {
      const c = clouds[i];
      if (dt) c.x += c.v * dt * (1 + (st.wind || 0) * 0.5);
      if (c.x > 1.3) c.x -= 1.6;
      const sp = sprites[c.sp], w = sp.width * c.s * (W / 1000) * 0.95, hh = sp.height * c.s * (W / 1000) * 0.95;
      g.globalAlpha = clamp(c.a * (0.55 + cover * 0.6), 0, 1) * (1 - fog * 0.3);
      g.drawImage(sp, c.x * W - w / 2 - 0.15 * W, c.y * H, w, hh);
    }
    g.globalAlpha = 1;

    /* hills at the horizon */
    const light = clamp((e + 6) / 22, 0.1, 1), hillCol = (base) => mixc(mixc(base.map((v) => v * 0.2), base, light), mixc(hor, base, 0.4), 0.0);
    const hill = (yb, amp, f1, f2, ph, col, haze) => {
      g.beginPath(); g.moveTo(0, H);
      for (let x = 0; x <= W; x += 12) { const t = x / W; g.lineTo(x, yb - amp * (0.55 + 0.45 * Math.sin(t * f1 + ph)) - amp * 0.35 * Math.sin(t * f2 + ph * 2.1)); }
      g.lineTo(W, H); g.closePath();
      const hg = g.createLinearGradient(0, yb - amp * 1.4, 0, H); hg.addColorStop(0, rgb(mixc(col, hor, haze))); hg.addColorStop(0.6, rgb(col)); hg.addColorStop(1, rgb(col));
      g.fillStyle = hg; g.fill();
    };
    hill(hz + H * 0.02, H * 0.085, 5.2, 11.5, 0.6, hillCol([110, 150, 168]), 0.5);
    hill(hz + H * 0.07, H * 0.07, 7.1, 15, 2.3, hillCol([86, 148, 100]), 0.28);
    hill(hz + H * 0.14, H * 0.06, 4.4, 9.5, 4.1, hillCol([70, 138, 78]), 0.1);
    g.fillStyle = rgb(hillCol([62, 126, 68])); g.fillRect(0, hz + H * 0.2, W, H);

    /* haze over the hills, thicker with fog, a sunrise glow along the horizon */
    const hzg = g.createLinearGradient(0, hz - H * 0.12, 0, hz + H * 0.12);
    const glowK = clamp(1 - Math.abs(e - 1.5) / 8, 0, 1);
    hzg.addColorStop(0, rgb(hor, 0)); hzg.addColorStop(0.5, rgb(mixc(hor, [255, 190, 130], glowK * 0.5), 0.34 + fog * 0.4 + glowK * 0.18)); hzg.addColorStop(1, rgb(hor, 0));
    g.fillStyle = hzg; g.fillRect(0, hz - H * 0.12, W, H * 0.24);

    /* birds: many in the morning, a pair now and then by day, swallows at dusk, none at night or in rain */
    if (dt && night < 0.5 && rain < 0.3) {
      nextFlock -= dt;
      if (nextFlock <= 0) {
        const morning = h >= 5.2 && h < 11, dusk = h >= 17 && h < 20;
        if (morning) { spawnFlock(h); nextFlock = 7 + R() * 9; }
        else if (dusk) { spawnFlock(h); nextFlock = 12 + R() * 14; }
        else if (h >= 11 && h < 17) { spawnFlock(h); nextFlock = 28 + R() * 40; }
        else nextFlock = 20;
      }
    }
    if (st.test && !birds.length && h >= 5.2 && h < 11) spawnFlock(h, 0.35);
    const col = e > 6 ? "rgba(36,40,52,.78)" : "rgba(26,22,34,.82)";
    for (let i = birds.length - 1; i >= 0; i--) {
      const b = birds[i];
      if (dt) { b.x += b.v * dt; b.y += b.vy * dt + Math.sin(tm.v * 0.8 + b.ph) * 0.0004; b.ph += b.f * dt; }
      if ((b.v > 0 && b.x > 1.15) || (b.v < 0 && b.x < -0.15)) { birds.splice(i, 1); continue; }
      b.px = b.x * W; b.py = b.y * H; bird(b, col, W / 900 + 0.3);
    }

    /* night tint over everything but the stars, a mist in fog */
    if (fog > 0.05) { g.fillStyle = rgb(hor, fog * 0.35); g.fillRect(0, 0, W, H); }
    canvas.dataset.qskyN = String((+canvas.dataset.qskyN || 0) + 1); canvas.dataset.qskyE = String(Math.round(e)); canvas.dataset.qskyH = String(Math.round(h * 10) / 10); canvas.dataset.qskyBirds = String(birds.length);
  }

  const ro = typeof ResizeObserver === "function" ? new ResizeObserver(() => { size(); still = 1; clearTimeout(timer); timer = 0; if (!raf) schedule(true); }) : null;
  if (ro) ro.observe(canvas);
  const io = typeof IntersectionObserver === "function" ? new IntersectionObserver((en) => { const l = en[en.length - 1]; visible = !!(l && l.isIntersecting); if (visible && !raf) { clearTimeout(timer); timer = 0; schedule(true); } }) : null;
  if (io) io.observe(canvas);
  const vis = () => { if (!document.hidden && !raf) { lastT = 0; clearTimeout(timer); timer = 0; schedule(true); } };
  document.addEventListener("visibilitychange", vis);
  size(); still = 1; schedule(true);
  return {
    stop() { dead = true; if (raf) cancelAnimationFrame(raf); raf = 0; clearTimeout(timer); timer = 0; if (ro) ro.disconnect(); if (io) io.disconnect(); document.removeEventListener("visibilitychange", vis); },
    redraw() { still = 1; clearTimeout(timer); timer = 0; if (!raf) schedule(true); },
  };
}
