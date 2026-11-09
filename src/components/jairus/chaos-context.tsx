import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { randBetween, randInt } from "@/lib/chaos";
import { loadPhotoPreviews, savePhotoPreviews } from "@/lib/photo-store";
import { playSound, unlockAudio, type SoundName } from "@/lib/sound";
import { Bunny } from "./doodles";

export type ChaosLevel = 0 | 1 | 2;
export const CHAOS_NAMES = ["chill", "spicy", "unhinged"] as const;
type PageFx = "barrel" | "shake" | "invert";

type Drop = {
  id: number;
  kind: "rain" | "peek";
  left: number;
  delay: number;
  dur: number;
  size: number;
  rot: number;
};

type ChaosValue = {
  chaos: ChaosLevel;
  cycleChaos: () => void;
  sound: boolean;
  toggleSound: () => void;
  play: (name: SoundName) => void;
  reduced: boolean;
  fxClass: string | undefined;
  pageFx: (fx: PageFx) => boolean;
  bunnyRain: (count?: number) => boolean;
  peek: () => void;
  previews: Record<string, string>;
  setPreview: (id: string, dataUrl: string | null) => boolean;
  introDone: boolean;
  setIntroDone: (v: boolean) => void;
  editPhotos: boolean;
  setEditPhotos: (v: boolean) => void;
};

const Ctx = createContext<ChaosValue | null>(null);

export function useChaos() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useChaos must be used inside <ChaosProvider>");
  return v;
}

const FX_MS: Record<PageFx, number> = { barrel: 1200, shake: 800, invert: 1700 };

export function ChaosProvider({ children }: { children: ReactNode }) {
  const [chaos, setChaos] = useState<ChaosLevel>(1);
  const [sound, setSound] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [fx, setFx] = useState<PageFx | null>(null);
  const [drops, setDrops] = useState<Drop[]>([]);
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const [introDone, setIntroDone] = useState(false);
  const [editPhotos, setEditPhotos] = useState(false);
  const soundRef = useRef(false);
  const idRef = useRef(0);
  const fxTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener?.("change", update);
    setPreviews(loadPhotoPreviews());
    const saved = window.localStorage.getItem("jairus-chaos");
    if (saved === "0" || saved === "1" || saved === "2") setChaos(Number(saved) as ChaosLevel);
    return () => mq.removeEventListener?.("change", update);
  }, []);

  const play = useCallback((name: SoundName) => {
    if (soundRef.current) playSound(name);
  }, []);

  const toggleSound = useCallback(() => {
    const next = !soundRef.current;
    if (next) unlockAudio();
    soundRef.current = next;
    setSound(next);
    if (next) window.setTimeout(() => playSound("pop"), 30);
  }, []);

  const cycleChaos = useCallback(() => {
    setChaos((c) => {
      const next = ((c + 1) % 3) as ChaosLevel;
      try {
        window.localStorage.setItem("jairus-chaos", String(next));
      } catch {
        /* ignore */
      }
      return next;
    });
    play("boing");
  }, [play]);

  const pageFx = useCallback(
    (name: PageFx) => {
      if (reduced && name !== "invert") return false;
      window.clearTimeout(fxTimer.current);
      setFx(null);
      requestAnimationFrame(() => setFx(name));
      fxTimer.current = window.setTimeout(() => setFx(null), FX_MS[name]);
      return true;
    },
    [reduced],
  );

  const bunnyRain = useCallback(
    (count?: number) => {
      if (reduced) return false;
      const n = count ?? (chaos === 2 ? 34 : chaos === 0 ? 10 : 20);
      const next: Drop[] = Array.from({ length: n }, () => ({
        id: ++idRef.current,
        kind: "rain",
        left: randBetween(-2, 96),
        delay: randBetween(0, 1400),
        dur: randBetween(2200, 4200),
        size: randBetween(36, 84),
        rot: randBetween(-540, 540),
      }));
      setDrops((d) => [...d, ...next]);
      return true;
    },
    [chaos, reduced],
  );

  const peek = useCallback(() => {
    const drop: Drop = {
      id: ++idRef.current,
      kind: "peek",
      left: randBetween(6, 84),
      delay: 0,
      dur: 2800,
      size: randBetween(80, 120),
      rot: randBetween(-14, 14),
    };
    setDrops((d) => [...d, drop]);
  }, []);

  const setPreview = useCallback((id: string, dataUrl: string | null) => {
    let ok = true;
    setPreviews((prev) => {
      const next = { ...prev };
      if (dataUrl) next[id] = dataUrl;
      else delete next[id];
      ok = savePhotoPreviews(next);
      return next;
    });
    return ok;
  }, []);

  // unhinged mode: a bunny occasionally peeks in from the bottom edge
  useEffect(() => {
    if (chaos !== 2 || reduced || !introDone) return;
    let t: number;
    const loop = () => {
      t = window.setTimeout(() => {
        peek();
        loop();
      }, randInt(9000, 18000));
    };
    loop();
    return () => window.clearTimeout(t);
  }, [chaos, reduced, introDone, peek]);

  const value = useMemo<ChaosValue>(
    () => ({
      chaos,
      cycleChaos,
      sound,
      toggleSound,
      play,
      reduced,
      fxClass: fx ? `fx-${fx}` : undefined,
      pageFx,
      bunnyRain,
      peek,
      previews,
      setPreview,
      introDone,
      setIntroDone,
      editPhotos,
      setEditPhotos,
    }),
    [chaos, cycleChaos, sound, toggleSound, play, reduced, fx, pageFx, bunnyRain, peek, previews, setPreview, introDone, editPhotos],
  );

  return (
    <Ctx.Provider value={value}>
      <div data-chaos={chaos}>
        {children}
        <div aria-hidden className="pointer-events-none fixed inset-0 z-[60] overflow-hidden">
          {drops.map((d) =>
            d.kind === "rain" ? (
              <div
                key={d.id}
                className="absolute -top-28 animate-fall"
                style={
                  {
                    left: `${d.left}%`,
                    width: d.size,
                    animationDelay: `${d.delay}ms`,
                    "--fall-dur": `${d.dur}ms`,
                    "--rot": `${d.rot}deg`,
                  } as React.CSSProperties
                }
                onAnimationEnd={() => setDrops((all) => all.filter((x) => x.id !== d.id))}
              >
                <Bunny />
              </div>
            ) : (
              <div
                key={d.id}
                className="absolute -bottom-2 animate-peek"
                style={{ left: `${d.left}%`, width: d.size, "--rot": `${d.rot}deg` } as React.CSSProperties}
                onAnimationEnd={() => setDrops((all) => all.filter((x) => x.id !== d.id))}
              >
                <Bunny wiggle />
              </div>
            ),
          )}
        </div>
      </div>
    </Ctx.Provider>
  );
}
