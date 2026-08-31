const fs = require("fs");

/* ---- about: fix the two stray replacement chars ---- */
{
  const f = "src/app/(main)/about/page.tsx";
  let s = fs.readFileSync(f, "utf8");
  s = s.replace(/Chapter 03 [^\w\n] The Manifesto/, "Chapter 03 \u00B7 The Manifesto");
  s = s.replace(/\} [^\w\n] \{essay\.kicker\}/, "} \u00B7 {essay.kicker}");
  fs.writeFileSync(f, s, "utf8");
  console.log("about bad:", (s.match(/[\u001d\uFFFD]/g) || []).length);
}

/* ---- how-it-works: strip leading junk char ---- */
{
  const f = "src/app/(main)/how-it-works/page.tsx";
  let s = fs.readFileSync(f, "utf8");
  s = s.replace(/^[^\w\n]+/, "");
  fs.writeFileSync(f, s, "utf8");
  console.log("hiw starts:", JSON.stringify(s.slice(0, 12)));
}

/* ---- safety: inspect tail ---- */
{
  const f = "src/app/(main)/safety/page.tsx";
  const s = fs.readFileSync(f, "utf8");
  const lines = s.split("\n");
  console.log("safety count:", lines.length);
  lines.slice(-12).forEach((l, i) => console.log(lines.length - 12 + i, JSON.stringify(l)));
}
