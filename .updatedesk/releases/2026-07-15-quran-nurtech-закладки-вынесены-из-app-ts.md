---
project: quran-nurtech
public: false
type: internal
audience: team
title: Закладки вынесены из app.ts
summary: Bookmark storage, button synchronization, topbar bookmark rendering, and continue/last-position behavior moved into `src/client/bookmarks.ts`.
user_impact:
  - Bookmark add/remove behavior is preserved on desktop and mobile.
  - Continue position still records the current surah/ayah while reducing the central client bundle.
screenshots:
  - qa-screens/2026-07-15-bookmarks-extract/desktop-bookmark-menu.png
  - qa-screens/2026-07-15-bookmarks-extract/mobile-bookmarked-ayah.png
checks:
  - npm run build
  - Playwright bookmarks QA: 7 checks, 0 failures
deploy_url: local QA only
---

Notes for editor:
- What changed: `src/client/bookmarks.ts`, `src/client/app.ts`, remaining-analysis status and bookmarks QA artifacts.
- Where to verify: `/surah/1/`, topbar bookmarks menu, `/surah/3/` last-position storage.
- Risks: topbar bookmark rendering is localStorage-driven, so future collection-page changes should keep storage keys aligned.
