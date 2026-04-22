# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

Single-page personal portfolio for Shane Strassberg (`sstrassberg.github.io`). No build system, no dependencies, no package manager — pure HTML/CSS/JS deployed via GitHub Pages.


## Local development

```bash
python3 -m http.server 8080
# open http://localhost:8080
```

All three files live at the repo root:
- `index.html` — full page markup
- `styles.css` — all styles
- `main.js` — all JavaScript

Asset paths (images, fonts) are relative to the root. Never move files into subdirectories — GitHub Pages serves from the root and the existing `<link>` and `<script>` tags reference root-relative paths.

## Visual design system

### Color tokens (CSS custom properties)

The design uses two themes (dark default, light opt-in) defined as CSS variables on `:root` and overridden on `[data-theme="light"]`. **Never hardcode hex values** — always use the token names:

| Token | Dark | Light | Use |
|---|---|---|---|
| `--bg-deep` | `#08090c` | `#ede9e0` | section backgrounds |
| `--bg` | `#0d0f14` | `#f5f3ee` | page base |
| `--bg-card` | `#13161e` | `#edeae3` | cards, panels |
| `--bg-raised` | `#191d28` | `#e6e2d8` | elevated surfaces |
| `--border` | `#1e2333` | `#d4cfc4` | default borders |
| `--border-lit` | `#2a3048` | `#b8b2a6` | hover borders |
| `--text-1` | `#e4e6f0` | `#0f1117` | headings, emphasis |
| `--text-2` | `#9498b0` | `#3d3f4e` | body copy |
| `--text-3` | `#7e839c` | `#6b6e82` | labels, meta, captions |
| `--amber` | `#e8a634` | `#b8720e` | primary accent, CTAs, links |
| `--amber-dim` | `rgba(232,166,52,0.12)` | | subtle amber fills |
| `--amber-mid` | `rgba(232,166,52,0.25)` | | selections |
| `--teal` | `#3ecfcf` | `#1a9e9e` | "current" indicator |
| `--blue` | `#5b8ef0` | `#2d5fc4` | accent |
| `--coral` | `#e07060` | `#c44a38` | accent |
| `--green` | `#6ab877` | `#3d7a44` | accent |
| `--purple` | `#a07ae8` | `#6b44c8` | accent |

### Typography

Three typefaces loaded from Google Fonts:
- `--font-display: 'Sora'` — headings, names, titles (weights 300–600)
- `--font-body: 'Outfit'` — body copy (weights 300–600)
- `--font-mono: 'JetBrains Mono'` — labels, tags, counters, code (weight 400)

**Size scale conventions:**
- Hero name: `clamp(48px, 8vw, 88px)`, weight 600
- Section headings: `font-display`, 22–52px range, weight 500
- Body paragraphs: 14–20px, `font-body`, weight 300–400
- Labels/tags/captions: 10–12px, `font-mono`, `letter-spacing: 0.06–0.14em`, `text-transform: uppercase`

### Spacing

- `--max-w: 1120px` — max content width, applied via `.wrap`
- `--section-py: 140px` — section vertical padding
- `.wrap` uses `padding: 0 40px` (24px on mobile)

### Interaction patterns

- Cards hover: `border-color` transitions to `--border-lit` + `translateY(-2px)`
- Links: default `--amber`, hover `--text-1`
- All transitions: `0.2s–0.4s ease`
- Focus states: `2px solid var(--amber)` outline, `outline-offset: 3px`
- Theme transitions use `[data-theme-transition]` attribute + `!important` overrides (350ms)

### Scroll reveal

Elements with `.reveal` start at `opacity: 0; transform: translateY(24px)` and become `.visible` via `IntersectionObserver`. Stagger via `.reveal-d1` through `.reveal-d5` (0.1s–0.5s delays).

### Section structure

Each section follows: `.section-tag` (mono label) → heading/intro → content grid. Alternating sections use `--bg` vs `--bg-deep` backgrounds (`#about` and `#capabilities` use `--bg-deep`).

## Key JavaScript behaviors

**Theme toggle** — IIFE at top of `main.js`. Reads/writes `localStorage` key `ss-theme`. Respects `prefers-color-scheme` when no stored preference. Updates `#themeIcon` and `#themeLabel` on switch.

**Photo morph** — Canvas animation (`#morphCanvas`, 600×750px). Loads `images/marine.jpg` and `images/pro.jpg`, builds a pixel particle array, then animates through phases: `marine-hold` (110 frames) → `morphing` (150 frames, label swap at 45%/65%) → `pro-settle` → `done`. The label (`#morphLabel`) and replay button (`#replayBtn`) are positioned below the canvas.

**Case study toggle** — `.case-study-toggle` buttons toggle `hidden` on their `aria-controls` panel and update `aria-expanded`. The panel uses CSS `animation: csReveal` on open.

**Carousel** — IIFE at bottom of `main.js`. Five slides, captions array in JS (use `—` for em dashes in JS strings; use `&mdash;` in HTML). The initial caption in the HTML must use `&mdash;` (not `—` — that's JS syntax only).

## Work card accent colors

Each `.work-card` takes a `data-accent` attribute that drives a 3px top border:
`teal` | `amber` | `blue` | `purple` | `green` | `coral`

The `.featured` card spans full grid width (`grid-column: 1 / -1`). The `.featured-right` screenshot column is currently hidden (`display: none`) — the screenshots appear in the carousel inside the case study panel instead.

## Theme consistency rules

- The page ships with `data-theme="dark"` on `<html>`. The JS IIFE immediately re-applies the correct theme before first paint to prevent flash.
- When adding new UI elements: provide both dark (`:root`) and light (`[data-theme="light"]`) token values if any colors are hardcoded.
- Canvas background color is hardcoded to dark `rgb(13, 15, 20)` — the morph animation does not respond to theme changes.

## Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them — don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.
