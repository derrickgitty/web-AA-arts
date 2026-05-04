import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        cream: { 50: "#FFFDF9", 100: "#FFF9F0", 200: "#FFF1DE" },
        blush: { 50: "#FFF5F8", 100: "#FFE4ED", 200: "#FFD6E8", 300: "#FFB8D4", 400: "#FF8FB8", 500: "#FF6BA0" },
        lilac: { 50: "#F8F4FF", 100: "#EFE6FF", 200: "#E8D5FF", 300: "#D4B8FF", 400: "#B894F0", 500: "#9B6FE0" },
        mint: { 50: "#F0FDF7", 100: "#DDFBEB", 200: "#D5F5E3", 300: "#A8E6C5", 400: "#7DD3A8", 500: "#5BC093" },
      },
      fontFamily: {
        sans: ["Quicksand", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["'Fredoka'", "Quicksand", "sans-serif"],
      },
      boxShadow: {
        cute: "0 8px 24px -8px rgba(255, 143, 184, 0.25)",
      },
    },
  },
  plugins: [],
} satisfies Config;
