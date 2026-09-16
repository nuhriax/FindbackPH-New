# Anti Slop Rules for FindBackPH

## Purpose

Prevent generic AI-generated UI, copy, and unnecessary changes. These rules apply to all pages, components, content, and code reviews.

Anti Slop is a quality filter, not a style guide. `DESIGN.md` defines the actual creative direction, including colors, fonts, layouts, and visual identity.

## 1. Before Coding

- Read `DESIGN.md` and `ANTI_SLOP.md`.
- Inspect the relevant existing code and components.
- Understand the requested task before making changes.
- Preserve established design patterns and functionality.
- Do not redesign unrelated parts of the website.

## 2. Avoid Generic AI UI

Do not add unnecessary:

- Gradient blobs, decorative backgrounds, or excessive animations.
- Repeated rounded cards with no meaningful hierarchy.
- Generic hero sections, feature grids, or dashboard mockups.
- Decorative icons, badges, or pills without purpose.
- Fake testimonials, statistics, or unverified claims.
- Extra sections added only to make a page longer.

Every visual element must have a clear purpose. Remove anything that does not improve the user's experience.

## 3. Preserve Originality

- Follow the creative direction in `DESIGN.md`.
- Preserve distinctive layouts, motifs, and meaningful design decisions.
- Do not replace the website with a generic SaaS template.
- Do not add visual novelty just to appear modern or premium.
- Simple is acceptable when it is the right solution.

## 4. Copy Quality

Write clear, natural, useful copy.

Avoid empty marketing language, repetitive phrases, exaggerated claims, generic AI introductions, and vague calls to action.

Prefer specific wording that reflects the actual lost-and-found experience in the Philippines.

Never invent statistics, testimonials, features, or results.

## 5. UX and Accessibility

- Make primary actions clear.
- Keep searching, reporting, and recovery straightforward.
- Support mobile, keyboard navigation, focus states, and readable contrast.
- Provide useful loading, empty, and error states.
- Do not sacrifice usability for visual novelty.

## 6. Code Quality

- Reuse existing components and design tokens.
- Avoid unnecessary dependencies and duplicate code.
- Preserve correct data fetching, validation, and security.
- Keep changes focused on the requested task.
- Remove unused code introduced by the change.
- Do not claim tests passed without running them.

## 7. Accurate and Efficient Execution

Make changes accurately and efficiently.

- Work directly on the requested task.
- Avoid unnecessary explanations, repeated analysis, and excessive planning.
- Do not spend time redesigning unrelated components.
- Make the safest reasonable decision based on the existing code and design when something is unclear.
- Ask questions only when clarification is necessary to avoid a significant mistake.
- Verify the changes with appropriate checks before finishing.

## 8. Final Review

Before completing the task, confirm:

1. The requested functionality works.
2. The result follows `DESIGN.md`.
3. The UI and copy are not generic AI output.
4. Existing functionality is preserved.
5. The implementation is clean and responsive.
6. Relevant checks have been run.

Do not beautify automatically. Fix the requested problem, improve only what is necessary, and avoid unrelated redesigns.
