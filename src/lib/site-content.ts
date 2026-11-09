/**
 * The editable content model. The ORIGINAL content lives in src/content/jairus.ts;
 * anything changed in the Media Control Room is stored as "overrides" on top of it.
 * Everything here is pure (no browser APIs) so it can be unit-tested.
 */
import { z } from "zod";

import {
  HERO_PHOTOS,
  LETTER,
  LORE,
  MUGSHOT,
  PHOTOS,
  SERIOUS_MESSAGE,
  SITE,
  type LoreItem,
  type PhotoSlot,
} from "@/content/jairus";
import { detectUrlType, type MediaType } from "./media-type";

/* ─── types ──────────────────────────────────────────────────────────────── */

export type SlotSize = NonNullable<PhotoSlot["size"]>;
export type TapeTone = NonNullable<PhotoSlot["tape"]>;

/** media picked in the editor: a file stored in this browser, or a link */
export type MediaRef =
  | { kind: "blob"; blobId: string; type: MediaType; mime: string; name: string; size: number; posterId?: string | undefined }
  | { kind: "url"; url: string; type: MediaType };

export type SlotEdit = { caption?: string | undefined; alt?: string | undefined; media?: MediaRef | undefined };

export type CustomSlot = {
  id: string;
  label: string;
  caption: string;
  alt: string;
  size: SlotSize;
  tilt: number;
  tape: TapeTone;
  media?: MediaRef | undefined;
};

export type SiteText = { fullName: string; firstName: string; nicknames: string[]; from: string };
export type SeriousText = { title: string; body: string };
export type LetterText = { greeting: string; paragraphs: string[]; signoff: string; from: string };

export type TextEdits = {
  site?: SiteText | undefined;
  serious?: SeriousText | undefined;
  letter?: LetterText | undefined;
  lore?: LoreItem[] | undefined;
};
export type TextSection = keyof TextEdits;

export type Overrides = {
  version: 1;
  slots: Record<string, SlotEdit>;
  custom: CustomSlot[];
  text: TextEdits;
};

export type ResolvedMedia = {
  type: MediaType;
  src: string;
  poster?: string | undefined;
  /** where it came from: the source code, a file in this browser, or a pasted link */
  origin: "original" | "device" | "link";
};

export type ResolvedSlot = {
  id: string;
  label: string;
  alt: string;
  caption: string;
  size: SlotSize;
  tilt: number;
  tape: TapeTone;
  media: ResolvedMedia | null;
  custom: boolean;
  /** has any local edit (caption, alt or media) */
  edited: boolean;
  /** a stored file is referenced but couldn't be loaded */
  missing: boolean;
};

export type ResolvedContent = {
  site: SiteText & { showPhotoHelp: boolean };
  serious: SeriousText;
  letter: LetterText;
  lore: LoreItem[];
  hero: ResolvedSlot[];
  mugshot: ResolvedSlot;
  gallery: ResolvedSlot[];
};

/* ─── defaults ───────────────────────────────────────────────────────────── */

export const DEFAULT_TEXT = {
  site: { fullName: SITE.fullName, firstName: SITE.firstName, nicknames: [...SITE.nicknames], from: SITE.from },
  serious: { ...SERIOUS_MESSAGE },
  letter: { ...LETTER, paragraphs: [...LETTER.paragraphs] },
  lore: LORE.map((l) => ({ ...l })),
} satisfies Required<{ [K in TextSection]: NonNullable<TextEdits[K]> }>;

export const DEFAULT_SLOTS: PhotoSlot[] = [...HERO_PHOTOS, MUGSHOT, ...PHOTOS];
export const DEFAULT_SLOT_IDS = new Set(DEFAULT_SLOTS.map((s) => s.id));

export function emptyOverrides(): Overrides {
  return { version: 1, slots: {}, custom: [], text: {} };
}

/* ─── text ───────────────────────────────────────────────────────────────── */

function clean(list: string[]): string[] {
  return list.map((s) => s.trim()).filter(Boolean);
}

export function resolveText(text: TextEdits) {
  const siteEdit = text.site ?? DEFAULT_TEXT.site;
  const firstName = siteEdit.firstName.trim() || DEFAULT_TEXT.site.firstName;
  const nicknames = clean(siteEdit.nicknames);
  const site = {
    fullName: siteEdit.fullName.trim() || DEFAULT_TEXT.site.fullName,
    firstName,
    // there must always be at least one name to shout at him
    nicknames: nicknames.length ? nicknames : [firstName],
    from: siteEdit.from.trim() || DEFAULT_TEXT.site.from,
    showPhotoHelp: SITE.showPhotoHelp,
  };
  const letterEdit = text.letter ?? DEFAULT_TEXT.letter;
  const letter = { ...letterEdit, paragraphs: clean(letterEdit.paragraphs) };
  return {
    site,
    serious: text.serious ?? DEFAULT_TEXT.serious,
    letter,
    lore: text.lore ?? DEFAULT_TEXT.lore,
  };
}

/* ─── slots ──────────────────────────────────────────────────────────────── */

/** turns a stored file id into a usable URL (object URL) — provided by the browser layer */
export type BlobUrlLookup = (blobId: string) => string | undefined;

function resolveRef(ref: MediaRef, urlFor: BlobUrlLookup): ResolvedMedia | null {
  if (ref.kind === "url") return { type: ref.type, src: ref.url, origin: "link" };
  const src = urlFor(ref.blobId);
  if (!src) return null;
  return { type: ref.type, src, poster: ref.posterId ? urlFor(ref.posterId) : undefined, origin: "device" };
}

function originalMedia(slot: PhotoSlot): ResolvedMedia | null {
  if (!slot.src) return null;
  return { type: slot.type ?? detectUrlType(slot.src) ?? "image", src: slot.src, poster: slot.poster, origin: "original" };
}

export function resolveSlot(slot: PhotoSlot, edit: SlotEdit | undefined, urlFor: BlobUrlLookup): ResolvedSlot {
  const fromEdit = edit?.media ? resolveRef(edit.media, urlFor) : null;
  return {
    id: slot.id,
    label: slot.label,
    alt: edit?.alt ?? slot.alt,
    caption: edit?.caption ?? slot.caption,
    size: slot.size ?? "sm",
    tilt: slot.tilt ?? 0,
    tape: slot.tape ?? "lime",
    media: edit?.media ? fromEdit : originalMedia(slot),
    custom: false,
    edited: Boolean(edit && (edit.media || edit.alt !== undefined || edit.caption !== undefined)),
    missing: Boolean(edit?.media && !fromEdit && edit.media.kind === "blob"),
  };
}

function resolveCustom(c: CustomSlot, urlFor: BlobUrlLookup): ResolvedSlot {
  const media = c.media ? resolveRef(c.media, urlFor) : null;
  return {
    id: c.id,
    label: c.label,
    alt: c.alt,
    caption: c.caption,
    size: c.size,
    tilt: c.tilt,
    tape: c.tape,
    media,
    custom: true,
    edited: true,
    missing: Boolean(c.media && !media && c.media.kind === "blob"),
  };
}

export function resolveContent(o: Overrides, urlFor: BlobUrlLookup): ResolvedContent {
  const r = (s: PhotoSlot) => resolveSlot(s, o.slots[s.id], urlFor);
  return {
    ...resolveText(o.text),
    hero: HERO_PHOTOS.map(r),
    mugshot: r(MUGSHOT),
    gallery: [...PHOTOS.map(r), ...o.custom.map((c) => resolveCustom(c, urlFor))],
  };
}

/* ─── mutations (all return a new object) ────────────────────────────────── */

export type SlotPatch = { caption?: string; alt?: string; media?: MediaRef | null; size?: SlotSize };

export function isCustomId(o: Overrides, id: string) {
  return o.custom.some((c) => c.id === id);
}

export function updateSlot(o: Overrides, id: string, patch: SlotPatch): Overrides {
  if (isCustomId(o, id)) {
    return {
      ...o,
      custom: o.custom.map((c) => {
        if (c.id !== id) return c;
        const next: CustomSlot = { ...c };
        if (patch.caption !== undefined) next.caption = patch.caption;
        if (patch.alt !== undefined) next.alt = patch.alt;
        if (patch.size !== undefined) next.size = patch.size;
        if (patch.media === null) delete next.media;
        else if (patch.media) next.media = patch.media;
        return next;
      }),
    };
  }
  if (!DEFAULT_SLOT_IDS.has(id)) return o;
  const prev = o.slots[id] ?? {};
  const next: SlotEdit = { ...prev };
  if (patch.caption !== undefined) next.caption = patch.caption;
  if (patch.alt !== undefined) next.alt = patch.alt;
  if (patch.media === null) delete next.media;
  else if (patch.media) next.media = patch.media;
  return { ...o, slots: { ...o.slots, [id]: next } };
}

/** back to exactly what's in the source file (placeholder or original media) */
export function resetSlot(o: Overrides, id: string): Overrides {
  if (!(id in o.slots)) return o;
  const slots = { ...o.slots };
  delete slots[id];
  return { ...o, slots };
}

const TAPES: TapeTone[] = ["lime", "orange", "cobalt"];

export function nextCustomLabel(o: Overrides): string {
  const used = new Set([...PHOTOS.map((p) => p.label), ...o.custom.map((c) => c.label)]);
  for (let n = 1; n < 1000; n++) {
    const label = `+${String(n).padStart(2, "0")}`;
    if (!used.has(label)) return label;
  }
  return `+${o.custom.length + 1}`;
}

export function addCustomSlot(o: Overrides, id: string, rng: () => number = Math.random): Overrides {
  const label = nextCustomLabel(o);
  const slot: CustomSlot = {
    id,
    label,
    caption: "new evidence just dropped",
    alt: "Photo of Jairus",
    size: "sm",
    tilt: Math.round((rng() - 0.5) * 10),
    tape: TAPES[Math.floor(rng() * TAPES.length)] ?? "lime",
  };
  return { ...o, custom: [...o.custom, slot] };
}

export function removeCustomSlot(o: Overrides, id: string): Overrides {
  return { ...o, custom: o.custom.filter((c) => c.id !== id) };
}

export function setText<K extends TextSection>(o: Overrides, key: K, value: TextEdits[K]): Overrides {
  return { ...o, text: { ...o.text, [key]: value } };
}

export function resetText(o: Overrides, key: TextSection): Overrides {
  const text = { ...o.text };
  delete text[key];
  return { ...o, text };
}

/** every stored-file id the overrides still point at (media + video posters) */
export function referencedBlobIds(o: Overrides): Set<string> {
  const ids = new Set<string>();
  const add = (m: MediaRef | undefined) => {
    if (m?.kind !== "blob") return;
    ids.add(m.blobId);
    if (m.posterId) ids.add(m.posterId);
  };
  Object.values(o.slots).forEach((s) => add(s.media));
  o.custom.forEach((c) => add(c.media));
  return ids;
}

export function mediaRefOf(o: Overrides, id: string): MediaRef | undefined {
  return o.custom.find((c) => c.id === id)?.media ?? o.slots[id]?.media;
}

/* ─── validation (for loading + backup import) ───────────────────────────── */

const mediaType = z.enum(["image", "gif", "video"]);
const mediaRef = z.union([
  z.object({
    kind: z.literal("blob"),
    blobId: z.string().min(1).max(200),
    type: mediaType,
    mime: z.string().max(100),
    name: z.string().max(500),
    size: z.number().nonnegative(),
    posterId: z.string().min(1).max(200).optional(),
  }),
  z.object({ kind: z.literal("url"), url: z.string().min(1).max(4000), type: mediaType }),
]);
const str = z.string().max(5000);
const overridesSchema = z.object({
  version: z.literal(1),
  slots: z.record(
    z.string(),
    z.object({ caption: str.optional(), alt: str.optional(), media: mediaRef.optional() }),
  ),
  custom: z
    .array(
      z.object({
        id: z.string().min(1).max(200),
        label: z.string().max(40),
        caption: str,
        alt: str,
        size: z.enum(["sm", "md", "lg", "wide"]),
        tilt: z.number().min(-45).max(45),
        tape: z.enum(["lime", "orange", "cobalt", "none"]),
        media: mediaRef.optional(),
      }),
    )
    .max(500),
  text: z.object({
    site: z.object({ fullName: str, firstName: str, nicknames: z.array(str).max(50), from: str }).optional(),
    serious: z.object({ title: str, body: str }).optional(),
    letter: z.object({ greeting: str, paragraphs: z.array(str).max(100), signoff: str, from: str }).optional(),
    lore: z.array(z.object({ tag: str, title: str, body: str, placeholder: z.boolean() })).max(100).optional(),
  }),
});

/** Validates stored or imported overrides. Unknown default-slot ids are dropped. */
export function parseOverrides(input: unknown): Overrides {
  const parsed = overridesSchema.parse(input) as Overrides;
  const slots: Record<string, SlotEdit> = {};
  for (const [id, edit] of Object.entries(parsed.slots)) if (DEFAULT_SLOT_IDS.has(id)) slots[id] = edit;
  return { ...parsed, slots };
}
