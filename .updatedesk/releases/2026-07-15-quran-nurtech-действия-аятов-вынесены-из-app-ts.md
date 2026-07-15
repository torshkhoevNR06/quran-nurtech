---
project: quran-nurtech
public: false
type: internal
audience: team
title: Действия аятов вынесены из app.ts
summary: Копирование, поделиться, закладки, тафсир, контекстное меню и sheet мусхафа вынесены в отдельный модуль reader actions.
user_impact:
  - Поведение действий аятов и sheet мусхафа сохранено.
  - Центральный клиентский файл теперь почти полностью состоит из аудиоплеера и boot-проводки.
screenshots:
  - qa-screens/2026-07-15-reader-actions-extract/desktop-reader-actions.png
  - qa-screens/2026-07-15-reader-actions-extract/desktop-mushaf-sheet.png
checks:
  - npm run build
  - Playwright reader-actions QA: 5 checks, 0 failures
deploy_url: local QA only
---

Notes for editor:
- What changed: `src/client/reader-actions.ts` now owns ayah action buttons, context menu, tafsir toggles and mushaf ayah sheet.
- Where to verify: `/surah/1/` action buttons/context menu and `/mushaf/2` word tap sheet.
- Risks: Medium; broad interaction module, covered by targeted browser regression on reader and mushaf.
