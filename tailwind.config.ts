import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./features/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        synapse: {
          page: "#EEF4FB",
          card: "#FFFFFF",
          elevated: "#F7FAFC",
          primary: "#1D4ED8",
          secondary: "#0F766E",
          text: "#0F172A",
          muted: "#64748B",
          border: "#D7E3F1",
          success: "#15803D",
          warning: "#B45309",
          error: "#B91C1C"
        }
      },
      fontFamily: {
        sans: ["Manrope", "Inter", "Poppins", "ui-sans-serif", "system-ui", "sans-serif"]
      },
      fontSize: {
        "page-title": ["30px", { lineHeight: "38px", fontWeight: "600" }],
        "section-title": ["22px", { lineHeight: "30px", fontWeight: "600" }],
        "card-title": ["16px", { lineHeight: "24px", fontWeight: "600" }],
        body: ["14px", { lineHeight: "22px", fontWeight: "400" }],
        meta: ["12px", { lineHeight: "18px", fontWeight: "400" }]
      },
      boxShadow: {
        soft: "0 22px 52px rgba(15, 23, 42, 0.12)",
        panel: "0 14px 34px rgba(15, 23, 42, 0.08)"
      },
      borderRadius: {
        xl: "0.75rem",
        "2xl": "1rem"
      }
    }
  },
  plugins: []
};

export default config;
