import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: "var(--card)",
        "card-2": "var(--card-2)",
        border: "var(--border)",
        muted: "var(--muted)",
        accent: "var(--accent)",
        "accent-2": "var(--accent-2)",
        warning: "var(--warning)",
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(255,255,255,0.08), 0 20px 60px rgba(124,58,237,0.25)",
        glowSoft:
          "0 0 0 1px rgba(255,255,255,0.08), 0 10px 30px rgba(124,58,237,0.18)",
      },
    },
  },
  plugins: [],
} satisfies Config;

