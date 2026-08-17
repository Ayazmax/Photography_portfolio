"use client";

import Image from "next/image";
import { useRef } from "react";
import { gsap } from "@/lib/gsap";
import { useIsomorphicLayoutEffect } from "@/hooks/useIsomorphicLayoutEffect";
import { asset } from "@/lib/base";
import { stillBySlug } from "@/lib/media.generated";
import { WORKS } from "@/lib/site";

export default function HorizontalGallery() {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLSpanElement>(null);
  const countRef = useRef<HTMLSpanElement>(null);

  useIsomorphicLayoutEffect(() => {
    const section = sectionRef.current;
    const track = trackRef.current;
    if (!section || !track) return;

    const ctx = gsap.context(() => {
      const distance = () => Math.max(0, track.scrollWidth - window.innerWidth);

      // The section is CSS-sticky; this just maps its scroll range to x.
      const scrollTween = gsap.to(track, {
        x: () => -distance(),
        ease: "none",
        force3D: true,
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: "bottom bottom",
          // Lenis already eases the scroll position. A second lerp here lets the
          // JS transform drift behind the compositor-driven sticky parent, which
          // reads as tearing along the card edges.
          scrub: true,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            if (barRef.current) {
              barRef.current.style.transform = `scaleX(${self.progress})`;
            }
            if (countRef.current) {
              const i = Math.min(
                WORKS.length,
                Math.floor(self.progress * WORKS.length) + 1
              );
              countRef.current.textContent = String(i).padStart(2, "0");
            }
          },
        },
      });

      // Drift each frame against the track for depth.
      gsap.utils.toArray<HTMLElement>("[data-card-media]").forEach((media) => {
        const inner = media.querySelector("[data-card-inner]");
        if (!inner) return;

        gsap.fromTo(
          inner,
          { xPercent: 7 },
          {
            xPercent: -7,
            ease: "none",
            force3D: true,
            scrollTrigger: {
              trigger: media,
              containerAnimation: scrollTween,
              start: "left right",
              end: "right left",
              scrub: true,
              invalidateOnRefresh: true,
            },
          }
        );
      });

      gsap.utils.toArray<HTMLElement>("[data-card-caption]").forEach((cap) => {
        gsap.from(cap, {
          y: 26,
          autoAlpha: 0,
          duration: 0.8,
          ease: "expo.out",
          scrollTrigger: {
            trigger: cap,
            containerAnimation: scrollTween,
            start: "left 88%",
            toggleActions: "play none none reverse",
          },
        });
      });
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="works"
      className="relative h-[340vh] bg-paper text-ink"
      aria-label="Selected works"
    >
      <div className="sticky top-0 flex h-svh flex-col overflow-hidden">
        <div
          ref={trackRef}
          className="flex h-full items-center gap-[8vw] px-[7vw] will-change-transform"
        >
          <div className="flex w-[70vw] shrink-0 flex-col justify-center md:w-[36vw]">
            <p className="label text-electric">(Selected work)</p>
            <h2 className="display mt-6 text-[15vw] leading-[0.82] md:text-[7vw]">
              People
              <br />
              <span className="italic text-punch">at full</span>
              <br />
              volume
            </h2>
            <p className="mt-8 max-w-sm text-sm leading-relaxed text-mute">
              A rotating selection from 2024 — 2026. Scroll sideways. Weddings,
              parties, and a few fields that were too good to leave behind.
            </p>
          </div>

          {WORKS.map((work) => {
            const still = stillBySlug(work.slug);
            const portrait = still.height > still.width;

            return (
              <figure
                key={work.slug}
                className={`group relative shrink-0 ${
                  portrait ? "w-[68vw] md:w-[27vw]" : "w-[82vw] md:w-[38vw]"
                }`}
                data-cursor={work.medium}
              >
                <div
                  data-card-media
                  className={`relative overflow-hidden rounded-sm bg-paper-2 [contain:paint] ${
                    portrait ? "aspect-[3/4]" : "aspect-[4/3]"
                  }`}
                >
                  <div
                    data-card-inner
                    className="absolute inset-0 scale-[1.16] [backface-visibility:hidden]"
                  >
                    <Image
                      src={asset(`/img/${still.slug}.jpg`)}
                      alt={`${work.title} — ${work.place}, ${work.year}`}
                      fill
                      sizes="(max-width: 768px) 80vw, 40vw"
                      placeholder="blur"
                      blurDataURL={still.blurDataURL}
                      className="object-cover transition-[filter,transform] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:saturate-[1.25]"
                    />
                  </div>
                </div>

                <figcaption
                  data-card-caption
                  className="mt-5 flex items-baseline justify-between gap-6"
                >
                  <div>
                    <h3 className="display text-3xl md:text-4xl">
                      {work.title}
                    </h3>
                    <p className="label mt-3 text-mute">{work.place}</p>
                  </div>
                  <p className={`label shrink-0 text-right ${work.accent}`}>
                    {work.no}
                    <br />
                    <span className="text-ink/50">{work.year}</span>
                  </p>
                </figcaption>
              </figure>
            );
          })}

          <div className="flex w-[40vw] shrink-0 items-center md:w-[22vw]">
            <p className="display spectrum-text text-[9vw] italic leading-none md:text-[4vw]">
              …and
              <br />
              counting
            </p>
          </div>
        </div>

        <div className="pointer-events-none absolute inset-x-6 bottom-6 flex items-center gap-5 md:inset-x-12 md:bottom-8">
          <p className="label shrink-0 text-mute">
            <span ref={countRef} className="text-ink">
              01
            </span>{" "}
            / {String(WORKS.length).padStart(2, "0")}
          </p>
          <span className="block h-0.5 flex-1 overflow-hidden rounded-full bg-ink/10">
            <span
              ref={barRef}
              className="spectrum block h-full w-full origin-left scale-x-0"
            />
          </span>
          <p className="label shrink-0 text-mute">Drag / Scroll</p>
        </div>
      </div>
    </section>
  );
}
