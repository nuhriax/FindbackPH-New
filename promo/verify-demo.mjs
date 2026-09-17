// Demo verification — starts against an already-running production server.
// Checks every demo scene + real-route isolation, prints PASS/FAIL per check.
const BASE = process.env.BASE ?? "http://localhost:3000";

const checks = [
  ["demo home shows sample hero feed", "/demo", /Demo: iPhone 13/],
  ["demo home shows scene guide", "/demo", /How FindBack PH works/],
  ["search scene filters to iPhone", "/demo/discover?q=iphone", /Demo: iPhone 13/],
  ["search scene excludes non-matches", "/demo/discover?q=iphone", /Demo: navy wallet|No matching items/],
  ["feed shows all sample reports", "/demo/discover", /Demo: set of keys/],
  ["demo detail renders real composition", "/demo/lost/demo-lost-iphone-13", /Message Owner/],
  ["demo detail shows matches section", "/demo/lost/demo-lost-iphone-13", /Possible matches/],
  ["demo found detail renders", "/demo/found/demo-found-iphone-13", /Message Finder/],
  ["unknown demo id renders not-found UI", "/demo/lost/not-a-real-id", /This path leads nowhere yet/],
  ["real discover still live", "/discover", /Report Lost/],
  ["real homepage still live", "/", /FindBack/],
];

let failed = 0;
for (const [name, path, expect, status] of checks) {
  try {
    const res = await fetch(`${BASE}${path}`);
    const html = await res.text();
    const ok =
      (status ? res.status === status : res.ok) &&
      (expect ? expect.test(html) : true);
    console.log(`${ok ? "PASS" : "FAIL"} — ${name} (${res.status})`);
    if (!ok) failed++;
  } catch (e) {
    console.log(`FAIL — ${name}: ${e.message}`);
    failed++;
  }
}
console.log(failed === 0 ? "\nALL CHECKS PASS" : `\n${failed} CHECK(S) FAILED`);
process.exit(failed === 0 ? 0 : 1);
