import { cn } from "@/lib/utils";

/** The mascot. Paper body, ink outline, orange inner ears. */
export function Bunny({
  className,
  wiggle = false,
  mood = "happy",
}: {
  className?: string | undefined;
  wiggle?: boolean;
  mood?: "happy" | "shock" | "wink";
}) {
  return (
    <svg
      viewBox="0 0 120 140"
      aria-hidden
      className={cn("block h-auto w-full overflow-visible", wiggle && "bunny-wiggle", className)}
    >
      <g className="bunny-ear bunny-ear-l">
        <path
          d="M40 66 C 24 34, 26 6, 39 5 C 53 4, 55 36, 52 66 Z"
          className="fill-paper stroke-ink"
          strokeWidth="4"
          strokeLinejoin="round"
        />
        <path d="M41 56 C 33 34, 34 16, 40 16 C 46 16, 47 36, 46 56 Z" className="fill-orange" />
      </g>
      <g className="bunny-ear bunny-ear-r">
        <path
          d="M68 66 C 66 34, 74 4, 87 7 C 100 10, 92 40, 80 68 Z"
          className="fill-paper stroke-ink"
          strokeWidth="4"
          strokeLinejoin="round"
        />
        <path d="M73 57 C 73 36, 78 17, 85 18 C 91 20, 86 40, 79 58 Z" className="fill-orange" />
      </g>
      <ellipse cx="60" cy="95" rx="42" ry="37" className="fill-paper stroke-ink" strokeWidth="4" />
      <ellipse cx="37" cy="106" rx="8" ry="5" className="fill-orange" opacity="0.55" />
      <ellipse cx="83" cy="106" rx="8" ry="5" className="fill-orange" opacity="0.55" />
      {mood === "shock" ? (
        <g className="stroke-ink" strokeWidth="4" strokeLinecap="round">
          <path d="M40 84 l10 10 M50 84 l-10 10" />
          <path d="M70 84 l10 10 M80 84 l-10 10" />
        </g>
      ) : (
        <g>
          <circle cx="45" cy="90" r="5.5" className="fill-ink" />
          {mood === "wink" ? (
            <path d="M69 90 q6 -6 12 0" className="fill-none stroke-ink" strokeWidth="4" strokeLinecap="round" />
          ) : (
            <circle cx="75" cy="90" r="5.5" className="fill-ink" />
          )}
          <circle cx="47" cy="88" r="1.8" className="fill-paper" />
          {mood !== "wink" && <circle cx="77" cy="88" r="1.8" className="fill-paper" />}
        </g>
      )}
      <path d="M55 99 h10 l-5 6 z" className="fill-ink stroke-ink" strokeWidth="2" strokeLinejoin="round" />
      <path
        d="M60 105 q-5 8 -11 3 M60 105 q5 8 11 3"
        className="fill-none stroke-ink"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <rect x="56" y="108" width="8" height="7" rx="1.5" className="fill-paper stroke-ink" strokeWidth="2.5" />
      <g className="stroke-ink" strokeWidth="2" strokeLinecap="round">
        <path d="M22 98 h-14 M23 104 l-13 4" />
        <path d="M98 98 h14 M97 104 l13 4" />
      </g>
    </svg>
  );
}

export function Arrow({ className, flip = false }: { className?: string; flip?: boolean }) {
  return (
    <svg
      viewBox="0 0 140 80"
      aria-hidden
      className={cn("block overflow-visible", className)}
      style={flip ? { transform: "scaleX(-1)" } : undefined}
    >
      <path
        d="M8 62 C 30 8, 78 2, 96 30 C 104 44, 92 56, 82 44 C 72 30, 100 18, 128 32"
        fill="none"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path d="M128 32 l-16 -3 M128 32 l-9 13" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

export function Squiggle({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 20" aria-hidden preserveAspectRatio="none" className={cn("block", className)}>
      <path
        d="M2 12 Q 12 2, 22 12 T 42 12 T 62 12 T 82 12 T 102 12 T 122 12 T 142 12 T 162 12 T 182 12 T 198 10"
        fill="none"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Scribble({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" aria-hidden className={cn("block", className)}>
      <path
        d="M20 60 C 20 20, 100 20, 100 60 C 100 100, 30 100, 30 62 C 30 34, 88 34, 88 62 C 88 86, 44 86, 44 62 C 44 48, 74 48, 72 64"
        fill="none"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Sparkle({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" aria-hidden className={cn("block", className)}>
      <path
        d="M20 2 C 22 14, 26 18, 38 20 C 26 22, 22 26, 20 38 C 18 26, 14 22, 2 20 C 14 18, 18 14, 20 2 Z"
        fill="currentColor"
      />
    </svg>
  );
}

function burstPoints(spikes: number, outer: number, inner: number) {
  const pts: string[] = [];
  for (let i = 0; i < spikes * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = (Math.PI / spikes) * i - Math.PI / 2;
    pts.push(`${(50 + Math.cos(a) * r).toFixed(2)},${(50 + Math.sin(a) * r).toFixed(2)}`);
  }
  return pts.join(" ");
}

const BURST = burstPoints(14, 48, 39);

export function BurstShape({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" aria-hidden className={cn("absolute inset-0 h-full w-full overflow-visible", className)}>
      <polygon points={BURST} strokeWidth="3" strokeLinejoin="round" className="stroke-ink" />
    </svg>
  );
}
