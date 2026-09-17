// Encodes the promo video from rendered frames. Run: node promo/make-video.mjs
// 1080x1920 @30fps H.264 — each frame becomes a slow-zoom clip, then concat
// + fade in/out. Output: promo/findback-promo.mp4 (~29.5s).
import { execFileSync } from "node:child_process";
import { writeFileSync, existsSync } from "fs";

const FF = String.raw`C:\Users\ASUS-A520MK\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-9.0.1-full_build\bin\ffmpeg.exe`;
if (!existsSync(FF)) {
  console.error("ffmpeg not found at", FF);
  process.exit(1);
}

// [frame, seconds]
const specs = [
  ["vf-1-hook", 4],
  ["vf-2-desktop", 5],
  ["vf-3-mobile", 4.5],
  ["vf-4-trust", 5],
  ["vf-5-compare", 5],
  ["vf-6-cta", 6],
];

const run = (args, label) => {
  try {
    execFileSync(FF, ["-y", "-hide_banner", "-loglevel", "error", ...args], { stdio: "inherit" });
    console.log("ok:", label);
  } catch (e) {
    console.error("FAIL:", label, e.message);
    process.exit(1);
  }
};

let i = 0;
for (const [name, secs] of specs) {
  i++;
  const frames = Math.round(secs * 30);
  run(
    [
      "-loop", "1", "-framerate", "30", "-i", `promo/assets/${name}.png`,
      "-vf",
      `zoompan=z='min(1.0+0.0006*on,1.08)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${frames}:s=1080x1920:fps=30`,
      "-frames:v", String(frames),
      "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p",
      `promo/assets/clip-${i}.mp4`,
    ],
    `clip-${i} (${name}, ${secs}s)`
  );
}

writeFileSync(
  "promo/assets/clips.txt",
  Array.from({ length: i }, (_, k) => `file 'clip-${k + 1}.mp4'`).join("\n") + "\n"
);
run(["-f", "concat", "-safe", "0", "-i", "promo/assets/clips.txt", "-c", "copy", "promo/assets/concat.mp4"], "concat");

const total = specs.reduce((s, [, sec]) => s + sec, 0);
const fadeOut = total - 0.6;
run(
  [
    "-i", "promo/assets/concat.mp4",
    "-vf", `fade=t=in:st=0:d=0.5,fade=t=out:st=${fadeOut.toFixed(2)}:d=0.6`,
    "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p",
    "-movflags", "+faststart",
    "promo/findback-promo.mp4",
  ],
  `final promo/findback-promo.mp4 (${total}s)`
);