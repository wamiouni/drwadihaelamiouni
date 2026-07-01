"use client";

import Link from "next/link";
import { useLanguage } from "@/components/language-provider";
import { SITE } from "@/lib/site";

export function Footer() {
  const { t, lang } = useLanguage();
  const year = new Date().getFullYear();

  return (
    <footer className="relative mt-20 overflow-hidden bg-mauve text-seashell">
      {/* Ghost name watermark */}
      <span
        aria-hidden
        className="font-display pointer-events-none absolute -bottom-10 start-0 select-none whitespace-nowrap text-[9rem] leading-none text-seashell opacity-[0.05] md:text-[13rem]"
      >
        {lang === "ar" ? "وديعة الأميوني" : "Wadiha El Amiouni"}
      </span>

      <div className="relative mx-auto max-w-6xl px-5 py-16 md:py-20">
        {/* The closing thought */}
        <div className="text-center">
          <span
            aria-hidden
            className="font-display block text-4xl leading-none text-seashell/40"
          >
            {lang === "ar" ? "«" : "“"}
          </span>
          <p className="font-display mx-auto mt-2 max-w-2xl text-3xl leading-snug md:text-4xl">
            {t("hero.motto")}
          </p>
          <div className="mx-auto mt-6 h-px w-16 bg-seashell/30" />
          <div className="font-display mt-5 text-lg text-seashell/80">
            {lang === "ar" ? SITE.nameAr : SITE.nameEn}
          </div>
        </div>

        {/* Links */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-seashell/70">
          <Link href="/articles" className="transition hover:text-seashell">
            {t("nav.articles")}
          </Link>
          <Link href="/media" className="transition hover:text-seashell">
            {t("nav.media")}
          </Link>
          <Link href="/contact" className="transition hover:text-seashell">
            {t("nav.contact")}
          </Link>
        </div>

        <div className="mt-8 text-center text-xs text-seashell/45">
          © {year} — {t("footer.rights")}
        </div>
      </div>
    </footer>
  );
}
