"use client";

import Image from "next/image";
import { useRef } from "react";
import { gsap } from "@/lib/gsap";
import { useIsomorphicLayoutEffect } from "@/hooks/useIsomorphicLayoutEffect";
import { asset } from "@/lib/base";
import { stillBySlug } from "@/lib/media.generated";

type Props = {
  slug: string;
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
  /** Percentage of vertical drift across the viewport pass. */
  amount?: number;
  /** ScrollTrigger scroller-follower for horizontally scrolled tracks. */
  containerAnimation?: gsap.core.Tween;
};

export default function ParallaxImage({
  slug,
  alt,
  className = "",
  sizes = "(max-width: 768px) 100vw, 50vw",
  priority = false,
  amount = 12,
  containerAnimation,
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const still = stillBySlug(slug);

  useIsomorphicLayoutEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;

    const ctx = gsap.context(() => {
      const target = wrap.querySelector("[data-parallax-inner]");
      if (!target) return;

      const horizontal = Boolean(containerAnimation);

      gsap.fromTo(
        target,
        horizontal ? { xPercent: amount } : { yPercent: -amount },
        {
          [horizontal ? "xPercent" : "yPercent"]: -amount,
          ease: "none",
          scrollTrigger: {
            trigger: wrap,
            containerAnimation,
            start: horizontal ? "left right" : "top bottom",
            end: horizontal ? "right left" : "bottom top",
            scrub: true,
            invalidateOnRefresh: true,
          },
        }
      );
    }, wrap);

    return () => ctx.revert();
  }, [amount, containerAnimation]);

  return (
    <div ref={wrapRef} className={`relative overflow-hidden ${className}`}>
      <div
        data-parallax-inner
        className="absolute inset-0 scale-[1.18] will-change-transform"
      >
        <Image
          src={asset(`/img/${still.slug}.jpg`)}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          placeholder="blur"
          blurDataURL={still.blurDataURL}
          className="object-cover"
        />
      </div>
    </div>
  );
}
