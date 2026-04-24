import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SynapseCore System",
  description: "Internal HQ and Branch Office coordination platform",
  icons: {
    icon: "/synapsecore-logo.png",
    apple: "/synapsecore-logo.png"
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
