---
project: quran-nurtech
public: false
type: internal
audience: team
title: Горячие клавиши вынесены из app.ts
summary: Keyboard shortcuts moved from the central client file into a dedicated hotkeys module with explicit dependencies.
user_impact:
  - Existing shortcuts for quick input, reader layers, bookmarks and ayah navigation continue to work.
  - `app.ts` is smaller and closer to separate reader/player modules.
screenshots:
  - qa-screens/2026-07-15-hotkeys-extract/desktop-hotkeys.png
checks:
  - npm run build
  - Playwright hotkeys QA: 4 checks, 0 failures
deploy_url: local QA only
---

Notes for editor:
- What changed: `src/client/hotkeys.ts` now owns slash focus, A/S/D reader layer toggles, B bookmark toggle, bracket ayah navigation and Escape menu close.
- Where to verify: `/surah/1/`, use keyboard shortcuts.
- Risks: Medium-low; keyboard behavior is event-driven, covered by targeted browser regression.
