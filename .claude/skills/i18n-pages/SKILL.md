---
name: i18n-pages
description: Bilingual (Arabic-first RTL) translation system and page/content-type structure for the Wadiha El Amiouni site — lib/i18n.ts dict keys, t()/language-provider toggle, and the full file-by-file checklist for adding a new content type (like the statement/تصريح precedent) or a new plain page.
---

# i18n & Page Structure

Site is Arabic-first (default `ar`, `dir="rtl"`), with a client-side EN toggle.
There is exactly ONE translation file and ONE content table. Everything visible
on the public site is either a dict string from `lib/i18n.ts` or a DB row
rendered by `components/item-card.tsx`.

Content types (DB enum `item_type`): `article` (she wrote it), `media`
(TV/radio/video/podcast appearance), `statement` / تصريح (press piece quoting
her, incl. conferences she spoke at). Do not blur these; the owner curates by
these exact meanings.

## 1. Dict anatomy — `lib/i18n.ts`

```ts
export type Lang = "ar" | "en";
export const DEFAULT_LANG: Lang = "ar";
export const dict = { ar: { ... }, en: { ... } } as const;
export type DictKey = keyof (typeof dict)["ar"];
export function translate(lang: Lang, key: DictKey): string {
  return dict[lang][key] ?? dict.ar[key] ?? key;
}
```

- Two mirror objects, `ar` and `en`, same keys, flat namespace.
- Key convention: `section.camelCaseName` — e.g. `nav.statements`,
  `home.latestStatements`, `browse.searchStatements`, `statements.title`,
  `statements.sub`, `card.readStatement`, `fmt.tv`, `common.viewAll`,
  `footer.rights`.
- Multi-paragraph values use `\n\n` inside a single string. Only `about.body`
  does this today; `components/about-section.tsx` renders it with
  `t("about.body").split("\n\n").map(...)`. Keep the same number of paragraphs
  in ar and en.
- `fmt.*` keys must cover every value of the `media_format` pg enum
  (`tv radio video podcast print` — see `db/schema.ts`), because
  `item-card.tsx` and `item-browser.tsx` build keys dynamically:
  `t(`fmt.${item.mediaFormat}` as DictKey)`.

### The iron rule: every key exists in BOTH languages

Enforcement is mostly compile-time, and it is asymmetric:

- **Key missing from `en`**: `dict[lang][key]` (lang is the union `"ar"|"en"`)
  fails to type-check → `npm run build` fails. Good — loud failure.
- **Key missing from `ar`**: `DictKey` is derived from `ar`, so the key
  silently stops existing as a type; every `t("that.key")` call site turns
  into a TS error. Also loud, but the error points at consumers, not the dict.
- **Runtime fallback** (`?? dict.ar[key] ?? key`) only ever fires for keys
  built with an `as DictKey` cast (the `fmt.*` pattern). If you add a new
  `media_format` enum value and forget its `fmt.*` keys, nothing fails at
  build time — the UI renders the raw key string like `fmt.webinar`. Check
  visually.

Rule of thumb: add ar and en entries in the same commit, then `npm run build`.

## 2. Language toggle — `components/language-provider.tsx`

Client context, not URL-based routing. There is no `/en/...` path; one page
serves both languages.

- `LanguageProvider` holds `useState<Lang>(DEFAULT_LANG)`.
- On mount it reads `localStorage.getItem("lang")` (accepts only `"ar"`/`"en"`).
- On every change it sets `document.documentElement.lang` and
  `document.documentElement.dir = lang === "ar" ? "rtl" : "ltr"` and persists
  to `localStorage.setItem("lang", lang)`. That single `dir` flip is what makes
  all the Tailwind logical properties (`start-*`, `rtl:` variants) reorient.
- `useLanguage()` returns `{ lang, dir, toggle, t }`. `t` is
  `(key: DictKey) => dict[lang][key] ?? dict.ar[key] ?? key`.
- SSR default lives in `app/layout.tsx`: `<html lang="ar" dir="rtl">`. So the
  server always renders Arabic; an EN visitor sees a client-side flip after
  hydration. This is accepted behavior — do not "fix" it with cookies/middleware
  without the owner asking.
- The visible toggle is `LangToggle` inside `components/header.tsx`.

Some strings bypass the dict on purpose: `lib/site.ts` exports
`SITE.nameAr` / `SITE.nameEn` (plus `email`, `facebook`), and components branch
on `lang === "ar"` directly (header monogram "و"/"W", footer watermark).

Arabic typography law: NEVER letter-space Arabic. `app/globals.css` has
`[dir="rtl"] [class*="tracking-"] { letter-spacing: 0 !important; }` as a
safety net — do not remove it, and don't add manual `letter-spacing` on
Arabic text.

## 3. Page structure

Pattern (see `app/statements/page.tsx`, identical for articles/media):

```tsx
import { getItems } from "@/lib/queries";
import { PageIntro } from "@/components/page-intro";
import { ItemBrowser } from "@/components/item-browser";
export const dynamic = "force-dynamic";
export default async function StatementsPage() {
  const items = await getItems("statement");
  return (
    <div className="mx-auto max-w-6xl px-5 py-12">
      <PageIntro titleKey="statements.title" subKey="statements.sub" />
      <ItemBrowser items={items} kind="statement" />
    </div>
  );
}
```

- Server components fetch; ALL translated text lives in client components.
  Server components pass `DictKey` props (`titleKey`, `subKey`) down — they
  never call `t()` themselves.
- `lib/queries.ts`: `getItems(type)` (published, newest first),
  `getLatest(type, limit = 10)` (featured first), `getAllItems()` (admin only —
  includes drafts). `type` is the literal union `"article" | "media" | "statement"`.
- `export const dynamic = "force-dynamic"` on every DB-backed page — the DB is
  live truth, no ISR.
- Home (`app/page.tsx`): `Promise.all` of three `getLatest` calls → three
  `<Rail titleKey="home.latest…" viewAllHref="/…" items={…} index={n} />`
  (index is the decorative folio number).
- `components/item-browser.tsx` (client): search/year/format filters, paging,
  FeatureCard lead story. `components/item-card.tsx` (client): thumbnail with
  the 3-stage fallback (direct → `/api/thumb` proxy → monogram) and the
  per-type CTA ternary (`card.watch` / `card.readStatement` / `card.read`).

## 4. MASTER CHECKLIST — adding a new content type

Reverse-engineered from the `statement` precedent. Say the new type is `book`
(route `/books`). Every step below is a real place `statement` appears today —
grep `-rn "statement" --include='*.ts*'` to sanity-check you got them all.

1. **`db/schema.ts`** — add to the enum:
   `pgEnum("item_type", ["article", "media", "statement", "book"])`,
   then `npm run db:push` (needs `DATABASE_URL` in `.env`). Postgres can ADD
   enum values cheaply; REMOVING one is a manual migration — don't add
   speculatively.
2. **`lib/i18n.ts`** — add to BOTH `ar` and `en`:
   `nav.books`, `home.latestBooks`, `browse.searchBooks`, `books.title`,
   `books.sub`, and a CTA key (pattern: `card.readStatement` → `card.readBook`).
3. **`lib/queries.ts`** — widen the type unions in `getItems` and `getLatest`
   signatures to include `"book"`.
4. **`app/books/page.tsx`** — copy `app/statements/page.tsx`, swap the three
   identifiers (`getItems("book")`, `titleKey="books.title"`,
   `kind="book"`). Keep `export const dynamic = "force-dynamic"`.
5. **`app/page.tsx`** — add `getLatest("book", 10)` to the `Promise.all` and a
   fourth `<Rail titleKey="home.latestBooks" viewAllHref="/books" items={books} index={4} />`.
6. **`components/header.tsx`** — add `{ href: "/books", key: "nav.books" }` to
   the `LINKS` array (drives both desktop and mobile nav).
7. **`components/footer.tsx`** — add a `<Link href="/books">{t("nav.books")}</Link>`
   to the links block (footer links are hand-written, not from `LINKS`).
8. **`components/item-browser.tsx`** — widen `kind` prop union
   (`"article" | "media" | "statement" | "book"`); extend the search-placeholder
   ternary to map `book → "browse.searchBooks"`; extend the CTA ternary in
   `FeatureCard` (`item.type === "book" ? t("card.readBook") : …`).
9. **`components/item-card.tsx`** — extend the same CTA ternary near the
   bottom of the card.
10. **`components/admin/admin-dashboard.tsx`** — three spots:
    the `useState<"article" | "media" | "statement">` type union; the type
    toggle `(["article","media","statement"] as const).map(...)` plus its
    Arabic label map `{ article: "مقال", media: "ظهور إعلامي", statement: "تصريح" }`;
    the list-row icon ternary (`it.type === "article" ? "📄" : … : "💬"`).
11. **`app/admin/actions.ts`** — widen `AddInput.type` and the `previewAction`
    `type` param; add `revalidatePath("/books")` to `revalidateAll()`.
12. **`lib/enrich.ts`** — widen the `_type` param union on
    `enrich(url, _type)` (currently unused at runtime, but TS will complain).
13. **`scripts/seed.ts`** — add `{ name: "Books كتب", type: "book" }` to the
    `SHEETS` array. Sheet name must match the xlsx tab EXACTLY (current tabs:
    `Articles مقالات`, `Media ظهور إعلامي`, `Statements تصريح`).
14. **`docs/build_sheet.py`** — add a `books = [...]` list (rows are
    `(index_or_url, clean_title, source, date, topic)`; a raw URL string works
    where an index into the `.firecrawl/seen.pkl` pickle doesn't apply) and a
    `wb.create_sheet('Books كتب')` + `make_sheet(...)` call mirroring
    `ws_st = wb.create_sheet('Statements تصريح')`. Then regenerate:
    `python3 docs/build_sheet.py` (needs openpyxl; writes
    `Wadiha_El_Amiouni_Articles_and_Media.xlsx` — check the script's save path)
    and re-run `npm run db:seed` (idempotent via `dedupKey` +
    `onConflictDoNothing`; `--reset` wipes the table first — that also deletes
    admin-added rows, so avoid on prod unless told).
15. **Verify**: `npm run build` (this catches every missed en key and every
    missed type-union widening), then check `/books`, home rail, header,
    footer, and `/admin` (toggle + list icon) in both languages.

Data rule that goes with this: content inserted by scripts must ALSO be in
`docs/build_sheet.py` so a re-seed reproduces it. Content added via `/admin`
is admin-owned and intentionally NOT in the sheet.

## 5. Simpler checklist — adding a plain page

Precedent: `/contact` (`app/contact/page.tsx` + `components/contact-content.tsx`).

1. `app/<name>/page.tsx` — server component; if no DB access, it can just
   render a client component (no `force-dynamic` needed).
2. `components/<name>-content.tsx` — `"use client"`, `useLanguage()`, all copy
   via `t()`. No hardcoded strings except things like emails/URLs (put those
   in `lib/site.ts`).
3. `lib/i18n.ts` — `<name>.title`, `<name>.lead`, etc., in BOTH ar and en.
4. `components/header.tsx` `LINKS` + `components/footer.tsx` link, with a
   `nav.<name>` key.
5. `npm run build`.

## 6. Do not

- **Never commit secrets or personal documents.** The GitHub repo
  (wamiouni/drwadihaelamiouni) is PUBLIC. `DATABASE_URL` and `ADMIN_PASSWORD`
  live only in `.env` (gitignored). Never print their values. `.gitignore`
  blocks `*.docx` because her CV was once committed and had to be purged from
  history — do not weaken that.
- Never letter-space Arabic or reorder the `--font-body` stack in
  `app/globals.css` / the `next/font` config in `app/layout.tsx`
  (`Montserrat` has `adjustFontFallback: false` on purpose — the synthetic
  fallback contains Arabic glyphs and hijacks Arabic text).
- Don't hardcode user-visible strings in components; don't add a key to one
  language only; don't rename existing dict keys casually (grep call sites).
- Don't run `npm run db:seed -- --reset` against production data on a whim —
  it deletes admin-added items that exist nowhere else.
- Don't change `dedupKey` logic (`lib/url.ts`) without re-checking seed
  idempotency — it's the unique constraint everything relies on.
- Content curation is the owner's call: her own CV/bio pages are never items;
  one event = one source; verify a page genuinely quotes/bylines HER (beware
  the namesake — a male linguist with the IDENTICAL full name وديعة ابراهيم
  الأميوني, known as «نبال», b. 1945; ours is the female sociologist, b. 1976 —
  see discover-content for the disambiguation table).
- Build must pass (`npm run build`) before pushing; push to `main`
  auto-deploys via Vercel.
