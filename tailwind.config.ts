import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#fff1f1",
          100: "#ffe1e1",
          200: "#ffc7c7",
          300: "#ffa0a0",
          400: "#ff6969",
          500: "#f83b3b",
          600: "#e51d1d", // Primary Japan crimson red (like GetYourGuide orange/red accents)
          700: "#c11313",
          800: "#9f1313",
          900: "#831616",
        },
      },
    },
  },
  plugins: [],
};
export default config;
