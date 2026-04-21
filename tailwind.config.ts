import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#f8f1e3",
        foreground: "#171717",
        sage: {
          DEFAULT: "#5b733c",
          50: "#f2f5eb",
          100: "#dde5cf",
          200: "#c8d5b3",
          300: "#afc18f",
          400: "#89a461",
          500: "#5b733c",
          600: "#526838",
          700: "#42542e",
          800: "#354325",
          900: "#29341c"
        },
        cream: "#f8f1e3",
        ink: "#171717",
        gold: "#b69152",
        linen: "#faf0db",
        butter: "#fcf3e0",
        walnut: {
          DEFAULT: "#4a2f1d",
          50: "#f3e6d0",
          100: "#e9d1aa",
          200: "#d4a97a",
          300: "#b4844e",
          400: "#8c5a36",
          500: "#6b3f22",
          600: "#4a2f1d",
          700: "#3c2514",
          800: "#2a190c",
          900: "#1a0f07"
        },
        cognac: "#8c5a36",
        ember: "#b8562e",
        brass: {
          DEFAULT: "#b69152",
          100: "#efdfb7",
          400: "#b69152",
          600: "#8a6b38",
          800: "#5e4823"
        }
      },
      fontFamily: {
        heading: ["var(--font-heading)"],
        sans: ["var(--font-sans)"]
      },
      boxShadow: {
        frame: "0 20px 60px rgba(32, 34, 26, 0.12)",
        soft: "0 16px 40px rgba(56, 66, 44, 0.1)"
      },
      backgroundImage: {
        stripe: "repeating-linear-gradient(90deg, rgba(91,115,60,0.9) 0px, rgba(91,115,60,0.9) 22px, rgba(0,0,0,0.92) 22px, rgba(0,0,0,0.92) 44px)"
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        shimmer: "shimmer 2.8s linear infinite"
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" }
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" }
        }
      }
    }
  },
  plugins: [],
};

export default config;
