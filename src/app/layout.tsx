import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
});

export const metadata: Metadata = {
  title: "Stock Market Dashboard",
  description: "Track stock market trends, companies, and beginner investing guidance.",
};

const navItems = [
  { href: "/", label: "Market" },
  { href: "/companies", label: "Companies" },
  { href: "/guide", label: "Investing Guide" },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={spaceGrotesk.variable}>
        <div className="shell">
          <div className="container">
            <header className="site-header">
              <Link className="brand" href="/">
                <span className="brand-name">Market Atlas</span>
                <span className="brand-tag">A stock market dashboard for investors who want signal fast</span>
              </Link>

              <nav className="nav" aria-label="Primary">
                {navItems.map((item) => (
                  <Link key={item.href} href={item.href}>
                    {item.label}
                  </Link>
                ))}
              </nav>
            </header>

            {children}
            <footer className="footer">Educational data only. Replace the mock market feed with a real API when you are ready.</footer>
          </div>
        </div>
      </body>
    </html>
  );
}