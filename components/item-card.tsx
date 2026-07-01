"use client";

import { useState } from "react";
import { useLanguage } from "@/components/language-provider";
import { formatDate } from "@/lib/format";
import type { DictKey } from "@/lib/i18n";
import type { Item } from "@/db/schema";

export function ItemCard({ item }: { item: Item }) {
  const { lang, t } = useLanguage();
  const date = formatDate(item.publishedDate, lang);
  const isMedia = item.type === "media";

  // Load thumbnail directly; on failure retry via our referer-spoofing proxy
  // (bypasses hotlink protection); if that fails too, fall back to the monogram.
  const [stage, setStage] = useState<0 | 1 | 2>(0);
  const src =
    !item.thumbnailUrl || stage === 2
      ? null
      : stage === 0
        ? item.thumbnailUrl
        : `/api/thumb?u=${encodeURIComponent(item.thumbnailUrl)}`;

  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-seashell transition duration-300 hover:-translate-y-1 hover:border-mauve/30 hover:shadow-[0_18px_40px_-20px_rgba(59,15,47,0.4)]"
    >
      <div className="relative aspect-[3/2] w-full overflow-hidden border-b border-line bg-champagne">
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt=""
            loading="lazy"
            onError={() => setStage((s) => (s + 1) as 0 | 1 | 2)}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center font-display text-4xl text-mauve/40">
            {lang === "ar" ? "و" : "W"}
          </div>
        )}
        {/* Plum duotone wash on hover */}
        <span className="absolute inset-0 bg-mauve opacity-0 mix-blend-multiply transition duration-500 group-hover:opacity-25" />
        {isMedia && (
          <>
            <span className="absolute inset-0 bg-gradient-to-t from-ink/30 to-transparent to-55%" />
            <span className="absolute left-1/2 top-1/2 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-seashell/90 text-plum shadow-sm transition duration-300 group-hover:scale-110">
              ▶
            </span>
          </>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2.5 p-5">
        <div className="flex flex-wrap items-center gap-2.5 text-xs">
          <span className="rounded-full bg-champagne px-3 py-1 font-medium text-plum">
            {item.source}
          </span>
          {isMedia && item.mediaFormat && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-antique px-3 py-1 text-plum">
              <span className="text-mauve">▶</span>
              {t(`fmt.${item.mediaFormat}` as DictKey)}
            </span>
          )}
          {date && (
            <span className="uppercase tracking-wide text-meta">{date}</span>
          )}
        </div>
        <h3 className="font-display text-lg leading-[1.5] text-ink line-clamp-3">
          <span className="title-underline">{item.title}</span>
        </h3>
        {item.excerpt && (
          <p className="line-clamp-2 text-sm text-muted">{item.excerpt}</p>
        )}
        <span className="mt-auto flex items-center gap-1 pt-1 text-xs font-medium text-mauve opacity-0 transition duration-300 group-hover:opacity-100">
          {item.type === "article" ? t("card.read") : t("card.watch")}
          <span className="inline-block transition-transform duration-300 group-hover:translate-x-1 rtl:group-hover:-translate-x-1">
            ↗
          </span>
        </span>
      </div>
    </a>
  );
}
