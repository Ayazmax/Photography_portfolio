"use client";

import { useEffect, useRef, useState } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { useIsomorphicLayoutEffect } from "@/hooks/useIsomorphicLayoutEffect";
import { scrollToSection } from "@/lib/smooth";
import { NAV, SITE } from "@/lib/site";

/** Everything here is white and blended, so it inverts against any section. */
function LisbonClock() {
  const [time, setTime] = useState("");

  // Rendered client-side only — a server-rendered clock would hydrate stale.
  useEffect(() => {
    const format = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/Lisbon",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
    const update = () => setTime(format.format(new Date()));
    update();
    const id = window.setInterval(update, 1000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <span className="tabular-nums">{time || "--:--:--"}</span>
  );
}

export default function Nav() {
  const ref = useRef<HTMLElement>(null);

  useIsomorphicLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const ctx = gsap.context(() => {
      const show = gsap.to(el, {
        yPercent: -130,
        duration: 0.5,
        ease: "power3.inOut",
        paused: true,
      });

      ScrollTrigger.create({
        start: "top -120",
        end: "max",
        onUpdate: (self) => {
          if (self.direction === 1) show.play();
          else show.reverse();
        },
        onLeaveBack: () => show.reverse(),
      });
    }, el);

    return () => ctx.revert();
  }, []);

  return (
    <header
      ref={ref}
      // A fixed blend layer makes phones recomposite everything beneath it on
      // every scroll frame, so touch gets a plain scrim instead.
      className="fixed inset-x-0 top-0 z-[70] mix-blend-difference touch:bg-gradient-to-b touch:from-ink/70 touch:to-transparent touch:mix-blend-normal"
    >
      <nav className="flex items-center justify-between gap-6 px-6 py-6 md:px-12">
        <button
          type="button"
          onClick={() => scrollToSection("#index")}
          data-cursor="Top"
          className="label text-white transition-opacity hover:opacity-60"
        >
          {SITE.name}
          <span className="ml-3 hidden opacity-60 sm:inline">
            © {SITE.since}
          </span>
        </button>

        <ul className="hidden items-center gap-8 md:flex">
          {NAV.map((item) => (
            <li key={item.href}>
              <button
                type="button"
                onClick={() => scrollToSection(item.href)}
                data-cursor="Go"
                className="label group relative text-white"
              >
                {item.label}
                <span className="absolute -bottom-1 left-0 h-px w-0 bg-white transition-[width] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:w-full" />
              </button>
            </li>
          ))}
        </ul>

        <p className="label text-right text-white">
          {SITE.bases[0]} <LisbonClock />
        </p>
      </nav>
    </header>
  );
}
