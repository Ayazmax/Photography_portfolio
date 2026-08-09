import { chromium } from "playwright";

const URL = process.env.SHOOT_URL ?? "http://localhost:3300";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1512, height: 900 } });

page.on("console", (m) => console.log(`[console:${m.type()}]`, m.text()));
page.on("pageerror", (e) => console.log("[pageerror]", e.message));
page.on("requestfailed", (r) =>
  console.log("[failed]", r.url(), r.failure()?.errorText)
);

const res = await page.goto(URL, { waitUntil: "domcontentloaded" });
console.log("status", res?.status());
await page.waitForTimeout(9000);

console.log("title", await page.title());
console.log(
  "info",
  JSON.stringify(
    await page.evaluate(() => ({
      bodyBg: getComputedStyle(document.body).backgroundColor,
      scrollHeight: document.documentElement.scrollHeight,
      sheets: document.styleSheets.length,
      h1: document.querySelector("h1")?.textContent,
      canvases: [...document.querySelectorAll("canvas")].map(
        (c) => `${c.width}x${c.height}`
      ),
    })),
    null,
    2
  )
);

await page.screenshot({ path: "screenshots/probe.png" });
await browser.close();
