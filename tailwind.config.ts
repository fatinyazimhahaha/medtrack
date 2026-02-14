import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#e6faf5",
          100: "#b3f0e0",
          200: "#80e6cc",
          300: "#4ddcb7",
          400: "#26d4a7",
          500: "#0CCEA9",
          600: "#0ab890",
          700: "#089e7b",
          800: "#068466",
          900: "#045a46",
        },
        surface: {
          primary: "#FAFBFC",
          secondary: "#F0F2F5",
          tertiary: "#E8ECF0",
          card: "#FFFFFF",
        },
      },
      fontFamily: {
        heading: ["Outfit", "system-ui", "sans-serif"],
        body: ["Inter", "system-ui", "sans-serif"],
      },
      animation: {
        "fade-in-up": "fade-in-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "fade-in": "fade-in 0.6s ease forwards",
        "marquee": "marquee-scroll 30s linear infinite",
        "pulse-glow": "pulse-glow 6s ease-in-out infinite",
        "float": "float 6s ease-in-out infinite",
        "scroll-hint": "scroll-hint 2s ease-in-out infinite",
      },
      keyframes: {
        "fade-in-up": {
          from: { opacity: "0", transform: "translateY(40px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "marquee-scroll": {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        "pulse-glow": {
          "0%, 100%": { opacity: "0.4" },
          "50%": { opacity: "0.8" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        "scroll-hint": {
          "0%, 100%": { transform: "translateY(0)", opacity: "0.6" },
          "50%": { transform: "translateY(10px)", opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
