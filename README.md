# Odessa Vane — Photographer Portfolio

A scroll-driven, frame-by-frame portfolio site for a fictional fine-art
photographer. Scroll position *is* the timeline: the hero and the case-study
section are real JPG image sequences scrubbed on a `<canvas>`, the same
technique Apple uses on its product pages.

Everything — the photographer, the photographs, the frame sequences — is
generated. Replace the eight files in `assets/` with real work and re-run one
script to make it yours.

```bash
npm install
npm run frames     # render the image sequences + optimise the stills
npm run dev
```

## The stack, and why

| Layer | Choice | Reason |
| --- | --- | --- |
| Language | TypeScript | Scroll timelines get intricate; types catch state bugs early |
| Framework | Next.js 16 (App Router) | Static export, image optimisation, one-click Vercel deploy |
| Scroll engine | GSAP 3 + ScrollTrigger | The standard for scrubbed, pinned, container-relative animation |
| Text motion | GSAP SplitText | Line and word splitting (free since GSAP 3.13) |
| Smooth scroll | Lenis | Inertial scrolling that GSAP's ticker drives directly |
| Styling | Tailwind CSS v4 | Design tokens in `globals.css`, no config file |
| Frame rendering | sharp | Builds the sequences offline so the browser only decodes JPGs |

## How the frame-by-frame animation works

There is no video anywhere on this site. A sequence is a folder of numbered
JPGs, and scroll progress picks the frame:

```
public/frames/hero/0001.jpg … 0090.jpg
public/frames/road/0001.jpg … 0072.jpg
```

Three pieces make it run:

- **`src/lib/frames.ts`** loads a sequence through a small worker pool so early
  frames arrive first, caches decoded images module-wide (the preloader and the
  canvas share one set), and falls back to the nearest decoded frame when
  scrubbing outruns the network.
- **`src/components/FrameSequence.tsx`** maps a section's scroll range onto a
  frame index with a scrubbed GSAP tween and draws cover-fit to a DPR-aware
  canvas. It finds its scroll host via `closest('[data-sequence-host]')`.
- **`scripts/build-frames.mjs`** renders the frames in the first place.

To make a section scrubbable, mark the tall parent and drop the canvas into a
sticky child:

```tsx
<section className="h-[340vh]" {...{ [SEQUENCE_HOST]: "" }}>
  <div className="sticky top-0 h-svh overflow-hidden">
    <FrameSequence sequence={sequenceByName("hero")} eager />
  </div>
</section>
```

The section's height controls how much scrolling one playthrough costs. Taller
means slower.

### Using a Higgsfield / Runway / Sora clip instead

The generator interpolates a camera move between two stills, which keeps the
repo light. If you have an actual AI-generated clip, use it directly — the
canvas player does not care where the JPGs came from.

```bash
# 90 frames, 1440px wide, from a generated clip
ffmpeg -i higgsfield-clip.mp4 \
  -vf "fps=30,scale=1440:-2" \
  -q:v 4 \
  public/frames/hero/%04d.jpg
```

Then update the frame count in `src/lib/media.generated.ts` (or add the folder
to `SEQUENCES` in `scripts/build-frames.mjs` so it is regenerated properly).

Two things matter for smoothness:

- **Frame count.** 60–120 is the sweet spot. Below ~50 the scrub looks steppy;
  above ~150 the payload stops being worth it.
- **Total weight.** Both sequences here come to about 4.5 MB. Aim to stay under
  ~8 MB, and cut resolution before you cut frames — motion reads as smoother
  than sharpness at scrub speed.

## Swapping in real photographs

1. Drop your images into `assets/` as PNG or JPG.
2. Edit `WORKS` and `SEQUENCES` in `scripts/build-frames.mjs`.
3. Run `npm run frames:force`.
4. Update the copy in `src/lib/site.ts`.

`npm run frames` writes optimised stills to `public/img/`, renders the
sequences, and regenerates `src/lib/media.generated.ts` with dimensions and
blur placeholders. Existing sequences are cached; `frames:force` rebuilds them.

## Motion inventory

| Section | Technique |
| --- | --- |
| Preloader | Real load progress from the hero sequence, then six slats wipe up |
| Hero | 90-frame "darkroom development" scrub, live frame counter |
| Statement | Word-by-word illumination tied to scroll (`ScrollText`) |
| Selected works | Sticky horizontal track with per-image counter-parallax |
| Case study | 72-frame push into the storm, colour draining to monochrome |
| Archive | Hover-follow image preview trailing the cursor |
| Studio | Count-up statistics, velocity-reactive press marquee |
| Contact | Magnetic email link, reverse marquee |
| Global | Custom cursor with contextual labels, animated film grain, vignette |

## Notes

- Every animation is behind `prefers-reduced-motion`. With it enabled, Lenis
  and the entrance animations are skipped and content renders statically.
- `src/lib/media.generated.ts` is generated. Do not hand-edit it.
- The photographer, the studio address, the press list and the photographs are
  all fictional.
