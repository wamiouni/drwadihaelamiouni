"use client";

import Link from "next/link";
import { useState } from "react";
import { useLanguage } from "@/components/language-provider";
import { SITE } from "@/lib/site";
import type { DictKey } from "@/lib/i18n";

const LINKS: { href: string; key: DictKey }[] = [
  { href: "/", key: "nav.home" },
  { href: "/articles", key: "nav.articles" },
  { href: "/media", key: "nav.media" },
  { href: "/contact", key: "nav.contact" },
];

function LangToggle() {
  const { lang, toggle } = useLanguage();
  return (
    <button
      onClick={toggle}
      className="rounded-full border border-line px-3 py-1 text-xs font-medium text-plum transition hover:border-mauve hover:text-mauve"
      aria-label="Toggle language"
    >
      {lang === "ar" ? "EN" : "ع"}
    </button>
  );
}

export function Header() {
  const { t, lang } = useLanguage();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-parchment/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <Link
          href="/"
          className="flex items-center gap-2.5 text-ink"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full border border-mauve font-display text-base text-plum">
            {lang === "ar" ? "و" : "W"}
          </span>
          <span className="font-display text-xl">
            {lang === "ar" ? SITE.nameAr : SITE.nameEn}
          </span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="relative text-sm text-ink/80 transition hover:text-mauve after:absolute after:-bottom-1 after:start-0 after:h-px after:w-full after:origin-left after:scale-x-0 after:bg-mauve after:transition-transform after:duration-300 hover:after:scale-x-100 rtl:after:origin-right"
            >
              {t(l.key)}
            </Link>
          ))}
          <LangToggle />
        </nav>

        <div className="flex items-center gap-3 md:hidden">
          <LangToggle />
          <button
            onClick={() => setOpen((o) => !o)}
            aria-label="Menu"
            className="flex h-8 w-8 items-center justify-center text-xl text-plum"
          >
            {open ? "✕" : "☰"}
          </button>
        </div>
      </div>

      {open && (
        <nav className="flex flex-col border-t border-line px-5 py-2 md:hidden">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="py-2 text-ink/80 transition hover:text-mauve"
            >
              {t(l.key)}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
