"use client";

import { useLanguage } from "@/components/language-provider";
import { formatDate } from "@/lib/format";
import type { Item } from "@/db/schema";

const FORMAT_ICON: Record<string, string> = {
  tv: "📺",
  radio: "🎙️",
  video: "▶️",
  podcast: "🎧",
  print: "📰",
};

export function ItemCard({ item }: { item: Item }) {
  const { lang, t } = useLanguage();
  const date = formatDate(item.publishedDate, lang);

  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-seashell transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_34px_-16px_rgba(110,75,88,0.45)]"
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-champagne">
        {item.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.thumbnailUrl}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center font-display text-4xl text-mauve/40">
            {lang === "ar" ? "و" : "W"}
          </div>
        )}
        {item.type === "media" && (
          <span className="absolute bottom-2 start-2 rounded-full bg-ink/75 px-2 py-0.5 text-xs text-parchment">
            {FORMAT_ICON[item.mediaFormat ?? "video"] ?? "▶️"}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-full bg-antique px-2 py-0.5 font-medium text-mauve-dark">
            {item.source}
          </span>
          {date && <span className="text-muted">{date}</span>}
        </div>
        <h3 className="font-display text-lg leading-snug text-ink line-clamp-3">
          {item.title}
        </h3>
        {item.excerpt && (
          <p className="line-clamp-2 text-sm text-muted">{item.excerpt}</p>
        )}
        <span className="mt-auto pt-1 text-xs font-medium text-plum opacity-0 transition group-hover:opacity-100">
          {item.type === "article" ? t("card.read") : t("card.watch")} ↗
        </span>
      </div>
    </a>
  );
}
