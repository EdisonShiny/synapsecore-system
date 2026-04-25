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
          page: "#F8FAFC",
          card: "#FFFFFF",
          elevated: "#F1F5F9",
          primary: "#3B82F6",
          secondary: "#8B5CF6",
          text: "#0F172A",
          muted: "#475569",
          border: "#E2E8F0",
          success: "#22C55E",
          warning: "#F59E0B",
          error: "#EF4444"
        }
      },
      fontFamily: {
        sans: ["Inter", "SF Pro Display", "Plus Jakarta Sans", "Poppins", "ui-sans-serif", "system-ui", "sans-serif"]
      },
      fontSize: {
        "page-title": ["28px", { lineHeight: "36px", fontWeight: "700" }],
        "section-title": ["20px", { lineHeight: "28px", fontWeight: "700" }],
        "card-title": ["16px", { lineHeight: "24px", fontWeight: "600" }],
        body: ["14px", { lineHeight: "22px", fontWeight: "500" }],
        meta: ["12px", { lineHeight: "18px", fontWeight: "400" }]
      },
      boxShadow: {
        soft: "0 8px 22px rgba(59, 130, 246, 0.12)",
        panel: "0 1px 2px rgba(15, 23, 42, 0.06), 0 8px 20px rgba(15, 23, 42, 0.04)"
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
