import { useRef, useState } from "react";

import { cn } from "@/lib/utils";
import { ChaosProvider, useChaos } from "./chaos-context";
import { Opening } from "./opening";
import { Btn } from "./primitives";
import { PressThings } from "./press-things";
import { CursorBuddy, Finale, Footer, Gallery, Letter, Lore } from "./sections-bottom";
import { Hero, Profile, Ticker, TopBar } from "./sections-top";

function Scrapbook() {
  const { fxClass, introDone, setIntroDone, editPhotos, setEditPhotos } = useChaos();
  const [introKey, setIntroKey] = useState(0);
  const mainRef = useRef<HTMLElement | null>(null);

  return (
    <>
      {!introDone && (
        <Opening
          key={introKey}
          onDone={() => {
            setIntroDone(true);
            requestAnimationFrame(() => mainRef.current?.focus({ preventScroll: true }));
          }}
        />
      )}
      <TopBar visible={introDone} />
      <main id="top" ref={mainRef} tabIndex={-1} inert={!introDone} className={cn("overflow-x-clip outline-none", fxClass)}>
        <Hero />
        <Ticker />
        <Profile />
        <PressThings />
        <Ticker tone="orange" tilt={2} reverse />
        <Gallery />
        <Lore />
        <Letter />
        <Finale
          onReplayIntro={() => {
            setIntroKey((k) => k + 1);
            setIntroDone(false);
          }}
        />
      </main>
      <Footer />
      <CursorBuddy />
      {editPhotos && (
        <div className="fixed bottom-4 left-1/2 z-40 -translate-x-1/2">
          <Btn tone="orange" onClick={() => setEditPhotos(false)}>done trying photos ✓</Btn>
        </div>
      )}
    </>
  );
}

export function Experience() {
  return (
    <ChaosProvider>
      <Scrapbook />
    </ChaosProvider>
  );
}
