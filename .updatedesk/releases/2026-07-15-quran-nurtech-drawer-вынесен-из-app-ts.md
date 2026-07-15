---
project: quran-nurtech
public: false
type: internal
audience: team
title: Drawer вынесен из app.ts
summary: Drawer/sidebar behavior moved from the large client bundle into `src/client/drawer.ts` with explicit dependencies for index loading and data versioning.
user_impact:
  - Desktop sidebar collapse/reopen and mobile drawer behavior are preserved.
  - The next shell redesign passes can touch drawer code without digging through the audio/player bundle.
screenshots:
  - qa-screens/2026-07-15-drawer-extract/desktop-drawer-juz.png
  - qa-screens/2026-07-15-drawer-extract/mobile-drawer-filter.png
checks:
  - npm run build
  - Playwright drawer QA: 11 checks, 0 failures
deploy_url: local QA only
---

Notes for editor:
- What changed: `src/client/drawer.ts`, `src/client/app.ts`, remaining-analysis status and drawer QA artifacts.
- Where to verify: `/surah/2/` on desktop and mobile.
- Risks: drawer uses async index loading, so sidebar population should remain in the broader route matrix.
