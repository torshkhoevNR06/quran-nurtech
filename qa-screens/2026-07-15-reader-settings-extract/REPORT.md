# Reader settings extract QA

Date: 2026-07-15
Branch: `codex/apple-ui-four-pass`
Local URL: `http://127.0.0.1:4331`

## Checks

- `npm run build` passed.
- Desktop `/surah/1/`: settings panel opens, body state is applied, transliteration layer toggles, Escape closes panel, theme toggle writes rendered theme.
- Mobile `/surah/1/`: drawer opens, body scroll locks, drawer closes and unlocks body, settings opens, settings locks body, close unlocks body.
- Desktop/mobile `/stats/`, `/bookmarks/`, `/tasbih/`: page header renders, no horizontal overflow, migrated UI components are present.
- Tasbih desktop/mobile: count button increments after tap/click.

## Screenshots

- `desktop-settings-open.png`
- `desktop-after-theme-toggle.png`
- `mobile-drawer-open.png`
- `mobile-settings-open.png`
- `desktop-stats.png`
- `mobile-stats.png`
- `desktop-bookmarks.png`
- `mobile-bookmarks.png`
- `desktop-tasbih.png`
- `mobile-tasbih.png`

## Result

34 automated checks, 0 failures. Details: `results.json`.
