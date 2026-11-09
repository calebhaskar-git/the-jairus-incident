import { Volume2, VolumeX } from "lucide-react";
import { useState, type CSSProperties } from "react";

import { CLASSIFIED_REVEALS, HERO_PHOTOS, MUGSHOT, SITE } from "@/content/jairus";
import { pick, shuffleChanged } from "@/lib/chaos";
import { useFlip } from "@/hooks/use-flip";
import { useInView } from "@/hooks/use-in-view";
import { cn } from "@/lib/utils";
import { CHAOS_NAMES, useChaos } from "./chaos-context";
import { Arrow, Bunny, Sparkle } from "./doodles";
import { Polaroid } from "./polaroid";
import { Btn, BurstSticker, Kicker, Sticker } from "./primitives";

export function TopBar({ visible }: { visible: boolean }) {
  const { chaos, cycleChaos, sound, toggleSound } = useChaos();
  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-40 transition-transform duration-500",
        visible ? "translate-y-0" : "-translate-y-[130%]",
      )}
    >
      <div className="mx-auto max-w-7xl px-3 pt-3 md:px-6">
        <div className="flex items-center justify-between gap-2 rounded-full border-[3px] border-ink bg-paper/90 px-2 py-1.5 shadow-hard backdrop-blur">
          <a href="#top" className="flex items-center gap-2 rounded-full pl-1 pr-2 font-display font-extrabold">
            <span className="w-8"><Bunny wiggle /></span>
            <span className="hidden sm:inline">BUNNY.EXE</span>
          </a>
          <nav aria-label="Sections" className="hidden items-center gap-4 font-mono text-xs font-bold uppercase lg:flex">
            <a href="#profile" className="hover:text-cobalt">profile</a>
            <a href="#buttons" className="hover:text-cobalt">buttons</a>
            <a href="#evidence" className="hover:text-cobalt">scrapbook</a>
            <a href="#lore" className="hover:text-cobalt">lore</a>
            <a href="#letter" className="hover:text-cobalt">letter</a>
          </nav>
          <div className="flex items-center gap-2">
            <Btn tone={chaos === 2 ? "orange" : chaos === 0 ? "paper" : "lime"} size="sm" onClick={cycleChaos} aria-label={`Chaos level: ${CHAOS_NAMES[chaos]}. Press to change.`}>
              <span aria-hidden className="flex items-end gap-0.5">
                {[0, 1, 2].map((i) => (
                  <span key={i} className={cn("w-1 rounded-sm border border-ink", i <= chaos ? "bg-ink" : "bg-paper")} style={{ height: 6 + i * 4 }} />
                ))}
              </span>
              chaos: {CHAOS_NAMES[chaos]}
            </Btn>
            <Btn tone="paper" size="sm" onClick={toggleSound} aria-pressed={sound} aria-label={sound ? "Sound on. Press to mute." : "Sound muted. Press to turn on."}>
              {sound ? <Volume2 className="size-4" aria-hidden /> : <VolumeX className="size-4" aria-hidden />}
              <span className="hidden sm:inline">{sound ? "sound" : "muted"}</span>
            </Btn>
          </div>
        </div>
      </div>
    </header>
  );
}

export function Ticker({ tone = "lime", tilt = -2, reverse = false }: { tone?: "lime" | "orange"; tilt?: number; reverse?: boolean }) {
  const words = ["Jairus", "Jarvis", "Malachiah", "Jairuuuus", "the bunny of the group", "certified menace", "birthday boy"];
  const row = [...words, ...words];
  return (
    <div aria-hidden className="relative z-10 -mx-[5%] w-[110%] overflow-hidden" style={{ transform: `rotate(${tilt}deg)` }}>
      <div className={cn("border-y-[3px] border-ink py-3", tone === "lime" ? "bg-lime text-ink" : "bg-orange text-ink")}>
        <div className="loop flex w-max animate-marquee gap-8" style={reverse ? { animationDirection: "reverse" } : undefined}>
          {row.map((w, i) => (
            <span key={i} className="flex items-center gap-8 whitespace-nowrap font-display text-2xl font-extrabold uppercase md:text-4xl">
              {w} <Sparkle className="w-6 text-ink" />
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

const LETTER_TILTS = [-8, 5, -3, 9, -6, 4];

export function Hero() {
  const { reduced, play } = useChaos();
  const [names, setNames] = useState(SITE.nicknames);
  const [tilts, setTilts] = useState([-3, 4, -2, 3]);
  const { register, capture } = useFlip(names.join("|"), !reduced);

  const shuffleNames = () => {
    capture();
    setNames((n) => shuffleChanged(n));
    setTilts((t) => t.map(() => Math.round((Math.random() - 0.5) * 14)));
    play("pop");
  };

  return (
    <section className="relative overflow-hidden bg-paper bg-dots pb-20 pt-28 md:pt-36">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 md:px-8 lg:grid-cols-12">
        <div className="relative lg:col-span-7">
          <Kicker className="text-cobalt">incident report #001 · filed by the group chat</Kicker>
          <h1 className="mt-4 font-display font-extrabold uppercase leading-[0.82] tracking-[-0.045em]">
            <span className="block text-[clamp(1.6rem,4.5vw,3.2rem)]">It's officially</span>
            <span className="block font-squish text-[clamp(5.5rem,22vw,15rem)] text-cobalt">
              {"JAIRUS".split("").map((l, i) => (
                <span key={i} className="letter" style={{ "--lr": `${LETTER_TILTS[i]}deg` } as CSSProperties}>{l}</span>
              ))}
            </span>
            <span className="block text-[clamp(2.6rem,8vw,6rem)]">
              Day<span className="text-orange">.</span>
            </span>
          </h1>
          <p className="mt-4 max-w-md -rotate-2 font-marker text-xl md:text-2xl">one year older. zero percent less of a menace.</p>
          <p className="mt-6 max-w-lg text-lg leading-relaxed text-ink-soft">
            A digital scrapbook, affectionate roast and official incident report — put together by people who love him a normal amount (too much).
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <span className="font-mono text-xs font-bold uppercase">also answers to:</span>
            {names.map((n, i) => (
              <span key={n} ref={register(n)} className="inline-block">
                <Sticker tone={i % 2 ? "orange" : "lime"} shape="tag" className="text-sm md:text-base" style={{ rotate: `${tilts[i] ?? 0}deg` }}>
                  {n}
                </Sticker>
              </span>
            ))}
            <Btn tone="ink" size="sm" onClick={shuffleNames}>shuffle ↻</Btn>
          </div>
        </div>

        <div className="relative mx-auto h-[25rem] w-full max-w-md sm:h-[32rem] lg:col-span-5 lg:max-w-none">
          <div className="absolute right-0 top-0 h-[76%] w-[70%]">
            <Polaroid slot={HERO_PHOTOS[0]!} />
          </div>
          <div className="absolute bottom-0 left-0 h-[50%] w-[50%]">
            <Polaroid slot={HERO_PHOTOS[1]!} />
          </div>
          <BurstSticker tone="lime" className="loop absolute -left-2 top-2 w-28 animate-spin-slow text-xs md:w-36 md:text-sm">
            the bunny of the group
          </BurstSticker>
          <Sticker tone="orange" className="absolute -right-2 bottom-[16%] rotate-6 text-sm md:text-lg">certified menace</Sticker>
          <div className="absolute bottom-[54%] left-[6%] flex flex-col items-start text-cobalt">
            <span className="-rotate-6 font-marker text-lg md:text-xl">the birthday boy</span>
            <Arrow className="w-20 rotate-[20deg] md:w-28" />
          </div>
        </div>
      </div>
    </section>
  );
}

function StatRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-2 border-b-2 border-dashed border-ink/30 py-4 sm:grid-cols-[11rem_1fr] sm:items-center">
      <dt className="font-mono text-xs font-bold uppercase tracking-wider">{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

export function Profile() {
  const { play } = useChaos();
  const { ref, inView } = useInView<HTMLDivElement>();
  const [classified, setClassified] = useState<string | null>(null);
  const [test, setTest] = useState<string | null>(null);

  const yell = () => {
    const n = pick(SITE.nicknames);
    setTest(`“${n.toUpperCase()}!!” … response received in 0.2 sec ✓`);
    play("blip");
  };

  return (
    <section id="profile" className="relative overflow-hidden bg-lime py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-4 md:px-8">
        <Kicker>section 02 · for science (not real science)</Kicker>
        <h2 className="mt-3 font-display text-[clamp(3rem,10vw,7.5rem)] font-extrabold uppercase leading-[0.85] tracking-[-0.04em]">
          Scientific <span className="text-outline">profile</span>
        </h2>

        <div ref={ref} className="relative mt-10 grid overflow-hidden rounded-[1.5rem] border-[3px] border-ink bg-paper shadow-hard-lg md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
          <div className="relative border-b-[3px] border-ink bg-height-chart p-6 md:border-b-0 md:border-r-[3px]">
            <div className="mx-auto aspect-[4/5] w-full max-w-xs">
              <Polaroid slot={MUGSHOT} showCaption={false} />
            </div>
            <div className="mx-auto mt-4 max-w-xs rounded-md border-[3px] border-ink bg-ink px-4 py-3 text-center font-mono text-paper">
              <p className="text-xs uppercase tracking-widest text-lime">specimen</p>
              <p className="font-display text-xl font-extrabold">J. MELCHIAH · BN-01</p>
            </div>
          </div>

          <div className="bg-graph relative p-6 md:p-8">
            <span className={cn("absolute right-4 top-4 rounded-md border-4 border-orange px-3 py-1 font-display text-xl font-extrabold uppercase text-orange", inView ? "animate-stamp" : "opacity-0")} aria-hidden>
              classified
            </span>
            <dl>
              <StatRow label="Bunny energy">
                <div className="flex items-center gap-3">
                  <div className="h-6 flex-1 overflow-hidden rounded-full border-[3px] border-ink bg-paper">
                    <div className="h-full bg-cobalt transition-[width] duration-[1600ms] ease-out" style={{ width: inView ? "100%" : "0%" }} />
                  </div>
                  <span className="font-display text-2xl font-extrabold">100%</span>
                </div>
                <p className="mt-1 font-marker text-sm">(we checked twice)</p>
              </StatRow>
              <StatRow label="Chaos level">
                <button
                  type="button"
                  onClick={() => { setClassified(pick(CLASSIFIED_REVEALS)); play("error"); }}
                  className="rounded-sm bg-ink px-3 py-1 font-mono text-sm font-bold uppercase text-paper hover:bg-cobalt"
                >
                  {classified ?? "████████ classified"}
                </button>
              </StatRow>
              <StatRow label="Nickname response time">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-display text-3xl font-extrabold">0.2 sec</span>
                  <Btn tone="orange" size="sm" onClick={yell}>test it</Btn>
                </div>
                {test && <p role="status" className="mt-2 font-mono text-xs">{test}</p>}
              </StatRow>
              <StatRow label="Group mascot status">
                <Sticker tone="cobalt" shape="tag" className="-rotate-2 text-base">✓ certified</Sticker>
              </StatRow>
              <StatRow label="Birthday status">
                <span className="inline-flex items-center gap-2 font-display text-xl font-extrabold uppercase">
                  <span className="loop inline-block size-3 animate-blink rounded-full bg-orange" aria-hidden /> active
                </span>
              </StatRow>
            </dl>
            <p className="mt-5 rounded-md border-2 border-dashed border-ink bg-paper p-3 font-mono text-xs leading-relaxed">
              ⚠ DISCLAIMER: every number on this page is a joke, made up for comedic purposes. Not a real assessment of Jairus, who is, scientifically, unmeasurable.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
