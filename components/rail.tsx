"use client";

import { useRef } from "react";
import Link from "next/link";
import { useLanguage } from "@/components/language-provider";
import { ItemCard } from "@/components/item-card";
import type { DictKey } from "@/lib/i18n";
import type { Item } from "@/db/schema";

export function Rail({
  titleKey,
  viewAllHref,
  items,
}: {
  titleKey: DictKey;
  viewAllHref: string;
  items: Item[];
}) {
  const { t, dir } = useLanguage();
  const ref = useRef<HTMLDivElement>(null);

  const scroll = (amount: number) =>
    ref.current?.scrollBy({
      left: dir === "rtl" ? -amount : amount,
      behavior: "smooth",
    });

  if (!items.length) return null;

  return (
    <section className="mx-auto max-w-6xl px-5 py-10">
      <div className="mb-5 flex items-end justify-between gap-4">
        <h2 className="text-2xl text-plum">{t(titleKey)}</h2>
        <div className="flex items-center gap-2">
          <Link
            href={viewAllHref}
            className="text-sm text-mauve transition hover:text-plum"
          >
            {t("common.viewAll")} ↗
          </Link>
          <button
            onClick={() => scroll(-360)}
            aria-label="Previous"
            className="hidden h-8 w-8 rounded-full border border-line text-plum transition hover:border-mauve md:flex md:items-center md:justify-center"
          >
            ‹
          </button>
          <button
            onClick={() => scroll(360)}
            aria-label="Next"
            className="hidden h-8 w-8 rounded-full border border-line text-plum transition hover:border-mauve md:flex md:items-center md:justify-center"
          >
            ›
          </button>
        </div>
      </div>

      <div
        ref={ref}
        className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2"
      >
        {items.map((it) => (
          <div
            key={it.id}
            className="w-[260px] shrink-0 snap-start sm:w-[280px]"
          >
            <ItemCard item={it} />
          </div>
        ))}
      </div>
    </section>
  );
}
