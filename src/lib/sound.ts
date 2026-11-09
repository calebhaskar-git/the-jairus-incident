/** Tiny synthesized sound effects. Audio only starts after a user click (unlockAudio). */

export type SoundName = "blip" | "boing" | "error" | "pop" | "fanfare" | "whoosh";

let ctx: AudioContext | null = null;

export function unlockAudio(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const AC =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return false;
    ctx ??= new AC();
    if (ctx.state === "suspended") void ctx.resume();
    return true;
  } catch {
    return false;
  }
}

function tone(
  freq: number,
  start: number,
  dur: number,
  type: OscillatorType = "square",
  gain = 0.06,
  endFreq?: number,
) {
  if (!ctx) return;
  const t0 = ctx.currentTime + start;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (endFreq) osc.frequency.exponentialRampToValueAtTime(endFreq, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g).connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.03);
}

function noise(dur: number, from: number, to: number) {
  if (!ctx) return;
  const t0 = ctx.currentTime;
  const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.setValueAtTime(from, t0);
  filter.frequency.exponentialRampToValueAtTime(to, t0 + dur);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(0.12, t0 + dur * 0.3);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(filter).connect(g).connect(ctx.destination);
  src.start(t0);
}

export function playSound(name: SoundName) {
  if (!ctx || ctx.state !== "running") return;
  switch (name) {
    case "blip":
      tone(880, 0, 0.07, "square", 0.04);
      break;
    case "pop":
      tone(420, 0, 0.12, "sine", 0.12, 980);
      break;
    case "boing":
      tone(180, 0, 0.35, "sine", 0.12, 720);
      tone(720, 0.12, 0.25, "triangle", 0.05, 260);
      break;
    case "error":
      tone(330, 0, 0.16, "square", 0.05);
      tone(220, 0.17, 0.26, "square", 0.05);
      break;
    case "whoosh":
      noise(0.5, 300, 3200);
      break;
    case "fanfare":
      [523, 659, 784, 1046].forEach((f, i) => tone(f, i * 0.11, 0.22, "square", 0.05));
      tone(1046, 0.48, 0.6, "triangle", 0.06);
      tone(1318, 0.48, 0.6, "triangle", 0.04);
      break;
  }
}
