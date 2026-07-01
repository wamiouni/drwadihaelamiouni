"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/components/language-provider";

export function AboutSection() {
  const { t, lang } = useLanguage();
  const [hasImg, setHasImg] = useState(false);

  // Show /about.webp only if it exists (monogram fallback, no broken icon).
  useEffect(() => {
    const im = new window.Image();
    im.onload = () => setHasImg(true);
    im.src = "/about.webp";
  }, []);

  return (
    <section className="bg-mauve text-seashell">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-16 md:grid-cols-[300px_1fr] md:py-20">
        {/* Text — inline-end (the hero portrait sits at inline-end, so the
            About image takes inline-start to mirror it) */}
        <div className="text-center md:order-2 md:text-start">
          <div className="mb-3 flex items-center justify-center gap-4 md:justify-start">
            <span className="font-display text-lg leading-none text-antique/80">
              ٭
            </span>
            <h2 className="text-2xl text-seashell">{t("home.about.title")}</h2>
            <span className="hidden h-px flex-1 bg-seashell/20 md:block" />
          </div>
          <p className="dropcap dropcap-cream mx-auto mt-4 max-w-xl leading-[1.9] text-seashell/85 md:mx-0">
            {t("about.body")}
          </p>
        </div>

        {/* Image — inline-start, opposite the hero portrait */}
        <div className="relative mx-auto aspect-[4/5] w-56 overflow-hidden rounded-2xl border border-seashell/25 bg-champagne shadow-[0_22px_48px_-20px_rgba(0,0,0,0.5)] md:order-1 md:w-full">
          {hasImg ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src="/about.webp"
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center font-display text-6xl text-mauve/40">
              {lang === "ar" ? "و" : "W"}
            </div>
          )}
          <span className="pointer-events-none absolute inset-4 rounded-xl border border-antique/50" />
        </div>
      </div>
    </section>
  );
}
