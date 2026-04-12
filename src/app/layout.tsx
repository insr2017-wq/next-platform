import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Jdeer-12nh",
  description: "Modern web platform skeleton",
  themeColor: "#9e2135",
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

