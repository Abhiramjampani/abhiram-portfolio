/* ------------------------------------------------------------------
   Cinematic house-change transitions, drawn on a full-screen 2D canvas.

   dragonFlight  Stark → Targaryen: a dragon's silhouette sweeps across
                 the screen breathing fire; the page burns away into the
                 new theme.
   winterStorm   Targaryen → Stark: frost creeps in from the edges and a
                 blizzard whites out the screen, then thaws from the centre.

   Each calls `swap()` at the moment the screen is fully covered.
   ------------------------------------------------------------------ */

type V = { x: number; y: number };

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const smooth = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

function setup(canvas: HTMLCanvasElement) {
  const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
  const w = window.innerWidth;
  const h = window.innerHeight;
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  const ctx = canvas.getContext("2d")!;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, w, h };
}

function layer(w: number, h: number, scale = 0.5) {
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.round(w * scale));
  c.height = Math.max(1, Math.round(h * scale));
  const ctx = c.getContext("2d")!;
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  return { c, ctx };
}

function run(duration: number, frame: (t: number, dt: number) => void) {
  return new Promise<void>((resolve) => {
    const t0 = performance.now();
    let last = t0;
    const tick = (now: number) => {
      const t = (now - t0) / 1000;
      const dt = Math.min((now - last) / 1000, 1 / 20);
      last = now;
      frame(Math.min(t, duration), dt);
      if (t < duration) requestAnimationFrame(tick);
      else resolve();
    };
    requestAnimationFrame(tick);
  });
}

function sprite(stops: [number, string][], size = 128) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d")!;
  const r = size / 2;
  const gr = g.createRadialGradient(r, r, 0, r, r, r);
  for (const [o, col] of stops) gr.addColorStop(o, col);
  g.fillStyle = gr;
  g.fillRect(0, 0, size, size);
  return c;
}

/* ================================================================== */
/*  Dragon                                                             */
/* ================================================================== */

// Half-width of the body along the spine (s: 0 = snout, 1 = tail tip), in wing units.
const BODY: [number, number][] = [
  [0, 0.008],
  [0.015, 0.026],
  [0.04, 0.042],
  [0.058, 0.046],
  [0.075, 0.03],
  [0.1, 0.025],
  [0.19, 0.046],
  [0.27, 0.098],
  [0.36, 0.092],
  [0.46, 0.058],
  [0.6, 0.034],
  [0.8, 0.015],
  [1, 0.003],
];

function bodyWidth(s: number) {
  for (let i = 0; i < BODY.length - 1; i++) {
    const [s0, w0] = BODY[i];
    const [s1, w1] = BODY[i + 1];
    if (s <= s1) return w0 + ((w1 - w0) * (s - s0)) / (s1 - s0);
  }
  return BODY[BODY.length - 1][1];
}

// Wing bones at full spread (x forward, y outward), in wing units.
const WING = {
  shoulder: { x: 0.02, y: 0.07 },
  elbow: { x: 0.21, y: 0.36 },
  wrist: { x: 0.1, y: 0.6 },
  thumb: { x: 0.22, y: 0.67 },
  fingers: [
    { x: -0.04, y: 1.0 },
    { x: -0.3, y: 0.88 },
    { x: -0.5, y: 0.66 },
    { x: -0.57, y: 0.42 },
  ],
  root: { x: -0.4, y: 0.08 },
};

function smoothPath(ctx: CanvasRenderingContext2D, pts: V[], start: boolean) {
  if (start) ctx.moveTo(pts[0].x, pts[0].y);
  else ctx.lineTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length - 1; i++) {
    const mx = (pts[i].x + pts[i + 1].x) / 2;
    const my = (pts[i].y + pts[i + 1].y) / 2;
    ctx.quadraticCurveTo(pts[i].x, pts[i].y, mx, my);
  }
  const l = pts[pts.length - 1];
  ctx.lineTo(l.x, l.y);
}

/** Draws the dragon in local space: facing +x, chest at the origin, `U` = half wingspan. */
function drawDragon(ctx: CanvasRenderingContext2D, U: number, time: number, glow: number) {
  const phase = time * 5.2;
  const spine = (s: number): V => ({
    x: (0.55 - 2.05 * s) * U,
    y: 0.07 * U * Math.sin(phase - s * 7) * (0.08 + s),
  });

  const N = 72;
  const left: V[] = [];
  const right: V[] = [];
  for (let i = 0; i <= N; i++) {
    const s = i / N;
    const p = spine(s);
    const a = spine(Math.max(0, s - 0.01));
    const b = spine(Math.min(1, s + 0.01));
    const tx = b.x - a.x;
    const ty = b.y - a.y;
    const len = Math.hypot(tx, ty) || 1;
    const nx = -ty / len;
    const ny = tx / len;
    const wdt = bodyWidth(s) * U;
    left.push({ x: p.x + nx * wdt, y: p.y + ny * wdt });
    right.push({ x: p.x - nx * wdt, y: p.y - ny * wdt });
  }

  const skin = "rgba(12,6,5,0.98)";
  const membrane = "rgba(20,8,5,0.84)";
  const bone = "rgba(46,20,12,0.95)";
  ctx.shadowColor = `rgba(255,110,40,${0.55 * glow})`;
  ctx.shadowBlur = 0.07 * U;

  // Wings — flap cycle: spread shrinks on the upstroke and tips sweep back.
  const beat = time * Math.PI * 2 * 1.35;
  const k = 0.74 + 0.26 * Math.cos(beat);
  const chest = spine(0.27);
  for (const side of [-1, 1]) {
    const W = (p: V, tip = 0): V => {
      const sweep = (1 - k) * 0.38 + tip * (1 - k) * 0.12;
      return { x: (p.x - sweep * p.y) * U + chest.x, y: side * p.y * k * U + chest.y };
    };
    const S0 = W(WING.shoulder);
    const E = W(WING.elbow);
    const Wr = W(WING.wrist);
    const Th = W(WING.thumb);
    const F = WING.fingers.map((f) => W(f, 1));
    const R = W(WING.root);

    ctx.beginPath();
    ctx.moveTo(S0.x, S0.y);
    const ce = W({ x: 0.16, y: 0.18 });
    ctx.quadraticCurveTo(ce.x, ce.y, E.x, E.y);
    ctx.lineTo(Wr.x, Wr.y);
    const cf = W({ x: 0.08, y: 0.86 }, 0.5);
    ctx.quadraticCurveTo(cf.x, cf.y, F[0].x, F[0].y);
    const edge = [...F, R];
    for (let i = 0; i < edge.length - 1; i++) {
      const a = edge[i];
      const b = edge[i + 1];
      const mx = (a.x + b.x) / 2;
      const my = (a.y + b.y) / 2;
      // Scallops bow in toward the wrist, like stretched membrane.
      ctx.quadraticCurveTo(mx + (Wr.x - mx) * 0.24, my + (Wr.y - my) * 0.24, b.x, b.y);
    }
    ctx.closePath();
    ctx.fillStyle = membrane;
    ctx.fill();

    ctx.save();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = bone;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = 0.026 * U;
    ctx.beginPath();
    ctx.moveTo(S0.x, S0.y);
    ctx.lineTo(E.x, E.y);
    ctx.lineTo(Wr.x, Wr.y);
    ctx.lineTo(Th.x, Th.y);
    ctx.stroke();
    ctx.lineWidth = 0.009 * U;
    ctx.beginPath();
    for (const f of F) {
      ctx.moveTo(Wr.x, Wr.y);
      ctx.lineTo(f.x, f.y);
    }
    ctx.stroke();
    ctx.restore();
  }

  // Hind legs, tucked back in flight.
  ctx.fillStyle = skin;
  ctx.strokeStyle = skin;
  ctx.lineCap = "round";
  for (const side of [-1, 1]) {
    const i = Math.round(0.45 * N);
    const base = side > 0 ? left[i] : right[i];
    const knee = { x: base.x - 0.07 * U, y: base.y + side * 0.06 * U };
    const foot = { x: knee.x - 0.13 * U, y: knee.y - side * 0.005 * U };
    ctx.lineWidth = 0.032 * U;
    ctx.beginPath();
    ctx.moveTo(base.x + 0.02 * U, base.y - side * 0.01 * U);
    ctx.lineTo(knee.x, knee.y);
    ctx.lineTo(foot.x, foot.y);
    ctx.stroke();
    // Talons
    ctx.lineWidth = 0.008 * U;
    ctx.beginPath();
    for (const c of [-0.5, 0, 0.5]) {
      ctx.moveTo(foot.x, foot.y);
      ctx.lineTo(foot.x - 0.04 * U, foot.y + side * c * 0.035 * U);
    }
    ctx.stroke();
  }

  // Body, head to tail.
  ctx.beginPath();
  smoothPath(ctx, left, true);
  smoothPath(ctx, [...right].reverse(), false);
  ctx.closePath();
  ctx.fillStyle = skin;
  ctx.fill();

  // Horns sweeping back along the neck from the rear of the skull.
  const hi = Math.round(0.055 * N);
  for (const side of [-1, 1]) {
    const base = side > 0 ? left[hi] : right[hi];
    const neck = spine(0.14);
    ctx.beginPath();
    ctx.moveTo(base.x + 0.018 * U, base.y);
    ctx.quadraticCurveTo(
      base.x - 0.06 * U,
      base.y + side * 0.035 * U,
      neck.x - 0.02 * U,
      neck.y + side * 0.075 * U,
    );
    ctx.lineTo(base.x - 0.02 * U, base.y - side * 0.008 * U);
    ctx.closePath();
    ctx.fill();
  }

  // Spade at the tail tip.
  const tip = spine(1);
  const pre = spine(0.98);
  const dx = tip.x - pre.x;
  const dy = tip.y - pre.y;
  const dl = Math.hypot(dx, dy) || 1;
  const d = { x: dx / dl, y: dy / dl };
  const n = { x: -d.y, y: d.x };
  ctx.beginPath();
  ctx.moveTo(tip.x - d.x * 0.02 * U, tip.y - d.y * 0.02 * U);
  ctx.lineTo(tip.x + n.x * 0.055 * U + d.x * 0.04 * U, tip.y + n.y * 0.055 * U + d.y * 0.04 * U);
  ctx.lineTo(tip.x + d.x * 0.13 * U, tip.y + d.y * 0.13 * U);
  ctx.lineTo(tip.x - n.x * 0.055 * U + d.x * 0.04 * U, tip.y - n.y * 0.055 * U + d.y * 0.04 * U);
  ctx.closePath();
  ctx.fill();

  // Spinal ridge, faintly fire-lit.
  ctx.shadowBlur = 0;
  ctx.strokeStyle = "rgba(120,50,25,0.55)";
  ctx.lineWidth = 0.01 * U;
  ctx.beginPath();
  for (let i = Math.round(0.08 * N); i <= Math.round(0.9 * N); i++) {
    const p = spine(i / N);
    if (i === Math.round(0.08 * N)) ctx.moveTo(p.x, p.y);
    else ctx.lineTo(p.x, p.y);
  }
  ctx.stroke();

  return { mouth: spine(0) };
}

type Flame = { x: number; y: number; vx: number; vy: number; age: number; life: number; s0: number; s1: number; kind: 0 | 1 | 2 };

export function dragonFlight(canvas: HTMLCanvasElement, swap: () => void) {
  const { ctx, w, h } = setup(canvas);
  const U = Math.max(w, h) * (w < 700 ? 0.42 : 0.32);
  const diag = Math.hypot(w, h);
  const wash = layer(w, h, 0.5);

  const hot = sprite([
    [0, "rgba(255,238,180,1)"],
    [0.3, "rgba(255,190,80,0.7)"],
    [1, "rgba(255,110,20,0)"],
  ]);
  const mid = sprite([
    [0, "rgba(255,160,50,0.9)"],
    [0.45, "rgba(230,80,18,0.5)"],
    [1, "rgba(150,28,5,0)"],
  ]);
  const cool = sprite([
    [0, "rgba(180,40,10,0.7)"],
    [0.5, "rgba(100,16,4,0.32)"],
    [1, "rgba(40,5,0,0)"],
  ]);
  const spark = sprite([
    [0, "rgba(255,250,210,1)"],
    [0.25, "rgba(255,190,70,0.9)"],
    [1, "rgba(255,90,10,0)"],
  ], 32);
  const SPR = [hot, mid, cool];

  // Flight path: in from the lower right, out past the upper left.
  const P = [
    { x: w + U * 1.3, y: h * 1.02 },
    { x: w * 0.72, y: h * 0.62 },
    { x: w * 0.3, y: h * 0.42 },
    { x: -U * 1.9, y: h * 0.02 },
  ];
  const bez = (u: number): V => {
    const a = 1 - u;
    return {
      x: a * a * a * P[0].x + 3 * a * a * u * P[1].x + 3 * a * u * u * P[2].x + u * u * u * P[3].x,
      y: a * a * a * P[0].y + 3 * a * a * u * P[1].y + 3 * a * u * u * P[2].y + u * u * u * P[3].y,
    };
  };

  // The burn front sweeps the way the dragon flew: lower right → upper left.
  const D = { x: -w / diag, y: -h / diag };
  const Pp = { x: -D.y, y: D.x };
  const C = { x: w / 2, y: h / 2 };
  const R = diag / 2;
  const A = Math.min(w, h) * 0.07;
  const ph = [Math.random() * 6, Math.random() * 6, Math.random() * 6];
  const jag = (u: number, t: number) =>
    A * (0.5 * Math.sin(u * 0.011 + ph[0] + t * 1.3) + 0.32 * Math.sin(u * 0.029 + ph[1] - t * 2.2) + 0.18 * Math.sin(u * 0.071 + ph[2] + t * 3.9));
  const BURN0 = 1.3;
  const BURN1 = 2.45;
  const frontAt = (t: number) => -R - A * 2 + (2 * R + A * 4) * smooth(BURN0, BURN1, t);
  const edge = (f: number, t: number) => {
    const pts: V[] = [];
    const n = 90;
    for (let i = 0; i <= n; i++) {
      const u = -R - 60 + ((2 * R + 120) * i) / n;
      const q = f + jag(u, t);
      pts.push({ x: C.x + Pp.x * u + D.x * q, y: C.y + Pp.y * u + D.y * q });
    }
    return pts;
  };
  const strokeLine = (g: CanvasRenderingContext2D, pts: V[], off = 0) => {
    g.beginPath();
    pts.forEach((p, i) => (i ? g.lineTo(p.x + D.x * off, p.y + D.y * off) : g.moveTo(p.x + D.x * off, p.y + D.y * off)));
  };

  const flames: Flame[] = [];
  let emitCarry = 0;
  let wallCarry = 0;
  let sparkCarry = 0;
  let swapped = false;

  const FLIGHT = 2.1;
  const TOTAL = 2.9;

  return run(TOTAL, (t, dt) => {
    ctx.clearRect(0, 0, w, h);
    const f = frontAt(t);
    const burning = t > BURN0 && t < BURN1 + 0.1;
    const front = burning ? edge(f, t) : null;

    // --- Wall of fire, then burned away along a ragged edge ----------
    const washIn = smooth(0.75, 1.12, t);
    if (washIn > 0 && t < BURN1 + 0.1) {
      const g = wash.ctx;
      g.globalCompositeOperation = "source-over";
      g.clearRect(0, 0, w, h);
      const gr = g.createRadialGradient(w * 0.45, h * 0.5, 0, w * 0.5, h * 0.5, diag * 0.7);
      gr.addColorStop(0, "rgba(255,160,60,1)");
      gr.addColorStop(0.35, "rgba(205,64,16,1)");
      gr.addColorStop(0.75, "rgba(88,15,6,1)");
      gr.addColorStop(1, "rgba(26,5,3,1)");
      g.globalAlpha = washIn;
      g.fillStyle = gr;
      g.fillRect(0, 0, w, h);
      g.globalAlpha = 1;

      if (front) {
        // Cut away everything the fire has already passed, with a soft edge.
        g.globalCompositeOperation = "destination-out";
        g.shadowColor = "black";
        g.shadowBlur = 24;
        g.beginPath();
        front.forEach((p, i) => (i ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y)));
        const far = -R - 600;
        g.lineTo(C.x + Pp.x * (R + 60) + D.x * far, C.y + Pp.y * (R + 60) + D.y * far);
        g.lineTo(C.x - Pp.x * (R + 60) + D.x * far, C.y - Pp.y * (R + 60) + D.y * far);
        g.closePath();
        g.fill();
        g.shadowBlur = 0;
        g.globalCompositeOperation = "source-over";

        // Charred band just ahead of the flame line, like burning parchment.
        strokeLine(g, front, 34);
        g.strokeStyle = "rgba(30,8,4,0.75)";
        g.lineWidth = 60;
        g.lineJoin = "round";
        g.stroke();
      }
      ctx.drawImage(wash.c, 0, 0, w, h);
    }

    if (front) {
      // The glowing line of the burn.
      ctx.globalCompositeOperation = "lighter";
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      for (const [lw, col] of [
        [46, "rgba(255,90,20,0.22)"],
        [18, "rgba(255,140,40,0.55)"],
        [5, "rgba(255,230,150,0.95)"],
      ] as const) {
        strokeLine(ctx, front, 6);
        ctx.strokeStyle = col;
        ctx.lineWidth = lw;
        ctx.stroke();
      }
      ctx.globalCompositeOperation = "source-over";

      sparkCarry += dt * 420;
      while (sparkCarry >= 1) {
        sparkCarry -= 1;
        const p = front[Math.floor(Math.random() * front.length)];
        const a = Math.atan2(-D.y, -D.x) + (Math.random() - 0.5) * 1.6;
        const sp = 60 + Math.random() * 260;
        flames.push({ x: p.x, y: p.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 80, age: 0, life: 0.4 + Math.random() * 0.6, s0: 10, s1: 3, kind: 2 });
      }
    }

    if (!swapped && t >= 1.2) {
      swapped = true;
      swap();
    }

    // --- The dragon's path ----------------------------------------------
    const u = clamp01(t / FLIGHT);
    const pos = bez(u);
    const ahead = bez(Math.min(1, u + 0.01));
    const heading = Math.atan2(ahead.y - pos.y, ahead.x - pos.x);
    const scale = 0.82 + 0.38 * Math.sin(Math.PI * u);
    const mouth = { x: pos.x + Math.cos(heading) * 0.6 * U * scale, y: pos.y + Math.sin(heading) * 0.6 * U * scale };

    // --- Dragonfire and the wall of flame --------------------------------
    if (t > 0.3 && t < 1.3) {
      const toCenter = Math.atan2(h * 0.55 - mouth.y, w * 0.5 - mouth.x);
      let diff = toCenter - heading;
      diff = Math.atan2(Math.sin(diff), Math.cos(diff));
      const aim = heading + Math.max(-0.9, Math.min(0.9, diff)) * 0.75;
      emitCarry += dt * 950;
      while (emitCarry >= 1) {
        emitCarry -= 1;
        const a = aim + (Math.random() - 0.5) * 0.45;
        const sp = U * (1.9 + Math.random() * 1.1);
        flames.push({
          x: mouth.x,
          y: mouth.y,
          vx: Math.cos(a) * sp,
          vy: Math.sin(a) * sp,
          age: 0,
          life: 0.7 + Math.random() * 0.55,
          s0: U * 0.05,
          s1: U * (0.35 + Math.random() * 0.35),
          kind: 0,
        });
      }
    }
    if (t > 0.8 && t < 1.45) {
      wallCarry += dt * 420;
      while (wallCarry >= 1) {
        wallCarry -= 1;
        flames.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: D.x * U * 0.35 + (Math.random() - 0.5) * U * 0.2,
          vy: D.y * U * 0.35 - U * 0.25,
          age: 0,
          life: 0.5 + Math.random() * 0.4,
          s0: U * 0.2,
          s1: U * (0.45 + Math.random() * 0.3),
          kind: 1,
        });
      }
    }

    ctx.globalCompositeOperation = "lighter";
    const drag = Math.pow(0.955, dt * 60);
    for (let i = flames.length - 1; i >= 0; i--) {
      const fl = flames[i];
      fl.age += dt;
      const a = fl.age / fl.life;
      if (a >= 1) {
        flames.splice(i, 1);
        continue;
      }
      if (fl.kind === 0) {
        fl.vx = fl.vx * drag + (Math.random() - 0.5) * U * 0.08;
        fl.vy = fl.vy * drag + (Math.random() - 0.5) * U * 0.08;
      } else {
        fl.vy -= dt * 120;
      }
      fl.x += fl.vx * dt;
      fl.y += fl.vy * dt;
      const size = fl.s0 + (fl.s1 - fl.s0) * Math.pow(a, 0.6);
      if (fl.kind === 2) {
        ctx.globalAlpha = 1 - a;
        ctx.drawImage(spark, fl.x - size / 2, fl.y - size / 2, size, size);
      } else if (fl.kind === 1) {
        ctx.globalAlpha = Math.sin(Math.PI * a) * 0.5;
        const fw = size * 0.55;
        const fh = size * 1.6;
        ctx.drawImage(a < 0.35 ? mid : cool, fl.x - fw / 2, fl.y - fh * 0.7, fw, fh);
      } else {
        ctx.globalAlpha = Math.pow(1 - a, 1.3) * 0.62;
        ctx.drawImage(SPR[a < 0.2 ? 0 : a < 0.55 ? 1 : 2], fl.x - size / 2, fl.y - size / 2, size, size);
      }
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";

    if (u < 1) {
      ctx.save();
      ctx.translate(pos.x, pos.y);
      ctx.rotate(heading);
      ctx.scale(scale, scale);
      drawDragon(ctx, U, t, 0.6 + 0.4 * washIn);
      ctx.restore();
    }
  }).then(() => ctx.clearRect(0, 0, w, h));
}

/* ================================================================== */
/*  Winter                                                             */
/* ================================================================== */

type Seg = { x1: number; y1: number; x2: number; y2: number; b0: number; b1: number; lvl: number };

/** Feathery, fern-like frost growing in from every screen edge. */
function growFrost(w: number, h: number) {
  const segs: Seg[] = [];
  const sc = Math.max(Math.min(w, h) / 900, 0.55);
  const reach = 190 * sc;
  const seeds: { x: number; y: number; a: number }[] = [];
  const perimeter = 2 * (w + h);
  const count = Math.round(perimeter / (30 * sc));
  for (let i = 0; i < count; i++) {
    const d = Math.random() * perimeter;
    if (d < w) seeds.push({ x: d, y: 0, a: Math.PI / 2 });
    else if (d < w + h) seeds.push({ x: w, y: d - w, a: Math.PI });
    else if (d < 2 * w + h) seeds.push({ x: d - w - h, y: h, a: -Math.PI / 2 });
    else seeds.push({ x: 0, y: d - 2 * w - h, a: 0 });
  }

  const push = (x: number, y: number, a: number, len: number, lvl: number, dist: number, delay: number) => {
    const x2 = x + Math.cos(a) * len;
    const y2 = y + Math.sin(a) * len;
    segs.push({ x1: x, y1: y, x2, y2, b0: delay + dist / reach, b1: delay + (dist + len) / reach, lvl });
    return { x: x2, y: y2 };
  };

  for (const s of seeds) {
    const delay = Math.random() * 0.25;
    let a = s.a + (Math.random() - 0.5) * 1.3;
    let p = { x: s.x, y: s.y };
    let dist = 0;
    const n = 4 + Math.floor(Math.random() * 6);
    const seg = (9 + Math.random() * 6) * sc;
    const spread = Math.PI / 3 + (Math.random() - 0.5) * 0.25;
    for (let i = 0; i < n; i++) {
      const q = push(p.x, p.y, a, seg, 0, dist, delay);
      // Each node sprouts a pair of fronds, longest near the root.
      const taper = 1 - i / (n + 1);
      for (const side of [-1, 1]) {
        const sa = a + side * spread;
        const sl = seg * (1.2 + Math.random() * 0.8) * taper;
        const r = push(q.x, q.y, sa, sl, 1, dist + seg, delay);
        for (const f of [0.35, 0.7]) {
          if (Math.random() < 0.3) continue;
          push(q.x + (r.x - q.x) * f, q.y + (r.y - q.y) * f, sa + side * spread, sl * 0.35 * (1.1 - f), 2, dist + seg + sl * f, delay);
        }
      }
      dist += seg;
      p = q;
      a += (Math.random() - 0.5) * 0.22;
    }
  }
  return segs;
}

type Shard = { pts: V[]; cx: number; cy: number; ring: number; delay: number; vx: number; vy: number; spin: number };

/** Splits the screen into jagged radial ice shards around the impact point. */
function buildShards(w: number, h: number, cx: number, cy: number) {
  const diag = Math.hypot(w, h);
  const radii = [0, 0.09, 0.22, 0.4, 0.75].map((r) => r * diag);
  const wedges = 14;
  const V: V[][] = radii.map((r, ri) =>
    Array.from({ length: wedges }, (_, k) => {
      const outer = ri === radii.length - 1;
      const a = ((k + (Math.random() - 0.5) * (outer ? 0.4 : 0.7)) / wedges) * Math.PI * 2;
      const rr = ri === 0 ? 0 : r * (1 + (Math.random() - 0.5) * (outer ? 0 : 0.45));
      return { x: cx + Math.cos(a) * rr, y: cy + Math.sin(a) * rr };
    }),
  );

  // Every crack is subdivided with a random kink; neighbours share the same kinks.
  const kinks = new Map<string, V[]>();
  const crack = (ka: string, a: V, kb: string, b: V): V[] => {
    const key = ka < kb ? `${ka}|${kb}` : `${kb}|${ka}`;
    let mids = kinks.get(key);
    if (!mids) {
      const [p0, p1] = ka < kb ? [a, b] : [b, a];
      const dx = p1.x - p0.x;
      const dy = p1.y - p0.y;
      const len = Math.hypot(dx, dy) || 1;
      const nx = -dy / len;
      const ny = dx / len;
      mids = [0.33, 0.66].map((f) => {
        const j = (Math.random() - 0.5) * len * 0.12;
        return { x: p0.x + dx * f + nx * j, y: p0.y + dy * f + ny * j };
      });
      kinks.set(key, mids);
    }
    return ka < kb ? mids : [...mids].reverse();
  };

  const shards: Shard[] = [];
  for (let ri = 0; ri < radii.length - 1; ri++) {
    for (let k = 0; k < wedges; k++) {
      const k2 = (k + 1) % wedges;
      const corners =
        ri === 0
          ? [
              { id: "c", p: V[0][0] },
              { id: `1:${k}`, p: V[1][k] },
              { id: `1:${k2}`, p: V[1][k2] },
            ]
          : [
              { id: `${ri}:${k}`, p: V[ri][k] },
              { id: `${ri + 1}:${k}`, p: V[ri + 1][k] },
              { id: `${ri + 1}:${k2}`, p: V[ri + 1][k2] },
              { id: `${ri}:${k2}`, p: V[ri][k2] },
            ];
      const pts: V[] = [];
      corners.forEach((c, i) => {
        const n = corners[(i + 1) % corners.length];
        pts.push(c.p, ...crack(c.id, c.p, n.id, n.p));
      });
      const mx = pts.reduce((s, p) => s + p.x, 0) / pts.length;
      const my = pts.reduce((s, p) => s + p.y, 0) / pts.length;
      const out = Math.atan2(my - cy, mx - cx);
      const sp = 140 + Math.random() * 240;
      shards.push({
        pts: pts.map((p) => ({ x: p.x - mx, y: p.y - my })),
        cx: mx,
        cy: my,
        ring: ri,
        delay: ri * 0.06 + Math.random() * 0.1,
        vx: Math.cos(out) * sp,
        vy: Math.sin(out) * sp - 60,
        spin: (Math.random() - 0.5) * 2.4,
      });
    }
  }
  return shards;
}

export function winterStorm(canvas: HTMLCanvasElement, swap: () => void) {
  const { ctx, w, h } = setup(canvas);
  const diag = Math.hypot(w, h);
  const cx = w / 2;
  const cy = h * 0.46;
  const frost = growFrost(w, h);
  const shards = buildShards(w, h, cx, cy);

  // Snow in three depths: fine distant flakes, mid flakes, and near motion-blurred streaks.
  const windA = 0.32;
  const wx = Math.cos(windA);
  const wy = Math.sin(windA);
  const sc = Math.max(Math.max(w, h) / 1440, 0.6);
  const flakes = Array.from({ length: w < 700 ? 240 : 460 }, () => {
    const z = Math.random();
    return {
      x: Math.random() * w,
      y: Math.random() * h,
      z,
      sp: (260 + z * z * 900) * sc,
      r: 0.6 + z * 2.4,
      ph: Math.random() * Math.PI * 2,
    };
  });

  const iceFill = (g: CanvasRenderingContext2D) => {
    const gr = g.createRadialGradient(cx, cy, 0, cx, cy, diag * 0.62);
    gr.addColorStop(0, "rgba(232,242,250,1)");
    gr.addColorStop(0.55, "rgba(198,220,238,1)");
    gr.addColorStop(1, "rgba(150,182,210,1)");
    return gr;
  };

  let swapped = false;
  const TOTAL = 2.9;
  const CRACK = 1.22;
  const SHATTER = 1.42;
  const widths = [0.9, 0.6, 0.4];

  return run(TOTAL, (t, dt) => {
    ctx.clearRect(0, 0, w, h);

    // --- Frosted glass creeping in from the edges -------------------
    const close = smooth(0.0, 1.1, t);
    const settle = 1 - smooth(1.6, 2.7, t);
    if (close > 0 && settle > 0) {
      const rIn = diag * 0.5 * (1 - 0.55 * close);
      const vg = ctx.createRadialGradient(cx, cy, rIn, cx, cy, diag * 0.6);
      vg.addColorStop(0, "rgba(200,225,245,0)");
      vg.addColorStop(1, `rgba(215,234,250,${0.6 * close * settle})`);
      ctx.fillStyle = vg;
      ctx.fillRect(0, 0, w, h);
    }

    // --- Whiteout, then the ice cracks and shatters ------------------
    const white = smooth(0.8, 1.15, t);
    if (white > 0 && t < SHATTER) {
      ctx.globalAlpha = white;
      ctx.fillStyle = iceFill(ctx);
      ctx.fillRect(0, 0, w, h);
      ctx.globalAlpha = 1;
    }
    if (!swapped && t >= 1.2) {
      swapped = true;
      swap();
    }
    if (t >= CRACK && t < SHATTER) {
      // Cracks race outward from the impact point.
      const g = smooth(CRACK, SHATTER, t);
      ctx.lineJoin = "round";
      for (const [lw, col] of [
        [5, "rgba(120,170,215,0.35)"],
        [1.2, "rgba(255,255,255,0.95)"],
      ] as const) {
        ctx.beginPath();
        for (const sh of shards) {
          const pts = sh.pts.map((p) => ({ x: sh.cx + p.x, y: sh.cy + p.y }));
          for (let i = 0; i < pts.length; i++) {
            const a = pts[i];
            const b = pts[(i + 1) % pts.length];
            const da = Math.hypot(a.x - cx, a.y - cy) / (diag * 0.6);
            const db = Math.hypot(b.x - cx, b.y - cy) / (diag * 0.6);
            if (Math.min(da, db) > g) continue;
            const f = clamp01((g - Math.min(da, db)) / Math.max(Math.abs(db - da), 0.02));
            const [p0, p1] = da <= db ? [a, b] : [b, a];
            ctx.moveTo(p0.x, p0.y);
            ctx.lineTo(p0.x + (p1.x - p0.x) * f, p0.y + (p1.y - p0.y) * f);
          }
        }
        ctx.strokeStyle = col;
        ctx.lineWidth = lw;
        ctx.stroke();
      }
    }
    if (t >= SHATTER) {
      const fill = iceFill(ctx);
      for (const sh of shards) {
        const p = Math.max(0, t - SHATTER - sh.delay);
        const alpha = 1 - smooth(0.2, 0.72, p);
        if (alpha <= 0) continue;
        ctx.save();
        ctx.translate(sh.cx + sh.vx * p, sh.cy + sh.vy * p + 1300 * p * p);
        ctx.rotate(sh.spin * p);
        ctx.scale(1 - p * 0.25, 1 - p * 0.25);
        ctx.beginPath();
        sh.pts.forEach((q, i) => (i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y)));
        ctx.closePath();
        ctx.globalAlpha = alpha;
        // Keep the gradient anchored to the screen so shards match the sheet they broke from.
        ctx.translate(-sh.cx, -sh.cy);
        ctx.fillStyle = fill;
        ctx.fill();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = "rgba(255,255,255,0.9)";
        ctx.stroke();
        ctx.restore();
      }
      ctx.globalAlpha = 1;
    }

    // --- Frost crystals ----------------------------------------------
    const grow = smooth(0.0, 1.05, t) * 1.25;
    const frostA = 1 - smooth(1.7, 2.8, t);
    if (frostA > 0) {
      ctx.lineCap = "round";
      for (const pass of [0, 1]) {
        for (let lvl = 0; lvl < 3; lvl++) {
          ctx.beginPath();
          for (const s of frost) {
            if (s.lvl !== lvl || grow <= s.b0) continue;
            const f = clamp01((grow - s.b0) / (s.b1 - s.b0));
            ctx.moveTo(s.x1, s.y1);
            ctx.lineTo(s.x1 + (s.x2 - s.x1) * f, s.y1 + (s.y2 - s.y1) * f);
          }
          if (pass === 0) {
            ctx.strokeStyle = `rgba(170,215,255,${0.1 * frostA})`;
            ctx.lineWidth = widths[lvl] * 6;
          } else {
            ctx.strokeStyle = `rgba(242,250,255,${0.72 * frostA})`;
            ctx.lineWidth = widths[lvl];
          }
          ctx.stroke();
        }
      }
    }

    // --- Blizzard ------------------------------------------------------
    const storm = smooth(0, 0.45, t) * (1 - smooth(1.9, 2.8, t));
    if (storm > 0) {
      ctx.lineCap = "round";
      for (const f of flakes) {
        const sway = Math.sin(t * 3 + f.ph) * 40 * f.z;
        f.x += (wx * f.sp + sway) * dt;
        f.y += wy * f.sp * dt;
        if (f.x > w + 40 || f.y > h + 40) {
          if (Math.random() < w / (w + h)) {
            f.x = Math.random() * w - w * 0.3;
            f.y = -30;
          } else {
            f.x = -30;
            f.y = Math.random() * h;
          }
        }
        const a = (0.3 + 0.6 * f.z) * storm;
        if (f.z > 0.86) {
          // Nearest flakes: short motion-blurred streaks.
          const len = f.sp * 0.011;
          ctx.strokeStyle = `rgba(245,250,255,${a * 0.8})`;
          ctx.lineWidth = f.r;
          ctx.beginPath();
          ctx.moveTo(f.x, f.y);
          ctx.lineTo(f.x - wx * len, f.y - wy * len);
          ctx.stroke();
        } else {
          ctx.fillStyle = `rgba(240,248,255,${a * 0.9})`;
          ctx.beginPath();
          ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  }).then(() => ctx.clearRect(0, 0, w, h));
}
