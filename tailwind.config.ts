import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
            colors: {
        electric: {
          50:  "#EAF7F5", 100: "#D6EFEB", 200: "#B3E4DD", 300: "#7CC9C6", 400: "#46ABAA",
          500: "#20948F", 600: "#0F7B72", 700: "#0C6262", 800: "#0A4E55", 900: "#083B46", 950: "#052A33",
        },
        navy: {
          50: "#FBF6EE", 100: "#F6EDE0", 200: "#EFE0CF", 300: "#E0CFAC", 400: "#CDB081",
          500: "#B58A56", 600: "#96683A", 700: "#6F4E28", 800: "#4C351C", 900: "#332312", 950: "#1F150B",
        },
        sunrise: {
          50: "#FFF3E5", 100: "#FFE6CC", 200: "#FBD0A5", 300: "#F8B87D", 400: "#F59341",
          500: "#F27418", 600: "#DE3810", 700: "#B5490C", 800: "#8F3900", 900: "#6E2D06",
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
          50: "#EAF7F5", 100: "#D6EFEB", 200: "#B3E4DD", 300: "#7CC9C6", 400: "#46ABAA",
          500: "#20948F", 600: "#0F7B72", 700: "#0C6262", 800: "#0A4E55", 900: "#083B46", 950: "#052A33",
        },
        indigo: {
          50: "#F7F1F4", 100: "#EFE1E9", 200: "#E0C9DB", 300: "#CBA4C3", 400: "#B578A5",
          500: "#9C5483", 600: "#833D6B", 700: "#6B2F56", 800: "#4F2040", 900: "#3A192F", 950: "#28101E",
        },
        cyan: {
          50: "#ECFBF9", 100: "#D0F3F1", 200: "#A5E7E5", 300: "#6DD4D3", 400: "#47B9BA",
          500: "#2BA3AB", 600: "#1D8C96", 700: "#17727C", 800: "#115B66", 900: "#0D4751",
        },
        sky: {
          50: "#EAF9F9", 100: "#D6F1F1", 200: "#B0E3E7", 300: "#82CED6", 400: "#51B2BC",
          500: "#259CA7", 600: "#17908A", 700: "#11707A", 800: "#0E555E", 900: "#0B3E46",
        },
        violet: {
          50: "#F5F3FF", 100: "#EDE9FE", 200: "#DDD6FE", 300: "#C4B5FD", 400: "#A78BFA",
          500: "#8B5CF6", 600: "#7C3AED", 700: "#6D28D9", 800: "#5B21B6", 900: "#4C1D95",
        },
        emerald: {
          50: "#EDF9F0", 100: "#D5F1DF", 200: "#A9E3C2", 300: "#7BD1A4", 400: "#46B687",
          500: "#209B68", 600: "#1B8956", 700: "#11683F", 800: "#0E5734", 900: "#0A4026",
        },
        amber: {
          50: "#FFF3E5", 100: "#FFE6CC", 200: "#FBD0A5", 300: "#F8B574", 400: "#F5913D",
          500: "#F27418", 600: "#DE3810", 700: "#B5490C", 800: "#8F3900", 900: "#6E2D06",
        },
        ink: { DEFAULT: "#332312", secondary: "#4C351C", muted: "#6B5636" },
      },
      fontFamily: {
        sans: ["var(--font-pjs)", "system-ui", "sans-serif"],
        display: ["var(--font-pjs)", "system-ui", "sans-serif"],
        // Keep every `font-mono` element on the same Plus Jakarta Sans family so
        // counters/labels don't fall back to a browser monospace font and look
        // out of place on the About / Safety pages.
        mono: ["var(--font-pjs)", "system-ui", "sans-serif"],
      },
      borderRadius: { xl: "1rem", "2xl": "1.25rem", "3xl": "1.5rem", card: "1.25rem", button: "0.75rem" },
      boxShadow: {
        glow: "0 0 40px rgba(15, 123, 122, 0.14)",
        "glow-lg": "0 0 70px rgba(15, 123, 122, 0.24)",
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
