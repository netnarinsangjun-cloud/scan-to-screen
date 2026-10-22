import type { Config } from "tailwindcss";

/**
 * "Warm Sunrise" theme: crimson ribbon red on a white → cream → gold sunrise,
 * charcoal text, with a small sky-blue accent. Colors sampled from the
 * reference artwork.
 *
 * `graphite` is a neutral scale where 50 is the darkest text and 900 is pure
 * white, so "text-graphite-200" = secondary text and "bg-graphite-900" = card.
 */
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./hooks/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        void: "#FFFDFB",
        ink: {
          DEFAULT: "#3C3C3C",
          soft: "#5A5A5E",
        },
        crimson: {
          DEFAULT: "#CC122A",
          50: "#FDF1F2",
          100: "#FADDE1",
          200: "#F1AAB3",
          300: "#E5707F",
          400: "#D93A4F",
          500: "#CC122A",
          600: "#B40C24",
          700: "#960018",
          800: "#730012",
          900: "#4A000C",
        },
        scarlet: {
          DEFAULT: "#E3263A",
          400: "#EF5A64",
          500: "#E3263A",
          600: "#C8102E",
        },
        gold: {
          50: "#FFF9EF",
          100: "#FCEAC6",
          200: "#FCDEB4",
          300: "#F7C88A",
          400: "#F0AC5C",
          500: "#E58E33",
        },
        sky: {
          400: "#5CCBF2",
          500: "#22B9EE",
        },
        graphite: {
          50: "#3C3C3C",
          100: "#4A4A4E",
          200: "#5C5C62",
          300: "#76767D",
          400: "#94949B",
          500: "#C8C8CE",
          600: "#E2E1E4",
          700: "#EEEDEF",
          800: "#F7F5F3",
          900: "#FFFFFF",
        },
      },
      fontFamily: {
        display: ["var(--font-body)", "ui-sans-serif", "system-ui", "sans-serif"],
        hud: ["var(--font-body)", "ui-sans-serif", "system-ui", "sans-serif"],
        sans: ["var(--font-body)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        "glow-sm": "0 2px 10px -2px rgba(204,18,42,.35)",
        glow: "0 14px 34px -14px rgba(204,18,42,.55)",
        "glow-lg": "0 50px 90px -40px rgba(150,0,24,.45), 0 24px 50px -28px rgba(80,50,20,.30)",
        "glow-inset": "0 1px 2px rgba(80,50,20,.05), 0 14px 36px -20px rgba(80,50,20,.28)",
      },
      dropShadow: {
        glow: ["0 6px 14px rgba(204,18,42,.25)"],
        "glow-lg": ["0 12px 28px rgba(150,0,24,.30)"],
      },
      backgroundImage: {
        // Subtle warm dot texture for app pages.
        "hud-grid": "radial-gradient(rgba(204,18,42,.07) 1.3px, transparent 1.5px)",
        sunrise: "linear-gradient(180deg, #FFFFFF 0%, #FFFDF9 38%, #FFF5E6 64%, #FCE7CB 82%, #FADCB6 100%)",
        sun: "radial-gradient(circle, #FFFFFF 0%, #FFF8E4 16%, rgba(252,222,180,.75) 38%, rgba(252,222,180,0) 70%)",
        "red-radial":
          "radial-gradient(circle at center, rgba(255,248,228,1) 0%, rgba(252,222,180,.75) 34%, rgba(204,18,42,.10) 56%, transparent 70%)",
        vignette: "radial-gradient(ellipse at center, transparent 58%, rgba(250,220,182,.35) 100%)",
        "ribbon-red": "linear-gradient(100deg, #960018 0%, #CC122A 38%, #E3263A 62%, #B40C24 100%)",
        "brand-text": "linear-gradient(180deg, #E0293F 0%, #CC122A 48%, #960018 100%)",
      },
      backgroundSize: {
        grid: "28px 28px",
      },
      keyframes: {
        "pulse-dot": {
          "0%,100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: ".35", transform: "scale(.8)" },
        },
        "particle-drift": {
          "0%": { transform: "translate3d(0,0,0)", opacity: "0" },
          "12%": { opacity: "var(--p-opacity, .8)" },
          "88%": { opacity: "var(--p-opacity, .8)" },
          "100%": { transform: "translate3d(var(--p-dx, 0px), var(--p-dy, -600px), 0)", opacity: "0" },
        },
        laser: {
          "0%,100%": { transform: "translate3d(0,0,0)" },
          "50%": { transform: "translate3d(0,var(--laser-travel, 240px),0)" },
        },
        shimmer: {
          "0%": { transform: "translate3d(-120px,0,0)" },
          "100%": { transform: "translate3d(120px,0,0)" },
        },
      },
      animation: {
        "pulse-dot": "pulse-dot 1.6s ease-in-out infinite",
        "particle-drift": "particle-drift var(--p-duration, 12s) linear var(--p-delay, 0s) infinite",
        laser: "laser 2.4s ease-in-out infinite",
        shimmer: "shimmer 9s ease-in-out infinite alternate",
      },
    },
  },
  plugins: [],
};

export default config;
