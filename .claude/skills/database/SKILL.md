---
name: database
description: Neon Postgres + Drizzle ORM layer for the Wadiha El Amiouni site — schema (items table, enums, dedupKey), neon-http connection quirks, db:push workflow, extending enums, lib/queries.ts helpers, one-off script pattern, seeding from the xlsx (db:seed / --reset), and db:studio. Load for any DB read/write/schema/seed/migration task.
---

# Database layer (Neon Postgres + Drizzle)

One Postgres database on Neon (Frankfurt, pooled connection string), one table (`items`),
accessed through Drizzle ORM over the **HTTP** driver. There are **no migration files** —
schema changes go straight to the DB with `drizzle-kit push`.

**The DB is production the moment you write to it.** Every public page uses
`export const dynamic = "force-dynamic"` (see `app/articles/page.tsx`) and renders
straight from the DB on each request. There is no staging environment. An INSERT is live
on drwadihaelamiouni's site within seconds.

## Connection anatomy

`db/index.ts` (11 lines, read it):

```ts
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

const sql = neon(process.env.DATABASE_URL);
export const db = drizzle(sql, { schema });
```

Import it in app code as `import { db } from "@/db";`.

Properties of the `neon-http` driver you must know:

- Each query is a **stateless HTTPS request**. No connection pool to manage, works in
  serverless/edge — that's why it's used.
- **No interactive transactions.** `db.transaction(async (tx) => ...)` throws at runtime
  (`No transactions support in neon-http driver`). If you need atomicity, use a single
  multi-row `insert`, or `db.batch([...])` — the neon-http driver runs a batch as one
  atomic Neon HTTP transaction. Nothing in this codebase currently uses either
  `transaction` or `batch` — keep it that way unless truly needed.
- No `LISTEN/NOTIFY`, no session state (`SET`, temp tables die per request).
- `db/index.ts` does **not** import dotenv. Next.js loads `.env` for app code, but any
  standalone script must start with `import "dotenv/config";` or `DATABASE_URL` will be
  undefined and the import of `@/db` will throw `DATABASE_URL is not set`.

`DATABASE_URL` and `ADMIN_PASSWORD` live in `.env` (gitignored via `.env*`). The repo is
PUBLIC. Never print, echo, or commit their values.

## Schema — `db/schema.ts` (the whole thing)

Four Postgres enums:

| TS export | PG name | Values |
|---|---|---|
| `itemType` | `item_type` | `article`, `media`, `statement` |
| `itemStatus` | `item_status` | `draft`, `published` |
| `itemLanguage` | `item_language` | `ar`, `en` |
| `mediaFormat` | `media_format` | `tv`, `radio`, `video`, `podcast`, `print` |

Domain meaning (owner-defined, do not blur): `article` = pieces SHE authored;
`media` = TV/radio/video/podcast appearances; `statement` (تصريح) = press/university
pieces quoting her commentary, including her conference and seminar talks.

One table, `items`:

| TS field | Column | Type | Null? | Default / notes |
|---|---|---|---|---|
| `id` | `id` | uuid | not null | `defaultRandom()`, PK |
| `type` | `type` | `item_type` | not null | |
| `title` | `title` | text | not null | Arabic title |
| `titleEn` | `title_en` | text | nullable | |
| `url` | `url` | text | not null | original publisher URL |
| `source` | `source` | text | not null | outlet name |
| `publishedDate` | `published_date` | date | nullable | string `"YYYY-MM-DD"` in TS |
| `thumbnailUrl` | `thumbnail_url` | text | nullable | served via `/api/thumb` proxy |
| `excerpt` | `excerpt` | text | nullable | |
| `language` | `language` | `item_language` | not null | default `"ar"` |
| `mediaFormat` | `media_format` | `media_format` | nullable | only meaningful for `media` |
| `topic` | `topic` | text | nullable | |
| `status` | `status` | `item_status` | not null | default `"published"` |
| `featured` | `featured` | boolean | not null | default `false`; sorts first on homepage |
| `dedupKey` | `dedup_key` | text | not null | **UNIQUE** — see below |
| `addedAt` | `added_at` | timestamptz | not null | `defaultNow()` |

Exported types: `export type Item = typeof items.$inferSelect;` and
`export type NewItem = typeof items.$inferInsert;`.

### dedupKey — never hand-roll it

`dedup_key` is the unique index that makes every insert path idempotent. It is ALWAYS
computed with `dedupKey(url)` from `lib/url.ts`:

```ts
export function dedupKey(url: string): string  // trim + lowercase, strips #fragment,
// utm_*/fbclid/gclid/mc_*/igshid params, trailing ?&/ — keeps meaningful query (?v=)
```

Every insert uses `.onConflictDoNothing({ target: items.dedupKey })` (see
`scripts/seed.ts` and `app/admin/actions.ts` `addAction`). If you insert without
computing dedupKey via this function, you either violate the unique constraint or,
worse, create a near-duplicate the dedup can't catch. Also from `lib/url.ts`:
`isArabic(s: string): boolean` — used to set `language`.

## Read helpers — `lib/queries.ts`

```ts
getItems(type: "article" | "media" | "statement")   // published only,
//   ORDER BY published_date DESC NULLS LAST, added_at DESC
getLatest(type, limit = 10)                          // published only,
//   ORDER BY featured DESC, published_date DESC NULLS LAST, LIMIT n
getAllItems()                                        // everything incl. drafts,
//   ORDER BY added_at DESC — used by /admin
```

Pages consume them as async server components: `app/articles/page.tsx`,
`app/media/page.tsx`, `app/statements/page.tsx` call `getItems(...)`; the homepage
(`app/page.tsx`) uses `getLatest`; `/admin` uses `getAllItems`. All are `force-dynamic`.
Writes go through server actions in `app/admin/actions.ts`: `addAction` and
`deleteAction` mutate and then call `revalidateAll()` (revalidatePath on `/`,
`/articles`, `/media`, `/statements`, `/admin`); `previewAction` is read-only (enriches
a URL and checks for an existing dedupKey). The file also has `loginAction`/`logoutAction`.

## Schema changes — push-based workflow

`drizzle.config.ts` points `drizzle-kit` at `./db/schema.ts`, dialect `postgresql`,
credentials from `DATABASE_URL` (it imports `dotenv/config` itself). `out: "./drizzle"`
is configured but **the `drizzle/` directory does not exist** — this project has never
generated migration files. The workflow is:

```bash
# 1. Edit db/schema.ts
# 2. Diff schema vs live DB and apply:
npm run db:push        # = drizzle-kit push
```

`db:push` introspects the live DB, computes a diff, shows the SQL, and asks for
confirmation on anything destructive. **Read the SQL it prints before saying yes.**

Risks specific to push:

- **Dropping/renaming a column**: push can't tell rename from drop+add. It will ask
  "rename or create+delete?" — answering wrong destroys production data. Prefer
  add-new-column → backfill → drop-old in separate pushes.
- **Enum changes**: *adding* a value is safe (`ALTER TYPE ... ADD VALUE`, additive).
  *Removing or renaming* an enum value is not supported cleanly — drizzle-kit tries to
  recreate the type, which fails or forces column rewrites while rows still use the old
  value. Migrate the rows off the value first.
- **New NOT NULL column without default** on a non-empty table: push fails or prompts
  to truncate. Add it nullable or with a default, backfill, then tighten.
- There is no history/rollback. If a push goes wrong, you fix forward.

### Precedent: how `statement` was added to `item_type` (commit 11ecdd8)

1. Added `"statement"` to the `itemType` pgEnum in `db/schema.ts`.
2. `npm run db:push` → additive `ALTER TYPE "item_type" ADD VALUE 'statement';` (safe).
3. Reclassified existing rows (5 press-quote items, article → statement).
4. Updated everything hard-coding the type union: `lib/queries.ts` signatures,
   `app/admin/actions.ts` (`previewAction` param + `AddInput`), `lib/enrich.ts`
   (`enrich(url, _type)`), `scripts/seed.ts` `SHEETS`, and `docs/build_sheet.py`.

Follow the same shape for any future enum extension. Step 4 is easy to forget — grep for
the union: `grep -rn '"article" | "media"' app lib scripts` (must come back empty of
stale two-member unions).

## Inspecting data

```bash
npm run db:studio      # drizzle-kit studio — local web UI on https://local.drizzle.studio
```

Studio can edit and DELETE live rows. Treat it as a viewer unless the owner asked for a change.

## One-off script pattern

For any ad-hoc read/update (reclassify, backfill, audit), write a throwaway script —
never psql-paste from memory, never leave the script behind:

```ts
// scripts/_fix_something.ts
import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq } from "drizzle-orm";
import { items } from "../db/schema";

const db = drizzle(neon(process.env.DATABASE_URL!));

async function main() {
  const rows = await db.select().from(items).where(eq(items.type, "statement"));
  console.log(rows.length);
  // await db.update(items).set({ topic: "..." }).where(eq(items.id, "..."));
}
main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
```

```bash
cd /path/to/repo          # MUST run from project root — tsx resolves node_modules there
npx tsx scripts/_fix_something.ts
rm scripts/_fix_something.ts   # delete when done, ALWAYS
```

Note the relative imports (`../db/schema`): standalone scripts run under tsx, not Next,
so the `@/` alias is unavailable — use relative paths like `scripts/seed.ts` does.
Print what you're about to change and how many rows *before* running the UPDATE/DELETE.

## Seeding — `scripts/seed.ts`

```bash
npm run db:seed              # = tsx scripts/seed.ts   (idempotent, additive)
npm run db:seed -- --reset   # DELETE FROM items first, then seed. Read below first.
```

Run from the repo root — the script resolves the xlsx via `process.cwd()`.

What it does: reads `Wadiha_El_Amiouni_Articles_and_Media.xlsx` from the repo root
(committed to git), parses three sheets —
`Articles مقالات` → `article`, `Media ظهور إعلامي` → `media`,
`Statements تصريح` → `statement` — taking columns by position
(idx, title, source, date, url; rows kept only if idx is a number, url matches
`^https?://`, title non-empty). `language` is derived per row via `isArabic(title)` —
the sheet itself carries only idx/title/source/date/url. Inserts with
`onConflictDoNothing({ target: items.dedupKey })`, so re-running without `--reset` only
adds missing rows and reports `Inserted N new items (skipped M existing)`.

**`--reset` wipes the ENTIRE items table**, including rows added via `/admin` and every
enriched field (`thumbnailUrl`, `excerpt`, `featured`, `topic`, `titleEn`, `mediaFormat`,
`status=draft` items). Note: the in-code comment "Never auto-wipes admin content" only
means the wipe is opt-in; once you pass `--reset`, admin-added rows ARE deleted too —
don't be misled by it. `--reset` is safe only when the xlsx is a current, complete
mirror of the DB *and* you accept losing thumbnails (re-run `npx tsx scripts/thumbs.ts`
after — it backfills `thumbnail_url` for rows where it's NULL via YouTube IDs/og:image)
and any admin-only rows. In practice: don't use `--reset` on the live DB without the
owner's explicit go-ahead.

### Regenerating the xlsx — `docs/build_sheet.py` gotcha

The xlsx is generated by `python3 docs/build_sheet.py` (needs `openpyxl`), **but the
script loads `.firecrawl/seen.pkl`** — a gitignored scraping cache that maps numeric
indices to URLs. On a fresh clone that file doesn't exist and the script crashes on
line 1 of its data loading. The committed xlsx is the durable artifact; only regenerate
on a machine that has `.firecrawl/`. When adding NEW entries to the script, don't use
numeric indices — pass the full URL string as the first tuple element (the script
handles both: `url = U(idx) if isinstance(idx, int) else idx`), as the مجلة الحداثة
entries already do.

**Data-flow rule**: content you add via a script must ALSO be added to
`docs/build_sheet.py` (then regenerate the xlsx if you can, see above) so a future
re-seed reproduces it. Content added through `/admin` is admin-owned and is *not*
expected in the sheet. The DB is the live source of truth; the xlsx is the durable
seed/backup.

## Danger / Do not

- **Do not** print, log, commit, or paste `DATABASE_URL` / `ADMIN_PASSWORD` values —
  the GitHub repo is public. Variable *names* are fine; values never.
- **Do not** delete rows without the owner's confirmation. Curation rules are the
  owner's calls, not yours: dedupe by event (one item per event, not per republication),
  attendance-only coverage (she merely attended, wasn't quoted/speaking) needs the
  owner's approval before it becomes an item, and her own CV/profile pages (e.g. her
  ul.edu.lb teacher profile) are NEVER items.
- **Do not** run `db:seed -- --reset` against real content unless the xlsx is verified
  current (see above).
- **Do not** answer `db:push` prompts blindly — a wrong rename-vs-drop answer deletes a
  production column.
- **Do not** use `db.transaction()` — the neon-http driver throws. `db.batch()` is the
  atomic option if ever needed.
- **Do not** insert an item without verifying, on the publisher's own page, that it is
  genuinely her (byline or named quote). Namesake trap: there is a different person,
  "وديعة ابراهيم الأميوني (نبال)" — a *male* Arabic-linguistics professor, b. 1945;
  ours is the female sociologist (b. 1976, Zgharta).
- **Do not** letter-space Arabic text anywhere this data is rendered — Arabic is a
  connected script and spacing breaks letter joins (`app/globals.css` enforces
  `letter-spacing: 0 !important` on Arabic). Store titles exactly as published.
- **Do not** leave one-off `scripts/_*.ts` files behind, and never commit `.docx` files
  (a CV was once purged from git history; `.gitignore` blocks `*.docx`).
