import type { Metadata, Viewport } from "next";
import { Fraunces, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const display = Fraunces({ subsets: ["latin"], variable: "--font-fraunces", display: "swap" });
const body = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-plex-mono", display: "swap" });

export const metadata: Metadata = {
  title: "DeutschStream – German voice practice",
  description: "Practise German listening and speaking with an AI conversation partner.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ebe0c9" },
    { media: "(prefers-color-scheme: dark)", color: "#2c3a3e" },
  ],
};

// Runs before first paint so a saved light/dark choice never flashes the wrong theme.
const themeScript = `try{var t=JSON.parse(localStorage.getItem("deutschstream.settings")||"{}").theme;if(t==="light"||t==="dark")document.documentElement.setAttribute("data-theme",t)}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="bg-canvas text-fg antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
