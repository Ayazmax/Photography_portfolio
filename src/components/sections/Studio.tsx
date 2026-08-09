"use client";

import Counter from "@/components/Counter";
import Marquee from "@/components/Marquee";
import ParallaxImage from "@/components/ParallaxImage";
import ScrollText from "@/components/ScrollText";
import SplitLines from "@/components/SplitLines";
import { PRESS, SERVICES, SITE, STATS } from "@/lib/site";

const SPARKS = ["text-punch", "text-sun", "text-lagoon", "text-orchid"];

export default function Studio() {
  return (
    <section
      id="studio"
      className="relative z-10 bg-paper pt-[16vh] text-ink md:pt-[18vh]"
      aria-label="Studio"
    >
      <div className="mx-auto max-w-[110rem] px-6 md:px-12">
        <div className="grid gap-12 md:grid-cols-12 md:gap-8">
          <div className="md:col-span-4">
            <p className="label text-lagoon">(Studio)</p>
            <ParallaxImage
              slug="portrait"
              alt={`Portrait of ${SITE.name}`}
              className="mt-6 aspect-[4/5] w-full rounded-sm"
              sizes="(max-width: 768px) 100vw, 33vw"
              amount={8}
            />
          </div>

          <div className="md:col-span-7 md:col-start-6">
            <ScrollText
              as="h2"
              dim={0.14}
              className="display text-[8vw] leading-[0.95] md:text-[3.6vw]"
            >
              The studio runs on natural light, direct flash and a very good
              playlist. Two shooters, nobody posed, galleries back in
              forty-eight hours.
            </ScrollText>

            <dl className="mt-16 grid grid-cols-2 gap-y-10 border-t border-ink/12 pt-10 md:grid-cols-4">
              {STATS.map((stat, i) => (
                <div key={stat.label}>
                  <dt
                    className={`display text-5xl md:text-6xl ${SPARKS[i % SPARKS.length]}`}
                  >
                    <Counter value={stat.value} suffix={stat.suffix} />
                  </dt>
                  <dd className="label mt-3 max-w-[9rem] text-mute">
                    {stat.label}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        <ul className="mt-[14vh] grid gap-px overflow-hidden border-y border-ink/12 md:grid-cols-3">
          {SERVICES.map((service) => (
            <li
              key={service.no}
              className="group relative bg-paper px-0 py-10 md:px-8 md:first:pl-0 md:last:pr-0"
            >
              <div className="flex items-baseline gap-4">
                <span className={`label ${service.accent}`}>{service.no}</span>
                <h3 className="display text-3xl md:text-4xl">
                  {service.title}
                </h3>
              </div>
              <SplitLines
                as="p"
                className="mt-5 max-w-sm text-sm leading-relaxed text-mute"
              >
                {service.body}
              </SplitLines>
            </li>
          ))}
        </ul>
      </div>

      <Marquee className="mt-[12vh] border-y border-ink/12 py-5" duration={34}>
        {PRESS.map((name, i) => (
          <span
            key={name}
            className="label flex items-center gap-8 pr-8 text-ink/70"
          >
            {name}
            <span className={SPARKS[i % SPARKS.length]}>✦</span>
          </span>
        ))}
      </Marquee>
    </section>
  );
}
