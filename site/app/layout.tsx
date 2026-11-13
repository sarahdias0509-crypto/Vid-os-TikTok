import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { business } from "@/lib/config.ts";
import "./globals.css";

export const metadata: Metadata = {
  title: `${business.name} — Extensions & lissages à domicile à Genève`,
  description: "Extensions de cheveux Weft et bandes adhésives, lissages et soins botox capillaires à domicile à Genève. Réservation en ligne.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#faf6f1" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr-CH">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600&family=Inter:wght@400;600;700&display=swap"
        />
      </head>
      <body>
        <header className="header">
          <div className="container">
            <Link href="/" className="logo">{business.name}</Link>
            <nav className="nav" aria-label="Navigation principale">
              <Link href="/#prestations" className="hide-sm">Prestations</Link>
              <Link href="/boutique">Boutique</Link>
              <Link href="/reserver" className="cta">Réserver</Link>
            </nav>
          </div>
        </header>
        <main>{children}</main>
        <footer className="footer">
          <div className="container">
            <span>© {new Date().getFullYear()} {business.name} · À domicile · {business.area}</span>
            <a href={`https://instagram.com/${business.instagram}`} target="_blank" rel="noopener noreferrer">
              Instagram @{business.instagram}
            </a>
          </div>
        </footer>
      </body>
    </html>
  );
}
