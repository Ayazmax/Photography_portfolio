"use client";

import type Lenis from "lenis";

let instance: Lenis | null = null;

export const registerLenis = (lenis: Lenis | null) => {
  instance = lenis;
};

export const getLenis = () => instance;

export const lockScroll = () => instance?.stop();
export const unlockScroll = () => instance?.start();

/** Smooth scroll to a document Y. Prefers Lenis when it owns the scroller. */
export function scrollToY(
  y: number,
  {
    duration = 0.75,
    onComplete,
  }: { duration?: number; onComplete?: () => void } = {}
) {
  if (instance) {
    instance.scrollTo(y, {
      duration,
      easing: (t: number) => 1 - Math.pow(1 - t, 3),
      onComplete,
    });
    return;
  }
  window.scrollTo({ top: y, behavior: "smooth" });
  if (onComplete) window.setTimeout(onComplete, duration * 1000);
}

export function scrollToSection(hash: string) {
  if (instance) {
    instance.scrollTo(hash, { duration: 1.8, offset: 0 });
    return;
  }
  document.querySelector(hash)?.scrollIntoView({ behavior: "smooth" });
}
