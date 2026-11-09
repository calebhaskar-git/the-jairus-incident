/**
 * ✏️  EDIT ME — the ORIGINAL words and media slots of the site live in this file.
 *
 * There are two ways to change things:
 *
 * ─── 1. MEDIA CONTROL ROOM (in the browser, no code) ─────────────────────────
 *   Press the ⚙ button (bottom-right) or "edit this site" in the footer.
 *   Edits made there are saved in THAT browser on THAT device only (IndexedDB).
 *   Visitors on other devices will NOT see them. Use "Export backup" to move
 *   them to another browser.
 *
 * ─── 2. THIS FILE (shows for everyone who visits the built site) ─────────────
 *   Photos / GIFs / videos:
 *     a) Put the file in  src/assets/photos/   e.g. src/assets/photos/beach.jpg
 *     b) Import it at the top of this file:
 *          import beach from "@/assets/photos/beach.jpg";
 *     c) Set `src: beach` on the slot you want. The placeholder disappears.
 *        For a video also set `type: "video"` (and optionally `poster`).
 *   OR put files in  public/media/  and use `src: "/media/beach.jpg"`.
 *
 * ─── PLACEHOLDERS ─────────────────────────────────────────────────────────────
 *   Anything in [square brackets] is a placeholder waiting for real words.
 *   Lore cards with `placeholder: true` show an "EDIT ME" stamp — set it to
 *   false once you've written the real thing.
 */

import type { MediaType } from "@/lib/media-type";

export type PhotoSlot = {
  /** stable id — also used to remember on-device previews */
  id: string;
  /** short label shown on the placeholder, e.g. "A" or "03" */
  label: string;
  /** imported image. Leave undefined to show a placeholder slot. */
  src?: string | undefined;
  /** "image" | "gif" | "video". Leave out to detect from the file extension. */
  type?: MediaType | undefined;
  /** still image shown before a video starts (videos only) */
  poster?: string | undefined;
  alt: string;
  /** handwritten caption under the polaroid */
  caption: string;
  /** layout size in the scrapbook grid */
  size?: "sm" | "md" | "lg" | "wide";
  /** resting tilt in degrees */
  tilt?: number;
  tape?: "lime" | "orange" | "cobalt" | "none";
};

export const SITE = {
  fullName: "Jairus Melchiah",
  firstName: "Jairus",
  nicknames: ["Jarvis", "Malachiah", "Jairuuuus", "the bunny of the group"],
  /** who the site is from — shown in the footer + letter */
  from: "[the group chat]",
  /** shows the "how to add photos" card in the scrapbook. Set false when done. */
  showPhotoHelp: true,
};

/* ─── PHOTOS ─────────────────────────────────────────────────────────────── */

/** the two layered cut-out frames at the top of the page */
export const HERO_PHOTOS: PhotoSlot[] = [
  {
    id: "hero-main",
    label: "HERO 1",
    alt: "Jairus — main hero photo",
    caption: "the birthday boy (allegedly)",
    tilt: 5,
    tape: "lime",
  },
  {
    id: "hero-side",
    label: "HERO 2",
    alt: "Jairus — second hero photo",
    caption: "evidence",
    tilt: -8,
    tape: "orange",
  },
];

/** the mugshot inside the scientific profile */
export const MUGSHOT: PhotoSlot = {
  id: "mugshot",
  label: "MUGSHOT",
  alt: "Jairus — specimen mugshot",
  caption: "specimen BN-01",
  tilt: 0,
  tape: "none",
};

/** the scrapbook gallery. Add or remove entries freely. */
export const PHOTOS: PhotoSlot[] = [
  { id: "exhibit-a", label: "A", alt: "Photo of Jairus", caption: "exhibit A: caught in 4K", size: "lg", tilt: -3, tape: "lime" },
  { id: "exhibit-b", label: "B", alt: "Photo of Jairus", caption: "natural habitat (probably)", size: "sm", tilt: 4, tape: "orange" },
  { id: "exhibit-c", label: "C", alt: "Photo of Jairus", caption: "a rare sighting", size: "md", tilt: -5, tape: "cobalt" },
  { id: "exhibit-d", label: "D", alt: "Photo of Jairus", caption: "the face of a man with a plan", size: "wide", tilt: 2, tape: "lime" },
  { id: "exhibit-e", label: "E", alt: "Photo of Jairus", caption: "blurry but iconic", size: "sm", tilt: -2, tape: "orange" },
  { id: "exhibit-f", label: "F", alt: "Photo of Jairus", caption: "unbothered. moisturised. bunny.", size: "md", tilt: 5, tape: "lime" },
  { id: "exhibit-g", label: "G", alt: "Photo of Jairus", caption: "we have questions", size: "sm", tilt: -6, tape: "cobalt" },
  { id: "exhibit-h", label: "H", alt: "Photo of Jairus", caption: "peak menace behaviour", size: "wide", tilt: -1, tape: "orange" },
  { id: "exhibit-i", label: "I", alt: "Photo of Jairus", caption: "the bunny of the group, in the wild", size: "sm", tilt: 3, tape: "lime" },
];

/* ─── SCIENTIFIC PROFILE (all jokes) ─────────────────────────────────────── */

export const CLASSIFIED_REVEALS = [
  "nice try.",
  "still classified.",
  "off the charts (we broke the chart)",
  "you don't have clearance",
  "[REDACTED BY THE BUNNY]",
];

/* ─── BUTTONS SECTION ───────────────────────────────────────────────────── */

export type FakeAlert = {
  title: string;
  body: string;
  primary: string;
  secondary: string;
  /** the secondary button's label after the first click (it changes its mind once) */
  secondaryAfter: string;
};

export const FAKE_ALERTS: FakeAlert[] = [
  {
    title: "bunny.exe has stopped responding",
    body: "The serious birthday message could not be opened because it was too serious. Send an error report to the group chat?",
    primary: "Send report",
    secondary: "Cry quietly",
    secondaryAfter: "ok cry loudly",
  },
  {
    title: "Critical update required",
    body: "Jairus needs to install 1 update: AGE +1. Your device may restart several times. Please do not turn off your ears.",
    primary: "Update now",
    secondary: "Remind me never",
    secondaryAfter: "never isn't an option",
  },
  {
    title: "Warning: low seriousness detected",
    body: "Seriousness levels are at 3%. Proceeding may result in sincerity, feelings, or a hug.",
    primary: "Proceed with caution",
    secondary: "Proceed without caution",
    secondaryAfter: "fine. proceed anyway",
  },
  {
    title: "\u201cFeelings\u201d would like to access your heart",
    body: "This permission is required to display the serious birthday message. Feelings will not sell your data. Probably.",
    primary: "Allow",
    secondary: "Don't allow",
    secondaryAfter: "that wasn't a real option",
  },
];

/** the short "real" message that appears after the fake alert */
export const SERIOUS_MESSAGE = {
  title: "ok. genuinely though:",
  body: "Happy birthday, Jairus. We're really glad you exist. That's the whole message. (The long version is at the bottom.)",
};

export const COMPLIMENTS = [
  "Certified 10/10 human. Bunny. Whatever you are.",
  "Your vibe is load-bearing. Please do not remove it.",
  "Statistically the best Jairus in this group chat.",
  "Officially too powerful to be measured.",
  "Group mascot, emeritus, with honours.",
  "You are the main character and also the plot twist.",
];

export const FORTUNES = [
  "You will receive at least one (1) cake-adjacent item.",
  "Someone will say your name in a very long way today. Respond in 0.2 sec.",
  "Lucky number: whatever age you are now. Lucky animal: obviously.",
  "A great year is loading. Currently at 99%.",
];

export const SURPRISE_LABELS = [
  "Surprise me",
  "again??",
  "one more",
  "ok last one",
  "you said last one",
  "surprise me (respectfully)",
  "keep going",
];

export const DO_NOT_PRESS_LABELS = [
  "Do not press",
  "I said don't",
  "that's twice",
  "you're the bunny, not the boss",
  "please",
  "ok it's going to break",
];

export const DO_NOT_PRESS_AFTER = [
  "respawned. don't.",
  "seriously this time",
  "you have a problem",
  "ok it's going to break (again)",
];

/* ─── INTRO ─────────────────────────────────────────────────────────────── */

export const INTRO_LABELS = ["Jairus Melchiah", ...SITE.nicknames];

export const LOADING_LINES = [
  "locating the bunny…",
  "calibrating ear wiggle…",
  "downloading 100% of the chaos…",
  "bribing the group chat…",
  "removing embarrassing evidence… (failed)",
  "inflating balloons…",
  "asking Jarvis to run diagnostics…",
  "spelling Jairuuuus correctly…",
  "warming up the confetti cannon…",
];

export const LOADING_ERRORS = [
  "Jairus is too powerful to load past 99%. The remaining 1% is pure bunny.",
  "The last 1% is stuck in the group chat. It's been left on read.",
  "99% loaded. The final 1% refused to come out until someone says Jairuuuus.",
];

/* ─── LORE (placeholders — fill these in!) ──────────────────────────────── */

export type LoreItem = {
  tag: string;
  title: string;
  body: string;
  placeholder: boolean;
};

export const LORE: LoreItem[] = [
  { tag: "LORE FILE 01", title: "[The nickname origin story]", body: "[How did 'the bunny of the group' happen? Write it here.]", placeholder: true },
  { tag: "LORE FILE 02", title: "[A quote he'll never live down]", body: "[Put the exact quote here. Context optional.]", placeholder: true },
  { tag: "LORE FILE 03", title: "[That one time…]", body: "[One or two lines. He'll know.]", placeholder: true },
  { tag: "LORE FILE 04", title: "[The group chat moment]", body: "[The message that started it all.]", placeholder: true },
  { tag: "LORE FILE 05", title: "[Why 'Jarvis'?]", body: "[Explain. Or don't. Mystery is also lore.]", placeholder: true },
  { tag: "LORE FILE 06", title: "[Your inside joke here]", body: "[Add as many lore files as you like in the content file.]", placeholder: true },
];

/* ─── THE LETTER (placeholder copy — make it yours) ─────────────────────── */

export const LETTER = {
  greeting: "Dear Jairus,",
  paragraphs: [
    "Okay. No alerts, no loading bars, no buttons that run away. Just this.",
    "Behind all the nicknames and the roasting, this whole ridiculous website is a very elaborate way of saying something simple: we love you, and we're really glad you were born.",
    "[Add your own words here — a thank-you, a memory, something only he'll get. Everyone can add a line.]",
    "Happy birthday. Never stop being the bunny of the group.",
  ],
  signoff: "Love, always,",
  from: "[your names here]",
};

/* ─── FINALE ────────────────────────────────────────────────────────────── */

export const FINALE_STICKERS = ["HBD!!", "MENACE", "LOVED", "BUNNY", "LEGEND", "★", "JARVIS", "100%", "JAIRUUUUS", "CERTIFIED"];

/** little speech bubbles the cursor bunny says over buttons */
export const BUDDY_LINES = ["ooh", "press it", "!!", "hehe", "do it", "risky", "yes", "👀"];
