import * as Dialog from "@radix-ui/react-dialog";
import { useMemo, useRef, useState } from "react";

import {
  COMPLIMENTS,
  DO_NOT_PRESS_AFTER,
  DO_NOT_PRESS_LABELS,
  FAKE_ALERTS,
  FINALE_STICKERS,
  FORTUNES,
  SERIOUS_MESSAGE,
  SITE,
  SURPRISE_LABELS,
  type FakeAlert,
} from "@/content/jairus";
import { createBag, pick, randBetween, randInt } from "@/lib/chaos";
import { cn } from "@/lib/utils";
import { useChaos } from "./chaos-context";
import { Bunny } from "./doodles";
import { Btn, Kicker, Sticker, type Tone } from "./primitives";

type Outcome = "rain" | "compliment" | "roulette" | "barrel" | "quake" | "invert" | "sticker" | "nothing" | "fortune";
const GENTLE: Outcome[] = ["rain", "compliment", "roulette", "sticker", "nothing", "fortune"];
const WILD: Outcome[] = ["barrel", "quake", "invert"];
type Placed = { id: number; text: string; tone: Tone; left: number; top: number; rot: number };
const TONES: Tone[] = ["lime", "orange", "paper", "ink"];

export function PressThings() {
  const { chaos, reduced, play, pageFx, bunnyRain, peek } = useChaos();
  const [log, setLog] = useState<string[]>(["bunny.exe console ready. please do not press anything."]);
  const [placed, setPlaced] = useState<Placed[]>([]);
  const idRef = useRef(0);
  const write = (s: string) => setLog((l) => [...l.slice(-4), s]);

  // serious message
  const alertBag = useMemo(() => createBag(FAKE_ALERTS), []);
  const [alert, setAlert] = useState<FakeAlert | null>(null);
  const [secondaryClicked, setSecondaryClicked] = useState(false);
  const [showSerious, setShowSerious] = useState(false);

  const openAlert = () => {
    setSecondaryClicked(false);
    setAlert(alertBag.next());
    play("error");
    write("serious_message.txt → access denied (too serious)");
  };
  const resolveAlert = () => {
    setAlert(null);
    setShowSerious(true);
    play("pop");
    write("serious message unlocked. feelings detected.");
  };

  // surprise
  const pool = useMemo(() => (chaos === 0 || reduced ? GENTLE : [...GENTLE, ...WILD]), [chaos, reduced]);
  const bag = useMemo(() => createBag(pool), [pool]);
  const [surprise, setSurprise] = useState<{ title: string; detail: string } | null>(null);
  const [surpriseLabel, setSurpriseLabel] = useState(SURPRISE_LABELS[0] ?? "Surprise me");
  const [rolling, setRolling] = useState(false);

  const addSticker = () => {
    const s: Placed = {
      id: ++idRef.current,
      text: pick(FINALE_STICKERS),
      tone: pick(TONES),
      left: randBetween(2, 86),
      top: randBetween(4, 90),
      rot: randBetween(-25, 25),
    };
    setPlaced((p) => [...p.slice(-9), s]);
  };

  const runSurprise = () => {
    if (rolling) return;
    const o = bag.next();
    setSurpriseLabel(pick(SURPRISE_LABELS.slice(1)));
    play("pop");
    const show = (title: string, detail: string) => {
      setSurprise({ title, detail });
      write(`surprise → ${title.toLowerCase()}`);
    };
    switch (o) {
      case "rain":
        show("Bunny rain", bunnyRain() ? "Forecast: 100% chance of bunny." : "Imagine it. (Motion is reduced, so the bunnies stayed home.)");
        break;
      case "compliment":
        show("compliment.exe", pick(COMPLIMENTS));
        break;
      case "fortune":
        show("Birthday fortune", pick(FORTUNES));
        break;
      case "sticker":
        addSticker();
        show("Sticker deployed", "A sticker has been slapped somewhere on this section. Find it.");
        break;
      case "barrel":
        pageFx("barrel");
        show("Barrel roll", "The whole page did a barrel roll. You're welcome.");
        break;
      case "quake":
        pageFx("shake");
        show("Earthquake", "Magnitude 9.9 on the bunny scale.");
        break;
      case "invert":
        pageFx("invert");
        show("Bunny mode", "Colours inverted for legal reasons.");
        break;
      case "nothing":
        show("Nothing happened.", "Nothing at all. Move along.");
        window.setTimeout(() => {
          peek();
          setSurprise({ title: "Nothing happened.", detail: "…or did it? (check the bottom of your screen)" });
        }, randInt(1100, 2400));
        break;
      case "roulette": {
        setRolling(true);
        let n = 0;
        const total = reduced ? 1 : randInt(12, 20);
        const iv = window.setInterval(() => {
          n++;
          const name = pick(SITE.nicknames);
          setSurprise({ title: "Nickname roulette", detail: `${name}${n < total ? "…" : " wins!"}` });
          if (n >= total) {
            window.clearInterval(iv);
            setRolling(false);
            write(`nickname roulette → ${name}`);
            play("boing");
          }
        }, 75);
        break;
      }
    }
  };

  // do not press
  const [presses, setPresses] = useState(0);
  const [round, setRound] = useState(0);
  const [broken, setBroken] = useState(false);
  const labels = round === 0 ? DO_NOT_PRESS_LABELS : DO_NOT_PRESS_AFTER;
  const pressForbidden = () => {
    if (broken) return;
    const next = presses + 1;
    play(next >= labels.length ? "error" : "blip");
    if (next >= labels.length) {
      setBroken(true);
      write("do_not_press.btn has fallen off the website");
      window.setTimeout(() => {
        setBroken(false);
        setPresses(0);
        setRound((r) => r + 1);
        write("do_not_press.btn respawned (unfortunately)");
      }, reduced ? 600 : 1500);
      return;
    }
    setPresses(next);
  };
  const forbiddenLabel = broken ? "*crunch*" : labels[presses] ?? "Do not press";

  return (
    <section id="buttons" className="relative overflow-hidden bg-cobalt py-20 text-paper md:py-28">
      <div aria-hidden className="bg-dots-light pointer-events-none absolute inset-0" />
      <div aria-hidden className="pointer-events-none absolute inset-0">
        {placed.map((s) => (
          <Sticker key={s.id} tone={s.tone} className="absolute animate-pop text-sm md:text-lg" style={{ left: `${s.left}%`, top: `${s.top}%`, rotate: `${s.rot}deg` }}>
            {s.text}
          </Sticker>
        ))}
      </div>

      <div className="relative mx-auto max-w-6xl px-4 md:px-8">
        <Kicker className="text-lime">section 03 · interactive hazards</Kicker>
        <h2 className="mt-3 font-display text-[clamp(2.8rem,9vw,7rem)] font-extrabold uppercase leading-[0.85] tracking-[-0.04em]">
          Do not press <br className="hidden sm:block" />these buttons
        </h2>
        <p className="mt-3 -rotate-2 font-marker text-2xl text-lime">(press them)</p>

        <div className="mt-12 grid gap-8 md:grid-cols-3">
          <article className="tilted flex flex-col gap-4 rounded-[1.5rem] border-[3px] border-ink bg-paper p-6 text-ink shadow-hard-lg" style={{ "--r": "-2deg" } as React.CSSProperties}>
            <Kicker className="text-cobalt">button 01</Kicker>
            <h3 className="font-display text-3xl font-extrabold uppercase leading-none">A serious birthday message</h3>
            <p className="text-ink-soft">Completely serious. No jokes. We promise.</p>
            {showSerious && (
              <div className="animate-pop rounded-xl border-[3px] border-ink bg-lime p-4" role="status">
                <p className="font-marker text-lg">{SERIOUS_MESSAGE.title}</p>
                <p className="mt-1 font-semibold leading-snug">{SERIOUS_MESSAGE.body}</p>
              </div>
            )}
            <Btn tone="cobalt" size="lg" className="mt-auto" onClick={openAlert}>
              {showSerious ? "read it again (seriously)" : "open serious message"}
            </Btn>
          </article>

          <article className="tilted flex flex-col gap-4 rounded-[1.5rem] border-[3px] border-ink bg-orange p-6 text-ink shadow-hard-lg md:translate-y-8" style={{ "--r": "2deg" } as React.CSSProperties}>
            <Kicker>button 02</Kicker>
            <h3 className="font-display text-3xl font-extrabold uppercase leading-none">Random surprise</h3>
            <div className="min-h-[6.5rem] rounded-xl border-[3px] border-ink bg-paper p-4" aria-live="polite">
              {surprise ? (
                <div key={surprise.title + surprise.detail.length} className="animate-rise">
                  <p className="font-display text-xl font-extrabold uppercase">{surprise.title}</p>
                  <p className="mt-1 leading-snug">{surprise.detail}</p>
                </div>
              ) : (
                <p className="font-mono text-sm">9 possible outcomes. You won't get the same one twice in a row.</p>
              )}
            </div>
            <Btn tone="lime" size="lg" className="mt-auto" onClick={runSurprise} disabled={rolling}>
              {surpriseLabel}
            </Btn>
          </article>

          <article className="tilted flex flex-col gap-4 rounded-[1.5rem] border-[3px] border-ink bg-lime p-6 text-ink shadow-hard-lg" style={{ "--r": "-3deg" } as React.CSSProperties}>
            <Kicker>button 03</Kicker>
            <h3 className="font-display text-3xl font-extrabold uppercase leading-none">The forbidden one</h3>
            <p className="font-mono text-sm">presses: {presses} / {labels.length}</p>
            <div className="mt-auto flex justify-center">
              <Btn tone="ink" size="lg" onClick={pressForbidden} className={cn(broken && !reduced && "animate-fall-off")} aria-live="polite">
                {forbiddenLabel}
              </Btn>
            </div>
          </article>
        </div>

        <div className="mt-16 max-w-2xl rounded-xl border-[3px] border-ink bg-ink p-4 font-mono text-sm text-lime shadow-hard-orange" role="log" aria-live="polite" aria-label="bunny.exe console">
          {log.map((l, i) => (
            <p key={i + l} className={cn(i === log.length - 1 ? "text-lime" : "text-paper/60")}>&gt; {l}</p>
          ))}
        </div>
      </div>

      <Dialog.Root open={alert !== null} onOpenChange={(o) => { if (!o) { setAlert(null); write("alert dismissed. coward."); } }}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-[80] bg-ink/60" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-[81] w-[min(92vw,30rem)] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-xl border-[3px] border-ink bg-paper text-ink shadow-hard-lg">
            {alert && (
              <div className="animate-pop">
                <div className="flex items-center justify-between border-b-[3px] border-ink bg-cobalt px-3 py-2 text-paper">
                  <span className="font-mono text-xs font-bold uppercase">system alert</span>
                  <span aria-hidden className="flex gap-1">
                    <span className="size-3 rounded-full border-2 border-ink bg-lime" />
                    <span className="size-3 rounded-full border-2 border-ink bg-orange" />
                  </span>
                </div>
                <div className="flex gap-4 p-5">
                  <div className="w-16 shrink-0"><Bunny mood="shock" /></div>
                  <div>
                    <Dialog.Title className="font-display text-xl font-extrabold leading-tight">{alert.title}</Dialog.Title>
                    <Dialog.Description className="mt-2 text-sm leading-relaxed text-ink-soft">{alert.body}</Dialog.Description>
                  </div>
                </div>
                <div className="flex flex-wrap justify-end gap-3 border-t-2 border-dashed border-ink/40 p-4">
                  <Btn tone="paper" size="sm" onClick={() => { if (!secondaryClicked) { setSecondaryClicked(true); play("boing"); } else resolveAlert(); }}>
                    {secondaryClicked ? alert.secondaryAfter : alert.secondary}
                  </Btn>
                  <Btn tone="lime" size="sm" onClick={resolveAlert}>{alert.primary}</Btn>
                </div>
              </div>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </section>
  );
}
