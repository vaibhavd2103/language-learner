import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sprechen – German speaking practice",
  description: "Practise German listening and speaking with an AI conversation partner.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
