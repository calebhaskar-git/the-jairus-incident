/** Dependency-free confetti + sticker burst on a temporary canvas. */

export type ConfettiPattern = "burst" | "cannons" | "rain";

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  vr: number;
  size: number;
  color: string;
  shape: "rect" | "circle" | "star" | "word";
  word?: string;
  wobble: number;
};

const WORDS = ["HBD", "MENACE", "LOVED", "BUNNY", "LEGEND", "JAIRUS", "★"];

function starPath(c: CanvasRenderingContext2D, r: number) {
  c.beginPath();
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 === 0 ? r : r * 0.45;
    const a = (Math.PI / 5) * i - Math.PI / 2;
    c.lineTo(Math.cos(a) * rad, Math.sin(a) * rad);
  }
  c.closePath();
}

export function fireConfetti(pattern: ConfettiPattern = "burst", origin?: { x: number; y: number }) {
  if (typeof window === "undefined") return;
  const canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  Object.assign(canvas.style, {
    position: "fixed",
    inset: "0",
    width: "100vw",
    height: "100vh",
    pointerEvents: "none",
    zIndex: "70",
  });
  document.body.appendChild(canvas);

  const W = window.innerWidth;
  const H = window.innerHeight;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  const c = canvas.getContext("2d");
  if (!c) {
    canvas.remove();
    return;
  }
  c.scale(dpr, dpr);

  const css = getComputedStyle(document.documentElement);
  const read = (v: string, fb: string) => css.getPropertyValue(v).trim() || fb;
  const lime = read("--lime", "#d4ff3a");
  const orange = read("--orange", "#ff6a2a");
  const cobalt = read("--cobalt", "#2346ff");
  const paper = read("--paper", "#fbf7ec");
  const ink = read("--ink", "#16161d");
  const colors = [lime, orange, cobalt, paper, lime, orange];

  const mobile = W < 640;
  const count = pattern === "rain" ? (mobile ? 90 : 160) : mobile ? 110 : 190;
  const particles: Particle[] = [];

  const make = (x: number, y: number, angle: number, speed: number): Particle => {
    const r = Math.random();
    const shape: Particle["shape"] = r < 0.1 ? "word" : r < 0.35 ? "star" : r < 0.55 ? "circle" : "rect";
    return {
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      rot: Math.random() * Math.PI * 2,
      vr: (Math.random() - 0.5) * 0.3,
      size: shape === "word" ? 13 + Math.random() * 6 : 6 + Math.random() * 8,
      color: colors[Math.floor(Math.random() * colors.length)] ?? lime,
      shape,
      word: WORDS[Math.floor(Math.random() * WORDS.length)] ?? "HBD",
      wobble: Math.random() * 10,
    };
  };

  const ox = origin?.x ?? W / 2;
  const oy = origin?.y ?? H * 0.45;
  for (let i = 0; i < count; i++) {
    if (pattern === "burst") {
      particles.push(make(ox, oy, Math.random() * Math.PI * 2, 4 + Math.random() * 13));
    } else if (pattern === "cannons") {
      const left = i % 2 === 0;
      const angle = left ? -Math.PI / 3 - Math.random() * 0.5 : (-2 * Math.PI) / 3 + Math.random() * 0.5;
      particles.push(make(left ? 0 : W, H, angle, 13 + Math.random() * 11));
    } else {
      const p = make(Math.random() * W, -20 - Math.random() * H * 0.8, Math.PI / 2, 1 + Math.random() * 3);
      particles.push(p);
    }
  }

  const start = performance.now();
  let last = start;
  const DURATION = 4800;

  const frame = (now: number) => {
    const dt = Math.min(2.5, (now - last) / 16.67);
    last = now;
    const t = now - start;
    c.clearRect(0, 0, W, H);
    const fade = t > DURATION - 900 ? Math.max(0, (DURATION - t) / 900) : 1;
    c.globalAlpha = fade;

    for (const p of particles) {
      p.vy += 0.28 * dt;
      p.vx *= Math.pow(0.985, dt);
      p.vy *= Math.pow(0.985, dt);
      p.x += (p.vx + Math.sin((t / 300) + p.wobble) * 0.6) * dt;
      p.y += p.vy * dt;
      p.rot += p.vr * dt;

      c.save();
      c.translate(p.x, p.y);
      c.rotate(p.rot);
      c.fillStyle = p.color;
      c.strokeStyle = ink;
      c.lineWidth = 2;
      if (p.shape === "rect") {
        c.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      } else if (p.shape === "circle") {
        c.beginPath();
        c.arc(0, 0, p.size / 2, 0, Math.PI * 2);
        c.fill();
      } else if (p.shape === "star") {
        starPath(c, p.size * 0.8);
        c.fill();
        c.stroke();
      } else {
        c.font = `800 ${p.size}px "Bricolage Grotesque", sans-serif`;
        const w = c.measureText(p.word ?? "").width + 14;
        const h = p.size + 10;
        c.beginPath();
        if (typeof c.roundRect === "function") c.roundRect(-w / 2, -h / 2, w, h, h / 2);
        else c.rect(-w / 2, -h / 2, w, h);
        c.fill();
        c.stroke();
        c.fillStyle = p.color === cobalt ? paper : ink;
        c.textAlign = "center";
        c.textBaseline = "middle";
        c.fillText(p.word ?? "", 0, 1);
      }
      c.restore();
    }

    if (t < DURATION) requestAnimationFrame(frame);
    else canvas.remove();
  };
  requestAnimationFrame(frame);
}
