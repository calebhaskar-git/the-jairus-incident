/**
 * Local persistence in this browser using IndexedDB.
 *  - "blobs": uploaded media files, stored as Blobs (never as data URLs)
 *  - "kv":    the overrides document (captions, text edits, slot list)
 * Nothing here ever leaves the device.
 */

const DB_NAME = "jairus-site";
const DB_VERSION = 1;
const BLOBS = "blobs";
const KV = "kv";
const OVERRIDES_KEY = "overrides";

export class StorageError extends Error {
  constructor(
    message: string,
    readonly kind: "quota" | "unavailable" | "unknown",
  ) {
    super(message);
    this.name = "StorageError";
  }
}

export function toStorageError(e: unknown): StorageError {
  if (e instanceof StorageError) return e;
  const name = e && typeof e === "object" && "name" in e ? String((e as { name: unknown }).name) : "";
  if (name === "QuotaExceededError" || name === "NS_ERROR_DOM_QUOTA_REACHED") {
    return new StorageError(
      "This browser is out of storage space for the site. Remove some videos or big files, or free up disk space, then try again.",
      "quota",
    );
  }
  if (name === "InvalidStateError" || name === "SecurityError") {
    return new StorageError(
      "This browser won't let the site save files (private/incognito windows often block it). Edits will only last until you close the tab.",
      "unavailable",
    );
  }
  const msg = e instanceof Error ? e.message : String(e);
  return new StorageError(`Couldn't save to this browser's storage (${msg}).`, "unknown");
}

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new StorageError("This browser doesn't support local storage for files (IndexedDB).", "unavailable"));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(BLOBS)) db.createObjectStore(BLOBS);
      if (!db.objectStoreNames.contains(KV)) db.createObjectStore(KV);
    };
    req.onsuccess = () => {
      const db = req.result;
      db.onversionchange = () => {
        db.close();
        dbPromise = null;
      };
      resolve(db);
    };
    req.onerror = () => reject(toStorageError(req.error));
    req.onblocked = () => reject(new StorageError("Close other tabs of this site and try again.", "unavailable"));
  }).catch((e: unknown) => {
    dbPromise = null;
    throw toStorageError(e);
  });
  return dbPromise;
}

function done(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onabort = () => reject(toStorageError(tx.error));
    tx.onerror = () => reject(toStorageError(tx.error));
  });
}

function request<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(toStorageError(req.error));
  });
}

export async function loadOverridesRaw(): Promise<unknown> {
  const db = await openDb();
  return request(db.transaction(KV, "readonly").objectStore(KV).get(OVERRIDES_KEY));
}

export async function saveOverrides(value: unknown): Promise<void> {
  const db = await openDb();
  const tx = db.transaction(KV, "readwrite");
  tx.objectStore(KV).put(value, OVERRIDES_KEY);
  await done(tx);
}

export async function putBlob(id: string, blob: Blob): Promise<void> {
  const db = await openDb();
  const tx = db.transaction(BLOBS, "readwrite");
  tx.objectStore(BLOBS).put(blob, id);
  await done(tx);
}

export async function getBlobs(ids: Iterable<string>): Promise<Map<string, Blob>> {
  const db = await openDb();
  const store = db.transaction(BLOBS, "readonly").objectStore(BLOBS);
  const out = new Map<string, Blob>();
  await Promise.all(
    [...ids].map(async (id) => {
      const b = await request<unknown>(store.get(id));
      if (b instanceof Blob) out.set(id, b);
    }),
  );
  return out;
}

export async function listBlobIds(): Promise<string[]> {
  const db = await openDb();
  const keys = await request(db.transaction(BLOBS, "readonly").objectStore(BLOBS).getAllKeys());
  return keys.map(String);
}

export async function deleteBlobs(ids: Iterable<string>): Promise<void> {
  const list = [...ids];
  if (!list.length) return;
  const db = await openDb();
  const tx = db.transaction(BLOBS, "readwrite");
  const store = tx.objectStore(BLOBS);
  list.forEach((id) => store.delete(id));
  await done(tx);
}

/** Replaces everything in one transaction — used by backup import + "reset everything". */
export async function replaceAll(overrides: unknown, blobs: Map<string, Blob>): Promise<void> {
  const db = await openDb();
  const tx = db.transaction([BLOBS, KV], "readwrite");
  const b = tx.objectStore(BLOBS);
  b.clear();
  blobs.forEach((blob, id) => b.put(blob, id));
  tx.objectStore(KV).put(overrides, OVERRIDES_KEY);
  await done(tx);
}

/** asks the browser not to auto-evict our storage; harmless if refused */
export async function requestPersistence(): Promise<boolean> {
  try {
    return (await navigator.storage?.persist?.()) ?? false;
  } catch {
    return false;
  }
}

export async function storageEstimate(): Promise<{ usage: number; quota: number } | null> {
  try {
    const e = await navigator.storage?.estimate?.();
    if (!e || e.usage === undefined || e.quota === undefined) return null;
    return { usage: e.usage, quota: e.quota };
  } catch {
    return null;
  }
}

export function newId(prefix: string): string {
  const rand =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  return `${prefix}-${rand}`;
}

/* ─── legacy: the first version kept small previews in localStorage ───────── */

const LEGACY_KEY = "jairus-photo-previews-v1";

export function readLegacyPreviews(): Record<string, string> {
  try {
    const raw = window.localStorage.getItem(LEGACY_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(parsed)) if (typeof v === "string" && v.startsWith("data:image/")) out[k] = v;
    return out;
  } catch {
    return {};
  }
}

export function clearLegacyPreviews() {
  try {
    window.localStorage.removeItem(LEGACY_KEY);
  } catch {
    /* ignore */
  }
}
