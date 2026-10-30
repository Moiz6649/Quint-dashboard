/* Quint live sky: the living background behind the 3D house.
   Painted on a plain 2D canvas that sits behind the house: a sky that follows the real sun (night, sunrise, day, sunset), the sun and the
   moon crossing it, stars, distant hills and a haze at the horizon (no clouds, no birds).
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
  const stars = Array.from({ length: 380 }, () => ({ x: R() * 2.4, y: Math.pow(R(), 1.35) * 0.78, r: 0.4 + R() * 1.1, ph: R() * 6.28, sp: 0.6 + R() * 2.2 }));
  let shoot = null, nextShoot = 8 + R() * 14;
  const tm = { v: 0 };   /* seconds of animation (does not run while hidden) */

  const size = () => {
    const w = canvas.clientWidth || 800, h = canvas.clientHeight || 500, k = clamp(Math.min(1, 900 / Math.max(w, 1)), 0.55, 1);
    const nw = Math.max(240, Math.round(w * k)), nh = Math.max(160, Math.round(h * k));
    if (nw !== canvas.width || nh !== canvas.height) { canvas.width = nw; canvas.height = nh; }
    W = canvas.width; H = canvas.height;
  };

  function frame(now) {
    raf = 0;
    if (dead) return;
    if (!canvas.isConnected) return;   /* the card is away from the page: the observers wake the sky when it comes back */
    const st = state() || {}, animate = st.anim !== false && !(typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches);
    const gap = animate ? 33 : 4000, vk = viewKey();
    if (now - lastDraw >= gap - 2 || still || vk !== lastView) {
      lastView = vk;
      lastDraw = now; still = 0;
      const dt = lastT ? Math.min(0.1, (now - lastT) / 1000) : 0.033; lastT = now;
      if (animate) tm.v += dt;
      draw(st, animate ? dt : 0);
    }
    schedule(animate);
  }
  let timer = 0, lastView = "";
  const view = { th: -0.6, ph: 0.85 };   /* the camera of the house: it turns and tilts the sky with it */
  const viewKey = () => { const v = globalThis.__qcView; return v ? v.th.toFixed(2) + "|" + v.ph.toFixed(2) : ""; };
  function schedule(animate) {
    if (dead || raf || timer) return;
    if (document.hidden || !visible) return;
    if (animate === false) { timer = setTimeout(() => { timer = 0; frame(performance.now()); }, 200); return; }
    raf = requestAnimationFrame(frame);
  }

  function draw(st, dt) {
    size();
    const e = Number.isFinite(st.e) ? st.e : 30, h = Number.isFinite(st.h) ? st.h : 12, cover = clamp(st.cover ?? 0.35, 0, 1), rain = clamp(st.rain || 0, 0, 1), snow = clamp(st.snow || 0, 0, 1), fog = clamp(st.fog || 0, 0, 1);
    const sk = skyColors(e);
    const tv = globalThis.__qcView || { th: -0.6, ph: 0.85 };
    view.th += (tv.th - view.th) * 0.5; view.ph += (tv.ph - view.ph) * 0.5;
    const hz = H * lerp(0.02, 0.62, clamp(view.ph / 1.5, 0, 1)), P = W * 2.4, sh = -(view.th + 0.6) * W * 0.4;
    const pan = (xp) => ((((xp + sh + 0.3 * P) % P) + P) % P) - 0.3 * P;
    const dull = clamp(cover * 0.45 + rain * 0.5 + fog * 0.4, 0, 0.7), lum = (c) => (c[0] + c[1] + c[2]) / 3;
    const dm = (c) => mixc(c, [lum(c) * 0.9 + 12, lum(c) * 0.92 + 12, lum(c) * 0.98 + 14], dull);
    const top = dm(sk.top), mid = dm(sk.mid), hor = dm(sk.hor);
    const gr = g.createLinearGradient(0, 0, 0, Math.max(hz, 60));
    gr.addColorStop(0, rgb(top)); gr.addColorStop(0.55, rgb(mid)); gr.addColorStop(1, rgb(hor));
    g.globalCompositeOperation = "source-over"; g.fillStyle = gr; g.fillRect(0, 0, W, H);

    /* stars */
    const night = clamp((-e - 4) / 10, 0, 1) * (1 - dull);
    if (night > 0.01) {
      for (const s of stars) {
        const tw = 0.62 + 0.38 * Math.sin(tm.v * s.sp + s.ph);
        g.fillStyle = `rgba(255,250,240,${(night * tw * (0.45 + s.r * 0.35)).toFixed(3)})`;
        const sx = pan(s.x * W), sy = s.y * hz * 0.95; if (sx < -4 || sx > W + 4) continue;
        g.beginPath(); g.arc(sx, sy, s.r * (W / 900 + 0.4), 0, 7); g.fill();
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
      const a = clamp((e + 8) / 8, 0, 1) * (1 - dull * 0.7), x = pan(sunX * W), y = sunY, R0 = Math.max(18, W * 0.028);
      const glow = g.createRadialGradient(x, y, R0 * 0.4, x, y, R0 * 9);
      glow.addColorStop(0, `rgba(255,${e < 6 ? 190 : 238},${e < 6 ? 130 : 190},${(0.55 * a).toFixed(3)})`); glow.addColorStop(1, "rgba(255,200,140,0)");
      g.fillStyle = glow; g.fillRect(0, 0, W, H);
      g.fillStyle = `rgba(255,${e < 6 ? 214 : 246},${e < 6 ? 150 : 214},${a.toFixed(3)})`; g.beginPath(); g.arc(x, y, R0, 0, 7); g.fill();
    }
    if (nightT >= 0 && nightT <= 1 && e < 4) {
      const a = clamp((4 - e) / 8, 0, 1) * (1 - dull * 0.8), x = pan(lerp(0.26, 0.9, nightT) * W), y = hz - Math.sin(nightT * Math.PI) * (hz - H * 0.12) * 0.92, R0 = Math.max(14, W * 0.022);
      const glow = g.createRadialGradient(x, y, R0 * 0.5, x, y, R0 * 8);
      glow.addColorStop(0, `rgba(190,210,255,${(0.32 * a).toFixed(3)})`); glow.addColorStop(1, "rgba(150,180,255,0)");
      g.fillStyle = glow; g.fillRect(0, 0, W, H);
      g.fillStyle = `rgba(244,244,232,${a.toFixed(3)})`; g.beginPath(); g.arc(x, y, R0, 0, 7); g.fill();
      g.fillStyle = `rgba(190,196,206,${(0.5 * a).toFixed(3)})`;
      for (const [dx, dy, r] of [[-0.3, -0.2, 0.26], [0.25, 0.1, 0.2], [-0.05, 0.35, 0.16], [0.3, -0.35, 0.12]]) { g.beginPath(); g.arc(x + dx * R0, y + dy * R0, r * R0, 0, 7); g.fill(); }
    }

    /* hills at the horizon */
    const light = clamp((e + 6) / 22, 0.1, 1), hillCol = (base) => mixc(mixc(base.map((v) => v * 0.2), base, light), mixc(hor, base, 0.4), 0.0);
    const hill = (yb, amp, f1, f2, ph0, col, haze, par) => {
      const ph = ph0 - (sh / W) * par;
      g.beginPath(); g.moveTo(0, H);
      for (let x = 0; x <= W; x += 12) { const t = x / W; g.lineTo(x, yb - amp * (0.55 + 0.45 * Math.sin(t * f1 + ph)) - amp * 0.35 * Math.sin(t * f2 + ph * 2.1)); }
      g.lineTo(W, H); g.closePath();
      const hg = g.createLinearGradient(0, yb - amp * 1.4, 0, H); hg.addColorStop(0, rgb(mixc(col, hor, haze))); hg.addColorStop(0.6, rgb(col)); hg.addColorStop(1, rgb(col));
      g.fillStyle = hg; g.fill();
    };
    hill(hz + H * 0.02, H * 0.085, 5.2, 11.5, 0.6, hillCol([110, 150, 168]), 0.5, 4.2);
    hill(hz + H * 0.07, H * 0.07, 7.1, 15, 2.3, hillCol([86, 148, 100]), 0.28, 6.5);
    hill(hz + H * 0.14, H * 0.06, 4.4, 9.5, 4.1, hillCol([70, 138, 78]), 0.1, 9);
    g.fillStyle = rgb(hillCol([62, 126, 68])); g.fillRect(0, hz + H * 0.2, W, H);
    /* the field the house stands in: mown stripes that spread out towards you */
    const fy0 = hz + H * 0.2, N = 9;
    for (let k = 0; k < N; k++) { const y0 = fy0 + (H - fy0) * Math.pow(k / N, 1.7), y1 = fy0 + (H - fy0) * Math.pow((k + 1) / N, 1.7); g.fillStyle = k % 2 ? "rgba(255,255,255,.045)" : "rgba(0,0,0,.05)"; g.fillRect(0, y0, W, y1 - y0 + 1); }

    /* haze over the hills, thicker with fog, a sunrise glow along the horizon */
    const hzg = g.createLinearGradient(0, hz - H * 0.12, 0, hz + H * 0.12);
    const glowK = clamp(1 - Math.abs(e - 1.5) / 8, 0, 1);
    hzg.addColorStop(0, rgb(hor, 0)); hzg.addColorStop(0.5, rgb(mixc(hor, [255, 190, 130], glowK * 0.5), 0.34 + fog * 0.4 + glowK * 0.18)); hzg.addColorStop(1, rgb(hor, 0));
    g.fillStyle = hzg; g.fillRect(0, hz - H * 0.12, W, H * 0.24);

    /* night tint over everything but the stars, a mist in fog */
    if (fog > 0.05) { g.fillStyle = rgb(hor, fog * 0.35); g.fillRect(0, 0, W, H); }
    canvas.dataset.qskyN = String((+canvas.dataset.qskyN || 0) + 1); canvas.dataset.qskyE = String(Math.round(e)); canvas.dataset.qskyH = String(Math.round(h * 10) / 10);
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
