import { describe, expect, it } from "vitest";

import { createBag, loadingSchedule, pickOtherIndex, shuffleChanged } from "./chaos";

function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

describe("fake loading bar", () => {
  it("stops at exactly 99% and never reaches 100%", () => {
    for (let seed = 1; seed < 40; seed++) {
      const steps = loadingSchedule(seeded(seed));
      expect(steps.at(-1)?.value).toBe(99);
      expect(steps.every((s) => s.value < 100)).toBe(true);
      steps.forEach((s, i) => {
        if (i > 0) expect(s.value).toBeGreaterThan(steps[i - 1]!.value);
      });
    }
  });
});

describe("surprise button outcomes", () => {
  it("never repeats the same outcome twice in a row, even across refills", () => {
    const bag = createBag(["a", "b", "c", "d"], seeded(7));
    let prev = "";
    for (let i = 0; i < 200; i++) {
      const next = bag.next();
      expect(next).not.toBe(prev);
      prev = next;
    }
  });

  it("uses every outcome once before repeating any", () => {
    const items = ["rain", "compliment", "roulette", "barrel", "nothing"];
    const bag = createBag(items, seeded(3));
    const firstRound = items.map(() => bag.next());
    expect(new Set(firstRound).size).toBe(items.length);
  });
});

describe("nickname rotation + shuffles", () => {
  it("always switches to a different nickname", () => {
    const rng = seeded(11);
    for (let i = 0; i < 100; i++) {
      const current = i % 5;
      expect(pickOtherIndex(5, current, rng)).not.toBe(current);
    }
  });

  it("shuffling always produces a visibly different order", () => {
    const order = ["a", "b", "c"];
    for (let seed = 1; seed < 30; seed++) {
      expect(shuffleChanged(order, seeded(seed))).not.toEqual(order);
    }
  });
});
