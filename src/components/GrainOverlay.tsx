const NOISE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='240'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E";

/**
 * A whisper of film grain — enough to hide JPEG banding in the frame
 * sequences without muddying the cream sections.
 */
export default function GrainOverlay() {
  return (
    // A fixed, animated blend layer forces the whole page to recomposite every
    // frame — phones can't afford that while scrolling.
    <div className="pointer-events-none fixed inset-0 z-[80] overflow-hidden touch:hidden">
      <div
        className="absolute -inset-[50%] opacity-[0.07] mix-blend-overlay"
        style={{
          backgroundImage: `url("${NOISE}")`,
          backgroundRepeat: "repeat",
          animation: "grain-shift 0.9s steps(10) infinite",
        }}
      />
    </div>
  );
}
