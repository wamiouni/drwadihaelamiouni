"use client";

import { useLanguage } from "@/components/language-provider";

export function AboutSection() {
  const { t } = useLanguage();
  return (
    <section className="mx-auto max-w-3xl px-5 py-14 text-center">
      <span className="mx-auto mb-4 block h-px w-12 bg-mauve/50" />
      <h2 className="text-2xl text-ink">{t("home.about.title")}</h2>
      <p className="mt-4 leading-relaxed text-ink/80">{t("about.body")}</p>
    </section>
  );
}
