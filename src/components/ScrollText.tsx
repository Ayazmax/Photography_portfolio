"use client";

import { useRef, type ElementType, type ReactNode } from "react";
import {
  gsap,
  SplitText,
  isTouchDevice,
  prefersReducedMotion,
} from "@/lib/gsap";
import { useIsomorphicLayoutEffect } from "@/hooks/useIsomorphicLayoutEffect";

type Props = {
  children: ReactNode;
  as?: ElementType;
  className?: string;
  /** Opacity the words sit at before the scroll pass reaches them. */
  dim?: number;
};

/**
 * Word-by-word illumination tied to scroll position — the copy literally
 * develops as the visitor reads it.
 */
export default function ScrollText({
  children,
  as: Tag = "p",
  className,
  dim = 0.16,
}: Props) {
  const ref = useRef<HTMLElement>(null);

  useIsomorphicLayoutEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;

    let disposed = false;
    let dispose: (() => void) | undefined;

    document.fonts.ready.then(() => {
      if (disposed) return;

      // Scrubbing opacity on every word repaints the whole paragraph on each
      // scroll tick; phones get a single timed sweep when it comes into view.
      const touch = isTouchDevice();

      const ctx = gsap.context(() => {
        SplitText.create(el, {
          type: "words",
          autoSplit: true,
          onSplit: (self) =>
            touch
              ? gsap.fromTo(
                  self.words,
                  { opacity: dim },
                  {
                    opacity: 1,
                    ease: "power1.out",
                    duration: 0.5,
                    stagger: 0.025,
                    scrollTrigger: { trigger: el, start: "top 75%", once: true },
                  }
                )
              : gsap.fromTo(
                  self.words,
                  { opacity: dim },
                  {
                    opacity: 1,
                    ease: "none",
                    stagger: 0.4,
                    scrollTrigger: {
                      trigger: el,
                      start: "top 78%",
                      end: "bottom 58%",
                      scrub: 0.4,
                    },
                  }
                ),
        });
      }, el);

      dispose = () => ctx.revert();
    });

    return () => {
      disposed = true;
      dispose?.();
    };
  }, [dim]);

  return (
    <Tag ref={ref} className={className}>
      {children}
    </Tag>
  );
}
