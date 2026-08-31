# FindBack PH — Premium Design System

The shared, high-tier building blocks for the whole frontend. Import from
`@/components/ui/*` instead of re-rolling Tailwind class strings so every page
looks and behaves identically.

## Component hierarchy

```
src/
  app/                     # Routes (Next.js App Router)
    (auth)/                # Full-screen auth experiences (no navbar/footer)
    (main)/                # Public site + dashboards (navbar/footer chrome)
  components/
    ui/                    # ← THE DESIGN SYSTEM (this folder)
      button.tsx           #   Button / ButtonLink — 5 variants, 3 sizes
      card.tsx             #   Card, IconTile, Eyebrow
      badge.tsx            #   Badge — semantic tones (lost/found/meta)
      section-heading.tsx  #   SectionHeading — eyebrow → title → lead
      page-kit/section.tsx #   PageHero / Section / CTABand (content pages)
      …                    #   Effects, journey band, toasts, etc.
    home/                  # Homepage sections
    navbar/                # Global navigation
    <domain>/              # Feature-specific components (listing, reports…)
  lib/
    utils.ts               # cn() — always merge classes with it
```

## Usage

### Buttons
```tsx
import { Button, ButtonLink } from "@/components/ui/button";

<Button variant="primary" size="lg" onClick={submit}>Report Lost</Button>
<ButtonLink href="/report/found" variant="outline">Report Found</ButtonLink>
```
Variants: `primary` (teal gradient), `dark` (espresso), `outline`, `ghost`,
`danger`. Sizes: `sm | md | lg`.

### Cards
```tsx
import { Card, IconTile } from "@/components/ui/card";

<Card surface="gradient" interactive> … </Card>
<IconTile icon={<ShieldCheck size={20} />} tone="emerald" />
```
Surfaces: `surface` (glass, default) · `solid` · `gradient` (hero) · `sunken`.

### Badges
```tsx
import { Badge } from "@/components/ui/badge";
<Badge tone="sunrise" dot>Lost</Badge>
<Badge tone="emerald" dot>Found</Badge>
```

### Section headings
```tsx
import { SectionHeading } from "@/components/ui/section-heading";
<SectionHeading eyebrow="How it works" title="Three steps to reunion" lead="…" />
```

## Premium CSS utilities (globals.css)
- `.glass` — frosted surface over the warm-sand backdrop
- `.text-gradient-brand` — teal→coral gradient text for headline accents
- `.hairline-x` — edge-fading divider
- `.focus-premium` — consistent focus ring for links/inputs

## Adoption rules
1. New UI **must** use these primitives; don't hand-roll button/card styles.
2. Colors come from the palette: `electric` (brand), `navy` (ink), `sunrise`
   (lost), `emerald` (found). Don't introduce raw hex values.
3. Class merging goes through `cn()` from `@/lib/utils`.
4. Headings use `font-display` (Sora); body uses `font-sans` (Plus Jakarta).
   Both are automatic via `h1–h6` base styles — don't override manually.
