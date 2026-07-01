"use client";

import { useLanguage } from "@/components/language-provider";
import type { DictKey } from "@/lib/i18n";

export function PageIntro({
  titleKey,
  subKey,
}: {
  titleKey: DictKey;
  subKey?: DictKey;
}) {
  const { t } = useLanguage();
  return (
    <div className="mb-10">
      <div className="rise mb-3 flex items-center gap-4">
        <span
          aria-hidden
          className="font-display text-lg leading-none text-mauve/60"
        >
          ٭
        </span>
        <span className="h-px flex-1 bg-line" />
      </div>
      <h1
        className="rise font-display text-4xl text-ink md:text-5xl"
        style={{ "--d": "0.08s" } as React.CSSProperties}
      >
        {t(titleKey)}
      </h1>
      {subKey && (
        <p
          className="rise mt-3 text-muted"
          style={{ "--d": "0.16s" } as React.CSSProperties}
        >
          {t(subKey)}
        </p>
      )}
    </div>
  );
}
