import type { Metadata } from "next";
import {
  Newsreader,
  Amiri,
  Montserrat,
  IBM_Plex_Sans_Arabic,
} from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/components/language-provider";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-newsreader",
  display: "swap",
});
const amiri = Amiri({
  subsets: ["arabic", "latin"],
  weight: ["400", "700"],
  variable: "--font-amiri",
  display: "swap",
});
const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-montserrat",
  display: "swap",
  // No synthetic (Arial-based) fallback: it contains Arabic glyphs and would
  // swallow Arabic text before it reaches IBM Plex Sans Arabic in the stack.
  adjustFontFallback: false,
});
const plexAr = IBM_Plex_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-plex-ar",
  display: "swap",
});

export const metadata: Metadata = {
  title: "أ.د. وديعة الأميوني | Prof. Dr. Wadiha El Amiouni",
  description:
    "مقالات وظهور إعلامي للدكتورة وديعة الأميوني — أستاذة علم الاجتماع في الجامعة اللبنانية.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={`${newsreader.variable} ${amiri.variable} ${montserrat.variable} ${plexAr.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-parchment text-ink">
        <LanguageProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </LanguageProvider>
      </body>
    </html>
  );
}
