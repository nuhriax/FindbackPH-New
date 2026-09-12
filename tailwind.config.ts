import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // ── Notice-Board brand palette (FindBackPH design system) ──────────
        // Ocean blue + sun gold carry the brand; coral is reserved for lost
        // labels/alerts; cork/kraft only for physical notice-board surfaces.
        ocean: {
          light: "#3E6E9E", DEFAULT: "#123A63", dark: "#0D2B4A",
          50: "#EEF3F9", 100: "#D8E4F1", 200: "#B3C9E0", 300: "#7E9FC6",
          400: "#3E6E9E", 500: "#123A63", 600: "#0F3155", 700: "#0D2B4A",
          800: "#0A2138", 900: "#071826", 950: "#0B2647",
        },
        deep: {
          DEFAULT: "#0B2647", 50: "#0B2647", 900: "#081D36", 950: "#050F1F",
        },
        sun: {
          soft: "#F8E3BC", DEFAULT: "#EFA430", dark: "#C97F1E",
          50: "#FDF3E0", 100: "#F8E3BC", 200: "#F2CE8B", 300: "#EFB45E",
          400: "#EFA430", 500: "#E19122", 600: "#C97F1E", 700: "#9C6117",
        },
        coral: {
          soft: "#FADFD7", DEFAULT: "#E1573C", dark: "#B8402A",
          50: "#FDF0EC", 100: "#FADFD7", 200: "#F4BBA9", 500: "#E1573C",
          600: "#C9492F", 700: "#B8402A",
        },
        cork: {
          light: "#A9723F", DEFAULT: "#8A5A31", dark: "#5E3C22",
          100: "#D9BC97", 200: "#C29E6E", 500: "#A9723F", 700: "#8A5A31",
          900: "#5E3C22",
        },
        kraft: {
          DEFAULT: "#E4D2A7", light: "#F0E4C6", dark: "#CDB584",
          50: "#F7EFDA", 100: "#F0E4C6", 200: "#E4D2A7", 400: "#D6BE8C",
          700: "#A98F5E",
        },
        // (Sand lives in its merged token below — legacy numeric scale kept.)
        ink: {
          DEFAULT: "#241E17", soft: "#6B5F4E", faint: "#8B7D68",
        },
        stamp: {
          DEFAULT: "#B23A2E", soft: "#F3DEDB", dark: "#8F2C22",
        },
        // ── LEGACY ALIASES — retinted to the Notice-Board palette ──────────
        // Old class names resolve to brand values; migrate call sites to the
        // semantic names above. electric (was teal) → ocean.
        electric: {
          50: "#EEF3F9", 100: "#D8E4F1", 200: "#B3C9E0", 300: "#7E9FC6", 400: "#3E6E9E",
          500: "#123A63", 600: "#0F3155", 700: "#0D2B4A", 800: "#0A2138", 900: "#071826", 950: "#050F1F",
        },
        // navy (was warm sand browns) → ink-tinted neutrals
        navy: {
          50: "#F7F4EE", 100: "#EFEAE1", 200: "#E0D9CC", 300: "#C4BAA9", 400: "#A99C88",
          500: "#8B7D68", 600: "#6B5F4E", 700: "#55493C", 800: "#3A322A", 900: "#241E17", 950: "#171310",
        },
        // sunrise (was red #DC2626) → coral
        sunrise: {
          50: "#FDF0EC", 100: "#FADFD7", 200: "#F4BBA9", 300: "#F4BBA9", 400: "#E1573C",
          500: "#E1573C", 600: "#C9492F", 700: "#B8402A", 800: "#8F2C22", 900: "#6B2118",
        },
        ice: {
          50: "#FDF6EE", 100: "#F7EFE3", 200: "#F0E3D0", 300: "#E6CEB7", 400: "#D7BF97", 500: "#C4A878",
        },
        lavender: { 50: "#FBF3F5", 100: "#F5E9ED", 200: "#EBD9E1", 300: "#DCC4D0", 400: "#C7A8BA" },
        cream: {
          DEFAULT: "#FBF6EF", 50: "#FBF6EF", 100: "#F7EFE3", 200: "#F1E5D3", 300: "#E8D9C0",
          soft: "#FBF6EF", warm: "#FBF6EF",
        },
        blue: {
          50: "#EEF3F9", 100: "#D8E4F1", 200: "#B3C9E0", 300: "#7E9FC6", 400: "#3E6E9E",
          500: "#123A63", 600: "#0F3155", 700: "#0D2B4A", 800: "#0A2138", 900: "#071826", 950: "#050F1F",
        },
        indigo: {
          50: "#F7F1F4", 100: "#EFE1E9", 200: "#E0C9DB", 300: "#CBA4C3", 400: "#B578A5",
          500: "#9C5483", 600: "#833D6B", 700: "#6B2F56", 800: "#4F2040", 900: "#3A192F", 950: "#28101E",
        },
        cyan: {
          50: "#EEF6F9", 100: "#D4EAF3", 200: "#A8D3E6", 300: "#7EB8D6", 400: "#4E93B8",
          500: "#2E7194", 600: "#1D5471", 700: "#173F58", 800: "#123044", 900: "#0D2233",
        },
        sky: {
          50: "#EEF6F9", 100: "#D8E9F1", 200: "#B0D2E4", 300: "#82B6D4", 400: "#5195BC",
          500: "#2E7194", 600: "#1D5471", 700: "#173F58", 800: "#123044", 900: "#0D2233",
        },
        violet: {
          50: "#F5F3FF", 100: "#EDE9FE", 200: "#DDD6FE", 300: "#C4B5FD", 400: "#A78BFA",
          500: "#8B5CF6", 600: "#7C3AED", 700: "#6D28D9", 800: "#5B21B6", 900: "#4C1D95",
        },
        emerald: {
          50: "#EDF9F0", 100: "#D5F1DF", 200: "#A9E3C2", 300: "#7BD1A4", 400: "#46B687",
          500: "#1B8956", 600: "#11683F", 700: "#0E5734", 800: "#0A4026", 900: "#072B1B",
        },
        leaf: {
          50: "#F1FAF3", 100: "#DFF3E5", 200: "#BFE7CC", 300: "#92D5AB", 400: "#5CBF87",
          500: "#35A56B", 600: "#268A56", 700: "#1D6E45", 800: "#175736", 900: "#114229", 950: "#0A2B1B",
        },
        // teal (Tailwind default; found-accents + discover controls) → ocean family
        teal: {
          50: "#EEF3F9", 100: "#D8E4F1", 200: "#B3C9E0", 300: "#7E9FC6", 400: "#3E6E9E",
          500: "#123A63", 600: "#0F3155", 700: "#0D2B4A", 800: "#0A2138", 900: "#071826", 950: "#050F1F",
        },
        // amber (was orange #F27418) → sun gold family
        amber: {
          50: "#FDF3E0", 100: "#F8E3BC", 200: "#F2CE8B", 300: "#EFB45E", 400: "#EFA430",
          500: "#E19122", 600: "#C97F1E", 700: "#9C6117", 800: "#8A5312", 900: "#6E410E",
        },
        // Semantic aliases - use these going forward
        brand: {
          50: "#EEF3F9", 100: "#D8E4F1", 200: "#B3C9E0", 300: "#7E9FC6", 400: "#3E6E9E",
          500: "#123A63", 600: "#0F3155", 700: "#0D2B4A", 800: "#0A2138", 900: "#071826", 950: "#050F1F",
        },
        // Sand — the light-mode page background. Numeric legacy scale kept for
        // existing utilities; DEFAULT/muted/deep carry the brand hex values.
        sand: {
          DEFAULT: "#FBF6EC", muted: "#F3EBD9", deep: "#EFE3C9",
          50: "#FBF6EE", 100: "#F6EDE0", 200: "#EFE0CF", 300: "#E0CFAC", 400: "#CDB081",
          500: "#B58A56", 600: "#96683A", 700: "#6F4E28", 800: "#4C351C", 900: "#332312", 950: "#1F150B",
        },
        danger: {
          50: "#FEF2F2", 100: "#FEE2E2", 200: "#FECACA", 300: "#FCA5A5", 400: "#F87171",
          500: "#DC2626", 600: "#B91C1C", 700: "#991B1B", 800: "#7F1D1D", 900: "#5C1515",
        },
        // SULO (guiding-light) — legacy lamp-amber, now resolves to the
        // Notice-Board sun-gold. Kept as an alias; migrate call sites to `sun`.
        sulo: {
          50: "#FDF3E0", 100: "#F8E3BC", 200: "#F2CE8B", 300: "#EFB45E", 400: "#EFA430",
          500: "#E19122", 600: "#C97F1E", 700: "#9C6117", 800: "#8A5312", 900: "#6E410E",
        },
        // Harbor — deep ocean ink for headings-on-dark, footer + map rail frames.
        harbor: {
          50: "#EEF3F9", 100: "#D8E4F1", 200: "#B3C9E0", 300: "#7E9FC6", 400: "#3E6E9E",
          500: "#123A63", 600: "#0F3155", 700: "#0D2B4A", 800: "#0A2138", 900: "#071826", 950: "#050F1F",
        },
        success: {
          50: "#EDF9F0", 100: "#D5F1DF", 200: "#A9E3C2", 300: "#7BD1A4", 400: "#46B687",
          500: "#1B8956", 600: "#11683F", 700: "#0E5734", 800: "#0A4026", 900: "#072B1B",
        },
      },
      fontFamily: {
        sans: ["var(--font-pjs)", "system-ui", "sans-serif"],
        display: ["var(--font-sora)", "var(--font-pjs)", "system-ui", "sans-serif"],
        mono: ["var(--font-pjs)", "system-ui", "sans-serif"],
        // Handwritten annotation — reserved for the single Caveat moment on
        // notice cards (e.g. "reward, tawag lang po"). Never for UI text.
        hand: ["var(--font-caveat)", "cursive"],
      },
      borderRadius: { xl: "1rem", "2xl": "1.25rem", "3xl": "1.5rem", card: "1.25rem", button: "0.75rem" },
      boxShadow: {
        glow: "0 0 40px rgba(18, 58, 99, 0.14)",
        "glow-leaf": "0 0 40px rgba(38, 138, 86, 0.16)",
        "glow-lg": "0 0 70px rgba(18, 58, 99, 0.24)",
        "glow-sulo": "0 0 44px rgba(239, 164, 48, 0.20)",
        "glow-sulo-lg": "0 12px 44px -12px rgba(239, 164, 48, 0.45)",
        card: "0 24px 60px -26px rgba(51, 46, 38, 0.22)",
        "card-hover": "0 34px 80px -30px rgba(51, 46, 38, 0.30)",
        soft: "0 18px 50px -24px rgba(51, 46, 38, 0.18)",
        ring: "inset 0 1px 0 0 rgba(255, 255, 255, 0.7)",
      },
      keyframes: {
        float: { "0%, 100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-12px)" } },
        "float-slow": {
          "0%, 100%": { transform: "translate3d(0, 0, 0) scale(1)" },
          "50%": { transform: "translate3d(20px, -26px, 0) scale(1.06)" },
        },
        "pulse-soft": { "0%, 100%": { opacity: "1" }, "50%": { opacity: "0.45" } },
        "fade-up": { from: { opacity: "0", transform: "translateY(24px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        shimmer: { "100%": { transform: "translateX(100%)" } },
        "glow-drift": {
          "0%, 100%": { transform: "translate(-5%, -4%) scale(1)" },
          "50%": { transform: "translate(7%, 5%) scale(1.12)" },
        },
        "particle-rise": {
          "0%": { transform: "translateY(0) translateX(0)", opacity: "0" },
          "12%": { opacity: "0.7" },
          "88%": { opacity: "0.5" },
          "100%": { transform: "translateY(-40vh) translateX(12px)", opacity: "0" },
        },
      },
      animation: {
        float: "float 7s ease-in-out infinite",
        "float-slow": "float-slow 20s ease-in-out infinite",
        "pulse-soft": "pulse-soft 2.6s ease-in-out infinite",
        "glow-drift": "glow-drift 26s ease-in-out infinite",
        "particle-rise": "particle-rise 16s linear infinite",
      },
    },
  },
  plugins: [],
};
export default config;
