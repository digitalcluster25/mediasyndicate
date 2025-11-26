import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MediaSyndicate",
  description: "RSS feed aggregator",
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

