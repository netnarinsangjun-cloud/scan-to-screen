import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./hooks/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        void: "#050505",
        crimson: {
          DEFAULT: "#DC143C",
          50: "#FFE8EC",
          200: "#FF8FA3",
          400: "#F0385A",
          500: "#DC143C",
          600: "#B10F30",
          700: "#860B24",
          900: "#3A0510",
        },
        scarlet: {
          DEFAULT: "#FF2400",
          400: "#FF5533",
          500: "#FF2400",
          600: "#CC1D00",
        },
        graphite: {
          50: "#F2F2F3",
          200: "#BDBEC2",
          300: "#8E9096",
          400: "#62646B",
          500: "#3C3E44",
          600: "#26272B",
          700: "#18191C",
          800: "#0F1012",
          900: "#0A0A0B",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "var(--font-body)", "ui-sans-serif", "system-ui", "sans-serif"],
        hud: ["var(--font-hud)", "var(--font-body)", "ui-sans-serif", "system-ui", "sans-serif"],
        sans: ["var(--font-body)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        "glow-sm": "0 0 8px rgba(220,20,60,.55), 0 0 2px rgba(255,36,0,.9)",
        glow: "0 0 18px rgba(220,20,60,.55), 0 0 42px rgba(220,20,60,.25)",
        "glow-lg": "0 0 30px rgba(255,36,0,.55), 0 0 90px rgba(220,20,60,.35), 0 0 160px rgba(220,20,60,.18)",
        "glow-inset": "inset 0 0 24px rgba(220,20,60,.35)",
      },
      dropShadow: {
        glow: ["0 0 6px rgba(220,20,60,.85)", "0 0 22px rgba(255,36,0,.45)"],
        "glow-lg": ["0 0 12px rgba(255,36,0,.8)", "0 0 48px rgba(220,20,60,.55)"],
      },
      backgroundImage: {
        "hud-grid":
          "linear-gradient(rgba(220,20,60,.09) 1px, transparent 1px), linear-gradient(90deg, rgba(220,20,60,.09) 1px, transparent 1px)",
        "hud-grid-strong":
          "linear-gradient(rgba(255,36,0,.55) 2px, transparent 2px), linear-gradient(90deg, rgba(255,36,0,.55) 2px, transparent 2px)",
        scanlines: "repeating-linear-gradient(to bottom, rgba(255,255,255,.035) 0px, rgba(255,255,255,.035) 1px, transparent 1px, transparent 3px)",
        "red-radial": "radial-gradient(circle at center, rgba(220,20,60,.55) 0%, rgba(220,20,60,.18) 38%, transparent 68%)",
        vignette: "radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,.85) 100%)",
      },
      backgroundSize: {
        grid: "64px 64px",
        "grid-lg": "120px 120px",
      },
      keyframes: {
        "scan-sweep": {
          "0%": { transform: "translate3d(0,-10vh,0)" },
          "100%": { transform: "translate3d(0,110vh,0)" },
        },
        "pulse-dot": {
          "0%,100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: ".35", transform: "scale(.8)" },
        },
        "particle-drift": {
          "0%": { transform: "translate3d(0,0,0)", opacity: "0" },
          "10%": { opacity: "var(--p-opacity, .8)" },
          "90%": { opacity: "var(--p-opacity, .8)" },
          "100%": { transform: "translate3d(var(--p-dx, 0px), var(--p-dy, -600px), 0)", opacity: "0" },
        },
        "grid-pan": {
          "0%": { transform: "translate3d(0,0,0)" },
          "100%": { transform: "translate3d(0,120px,0)" },
        },
        laser: {
          "0%,100%": { transform: "translate3d(0,0,0)" },
          "50%": { transform: "translate3d(0,var(--laser-travel, 240px),0)" },
        },
        "glitch-a": {
          "0%,100%": { clipPath: "inset(0 0 85% 0)", transform: "translate3d(-6px,0,0)" },
          "20%": { clipPath: "inset(40% 0 35% 0)", transform: "translate3d(8px,0,0)" },
          "40%": { clipPath: "inset(75% 0 5% 0)", transform: "translate3d(-4px,0,0)" },
          "60%": { clipPath: "inset(10% 0 70% 0)", transform: "translate3d(5px,0,0)" },
          "80%": { clipPath: "inset(55% 0 20% 0)", transform: "translate3d(-8px,0,0)" },
        },
        "glitch-b": {
          "0%,100%": { clipPath: "inset(80% 0 2% 0)", transform: "translate3d(6px,0,0)" },
          "25%": { clipPath: "inset(15% 0 60% 0)", transform: "translate3d(-7px,0,0)" },
          "50%": { clipPath: "inset(50% 0 30% 0)", transform: "translate3d(4px,0,0)" },
          "75%": { clipPath: "inset(5% 0 85% 0)", transform: "translate3d(-5px,0,0)" },
        },
        flicker: {
          "0%,19%,21%,23%,55%,57%,100%": { opacity: "1" },
          "20%,22%,56%": { opacity: ".45" },
        },
      },
      animation: {
        "scan-sweep": "scan-sweep 7s linear infinite",
        "pulse-dot": "pulse-dot 1.6s ease-in-out infinite",
        "particle-drift": "particle-drift var(--p-duration, 12s) linear var(--p-delay, 0s) infinite",
        "grid-pan": "grid-pan 6s linear infinite",
        laser: "laser 2.4s ease-in-out infinite",
        "glitch-a": "glitch-a 1.1s steps(1, end) infinite",
        "glitch-b": "glitch-b .9s steps(1, end) infinite",
        flicker: "flicker 4s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
