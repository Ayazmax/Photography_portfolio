import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

const URL = process.env.SHOOT_URL ?? "http://localhost:3300";
const MOBILE = process.argv.includes("--mobile");
const OUT = MOBILE ? "screenshots-mobile" : "screenshots";

/**
 * Hero section is (4 × 110 + 30) = 470vh tall. Pin distance is therefore 370vh,
 * so progress p maps to `p * 3.7` screen-heights of scroll. Beat centres sit
 * at progress (i + 0.5) / 4; crosses sit between exit of i and enter of i+1.
 */
const PIN = 3.7; // viewport-heights of pin distance
const p = (progress) => progress * PIN;

const SHOTS = [
  ["01-hero-open", p(0)],
  ["02-hero-cross-a", p(0.25)],
  ["03-hero-beat-2", p(0.375)],
  ["04-hero-cross-b", p(0.5)],
  ["05-hero-beat-3", p(0.625)],
  ["06-hero-cross-c", p(0.75)],
  ["07-hero-beat-4", p(0.875)],
  ["08-statement", 5.2],
  ["09-gallery", 6.6],
  ["10-contact", 16.0],
];

await mkdir(OUT, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: MOBILE ? { width: 390, height: 844 } : { width: 1512, height: 900 },
  deviceScaleFactor: 1,
});

await page.goto(URL, { waitUntil: "networkidle" });
await page.waitForTimeout(7500);

for (const [name, screens] of SHOTS) {
  await page.evaluate((s) => {
    window.scrollTo({ top: s * window.innerHeight, behavior: "instant" });
  }, screens);
  await page.waitForTimeout(1400);
  await page.screenshot({ path: `${OUT}/${name}.png` });
  console.log(`· ${name}`);
}

await browser.close();
