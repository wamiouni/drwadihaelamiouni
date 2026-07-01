"use client";

import Link from "next/link";
import { useState } from "react";
import { useLanguage } from "@/components/language-provider";
import { SITE } from "@/lib/site";

export function Hero() {
  const { t, lang } = useLanguage();
  const [imgOk, setImgOk] = useState(true);

  return (
    <section className="border-b border-line bg-gradient-to-b from-seashell to-parchment">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-16 md:grid-cols-[300px_1fr] md:py-24">
        <div className="mx-auto aspect-[4/5] w-56 overflow-hidden rounded-2xl border border-line bg-champagne shadow-[0_18px_40px_-20px_rgba(110,75,88,0.4)] md:w-full">
          {imgOk ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src="/portrait.jpg"
              alt={lang === "ar" ? SITE.nameAr : SITE.nameEn}
              onError={() => setImgOk(false)}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center font-display text-7xl text-mauve/50">
              {lang === "ar" ? "و" : "W"}
            </div>
          )}
        </div>

        <div className="text-center md:text-start">
          <h1 className="font-display text-4xl text-plum md:text-5xl">
            {lang === "ar" ? SITE.nameAr : SITE.nameEn}
          </h1>
          <div className="mt-1 font-display text-xl text-mauve">
            {lang === "ar" ? SITE.nameEn : SITE.nameAr}
          </div>
          <p className="mt-4 text-xs uppercase tracking-[0.15em] text-muted">
            {t("hero.identity")}
          </p>
          <p className="mt-4 font-display text-2xl text-ink">
            &ldquo;{t("hero.motto")}&rdquo;
          </p>
          <p className="mx-auto mt-4 max-w-xl leading-relaxed text-muted md:mx-0">
            {t("hero.bio")}
          </p>
          <div className="mt-8 flex justify-center gap-3 md:justify-start">
            <Link
              href="/articles"
              className="rounded-full bg-mauve px-6 py-2.5 text-sm font-medium text-parchment transition hover:bg-mauve-dark"
            >
              {t("hero.readArticles")}
            </Link>
            <Link
              href="/media"
              className="rounded-full border border-mauve px-6 py-2.5 text-sm font-medium text-plum transition hover:bg-antique"
            >
              {t("hero.watchMedia")}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
