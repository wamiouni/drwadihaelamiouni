---
name: discover-content
description: Research the web (Firecrawl CLI) for new articles, media appearances, and تصريح statements by/about Prof. Wadiha El Amiouni — covers Arabic search queries, the namesake disambiguation trap, byline/quote verification, article-vs-media-vs-statement classification, event- and DB-level dedupe, date extraction from rawHtml, and owner sign-off before anything is inserted.
---

# Discovering new content for drwadihaelamiouni.com

This skill covers the RESEARCH half only: finding candidate URLs, verifying them,
classifying them, deduping them, and presenting them to the owner. Actual insertion
(DB + spreadsheet) is the `manage-content` skill — see the handoff section at the end.

**Who we catalog:** Prof. Dr. Wadiha El Amiouni (أ.د. وديعة الأميوني), FEMALE
sociologist, born 1976 in Zgharta, professor at the Lebanese University and director
of the Institute of Social Sciences Branch 3 (معهد العلوم الاجتماعية – الفرع الثالث),
Tripoli / North Lebanon.

## Prerequisites

- Firecrawl CLI is installed (`/opt/homebrew/bin/firecrawl`). Check auth with
  `firecrawl --status`.
- All scrape/search scratch output goes in `.firecrawl/` at the repo root. It is
  gitignored (see `.gitignore`) — never commit it. Make subfolders per task
  (existing examples: `.firecrawl/dates/`, `.firecrawl/cv_search/`, `.firecrawl/results/`).
- `.env` at repo root holds `DATABASE_URL` (Neon Postgres) — needed only for the
  DB-dedupe step. Never print its value.

## Firecrawl CLI usage

### Search (start broad, always quote her name)

```bash
# Exact-name sweep — her name in quotes to avoid partial matches
firecrawl search "\"وديعة الأميوني\"" --limit 20

# Topic-scoped, recent only (qdr:y = past year; also qdr:m, qdr:w)
firecrawl search "وديعة الأميوني الذكاء الاصطناعي" --limit 10 --tbs qdr:y

# News vertical
firecrawl search "وديعة الأميوني" --limit 15 --sources news

# Alternate spellings — try all of these, results differ:
#   "وديعة الاميوني" (no hamza), "وديعه الاميوني", "Wadiha El Amiouni",
#   "Wadiha Amyouni", site-scoped: "وديعة الأميوني site:annahar.com"
```

`--limit` default is 5, max 100. Add `--scrape` to hydrate results with page
content in one shot, but usually you want to screen the result list first and
scrape only survivors.

### Scrape (verify candidates)

```bash
# Clean markdown of the article body — enough for byline/quote verification
firecrawl scrape "https://www.annahar.com/arabic/..." --only-main-content \
  -o .firecrawl/results/annahar-candidate.md

# Raw HTML — needed for dates and og: tags (meta tags are stripped from markdown)
firecrawl scrape "https://www.annahar.com/arabic/..." --format rawHtml \
  -o .firecrawl/results/annahar-candidate.html
```

Notes:
- For `scrape`, `--only-main-content` defaults to FALSE (unlike `search --scrape`,
  where it defaults true). Pass it explicitly.
- Multiple URLs can be passed positionally; they scrape concurrently.
- **Firecrawl refuses facebook.com URLs.** Facebook-only content (some TV segments
  are posted only there) cannot be scraped; note the URL and verify it manually in
  a browser, or find the same segment on YouTube / the channel's own site.
- Some Lebanese sites are slow/flaky — retry once with `--wait-for 3000` before
  declaring a page dead.

## The verification pipeline — run ALL of these, in order, for every candidate

### (a) Identity — the namesake trap

There are TWO people with the **IDENTICAL full legal name وديعة ابراهيم الأميوني**
— first, father's, and family name all match. Getting this wrong publishes another
person's work on her site. The name alone can NEVER disambiguate; the row below can:

| | OURS ✓ | NOT OURS ✗ |
|---|---|---|
| Full name | وديعة ابراهيم الأميوني | وديعة ابراهيم الأميوني (identical!) |
| Known as | — | «نبال» (Nabal) |
| Gender | female (البروفسورة، الدكتورة) | MALE |
| Born | 1976, **Zgharta** | 1945, **also Zgharta** |
| Field | sociology (علم الاجتماع) | Arabic linguistics (أستاذ ألسنية), Sorbonne PhD |
| Affiliation | Lebanese Univ., ISS Branch 3, Tripoli | — |

Same name, same home town — only gender, generation, and field separate them.

(The About sheet of the seed xlsx documents this filter — see `docs/build_sheet.py`.)

Disambiguators to look for on the page: feminine grammatical agreement
(الباحثة، أستاذة، مديرة — not الباحث/أستاذ), sociology/social-research topics,
mention of الجامعة اللبنانية or معهد العلوم الاجتماعية الفرع الثالث or طرابلس.
Anything about Arabic linguistics, poetry, or an author born in the 1940s → reject.
If a page gives no disambiguating signal at all, treat it as UNVERIFIED and say so
in your report — do not guess.

### (b) Authenticity — verify on the publisher's own page

Never trust a search snippet or an aggregator. Scrape the actual publisher URL and
confirm ONE of:
- her byline (بقلم د. وديعة الأميوني / وديعة الأميوني as author), or
- a named quote (e.g. «قالت الباحثة الاجتماعية وديعة الأميوني...», وأشارت الأميوني...), or
- named speaker/organizer at an event (ألقت... / نظّمت مديرة المعهد...).

```bash
grep -n "الأميوني\|الاميوني" .firecrawl/results/annahar-candidate.md
```

If her name never appears in the page body, it is not a candidate — even if the
search engine surfaced it. Report such not-founds honestly.

### (c) Classification — article vs media vs statement

The DB enum is `item_type: article | media | statement` (`db/schema.ts`). Rules:

- **article** — SHE wrote it; her byline is on it. Examples: Annahar op-eds
  («الحروب وموازين القوى في زمن الذكاء الاصطناعي»), Al-Hadatha journal papers,
  Safir al-Shamal columns.
- **media** — she APPEARS in TV/radio/video/podcast. Examples: MTV Lebanon
  ("Leadership", "Family" programs), OTV, Télé Liban, RED TV, YouTube interviews.
  These also get a `media_format` (`tv | radio | video | podcast | print`).
- **statement (تصريح)** — a press or university piece QUOTING her commentary,
  including conferences/seminars/workshops where she spoke or organized. Examples
  in the current catalog: Sky News Arabia pieces quoting her as social researcher,
  Alhurra quoted commentary, Balamand conference coverage, NNA event reports,
  ul.edu.lb institute activity pages.

Decision shortcuts: byline hers → article. Video/audio of her → media. Text about
an event or topic where she is quoted/named → statement. A written Q&A interview
on a news site is a statement (text quoting her), not media.

### (d) Event-level dedupe

Several outlets often cover ONE event (a seminar in Tripoli gets written up by NNA,
eccowatan, sawteljil...). Owner rule: keep ONE authoritative source per event.
Authority order: the hosting institution's own page (ul.edu.lb, balamand.edu.lb) >
official agency (NNA, nna-leb.gov.lb) > established outlet > local aggregator.

This applies to event COVERAGE (statements). Her authored articles republished by a
second outlet have historically been kept as separate entries (e.g.
«العملات الرقمية بين الاستخدام والتنظيم» exists in `docs/build_sheet.py` under both
النهار and سفير الشمال) — republication of her own byline is fine; duplicate event
reports are not.

### (e) DB dedupe — check before proposing

`lib/url.ts` defines the canonical key:

```ts
export function dedupKey(url: string): string  // lowercases, strips #fragment,
// strips utm_*/fbclid/gclid/mc_*/igshid, trailing ?&/ — KEEPS meaningful query (?v=)
```

`items.dedupKey` is `NOT NULL UNIQUE` (`db/schema.ts`), and `scripts/seed.ts`
inserts with `onConflictDoNothing({ target: items.dedupKey })`, so an exact-URL
re-add is harmless — but you must still check so you don't waste the owner's time
proposing known items. One-off check script (project pattern: create, run from
repo root, DELETE afterwards):

```ts
// scripts/_check.ts — delete after use
import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq, ilike } from "drizzle-orm";
import { items } from "../db/schema";
import { dedupKey } from "../lib/url";

async function main() {
  const db = drizzle(neon(process.env.DATABASE_URL!));
  const url = process.argv[2];
  const byUrl = await db.select({ id: items.id, title: items.title, type: items.type })
    .from(items).where(eq(items.dedupKey, dedupKey(url)));
  console.log(byUrl.length ? byUrl : "URL not in DB");
}
main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
```

```bash
npx tsx scripts/_check.ts "https://candidate-url" && rm scripts/_check.ts
```

Also check by TITLE (the same piece can live at a different URL — republishers,
URL migrations): add an `ilike(items.title, '%distinctive-phrase%')` query when in
doubt. And check the event-dedupe angle: is another outlet's report of the same
event already cataloged?

### (f) Date extraction

The pipeline needs `YYYY-MM-DD` (`normDate()` in `scripts/seed.ts` only accepts
`\d{4}-\d{2}-\d{2}`; anything else becomes NULL). In order of reliability:

1. **rawHtml metadata** — scrape with `--format rawHtml`, then:
   ```bash
   grep -o '"datePublished"[^,]*' .firecrawl/results/x.html
   grep -o 'article:published_time[^>]*' .firecrawl/results/x.html
   grep -oE '20[0-2][0-9]-[01][0-9]-[0-3][0-9]' .firecrawl/results/x.html | sort | uniq -c
   ```
2. **The URL itself** — Safir al-Shamal and WordPress sites embed `/2025/12/15/`.
3. **Visible Arabic dates on the page.** Lebanese sites use Levantine month names:
   كانون الثاني=01, شباط=02, آذار=03, نيسان=04, أيار=05, حزيران=06, تموز=07,
   آب=08, أيلول=09, تشرين الأول=10, تشرين الثاني=11, كانون الأول=12.
   Pan-Arab sites (Sky News Arabia) use يناير/فبراير/مارس/أبريل/مايو/يونيو/يوليو/
   أغسطس/سبتمبر/أكتوبر/نوفمبر/ديسمبر. Watch out for Hijri dates on some sites — ignore them.
4. If no date is findable, leave it blank (the sheet uses `''`) and say so — do not invent one.

### (g) Owner sign-off — MANDATORY before insertion

Present candidates to the owner/maintainer as a list BEFORE anything touches the DB
or spreadsheet. For each candidate give: proposed type (article/media/statement),
title, source, date (or "no date found"), the URL, and the one-line evidence for
identity+authenticity ("byline بقلم د. وديعة الأميوني", "quoted as الباحثة الاجتماعية").
Equally important: report what you did NOT find and what you REJECTED and why
(namesake, no quote, duplicate event, attendance-only). Honest negative results are
part of the deliverable. Insert nothing without an explicit go-ahead.

## Known sources (proven starting points)

annahar.com (her op-eds), Al-Hadatha journal (alhadathamagazine.blogspot.com),
Safir al-Shamal, INN Lebanon, alhurra.com, Sky News Arabia, NNA (nna-leb.gov.lb),
ul.edu.lb (institute news), MTV Lebanon ("Leadership" & "Family"), OTV, Télé Liban,
RED TV, Beirut 2030 (beirut2030.me), General Security Magazine, altaleb.org.lb,
sawteljil.com, eccowatan.com, balamand.edu.lb, starnewsvision.com, YouTube.
Site-scoped searches against these ("وديعة الأميوني site:ul.edu.lb") are the
highest-yield first pass.

## Dead links → official mirror

If a cataloged or candidate URL 404s or the outlet is gone, look for an official
mirror — NNA (nna-leb.gov.lb) republishes much Lebanese event coverage. Only swap
in the mirror after scraping it and confirming it actually quotes/names her
(pipeline steps b–a still apply). Never substitute an unverified mirror.

## What NOT to add — ever

- Her own CV / profile / bio pages (ul.edu.lb faculty profile, ResearchGate,
  conference speaker bios). These are identity sources for step (a), not content.
- Attendance-only coverage: "among the attendees was..." or "represented MP X"
  delegate mentions — excluded unless the owner explicitly approves that item.
- Anything by the namesake (the male linguist «نبال», b. 1945 — identical full name).
- Facebook-only posts, unless the owner supplies/approves the link (Firecrawl
  can't verify them anyway).
- Search-snippet-only finds you could not verify on the publisher page.

## Danger / Do not

- The GitHub repo (github.com/wamiouni/drwadihaelamiouni) is PUBLIC. Never commit:
  `.env` values, `.firecrawl/` scratch, or any personal document. `*.docx` is
  gitignored because her CV was once committed and had to be purged from git
  history with git-filter-repo — do not recreate that incident.
- Never print `DATABASE_URL` or `ADMIN_PASSWORD` values.
- Never leave one-off `scripts/_*.ts` files behind; run `npx tsx` from the repo
  root (tsx resolves `node_modules` there) and delete the script after.
- Never run `npx tsx scripts/seed.ts --reset` casually — it DELETES the whole
  items table, including admin-added rows not present in the spreadsheet.
- This skill ends at a verified, owner-approved candidate list. Do not insert.

## Handoff to manage-content

Once the owner approves candidates, switch to the `manage-content` skill. Summary
of what it does (so you hand off the right data): every scripted addition goes BOTH
into the DB and into `docs/build_sheet.py` (the `articles` / `media` / `statements`
lists, tuple shape `(url, 'title', 'source Ar / En', 'YYYY-MM-DD', 'topic')`),
then the xlsx is regenerated (`python3 docs/build_sheet.py`) and re-seeded
(`npx tsx scripts/seed.ts` — idempotent, no `--reset`). Afterwards
`npx tsx scripts/thumbs.ts` backfills `thumbnail_url` from YouTube IDs / og:image
for the new rows. Hand over, per item: type, title (Arabic), source (Arabic / English
form as in existing entries), date or '', URL, topic, and your verification evidence.
