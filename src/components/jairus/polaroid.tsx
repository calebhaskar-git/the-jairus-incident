import { ImagePlus, RotateCcw } from "lucide-react";
import { useState, type CSSProperties, type ChangeEvent } from "react";

import type { PhotoSlot } from "@/content/jairus";
import { fileToPreview } from "@/lib/photo-store";
import { cn } from "@/lib/utils";
import { useChaos } from "./chaos-context";
import { Bunny } from "./doodles";
import { Btn, btnVariants, Tape } from "./primitives";

export function usePhotoSrc(slot: PhotoSlot) {
  const { previews } = useChaos();
  const local = previews[slot.id];
  return { src: local ?? slot.src, isLocal: Boolean(local), isPlaceholder: !local && !slot.src };
}

export function PhotoPlaceholder({ slot }: { slot: PhotoSlot }) {
  return (
    <div className="bg-slot absolute inset-0 grid place-items-center p-3 text-center text-ink">
      <div className="flex flex-col items-center gap-1">
        <Bunny className="w-9 md:w-12" mood="wink" />
        <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em]">photo slot</span>
        <span className="font-display text-2xl font-extrabold leading-none md:text-4xl">{slot.label}</span>
        <span className="mt-0.5 -rotate-3 border-2 border-ink bg-paper px-2 py-0.5 font-marker text-xs md:text-sm">
          replace me
        </span>
      </div>
    </div>
  );
}

function SlotEditor({ slot, hasLocal }: { slot: PhotoSlot; hasLocal: boolean }) {
  const { setPreview, play } = useChaos();
  const [status, setStatus] = useState<string | null>(null);

  const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setStatus("loading…");
    try {
      const url = await fileToPreview(file);
      const remembered = setPreview(slot.id, url);
      setStatus(remembered ? null : "showing it, but it's too big to remember after refresh");
      play("pop");
    } catch {
      setStatus("couldn't read that one — try a JPG or PNG");
    }
  };

  return (
    <div className="absolute inset-x-1.5 bottom-1.5 z-30 flex flex-wrap items-center gap-1.5 rounded-lg border-2 border-ink bg-paper/95 p-1.5 text-ink">
      <label
        className={cn(
          btnVariants({ tone: "lime", size: "sm" }),
          "cursor-pointer focus-within:outline-[3px] focus-within:outline-offset-2 focus-within:outline-orange",
        )}
      >
        <ImagePlus className="size-3.5" aria-hidden />
        {hasLocal ? "swap" : "add photo"}
        <input
          type="file"
          accept="image/*"
          className="sr-only"
          aria-label={`Choose a photo for slot ${slot.label}`}
          onChange={onFile}
        />
      </label>
      {hasLocal && (
        <Btn tone="paper" size="sm" onClick={() => setPreview(slot.id, null)} aria-label={`Reset slot ${slot.label}`}>
          <RotateCcw className="size-3.5" aria-hidden />
          reset
        </Btn>
      )}
      <span className="font-mono text-[10px] font-bold uppercase">slot {slot.label}</span>
      {status && (
        <p role="status" className="w-full font-mono text-[10px] leading-tight">
          {status}
        </p>
      )}
    </div>
  );
}

export function Polaroid({
  slot,
  className,
  onOpen,
  showCaption = true,
}: {
  slot: PhotoSlot;
  className?: string;
  onOpen?: (() => void) | undefined;
  showCaption?: boolean;
}) {
  const { editPhotos } = useChaos();
  const { src, isLocal } = usePhotoSrc(slot);

  return (
    <figure
      className={cn(
        "tilted tilted-hover relative flex h-full flex-col border-[3px] border-ink bg-paper p-2 pb-2.5 text-ink shadow-hard md:p-2.5 md:pb-3",
        className,
      )}
      style={{ "--r": `${slot.tilt ?? 0}deg` } as CSSProperties}
    >
      <Tape tone={slot.tape} />
      <div className="relative min-h-0 flex-1 overflow-hidden border-2 border-ink bg-paper-dim">
        {src ? (
          <img src={src} alt={slot.alt} className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
        ) : (
          <PhotoPlaceholder slot={slot} />
        )}
        {isLocal && (
          <span className="absolute left-1.5 top-1.5 z-20 rounded-full border-2 border-ink bg-orange px-2 py-0.5 font-mono text-[9px] font-bold uppercase">
            preview · this device
          </span>
        )}
        {onOpen && !editPhotos && (
          <button
            type="button"
            onClick={onOpen}
            aria-label={`Open photo: ${slot.caption}`}
            className="absolute inset-0 z-10 cursor-zoom-in"
          />
        )}
        {editPhotos && <SlotEditor slot={slot} hasLocal={isLocal} />}
      </div>
      {showCaption && (
        <figcaption className="pt-2 font-marker text-sm leading-tight md:text-base">{slot.caption}</figcaption>
      )}
    </figure>
  );
}
