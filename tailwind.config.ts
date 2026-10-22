import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        navy: {
          primary: "#062653",
          dark: "#031B3A",
          hover: "#083370",
          light: "#0D3E82",
        },
        orange: {
          primary: "#FF7900",
          hover: "#E66D00",
          light: "#FFF4EB",
        },
        slate: {
          body: "#263445",
          muted: "#64748B",
          border: "#DCE2EA",
          surface: "#F4F6F9",
        },
      },
      fontFamily: {
        sans: ["var(--font-poppins)", "Poppins", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        poppins: ["var(--font-poppins)", "Poppins", "sans-serif"],
        mono: ["var(--font-poppins)", "Poppins", "sans-serif"],
        script: ["var(--font-caveat)", "Caveat", "cursive", "sans-serif"],
        windsong: ["'WindSong'", "cursive", "sans-serif"],
        signature: ["'WindSong'", "cursive", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
