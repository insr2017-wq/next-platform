import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BeMine",
  description: "Plataforma BeMine",
  themeColor: "#122a63",
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

