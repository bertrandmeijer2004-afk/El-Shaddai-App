import type { Config } from "tailwindcss";

// Warna memakai variabel CSS (kanal RGB) supaya mode terang/gelap
// cukup mengganti variabel di globals.css dan opacity (mis. bg-bg/80) tetap jalan.
const token = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: token("bg"),
        fg: token("fg"),
        muted: token("muted"),
        surface: token("surface"),
        card: token("card"),
        line: token("line"),
        primary: token("primary"),
        accent: token("accent"),
        link: token("link"),
        ink: "#0A0A0A",
      },
      fontFamily: {
        display: ["var(--font-display)", "Impact", "sans-serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      letterSpacing: {
        nav: "0.18em",
        wideish: "0.12em",
      },
      keyframes: {
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
      animation: {
        marquee: "marquee 45s linear infinite",
      },
      borderRadius: {
        "4xl": "2rem",
      },
    },
  },
  plugins: [],
};

export default config;
