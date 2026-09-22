/**
 * Tailwind theme tokens for ExportHub.
 * Tailwind v4 primarily reads tokens from the `@theme` block in globals.css,
 * but this config is kept in sync so tokens are also usable via a JS config.
 * Sharp corners: default radius is 3px (not rounded SaaS cards).
 */

/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#10213A",
        paper: "#F6F4EE",
        panel: "#FFFFFF",
        line: "#E4DFD2",
        saffron: {
          DEFAULT: "#C97A1A",
          soft: "#F3E3C8",
        },
        teal: {
          DEFAULT: "#2F7D6E",
          soft: "#DCEDE8",
        },
        coral: {
          DEFAULT: "#B84A3B",
          soft: "#F5DFDA",
        },
        blueGrey: {
          DEFAULT: "#3A4E7A",
          soft: "#E4E9F5",
        },
        text: "#1B2333",
        textDim: "#66707F",
      },
      borderRadius: {
        DEFAULT: "3px",
        sharp: "3px",
      },
      fontFamily: {
        heading: ['"Space Grotesk"', "sans-serif"],
        body: ['"IBM Plex Sans"', "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
