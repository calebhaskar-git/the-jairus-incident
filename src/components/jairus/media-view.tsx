import { useEffect, useRef, useState } from "react";

import type { ResolvedMedia } from "@/lib/site-content";
import { cn } from "@/lib/utils";

/**
 * Renders a slot's media: photos and GIFs as <img> (GIFs keep animating),
 * videos as muted, looping, inline video with a poster. With reduced motion,
 * videos don't autoplay and show controls instead.
 */
export function MediaView({
  media,
  alt,
  fit = "cover",
  reduced = false,
  controls = false,
  className,
  onFail,
}: {
  media: ResolvedMedia;
  alt: string;
  fit?: "cover" | "contain";
  reduced?: boolean;
  controls?: boolean;
  className?: string;
  onFail?: (() => void) | undefined;
}) {
  const [failed, setFailed] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fitClass = fit === "cover" ? "object-cover" : "object-contain";

  useEffect(() => setFailed(false), [media.src]);

  // React doesn't reliably reflect `muted` as an attribute, and browsers only
  // autoplay muted video — so set it on the element and nudge play().
  useEffect(() => {
    const v = videoRef.current;
    if (!v || media.type !== "video") return;
    v.muted = true;
    v.defaultMuted = true;
    if (!reduced) v.play().catch(() => undefined);
    else v.pause();
  }, [media.src, media.type, reduced]);

  if (failed) {
    return (
      <div className={cn("absolute inset-0 grid place-items-center bg-paper-dim p-3 text-center", className)} role="img" aria-label={alt}>
        <span className="font-mono text-[10px] font-bold uppercase leading-tight tracking-wider text-ink-soft">
          couldn't load this {media.type === "video" ? "video" : "image"}
        </span>
      </div>
    );
  }

  if (media.type === "video") {
    return (
      <video
        ref={videoRef}
        key={media.src}
        src={media.src}
        poster={media.poster}
        aria-label={alt}
        muted
        loop
        playsInline
        autoPlay={!reduced}
        controls={controls || reduced}
        preload="metadata"
        onError={() => {
          setFailed(true);
          onFail?.();
        }}
        className={cn("absolute inset-0 h-full w-full bg-ink", fitClass, className)}
      />
    );
  }

  return (
    <img
      key={media.src}
      src={media.src}
      alt={alt}
      loading="lazy"
      decoding="async"
      onError={() => {
        setFailed(true);
        onFail?.();
      }}
      className={cn("absolute inset-0 h-full w-full", fitClass, className)}
    />
  );
}
