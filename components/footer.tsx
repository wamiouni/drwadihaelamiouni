"use client";

import Link from "next/link";
import { useLanguage } from "@/components/language-provider";
import { SITE } from "@/lib/site";

export function Footer() {
  const { t, lang } = useLanguage();
  const year = new Date().getFullYear();

  return (
    <footer className="mt-20 border-t border-line bg-seashell">
      <div className="mx-auto max-w-6xl px-5 py-10">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="font-display text-lg text-plum">
              {lang === "ar" ? SITE.nameAr : SITE.nameEn}
            </div>
            <div className="mt-1 text-sm text-muted">
              &ldquo;{t("hero.motto")}&rdquo;
            </div>
          </div>
          <div className="flex flex-wrap gap-5 text-sm text-muted">
            <Link href="/articles" className="transition hover:text-mauve">
              {t("nav.articles")}
            </Link>
            <Link href="/media" className="transition hover:text-mauve">
              {t("nav.media")}
            </Link>
            <Link href="/contact" className="transition hover:text-mauve">
              {t("nav.contact")}
            </Link>
            <a
              href={SITE.facebook}
              target="_blank"
              rel="noopener noreferrer"
              className="transition hover:text-mauve"
            >
              Facebook
            </a>
          </div>
        </div>
        <div className="mt-8 text-xs text-muted/80">
          © {year} — {t("footer.rights")}
        </div>
      </div>
    </footer>
  );
}
