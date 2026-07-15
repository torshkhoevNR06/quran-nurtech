---
project: quran-nurtech
public: false
type: internal
audience: team
title: Настройки чтения вынесены из app.ts
summary: Reader settings, topbar menu state and mobile scroll-lock moved out of the large client bundle into focused modules. Stats, bookmarks and tasbih received another UI-component migration pass.
user_impact:
  - Settings and drawer behavior remains the same, but the code is split into safer modules for the next Apple-like redesign passes.
  - Stats now uses shared stat tiles and grouped-system tokens, while bookmarks and tasbih use shared button primitives.
screenshots:
  - qa-screens/2026-07-15-reader-settings-extract/desktop-settings-open.png
  - qa-screens/2026-07-15-reader-settings-extract/mobile-settings-open.png
  - qa-screens/2026-07-15-reader-settings-extract/desktop-stats.png
  - qa-screens/2026-07-15-reader-settings-extract/mobile-tasbih.png
checks:
  - npm run build
  - Playwright targeted QA: 34 checks, 0 failures
deploy_url: local QA only
---

Notes for editor:
- What changed: `src/client/ui-menus.ts`, `src/client/reader-settings.ts`, `src/components/ui/StatTile.astro`, `/stats/`, `/bookmarks/`, `/tasbih/`.
- Where to verify: `/surah/1/`, `/stats/`, `/bookmarks/`, `/tasbih/`.
- Risks: this is a refactor-heavy pass, so settings/drawer scroll-lock should stay in the next QA matrix.
