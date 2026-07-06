"use client";

import { useMemo, useState } from "react";
import { useLanguage } from "@/components/language-provider";
import { ItemCard } from "@/components/item-card";
import { ThumbImage } from "@/components/thumb-image";
import { formatDate } from "@/lib/format";
import type { DictKey } from "@/lib/i18n";
import type { Item } from "@/db/schema";

const PAGE = 18;

/* Lead story — the newest item, magazine-feature sized. */
function FeatureCard({ item }: { item: Item }) {
  const { lang, t } = useLanguage();
  const date = formatDate(item.publishedDate, lang);
  const isMedia = item.type === "media";

  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group rise mb-10 grid overflow-hidden rounded-3xl border border-mauve/60 bg-seashell transition duration-300 hover:border-mauve hover:shadow-[0_24px_50px_-24px_rgba(59,15,47,0.45)] md:grid-cols-[1.2fr_1fr]"
    >
      <div className="relative aspect-[3/2] overflow-hidden bg-champagne md:aspect-auto md:h-full md:min-h-[320px]">
        <ThumbImage
          url={item.thumbnailUrl}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
        />
        <span className="absolute inset-0 bg-mauve opacity-0 mix-blend-multiply transition duration-500 group-hover:opacity-25" />
        {isMedia && (
          <>
            <span className="absolute inset-0 bg-gradient-to-t from-ink/30 to-transparent to-55%" />
            <span className="absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-seashell/90 text-xl text-plum shadow-sm transition duration-300 group-hover:scale-110">
              ▶
            </span>
          </>
        )}
      </div>

      <div className="flex flex-col justify-center gap-4 p-7 md:p-10">
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
        <h2 className="font-display text-2xl leading-snug text-ink md:text-3xl">
          <span className="title-underline">{item.title}</span>
        </h2>
        {item.excerpt && (
          <p className="line-clamp-3 leading-relaxed text-muted">
            {item.excerpt}
          </p>
        )}
        <span className="flex items-center gap-1.5 text-sm font-medium text-mauve">
          {item.type === "media"
            ? t("card.watch")
            : item.type === "statement"
              ? t("card.readStatement")
              : t("card.read")}
          <span className="inline-block transition-transform duration-300 group-hover:translate-x-1 rtl:group-hover:-translate-x-1">
            ↗
          </span>
        </span>
      </div>
    </a>
  );
}

export function ItemBrowser({
  items,
  kind,
}: {
  items: Item[];
  kind: "article" | "media" | "statement";
}) {
  const { t } = useLanguage();
  const [q, setQ] = useState("");
  const [year, setYear] = useState("all");
  const [format, setFormat] = useState("all");
  const [sort, setSort] = useState<"newest" | "oldest">("newest");
  const [limit, setLimit] = useState(PAGE);

  const years = useMemo(
    () =>
      Array.from(
        new Set(
          items.map((i) => i.publishedDate?.slice(0, 4)).filter(Boolean),
        ),
      )
        .sort()
        .reverse() as string[],
    [items],
  );

  const formats = useMemo(
    () =>
      Array.from(
        new Set(items.map((i) => i.mediaFormat).filter(Boolean)),
      ) as string[],
    [items],
  );

  const filtered = useMemo(() => {
    const r = items.filter((i) => {
      if (q) {
        const hay = `${i.title} ${i.source} ${i.excerpt ?? ""}`.toLowerCase();
        if (!hay.includes(q.toLowerCase())) return false;
      }
      if (year !== "all" && i.publishedDate?.slice(0, 4) !== year) return false;
      if (kind === "media" && format !== "all" && i.mediaFormat !== format)
        return false;
      return true;
    });
    r.sort((a, b) => {
      const da = a.publishedDate ?? "";
      const db = b.publishedDate ?? "";
      if (da === db) return 0;
      return sort === "newest" ? (da < db ? 1 : -1) : da > db ? 1 : -1;
    });
    return r;
  }, [items, q, year, format, sort, kind]);

  // Lead story only in the pristine view (no search/filter, newest first)
  const pristine =
    q === "" && year === "all" && format === "all" && sort === "newest";
  const feature = pristine && filtered.length > 0 ? filtered[0] : null;
  const rest = feature ? filtered.slice(1) : filtered;
  const shown = rest.slice(0, limit);

  const selectCls =
    "select-pill rounded-full border border-line bg-seashell ps-4 py-2 text-sm text-ink outline-none transition focus:border-mauve";
  const gridKey = `${q}|${year}|${format}|${sort}`;

  return (
    <div>
      {/* Search + sort (+ format) */}
      <div className="rise mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setLimit(PAGE);
          }}
          placeholder={t(
            kind === "article"
              ? "browse.searchArticles"
              : kind === "media"
                ? "browse.searchMedia"
                : "browse.searchStatements",
          )}
          className="flex-1 rounded-full border border-line bg-seashell px-5 py-2.5 text-sm text-ink outline-none transition placeholder:text-muted focus:border-mauve"
        />
        {kind === "media" && formats.length > 0 && (
          <select
            value={format}
            onChange={(e) => {
              setFormat(e.target.value);
              setLimit(PAGE);
            }}
            className={selectCls}
          >
            <option value="all">{t("browse.allFormats")}</option>
            {formats.map((f) => (
              <option key={f} value={f}>
                {t(`fmt.${f}` as DictKey)}
              </option>
            ))}
          </select>
        )}
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as "newest" | "oldest")}
          className={selectCls}
        >
          <option value="newest">{t("browse.newest")}</option>
          <option value="oldest">{t("browse.oldest")}</option>
        </select>
      </div>

      {/* Year scrubber */}
      {years.length > 1 && (
        <div
          className="rise no-scrollbar mb-8 flex gap-2 overflow-x-auto pb-1"
          style={{ "--d": "0.08s" } as React.CSSProperties}
        >
          <button
            onClick={() => {
              setYear("all");
              setLimit(PAGE);
            }}
            className={`shrink-0 rounded-full border px-4 py-1.5 text-sm transition ${
              year === "all"
                ? "border-mauve bg-mauve text-seashell"
                : "border-line text-plum hover:border-mauve"
            }`}
          >
            {t("browse.all")}
          </button>
          {years.map((y) => (
            <button
              key={y}
              onClick={() => {
                setYear(y);
                setLimit(PAGE);
              }}
              className={`shrink-0 rounded-full border px-4 py-1.5 text-sm tabular-nums transition ${
                year === y
                  ? "border-mauve bg-mauve text-seashell"
                  : "border-line text-plum hover:border-mauve"
              }`}
            >
              {y}
            </button>
          ))}
        </div>
      )}

      {feature && <FeatureCard item={feature} />}

      {shown.length === 0 && !feature ? (
        <div className="py-20 text-center">
          <div className="font-display text-3xl text-mauve/40">٭</div>
          <p className="mt-4 text-muted">{t("browse.noResults")}</p>
        </div>
      ) : (
        <div
          key={gridKey}
          className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
        >
          {shown.map((it, i) => (
            <div
              key={it.id}
              className="card-in"
              style={{ animationDelay: `${Math.min(i * 45, 400)}ms` }}
            >
              <ItemCard item={it} />
            </div>
          ))}
        </div>
      )}

      {shown.length < rest.length && (
        <div className="mt-10 text-center">
          <button
            onClick={() => setLimit((l) => l + PAGE)}
            className="rounded-full border border-mauve px-6 py-2.5 text-sm font-medium text-plum transition hover:bg-antique"
          >
            {t("browse.loadMore")}
          </button>
        </div>
      )}
    </div>
  );
}
