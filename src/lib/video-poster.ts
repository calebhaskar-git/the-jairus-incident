/** Browser-only helpers for videos. Call from event handlers only. */

export function canPlayVideo(mime: string): boolean {
  try {
    return document.createElement("video").canPlayType(mime) !== "";
  } catch {
    return true;
  }
}

/**
 * Grabs a still frame from a video file to use as its poster (shown before the
 * video plays, and when motion is reduced). Resolves null if the browser can't.
 */
export function makeVideoPoster(blob: Blob, maxSide = 900): Promise<Blob | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(blob);
    const video = document.createElement("video");
    let settled = false;
    const finish = (out: Blob | null) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      video.removeAttribute("src");
      video.load();
      URL.revokeObjectURL(url);
      resolve(out);
    };
    const timer = window.setTimeout(() => finish(null), 6000);
    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";
    video.onerror = () => finish(null);
    video.onloadeddata = () => {
      const t = Number.isFinite(video.duration) ? Math.min(0.6, video.duration / 3) : 0;
      if (t > 0) video.currentTime = t;
      else capture();
    };
    video.onseeked = () => capture();
    function capture() {
      const w0 = video.videoWidth;
      const h0 = video.videoHeight;
      if (!w0 || !h0) return finish(null);
      const scale = Math.min(1, maxSide / Math.max(w0, h0));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(w0 * scale);
      canvas.height = Math.round(h0 * scale);
      const ctx = canvas.getContext("2d");
      if (!ctx) return finish(null);
      try {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((b) => finish(b), "image/jpeg", 0.82);
      } catch {
        finish(null);
      }
    }
    video.src = url;
  });
}
