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
      <h1 className="font-display text-3xl text-ink md:text-4xl">
        {t(titleKey)}
      </h1>
      {subKey && <p className="mt-2 text-muted">{t(subKey)}</p>}
    </div>
  );
}
