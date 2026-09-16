# FindBackPH — Design System (DESIGN.md)

The creative direction for the site. `ANTI_SLOP.md` is the quality filter that
enforces this direction. Sources of truth: `tailwind.config.ts` (tokens),
`src/app/globals.css` (surfaces, theme mechanics), `src/app/layout.tsx` (fonts).

## Core concept — the notice board

FindBackPH looks like a **community notice board**: reports are paper notices
pinned to kraft/cork surfaces, not SaaS cards. Every design decision serves
that metaphor. When in doubt, ask "would this exist on a real barangay notice
board?"

## Color tokens (tailwind.config.ts)

- **ocean** `#123A63` (+ 50–950 scale) — brand primary, links, "found" state
- **sun** `#EFA430` (+ scale) — primary action buttons, highlights, gold accents
- **coral** `#E1573C` — reserved for "lost" labels and alerts only
- **cork / kraft** — physical notice-board surfaces ONLY (cards, bands, pins)
- **ink** `#241E17` (+ soft/faint) — notice-board text neutrals
- **stamp** `#B23A2E` — rubber-stamp accents (verified/recovered states)
- **Legacy aliases retinted, do not use in new code**: `electric` → ocean,
  `navy` → ink neutrals, `sunrise` → coral, `sulo` → sun, `ice`/`cream` warm neutrals

New code uses the semantic names (ocean/sun/coral/cork/kraft/ink/stamp).

## Typography (layout.tsx)

- **Plus Jakarta Sans** (`--font-pjs`) — body/UI
- **Sora** (`--font-sora`) — display headings (`font-display`)
- **Caveat** (`--font-caveat`, `font-hand`) — handwritten annotation used in
  EXACTLY ONE kind of place: notice annotations (e.g. "reward, tawag lang po").
  Never for navigation, headings, or buttons.

## Signature motifs (globals.css)

- `.notice-card` — kraft paper card with a sun-gold pin head; THE report card
- `.notice-annotation` — the Caveat handwritten moment
- `.stamp-badge` — restrained rubber-stamp (e.g. "NAIBALIK NA!")
- `.cork-board` — cork band for hero/discover backdrops only
- `.navbar-pill` — floating glass navbar pill
- `.footer-ink` — theme-adaptive footer (light: ice/sand gradient; dark:
  ocean-deep `#0B2647` matching the body). Uses `--footer-*` CSS variables —
  never hardcode footer text colors in the component.
- `RouteRule` (journey-band.tsx) — small dashed route line, footer brand column
- `MapMotif` — subtle decorative PH island cluster for hero backgrounds

## Theme mechanics — light & dark

- Dark mode = the `site-ink` class on `<html>` (layout.tsx mechanism)
- Dark palette: ocean deep `#0B2647` body, ocean-blue surfaces `#123A63`,
  text `#EAF1F9`, sun-gold accents
- Light palette: warm sand `#FBF6EF` canvas, ink text
- Dark mode is implemented via `.site-ink` overrides in globals.css, declared
  AFTER light defaults so they win the cascade. Sections must blend with the
  page in BOTH themes (e.g. footer connects to the body canvas, no hard slabs).

## Voice & copy

- Plain, warm, Filipino-community tone. Tagline: "Every lost thing has a way home."
- Specific over generic: mention real PH contexts (jeep/MRT, barangay hall,
  mall meetups, islands and barangays)
- Never invent statistics, testimonials, or claims. Stats shown on the homepage
  are live counts from the database.
- The word "sulo" (guiding light) is the brand story: guiding lost things home.

## UX rules

- Primary actions: "I lost something" (sun) and "I found something" (ocean) —
  always reachable (navbar, hero, mobile sticky bar)
- Homepage chapters: Hero → Live reports (filterable) → Trust links
- Contact details stay private until a user chooses to share them — never
  design flows that expose them
- Mobile-first: the core user just lost something on a commute

## Checks before finishing any UI change

1. `npm run typecheck` → exit 0
2. `npm run lint` → no NEW warnings
3. Both themes verified (light + `site-ink` dark)
4. No unused CSS/imports left behind by the change
