import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["var(--font-sans)", "Inter", "system-ui"]
      },
      colors: {
        abyss: "#0f172a"
      },
      boxShadow: {
        glow: "0 0 45px rgba(34,197,94,0.25)"
      }
    }
  },
  plugins: []
};

export default config;

