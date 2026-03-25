import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        cream: {
          DEFAULT: "#FDF6EC",
          dark: "#F0E4CE",
        },
        terracotta: {
          DEFAULT: "#C85C38",
          light: "#D97452",
          dark: "#A84828",
        },
        olive: {
          DEFAULT: "#6B7A3E",
          light: "#8A9A52",
          dark: "#526030",
        },
        aubergine: {
          DEFAULT: "#3D1A35",
          light: "#5C2850",
        },
        "warm-brown": "#8B5E3C",
      },
      fontFamily: {
        display: ["var(--font-playfair)", "Georgia", "serif"],
        body: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "hero-texture":
          "radial-gradient(ellipse at 20% 50%, rgba(200,92,56,0.08) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(107,122,62,0.06) 0%, transparent 50%)",
      },
    },
  },
  plugins: [],
};

export default config;
