---
name: project-overview
description: Orientation map for the Dr. Wadiha El Amiouni bilingual Arabic-first personal-brand site (Next.js App Router + Tailwind v4 + Drizzle/Neon on Vercel): stack, repo map, article/media/statement content model, xlsx→seed→DB data flow, /admin, secrets, namesake and privacy rules — read this first in any new session before touching content, database, design, i18n, or deploys.
---

# Project Overview — drwadihaelamiouni

Read this skill first in every new session. It is the map; the other six skills are the territory.

## What this site is

A bilingual, **Arabic-first (RTL)** personal-brand website for **Prof. Dr. Wadiha El Amiouni (أ.د. وديعة الأميوني)** — sociology professor and director of the Institute of Social Sciences Branch 3 (معهد العلوم الاجتماعية – الفرع الثالث), Lebanese University, Tripoli/North Lebanon. It aggregates her published articles, media appearances, and press statements into one catalog site. Canonical name strings and contact info live in `lib/site.ts` (`SITE.nameAr`, `SITE.nameEn`, `SITE.email`, `SITE.facebook`) — never hand-type her name elsewhere.

**No scraping in production.** Content enters the DB either via the seed pipeline or manually through the private `/admin` page.

<!-- Discrepancy: README.md says "Status: Planning complete; app scaffolding pending" — that is stale. The app is fully built (app/, components/, db/, lib/ all exist and deploy). Trust the code, not the README status line. -->

## Ownership & accounts (this matters)

- GitHub repo `github.com/wamiouni/drwadihaelamiouni` is under **her** GitHub account; the maintainer (Anthony) is a collaborator.
- The Vercel project is under **her** account and **auto-deploys on every push to `main`**. Pushing = deploying. Run `npm run build` locally and make sure it passes before any push.
- The repo is **PUBLIC**. Never commit secrets, personal documents, or anything private (see Do-not section).

## Stack (exact, from package.json)

| Layer | What | Version |
|---|---|---|
| Framework | Next.js App Router | `next` 16.2.9 |
| UI | React | `react` / `react-dom` 19.2.4 |
| Styling | Tailwind CSS **v4, CSS-first** — tokens defined in `@theme {}` inside `app/globals.css` (no tailwind.config file) | `tailwindcss` ^4 via `@tailwindcss/postcss` |
| ORM | Drizzle | `drizzle-orm` 0.45.2, `drizzle-kit` 0.31.10 |
| DB driver | `@neondatabase/serverless` (HTTP driver: `drizzle(neon(url))`) | ^1.1.0 |
| Scripts | `tsx` for TS scripts, `xlsx` (SheetJS) for seed parsing, `dotenv` | devDeps |

Database: **Neon Postgres** (Frankfurt, pooled connection string).

npm scripts: `dev`, `build`, `start`, `lint`, `db:push` (drizzle-kit push), `db:seed` (tsx scripts/seed.ts), `db:studio`.

## Repo map

```
app/
  layout.tsx            Root layout: lang="ar" dir="rtl", loads 4 next/font fonts
                        (Newsreader, Amiri, Montserrat with adjustFontFallback:false, IBM Plex Sans Arabic)
  page.tsx              Home: hero, about, latest rails (uses lib/queries.ts getLatest)
  globals.css           Tailwind v4 @theme tokens (--font-body/--font-serif/--font-arabic,
                        bg-parchment/text-ink colors) + the [dir="rtl"] letter-spacing kill rule
  articles/page.tsx     /articles list (type "article")
  media/page.tsx        /media list (type "media")
  statements/page.tsx   /statements list (type "statement")
  contact/page.tsx      /contact
  admin/page.tsx        Private admin UI (single password)
  admin/actions.ts      Server actions: loginAction, logoutAction, previewAction, addAction, deleteAction
  api/thumb/route.ts    GET image proxy: /api/thumb?u=<url> — spoofs referer to beat hotlink protection
components/             header, footer, hero, item-card, item-browser (search/filter/sort),
                        thumb-image, rail, page-intro, about-section, contact-content,
                        language-provider (ar/en toggle context)
db/
  schema.ts             Drizzle schema: `items` table + enums (see content model)
  index.ts              exports `db` = drizzle(neon(DATABASE_URL), { schema })
lib/
  site.ts               SITE constants (names, email, facebook)
  queries.ts            getItems(type), getLatest(type, limit=10), getAllItems()
  i18n.ts               Lang type, DEFAULT_LANG="ar", full ar/en string dictionary
  format.ts             formatDate(date, lang) — Intl, ar vs en-GB
  url.ts                dedupKey(url) normalizer + isArabic(s) detector
  enrich.ts             enrich(url, type): og:title/og:image/datePublished scrape + YouTube oEmbed
  auth.ts               cookie auth against ADMIN_PASSWORD: isAuthed(), signIn(), signOut()
scripts/
  seed.ts               xlsx → Neon seeder (idempotent; optional --reset)
  thumbs.ts             backfills NULL thumbnailUrl from og:image / YouTube thumbnails
docs/
  build_sheet.py        python3+openpyxl generator of the seed spreadsheet (curated data inline)
  Wadiha-El-Amiouni-Brand-Guide.html   design/brand reference
Wadiha_El_Amiouni_Articles_and_Media.xlsx   committed seed/backup spreadsheet (generated file)
drizzle.config.ts       drizzle-kit config (schema ./db/schema.ts, dialect postgresql)
next.config.ts          devIndicators:false only
.firecrawl/             gitignored scratch dir for discovery/scrape intermediates
public/                 portrait.webp, about.webp, svg assets
.env                    gitignored — DATABASE_URL, ADMIN_PASSWORD
```

## Content model — three types, precise meanings

`db/schema.ts` defines `pgEnum("item_type", ["article", "media", "statement"])`:

- **article** — pieces SHE authored (the byline is hers). Op-eds in Annahar, journal pieces in Al-Hadatha, etc.
- **media** — TV/radio/video/podcast appearances (MTV Lebanon, OTV, Télé Liban, RED TV, Sky News Arabia video…). `mediaFormat` enum: `tv | radio | video | podcast | print`.
- **statement (تصريح)** — press or university pieces **quoting** her commentary, including conferences/seminars where she spoke or organized. She didn't write it; she's quoted in it.

The `items` table columns: `id` (uuid), `type`, `title`, `titleEn`, `url`, `source`, `publishedDate`, `thumbnailUrl`, `excerpt`, `language` (`ar|en`, default `ar`), `mediaFormat`, `topic`, `status` (`draft|published`, default `published`), `featured` (bool), `dedupKey` (**unique** — normalized URL from `lib/url.ts dedupKey()`), `addedAt`.

### Owner curation rules (decided by the site owner — follow unless she overrules)

1. Her own CV / profile / bio pages are **never** content items.
2. Attendance-only or "represented MP X" delegate coverage is **excluded** unless the owner explicitly approves.
3. **Dedupe by EVENT**, not just URL: several outlets covering one event → keep ONE authoritative source.
4. Dead links: replace with an official mirror (e.g. NNA, nna-leb.gov.lb) **only after verifying the mirror actually quotes her**.
5. Before adding anything, open the publisher's own page and verify it is genuinely her (her byline or a named quote). Report findings honestly — including "not found / could not verify".

## Data flow

```
docs/build_sheet.py  (python3 + openpyxl; curated rows hardcoded in the script)
        │  python3 docs/build_sheet.py        [regenerates the xlsx]
        ▼
Wadiha_El_Amiouni_Articles_and_Media.xlsx     [committed; durable seed/backup]
        │  npm run db:seed  (= npx tsx scripts/seed.ts)
        │  idempotent: dedupKey unique + .onConflictDoNothing({ target: items.dedupKey })
        ▼
Neon Postgres  ("items" table — the LIVE source of truth)
        │  lib/queries.ts: getItems / getLatest / getAllItems
        ▼
app/ pages  (/, /articles, /media, /statements)  ── thumbnails render via /api/thumb?u=…

Parallel write path:
/admin (password) → previewAction(url) runs lib/enrich.ts → addAction inserts into Neon
```

**The rule that keeps this coherent:** content added via *scripts* must ALSO be added to `docs/build_sheet.py` and the xlsx regenerated, so a fresh re-seed reproduces it. Content added via `/admin` is admin-owned and NOT expected in the sheet.

Seed expects sheet names exactly: `Articles مقالات`, `Media ظهور إعلامي`, `Statements تصريح` (see `SHEETS` in `scripts/seed.ts`), columns `[idx, title, source, date, url]`, and skips rows whose first cell isn't a number.

**`--reset` warning:** `npx tsx scripts/seed.ts --reset` runs `db.delete(items)` — it wipes **everything**, including admin-added rows that are not in the xlsx. Only use it when you know admin content is expendable or backed up.

One-off DB scripts: create `scripts/_something.ts` importing `"dotenv/config"` and `drizzle(neon(process.env.DATABASE_URL!))`, run `npx tsx scripts/_something.ts` **from the project root** (tsx resolves node_modules there), then **delete the script**. Never commit or leave `_`-prefixed scripts behind.

## Secrets

- `.env` (gitignored via `.env*`) holds exactly two secrets: `DATABASE_URL` (Neon pooled) and `ADMIN_PASSWORD`.
- Never print, echo, log, or commit their values. Naming the variable is fine; the value is not.
- `lib/auth.ts` derives an httpOnly cookie token from `ADMIN_PASSWORD` (sha256 of `wadiha:<pw>`); if the env var is unset, `isAuthed()` always returns false and `/admin` is locked.

## The namesake trap

There is another person with the **identical full name** "وديعة ابراهيم الأميوني": a **MALE linguistics professor (أستاذ ألسنية) born 1945, known as «نبال» (Nabal)**. Ours is the **female sociologist, born 1976 in Zgharta**. The full legal names match exactly — first, father's, and family name — so disambiguation relies ONLY on: gender markers in the Arabic text (شاركت vs شارك, الدكتورة vs الدكتور), field (sociology vs linguistics), birth year (1976 vs 1945), and her affiliation (Institute of Social Sciences Branch 3, Lebanese University). The About sheet of the seed xlsx records this filter. Adding the linguist's work to her site is the single most embarrassing possible mistake.

## Do not (hard rules)

- **Do not commit personal documents.** Her CV `.docx` was once committed and had to be purged from all git history with `git-filter-repo` + force push. `.gitignore` now blocks `*.docx` — a CV docx may sit untracked in the working dir; leave it untracked. This must never recur.
- **Do not push without `npm run build` passing** — push to `main` auto-deploys to production on her Vercel account.
- **Do not letter-space Arabic.** Connected script breaks. `app/globals.css` has `[dir="rtl"] [class*="tracking-"] { letter-spacing: 0 !important; }` — don't remove it, don't work around it.
- **Do not reorder the font stack casually.** `--font-body` in globals.css intentionally uses the literal `"Montserrat"` name (not the next/font variable), and `app/layout.tsx` sets `adjustFontFallback: false` on Montserrat — the synthetic "Montserrat Fallback" contains Arabic glyphs and used to hijack Arabic text before it reached IBM Plex Sans Arabic.
- **Do not scrape into the repo.** Firecrawl scratch output goes in `.firecrawl/` (gitignored).
- **Do not run destructive DB ops** (`--reset`, `db.delete`) without confirming what will be lost.
- Commit convention: imperative subject, body explains why, end with `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`.

## Quick-start commands

```bash
npm run dev                 # local dev server
npm run build               # MUST pass before any push
npm run db:seed             # idempotent seed from the xlsx
npm run db:push             # push schema changes to Neon (drizzle-kit)
npm run db:studio           # browse the DB
npx tsx scripts/thumbs.ts   # backfill missing thumbnails
python3 docs/build_sheet.py # regenerate the seed xlsx after editing it
```

## The skill library — when to reach for what

- **project-overview** (this file) — orientation; read first in every session.
- **manage-content** — adding/editing/removing items: /admin flow, curation rules in practice, sheet+seed dual-write rule, thumbnails, dedupe-by-event decisions.
- **discover-content** — finding new articles/appearances: Firecrawl CLI usage (`firecrawl search`, `firecrawl scrape`), known source outlets (annahar.com, Sky News Arabia, NNA, ul.edu.lb, MTV Lebanon, sawteljil.com, …), verification workflow, the namesake disambiguation procedure.
- **database** — schema details, Drizzle/Neon patterns, migrations via `db:push`, the one-off `scripts/_*.ts` pattern, seed internals and `--reset` semantics.
- **design-rtl** — Tailwind v4 `@theme` tokens, the RTL/Arabic typography rules (tracking kill, font-stack ordering, Amiri vs Plex Arabic), component conventions.
- **i18n-pages** — the ar/en dictionary in `lib/i18n.ts`, `language-provider`, adding translated strings and pages, date formatting via `lib/format.ts`.
- **deploy-ops** — Vercel auto-deploy model, env vars in Vercel, pre-push checklist, git hygiene on a public repo, the history-purge precedent.
