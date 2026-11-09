import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from "react";

import { INTRO_LABELS, LOADING_ERRORS, LOADING_LINES } from "@/content/jairus";
import { loadingSchedule, pick, pickOtherIndex, randBetween, randInt } from "@/lib/chaos";
import { cn } from "@/lib/utils";
import { useChaos } from "./chaos-context";
import { Bunny, Sparkle, Squiggle } from "./doodles";
import { Btn, Kicker, Sticker } from "./primitives";

type Phase = "intro" | "loading" | "error" | "leaving";

const DODGE_LABELS = ["ha. missed.", "too slow 🐇", "nope", "almost!"];
const CONFIRM_LABELS = ["are you sure? (press again)", "last chance. press again", "ok but… press again"];

export function Opening({ onDone }: { onDone: () => void }) {
  const { play, reduced } = useChaos();
  const [phase, setPhase] = useState<Phase>("intro");
  const [nick, setNick] = useState(0);
  const [nickTilt, setNickTilt] = useState(-4);
  const [stage, setStage] = useState(0);
  const [label, setLabel] = useState("Enter at your own risk");
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [pct, setPct] = useState(0);
  const [line, setLine] = useState(LOADING_LINES[0] ?? "");
  const [errorCopy, setErrorCopy] = useState(LOADING_ERRORS[0] ?? "");
  const timers = useRef<number[]>([]);
  const proceedRef = useRef<HTMLButtonElement | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);

  // lock page scroll while the intro is up
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.scrollTo(0, 0);
    dialogRef.current?.focus();
    return () => {
      document.body.style.overflow = prev;
      timers.current.forEach((t) => window.clearTimeout(t));
    };
  }, []);

  // rotate nickname labels on an irregular beat
  useEffect(() => {
    let t: number;
    const tick = () => {
      t = window.setTimeout(() => {
        setNick((n) => pickOtherIndex(INTRO_LABELS.length, n));
        setNickTilt(randBetween(-9, 9));
        tick();
      }, randInt(1200, 2300));
    };
    tick();
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    if (phase === "error") proceedRef.current?.focus();
  }, [phase]);

  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  };

  const dodge = (e: PointerEvent<HTMLButtonElement>) => {
    if (stage !== 0 || e.pointerType !== "mouse") return;
    setStage(1);
    play("boing");
    setLabel(pick(DODGE_LABELS));
    if (!reduced) {
      const maxX = Math.max(60, Math.min(190, window.innerWidth / 2 - 160));
      const dir = Math.random() < 0.5 ? -1 : 1;
      setOffset({ x: dir * randBetween(maxX * 0.6, maxX), y: -randBetween(30, 80) });
    }
    later(() => setLabel("ok fine, click me"), 950);
  };

  const startLoading = () => {
    setPhase("loading");
    play("blip");
    const steps = loadingSchedule(Math.random, reduced ? 0.2 : 1);
    let acc = 0;
    steps.forEach((s) => {
      acc += s.delay;
      later(() => {
        setPct(s.value);
        setLine(s.value === 99 ? "finalising… finalising… finalising…" : pick(LOADING_LINES));
        if (Math.random() < 0.3) play("blip");
      }, acc);
    });
    later(() => {
      setErrorCopy(pick(LOADING_ERRORS));
      setPhase("error");
      play("error");
    }, acc + (reduced ? 300 : randInt(1100, 1700)));
  };

  const onEnter = () => {
    if (stage === 0) {
      setStage(1);
      play("boing");
      setLabel(pick(CONFIRM_LABELS));
      return;
    }
    startLoading();
  };

  const leave = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    play("whoosh");
    setPhase("leaving");
    window.setTimeout(onDone, reduced ? 0 : 720);
  };

  const current = INTRO_LABELS[nick] ?? "Jairus";

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="intro-title"
      tabIndex={-1}
      className={cn(
        "fixed inset-0 z-50 overflow-y-auto overflow-x-hidden bg-cobalt text-paper outline-none",
        phase === "leaving" && "animate-iris-out",
      )}
    >
      {/* background chaos */}
      <div aria-hidden className="bg-dots-light pointer-events-none absolute inset-0" />
      <div
        aria-hidden
        className="loop text-outline-paper pointer-events-none absolute -right-16 -top-10 animate-spin-slow select-none font-display text-[16rem] font-extrabold leading-none opacity-30 md:text-[26rem]"
      >
        ?
      </div>
      <Sparkle className="loop pointer-events-none absolute left-[8%] top-[18%] w-8 animate-float text-lime md:w-12" />
      <Sparkle className="loop pointer-events-none absolute bottom-[22%] right-[10%] w-6 animate-float text-orange [animation-delay:1.2s] md:w-10" />

      <div className="relative mx-auto flex min-h-full max-w-6xl flex-col justify-between gap-8 px-5 py-6 md:px-10 md:py-8">
        <div className="flex items-center justify-between gap-4">
          <Kicker className="text-paper">bunny.exe · v.birthday</Kicker>
          <Kicker className="flex items-center gap-2 text-lime">
            <span className="loop inline-block size-2.5 animate-blink rounded-full bg-orange" aria-hidden />
            status: suspicious
          </Kicker>
        </div>

        <div className="flex flex-col items-center text-center">
          <div className="loop w-24 animate-float md:w-36">
            <Bunny wiggle mood={phase === "error" ? "shock" : "happy"} />
          </div>

          <h2
            id="intro-title"
            className="mt-4 font-display font-extrabold uppercase leading-[0.82] tracking-[-0.045em]"
          >
            <span className="block text-[clamp(2.2rem,8vw,5.5rem)]">Happy birthday,</span>
            <span className="relative inline-block">
              <span className="font-squish text-[clamp(4.6rem,19vw,13.5rem)] text-lime">Jairus</span>
              <span className="loop absolute -right-[0.55em] top-[0.05em] inline-block animate-wobble text-[clamp(3.2rem,12vw,8.5rem)] text-orange">
                ???
              </span>
            </span>
          </h2>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-3" aria-live="polite">
            <span className="font-marker text-lg md:text-2xl">a.k.a.</span>
            <Sticker
              key={nick}
              tone={nick % 2 ? "orange" : "lime"}
              className="animate-pop text-lg md:text-2xl"
              style={{ rotate: `${nickTilt}deg`, "--pr": `${nickTilt * 2}deg` } as CSSProperties}
            >
              {current}
            </Sticker>
          </div>
          <Squiggle className="mt-4 h-4 w-40 text-lime" />
        </div>

        <div className="flex min-h-[11rem] flex-col items-center justify-end gap-4 pb-2">
          {phase === "intro" && (
            <>
              <Btn
                tone="lime"
                size="xl"
                onPointerEnter={dodge}
                onClick={onEnter}
                style={{
                  transform: `translate(${offset.x}px, ${offset.y}px)`,
                  transition: "transform .35s cubic-bezier(.2,1.7,.4,1)",
                }}
              >
                {label}
              </Btn>
              <p className="font-mono text-xs text-paper/80">⚠ side effects may include: feelings</p>
            </>
          )}

          {phase === "loading" && (
            <div className="w-full max-w-xl" role="status" aria-live="polite">
              <div className="mb-2 flex items-end justify-between font-mono text-xs uppercase md:text-sm">
                <span>installing birthday.exe</span>
                <span className="font-display text-3xl font-extrabold text-lime md:text-4xl">{pct}%</span>
              </div>
              <div
                className="h-8 overflow-hidden rounded-full border-[3px] border-ink bg-paper shadow-hard"
                role="progressbar"
                aria-valuenow={pct}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Fake loading progress"
              >
                <div
                  className="h-full border-r-[3px] border-ink bg-lime transition-[width] duration-300 ease-out"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="mt-3 font-mono text-sm text-paper/90">&gt; {line}</p>
            </div>
          )}

          {phase === "error" && (
            <div className="w-full max-w-xl animate-pop overflow-hidden rounded-xl border-[3px] border-ink bg-paper text-ink shadow-hard-lg">
              <div className="flex items-center justify-between border-b-[3px] border-ink bg-orange px-3 py-2 font-mono text-xs font-bold uppercase">
                <span>error 99 · birthday.exe</span>
                <span aria-hidden>✕</span>
              </div>
              <div className="flex flex-col gap-4 p-4 md:flex-row md:items-center md:p-5">
                <p className="flex-1 text-base font-semibold leading-snug md:text-lg">{errorCopy}</p>
                <Btn ref={proceedRef} tone="cobalt" size="lg" onClick={leave}>
                  Proceed anyway →
                </Btn>
              </div>
            </div>
          )}

          {phase !== "leaving" && phase !== "error" && (
            <button
              type="button"
              onClick={leave}
              className="font-mono text-xs uppercase tracking-widest text-paper/80 underline decoration-wavy underline-offset-4 hover:text-lime"
            >
              skip the nonsense
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
