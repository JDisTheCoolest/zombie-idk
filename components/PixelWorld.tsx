"use client";
// The animated scene on the landing page: a blocky world scrolling by, with a day and night
// cycle, clouds, trees, torches and fireflies. Two players walk along, and every few seconds
// they stop, ask each other to team up, and celebrate. All drawn on a <canvas>, no images.
// People who ask their system for less motion get one still frame instead.
import { useEffect, useRef } from "react";

const H = 96; // the scene is 96 "pixels" tall, scaled up to fit
const B = 8; // one block is 8 x 8 pixels
const SPEED = 14; // pixels per second while walking
const DAY = 48; // seconds for a full day and night
const MEET_EVERY = 9; // seconds between team-ups
const MEET_FOR = 3.4; // how long a team-up lasts

// Repeatable "random" numbers, so the same column always looks the same.
function hash(n: number): number {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}
function noise(x: number): number {
  const i = Math.floor(x), f = x - i, t = f * f * (3 - 2 * f);
  return hash(i) * (1 - t) + hash(i + 1) * t;
}

// The world, one block column at a time.
const groundOf = (col: number) => 2 + Math.round(noise(col * 0.13) * 2 + noise(col * 0.045 + 90) * 1.4);
const hillOf = (col: number) => 4 + Math.round(noise(col * 0.09 + 40) * 4);
const treeAt = (col: number) => hash(col * 7.31) > 0.84 && hash((col - 1) * 7.31) <= 0.84;
const torchAt = (col: number) => !treeAt(col) && hash(col * 3.17 + 5) > 0.93;

type RGB = [number, number, number];
const hex = (h: string): RGB => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)) as RGB;
const mix = (a: RGB, b: RGB, t: number): RGB => a.map((v, i) => Math.round(v + (b[i] - v) * t)) as RGB;
const css = ([r, g, b]: RGB, a = 1) => `rgba(${r},${g},${b},${a})`;

// Sky colors through the day: [time 0-1, top, bottom]
const SKY: [number, string, string][] = [
  [0.0, "#6fbff0", "#c4e8ff"],
  [0.42, "#6fbff0", "#c4e8ff"],
  [0.5, "#e6875a", "#ffd39b"], // sunset
  [0.58, "#0b1030", "#1f2a5c"], // night
  [0.9, "#0b1030", "#1f2a5c"],
  [0.96, "#e69a6b", "#ffd9a8"], // sunrise
  [1.0, "#6fbff0", "#c4e8ff"],
];
function skyAt(t: number): { top: RGB; bottom: RGB; dark: number } {
  let i = 0;
  while (SKY[i + 1][0] < t) i++;
  const [t0, a0, b0] = SKY[i], [t1, a1, b1] = SKY[i + 1];
  const k = (t - t0) / (t1 - t0 || 1);
  // How dark it is: 0 in the day, 1 in the middle of the night.
  const dark = t < 0.46 ? 0 : t < 0.58 ? (t - 0.46) / 0.12 : t < 0.9 ? 1 : t < 0.98 ? 1 - (t - 0.9) / 0.08 : 0;
  return { top: mix(hex(a0), hex(a1), k), bottom: mix(hex(b0), hex(b1), k), dark };
}

type Player = { shirt: string; hair: string; pants: string; y: number };
type Spark = { x: number; y: number; vx: number; vy: number; life: number; color: string };

export default function PixelWorld() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let W = 200, scale = 4;
    function resize() {
      const rect = canvas.getBoundingClientRect();
      scale = Math.max(2, Math.round(rect.height / H));
      W = Math.ceil(rect.width / scale);
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      ctx.setTransform(scale * dpr, 0, 0, (rect.height / H) * dpr, 0, 0);
      ctx.imageSmoothingEnabled = false;
      if (still) draw(0);
    }

    const players: Player[] = [
      { shirt: "#4f8a2b", hair: "#4a2e1a", pants: "#2b3a67", y: 0 },
      { shirt: "#2fb8c7", hair: "#c9a14a", pants: "#3d2b57", y: 0 },
    ];
    let sparks: Spark[] = [];
    let walked = 0; // how far the world has scrolled
    let clock = 0; // seconds since start, only counts while the tab is visible
    let lastMeet = -1;

    function block(x: number, row: number, top: string, body: string, seed: number) {
      const y = H - (row + 1) * B;
      ctx.fillStyle = body;
      ctx.fillRect(x, y, B, B);
      if (top !== body) { ctx.fillStyle = top; ctx.fillRect(x, y, B, 2); }
      // A few darker and lighter specks so blocks look textured.
      for (let i = 0; i < 4; i++) {
        const h = hash(seed * 31 + i * 17);
        ctx.fillStyle = i % 2 ? "rgba(0,0,0,.14)" : "rgba(255,255,255,.12)";
        ctx.fillRect(x + Math.floor(h * 7), y + 2 + Math.floor(hash(seed + i * 5) * 5), 1, 1);
      }
    }

    function column(col: number, x: number) {
      const g = groundOf(col);
      for (let row = 0; row < g; row++) {
        const seed = col * 13 + row * 7;
        if (row === g - 1) block(x, row, "#5fa83a", "#8b5a2b", seed); // grass
        else if (row >= g - 3) block(x, row, "#8b5a2b", "#8b5a2b", seed); // dirt
        else {
          const ore = hash(seed + 0.5);
          const body = ore > 0.93 ? "#2fd6e0" : ore > 0.85 ? "#2b2b2b" : "#7d7d7d"; // diamond, coal, stone
          block(x, row, "#7d7d7d", "#7d7d7d", seed);
          if (body !== "#7d7d7d") {
            ctx.fillStyle = body;
            const y = H - (row + 1) * B;
            ctx.fillRect(x + 2, y + 2, 2, 2); ctx.fillRect(x + 5, y + 4, 2, 2); ctx.fillRect(x + 2, y + 5, 1, 1);
          }
        }
      }
      const groundY = H - g * B;
      if (treeAt(col)) {
        ctx.fillStyle = "#6b4423"; ctx.fillRect(x + 3, groundY - 3 * B, 2, 3 * B); // trunk
        ctx.fillStyle = "#3f7d22"; ctx.fillRect(x - B, groundY - 5 * B, 3 * B, 2 * B); // leaves
        ctx.fillRect(x - 3, groundY - 6 * B + 2, B + 6, B);
        ctx.fillStyle = "rgba(0,0,0,.12)";
        for (let i = 0; i < 6; i++) ctx.fillRect(x - B + Math.floor(hash(col + i) * 22), groundY - 5 * B + Math.floor(hash(col * 2 + i) * 14), 2, 2);
      }
      if (torchAt(col)) {
        ctx.fillStyle = "#6b4423"; ctx.fillRect(x + 3, groundY - 6, 2, 6);
      }
    }

    function drawPlayer(p: Player, x: number, step: number, wave: boolean) {
      const y = Math.round(p.y) - 18;
      const swing = Math.round(Math.sin(step) * 1.5);
      ctx.fillStyle = p.pants; // legs
      ctx.fillRect(x + 1, y + 12, 2, 6 - Math.max(swing, 0)); ctx.fillRect(x + 3, y + 12, 2, 6 + Math.min(swing, 0));
      ctx.fillStyle = p.shirt; ctx.fillRect(x, y + 6, 6, 6); // body
      ctx.fillStyle = "#c8946e"; // arms and head
      ctx.fillRect(x - 1, y + 6 + (wave ? -4 : swing), 1, 5); ctx.fillRect(x + 6, y + 6 - swing, 1, 5);
      ctx.fillRect(x, y, 6, 6);
      ctx.fillStyle = p.hair; ctx.fillRect(x, y, 6, 2); ctx.fillRect(x, y + 2, 1, 1);
      ctx.fillStyle = "#1d2416"; ctx.fillRect(x + 4, y + 3, 1, 1); ctx.fillRect(x + 2, y + 3, 1, 1);
    }

    function bubble(x: number, y: number, text: string) {
      ctx.font = "6px 'Pixelify Sans', monospace";
      const w = Math.ceil(ctx.measureText(text).width) + 6;
      ctx.fillStyle = "#fff"; ctx.fillRect(x - w / 2, y - 9, w, 9);
      ctx.fillStyle = "#1d2416";
      ctx.fillRect(x - w / 2, y - 10, w, 1); ctx.fillRect(x - w / 2, y, w, 1);
      ctx.fillRect(x - w / 2 - 1, y - 9, 1, 9); ctx.fillRect(x + w / 2, y - 9, 1, 9);
      ctx.fillStyle = "#fff"; ctx.fillRect(x - 1, y, 3, 2);
      ctx.fillStyle = "#1d2416"; ctx.fillText(text, x - w / 2 + 3, y - 2);
    }

    function diamond(x: number, y: number) {
      ctx.fillStyle = "#1d2416"; ctx.fillRect(x - 4, y - 2, 9, 5); ctx.fillRect(x - 2, y - 4, 5, 9);
      ctx.fillStyle = "#2fd6e0"; ctx.fillRect(x - 3, y - 1, 7, 3); ctx.fillRect(x - 1, y - 3, 3, 7);
      ctx.fillStyle = "#c9fbff"; ctx.fillRect(x - 1, y - 2, 2, 2);
    }

    function draw(dt: number) {
      const t = ((clock / DAY) + 0.15) % 1;
      const sky = skyAt(t);

      // When do the players stop to team up?
      const sinceMeet = clock % MEET_EVERY;
      const meeting = !still && clock > 2 && sinceMeet > MEET_EVERY - MEET_FOR;
      const meetT = meeting ? sinceMeet - (MEET_EVERY - MEET_FOR) : 0;
      if (!meeting) walked += SPEED * dt;

      // Sky
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, css(sky.top)); grad.addColorStop(1, css(sky.bottom));
      ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);

      // Stars
      if (sky.dark > 0) {
        for (let i = 0; i < W / 4; i++) {
          const twinkle = 0.6 + 0.4 * Math.sin(clock * 2 + i);
          ctx.fillStyle = `rgba(255,255,255,${sky.dark * twinkle * 0.9})`;
          ctx.fillRect(Math.floor(hash(i) * W), Math.floor(hash(i + 99) * 50), 1, 1);
        }
      }

      // Sun and moon go over in an arc.
      const arc = (phase: number) => ({ x: phase * (W + 20) - 10, y: 46 - Math.sin(phase * Math.PI) * 38 });
      const sunPhase = t / 0.52;
      if (sunPhase <= 1) { const s = arc(sunPhase); ctx.fillStyle = "#ffe066"; ctx.fillRect(s.x - 5, s.y - 5, 10, 10); ctx.fillStyle = "#fff3b0"; ctx.fillRect(s.x - 3, s.y - 3, 6, 6); }
      const moonPhase = (t - 0.5) / 0.48;
      if (moonPhase >= 0 && moonPhase <= 1) { const m = arc(moonPhase); ctx.fillStyle = "#e8ecf5"; ctx.fillRect(m.x - 4, m.y - 4, 8, 8); ctx.fillStyle = "#b9c0d4"; ctx.fillRect(m.x - 2, m.y - 1, 2, 2); ctx.fillRect(m.x + 1, m.y + 1, 1, 1); }

      // Clouds drift slower than the ground.
      const cloudShift = walked * 0.25 + clock * 2;
      for (let k = Math.floor(cloudShift / 70) - 1; k < (cloudShift + W) / 70 + 1; k++) {
        if (hash(k * 4.7) < 0.35) continue;
        const cx = Math.round(k * 70 + hash(k) * 30 - cloudShift);
        const cy = 8 + Math.floor(hash(k * 9.1) * 22);
        const cw = 18 + Math.floor(hash(k * 2.3) * 22);
        ctx.fillStyle = `rgba(255,255,255,${0.85 - sky.dark * 0.6})`;
        ctx.fillRect(cx, cy, cw, 4); ctx.fillRect(cx + 4, cy - 3, cw - 10, 3);
      }

      // Far hills
      const hillShift = Math.floor(walked * 0.45);
      ctx.fillStyle = css(mix(hex("#7fb37a"), hex("#1c2a3a"), sky.dark * 0.8));
      for (let c = Math.floor(hillShift / B); c * B - hillShift < W; c++) {
        const h = hillOf(c);
        ctx.fillRect(c * B - hillShift, H - h * B, B, h * B);
      }

      // Ground
      const shift = Math.floor(walked);
      for (let c = Math.floor(shift / B) - 2; c * B - shift < W + 2 * B; c++) column(c, c * B - shift);

      // Players stand on whatever block is under them, and hop up steps.
      const baseX = Math.round(W * 0.42);
      players.forEach((p, i) => {
        const px = baseX + i * 12 + (meeting ? Math.min(meetT * 6, 2) * (i === 0 ? 1 : -1) : 0);
        const col = Math.floor((px + 3 + shift) / B);
        const target = H - groundOf(col) * B;
        p.y = p.y === 0 || still ? target : p.y + (target - p.y) * Math.min(1, dt * 14);
        drawPlayer(p, Math.round(px), meeting ? 0 : walked * 0.6 + i * 1.7, meeting && meetT > 1.4 && meetT < 2.6);
      });

      // The team-up moment: a question, an answer, then a diamond and a burst of sparks.
      if (meeting) {
        const [a, b] = players;
        const ax = baseX + 3, bx = baseX + 15;
        if (meetT < 1.4) bubble(ax, a.y - 21, "Team up?");
        else if (meetT < 2.4) bubble(bx, b.y - 21, "Yes! GG");
        if (meetT >= 1.4 && lastMeet !== Math.floor(clock / MEET_EVERY)) {
          lastMeet = Math.floor(clock / MEET_EVERY);
          for (let i = 0; i < 26; i++) {
            const ang = Math.random() * Math.PI * 2, sp = 18 + Math.random() * 30;
            sparks.push({ x: baseX + 9, y: Math.min(a.y, b.y) - 24, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp - 20, life: 1,
              color: ["#2fd6e0", "#7cf05a", "#ffe066", "#ffffff"][i % 4] });
          }
        }
        if (meetT > 1.4) diamond(baseX + 9, Math.min(a.y, b.y) - 26 - Math.min((meetT - 1.4) * 10, 8));
      }

      // Night falls over the world (the glow below is drawn on top so it shines).
      if (sky.dark > 0) { ctx.fillStyle = `rgba(8,12,36,${sky.dark * 0.45})`; ctx.fillRect(0, 0, W, H); }

      // Torch flames, brighter at night.
      for (let c = Math.floor(shift / B) - 1; c * B - shift < W + B; c++) {
        if (!torchAt(c)) continue;
        const x = c * B - shift + 4, y = H - groundOf(c) * B - 7;
        const flick = 0.75 + 0.25 * Math.sin(clock * 11 + c);
        if (sky.dark > 0.1) {
          const glow = ctx.createRadialGradient(x, y, 0, x, y, 14);
          glow.addColorStop(0, `rgba(255,190,80,${0.45 * sky.dark * flick})`); glow.addColorStop(1, "rgba(255,190,80,0)");
          ctx.fillStyle = glow; ctx.fillRect(x - 14, y - 14, 28, 28);
        }
        ctx.fillStyle = `rgba(255,${Math.round(170 + 60 * flick)},60,1)`; ctx.fillRect(x - 1, y - 1, 2, 2);
      }

      // Fireflies at night
      if (sky.dark > 0.3) {
        for (let i = 0; i < 9; i++) {
          const fx = (hash(i * 3.3) * W + Math.sin(clock * 0.7 + i) * 10 - walked * 0.3) % W;
          const fy = 40 + hash(i * 5.1) * 30 + Math.sin(clock * 1.3 + i * 2) * 5;
          ctx.fillStyle = `rgba(230,255,120,${(sky.dark - 0.3) * (0.5 + 0.5 * Math.sin(clock * 3 + i))})`;
          ctx.fillRect(Math.floor((fx + W) % W), Math.floor(fy), 1, 1);
        }
      }

      // Sparks fly out and fall.
      sparks = sparks.filter((s) => (s.life -= dt * 0.9) > 0);
      for (const s of sparks) {
        s.vy += 60 * dt; s.x += s.vx * dt; s.y += s.vy * dt;
        ctx.fillStyle = s.color; ctx.globalAlpha = Math.min(1, s.life * 1.5);
        ctx.fillRect(Math.round(s.x), Math.round(s.y), 2, 2);
      }
      ctx.globalAlpha = 1;
    }

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    if (still) return () => ro.disconnect();

    let frame = 0, last = performance.now();
    function loop(now: number) {
      const dt = Math.min((now - last) / 1000, 0.05); // don't jump after the tab was hidden
      last = now;
      clock += dt;
      draw(dt);
      frame = requestAnimationFrame(loop);
    }
    frame = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(frame); ro.disconnect(); };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pixel-world"
      role="img"
      aria-label="An animated blocky world. Two players walk along, stop, ask each other to team up, and celebrate with a diamond."
    />
  );
}
