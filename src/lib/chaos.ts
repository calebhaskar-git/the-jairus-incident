/** Small, pure randomness helpers so interactions feel unpredictable but stay testable. */

export type Rng = () => number;

export function randBetween(min: number, max: number, rng: Rng = Math.random): number {
  return min + (max - min) * rng();
}

export function randInt(min: number, max: number, rng: Rng = Math.random): number {
  return Math.min(max, Math.floor(randBetween(min, max + 1, rng)));
}

export function pick<T>(items: readonly T[], rng: Rng = Math.random): T {
  if (items.length === 0) throw new Error("pick() needs at least one item");
  return items[Math.min(items.length - 1, Math.floor(rng() * items.length))] as T;
}

/** pick an index different from `current` (when there is more than one option) */
export function pickOtherIndex(length: number, current: number, rng: Rng = Math.random): number {
  if (length <= 1) return 0;
  const offset = 1 + Math.floor(rng() * (length - 1));
  return (current + Math.min(offset, length - 1)) % length;
}

export function shuffle<T>(items: readonly T[], rng: Rng = Math.random): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = a[i] as T;
    a[i] = a[j] as T;
    a[j] = tmp;
  }
  return a;
}

/** shuffle that guarantees a visibly different order (when possible) */
export function shuffleChanged<T>(items: readonly T[], rng: Rng = Math.random): T[] {
  if (items.length < 2) return [...items];
  for (let tries = 0; tries < 6; tries++) {
    const next = shuffle(items, rng);
    if (next.some((v, i) => v !== items[i])) return next;
  }
  return [...items.slice(1), items[0] as T];
}

/**
 * A "shuffle bag": hands out every item once in random order before refilling,
 * and never gives the same item twice in a row across refills.
 */
export function createBag<T>(items: readonly T[], rng: Rng = Math.random) {
  let bag: T[] = [];
  let last: T | undefined;
  return {
    next(): T {
      if (bag.length === 0) {
        bag = shuffle(items, rng);
        if (bag.length > 1 && bag[0] === last) {
          const first = bag[0] as T;
          bag[0] = bag[1] as T;
          bag[1] = first;
        }
      }
      const value = bag.shift() as T;
      last = value;
      return value;
    },
  };
}

export type LoadingStep = { value: number; delay: number };

/**
 * Irregular fake-loading schedule. Always climbs, always ends exactly at 99,
 * never reaches 100 (that's the joke).
 */
export function loadingSchedule(rng: Rng = Math.random, speed = 1): LoadingStep[] {
  const steps: LoadingStep[] = [];
  let value = 0;
  while (value < 99) {
    const jump = value < 55 ? randInt(7, 18, rng) : value < 88 ? randInt(3, 9, rng) : randInt(1, 3, rng);
    value = Math.min(99, value + jump);
    const slow = value > 88;
    const delay = randBetween(slow ? 280 : 110, slow ? 620 : 380, rng);
    steps.push({ value, delay: Math.round(delay * speed) });
  }
  // one dramatic stall somewhere in the middle
  if (steps.length > 3 && rng() < 0.7) {
    const i = randInt(1, steps.length - 2, rng);
    const step = steps[i];
    if (step) step.delay = Math.round(step.delay * 3.5);
  }
  return steps;
}
