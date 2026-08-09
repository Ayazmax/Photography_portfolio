"use client";

import ScrollText from "@/components/ScrollText";
import SplitLines from "@/components/SplitLines";
import ParallaxImage from "@/components/ParallaxImage";
import { SITE } from "@/lib/site";

export default function Manifesto() {
  return (
    <section
      id="statement"
      className="relative z-10 bg-paper px-6 py-[16vh] text-ink md:px-12"
    >
      <div className="mx-auto max-w-[110rem]">
        <div className="grid gap-10 md:grid-cols-12">
          <div className="md:col-span-3">
            <p className="label text-punch">(Statement)</p>
            <span className="spectrum mt-6 block h-0.5 w-full rounded-full" />
          </div>

          <div className="md:col-span-9">
            <ScrollText
              as="h2"
              dim={0.14}
              className="display text-[8.5vw] leading-[0.95] md:text-[4vw]"
            >
              I don&rsquo;t do beige. I shoot the loud bits — the first look,
              the last song, and the exact second somebody forgets there is a
              camera in the room.
            </ScrollText>
          </div>
        </div>

        <div className="mt-[14vh] grid gap-12 md:grid-cols-12 md:gap-8">
          <div className="md:col-span-5 md:col-start-1">
            <ParallaxImage
              slug="work-06"
              alt="Last Dance — Ronda, Spain, 2025"
              className="aspect-[4/5] w-full rounded-sm"
              sizes="(max-width: 768px) 100vw, 40vw"
              amount={9}
            />
            <p className="label mt-4 text-mute">
              Fig. 01 — <span className="text-punch">Ronda, Spain</span>, 2025
            </p>
          </div>

          <div className="flex flex-col justify-end md:col-span-5 md:col-start-8">
            <SplitLines
              as="p"
              className="text-lg leading-relaxed text-ink/80 md:text-xl"
            >
              {SITE.name} has spent twelve years photographing people at their
              happiest and their least composed. Weddings in olive groves,
              birthdays on rooftops, portraits in fields almost too colourful to
              be real.
            </SplitLines>

            <SplitLines
              as="p"
              className="mt-8 text-lg leading-relaxed text-mute md:text-xl"
              delay={0.05}
            >
              Nothing gets drained down to grey in post. If the day was that
              colour, that is the colour you get back — bright, warm and
              unapologetically saturated.
            </SplitLines>
          </div>
        </div>
      </div>
    </section>
  );
}
