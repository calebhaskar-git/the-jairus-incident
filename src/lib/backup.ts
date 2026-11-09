/**
 * Backup = a ZIP with manifest.json (all text + slot settings) and a media/ folder
 * holding the uploaded files. Built entirely in the browser; nothing is uploaded.
 */
import { strFromU8, strToU8, unzipSync, zipSync, type Zippable } from "fflate";

import { SUPPORTED_MIME, extensionForMime } from "./media-type";
import { parseOverrides, referencedBlobIds, type Overrides } from "./site-content";

export const BACKUP_APP = "jairus-site";

export type BackupManifest = {
  app: typeof BACKUP_APP;
  version: 1;
  exportedAt: string;
  overrides: Overrides;
  files: { id: string; path: string; mime: string }[];
};

export function buildManifest(overrides: Overrides, blobs: Map<string, Blob>, now = new Date()): BackupManifest {
  const files = [...referencedBlobIds(overrides)]
    .filter((id) => blobs.has(id))
    .map((id) => {
      const mime = blobs.get(id)?.type || "application/octet-stream";
      return { id, path: `media/${safeName(id)}.${extensionForMime(mime)}`, mime };
    });
  return { app: BACKUP_APP, version: 1, exportedAt: now.toISOString(), overrides, files };
}

function safeName(id: string) {
  return id.replace(/[^a-zA-Z0-9_-]/g, "_");
}

export async function createBackupZip(overrides: Overrides, blobs: Map<string, Blob>): Promise<Blob> {
  const manifest = buildManifest(overrides, blobs);
  const entries: Zippable = { "manifest.json": [strToU8(JSON.stringify(manifest, null, 2)), { level: 6 }] };
  for (const f of manifest.files) {
    const blob = blobs.get(f.id);
    if (!blob) continue;
    // media is already compressed — store it as-is (level 0) so exporting stays fast
    entries[f.path] = [new Uint8Array(await blob.arrayBuffer()), { level: 0 }];
  }
  const zipped = zipSync(entries);
  return new Blob([zipped as Uint8Array<ArrayBuffer>], { type: "application/zip" });
}

export class BackupError extends Error {
  override name = "BackupError";
}

/** Reads + validates a backup ZIP. Throws BackupError with a friendly message. */
export async function readBackupZip(file: Blob): Promise<{ overrides: Overrides; blobs: Map<string, Blob> }> {
  let entries: Record<string, Uint8Array>;
  try {
    entries = unzipSync(new Uint8Array(await file.arrayBuffer()));
  } catch {
    throw new BackupError("That file isn't a ZIP backup from this site.");
  }
  const manifestBytes = entries["manifest.json"];
  if (!manifestBytes) throw new BackupError("This ZIP has no manifest.json, so it isn't a backup from this site.");

  let raw: unknown;
  try {
    raw = JSON.parse(strFromU8(manifestBytes));
  } catch {
    throw new BackupError("The backup's manifest.json is damaged.");
  }
  const m = raw as Partial<BackupManifest> | null;
  if (!m || m.app !== BACKUP_APP || m.version !== 1 || !Array.isArray(m.files)) {
    throw new BackupError("This backup is from a different app or a newer version.");
  }

  let overrides: Overrides;
  try {
    overrides = parseOverrides(m.overrides);
  } catch {
    throw new BackupError("The backup's settings are damaged or in an unexpected format.");
  }

  const blobs = new Map<string, Blob>();
  for (const f of m.files) {
    if (!f || typeof f.id !== "string" || typeof f.path !== "string" || typeof f.mime !== "string") continue;
    if (!SUPPORTED_MIME[f.mime]) continue;
    const bytes = entries[f.path];
    if (!bytes) continue;
    blobs.set(f.id, new Blob([bytes as Uint8Array<ArrayBuffer>], { type: f.mime }));
  }

  const missing = [...referencedBlobIds(overrides)].filter((id) => !blobs.has(id));
  if (missing.length) {
    throw new BackupError(`The backup is missing ${missing.length} media file(s). Export it again from the original browser.`);
  }
  return { overrides, blobs };
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
