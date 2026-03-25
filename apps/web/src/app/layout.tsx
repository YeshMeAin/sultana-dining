import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";
import { Nav } from "@/components/Nav";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Sultana's Kitchen",
  description:
    "Personal chef & catering — home-cooked cuisine with a vegan & vegetarian heart.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${playfair.variable} ${inter.variable}`}>
      <body>
        <Nav />
        <main>{children}</main>
        <footer className="bg-aubergine text-cream/60 text-sm py-8 mt-24">
          <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="font-display text-cream/80 text-base">
              Sultana&apos;s Kitchen
            </span>
            <span>
              &copy; {new Date().getFullYear()} — All rights reserved
            </span>
          </div>
        </footer>
      </body>
    </html>
  );
}
