"use client";

import { useRef } from "react";
import { gsap } from "@/lib/gsap";
import { useIsomorphicLayoutEffect } from "@/hooks/useIsomorphicLayoutEffect";
import { loadImages, onImagesProgress } from "@/lib/preload";
import { HERO_IMAGES } from "@/lib/scenes";
import { lockScroll, unlockScroll } from "@/lib/smooth";
import { markReady } from "@/lib/ready";
import { SITE } from "@/lib/site";

const HERO_BATCH = "hero-layers";
const SLATS = 6;

/** Never hold the visitor hostage to a slow connection. */
const MAX_WAIT_MS = 6000;
const MIN_SHOW_MS = 1200;

export default function Preloader() {
  const rootRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef<HTMLSpanElement>(null);
  const barRef = useRef<HTMLSpanElement>(null);

  useIsomorphicLayoutEffect(() => {
    const root = rootRef.current;
    const counter = counterRef.current;
    const bar = barRef.current;
    if (!root || !counter || !bar) return;

    lockScroll();
    const mountedAt = performance.now();

    const target = { p: 0 };
    const shown = { p: 0 };

    // Ease the displayed number toward real progress so it never jumps.
    const tick = () => {
      shown.p += (target.p - shown.p) * 0.06;
      const pct = Math.min(99, Math.floor(shown.p * 100));
      counter.textContent = String(pct).padStart(2, "0");
      bar.style.transform = `scaleX(${shown.p})`;
    };

    const stopProgress = onImagesProgress(HERO_BATCH, HERO_IMAGES, (p) => {
      target.p = p;
    });
    gsap.ticker.add(tick);

    const ctx = gsap.context(() => {}, root);
    let finished = false;

    const finish = () => {
      if (finished) return;
      finished = true;
      gsap.ticker.remove(tick);
      stopProgress();

      ctx.add(() => {
        gsap
          .timeline({
            defaults: { ease: "expo.inOut" },
            onComplete: () => {
              unlockScroll();
              root.style.display = "none";
            },
          })
          .to(shown, {
            p: 1,
            duration: 0.5,
            ease: "power2.out",
            onUpdate: () => {
              counter.textContent = String(
                Math.floor(shown.p * 100)
              ).padStart(2, "0");
              bar.style.transform = `scaleX(${shown.p})`;
            },
          })
          .to(
            "[data-preload-content]",
            { yPercent: -110, opacity: 0, duration: 0.9 },
            "+=0.15"
          )
          .to(
            "[data-slat]",
            {
              scaleY: 0,
              duration: 1.1,
              stagger: { each: 0.06, from: "start" },
            },
            "-=0.55"
          )
          .add(markReady, "-=0.75");
      });
    };

    const scheduleFinish = () => {
      const elapsed = performance.now() - mountedAt;
      const wait = Math.max(0, MIN_SHOW_MS - elapsed);
      window.setTimeout(finish, wait);
    };

    loadImages(HERO_BATCH, HERO_IMAGES).ready.then(scheduleFinish);
    const bail = window.setTimeout(finish, MAX_WAIT_MS);

    return () => {
      window.clearTimeout(bail);
      gsap.ticker.remove(tick);
      stopProgress();
      ctx.revert();
      unlockScroll();
    };
  }, []);

  return (
    <div
      ref={rootRef}
      className="fixed inset-0 z-[100] flex items-end overflow-hidden"
      aria-hidden
    >
      <div className="absolute inset-0 flex">
        {Array.from({ length: SLATS }, (_, i) => (
          <span
            key={i}
            data-slat
            className="h-full flex-1 origin-top bg-ink"
            style={{ willChange: "transform" }}
          />
        ))}
      </div>

      {/* Party lights bleeding through the black. */}
      <div
        data-preload-content
        className="pointer-events-none absolute inset-0 opacity-70 blur-3xl"
        style={{
          background:
            "radial-gradient(45% 55% at 18% 25%, #e93cc4 0%, transparent 70%), radial-gradient(40% 50% at 82% 20%, #2136e0 0%, transparent 70%), radial-gradient(55% 45% at 55% 95%, #ff3b2f 0%, transparent 70%)",
        }}
      />

      <div
        data-preload-content
        className="relative flex w-full items-end justify-between gap-6 px-6 pb-8 text-paper md:px-12 md:pb-12"
      >
        <div>
          <p className="label text-paper/70">Turning the colour up</p>
          <p className="display mt-4 text-[13vw] leading-[0.8] md:text-[7vw]">
            {SITE.first}
            <span className="italic text-sun"> {SITE.last}</span>
          </p>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-3">
          <span
            ref={counterRef}
            className="font-mono text-4xl tabular-nums md:text-6xl"
          >
            00
          </span>
          <span className="block h-0.5 w-32 overflow-hidden rounded-full bg-paper/20 md:w-56">
            <span
              ref={barRef}
              className="spectrum block h-full w-full origin-left scale-x-0"
            />
          </span>
        </div>
      </div>
    </div>
  );
}
