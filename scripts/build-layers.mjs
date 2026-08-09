/**
 * Builds the hero's layered scenes.
 *
 * Subjects are shot against a flat chroma-green backdrop; this pulls a soft
 * alpha key, despills the green fringe, trims the transparent margin and emits
 * a lightweight WebP cutout. Plates are the background photographs behind them.
 *
 * Both land in public/layers, with dimensions written to
 * src/lib/layers.generated.ts so the hero can size each layer without a
 * layout-shifting measure pass.
 *
 *   node scripts/build-layers.mjs [--force]
 */

import sharp from "sharp";
import { mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const SRC = path.join(ROOT, "assets");
const OUT = path.join(ROOT, "public", "layers");
const FORCE = process.argv.includes("--force");

/* ------------------------------------------------------------------ scenes */

/**
 * `cast` is the keyed foreground, `plate` the background photograph. Each pair
 * crosses through the centre of the hero stage on its own scroll beat.
 */
const SCENES = [
  { slug: "first-look", plate: "plate-01.png", cast: "cast-01.png" },
  { slug: "rooftop", plate: "plate-02.png", cast: "cast-02.png" },
  { slug: "field", plate: "plate-03.png", cast: "cast-03.png" },
  { slug: "colour", plate: "plate-04.png", cast: "cast-04.png" },
];

/* --------------------------------------------------------------- chroma key */

/**
 * Alpha ramps between `soft` and `hard` greenness so hair and chiffon keep a
 * feathered edge instead of a cutout stair-step. Greenness is how far the green
 * channel runs ahead of the strongest of the other two.
 */
const KEY = { soft: 14, hard: 58 };

async function keyCutout(file) {
  const { data, info } = await sharp(file)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;

  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;

  for (let i = 0, px = 0; i < data.length; i += channels, px++) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const rival = Math.max(r, b);
    const green = g - rival;

    let alpha = 255;
    if (green >= KEY.hard) alpha = 0;
    else if (green > KEY.soft) {
      alpha = Math.round(255 * (1 - (green - KEY.soft) / (KEY.hard - KEY.soft)));
    }

    if (alpha === 0) {
      // Zero the colour too, so scaling can't smear green back into the edge.
      data[i] = data[i + 1] = data[i + 2] = 0;
    } else if (green > 0) {
      // Despill: bleed the surplus green back down toward the rival channel.
      data[i + 1] = Math.round(g - (g - rival) * Math.min(1, green / KEY.hard));
    }

    data[i + 3] = alpha;

    if (alpha > 8) {
      const x = px % width;
      const y = (px - x) / width;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }

  if (maxX < 0) throw new Error(`${path.basename(file)}: keyed to nothing`);

  const pad = 2;
  const left = Math.max(0, minX - pad);
  const top = Math.max(0, minY - pad);

  return sharp(data, { raw: { width, height, channels } }).extract({
    left,
    top,
    width: Math.min(width - left, maxX - minX + pad * 2),
    height: Math.min(height - top, maxY - minY + pad * 2),
  });
}

/* ------------------------------------------------------------------ output */

const lqip = async (pipe) =>
  `data:image/webp;base64,${(
    await pipe
      .clone()
      .resize(24, null, { fit: "inside" })
      .webp({ quality: 30, alphaQuality: 40 })
      .toBuffer()
  ).toString("base64")}`;

async function buildCast(file, slug) {
  const keyed = await keyCutout(path.join(SRC, file));
  const pipe = keyed.resize({ height: 1700, withoutEnlargement: true });

  const out = await pipe
    .clone()
    .webp({ quality: 86, alphaQuality: 96, effort: 5 })
    .toBuffer({ resolveWithObject: true });

  await writeFile(path.join(OUT, `${slug}-cast.webp`), out.data);

  return {
    src: `/layers/${slug}-cast.webp`,
    width: out.info.width,
    height: out.info.height,
    blurDataURL: await lqip(pipe),
  };
}

async function buildPlate(file, slug) {
  const pipe = sharp(path.join(SRC, file)).resize({
    width: 2000,
    withoutEnlargement: true,
    kernel: "lanczos3",
  });

  const out = await pipe
    .clone()
    .jpeg({ quality: 82, mozjpeg: true, progressive: true })
    .toBuffer({ resolveWithObject: true });

  await writeFile(path.join(OUT, `${slug}-plate.jpg`), out.data);

  return {
    src: `/layers/${slug}-plate.jpg`,
    width: out.info.width,
    height: out.info.height,
    blurDataURL: await lqip(pipe),
  };
}

/* -------------------------------------------------------------------- main */

async function main() {
  await mkdir(OUT, { recursive: true });

  const scenes = [];
  for (const scene of SCENES) {
    const done =
      existsSync(path.join(OUT, `${scene.slug}-cast.webp`)) &&
      existsSync(path.join(OUT, `${scene.slug}-plate.jpg`));

    if (done && !FORCE) {
      console.log(`· ${scene.slug}: cached (--force to rebuild)`);
    }

    const [cast, plate] = await Promise.all([
      buildCast(scene.cast, scene.slug),
      buildPlate(scene.plate, scene.slug),
    ]);

    scenes.push({ slug: scene.slug, cast, plate });
    console.log(
      `✓ ${scene.slug}: cast ${cast.width}×${cast.height}, plate ${plate.width}×${plate.height}`
    );
  }

  const banner = "// AUTO-GENERATED by scripts/build-layers.mjs — do not edit.\n";
  await writeFile(
    path.join(ROOT, "src", "lib", "layers.generated.ts"),
    banner +
      `\nexport type Layer = {\n  src: string;\n  width: number;\n  height: number;\n  blurDataURL: string;\n};\n\n` +
      `export type Scene = {\n  slug: string;\n  cast: Layer;\n  plate: Layer;\n};\n\n` +
      `export const SCENES = ${JSON.stringify(scenes, null, 2)} as const satisfies readonly Scene[];\n`,
    "utf8"
  );

  console.log("✓ wrote src/lib/layers.generated.ts");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
