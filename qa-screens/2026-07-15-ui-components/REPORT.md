# UI components migration QA

Date: 2026-07-15
Branch: `codex/apple-ui-four-pass`

## Scope

Added small reusable Astro UI components:

- `src/components/ui/Button.astro`
- `src/components/ui/IconButton.astro`
- `src/components/ui/Section.astro`

Migrated the search, audio, and download pages to the shared page/header/control system.

## Checks

- `npm run build` passed.
- Desktop and mobile smoke for:
  - `/search/`: PageShell/PageHeader render, search for `милость` returns results.
  - `/audio/`: PageShell/PageHeader render, audio rows populate, icon controls render through `IconButton`.
  - `/download/`: PageShell/PageHeader render, 3 shared `Section` blocks render.
- No console errors.
- No horizontal overflow at 1440x1000 or 390x844.

## Evidence

- `desktop-search.png`
- `desktop-audio.png`
- `desktop-download.png`
- `mobile-search.png`
- `mobile-audio.png`
- `mobile-download.png`
- `results.json`
