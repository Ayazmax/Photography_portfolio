"use client";

import { useRef } from "react";
import FrameSequence, { SEQUENCE_HOST } from "@/components/FrameSequence";
import { gsap } from "@/lib/gsap";
import { useIsomorphicLayoutEffect } from "@/hooks/useIsomorphicLayoutEffect";
import { sequenceByName } from "@/lib/media.generated";

const NIGHT = sequenceByName("night");

/** `at` is a fraction of the pinned scroll range; the timeline is normalised to 1. */
const BEATS = [
  {
    at: 0.06,
    lead: "Doors at six. Sun down at nine.",
    line: "We stayed till four.",
    accent: "text-sun",
  },
  {
    at: 0.36,
    lead: "Forty thousand people in a field.",
    line: "One very good song.",
    accent: "text-orchid",
  },
  {
    at: 0.66,
    lead: "Somerset, UK — 2025.",
    line: "Colour all the way up.",
    accent: "text-lagoon",
  },
];

export default function NightSequence() {
  const sectionRef = useRef<HTMLElement>(null);

  useIsomorphicLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.7,
        },
      });

      gsap.utils.toArray<HTMLElement>("[data-beat]").forEach((beat, i) => {
        const { at } = BEATS[i];
        tl.fromTo(
          beat,
          { autoAlpha: 0, yPercent: 40 },
          { autoAlpha: 1, yPercent: 0, duration: 0.12 },
          at
        ).to(beat, { autoAlpha: 0, yPercent: -40, duration: 0.12 }, at + 0.22);
      });

      tl.totalDuration(1);
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="case-study"
      className="relative h-[300vh] bg-ink"
      aria-label="Case study — Field & Fireworks"
      {...{ [SEQUENCE_HOST]: "" }}
    >
      <div className="sticky top-0 h-svh overflow-hidden">
        <FrameSequence sequence={NIGHT} />

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-ink/65 via-ink/25 to-ink/90" />

        {/* Keeps the beats legible when the sequence peaks on bright sky frames. */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(60% 34% at 50% 50%, rgba(23,18,14,0.62) 0%, rgba(23,18,14,0.28) 55%, rgba(23,18,14,0) 100%)",
          }}
        />

        <div className="relative flex h-full flex-col justify-between px-6 py-8 text-paper md:px-12 md:py-12">
          <p className="label text-paper/70">(Case study — Field &amp; Fireworks)</p>

          <div className="pointer-events-none absolute inset-x-6 top-1/2 -translate-y-1/2 md:inset-x-12">
            {BEATS.map((beat) => (
              <div
                key={beat.lead}
                data-beat
                className="absolute inset-x-0 top-1/2 -translate-y-1/2 text-center [text-shadow:0_2px_28px_rgba(23,18,14,0.75)]"
              >
                <p
                  className={`label inline-block rounded-full bg-ink/75 px-4 py-2 backdrop-blur-sm ${beat.accent}`}
                >
                  {beat.lead}
                </p>
                <p className="display mt-5 text-[11vw] leading-[0.9] text-paper md:text-[5.5vw]">
                  {beat.line}
                </p>
              </div>
            ))}
          </div>

          <div className="flex items-end justify-between gap-6">
            <p className="label text-paper/60">
              Field &amp; Fireworks
              <br />
              <span className="text-paper">Somerset, UK · 2025</span>
            </p>
            <p className="label hidden max-w-[16rem] text-right text-paper/60 sm:block">
              {NIGHT.frames} frames, scrubbed by your scroll wheel
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
