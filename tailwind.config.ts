import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        sidebar: "hsl(var(--sidebar))",
        surface: "hsl(var(--surface))",
        elevated: "hsl(var(--elevated))",
        border: "hsl(var(--border))",
        muted: "hsl(var(--muted))",
        "muted-foreground": "hsl(var(--muted-foreground))",
        primary: "hsl(var(--primary))",
        "primary-foreground": "hsl(var(--primary-foreground))",
        success: "hsl(var(--success))",
        "success-foreground": "hsl(var(--success-foreground))",
        warning: "hsl(var(--warning))",
        "warning-foreground": "hsl(var(--warning-foreground))",
        danger: "hsl(var(--danger))",
        "danger-foreground": "hsl(var(--danger-foreground))",
        cream: "#FBF6F0",
        clay: {
          light: "#FFF8F0",
          mid: "#F5EDE3",
          deep: "#FFEEDD",
        },
        coral: "#FF9B85",
        sky: "#A8D8EA",
        mint: "#B8E0A8",
        peach: "#FFD59E",
        rose: "#F4A5AE",
      },
      fontFamily: {
        sans: ["Nunito", "Varela Round", "system-ui", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "14px",
        sm: "12px",
        md: "16px",
        lg: "24px",
        xl: "28px",
        "2xl": "32px",
        "3xl": "36px",
        clay: "20px",
        "clay-lg": "28px",
        "clay-xl": "32px",
      },
      boxShadow: {
        clay: "var(--shadow-clay)",
        "clay-hover": "var(--shadow-clay-hover)",
        "clay-press": "var(--shadow-clay-press)",
        "clay-inset": "var(--shadow-clay-inset)",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(4px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "clay-pop": {
          from: { opacity: "0", transform: "translate(-50%, -48%) scale(0.95)" },
          to: { opacity: "1", transform: "translate(-50%, -50%) scale(1)" },
        },
        "checkbox-pop": {
          "0%": { transform: "scale(0)" },
          "65%": { transform: "scale(1.2)" },
          "100%": { transform: "scale(1)" },
        },
        "slide-in": {
          from: { transform: "translateX(100%)" },
          to: { transform: "translateX(0)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.2s ease-out",
        "clay-pop": "clay-pop 0.22s cubic-bezier(0.2, 0.8, 0.2, 1) both",
        "checkbox-pop": "checkbox-pop 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)",
        "slide-in": "slide-in 0.3s ease-out",
      },
    },
  },
  plugins: [],
} satisfies Config;