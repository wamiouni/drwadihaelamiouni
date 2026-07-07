---
name: design-rtl
description: Design system and Arabic/RTL correctness for the Wadiha El Amiouni site — color tokens and fonts in app/globals.css and app/layout.tsx, the Montserrat-fallback-hijacks-Arabic gotcha, the never-letter-space-Arabic rule, dir switching via LanguageProvider, logical properties, signature components (hero arch portrait, plum About band, FeatureCard, rails, footer), and the ThumbImage//api/thumb image fallback chain. Load before writing or reviewing ANY UI, CSS, component, styling, or typography change in this repo.
---

# Design system & Arabic/RTL correctness

Bilingual, **Arabic-first** personal-brand site (Next 16, Tailwind v4, App Router).
Default document is `lang="ar" dir="rtl"` (see `app/layout.tsx`); English/LTR is the
secondary mode toggled at runtime. Every UI change must work in **both** languages,
**both** directions, and on mobile. Editorial "print magazine" aesthetic: parchment
paper, plum ink, serif display type, hairline rules, gentle rise animations.

## 1. Token system — `app/globals.css`

Tailwind v4: tokens live in an `@theme` block, so `bg-parchment`, `text-mauve`,
`border-line` etc. are generated utilities. **Never hardcode hex in components** —
use these:

| Token | Hex | Role |
|---|---|---|
| `--color-parchment` | `#faf3f0` | page background |
| `--color-seashell` | `#fef1eb` | card surfaces, text on plum |
| `--color-antique` | `#ffebd6` | warm accent chips, hover fills |
| `--color-champagne` | `#f2e5cf` | image placeholders, pills |
| `--color-mauve` | `#3b0f2f` | primary brand (deep plum), CTAs, dark bands |
| `--color-mauve-dark` | `#57204a` | CTA hover |
| `--color-plum` | `#6e4b58` | secondary text/borders on light |
| `--color-ink` | `#2b2226` | body text |
| `--color-muted` | `#8a7378` | secondary body text |
| `--color-meta` | `#a5949a` | dates, metadata |
| `--color-line` | `#efdccd` | hairline borders/rules |

Font variables (also in `@theme`):

```css
--font-body:   "Montserrat", var(--font-plex-ar), system-ui, sans-serif;
--font-serif:  var(--font-newsreader), Georgia, "Times New Roman", serif;
--font-arabic: var(--font-amiri), Georgia, serif;
```

Custom utilities/keyframes defined in `globals.css` (use them, don't reinvent):

- `@keyframes rise` + `.rise` (0.8s entrance, stagger via inline `style={{ "--d": "0.2s" }}`)
  and `.card-in` (0.6s, stagger via `animationDelay`). Both disabled under
  `prefers-reduced-motion`.
- `.title-underline` — hover-fade underline for card titles (see §3).
- `.ghost-letter` — enormous watermark glyph: `opacity: 0.05`, mauve, `line-height: 0.8`,
  `pointer-events/user-select` off.
- `.dropcap` / `.dropcap-cream` — **scoped `[dir="ltr"]` only** (a drop cap would
  break joined Arabic letters). `-cream` variant for dark plum surfaces.
- `.no-scrollbar` — hides scrollbars on horizontal rails.
- `.select-pill` — custom RTL-aware chevron for `<select>` (native arrow is not
  RTL-aware): background chevron at `right 16px center`, flipped to `left` under
  `[dir="rtl"]`, `padding-inline-end: 40px`.
- `.site-header::before` — iOS shield (see §5, Header).
- `body::after` — fixed full-page paper-grain SVG noise at `opacity: 0.028`,
  `mix-blend-mode: multiply`, `z-index: 9999`, `pointer-events: none`. Anything that
  must escape the grain would need a higher z-index — in practice nothing should.
- `:focus-visible` — 2px mauve outline; never remove focus styles.

Heading rule (also in globals.css): `h1,h2,h3,.font-display` get Amiri 700 by default
(Arabic mode); `[dir="ltr"]` overrides to Newsreader 400. So headings switch typeface
automatically with `dir` — do not set heading font families in components.

## 2. Font strategy — `app/layout.tsx`

Four `next/font/google` families, each exposing a CSS variable on `<html>`:

- `Newsreader` → `--font-newsreader` (Latin display serif)
- `Amiri` (weights 400/700, subsets arabic+latin) → `--font-amiri` (Arabic display)
- `Montserrat` (300–700) → `--font-montserrat` (Latin body)
- `IBM_Plex_Sans_Arabic` (300–700) → `--font-plex-ar` (Arabic body)

### The Montserrat-fallback-hijacks-Arabic gotcha (do not regress this)

next/font normally synthesizes an Arial-based `"Montserrat Fallback"` and bundles it
into `var(--font-montserrat)`. That synthetic face **contains Arabic glyphs**, so in
a stack like `var(--font-montserrat), var(--font-plex-ar)` it swallows Arabic text
before IBM Plex Sans Arabic is ever reached — Arabic renders in ugly Arial shapes.
The two-part fix, both halves required:

1. `app/layout.tsx`: `adjustFontFallback: false` on the Montserrat config.
2. `app/globals.css`: `--font-body` uses the **literal** family name `"Montserrat"`,
   NOT `var(--font-montserrat)`.

If Arabic body text ever looks like a system sans instead of IBM Plex Sans Arabic,
check these two spots first.

## 3. Arabic typography laws

1. **NEVER letter-space Arabic.** Arabic is a connected script; `letter-spacing`
   breaks the joins between glyphs. `globals.css` has a global kill switch:
   ```css
   [dir="rtl"] [class*="tracking-"] { letter-spacing: 0 !important; }
   ```
   So you MAY use `tracking-*` freely for Latin kickers (e.g. Rail's
   `tracking-[0.22em]`, ItemCard's `tracking-wide` date) — the override neutralizes
   it in RTL. Never apply letter-spacing via inline `style` or non-`tracking-*`
   classes; those bypass the kill switch.
2. **Underlines: native `text-decoration`, never background-gradient hacks.**
   `.title-underline` uses `text-decoration-line: underline` with
   `text-underline-offset: 0.32em` — the offset clears Arabic descenders, and native
   decoration wraps correctly across multi-line RTL titles (a gradient underline
   strikes *through* wrapped Arabic lines).
3. **No drop caps in Arabic** — `.dropcap` is `[dir="ltr"]`-scoped, as above.
4. **Fluid display sizes via `clamp()`**: the hero `<h1>` uses
   `text-[clamp(2.1rem,8.5vw,3.75rem)] leading-[1.15]` (`components/hero.tsx`).
   Prefer clamp for large display text — Arabic names run long.
5. **Arabic-Indic digits** for editorial numbering: `components/rail.tsx` has
   `folio(n, lang)` mapping `0-9` → `٠١٢٣٤٥٦٧٨٩` when `lang === "ar"`. Reuse the
   pattern; don't show Latin digits in Arabic kickers. Dates go through
   `formatDate(date, lang)` in `lib/format.ts` (Intl, `"ar"` vs `"en-GB"`).

## 4. RTL mechanics

**Language state** — `components/language-provider.tsx`:

```ts
const { lang, dir, toggle, t } = useLanguage();
// lang: "ar" | "en"; dir: "rtl" | "ltr"; t(key: DictKey) => string
```

`LanguageProvider` persists to `localStorage("lang")` and sets
`document.documentElement.lang/dir` on change. Default is `"ar"` (`DEFAULT_LANG` in
`lib/i18n.ts`). All strings come from the `dict` in `lib/i18n.ts` via `t()` — **no
hardcoded UI strings**; add both `ar` and `en` entries for every new `DictKey`.
Components needing `t`/`lang` must be `"use client"`.

**Rules for direction-safe layout:**

- Use **logical** properties/utilities: `start`/`end` (`-end-10`, `after:start-0`,
  `inset-inline`, `ps-4`, `padding-inline-end`, `text-start`), never `left`/`right`
  — except for genuinely direction-neutral centering (the play button's
  `left-1/2 -translate-x-1/2` in `item-card.tsx` is fine).
- Use `rtl:` variants when motion must mirror: the card CTA arrow is
  `group-hover:translate-x-1 rtl:group-hover:-translate-x-1`; the header nav
  underline is `after:origin-left ... rtl:after:origin-right`.
- Horizontal scrolling flips sign: `components/rail.tsx` does
  `scrollBy({ left: dir === "rtl" ? -amount : amount })`. The `‹`/`›` buttons keep
  the same glyphs; only the scroll math flips.
- Placement mirroring is done with grid + `order`: hero portrait sits at
  **inline-end** (`md:order-2`), so the About image takes **inline-start**
  (`md:order-1`) to mirror it. In RTL that means portrait left / About image right —
  intentional; don't "fix" it.
- Mobile vs desktop reordering also uses flex `order-*` (hero: portrait `order-1`,
  name `order-2`... CTAs `order-5` above bio `order-6` on mobile, natural DOM order
  restored via `md:block`).

## 5. Signature components (conventions to match)

**Hero** (`components/hero.tsx`) — arched portrait: `aspect-[4/5]`, frame
`rounded-t-full rounded-b-2xl border border-line bg-champagne` +
`shadow-[0_24px_50px_-24px_rgba(59,15,47,0.45)]`, concentric outline
`absolute -inset-3 rounded-t-full rounded-b-3xl border border-mauve/25`. Ghost
letter `و`/`W` bleeds off the inline-end edge (`-end-10 text-[26rem]`
`md:text-[42rem]`, `.ghost-letter font-display`). Motto rendered as a pull-quote
with an oversized `«` (Arabic) / `“` (English). CTAs: filled pill
`rounded-full bg-mauve ... text-seashell hover:bg-mauve-dark` and outline pill
`border border-mauve text-plum hover:bg-antique` — reuse these two button recipes
everywhere (ItemBrowser's Load-more and Rail's View-all already do).

**About band** (`components/about-section.tsx`) — full-bleed plum:
`bg-mauve text-seashell`, body text `text-seashell/85 leading-[1.9]`, first
paragraph gets `dropcap dropcap-cream` (LTR only takes effect). Section title
pattern: `٭` glyph + `<h2>` + hairline `h-px flex-1 bg-seashell/20`. Image framed
with inner border `absolute inset-4 rounded-xl border border-antique/50`.

**ItemCard** (`components/item-card.tsx`) — the workhorse. Card:
`group ... rounded-2xl border border-line bg-seashell hover:-translate-y-1
hover:border-mauve/30 hover:shadow-[0_18px_40px_-20px_rgba(59,15,47,0.4)]`.
Thumb `aspect-[3/2] bg-champagne`, image `group-hover:scale-[1.04]`, plum duotone
wash on hover (`bg-mauve opacity-0 mix-blend-multiply group-hover:opacity-25`).
Media items get a `▶` roundel. Chips: source `bg-champagne text-plum`, media format
`bg-antique`. Title wraps in `<span className="title-underline">`. CTA text per
content type: `card.watch` (media) / `card.readStatement` (statement/تصريح) /
`card.read` (article), revealed on hover with the RTL-aware `↗` arrow. Match all of
this for any new card-like unit.

**FeatureCard** (in `components/item-browser.tsx`, not exported) — lead-story
variant: `rounded-3xl border border-mauve/60 ... hover:border-mauve`
`md:grid-cols-[1.2fr_1fr]`. Shown only in the "pristine" browse view (no
search/filter, newest sort). Its stronger mauve border is what distinguishes it
from ordinary cards.

**Rail** (`components/rail.tsx`) — numbered kicker: Arabic-Indic zero-padded folio
(`٠١`) in `text-xs uppercase tracking-[0.22em] text-mauve` + hairline
`h-px flex-1 bg-line`; horizontal snap scroller
`no-scrollbar flex snap-x snap-mandatory gap-5 overflow-x-auto`, cards `w-[280px]`
`sm:w-[300px] shrink-0 snap-start` with staggered `card-in`. Pages use `PageIntro`
(`components/page-intro.tsx`) — the `٭` + hairline + `rise`-staggered h1 pattern.

**Footer** (`components/footer.tsx`) — plum motto band mirroring the hero quote:
`bg-mauve text-seashell`, centered `hero.motto` in display type, ghost full-name
watermark (`text-[9rem] md:text-[13rem] opacity-[0.05]`, `start-0`, bilingual).

**Header** (`components/header.tsx`) — sticky wrapper
`<div className="site-header sticky top-0 z-40">` around
`<header className="border-b border-line bg-parchment/85 backdrop-blur">`.
Two load-bearing subtleties:
1. `.site-header::before` paints a 50vh parchment shield **above** the header
   (`inset-inline: 0; bottom: 100%`) — iOS Safari otherwise paints scrolling content
   behind the status bar; also covers rubber-band overscroll.
2. The shield pseudo must live on the plain wrapper, **not** on the
   `backdrop-blur` element — a pseudo on the blurred element corrupts blur
   compositing in Chromium. Keep the two-element structure.
Monogram roundel `و`/`W` doubles as the site logo and the universal image fallback.

## 6. Images

`thumbnailUrl` is a DB column (`db/schema.ts`); many Lebanese outlets
hotlink-protect. Three-stage degradation, implemented twice with the same
`stage: 0 | 1 | 2` pattern (`components/thumb-image.tsx` reusable; inlined in
`item-card.tsx`):

1. stage 0 — load `item.thumbnailUrl` directly;
2. `onError` → stage 1 — `/api/thumb?u=${encodeURIComponent(url)}`
   (`app/api/thumb/route.ts` refetches server-side with a referer spoofed to the
   image's own host, validates `content-type` starts with `image/`, caches 7 days);
3. `onError` again → stage 2 — monogram fallback: centered `و`/`W` in
   `font-display text-mauve/40` on `bg-champagne`.

New thumbnail UI must use `<ThumbImage url={...} className={...} />` or replicate
the full chain — never a bare `<img>` that can show a broken-image icon. Plain
`<img>` (not `next/image`) is deliberate: remote hosts are arbitrary; each use
carries `// eslint-disable-next-line @next/next/no-img-element`.

Static images (`/portrait.webp`, `/about.webp`) use a JS probe —
`new window.Image()` + `onload` — and render only if the file actually loads
(hero.tsx, about-section.tsx). Copy that probe if you add optional static assets.

## 7. Checklist for any new UI

- [ ] Strings via `t()` with both `ar` and `en` entries in `lib/i18n.ts`.
- [ ] Renders correctly with `dir="rtl"` AND `dir="ltr"` — toggle the header pill
      both ways. No physical `left/right/ml-/pl-` where `start/end/ms-/ps-` belongs.
- [ ] No letter-spacing that can reach Arabic outside the `tracking-*` kill switch.
- [ ] Underlines via `text-decoration` (offset ≥ `0.3em`), not borders/gradients.
- [ ] Colors/fonts from tokens only; headings inherit Amiri/Newsreader automatically.
- [ ] Mobile (~375px) checked; display text uses `clamp()` if large.
- [ ] Images have the monogram fallback path; no broken-image icons possible.
- [ ] Entrance animation via `.rise`/`.card-in` (respects reduced motion), not
      custom keyframes.
- [ ] `npm run build` passes before pushing (Vercel auto-deploys `main`).

## 8. Do not

- Do NOT letter-space Arabic, remove the `[dir="rtl"] [class*="tracking-"]`
  override, drop `adjustFontFallback: false`, or change `--font-body` back to
  `var(--font-montserrat)` — each silently breaks Arabic rendering.
- Do NOT move the `::before` shield onto the `backdrop-blur` header element, or
  remove the `.site-header` wrapper (iOS status-bar bleed returns).
- Do NOT add raw hex colors, hardcoded UI strings, or `next/image` for remote
  news-site thumbnails.
- Do NOT commit secrets or personal documents — the repo is PUBLIC. `DATABASE_URL`
  and `ADMIN_PASSWORD` live only in gitignored `.env`; `*.docx` is gitignored after
  a past history-purge incident. Portrait/about images are committed webp assets;
  anything more personal needs owner approval.
- Do NOT "fix" the plain `<img>` eslint-disables or the hero/About `order-*`
  mirroring — both are intentional.
