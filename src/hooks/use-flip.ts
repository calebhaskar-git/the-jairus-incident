import { useCallback, useLayoutEffect, useRef } from "react";

/**
 * FLIP reorder animation without a library.
 * Call `capture()` right before changing the order; elements registered with
 * `register(key)` glide from their old spot to the new one.
 * Register a wrapper WITHOUT its own transform (put tilt on an inner element).
 */
export function useFlip(orderKey: string, enabled: boolean) {
  const nodes = useRef(new Map<string, HTMLElement>());
  const before = useRef(new Map<string, DOMRect>());

  const capture = useCallback(() => {
    before.current.clear();
    nodes.current.forEach((el, k) => before.current.set(k, el.getBoundingClientRect()));
  }, []);

  const register = useCallback(
    (key: string) => (el: HTMLElement | null) => {
      if (el) nodes.current.set(key, el);
      else nodes.current.delete(key);
    },
    [],
  );

  useLayoutEffect(() => {
    if (!enabled || before.current.size === 0) return;
    let i = 0;
    nodes.current.forEach((el, k) => {
      const prev = before.current.get(k);
      if (!prev) return;
      const now = el.getBoundingClientRect();
      const dx = prev.left - now.left;
      const dy = prev.top - now.top;
      if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;
      el.animate(
        [
          { transform: `translate(${dx}px, ${dy}px) rotate(${(i % 2 ? 1 : -1) * 4}deg)` },
          { transform: "translate(0, 0) rotate(0deg)" },
        ],
        { duration: 520 + Math.random() * 260, easing: "cubic-bezier(.2,1.35,.4,1)", delay: i * 18 },
      );
      i++;
    });
    before.current.clear();
  }, [orderKey, enabled]);

  return { register, capture };
}
