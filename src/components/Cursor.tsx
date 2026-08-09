"use client";

import { useRef } from "react";
import { gsap } from "@/lib/gsap";
import { useIsomorphicLayoutEffect } from "@/hooks/useIsomorphicLayoutEffect";

/**
 * Add `data-cursor="View"` to any element to expand the ring and label it.
 */
export default function Cursor() {
  const ringRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);

  useIsomorphicLayoutEffect(() => {
    const ring = ringRef.current;
    const dot = dotRef.current;
    const label = labelRef.current;
    if (!ring || !dot || !label) return;

    const fine = window.matchMedia("(pointer: fine)").matches;
    if (!fine) return;

    const root = document.documentElement;
    root.dataset.cursor = "custom";

    const ringX = gsap.quickTo(ring, "x", { duration: 0.55, ease: "power3" });
    const ringY = gsap.quickTo(ring, "y", { duration: 0.55, ease: "power3" });
    const dotX = gsap.quickTo(dot, "x", { duration: 0.12, ease: "power3" });
    const dotY = gsap.quickTo(dot, "y", { duration: 0.12, ease: "power3" });

    let visible = false;

    const onMove = (e: PointerEvent) => {
      if (!visible) {
        visible = true;
        gsap.to([ring, dot], { autoAlpha: 1, duration: 0.3 });
      }
      ringX(e.clientX);
      ringY(e.clientY);
      dotX(e.clientX);
      dotY(e.clientY);
    };

    const onLeave = () => {
      visible = false;
      gsap.to([ring, dot], { autoAlpha: 0, duration: 0.2 });
    };

    const onOver = (e: PointerEvent) => {
      const hit = (e.target as HTMLElement | null)?.closest<HTMLElement>(
        "[data-cursor]"
      );
      const text = hit?.dataset.cursor ?? "";

      gsap.to(ring, {
        scale: text ? 3.2 : 1,
        borderColor: text ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.6)",
        backgroundColor: text ? "rgba(255,255,255,0.1)" : "transparent",
        duration: 0.45,
        ease: "expo.out",
      });
      gsap.to(dot, { scale: text ? 0 : 1, duration: 0.3 });

      label.textContent = text;
      gsap.to(label, { autoAlpha: text ? 1 : 0, duration: 0.25 });
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerover", onOver, { passive: true });
    document.addEventListener("pointerleave", onLeave);

    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerover", onOver);
      document.removeEventListener("pointerleave", onLeave);
      delete root.dataset.cursor;
    };
  }, []);

  return (
    // Difference blending keeps the cursor visible on cream, coral and neon alike.
    <div className="pointer-events-none fixed inset-0 z-[90] hidden mix-blend-difference md:block">
      <div
        ref={ringRef}
        className="absolute -left-5 -top-5 flex h-10 w-10 items-center justify-center rounded-full border border-white/60 opacity-0 will-change-transform"
      >
        <span
          ref={labelRef}
          className="label scale-[0.32] whitespace-nowrap text-white opacity-0"
        />
      </div>
      <div
        ref={dotRef}
        className="absolute -left-[3px] -top-[3px] h-1.5 w-1.5 rounded-full bg-white opacity-0 will-change-transform"
      />
    </div>
  );
}
