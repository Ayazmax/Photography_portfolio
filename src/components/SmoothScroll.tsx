"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { gsap, ScrollTrigger, prefersReducedMotion } from "@/lib/gsap";
import { registerLenis } from "@/lib/smooth";
import { onReady } from "@/lib/ready";

export default function SmoothScroll() {
  useEffect(() => {
    // Layout shifts once webfonts swap in and once the preloader unlocks, and
    // every pinned section's scroll range depends on those measurements.
    document.fonts.ready.then(() => ScrollTrigger.refresh());
    const stopReady = onReady(() => ScrollTrigger.refresh());

    if (prefersReducedMotion()) return stopReady;

    const lenis = new Lenis({
      lerp: 0.085,
      wheelMultiplier: 1,
      touchMultiplier: 1.6,
      syncTouch: false,
    });

    registerLenis(lenis);
    lenis.on("scroll", ScrollTrigger.update);

    // Let GSAP's ticker drive Lenis so scrubbed timelines stay in lockstep.
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      stopReady();
      gsap.ticker.remove(tick);
      gsap.ticker.lagSmoothing(500, 33);
      registerLenis(null);
      lenis.destroy();
    };
  }, []);

  return null;
}
