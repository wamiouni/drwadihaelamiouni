"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useLanguage } from "@/components/language-provider";
import { SITE } from "@/lib/site";

export function Hero() {
  const { t, lang } = useLanguage();
  const [hasPortrait, setHasPortrait] = useState(false);

  // Probe for /portrait.webp — show it only if it actually exists (no broken icon).
  useEffect(() => {
    const im = new window.Image();
    im.onload = () => setHasPortrait(true);
    im.src = "/portrait.webp";
  }, []);

  return (
    <section className="relative overflow-hidden border-b border-line bg-gradient-to-b from-seashell to-parchment">
      {/* Ghost letter bleeding off the inline-end edge */}
      <span
        aria-hidden
        className="ghost-letter font-display absolute -bottom-24 -end-10 text-[26rem] md:-bottom-40 md:text-[42rem]"
      >
        {lang === "ar" ? "و" : "W"}
      </span>

      <div className="relative mx-auto grid max-w-6xl items-center gap-8 px-5 py-12 md:grid-cols-[1.15fr_1fr] md:gap-12 md:py-24">
        {/* Text — on mobile the identity block is centered (ceremonial), the
            bio is start-aligned reading text demoted below the CTAs. */}
        <div className="order-2 flex flex-col text-center md:order-1 md:block md:text-start">
          <h1
            className="rise order-1 font-display text-[clamp(2.1rem,8.5vw,3.75rem)] leading-[1.15] text-ink"
            style={{ "--d": "0.05s" } as React.CSSProperties}
          >
            {lang === "ar" ? SITE.nameAr : SITE.nameEn}
          </h1>
          {/* Secondary (transliterated) name — desktop only; on mobile it
              costs a line without adding information. */}
          <div
            className="rise order-3 mt-2 hidden font-display text-xl text-plum/80 md:block md:text-2xl"
            style={{ "--d": "0.2s" } as React.CSSProperties}
          >
            {lang === "ar" ? SITE.nameEn : SITE.nameAr}
          </div>

          {/* Motto as a pull-quote */}
          <div
            className="rise order-4 mt-7 flex items-baseline justify-center gap-3 md:justify-start"
            style={{ "--d": "0.28s" } as React.CSSProperties}
          >
            <span
              aria-hidden
              className="font-display text-5xl leading-none text-mauve/40"
            >
              {lang === "ar" ? "«" : "“"}
            </span>
            <p className="font-display text-2xl text-plum md:text-3xl">
              {t("hero.motto")}
            </p>
          </div>

          {/* Bio: reading text — start-aligned. DOM order (used on desktop):
              motto → bio → CTAs. On mobile, flex order demotes it below CTAs. */}
          <p
            className="rise order-6 mx-auto mt-6 max-w-xl text-start leading-relaxed text-muted md:mx-0 md:mt-4"
            style={{ "--d": "0.36s" } as React.CSSProperties}
          >
            {t("hero.bio")}
          </p>

          <div
            className="rise order-5 mt-8 flex justify-center gap-3 md:mt-9 md:justify-start"
            style={{ "--d": "0.44s" } as React.CSSProperties}
          >
            <Link
              href="/articles"
              className="rounded-full bg-mauve px-6 py-2.5 text-sm font-medium text-seashell transition hover:bg-mauve-dark"
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

        {/* Portrait — arched; leads the page on mobile */}
        <div
          className="rise order-1 relative mx-auto mt-2 aspect-[4/5] w-48 md:order-2 md:mt-0 md:w-full md:max-w-sm"
          style={{ "--d": "0.08s" } as React.CSSProperties}
        >
          <div className="h-full w-full overflow-hidden rounded-t-full rounded-b-2xl border border-line bg-champagne shadow-[0_24px_50px_-24px_rgba(59,15,47,0.45)]">
            {hasPortrait ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src="/portrait.webp"
                alt={lang === "ar" ? SITE.nameAr : SITE.nameEn}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center font-display text-7xl text-mauve/50">
                {lang === "ar" ? "و" : "W"}
              </div>
            )}
          </div>
          {/* Concentric arch outline */}
          <span className="pointer-events-none absolute -inset-3 rounded-t-full rounded-b-3xl border border-mauve/25" />
        </div>
      </div>
    </section>
  );
}
