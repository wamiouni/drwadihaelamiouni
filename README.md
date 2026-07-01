# Dr. Wadiha El Amiouni — Personal Website

Bilingual (Arabic-first) personal-brand website aggregating **Dr. Wadiha El Amiouni**'s published
articles and media appearances in one place.

## Status
Planning complete; app scaffolding pending.

## Planned stack
- **Next.js** (App Router) + **Tailwind**
- **Drizzle ORM** → **Neon** (Postgres)
- Deployed on **Vercel** (auto-deploy from this repo)

## How content is managed
No scraping. Content is added manually via a private `/admin` page (single password):
paste a link → the server enriches it (title, source, date, thumbnail) → preview → publish.

## Seed data
`Wadiha_El_Amiouni_Articles_and_Media.xlsx` — the initial catalog of articles + media appearances.
A seed script will load this file into the database. `build_sheet.py` generated the file.
