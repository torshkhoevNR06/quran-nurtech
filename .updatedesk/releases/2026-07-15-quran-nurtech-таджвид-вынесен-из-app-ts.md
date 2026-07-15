---
project: quran-nurtech
public: false
type: internal
audience: team
title: Таджвид вынесен из app.ts
summary: Tajweed highlighting moved from the large client bundle into `src/client/tajweed.ts` with explicit data-version loading.
user_impact:
  - Tajweed remains enabled by default and can still be toggled from reading settings.
  - The reader bundle is easier to maintain before the remaining Apple-like polish passes.
screenshots:
  - qa-screens/2026-07-15-tajweed-extract/desktop-tajweed-settings.png
  - qa-screens/2026-07-15-tajweed-extract/mobile-tajweed-default.png
checks:
  - npm run build
  - Playwright tajweed QA: 8 checks, 0 failures
deploy_url: local QA only
---

Notes for editor:
- What changed: `src/client/tajweed.ts`, `src/client/app.ts`, remaining-analysis status and tajweed QA artifacts.
- Where to verify: `/surah/1/` with settings panel open.
- Risks: tajweed JSON loading is async, so slow-network behavior should remain in future manual QA.
