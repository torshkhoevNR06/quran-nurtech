# TopBar split QA

Date: 2026-07-15
Branch: `codex/apple-ui-four-pass`

## Scope

TopBar markup was split into focused Astro components, and the small client-side context updater was moved from inline script into `src/client/topbar.ts`.

## Checks

- `npm run build` passed.
- Desktop smoke at 1440x1000:
  - `/` keeps compact quick search and global controls.
  - `/search/` switches from quick search to page title.
  - `/surah/1/` fills reader context, opens settings panel, and opens reciter menu.
- Mobile smoke at 390x844:
  - `/` keeps the compact toolbar without horizontal overflow.
  - `/surah/1/` opens settings without page errors or horizontal overflow.

## Evidence

- `desktop-home-topbar.png`
- `desktop-search-title.png`
- `desktop-surah-settings.png`
- `desktop-surah-reciter.png`
- `mobile-home-topbar.png`
- `mobile-surah-settings.png`
- `results.json`

## Notes

- `settingsVisible` in `results.json` is true while closed because the settings panel stays in the DOM for off-canvas animation. `settingsOpen` is the real open-state check.
- The mobile settings sheet still needs the later Apple-like component polish pass; this change only isolates TopBar structure safely.
