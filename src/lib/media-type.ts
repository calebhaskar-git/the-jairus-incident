/** Media types the scrapbook can show, and how we recognise them. Pure + testable. */

export type MediaType = "image" | "gif" | "video";

/** what the user can pick in the editor ("auto" = detect from the file / link) */
export type MediaTypeChoice = MediaType | "auto";

export const SUPPORTED_MIME: Record<string, MediaType> = {
  "image/jpeg": "image",
  "image/jpg": "image",
  "image/pjpeg": "image",
  "image/png": "image",
  "image/webp": "image",
  "image/gif": "gif",
  "video/mp4": "video",
  "video/webm": "video",
};

const EXT_TYPE: Record<string, MediaType> = {
  jpg: "image",
  jpeg: "image",
  png: "image",
  webp: "image",
  gif: "gif",
  mp4: "video",
  m4v: "video",
  webm: "video",
};

const EXT_MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  mp4: "video/mp4",
  m4v: "video/mp4",
  webm: "video/webm",
};

/** the value for <input type="file" accept="…"> */
export const ACCEPT_ATTR = ".jpg,.jpeg,.png,.webp,.gif,.mp4,.webm,image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm";

/** 150 MB per file — big enough for short phone videos, small enough to keep browsers happy */
export const MAX_FILE_BYTES = 150 * 1024 * 1024;

export function extensionOf(nameOrUrl: string): string {
  const clean = nameOrUrl.split(/[?#]/)[0] ?? "";
  const last = clean.split("/").pop() ?? "";
  const dot = last.lastIndexOf(".");
  return dot > 0 ? last.slice(dot + 1).toLowerCase() : "";
}

/** Detects the media type of a picked file. Returns null when we can't show it. */
export function detectFileType(file: { type: string; name: string }): MediaType | null {
  const mime = file.type.toLowerCase();
  if (mime && SUPPORTED_MIME[mime]) return SUPPORTED_MIME[mime];
  if (mime && mime !== "application/octet-stream") return null;
  // some systems hand over files with no mime type — fall back to the extension
  return EXT_TYPE[extensionOf(file.name)] ?? null;
}

/** Best-guess mime for a file, used when the browser didn't give us one. */
export function mimeFor(file: { type: string; name: string }): string {
  const mime = file.type.toLowerCase();
  if (mime && SUPPORTED_MIME[mime]) return mime === "image/jpg" || mime === "image/pjpeg" ? "image/jpeg" : mime;
  return EXT_MIME[extensionOf(file.name)] ?? "application/octet-stream";
}

export function extensionForMime(mime: string): string {
  switch (mime) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/gif":
      return "gif";
    case "video/mp4":
      return "mp4";
    case "video/webm":
      return "webm";
    default:
      return "bin";
  }
}

/** Detects the type from a link's file extension. null = can't tell, ask the user. */
export function detectUrlType(url: string): MediaType | null {
  const trimmed = url.trim();
  const dataMatch = /^data:([^;,]+)/i.exec(trimmed);
  if (dataMatch) return SUPPORTED_MIME[(dataMatch[1] ?? "").toLowerCase()] ?? null;
  return EXT_TYPE[extensionOf(trimmed)] ?? null;
}

/**
 * Checks a pasted link. Allows http(s) links and site-relative paths like
 * "/media/beach.jpg" (files you put in the public/ folder).
 */
export function validateMediaUrl(url: string): { ok: true; url: string } | { ok: false; reason: string } {
  const trimmed = url.trim();
  if (!trimmed) return { ok: false, reason: "Paste a link first." };
  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) return { ok: true, url: trimmed };
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      return { ok: false, reason: "Only http(s) links or paths starting with / are supported." };
    }
    return { ok: true, url: parsed.toString() };
  } catch {
    return { ok: false, reason: "That doesn't look like a link. It should start with https://" };
  }
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`;
  return `${(n / 1024 / 1024 / 1024).toFixed(2)} GB`;
}
