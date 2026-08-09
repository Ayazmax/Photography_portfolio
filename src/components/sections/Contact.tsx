"use client";

import Magnetic from "@/components/Magnetic";
import Marquee from "@/components/Marquee";
import SplitLines from "@/components/SplitLines";
import { SITE } from "@/lib/site";

const SOCIALS = [
  { label: "Instagram", href: "https://instagram.com" },
  { label: "TikTok", href: "https://tiktok.com" },
  { label: "Newsletter", href: "#" },
];

export default function Contact() {
  return (
    <footer
      id="contact"
      className="relative z-10 bg-punch pt-[16vh] text-ink"
      aria-label="Contact"
    >
      <div className="mx-auto max-w-[110rem] px-6 md:px-12">
        <p className="label text-ink/70">(Contact)</p>

        <SplitLines
          as="h2"
          className="display mt-8 text-[13vw] leading-[0.85] md:text-[7vw]"
          stagger={0.1}
        >
          Let&rsquo;s make something
          <br />
          <span className="italic text-paper">loud and very colourful.</span>
        </SplitLines>

        <div className="mt-16 flex flex-wrap items-end justify-between gap-10 border-t border-ink/25 pt-10">
          <Magnetic>
            <a
              href={`mailto:${SITE.email}`}
              data-cursor="Write"
              className="group inline-flex flex-col"
            >
              <span className="label text-ink/70">Bookings</span>
              <span className="display mt-3 text-[7vw] leading-none md:text-[3.2vw]">
                {SITE.email}
              </span>
              <span className="mt-3 block h-0.5 w-full origin-left scale-x-0 bg-ink transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-x-100" />
            </a>
          </Magnetic>

          <div className="text-right">
            <p className="label text-ink/70">Studio</p>
            <p className="mt-3 text-sm leading-relaxed text-ink/85">
              Rua da Boavista 84
              <br />
              1200-068 Lisboa, Portugal
              <br />
              <a
                href={`tel:${SITE.phone.replace(/\s/g, "")}`}
                data-cursor="Call"
                className="transition-colors hover:text-paper"
              >
                {SITE.phone}
              </a>
            </p>
          </div>
        </div>
      </div>

      <Marquee
        className="mt-[12vh] border-y border-ink/25 py-6"
        duration={30}
        reverse
      >
        <span className="display flex items-center gap-10 pr-10 text-[9vw] leading-none md:text-[4.5vw]">
          Booking weddings &amp; parties
          <span className="text-paper">✦</span>
          <span className="italic text-sun">2026</span>
          <span className="text-paper">✦</span>
        </span>
      </Marquee>

      <div className="mx-auto max-w-[110rem] px-6 py-10 md:px-12">
        <div className="flex flex-wrap items-end justify-between gap-8">
          <ul className="flex flex-wrap gap-6">
            {SOCIALS.map((social) => (
              <li key={social.label}>
                <a
                  href={social.href}
                  target={social.href.startsWith("http") ? "_blank" : undefined}
                  rel="noreferrer"
                  data-cursor="Visit"
                  className="label text-ink/85 transition-colors hover:text-paper"
                >
                  {social.label}
                </a>
              </li>
            ))}
          </ul>

          <p className="label text-right text-ink/85">
            © {new Date().getFullYear()} {SITE.name} — All rights reserved
            <br />
            <span className="text-paper/75">
              Frame sequences rendered from the original stills
            </span>
          </p>
        </div>
      </div>
    </footer>
  );
}
