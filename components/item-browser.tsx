"use client";

import { useMemo, useState } from "react";
import { useLanguage } from "@/components/language-provider";
import { ItemCard } from "@/components/item-card";
import type { Item } from "@/db/schema";

const PAGE = 18;

export function ItemBrowser({
  items,
  kind,
}: {
  items: Item[];
  kind: "article" | "media";
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

  const shown = filtered.slice(0, limit);
  const selectCls =
    "select-pill rounded-full border border-line bg-seashell ps-4 py-2 text-sm text-ink outline-none transition focus:border-mauve";

  return (
    <div>
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setLimit(PAGE);
          }}
          placeholder={t(
            kind === "article" ? "browse.searchArticles" : "browse.searchMedia",
          )}
          className="flex-1 rounded-full border border-line bg-seashell px-5 py-2.5 text-sm text-ink outline-none transition placeholder:text-muted focus:border-mauve"
        />
        <select
          value={year}
          onChange={(e) => {
            setYear(e.target.value);
            setLimit(PAGE);
          }}
          className={selectCls}
        >
          <option value="all">{t("browse.allYears")}</option>
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
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
                {t(`fmt.${f}` as never)}
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

      {shown.length === 0 ? (
        <p className="py-16 text-center text-muted">{t("browse.noResults")}</p>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((it) => (
            <ItemCard key={it.id} item={it} />
          ))}
        </div>
      )}

      {shown.length < filtered.length && (
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
