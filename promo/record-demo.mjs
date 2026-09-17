// Demo video — records the REAL interactive demo walking through all 7
// scenes with Playwright video capture, then converts to MP4 (H.264).
// Requires: NEXT_PUBLIC_DEMO_MODE=1 server running (BASE env, default :3000).
import { chromium } from "playwright";
import { execSync } from "node:child_process";
import { mkdirSync, rmSync, existsSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const BASE = process.env.BASE ?? "http://localhost:3000";
const rawDir = join(root, "promo", "assets", "demo-raw");
const outFile = join(root, "promo", "findback-demo.mp4");
mkdirSync(rawDir, { recursive: true });

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1280, height: 720 },
  recordVideo: { dir: rawDir, size: { width: 1280, height: 720 } },
});
const page = await context.newPage();

async function go(path, ms = 3500) {
  await page.goto(`${BASE}${path}`, { waitUntil: "networkidle" }).catch(() => {});
  await wait(ms);
}

// Scene 1 — Philippine introduction (real hero, sample board)
await go("/demo", 4500);

// Scene 2 — search for a lost iPhone (real feed, filtered)
await go("/demo/discover?q=iphone", 4500);

// Scene 3 — community feed (all reports + map)
await go("/demo/discover", 4500);
await page.mouse.wheel(0, 600).catch(() => {});
await wait(1500);

// Scene 4 — report lost (real wizard gate → shows the real login screen)
await go("/report/lost", 4500);

// Scene 5 — report found (real wizard gate)
await go("/report/found", 3500);

// Scene 6 — trust & safety (real page)
await go("/safety", 4500);
await page.mouse.wheel(0, 700).catch(() => {});
await wait(1500);

// Scene 7 — closing (real hero + closing message)
await go("/demo?scene=closing", 4500);

const video = page.video();
await context.close();
const saved = await video.path();
await browser.close();

// Convert webm → mp4 with the winget ffmpeg (resolved dynamically).
const ffRoot =
  "C:/Users/ASUS-A520MK/AppData/Local/Microsoft/WinGet/Packages";
const ffmpeg = execSync(
  `Get-ChildItem '${ffRoot}' -Recurse -Filter ffmpeg.exe | Select-Object -First 1 -ExpandProperty FullName`,
  { shell: "powershell.exe" }
)
  .toString()
  .trim();

if (existsSync(outFile)) rmSync(outFile);
execSync(
  `"${ffmpeg}" -y -i "${saved}" -c:v libx264 -preset medium -crf 21 -pix_fmt yuv420p -movflags +faststart "${outFile}"`,
  { stdio: "inherit" }
);
rmSync(rawDir, { recursive: true, force: true });
console.log("WROTE", outFile);
