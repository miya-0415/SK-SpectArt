import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          DEFAULT: "#A5921D",
          light: "#C4AE30",
          dark: "#8A7A18",
          50: "#FAF6E3",
          100: "#F2EAB8",
          200: "#E8D97A",
          300: "#D4BF45",
          400: "#C4AE30",
          500: "#A5921D",
          600: "#8A7A18",
          700: "#6E6013",
          800: "#54490F",
          900: "#3A330A",
        },
      },
      borderColor: {
        gold: "#A5921D",
      },
    },
  },
  plugins: [],
};

export default config;
