# MEMORY.md

Durable lessons for future sessions on this portfolio. Read alongside `CLAUDE.md` (which documents the design system). This file is for the **gotchas and costly-mistake preventers** — things that are not obvious from the code and that we've already paid for once.

---

## Mobile-first is the default

As of 2026-04-22, all new UI work on this site starts from a mobile viewport and scales up. Defaults:

- **Design the narrow viewport first**, then layer `@media (min-width: …)` or targeted `max-width` breakpoints for tablet/desktop.
- **Never ship desktop-only type scales, spacing, or layouts.** `--section-py`, `.cs-inner` padding, `.hero-photo-wrap` width, and all heading `font-size` values must all have a mobile-scaled counterpart.
- **Breakpoints in use:** `640px`, `768px`, `900px`. Prefer reusing one of these — don't invent new ones without a reason.
- **Touch targets ≥ 44×44px** for any tappable control (buttons, dots, carousel arrows, close buttons).
- **Test on a real phone** (or DevTools 375×812 iPhone preset) before claiming a feature is done. Canvas, `100vh`, and backdrop-filter behave differently on iOS Safari vs. desktop.

## Canvas gotchas (hero photo morph)

- **Never use `ctx.filter = 'grayscale(1)'` for the grayscale pass.** iOS Safari support is inconsistent — it caused the hero photos to flash in color on mobile before reverting to B&W. Do the luminance conversion manually (`0.2126 R + 0.7152 G + 0.0722 B`) on the `getImageData()` pixel buffer instead. See `main.js` → `getImageData()`.
- **Cover-crop math must preserve aspect ratio.** `pro.jpg` is landscape (4240×2384) but the canvas is portrait (600×750). Use `scale = Math.max(W / naturalW, H / naturalH)` — *not* Math.min — or the photo skews.
- **Canvas background is hardcoded `rgb(13, 15, 20)`.** It does *not* respond to the light/dark toggle. Don't try to make it; the morph anim would need a full rewrite.

## Carousel gotchas

- Slides must use `flex: 0 0 100%` with `width: 100%` on the track. Earlier we used `min-width: 100%` without a track width and images bled between slides.
- Use `object-fit: contain` with a fixed `height` on slide images — not `cover` — so screenshots aren't cropped.
- The expand button (`.cs-expand-btn`) must keep `pointer-events: auto` always. Hiding it via hover + pointer-events was a race condition. Use event delegation on `document` to catch clicks.
- Lightbox must be a direct child of `<body>` (not inside `<main>`). Use a `.is-open` class, not the `hidden` attribute, for open state.

## Asset paths — DO NOT MOVE FILES

GitHub Pages serves from the repo root. All asset paths (`images/…`, `styles.css`, `main.js`) are root-relative. If you move a file into a subdirectory, every reference breaks.

- Root-level files: `index.html`, `styles.css`, `main.js`, `CLAUDE.md`, `MEMORY.md`
- Images live under `images/<topic>/…` (e.g. `images/gotnxt/`, `images/smeqa/`, `images/polaris/`)
- Hero photos: `images/marine.jpg`, `images/pro.jpg`. Shell `mv` may fail on macOS screenshot filenames containing U+202F (narrow no-break space); use `python3 -c "import os; os.rename(...)"` instead.

## Tokens only — no hardcoded hex

Every color must reference a CSS custom property (`--bg`, `--text-1`, `--amber`, etc.). Both themes (`:root` for dark, `[data-theme="light"]` for light) must be updated together when adding a new color. If you're hardcoding a hex, stop and check the token table in `CLAUDE.md`.

Exceptions that are allowed (documented):
- `rgba(8, 9, 12, 0.8)` on `nav` background — intentional dark blur regardless of theme
- Canvas `rgb(13, 15, 20)` — see canvas gotcha above
- Phone-frame gradient in `.phone` — physical device styling, not UI chrome

## Theme system

- Stored in `localStorage` under key `ss-theme`. Respects `prefers-color-scheme` when no stored value.
- The theme-switching IIFE runs before first paint in `main.js` to avoid a flash of wrong theme.
- The theme toggle button in the top-right needs visible contrast in dark mode. Use `var(--bg-raised)` background + `var(--border-lit)` border + `var(--text-1)` text — not `none`/`--border`/`--text-3` (which was too dim and had to be fixed).

## Navigation

- Mobile nav (<768px) uses a custom `.nav-menu-btn` + right-side slide-in `.nav-panel`. Not a generic hamburger — it has an amber-bordered pill with a weighted three-line glyph and a "Menu" label in mono.
- When the panel opens, set `body.nav-open` to lock scroll.
- The theme toggle stays visible in the top bar at all breakpoints — don't hide it inside the mobile panel; users need theme control from anywhere.

## Case studies — structural conventions

All case studies follow the same skeleton so add-ons stay predictable:

```
.work-card  →  .case-study-toggle
.case-study-panel
  .cs-inner
    .cs-meta        (role / scope / partners)
    .cs-section × N (Problem, Approach, Impact, …)
      .cs-heading
      <p> / .cs-list / .cs-workflow / .cs-figure / .cs-stats / .cs-quotes
    .cs-section.cs-section-last (Why It Mattered / What's Next)
```

- Panel visibility uses the `hidden` attribute toggled by the `.case-study-toggle` button's `aria-controls`. JS updates `aria-expanded` and swaps the toggle label.
- `.cs-section-last` drops the bottom margin so the panel closes cleanly.
- For text-heavy case studies with no imagery, reach for `.cs-stats`, `.cs-quotes`, and `.cs-substudy` sub-headers to add visual rhythm. This pattern is established in the VA.gov Chatbot and Project Recon case studies — reuse it.

## Build/deploy

- No build step. No dependencies. No package manager.
- Local dev: `python3 -m http.server 8080` from the repo root.
- Deploy: push to `main`. GitHub Pages serves automatically.
- `.DS_Store` is gitignored; don't re-add it.

## Scope discipline

- Don't add features, polish, or refactors the user didn't ask for. The site is opinionated — unrequested changes are almost always drift.
- When the user describes a bug, fix the bug. Don't also "improve" the surrounding code.
- Before big cross-cutting changes (type scales, spacing overhauls), report findings first and wait for a greenlight. This was established when the mobile-first audit was done — keep doing it.
