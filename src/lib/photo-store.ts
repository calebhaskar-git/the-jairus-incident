/**
 * On-device photo previews. These stay in this browser only (localStorage) —
 * to make a photo show for everyone, set `src` in src/content/jairus.ts.
 */

const KEY = "jairus-photo-previews-v1";

export function loadPhotoPreviews(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(KEY) ?? "{}");
    return parsed && typeof parsed === "object" ? (parsed as Record<string, string>) : {};
  } catch {
    return {};
  }
}

/** returns false when the browser refused to store (usually: too many big photos) */
export function savePhotoPreviews(map: Record<string, string>): boolean {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(map));
    return true;
  } catch {
    return false;
  }
}

/** shrink a picked image so previews stay small enough to remember */
export async function fileToPreview(file: File, maxSide = 1100): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("unreadable image"));
      el.src = url;
    });
    const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.max(1, Math.round(img.naturalWidth * scale));
    const h = Math.max(1, Math.round(img.naturalHeight * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const c = canvas.getContext("2d");
    if (!c) throw new Error("no canvas");
    c.drawImage(img, 0, 0, w, h);
    return canvas.toDataURL("image/jpeg", 0.8);
  } finally {
    URL.revokeObjectURL(url);
  }
}
