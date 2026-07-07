---
name: deploy-ops
description: Run, ship, and operate the Wadiha El Amiouni site — local dev (.env, DATABASE_URL/ADMIN_PASSWORD), the npm run build pre-push gate, push-to-main → Vercel auto-deploy under HER account, which changes need a deploy vs appear instantly (force-dynamic DB reads), /admin cookie auth & password rotation, and incident playbooks for broken card images (/api/thumb), dead links (official-mirror swap), accidentally committed secrets (git-filter-repo purge), and macOS TCC EPERM failures.
---

# deploy-ops — running, shipping, and operating the site

Next.js 16 (App Router) + Drizzle + Neon Postgres, deployed on Vercel.
Working copy: `/Users/anthonymoussallem/Documents/Wadiha-aL-Amyouni`.

<!-- Discrepancy flag: README.md still says "Status: Planning complete; app
scaffolding pending" and calls the stack "Planned". The app is fully built and
live — trust the code, not the README. -->

## Ownership model (read this first — it changes how you operate)

- GitHub repo `github.com/wamiouni/drwadihaelamiouni` is under **Dr. Wadiha's
  own account** (`wamiouni`). The maintainer (Anthony) is a **collaborator**,
  not the owner. `git remote -v` confirms origin.
- The Vercel project is also under **her** account. It auto-deploys every push
  to `main`. You may not have Vercel dashboard access — verify deploys on the
  live site instead (see "Knowing it shipped").
- The repo is **PUBLIC**. Anything you push is world-readable forever (until
  painfully purged — see incident 3). Never commit secrets, her CV, or any
  personal document.
- `main` is the deploy branch. There is no CI other than Vercel's build — a
  broken push takes the deploy down. Hence the local build gate below.
- **Force-push is forbidden** except for a sanctioned history purge
  (incident 3), coordinated deliberately. Collaborator permissions allow it,
  which is exactly why you must not do it casually.

## Local dev

```bash
cd /Users/anthonymoussallem/Documents/Wadiha-aL-Amyouni
npm install        # once
npm run dev        # http://localhost:3000
```

Requires `.env` in the project root (gitignored via the `.env*` pattern in
`.gitignore`) with exactly two variables — **names only here, never print the
values**:

```
DATABASE_URL=...     # Neon Postgres (Frankfurt, pooled connection string)
ADMIN_PASSWORD=...   # single shared password for /admin
```

What breaks without them:

- **No `DATABASE_URL`** → `db/index.ts` throws `"DATABASE_URL is not set"` at
  module load. Every page is `export const dynamic = "force-dynamic"` and
  queries the DB per request, so every route 500s. `next build` can also fail
  while collecting page data. There is no mock/offline mode.
- **No `ADMIN_PASSWORD`** → the site renders, but `/admin` is a dead end:
  `lib/auth.ts` `isAuthed()` returns `false` when the var is unset, and
  `signIn()` refuses every password. You just see the login form rejecting you
  with «كلمة المرور غير صحيحة».

Other scripts in `package.json`:

```bash
npm run lint        # eslint
npm run db:push     # drizzle-kit push (schema → Neon)
npm run db:seed     # tsx scripts/seed.ts (xlsx → Neon, idempotent)
npm run db:studio   # drizzle-kit studio (browse the live DB)
```

## Pre-push gate

**`npm run build` MUST pass before every push.** Vercel runs the same build;
a local failure = a failed production deploy.

```bash
npm run build && echo GATE-PASSED
```

`npm run lint`: run it, don't add new problems. Known pre-existing state as of
this writing: 1 error (`react-hooks/set-state-in-effect` in the i18n language
provider) + 1 warning (unused `_type` in `lib/enrich.ts`). These do not fail
`next build` (Next 16 doesn't lint during build), so build remains the hard
gate — but never introduce *new* lint errors.

Also before staging anything:

```bash
git status          # review EVERY file before add
git diff --staged   # review again before commit
```

Never `git add -A` blindly — that is how her CV got committed once
(incident 3). Note the working dir legitimately contains a gitignored
Arabic-named `.docx` CV file; `*.docx` in `.gitignore` protects it, but only if
you don't force-add.

## Deploying

```bash
git push origin main   # that's the whole deploy pipeline
```

### What needs a push vs what doesn't

Every page (`app/page.tsx`, `app/articles/page.tsx`, `app/media/page.tsx`,
`app/statements/page.tsx`, `app/admin/page.tsx`) declares
`export const dynamic = "force-dynamic"` and reads the DB per request via
`lib/queries.ts`. Therefore:

| Change | Needs push/deploy? |
|---|---|
| Add/edit/delete content via `/admin` | **No** — live on next request |
| DB rows changed by `npm run db:seed`, `npx tsx scripts/thumbs.ts`, or a one-off `scripts/_*.ts` | **No** — live immediately |
| Any code/CSS/copy change (`app/`, `components/`, `lib/`) | **Yes** |
| `db/schema.ts` change | **Yes** (push code) **and** `npm run db:push` (migrate Neon) |
| Env var change in Vercel | **Redeploy required** (env is baked at build/boot) |

If content changed in the DB but the live site still looks stale, it is almost
never caching (pages are force-dynamic; admin actions also `revalidatePath`) —
suspect you edited the wrong DB, or the row is `status = 'draft'`
(`lib/queries.ts` only selects `status = 'published'`).

### Knowing it shipped

1. `git log origin/main -1` — confirm your commit is on the remote.
2. Wait ~1–2 min, hard-refresh the production site and look for your change.
3. If you have Vercel dashboard access (her account), check the Deployments
   tab for the green check. If the deploy failed, the previous deployment
   stays live — the site won't be down, but your change is not out.
4. Vercel build failure with a green local build usually means: a file you
   forgot to `git add`, or a case-sensitivity issue (macOS FS is
   case-insensitive; Vercel's is not).

## Env vars in Vercel

Same two names — `DATABASE_URL`, `ADMIN_PASSWORD` — set in the Vercel project
(her account) → Settings → Environment Variables, for Production (and Preview
if used). Changing a value there does **not** affect running deployments:
trigger a redeploy (push a commit, or Vercel dashboard → Redeploy).

## Admin access

- Route: `/admin`. Server-rendered: unauthenticated → `LoginForm`, else
  `AdminDashboard` (see `app/admin/page.tsx`).
- Auth (`lib/auth.ts`): single password compared to `ADMIN_PASSWORD`; success
  sets httpOnly cookie `wadiha_admin` = `sha256("wadiha:" + password)`,
  `maxAge` 90 days, `secure` in production. No user table, no sessions in DB.
- All server actions in `app/admin/actions.ts` (`previewAction`, `addAction`,
  `deleteAction`) re-check `isAuthed()` and throw `"unauthorized"` otherwise.

**Password rotation** (do all three, order matters little but completeness does):

1. Edit `ADMIN_PASSWORD` in local `.env`.
2. Update `ADMIN_PASSWORD` in Vercel env vars.
3. Redeploy (push or dashboard Redeploy).

Because the cookie token is derived from the password, rotation automatically
invalidates every existing login — no cookie cleanup needed.

## Incident playbook (all four happened for real)

### 1. Broken card images

Cards render thumbnails through `/api/thumb?u=<encoded-image-url>`
(`app/api/thumb/route.ts`), which re-fetches the image with a spoofed
`referer` of the image's own host to defeat hotlink protection, and returns
404 unless the upstream responds OK with `content-type: image/*`. Responses
are client-cached 7 days (`cache-control: public, max-age=604800, immutable`).

Diagnose:

```bash
# does the proxy serve it?
curl -sI "http://localhost:3000/api/thumb?u=$(python3 -c 'import urllib.parse,sys;print(urllib.parse.quote(sys.argv[1],safe=""))' 'https://example.com/img.jpg')"
# does the origin still serve it at all?
curl -sI -H "referer: https://example.com/" "https://example.com/img.jpg"
```

- Proxy 404 + origin dead → the source page changed/removed its image. Fetch
  the article page HTML, find a real `<img>` URL in it, verify it returns
  HTTP 200 with `image/*`, then update that row's `thumbnail_url` (column in
  `db/schema.ts`, `items` table) via `/admin` or a one-off script.
- Many rows missing thumbnails → run the backfill:
  `npx tsx scripts/thumbs.ts` (fills from YouTube ID or `og:image`; prints
  `YouTube: n, og:image: n, no thumbnail: n`). Leftovers are manual.
- One-off DB script pattern: create `scripts/_fix_thumb.ts` importing
  `"dotenv/config"` + `drizzle(neon(process.env.DATABASE_URL!))`, run
  `npx tsx scripts/_fix_thumb.ts` **from the project root**, then **delete the
  script** — never leave `scripts/_*.ts` behind.

### 2. Dead content links

When an item's `url` 404s or the outlet vanished:

1. Search for an **official mirror** — typically NNA (`nna-leb.gov.lb`) for
   press/event coverage.
2. **Verify the mirror actually quotes/bylines HER** before swapping. Namesake
   trap: another person carries the IDENTICAL full name وديعة ابراهيم الأميوني —
   a MALE linguist known as «نبال», b. 1945. Ours is the female sociologist,
   b. 1976, Lebanese University Tripoli (see discover-content for the full
   disambiguation table). If the page doesn't clearly refer to her, report
   "not found" honestly; do not swap.
3. Update the row's `url` (and recompute-worthy fields). Note `dedup_key` is
   derived from the URL via `dedupKey()` in `lib/url.ts` and is `UNIQUE` — a
   one-off script changing `url` should update `dedupKey` consistently.
4. If the item came from the seed sheet, mirror the change in
   `docs/build_sheet.py` and regenerate the xlsx (`python3
   docs/build_sheet.py`), so a future re-seed reproduces it. Items added via
   `/admin` are admin-owned and stay out of the sheet.

### 3. Accidental commit of a personal/secret file (public repo!)

This happened with her CV `.docx`. If a secret or personal file lands in git
history — even one commit deep — a plain revert is NOT enough on a public
repo. Full purge, exactly as executed here:

```bash
pip3 install git-filter-repo --break-system-packages   # macOS system python
git filter-repo --invert-paths --path "<exact/path/to/file>" --force
# filter-repo strips remotes; re-add and force-push:
git remote add origin https://github.com/wamiouni/drwadihaelamiouni.git
git push origin main --force
# verify it is gone from ALL history:
git log --all --oneline -- "<exact/path/to/file>"      # must print nothing
```

Then rotate anything the file exposed (if it was a secret: new Neon
credentials / new `ADMIN_PASSWORD` → update .env + Vercel + redeploy).
This is the **only** sanctioned use of force-push.

Prevention (already in place — keep it that way):
- `.gitignore` ends with `*.docx` under "Personal documents — never commit".
- `.env*` and `.firecrawl/` are gitignored.
- Review `git status` before every add; never `add -A` without reading the list.

### 4. macOS TCC permission failures (EPERM in ~/Documents)

Symptom: Node/tooling suddenly fails with `EPERM: operation not permitted`
reading files that plainly exist under `~/Documents`. Cause: macOS TCC revoked
or never granted the terminal/app "Files and Folders → Documents" access.

Fix: System Settings → Privacy & Security → Files and Folders (or Full Disk
Access) → grant to the terminal app running the commands → then **fully quit
and restart that app** (a new window is not enough). Re-run the failing
command. Do not "fix" this with `sudo` or by copying the project to /tmp.

## Domain & email (state, not code)

- The production domain is attached to the Vercel project under her account
  (Vercel-managed DNS).
- Email: no mail hosting — ImprovMX forwards mail on the domain to a real
  inbox, with a Gmail "send-as" alias planned/configured for outbound. Her
  university address in `lib/site.ts` (`SITE.email`) is separate and is the
  one shown on the contact page.

## Commit convention

- Imperative subject line; body explains **why**, not what.
- End every commit message with:
  `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`
- `npm run build` must pass before the push. Commit/push only when asked.

## Do not

- Do not print, echo, or commit values of `DATABASE_URL` or `ADMIN_PASSWORD`
  (e.g. never `cat .env` into a transcript or log).
- Do not commit `.docx`, CVs, or any personal document — public repo.
- Do not force-push outside the incident-3 purge procedure.
- Do not run destructive SQL against Neon casually — it is the live source of
  truth; the xlsx (`Wadiha_El_Amiouni_Articles_and_Media.xlsx` +
  `docs/build_sheet.py`) is the durable backup, and `npm run db:seed` is
  idempotent (`onConflictDoNothing` on `dedup_key`) but only restores what the
  sheet contains.
- Do not leave one-off `scripts/_*.ts` files behind after running them.
- Do not letter-space Arabic text or reorder the font stack in
  `app/globals.css` while "fixing" typography — the `[dir="rtl"]` tracking
  override and `--font-body` ordering are deliberate (broken connected script
  and a Latin-fallback-hijacks-Arabic bug, respectively).
