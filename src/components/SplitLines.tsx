"use client";

import { useRef, type ElementType, type ReactNode } from "react";
import { gsap, SplitText, prefersReducedMotion } from "@/lib/gsap";
import { useIsomorphicLayoutEffect } from "@/hooks/useIsomorphicLayoutEffect";
import { onReady } from "@/lib/ready";

type Props = {
  children: ReactNode;
  as?: ElementType;
  className?: string;
  /** `ready` waits for the preloader to clear; `scroll` waits for the viewport. */
  cue?: "ready" | "scroll";
  delay?: number;
  stagger?: number;
  start?: string;
};

/**
 * Splits text into lines and slides each one up from behind a hard mask —
 * the signature move of editorial motion sites.
 */
export default function SplitLines({
  children,
  as: Tag = "div",
  className,
  cue = "scroll",
  delay = 0,
  stagger = 0.08,
  start = "top 85%",
}: Props) {
  const ref = useRef<HTMLElement>(null);

  useIsomorphicLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (prefersReducedMotion()) {
      gsap.set(el, { autoAlpha: 1 });
      return;
    }

    let disposed = false;
    let dispose: (() => void) | undefined;

    // Splitting before webfonts settle measures the wrong line breaks.
    document.fonts.ready.then(() => {
      if (disposed) return;

      let played = false;
      let entrance: gsap.core.Tween | undefined;

      const ctx = gsap.context(() => {
        gsap.set(el, { autoAlpha: 1 });

        SplitText.create(el, {
          type: "lines",
          mask: "lines",
          autoSplit: true,
          onSplit: (self) => {
            // Re-splits (resize, font swap) shouldn't replay the entrance.
            if (played) {
              gsap.set(self.lines, { yPercent: 0, opacity: 1 });
              return;
            }

            entrance = gsap.from(self.lines, {
              yPercent: 115,
              opacity: 0,
              duration: 1.15,
              ease: "expo.out",
              stagger,
              delay,
              paused: cue === "ready",
              onStart: () => {
                played = true;
              },
              scrollTrigger:
                cue === "scroll"
                  ? { trigger: el, start, once: true }
                  : undefined,
            });

            return entrance;
          },
        });
      }, el);

      const stopReady =
        cue === "ready" ? onReady(() => entrance?.play()) : undefined;

      dispose = () => {
        stopReady?.();
        ctx.revert();
      };
    });

    return () => {
      disposed = true;
      dispose?.();
    };
  }, [cue, delay, stagger, start]);

  return (
    <Tag ref={ref} className={className} style={{ visibility: "hidden" }}>
      {children}
    </Tag>
  );
}
