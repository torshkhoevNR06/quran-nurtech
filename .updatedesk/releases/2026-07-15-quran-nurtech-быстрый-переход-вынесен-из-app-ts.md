---
project: quran-nurtech
public: false
type: internal
audience: team
title: Быстрый переход вынесен из app.ts
summary: Quick navigation parsing moved into `src/client/quick-nav.ts` with explicit index-loading dependency.
user_impact:
  - Quick jump behavior is preserved for surah numbers, ayah references, aliases and search fallback.
  - The central app bundle is smaller and easier to continue splitting.
screenshots:
  - qa-screens/2026-07-15-quick-nav-extract/desktop-quick-search-fallback.png
checks:
  - npm run build
  - Playwright quick-nav QA: 4 checks, 0 failures
deploy_url: local QA only
---

Notes for editor:
- What changed: `src/client/quick-nav.ts`, `src/client/app.ts`, remaining-analysis status and quick-nav QA artifacts.
- Where to verify: topbar quick input on `/`.
- Risks: alias coverage is unchanged; future improvements should add explicit unit tests for transliteration variants.
