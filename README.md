# The Jairus Incident

Build a polished, responsive, highly playful birthday microsite / digital scrapbook for Jairus Melchiah, nicknames Jarvis, Malachiah, Jairuuuus, and "the bunny of the group". Audience is his friend group. The user has many photos of Jairus but has not uploaded them yet, so build an elegant photo management experience with clearly marked replaceable sample-photo slots and a simple way to add/replace images later. Do not invent personal facts or specific memories.

DESIGN READ: playful, unhinged internet scrapbook for a close friend, visually art-directed like a chaotic sticker collage / meme scrapbook, not a generic birthday template. Dials: DESIGN_VARIANCE 10, MOTION_INTENSITY 9, VISUAL_DENSITY 5. Use a vivid but cohesive palette: cobalt blue, acid-lime, punchy orange, warm off-white, near-black. Strong typography, oversized expressive type, layered cutout-photo frames, doodle arrows, sticker shapes, tape, scribbles, playful grid shifts. Keep it polished and intentional, not cluttered. Make mobile excellent.

CORE CONCEPT: "THE JAIRUS INCIDENT / BUNNY.EXE" - an affectionate roast with a genuinely sweet landing. Site should feel like an interactive prank designed to fool him in harmless ways, then reveal the birthday love. Include:
1) A bold opening screen: "HAPPY BIRTHDAY, JAIRUS???" with rotating nickname labels, bunny motif, a suspicious "ENTER AT YOUR OWN RISK" button.
2) Unexpected, non-predictable interactions: buttons that dodge once or change their label, a fake loading bar that reaches 99% then reveals a joke, a "serious birthday message" button that opens a ridiculous fake system alert before the real note, a random surprise button with several varied outcomes, a cursor-following sticker or playful pointer reaction on desktop, elements that shuffle/rearrange in a controlled way. Avoid repeating the same predictable animation sequence. Use randomised timing/choice from a curated set, but keep interactions understandable and never trap the user. Respect prefers-reduced-motion and provide keyboard-accessible alternatives.
3) A "scientific profile" section with obviously fake stats: Bunny energy 100%, chaos level classified, nickname response time 0.2 sec, certified group mascot. Label as jokes, not factual claims.
4) A chaotic photo scrapbook/gallery with varied tilted polaroid frames, captions editable in code, sample placeholders until user uploads real photos. Include a clear instruction on how to replace/add photos.
5) An inside-jokes / group lore section with editable placeholders, do not fabricate specific lore.
6) A heartfelt note reveal near the end, with placeholder copy that can be edited.
7) Final birthday reveal with confetti/sticker burst and "you are loved, you absolute menace" energy.

Implementation: React + TypeScript + Tailwind, use available stack. Use CSS / existing animation dependencies; don't assume packages without checking. Make actual interactions work. Use tasteful sound toggle only if browser audio can be started by user click; default muted. Add a small "chaos level" toggle / button. No authentication, no database, no payment, no external services. Keep it as a static shareable microsite. Add good metadata/title "Jairus.exe | Birthday Chaos". Ensure semantic HTML, good contrast, responsive layout, reduced-motion support. Build the full first version now with sample photos/placeholders and easy editing.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/e73f4095-b59b-4b88-9486-7d64d74ca23a).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
