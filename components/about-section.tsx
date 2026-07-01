"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/components/language-provider";

export function AboutSection() {
  const { t, lang } = useLanguage();
  const [hasImg, setHasImg] = useState(false);

  // Show /about.jpg only if it exists (monogram fallback, no broken icon).
  useEffect(() => {
    const im = new window.Image();
    im.onload = () => setHasImg(true);
    im.src = "/about.jpg";
  }, []);

  return (
    <section className="mx-auto max-w-6xl px-5 py-16">
      <div className="grid items-center gap-10 md:grid-cols-[1fr_300px]">
        {/* Text — inline-start (opposite the hero portrait) */}
        <div className="text-center md:text-start">
          <span className="mx-auto mb-4 block h-px w-12 bg-mauve/50 md:mx-0" />
          <h2 className="text-2xl text-ink">{t("home.about.title")}</h2>
          <p className="mx-auto mt-4 max-w-xl leading-relaxed text-ink/80 md:mx-0">
            {t("about.body")}
          </p>
        </div>

        {/* Image — inline-end, mirrors the hero on the opposite side */}
        <div className="relative mx-auto aspect-[4/5] w-56 overflow-hidden rounded-2xl border border-line bg-champagne shadow-[0_18px_40px_-20px_rgba(110,75,88,0.4)] md:w-full">
          {hasImg ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src="/about.jpg"
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center font-display text-6xl text-mauve/40">
              {lang === "ar" ? "و" : "W"}
            </div>
          )}
          <span className="pointer-events-none absolute inset-4 rounded-xl border border-mauve/35" />
        </div>
      </div>
    </section>
  );
}
