import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Star Sea Hero",
  description: "An interactive celestial sky over a living sea.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
