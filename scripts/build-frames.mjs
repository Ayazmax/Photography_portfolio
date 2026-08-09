/**
 * Renders scroll-scrubbable JPG frame sequences and optimised gallery stills.
 *
 * Each sequence interpolates a camera move + a colour ramp between two source
 * stills, so the canvas player has real frames to scrub through. Swap the
 * `from`/`to` stills (or point a sequence at an ffmpeg-extracted folder, see
 * README) to change the footage without touching the components.
 *
 *   node scripts/build-frames.mjs [--force]
 */

import sharp from "sharp";
import { mkdir, rm, writeFile, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const SRC = path.join(ROOT, "assets");
const PUBLIC = path.join(ROOT, "public");
const FORCE = process.argv.includes("--force");

/* ---------------------------------------------------------------- easings */

const clamp01 = (v) => Math.min(1, Math.max(0, v));
const lerp = (a, b, t) => a + (b - a) * t;
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
const easeInOutCubic = (t) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

/** Smooth 0→1 ramp between two scroll positions. */
const smoothstep = (edge0, edge1, t) => {
  const x = clamp01((t - edge0) / (edge1 - edge0));
  return x * x * (3 - 2 * x);
};

/* -------------------------------------------------------------- sequences */

const SEQUENCES = [
  {
    name: "hero",
    from: "seq-day.png",
    to: "seq-night.png",
    frames: 90,
    width: 1440,
    height: 900,
    quality: 68,
    /**
     * "Golden hour into the dance floor" — the whole wedding day in one scroll.
     * Opens sun-blown and soft, resolves into focus, then dissolves into the
     * neon reception with the colour pushed further at every step.
     */
    at(t) {
      const settle = easeOutCubic(clamp01(t / 0.4));
      const drift = easeOutCubic(t);
      const dusk = smoothstep(0.15, 0.85, t);
      return {
        a: {
          zoom: lerp(1.3, 1.05, drift),
          panX: lerp(0.05, -0.04, drift),
          panY: lerp(-0.05, 0.02, drift),
          blur: lerp(9, 0.3, settle),
          brightness: lerp(1.28, 0.98, settle),
          saturation: lerp(0.85, 1.3, dusk),
          contrast: lerp(0.86, 1.08, settle),
          lift: lerp(14, -2, settle),
        },
        b: {
          zoom: lerp(1.24, 1.0, drift),
          panX: lerp(-0.07, 0.05, drift),
          panY: 0,
          blur: lerp(6, 0.3, smoothstep(0.55, 0.92, t)),
          brightness: 1.06,
          saturation: 1.4,
          contrast: 1.1,
          lift: -2,
        },
        mix: smoothstep(0.5, 0.96, t),
      };
    },
  },
  {
    name: "night",
    from: "seq-field.png",
    to: "seq-lights.png",
    frames: 72,
    width: 1280,
    height: 720,
    quality: 66,
    /**
     * "Field & fireworks" — pushes into a sunset crowd while the sky burns
     * hotter, then cuts the sun and lands in the lasers.
     */
    at(t) {
      const push = easeInOutCubic(t);
      const burn = smoothstep(0.05, 0.7, t);
      return {
        a: {
          zoom: lerp(1.0, 1.42, push),
          panX: 0,
          panY: lerp(0.05, -0.05, push),
          blur: lerp(0.3, 1.8, push),
          brightness: lerp(1.02, 0.86, burn),
          saturation: lerp(1.08, 1.45, burn),
          contrast: lerp(1.0, 1.14, burn),
          lift: lerp(2, -6, burn),
        },
        b: {
          zoom: lerp(1.32, 1.0, push),
          panX: 0,
          panY: 0,
          blur: lerp(4, 0.3, smoothstep(0.45, 0.9, t)),
          brightness: 1.04,
          saturation: 1.42,
          contrast: 1.1,
          lift: -2,
        },
        mix: smoothstep(0.44, 0.94, t),
      };
    },
  },
];

/* ------------------------------------------------------------ gallery data */

const WORKS = [
  "work-01.png",
  "work-02.png",
  "work-03.png",
  "work-04.png",
  "work-05.png",
  "work-06.png",
  "work-07.png",
  "portrait.png",
];

/* ----------------------------------------------------------------- render */

/**
 * Crops a cover-fit window out of the source, applies the camera move, then
 * the tone ramp. Returns a raw PNG buffer so layers composite losslessly.
 */
async function renderLayer(input, meta, target, p) {
  const { width: W, height: H } = target;
  const targetAR = W / H;

  let cw = meta.width;
  let ch = meta.height;
  if (meta.width / meta.height > targetAR) cw = meta.height * targetAR;
  else ch = meta.width / targetAR;

  cw /= p.zoom;
  ch /= p.zoom;

  const maxX = meta.width - cw;
  const maxY = meta.height - ch;
  const left = Math.round(clamp01(0.5 + p.panX / 2) * maxX);
  const top = Math.round(clamp01(0.5 + p.panY / 2) * maxY);

  let pipe = sharp(input)
    .extract({
      left,
      top,
      width: Math.max(1, Math.round(cw)),
      height: Math.max(1, Math.round(ch)),
    })
    .resize(W, H, { fit: "fill", kernel: "lanczos3" });

  if (p.blur > 0.3) pipe = pipe.blur(p.blur);

  return pipe
    .modulate({ brightness: p.brightness, saturation: p.saturation })
    .linear(p.contrast, p.lift)
    .png({ compressionLevel: 0 })
    .toBuffer();
}

async function buildSequence(seq) {
  const outDir = path.join(PUBLIC, "frames", seq.name);

  if (existsSync(outDir) && !FORCE) {
    const existing = (await readdir(outDir)).filter((f) => f.endsWith(".jpg"));
    if (existing.length === seq.frames) {
      console.log(`· ${seq.name}: ${existing.length} frames cached (--force to rebuild)`);
      return;
    }
  }

  await rm(outDir, { recursive: true, force: true });
  await mkdir(outDir, { recursive: true });

  const fromPath = path.join(SRC, seq.from);
  const toPath = path.join(SRC, seq.to);
  const fromMeta = await sharp(fromPath).metadata();
  const toMeta = await sharp(toPath).metadata();

  const target = { width: seq.width, height: seq.height };
  const started = Date.now();

  const renderFrame = async (i) => {
    const t = seq.frames === 1 ? 0 : i / (seq.frames - 1);
    const p = seq.at(t);
    const file = path.join(outDir, `${String(i + 1).padStart(4, "0")}.jpg`);

    let base;
    if (p.mix >= 0.999) {
      base = await renderLayer(toPath, toMeta, target, p.b);
    } else {
      base = await renderLayer(fromPath, fromMeta, target, p.a);
      if (p.mix > 0.001) {
        const over = await sharp(
          await renderLayer(toPath, toMeta, target, p.b)
        )
          .removeAlpha()
          .ensureAlpha(p.mix)
          .png({ compressionLevel: 0 })
          .toBuffer();
        base = await sharp(base)
          .composite([{ input: over, blend: "over" }])
          .png({ compressionLevel: 0 })
          .toBuffer();
      }
    }

    await sharp(base)
      .jpeg({ quality: seq.quality, mozjpeg: true, progressive: true })
      .toFile(file);
  };

  // Small pool — sharp is already multi-threaded per op.
  const POOL = 4;
  let next = 0;
  await Promise.all(
    Array.from({ length: POOL }, async () => {
      while (next < seq.frames) await renderFrame(next++);
    })
  );

  const bytes = (await readdir(outDir, { withFileTypes: true })).length;
  console.log(
    `✓ ${seq.name}: ${bytes} frames @ ${seq.width}×${seq.height} in ${(
      (Date.now() - started) / 1000
    ).toFixed(1)}s`
  );
}

/* -------------------------------------------------------------- gallery */

async function buildGallery() {
  const outDir = path.join(PUBLIC, "img");
  await mkdir(outDir, { recursive: true });

  const entries = [];
  for (const file of WORKS) {
    const src = path.join(SRC, file);
    const slug = path.basename(file, ".png");
    const meta = await sharp(src).metadata();
    const portrait = meta.height > meta.width;
    const box = portrait ? { height: 1800 } : { width: 1800 };

    const out = await sharp(src)
      .resize({ ...box, withoutEnlargement: true, kernel: "lanczos3" })
      .jpeg({ quality: 80, mozjpeg: true, progressive: true })
      .toBuffer({ resolveWithObject: true });

    await writeFile(path.join(outDir, `${slug}.jpg`), out.data);

    // Tiny LQIP so images fade in from a blur instead of popping.
    const lqip = await sharp(src)
      .resize(20, null, { fit: "inside" })
      .jpeg({ quality: 40 })
      .toBuffer();

    entries.push({
      slug,
      width: out.info.width,
      height: out.info.height,
      blurDataURL: `data:image/jpeg;base64,${lqip.toString("base64")}`,
    });
  }

  console.log(`✓ gallery: ${entries.length} stills optimised`);
  return entries;
}

/* ------------------------------------------------------------------ main */

async function main() {
  if (!existsSync(SRC)) throw new Error(`Missing source folder: ${SRC}`);

  const gallery = await buildGallery();
  for (const seq of SEQUENCES) await buildSequence(seq);

  const sequences = SEQUENCES.map((s) => ({
    name: s.name,
    frames: s.frames,
    width: s.width,
    height: s.height,
  }));

  const banner = "// AUTO-GENERATED by scripts/build-frames.mjs — do not edit.\n";
  await writeFile(
    path.join(ROOT, "src", "lib", "media.generated.ts"),
    banner +
      `\nexport type SequenceMeta = {\n  name: string;\n  frames: number;\n  width: number;\n  height: number;\n};\n\n` +
      `export type StillMeta = {\n  slug: string;\n  width: number;\n  height: number;\n  blurDataURL: string;\n};\n\n` +
      `export const SEQUENCES = ${JSON.stringify(sequences, null, 2)} as const satisfies readonly SequenceMeta[];\n\n` +
      `export const STILLS = ${JSON.stringify(gallery, null, 2)} as const satisfies readonly StillMeta[];\n\n` +
      `export const stillBySlug = (slug: string): StillMeta =>\n` +
      `  STILLS.find((s) => s.slug === slug) ?? STILLS[0];\n\n` +
      `export const sequenceByName = (name: string): SequenceMeta =>\n` +
      `  SEQUENCES.find((s) => s.name === name) ?? SEQUENCES[0];\n`,
    "utf8"
  );

  console.log("✓ wrote src/lib/media.generated.ts");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
