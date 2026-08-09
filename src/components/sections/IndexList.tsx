"use client";

import Image from "next/image";
import { useRef } from "react";
import { gsap } from "@/lib/gsap";
import { useIsomorphicLayoutEffect } from "@/hooks/useIsomorphicLayoutEffect";
import { stillBySlug } from "@/lib/media.generated";
import { WORKS } from "@/lib/site";

/**
 * The archive index: a plain editorial list until you hover a row, at which
 * point the matching frame floats in and trails the cursor.
 */
export default function IndexList() {
  const sectionRef = useRef<HTMLElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef(-1);

  useIsomorphicLayoutEffect(() => {
    const section = sectionRef.current;
    const preview = previewRef.current;
    if (!section || !preview) return;

    const ctx = gsap.context(() => {
      gsap.from("[data-index-row]", {
        yPercent: 60,
        autoAlpha: 0,
        duration: 1,
        ease: "expo.out",
        stagger: 0.07,
        scrollTrigger: { trigger: section, start: "top 70%", once: true },
      });
    }, section);

    if (!window.matchMedia("(pointer: fine)").matches) return () => ctx.revert();

    gsap.set(preview, { xPercent: -50, yPercent: -50, autoAlpha: 0, scale: 0.85 });
    const xTo = gsap.quickTo(preview, "x", { duration: 0.75, ease: "power3" });
    const yTo = gsap.quickTo(preview, "y", { duration: 0.75, ease: "power3" });

    const onMove = (e: PointerEvent) => {
      xTo(e.clientX);
      yTo(e.clientY);
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    const rows = gsap.utils.toArray<HTMLElement>(
      section.querySelectorAll("[data-index-row]")
    );

    const setActive = (index: number) => {
      if (activeRef.current === index) return;
      activeRef.current = index;

      const shown = index >= 0;
      gsap.to(preview, {
        autoAlpha: shown ? 1 : 0,
        scale: shown ? 1 : 0.85,
        duration: 0.5,
        ease: "expo.out",
      });

      gsap.utils
        .toArray<HTMLElement>(preview.querySelectorAll("[data-preview]"))
        .forEach((el, i) => {
          gsap.to(el, { autoAlpha: i === index ? 1 : 0, duration: 0.35 });
        });
    };

    const cleanups = rows.map((row, i) => {
      const enter = () => setActive(i);
      const leave = () => setActive(-1);
      row.addEventListener("pointerenter", enter);
      row.addEventListener("pointerleave", leave);
      return () => {
        row.removeEventListener("pointerenter", enter);
        row.removeEventListener("pointerleave", leave);
      };
    });

    return () => {
      window.removeEventListener("pointermove", onMove);
      cleanups.forEach((fn) => fn());
      ctx.revert();
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      id="archive"
      className="relative z-10 bg-electric px-6 py-[16vh] text-paper md:px-12"
      aria-label="Archive index"
    >
      <div className="mx-auto max-w-[110rem]">
        <div className="flex items-end justify-between gap-6">
          <h2 className="display text-[12vw] leading-[0.85] md:text-[5.5vw]">
            The <span className="italic text-sun">archive</span>
          </h2>
          <p className="label hidden text-right text-paper/60 md:block">
            Hover to preview
            <br />
            {String(WORKS.length).padStart(2, "0")} entries
          </p>
        </div>

        <ul className="mt-14">
          {WORKS.map((work) => (
            <li
              key={work.slug}
              data-index-row
              data-cursor="Open"
              className="group relative cursor-pointer border-t border-paper/20 last:border-b"
            >
              <span className="absolute inset-0 origin-left scale-x-0 bg-sun transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-x-100" />

              <div className="relative flex items-center gap-5 py-5 transition-colors duration-500 group-hover:text-ink md:gap-10 md:py-7">
                <span className="label w-8 shrink-0 opacity-60">{work.no}</span>

                <h3 className="display shrink-0 text-[7vw] leading-none transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-3 md:text-[3.4vw]">
                  {work.title}
                </h3>

                <span className="ml-auto hidden text-right md:block">
                  <span className="label block opacity-80">{work.place}</span>
                  <span className="label mt-2 block opacity-50">
                    {work.medium}
                  </span>
                </span>

                <span className="label ml-auto shrink-0 opacity-70 md:ml-0 md:w-14 md:text-right">
                  {work.year}
                </span>
              </div>

              <span className="sr-only">
                View {work.title}, {work.place}, {work.year}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div
        ref={previewRef}
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[60] hidden aspect-[4/3] w-[24vw] overflow-hidden rounded-sm opacity-0 md:block"
      >
        {WORKS.map((work) => {
          const still = stillBySlug(work.slug);
          return (
            <div
              key={work.slug}
              data-preview
              className="absolute inset-0 opacity-0"
            >
              <Image
                src={`/img/${still.slug}.jpg`}
                alt=""
                fill
                sizes="30vw"
                placeholder="blur"
                blurDataURL={still.blurDataURL}
                className="object-cover"
              />
            </div>
          );
        })}
      </div>
    </section>
  );
}
