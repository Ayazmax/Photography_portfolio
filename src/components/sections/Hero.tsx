"use client";

import { useRef } from "react";
import { gsap, isTouchDevice, prefersReducedMotion } from "@/lib/gsap";
import { useIsomorphicLayoutEffect } from "@/hooks/useIsomorphicLayoutEffect";
import { onReady } from "@/lib/ready";
import { HERO_SCENES } from "@/lib/scenes";
import { SITE } from "@/lib/site";
import { scrollToY } from "@/lib/smooth";

/**
 * Layer depth in px against the stage's 1200px perspective. The plate sits
 * behind the type, the cutout stands in front of it — so a cast crossing the
 * frame always passes over its own headline.
 */
const DEPTH = { plate: -220, title: -80, cast: 110 } as const;

/** Counter-scale, so layers pushed away from the camera still fill the stage. */
const REST = { plate: 1.28, title: 1.06, cast: 1 } as const;

const COUNT = HERO_SCENES.length;
const SLOT = 1 / COUNT;
/**
 * How long a layer spends sliding into (or out of) the composition. Kept
 * shorter than HOLD so two scenes only briefly share the stage mid-cross
 * instead of stacking into a double-exposure soup.
 */
const TRAVEL = SLOT * 0.38;
/** Half the dwell at dead centre, where the layers read as one photograph. */
const HOLD = SLOT * 0.22;

/** Where a beat is fully composed, as a fraction of the pinned scroll range. */
const centre = (i: number) => (i + 0.5) / COUNT;

/** Progress values that read as a clean, locked frame. */
const LOCKS = Array.from({ length: COUNT }, (_, i) => centre(i));

/**
 * How long after the wheel/touch settles before we pull to the nearest lock.
 * Needs a beat longer than Lenis's residual lerp so we don't fight it.
 */
const SNAP_IDLE_MS = 140;
/** Don't bother snapping for noise smaller than this (timeline progress). */
const SNAP_EPS = 0.012;

/**
 * Off-stage pose for a whole beat. `side` is -1 for stage left, +1 for stage
 * right; plates + headlines go one way while the cutout goes the other so the
 * two lock up by crossing each other.
 *
 * Layers keep full opacity while travelling — we only fade at the very edges —
 * so the cross reads as solid PNGs rotating through the stage, not a double-exposure.
 */
const away = (side: number) => ({
  plate: {
    xPercent: 58 * side,
    rotateY: -8 * side,
    scale: REST.plate * 1.1,
  },
  title: {
    xPercent: 96 * side,
    rotateY: -28 * side,
    scale: REST.title * 0.88,
  },
  cast: {
    xPercent: -92 * side,
    rotateY: 24 * side,
    scale: REST.cast * 0.8,
  },
});

export default function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const counterRef = useRef<HTMLSpanElement>(null);
  const kickerRef = useRef<HTMLParagraphElement>(null);
  const placeRef = useRef<HTMLParagraphElement>(null);
  const cueRef = useRef<HTMLDivElement>(null);
  const beatRef = useRef(0);

  useIsomorphicLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    let snapTimer: ReturnType<typeof setTimeout> | null = null;
    let snapping = false;
    // Programmatic scrolls during native touch momentum get cancelled or
    // fought by the browser, which reads as the page sticking.
    const canSnap = !isTouchDevice();

    const paintBeat = (i: number) => {
      beatRef.current = i;
      const scene = HERO_SCENES[i];
      if (counterRef.current) {
        counterRef.current.textContent = String(i + 1).padStart(2, "0");
      }
      if (kickerRef.current) {
        kickerRef.current.textContent = scene.kicker;
        kickerRef.current.style.color = scene.tint;
      }
      if (placeRef.current) {
        placeRef.current.textContent = `${scene.place} · ${scene.year}`;
      }
    };

    const ctx = gsap.context((self) => {
      const parts = gsap.utils
        .toArray<HTMLElement>("[data-scene]")
        .map((scene) => ({
          plate: scene.querySelector<HTMLElement>("[data-plate]")!,
          title: scene.querySelector<HTMLElement>("[data-title]")!,
          cast: scene.querySelector<HTMLElement>("[data-cast]")!,
        }));

      // Park each layer at its resting depth once. Only x, rotation, scale and
      // alpha move after this, so GSAP keeps one matrix per layer.
      parts.forEach(({ plate, title, cast }) => {
        gsap.set(plate, {
          z: DEPTH.plate,
          scale: REST.plate,
          transformOrigin: "50% 50%",
          force3D: true,
        });
        gsap.set(title, {
          z: DEPTH.title,
          scale: REST.title,
          transformOrigin: "50% 50%",
          force3D: true,
        });
        gsap.set(cast, {
          z: DEPTH.cast,
          scale: REST.cast,
          transformOrigin: "50% 88%",
          force3D: true,
        });
      });

      const layers = (i: number) => {
        const { plate, title, cast } = parts[i];
        return [plate, title, cast];
      };

      // Opening beat composed; the rest wait off-stage with full alpha so the
      // first frame of their enter is already solid.
      gsap.set(layers(0), { xPercent: 0, yPercent: 0, rotateY: 0, autoAlpha: 1 });
      parts.forEach((_, i) => {
        if (i === 0) return;
        gsap.set(layers(i), { autoAlpha: 0 });
      });
      paintBeat(0);

      if (prefersReducedMotion()) return;

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: "bottom bottom",
          // Lenis already eases the scroll. A second scrub lerp would lag these
          // 3D layers behind the sticky stage.
          scrub: true,
          onUpdate: (self) => {
            const i = gsap.utils.clamp(
              0,
              COUNT - 1,
              Math.round(self.progress * COUNT - 0.5)
            );
            if (i !== beatRef.current) paintBeat(i);

            // Auto-lock to the nearest composed beat once the scroll settles,
            // so a short flick mid-cross always lands on a perfect frame.
            if (!canSnap || snapping || !self.isActive) return;
            if (snapTimer) clearTimeout(snapTimer);
            snapTimer = setTimeout(() => {
              if (!self.isActive || snapping) return;

              // Scrolling past the last lock to leave the section — don't pull back.
              const last = LOCKS[COUNT - 1];
              if (self.direction === 1 && self.progress > last + SLOT * 0.4) {
                return;
              }

              const target = gsap.utils.snap(LOCKS, self.progress);
              if (Math.abs(target - self.progress) < SNAP_EPS) return;

              snapping = true;
              const y = self.start + (self.end - self.start) * target;
              scrollToY(y, {
                duration: 0.65,
                onComplete: () => {
                  snapping = false;
                },
              });
            }, SNAP_IDLE_MS);
          },
          onLeave: () => {
            if (snapTimer) clearTimeout(snapTimer);
            snapping = false;
          },
          onLeaveBack: () => {
            if (snapTimer) clearTimeout(snapTimer);
            snapping = false;
          },
        },
      });

      // Anchor the timeline to the full range so skipped enter/exit still land
      // at honest fractions of the pin.
      tl.to({}, { duration: 1 }, 0);

      // Fade the scroll cue once the visitor starts moving.
      if (cueRef.current) {
        tl.to(cueRef.current, { autoAlpha: 0, duration: TRAVEL * 0.6 }, SLOT * 0.15);
      }

      parts.forEach(({ plate, title, cast }, i) => {
        // Alternate arrival side so the four beats read as a rotation through
        // the stage, not the same slide four times.
        const dir = i % 2 === 0 ? 1 : -1;
        const c = centre(i);
        const from = away(-dir);
        const to = away(dir);

        const enterAt = c - HOLD - TRAVEL;
        if (enterAt >= 0) {
          const ease = "power3.out";
          // Cutout leads the plate by a beat so the cross feels intentional.
          const castLead = TRAVEL * 0.08;
          const titleLag = TRAVEL * 0.1;

          tl.fromTo(
            cast,
            { ...from.cast, autoAlpha: 0 },
            {
              xPercent: 0,
              rotateY: 0,
              scale: REST.cast,
              autoAlpha: 1,
              duration: TRAVEL,
              ease,
            },
            enterAt
          )
            .fromTo(
              plate,
              { ...from.plate, autoAlpha: 0 },
              {
                xPercent: 0,
                rotateY: 0,
                scale: REST.plate,
                autoAlpha: 1,
                duration: TRAVEL,
                ease,
              },
              enterAt + castLead
            )
            .fromTo(
              title,
              { ...from.title, autoAlpha: 0 },
              {
                xPercent: 0,
                rotateY: 0,
                scale: REST.title,
                autoAlpha: 1,
                duration: TRAVEL * 0.95,
                ease,
              },
              enterAt + titleLag
            )
            .fromTo(
              cast,
              { scale: REST.cast * 0.96 },
              { scale: REST.cast, duration: TRAVEL * 0.35, ease: "back.out(1.6)" },
              c - HOLD
            );
        }

        const exitAt = c + HOLD;
        if (exitAt + TRAVEL <= 1.001) {
          const ease = "power3.in";
          tl.to(
            cast,
            { ...to.cast, autoAlpha: 0, duration: TRAVEL, ease },
            exitAt
          )
            .to(
              plate,
              { ...to.plate, autoAlpha: 0, duration: TRAVEL, ease },
              exitAt + TRAVEL * 0.06
            )
            .to(
              title,
              { ...to.title, autoAlpha: 0, duration: TRAVEL * 0.9, ease },
              exitAt + TRAVEL * 0.08
            );
        }
      });

      // Beat 0 never scrolls in, so it gets its own curtain-lift entrance.
      return onReady(() =>
        self.add(() => {
          const { plate, title, cast } = parts[0];
          gsap
            .timeline({ defaults: { ease: "expo.out", duration: 1.55 } })
            .from(
              plate,
              { xPercent: -28, scale: REST.plate * 1.14, rotateY: 11 },
              0
            )
            .from(cast, { xPercent: 48, autoAlpha: 0, rotateY: -14 }, 0.05)
            .from(title, { xPercent: -52, autoAlpha: 0, rotateY: 14 }, 0.14)
            .from(
              "[data-chrome]",
              { autoAlpha: 0, y: 12, duration: 0.9, stagger: 0.08 },
              0.35
            );
        })
      );
    }, section);

    return () => {
      if (snapTimer) clearTimeout(snapTimer);
      ctx.revert();
    };
  }, []);

  const first = HERO_SCENES[0];

  return (
    <section
      ref={sectionRef}
      id="index"
      className="relative bg-ink"
      style={{ height: `${COUNT * 110 + 30}vh` }}
      aria-label="Introduction"
    >
      <div className="sticky top-0 h-svh overflow-hidden [perspective:1200px] [perspective-origin:50%_48%]">
        {/* Soft side vignettes — reads like looking through a lens. */}
        <div
          className="pointer-events-none absolute inset-0 z-30"
          style={{
            background:
              "radial-gradient(85% 70% at 50% 48%, transparent 48%, rgba(23,18,14,0.55) 100%)",
          }}
          aria-hidden
        />

        {HERO_SCENES.map((scene, i) => (
          <div
            key={scene.slug}
            data-scene
            className="absolute inset-0 [transform-style:preserve-3d]"
            style={{ zIndex: i + 1 }}
          >
            <div data-plate className="absolute inset-[-14%]">
              <img
                src={scene.plate.src}
                width={scene.plate.width}
                height={scene.plate.height}
                alt=""
                draggable={false}
                fetchPriority={i === 0 ? "high" : "low"}
                decoding="async"
                className="h-full w-full object-cover"
              />
              <div
                className="absolute inset-0 mix-blend-soft-light opacity-80 touch:hidden"
                style={{
                  background: `radial-gradient(65% 55% at 50% 50%, ${scene.tint} 0%, transparent 72%)`,
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/5 to-ink/45" />
            </div>

            <div
              data-title
              className="pointer-events-none absolute inset-0 flex items-start justify-center pt-[16vh] md:pt-[14vh]"
            >
              <p
                className={`display max-w-[18ch] px-4 text-center leading-[0.8] text-paper [text-shadow:0_3px_0_rgba(23,18,14,0.2),0_16px_70px_rgba(23,18,14,0.75)] touch:[text-shadow:0_3px_18px_rgba(23,18,14,0.6)] ${
                  scene.wordmark
                    ? "text-[16vw] md:text-[10.5vw]"
                    : "text-[11vw] uppercase tracking-[-0.01em] md:text-[7.2vw]"
                }`}
              >
                {scene.wordmark ? (
                  <>
                    {SITE.first}
                    <br />
                    <span className="italic text-sun">{SITE.last}</span>
                  </>
                ) : (
                  scene.title
                )}
              </p>
            </div>

            <div
              data-cast
              className="pointer-events-none absolute inset-0 flex items-end justify-center"
            >
              <div className="relative flex h-[54vh] items-end pb-[7vh] md:h-[68vh] md:pb-[6vh]">
                {/* Contact shadow — pins the cutout to the plate. */}
                <span
                  className="absolute bottom-[2%] left-1/2 h-[8%] w-[72%] -translate-x-1/2 rounded-[50%] bg-ink/80 blur-3xl touch:hidden"
                  aria-hidden
                />
                <img
                  src={scene.cast.src}
                  width={scene.cast.width}
                  height={scene.cast.height}
                  alt={`${scene.kicker} — ${scene.place}, ${scene.year}`}
                  draggable={false}
                  fetchPriority={i === 0 ? "high" : "low"}
                  decoding="async"
                  className="relative h-full w-auto max-w-[92vw] object-contain drop-shadow-[0_28px_50px_rgba(23,18,14,0.55)] touch:drop-shadow-none"
                />
              </div>
            </div>
          </div>
        ))}

        {/* Flat HUD — not in 3D, so perspective never shoves labels off-screen. */}
        <div className="pointer-events-none absolute inset-0 z-50 flex flex-col justify-between px-6 pb-8 pt-24 text-paper md:px-12 md:pb-10 md:pt-28">
          <div
            data-chrome
            className="flex items-start justify-between gap-6"
          >
            <div className="min-w-0 max-w-[55%] shrink">
              <p
                ref={kickerRef}
                className="label tracking-[0.22em]"
                style={{ color: first.tint }}
              >
                {first.kicker}
              </p>
              <p
                ref={placeRef}
                className="mt-2 text-sm leading-snug text-paper/85 md:text-base"
              >
                {first.place} · {first.year}
              </p>
            </div>

            <div className="label shrink-0 text-right">
              <p>
                <span ref={counterRef}>01</span>
                <span className="text-paper/45">
                  {" / "}
                  {String(COUNT).padStart(2, "0")}
                </span>
              </p>
              <p className="mt-2 text-paper/50">ƒ/1.4 · 1/200 · ISO 1600</p>
            </div>
          </div>

          <div className="flex items-end justify-between gap-8">
            <p data-chrome className="label max-w-[14rem] text-paper/70">
              {SITE.role}
              <br />
              <span className="text-paper/45">{SITE.bases.join(" / ")}</span>
            </p>

            <div
              ref={cueRef}
              data-chrome
              className="hidden shrink-0 flex-col items-end gap-3 md:flex"
            >
              <span className="label text-paper/70">Scroll to cross the frame</span>
              <span className="relative block h-16 w-0.5 overflow-hidden rounded-full bg-paper/20">
                <span className="absolute inset-x-0 top-0 h-1/3 animate-[aperture-pulse_2s_ease-in-out_infinite] rounded-full bg-paper" />
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
