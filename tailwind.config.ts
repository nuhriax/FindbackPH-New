import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        /* Deep navy — used for headings and primary text on light surfaces */
        navy: {
          50: "#f3f6ff",
          100: "#e6edff",
          200: "#c9d8ff",
          300: "#9fb8fa",
          400: "#7194f0",
          500: "#4a6fe0",
          600: "#3454c4",
          700: "#2a43a4",
          800: "#203277",
          900: "#14224f",
          950: "#0a1432",
        },
        /* Brand blues */
        electric: {
          700: "#1d4ed8",
          600: "#2563eb",
          500: "#3b82f6",
          400: "#5b9cff",
          300: "#93c5fd",
          200: "#bfdbfe",
          100: "#dbeafe",
          50: "#eff6ff",
        },
        /* Ice blue + soft periwinkle tints used for surfaces & glows */
        ice: {
          50: "#f4f9ff",
          100: "#e7f3ff",
          200: "#cfe8ff",
          300: "#a8d7ff",
          400: "#74bfff",
          500: "#4aa3f5",
        },
        lavender: {
          50: "#f6f5ff",
          100: "#ebe9ff",
          200: "#d8d4ff",
          300: "#b8b2fb",
          400: "#948cf2",
        },
        /* Text scale tuned for a light, luminous background */
        ink: {
          DEFAULT: "#14224f",
          secondary: "#46536f",
          muted: "#8a94a8",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-manrope)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.25rem",
        card: "1.25rem",
        button: "0.75rem",
      },
      boxShadow: {
        glow: "0 0 40px rgba(59, 130, 246, 0.18)",
        "glow-lg": "0 0 70px rgba(59, 130, 246, 0.30)",
        card: "0 24px 60px -26px rgba(20, 34, 79, 0.28)",
        "card-hover": "0 34px 80px -30px rgba(37, 99, 235, 0.35)",
        soft: "0 18px 50px -24px rgba(20, 34, 79, 0.22)",
        ring: "inset 0 1px 0 0 rgba(255, 255, 255, 0.7)",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-12px)" },
        },
        "float-slow": {
          "0%, 100%": { transform: "translate3d(0, 0, 0) scale(1)" },
          "50%": { transform: "translate3d(20px, -26px, 0) scale(1.06)" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.45" },
        },
        "fade-up": {
          from: { opacity: "0", transform: "translateY(24px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
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

