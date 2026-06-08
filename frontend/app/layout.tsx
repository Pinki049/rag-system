import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ask My Doc — AI Document Intelligence",
  description: "Ask questions about your documents with AI-powered citations",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}