import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          950: "#070B17",
          900: "#0B1020",
          850: "#0E1526",
          800: "#111936",
          700: "#16203A",
          600: "#1E2A4A",
          500: "#27355C",
        },
        electric: {
          600: "#2563EB",
          500: "#3B82F6",
          400: "#5B9CFF",
          300: "#93C5FD",
        },
        ink: {
          DEFAULT: "#F5F7FF",
          secondary: "#9AA8C2",
          muted: "#64748B",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-manrope)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.25rem",
      },
      boxShadow: {
        glow: "0 0 40px rgba(59, 130, 246, 0.15)",
        "glow-lg": "0 0 70px rgba(59, 130, 246, 0.28)",
        card: "0 24px 60px -22px rgba(2, 6, 23, 0.85)",
        ring: "inset 0 1px 0 0 rgba(255, 255, 255, 0.06)",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-14px)" },
        },
        "float-slow": {
          "0%, 100%": { transform: "translate3d(0, 0, 0) scale(1)" },
          "50%": { transform: "translate3d(24px, -30px, 0) scale(1.08)" },
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
          "0%, 100%": { transform: "translate(-6%, -4%) scale(1)" },
          "50%": { transform: "translate(8%, 6%) scale(1.12)" },
        },
      },
      animation: {
        float: "float 7s ease-in-out infinite",
        "float-slow": "float-slow 18s ease-in-out infinite",
        "pulse-soft": "pulse-soft 2.6s ease-in-out infinite",
        "glow-drift": "glow-drift 24s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;

