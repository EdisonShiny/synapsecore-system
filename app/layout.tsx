import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SynapseCore System",
  description: "Design system foundation for SynapseCore System"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
