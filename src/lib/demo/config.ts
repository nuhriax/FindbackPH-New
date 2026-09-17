/**
 * Demo mode gate — presentation-only sample data for launch recordings.
 *
 * Strictly opt-in: active ONLY when NEXT_PUBLIC_DEMO_MODE=1 is set in the
 * local environment (never in Vercel production). When off, every demo
 * module renders nothing and the real site behaves exactly as before.
 * Demo state lives entirely in code (src/lib/demo/fixture.ts) — no demo
 * row is ever written to the production database.
 */
export const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "1";
