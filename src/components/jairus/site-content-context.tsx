import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import { createBackupZip, downloadBlob, readBackupZip } from "@/lib/backup";
import {
  StorageError,
  clearLegacyPreviews,
  deleteBlobs,
  getBlobs,
  listBlobIds,
  loadOverridesRaw,
  newId,
  putBlob,
  readLegacyPreviews,
  replaceAll,
  requestPersistence,
  saveOverrides,
  toStorageError,
} from "@/lib/media-db";
import {
  MAX_FILE_BYTES,
  detectFileType,
  detectUrlType,
  formatBytes,
  mimeFor,
  validateMediaUrl,
  type MediaTypeChoice,
} from "@/lib/media-type";
import {
  DEFAULT_SLOT_IDS,
  addCustomSlot as addCustom,
  emptyOverrides,
  parseOverrides,
  referencedBlobIds,
  removeCustomSlot as removeCustom,
  resetSlot as resetSlotPure,
  resetText as resetTextPure,
  resolveContent,
  setText,
  updateSlot,
  type MediaRef,
  type Overrides,
  type ResolvedContent,
  type SlotSize,
  type TextEdits,
  type TextSection,
} from "@/lib/site-content";
import { canPlayVideo, makeVideoPoster } from "@/lib/video-poster";

export type Result = { ok: boolean; message: string };
export type EditorTab = "media" | "words" | "lore" | "backup";

type SiteValue = ResolvedContent & {
  overrides: Overrides;
  ready: boolean;
  /** set when this browser won't let us save (private mode etc.) */
  storageProblem: string | null;
  editor: { open: boolean; tab: EditorTab; focus: string | null };
  openEditor: (tab?: EditorTab, focusSlotId?: string) => void;
  closeEditor: () => void;
  setEditorTab: (tab: EditorTab) => void;
  uploadMedia: (slotId: string, file: File) => Promise<Result>;
  linkMedia: (slotId: string, url: string, choice: MediaTypeChoice) => Promise<Result>;
  updateSlotText: (slotId: string, patch: { caption?: string; alt?: string; size?: SlotSize }) => Promise<Result>;
  resetSlot: (slotId: string) => Promise<Result>;
  addSlot: () => Promise<Result & { id?: string }>;
  removeSlot: (slotId: string) => Promise<Result>;
  saveText: <K extends TextSection>(key: K, value: NonNullable<TextEdits[K]>) => Promise<Result>;
  resetText: (key: TextSection) => Promise<Result>;
  exportBackup: () => Promise<Result>;
  importBackup: (file: File) => Promise<Result>;
  resetEverything: () => Promise<Result>;
};

const Ctx = createContext<SiteValue | null>(null);

export function useSite() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useSite must be used inside <SiteContentProvider>");
  return v;
}

const UNSUPPORTED =
  "isn't a supported format. Use JPG, PNG, WebP, GIF, MP4 or WebM. (iPhone HEIC/MOV? Export or share it as JPG/MP4 first.)";

export function SiteContentProvider({ children }: { children: ReactNode }) {
  const [overrides, setOverrides] = useState<Overrides>(emptyOverrides);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [ready, setReady] = useState(false);
  const [storageProblem, setStorageProblem] = useState<string | null>(null);
  const [editor, setEditor] = useState<SiteValue["editor"]>({ open: false, tab: "media", focus: null });

  const overridesRef = useRef(overrides);
  const blobsRef = useRef(new Map<string, Blob>());
  const urlsRef = useRef(new Map<string, string>());
  const storageOkRef = useRef(true);
  const askedPersist = useRef(false);

  /* ─── in-memory blob + object URL bookkeeping ─── */

  const addBlob = useCallback((id: string, blob: Blob) => {
    blobsRef.current.set(id, blob);
    const old = urlsRef.current.get(id);
    if (old) URL.revokeObjectURL(old);
    const url = URL.createObjectURL(blob);
    urlsRef.current.set(id, url);
    setUrls((u) => ({ ...u, [id]: url }));
  }, []);

  const replaceBlobs = useCallback((blobs: Map<string, Blob>) => {
    urlsRef.current.forEach((u) => URL.revokeObjectURL(u));
    urlsRef.current = new Map();
    blobsRef.current = new Map(blobs);
    const next: Record<string, string> = {};
    blobs.forEach((b, id) => {
      const url = URL.createObjectURL(b);
      urlsRef.current.set(id, url);
      next[id] = url;
    });
    setUrls(next);
  }, []);

  useEffect(() => () => urlsRef.current.forEach((u) => URL.revokeObjectURL(u)), []);

  /* ─── initial load from this browser ─── */

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      let o = emptyOverrides();
      let blobs = new Map<string, Blob>();
      try {
        const raw = await loadOverridesRaw();
        if (raw) {
          try {
            o = parseOverrides(raw);
          } catch {
            console.warn("Saved site edits were in an unexpected format and were ignored.");
          }
        }
        blobs = await getBlobs(referencedBlobIds(o));

        // one-time move of the older localStorage photo previews into IndexedDB
        const legacy = readLegacyPreviews();
        const legacyIds = Object.keys(legacy);
        if (legacyIds.length) {
          for (const slotId of legacyIds) {
            if (!DEFAULT_SLOT_IDS.has(slotId) || o.slots[slotId]?.media) continue;
            const blob = await (await fetch(legacy[slotId]!)).blob();
            const id = newId("media");
            await putBlob(id, blob);
            blobs.set(id, blob);
            o = updateSlot(o, slotId, {
              media: { kind: "blob", blobId: id, type: "image", mime: blob.type, name: "earlier preview", size: blob.size },
            });
          }
          await saveOverrides(o);
          clearLegacyPreviews();
        }

        // tidy up files nothing points at any more
        const referenced = referencedBlobIds(o);
        const orphans = (await listBlobIds()).filter((id) => !referenced.has(id));
        if (orphans.length) await deleteBlobs(orphans);
      } catch (e) {
        storageOkRef.current = false;
        if (!cancelled) setStorageProblem(toStorageError(e).message);
      }
      if (cancelled) return;
      overridesRef.current = o;
      setOverrides(o);
      replaceBlobs(blobs);
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [replaceBlobs]);

  /* ─── committing changes ─── */

  const commit = useCallback(async (next: Overrides, okMessage: string): Promise<Result> => {
    overridesRef.current = next;
    setOverrides(next);

    // forget files nothing references any more
    const referenced = referencedBlobIds(next);
    const unused = [...blobsRef.current.keys()].filter((id) => !referenced.has(id));
    unused.forEach((id) => {
      blobsRef.current.delete(id);
      const u = urlsRef.current.get(id);
      if (u) URL.revokeObjectURL(u);
      urlsRef.current.delete(id);
    });
    if (unused.length) setUrls((u) => Object.fromEntries(Object.entries(u).filter(([id]) => referenced.has(id))));

    if (!storageOkRef.current) {
      return { ok: true, message: `${okMessage} (Only until you close this tab — this browser won't let the site save.)` };
    }
    try {
      await saveOverrides(next);
      if (unused.length) await deleteBlobs(unused);
      return { ok: true, message: okMessage };
    } catch (e) {
      return { ok: false, message: toStorageError(e).message };
    }
  }, []);

  const storeBlob = useCallback(async (id: string, blob: Blob) => {
    if (storageOkRef.current) await putBlob(id, blob);
    addBlob(id, blob);
  }, [addBlob]);

  const uploadMedia = useCallback(
    async (slotId: string, file: File): Promise<Result> => {
      const type = detectFileType(file);
      if (!type) return { ok: false, message: `“${file.name}” ${UNSUPPORTED}` };
      if (file.size > MAX_FILE_BYTES) {
        return { ok: false, message: `“${file.name}” is ${formatBytes(file.size)}. The limit is ${formatBytes(MAX_FILE_BYTES)} per file — try a shorter or smaller version.` };
      }
      const mime = mimeFor(file);
      if (type === "video" && !canPlayVideo(mime)) {
        return { ok: false, message: `This browser can't play ${mime} videos. Try an MP4 (H.264) file.` };
      }
      const blob = file.type === mime ? file : new Blob([file], { type: mime });
      const id = newId("media");
      let posterId: string | undefined;
      try {
        await storeBlob(id, blob);
        if (type === "video") {
          const poster = await makeVideoPoster(blob);
          if (poster) {
            posterId = `${id}-poster`;
            await storeBlob(posterId, poster);
          }
        }
      } catch (e) {
        blobsRef.current.delete(id);
        return { ok: false, message: toStorageError(e).message };
      }
      if (!askedPersist.current) {
        askedPersist.current = true;
        void requestPersistence();
      }
      const ref: MediaRef = { kind: "blob", blobId: id, type, mime, name: file.name, size: file.size, posterId };
      return commit(updateSlot(overridesRef.current, slotId, { media: ref }), `Saved “${file.name}” (${formatBytes(file.size)}, ${type}) in this browser.`);
    },
    [commit, storeBlob],
  );

  const linkMedia = useCallback(
    async (slotId: string, url: string, choice: MediaTypeChoice): Promise<Result> => {
      const v = validateMediaUrl(url);
      if (!v.ok) return { ok: false, message: v.reason };
      const type = choice === "auto" ? detectUrlType(v.url) : choice;
      if (!type) {
        return { ok: false, message: "Couldn't tell from the link whether it's a photo, GIF or video. Pick the type from the list and try again." };
      }
      if (type === "video" && !canPlayVideo(detectUrlType(v.url) === "video" && v.url.toLowerCase().includes(".webm") ? "video/webm" : "video/mp4")) {
        return { ok: false, message: "This browser can't play that kind of video." };
      }
      return commit(updateSlot(overridesRef.current, slotId, { media: { kind: "url", url: v.url, type } }), `Linked a ${type}. If it doesn't appear, the other website may block embedding.`);
    },
    [commit],
  );

  const updateSlotText = useCallback(
    (slotId: string, patch: { caption?: string; alt?: string; size?: SlotSize }) =>
      commit(updateSlot(overridesRef.current, slotId, patch), "Saved."),
    [commit],
  );

  const resetSlot = useCallback(
    (slotId: string) => commit(resetSlotPure(overridesRef.current, slotId), "Back to the original."),
    [commit],
  );

  const addSlot = useCallback(async () => {
    const id = newId("custom");
    const r = await commit(addCustom(overridesRef.current, id), "Added a new gallery slot at the end of the scrapbook.");
    return { ...r, id };
  }, [commit]);

  const removeSlot = useCallback(
    (slotId: string) => commit(removeCustom(overridesRef.current, slotId), "Slot removed."),
    [commit],
  );

  const saveText = useCallback(
    <K extends TextSection>(key: K, value: NonNullable<TextEdits[K]>) =>
      commit(setText(overridesRef.current, key, value), "Saved in this browser."),
    [commit],
  );

  const resetText = useCallback(
    (key: TextSection) => commit(resetTextPure(overridesRef.current, key), "Back to the original words."),
    [commit],
  );

  const exportBackup = useCallback(async (): Promise<Result> => {
    try {
      const zip = await createBackupZip(overridesRef.current, blobsRef.current);
      const date = new Date().toISOString().slice(0, 10);
      downloadBlob(zip, `jairus-site-backup-${date}.zip`);
      return { ok: true, message: `Backup downloaded (${formatBytes(zip.size)}).` };
    } catch (e) {
      return { ok: false, message: `Couldn't build the backup: ${e instanceof Error ? e.message : String(e)}` };
    }
  }, []);

  const swapAll = useCallback(
    async (o: Overrides, blobs: Map<string, Blob>, okMessage: string): Promise<Result> => {
      try {
        if (storageOkRef.current) await replaceAll(o, blobs);
      } catch (e) {
        return { ok: false, message: toStorageError(e).message };
      }
      overridesRef.current = o;
      setOverrides(o);
      replaceBlobs(blobs);
      return { ok: true, message: okMessage };
    },
    [replaceBlobs],
  );

  const importBackup = useCallback(
    async (file: File): Promise<Result> => {
      try {
        const { overrides: o, blobs } = await readBackupZip(file);
        return swapAll(o, blobs, `Backup restored: ${blobs.size} media file(s) and all text.`);
      } catch (e) {
        if (e instanceof StorageError) return { ok: false, message: e.message };
        return { ok: false, message: e instanceof Error ? e.message : "Couldn't read that backup." };
      }
    },
    [swapAll],
  );

  const resetEverything = useCallback(
    () => swapAll(emptyOverrides(), new Map(), "Everything is back to the original site."),
    [swapAll],
  );

  const openEditor = useCallback((tab: EditorTab = "media", focusSlotId?: string) => {
    setEditor({ open: true, tab, focus: focusSlotId ?? null });
  }, []);
  const closeEditor = useCallback(() => setEditor((e) => ({ ...e, open: false, focus: null })), []);
  const setEditorTab = useCallback((tab: EditorTab) => setEditor((e) => ({ ...e, tab, focus: null })), []);

  const resolved = useMemo(() => resolveContent(overrides, (id) => urls[id]), [overrides, urls]);

  const value = useMemo<SiteValue>(
    () => ({
      ...resolved,
      overrides,
      ready,
      storageProblem,
      editor,
      openEditor,
      closeEditor,
      setEditorTab,
      uploadMedia,
      linkMedia,
      updateSlotText,
      resetSlot,
      addSlot,
      removeSlot,
      saveText,
      resetText,
      exportBackup,
      importBackup,
      resetEverything,
    }),
    [resolved, overrides, ready, storageProblem, editor, openEditor, closeEditor, setEditorTab, uploadMedia, linkMedia, updateSlotText, resetSlot, addSlot, removeSlot, saveText, resetText, exportBackup, importBackup, resetEverything],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
