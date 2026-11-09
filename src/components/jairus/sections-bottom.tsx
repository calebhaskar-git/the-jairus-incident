import * as Dialog from "@radix-ui/react-dialog";
import { useEffect, useRef, useState, type CSSProperties } from "react";

import { BUDDY_LINES, FINALE_STICKERS, LETTER, LORE, PHOTOS, SITE, type PhotoSlot } from "@/content/jairus";
import { pick, randBetween, shuffleChanged } from "@/lib/chaos";
import { fireConfetti, type ConfettiPattern } from "@/lib/confetti";
import { useFlip } from "@/hooks/use-flip";
import { cn } from "@/lib/utils";
import { useChaos } from "./chaos-context";
import { Arrow, Bunny, Scribble, Sparkle } from "./doodles";
import { PhotoPlaceholder, Polaroid, usePhotoSrc } from "./polaroid";
import { Btn, Kicker, Sticker, type Tone } from "./primitives";

const SIZE: Record<NonNullable<PhotoSlot["size"]>, string> = {
  sm: "col-span-1 row-span-2",
  md: "col-span-1 row-span-3",
  lg: "col-span-2 row-span-3",
  wide: "col-span-2 row-span-2",
};

function Lightbox({ slot, onClose }: { slot: PhotoSlot | null; onClose: () => void }) {
  const fallback = PHOTOS[0]!;
  const { src } = usePhotoSrc(slot ?? fallback);
  return (
    <Dialog.Root open={slot !== null} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[80] bg-ink/80" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-[81] w-[min(92vw,44rem)] -translate-x-1/2 -translate-y-1/2 border-[3px] border-ink bg-paper p-3 text-ink shadow-hard-lg">
          {slot && (
            <div className="animate-pop">
              <div className="relative aspect-[4/3] overflow-hidden border-2 border-ink bg-paper-dim">
                {src ? <img src={src} alt={slot.alt} className="absolute inset-0 h-full w-full object-contain" /> : <PhotoPlaceholder slot={slot} />}
              </div>
              <div className="flex items-center justify-between gap-3 pt-3">
                <Dialog.Title className="font-marker text-xl">{slot.caption}</Dialog.Title>
                <Dialog.Close asChild><Btn tone="lime" size="sm">close</Btn></Dialog.Close>
              </div>
              <Dialog.Description className="sr-only">{src ? slot.alt : "This slot is waiting for a real photo."}</Dialog.Description>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function Gallery() {
  const { reduced, play, editPhotos, setEditPhotos } = useChaos();
  const [order, setOrder] = useState(PHOTOS.map((p) => p.id));
  const [open, setOpen] = useState<PhotoSlot | null>(null);
  const { register, capture } = useFlip(order.join("|"), !reduced);
  const byId = new Map(PHOTOS.map((p) => [p.id, p]));
  const anyPlaceholder = PHOTOS.some((p) => !p.src);

  return (
    <section id="evidence" className="relative overflow-hidden bg-paper bg-dots py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <Kicker className="text-cobalt">section 04 · the scrapbook</Kicker>
            <h2 className="mt-3 font-display text-[clamp(3rem,11vw,8rem)] font-extrabold uppercase leading-[0.82] tracking-[-0.045em]">
              The <span className="text-orange">evidence</span>
            </h2>
            <p className="mt-3 rotate-1 font-marker text-xl">exhibits A–I, collected lovingly, without consent</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Btn tone="lime" onClick={() => { capture(); setOrder((o) => shuffleChanged(o)); play("whoosh"); }}>
              shuffle the evidence ↻
            </Btn>
            <Btn tone={editPhotos ? "orange" : "paper"} onClick={() => setEditPhotos(!editPhotos)} aria-pressed={editPhotos}>
              {editPhotos ? "done trying photos" : "try photos on this device"}
            </Btn>
          </div>
        </div>

        {SITE.showPhotoHelp && anyPlaceholder && (
          <aside className="relative mt-10 max-w-3xl -rotate-1 rounded-xl border-[3px] border-dashed border-ink bg-paper p-5 shadow-hard" aria-label="How to add photos">
            <Sticker tone="orange" shape="tag" className="absolute -top-4 left-4 rotate-[-4deg] text-xs">for the organiser</Sticker>
            <h3 className="font-display text-xl font-extrabold uppercase">How to add the real photos</h3>
            <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-sm leading-relaxed md:text-base">
              <li><b>Easiest:</b> upload the photos in the Lovable chat and say which slot each one goes in (e.g. “slot C = beach photo”). They'll show for everyone.</li>
              <li><b>Just previewing?</b> Press “try photos on this device” and add photos to any slot — those stay on your device only.</li>
              <li><b>In code:</b> drop files in <code className="font-mono">src/assets/photos/</code> and set <code className="font-mono">src</code> for the slot in <code className="font-mono">src/content/jairus.ts</code>. Captions live there too.</li>
            </ol>
          </aside>
        )}

        <div className="mt-14 grid grid-flow-dense auto-rows-[7rem] grid-cols-2 gap-5 md:auto-rows-[8.5rem] md:gap-8 lg:grid-cols-4">
          {order.map((id) => {
            const slot = byId.get(id);
            if (!slot) return null;
            return (
              <div key={id} ref={register(id)} className={SIZE[slot.size ?? "sm"]}>
                <Polaroid slot={slot} onOpen={() => setOpen(slot)} />
              </div>
            );
          })}
        </div>
      </div>
      <Lightbox slot={open} onClose={() => setOpen(null)} />
    </section>
  );
}

const LORE_TONES: { bg: string; rot: number }[] = [
  { bg: "bg-lime text-ink", rot: -3 },
  { bg: "bg-orange text-ink", rot: 2 },
  { bg: "bg-paper text-ink", rot: -1 },
  { bg: "bg-cobalt text-paper", rot: 3 },
  { bg: "bg-lime text-ink", rot: -2 },
  { bg: "bg-paper text-ink", rot: 4 },
];

export function Lore() {
  const { play } = useChaos();
  const [flipped, setFlipped] = useState<Record<number, boolean>>({});
  return (
    <section id="lore" className="relative overflow-hidden bg-ink py-20 text-paper md:py-28">
      <div aria-hidden className="bg-dots-light pointer-events-none absolute inset-0" />
      <div className="relative mx-auto max-w-6xl px-4 md:px-8">
        <Kicker className="text-lime">section 05 · heavily redacted</Kicker>
        <h2 className="mt-3 font-display text-[clamp(3rem,10vw,7.5rem)] font-extrabold uppercase leading-[0.85] tracking-[-0.04em]">
          Group <span className="loop inline-block animate-glitch text-lime">lore</span>
        </h2>
        <p className="mt-3 max-w-xl text-paper/80">Tap a file to flip it. These are placeholders until the group fills in the real lore.</p>

        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {LORE.map((item, i) => {
            const tone = LORE_TONES[i % LORE_TONES.length]!;
            const isFlipped = Boolean(flipped[i]);
            return (
              <button
                key={item.tag}
                type="button"
                onClick={() => { setFlipped((f) => ({ ...f, [i]: !f[i] })); play("blip"); }}
                aria-pressed={isFlipped}
                className="perspective tilted h-56 text-left"
                style={{ "--r": `${tone.rot}deg` } as CSSProperties}
              >
                <span className={cn("preserve-3d relative block h-full w-full transition-transform duration-700", isFlipped && "[transform:rotateY(180deg)]")}>
                  <span className={cn("backface-hidden absolute inset-0 flex flex-col rounded-xl border-[3px] border-ink p-5 shadow-hard-lime", tone.bg)}>
                    <span className="font-mono text-xs font-bold uppercase tracking-widest">{item.tag}</span>
                    <span className="mt-3 font-display text-2xl font-extrabold leading-tight">{item.title}</span>
                    <span className="mt-auto font-mono text-xs uppercase">tap to open ↻</span>
                    {item.placeholder && (
                      <span className="absolute bottom-4 right-4 rotate-[-10deg] rounded border-[3px] border-current px-2 py-0.5 font-display text-sm font-extrabold uppercase opacity-70">edit me</span>
                    )}
                  </span>
                  <span className={cn("backface-hidden absolute inset-0 flex flex-col rounded-xl border-[3px] border-ink bg-paper p-5 text-ink shadow-hard-lime [transform:rotateY(180deg)]")}>
                    <span className="font-mono text-xs font-bold uppercase tracking-widest text-cobalt">{item.tag} · declassified</span>
                    <span className="mt-3 font-marker text-xl leading-snug">{item.body}</span>
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function Letter() {
  const { play } = useChaos();
  const [open, setOpen] = useState(false);
  const letterRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => { if (open) letterRef.current?.focus(); }, [open]);

  return (
    <section id="letter" className="relative overflow-hidden bg-paper-dim py-20 md:py-28">
      <div className="mx-auto max-w-3xl px-4 md:px-8">
        <Kicker className="text-cobalt">section 06 · no jokes (we tried)</Kicker>
        <h2 className="mt-3 font-display text-[clamp(2.8rem,9vw,6.5rem)] font-extrabold uppercase leading-[0.85] tracking-[-0.04em]">
          Ok. Serious now.
        </h2>
        <p className="mt-2 -rotate-1 font-marker text-xl text-orange">for real this time</p>

        {!open ? (
          <div className="mt-12 flex flex-col items-center">
            <div className="relative aspect-[3/2] w-full max-w-md rounded-lg border-[3px] border-ink bg-paper shadow-hard-lg">
              <div aria-hidden className="absolute inset-x-0 top-0 h-1/2 border-b-[3px] border-ink bg-lime [clip-path:polygon(0_0,100%_0,50%_100%)]" />
              <div className="absolute left-1/2 top-1/2 w-20 -translate-x-1/2 -translate-y-1/3 rounded-full border-[3px] border-ink bg-orange p-2">
                <Bunny />
              </div>
              <p className="absolute bottom-4 left-0 right-0 text-center font-marker text-lg">to: {SITE.firstName}</p>
            </div>
            <Btn tone="cobalt" size="lg" className="mt-8" onClick={() => { setOpen(true); play("whoosh"); }}>
              open the letter
            </Btn>
          </div>
        ) : (
          <div ref={letterRef} tabIndex={-1} className="bg-lined mt-12 animate-unfold rounded-lg border-[3px] border-ink bg-paper p-6 leading-[2.1rem] shadow-hard-lg outline-none md:p-10">
            <p className="font-marker text-2xl">{LETTER.greeting}</p>
            {LETTER.paragraphs.map((p, i) => (
              <p key={i} className="mt-[2.1rem] animate-rise text-lg" style={{ animationDelay: `${300 + i * 350}ms` }}>{p}</p>
            ))}
            <p className="mt-[2.1rem] font-marker text-xl">{LETTER.signoff}</p>
            <p className="font-marker text-xl text-cobalt">{LETTER.from}</p>
          </div>
        )}
      </div>
    </section>
  );
}

type Pop = { id: number; text: string; tone: Tone; left: number; top: number; rot: number; delay: number };
const PATTERNS: ConfettiPattern[] = ["burst", "cannons", "rain"];

export function Finale({ onReplayIntro }: { onReplayIntro: () => void }) {
  const { reduced, play } = useChaos();
  const [state, setState] = useState<"idle" | "loading" | "revealed">("idle");
  const [pops, setPops] = useState<Pop[]>([]);
  const lastPattern = useRef<ConfettiPattern>("burst");

  const scatter = () =>
    setPops(
      Array.from({ length: 10 }, (_, i) => ({
        id: Date.now() + i,
        text: FINALE_STICKERS[i % FINALE_STICKERS.length] ?? "HBD",
        tone: (["lime", "orange", "paper", "ink"] as Tone[])[i % 4]!,
        left: randBetween(2, 82),
        top: randBetween(4, 88),
        rot: randBetween(-22, 22),
        delay: reduced ? 0 : randBetween(0, 600),
      })),
    );

  const boom = (pattern?: ConfettiPattern) => {
    const p = pattern ?? pick(PATTERNS.filter((x) => x !== lastPattern.current));
    lastPattern.current = p;
    if (!reduced) fireConfetti(p);
    scatter();
    play("fanfare");
  };

  const reveal = () => {
    setState("loading");
    play("blip");
    window.setTimeout(() => { setState("revealed"); boom("burst"); }, reduced ? 100 : 900);
  };

  return (
    <section id="finale" className="relative overflow-hidden bg-cobalt-deep py-24 text-paper md:py-32">
      <div aria-hidden className="bg-dots-light pointer-events-none absolute inset-0" />
      <div aria-hidden className="pointer-events-none absolute inset-0">
        {pops.map((s) => (
          <Sticker key={s.id} tone={s.tone} className="absolute animate-pop text-sm md:text-xl" style={{ left: `${s.left}%`, top: `${s.top}%`, rotate: `${s.rot}deg`, animationDelay: `${s.delay}ms` }}>
            {s.text}
          </Sticker>
        ))}
      </div>

      <div className="relative mx-auto max-w-6xl px-4 text-center md:px-8">
        {state !== "revealed" ? (
          <div className="flex flex-col items-center">
            <Kicker className="text-lime">section 07 · the actual point</Kicker>
            <h2 className="mt-4 font-display text-[clamp(2.6rem,8vw,6rem)] font-extrabold uppercase leading-[0.85] tracking-[-0.04em]">One last button.</h2>
            <div className="relative mt-10">
              <Arrow className="absolute -left-28 -top-10 hidden w-24 text-lime md:block" />
              <Btn tone="lime" size="xl" onClick={reveal} disabled={state === "loading"}>
                {state === "loading" ? "loading feelings…" : "release the birthday"}
              </Btn>
            </div>
          </div>
        ) : (
          <div className="relative z-10 flex flex-col items-center" role="status">
            <div className="loop w-24 animate-float md:w-32"><Bunny wiggle mood="wink" /></div>
            <h2 className="mt-4 font-display font-extrabold uppercase leading-[0.8] tracking-[-0.05em]">
              <span className="block animate-pop text-[clamp(3rem,11vw,8.5rem)] text-paper">Happy</span>
              <span className="block animate-pop text-[clamp(3rem,11vw,8.5rem)] text-orange [animation-delay:150ms]">birthday</span>
              <span className="block animate-pop font-squish text-[clamp(4.5rem,18vw,14rem)] text-lime [animation-delay:300ms]">Jairus</span>
            </h2>
            <p className="mt-6 max-w-xl animate-rise font-marker text-2xl leading-snug md:text-3xl [animation-delay:600ms]">
              you are loved, you absolute menace.
            </p>
            <div className="mt-10 flex flex-wrap justify-center gap-3">
              <Btn tone="lime" size="lg" onClick={() => boom()}>again (different chaos)</Btn>
              <Btn tone="paper" size="lg" onClick={onReplayIntro}>replay the intro</Btn>
            </div>
          </div>
        )}
        <Scribble className="loop pointer-events-none absolute -bottom-6 right-4 w-24 animate-spin-slow text-orange opacity-70" />
        <Sparkle className="loop pointer-events-none absolute left-6 top-0 w-10 animate-float text-lime" />
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="border-t-[3px] border-ink bg-ink px-4 py-8 text-center font-mono text-xs uppercase tracking-widest text-paper/80">
      Jairus.exe · compiled with love by {SITE.from} · no bunnies were harmed
    </footer>
  );
}

export function CursorBuddy() {
  const { chaos, reduced, introDone } = useChaos();
  const [enabled, setEnabled] = useState(false);
  const [bubble, setBubble] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => { setEnabled(window.matchMedia("(pointer: fine)").matches); }, []);

  const active = enabled && !reduced && chaos > 0 && introDone;
  useEffect(() => {
    if (!active) return;
    const target = { x: -100, y: -100 };
    const pos = { x: -100, y: -100 };
    let raf = 0;
    let hovering: Element | null = null;
    const ease = chaos === 2 ? 0.08 : 0.16;
    const move = (e: PointerEvent) => {
      target.x = e.clientX;
      target.y = e.clientY;
      const hit = (e.target as Element | null)?.closest?.("button, a, label") ?? null;
      if (hit !== hovering) {
        hovering = hit;
        setBubble(hit ? pick(BUDDY_LINES) : null);
      }
    };
    const tick = () => {
      pos.x += (target.x - pos.x) * ease;
      pos.y += (target.y - pos.y) * ease;
      const tilt = Math.max(-25, Math.min(25, (target.x - pos.x) * 0.4));
      if (ref.current) ref.current.style.transform = `translate(${pos.x + 18}px, ${pos.y + 14}px) rotate(${tilt}deg) scale(${hovering ? 1.25 : 1})`;
      raf = requestAnimationFrame(tick);
    };
    window.addEventListener("pointermove", move);
    raf = requestAnimationFrame(tick);
    return () => { window.removeEventListener("pointermove", move); cancelAnimationFrame(raf); };
  }, [active, chaos]);

  if (!active) return null;
  return (
    <div ref={ref} aria-hidden className="pointer-events-none fixed left-0 top-0 z-[65] w-10 transition-[scale]">
      <Bunny wiggle />
      {bubble && (
        <span className="absolute -top-7 left-8 animate-pop whitespace-nowrap rounded-full border-2 border-ink bg-lime px-2 py-0.5 font-mono text-[10px] font-bold uppercase text-ink">
          {bubble}
        </span>
      )}
    </div>
  );
}
