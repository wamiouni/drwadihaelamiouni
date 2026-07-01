"use client";

import { useLanguage } from "@/components/language-provider";
import { SITE } from "@/lib/site";

export function ContactContent() {
  const { t } = useLanguage();
  return (
    <div className="mx-auto max-w-2xl px-5 py-20 text-center">
      <span className="mx-auto mb-5 block h-px w-12 bg-mauve/50" />
      <h1 className="font-display text-3xl text-plum md:text-4xl">
        {t("contact.title")}
      </h1>
      <p className="mx-auto mt-4 max-w-lg leading-relaxed text-muted">
        {t("contact.lead")}
      </p>

      <div className="mt-10 flex flex-col items-center gap-4">
        <a
          href={`mailto:${SITE.email}`}
          className="w-full max-w-sm rounded-2xl border border-line bg-seashell px-6 py-4 transition hover:border-mauve"
        >
          <div className="text-xs uppercase tracking-wide text-muted">
            {t("contact.email")}
          </div>
          <div className="mt-1 text-mauve-dark" dir="ltr">
            {SITE.email}
          </div>
        </a>
        <a
          href={SITE.facebook}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full max-w-sm rounded-2xl border border-line bg-seashell px-6 py-4 transition hover:border-mauve"
        >
          <div className="text-xs uppercase tracking-wide text-muted">
            {t("contact.facebook")}
          </div>
          <div className="mt-1 text-mauve-dark">facebook.com/namiouni</div>
        </a>
      </div>
    </div>
  );
}
