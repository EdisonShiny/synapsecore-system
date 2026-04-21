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
          page: "#0B1220",
          card: "#111827",
          elevated: "#0F172A",
          primary: "#2563EB",
          secondary: "#60A5FA",
          text: "#F9FAFB",
          muted: "#9CA3AF",
          border: "#1F2937",
          success: "#10B981",
          warning: "#F59E0B",
          error: "#EF4444"
        }
      },
      fontFamily: {
        sans: ["Inter", "Manrope", "Poppins", "ui-sans-serif", "system-ui", "sans-serif"]
      },
      fontSize: {
        "page-title": ["30px", { lineHeight: "38px", fontWeight: "600" }],
        "section-title": ["22px", { lineHeight: "30px", fontWeight: "600" }],
        "card-title": ["16px", { lineHeight: "24px", fontWeight: "600" }],
        body: ["14px", { lineHeight: "22px", fontWeight: "400" }],
        meta: ["12px", { lineHeight: "18px", fontWeight: "400" }]
      },
      boxShadow: {
        soft: "0 18px 60px rgba(0, 0, 0, 0.28)",
        panel: "0 12px 36px rgba(0, 0, 0, 0.22)"
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
