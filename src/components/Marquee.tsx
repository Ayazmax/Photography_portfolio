"use client";

import { useRef, type ReactNode } from "react";
import {
  gsap,
  ScrollTrigger,
  isTouchDevice,
  prefersReducedMotion,
} from "@/lib/gsap";
import { useIsomorphicLayoutEffect } from "@/hooks/useIsomorphicLayoutEffect";

type Props = {
  children: ReactNode;
  className?: string;
  /** Seconds for one full pass. */
  duration?: number;
  reverse?: boolean;
};

/**
 * Seamless marquee that speeds up — and flips direction — with scroll
 * velocity, so the page feels physically connected to the wheel.
 */
export default function Marquee({
  children,
  className = "",
  duration = 26,
  reverse = false,
}: Props) {
  const trackRef = useRef<HTMLDivElement>(null);

  useIsomorphicLayoutEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const base = reverse ? -1 : 1;
    if (prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      const loop = gsap.to(track, {
        xPercent: -50,
        repeat: -1,
        duration,
        ease: "none",
      });
      loop.timeScale(base).pause();

      // Only tick while on screen.
      ScrollTrigger.create({
        trigger: track,
        start: "top bottom",
        end: "bottom top",
        onToggle: (self) => (self.isActive ? loop.play() : loop.pause()),
      });

      // Velocity coupling spawns a tween per scroll event — fine for a wheel,
      // wasteful for touch momentum.
      if (isTouchDevice()) return;

      let direction = base;
      let settle = 0;

      ScrollTrigger.create({
        trigger: track,
        start: "top bottom",
        end: "bottom top",
        onUpdate: (self) => {
          const velocity = self.getVelocity();
          direction = (velocity > 0 ? 1 : -1) * base;
          const boost = gsap.utils.clamp(1, 5, 1 + Math.abs(velocity) / 700);

          gsap.to(loop, {
            timeScale: direction * boost,
            duration: 0.35,
            overwrite: true,
          });

          // Ease back to cruising speed once the wheel goes quiet.
          window.clearTimeout(settle);
          settle = window.setTimeout(() => {
            gsap.to(loop, {
              timeScale: direction,
              duration: 0.8,
              overwrite: true,
            });
          }, 180);
        },
      });

      return () => window.clearTimeout(settle);
    }, track);

    return () => ctx.revert();
  }, [duration, reverse]);

  return (
    <div className={`overflow-hidden ${className}`}>
      <div ref={trackRef} className="flex w-max will-change-transform">
        <div className="flex shrink-0">{children}</div>
        <div className="flex shrink-0" aria-hidden>
          {children}
        </div>
      </div>
    </div>
  );
}
