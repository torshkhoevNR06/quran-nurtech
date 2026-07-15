# Home Card CSS Cleanup QA

Date: 2026-07-15
Branch: `codex/apple-ui-four-pass`

## Scope

- Главная страница `/`
- Карточки сур и быстрые карточки в hero
- Фильтр списка сур
- Desktop viewport: 1440x900
- Mobile viewport: 390x844

## Checks

- `npm run build` passed.
- `git diff --check` passed.
- Playwright smoke passed for desktop and mobile.
- `documentElement.scrollWidth` equals viewport width on desktop and mobile.
- Mobile overflow check returned no overflowing visible elements.
- Desktop hidden settings panel remains outside the viewport while closed, but it does not increase page scroll width.

## Screenshots

- `desktop-home.png`
- `desktop-home-filter.png`
- `mobile-home.png`
- `mobile-home-filter.png`

## Result

Home-specific CSS now keeps only layout and truncation rules for `.surah-card`.
Shared visual styling stays in `component-cards.css`, so the page keeps the same visible design without duplicate overrides.
