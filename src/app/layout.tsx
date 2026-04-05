import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Stylist",
  description: "Shopify AI Stylist Next.js control plane",
  icons: {
    icon: "/shopify-app-icon.png",
    apple: "/shopify-app-icon.png",
    shortcut: "/shopify-app-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
