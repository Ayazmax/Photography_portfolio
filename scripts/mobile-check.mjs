import { chromium, devices } from "playwright";

const url = process.argv[2] ?? "http://localhost:4455/";
const browser = await chromium.launch();
const ctx = await browser.newContext({ ...devices["iPhone 13"] });
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.goto(url, { waitUntil: "networkidle" });
await page.waitForTimeout(5000);

const info = await page.evaluate(() => ({
  touch: matchMedia("(hover: none) and (pointer: coarse)").matches,
  perspective: getComputedStyle(document.querySelector("#index > div")).perspective,
  navBlend: getComputedStyle(document.querySelector("header")).mixBlendMode,
}));
console.log(JSON.stringify(info));

const shot = async (name, y) => {
  await page.evaluate((y) => window.scrollTo(0, y), y);
  await page.waitForTimeout(900);
  await page.screenshot({ path: `screenshots-mobile/lite-${name}.png` });
};

const vh = await page.evaluate(() => innerHeight);
const hero = await page.evaluate(() => document.querySelector("#index").offsetHeight);
await shot("hero-0", 0);
await shot("hero-cross", (hero - vh) * 0.25);
await shot("hero-2", (hero - vh) * 0.625);
const night = await page.evaluate(() => {
  const s = document.querySelector("#case-study");
  return { top: s.offsetTop, h: s.offsetHeight };
});
await shot("night-a", night.top + (night.h - vh) * 0.1);
await page.waitForTimeout(3000);
await shot("night-b", night.top + (night.h - vh) * 0.45);
console.log("errors:", JSON.stringify(errors));
await browser.close();
