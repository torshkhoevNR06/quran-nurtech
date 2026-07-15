---
project: quran-nurtech
public: false
type: internal
audience: team
title: Заучивание и отклик вынесены из app.ts
summary: Режим заучивания и общий тактильный отклик по интерактивным элементам вынесены из центрального клиентского файла.
user_impact:
  - Поведение настроек заучивания сохранено.
  - Центральный клиентский файл стал меньше и проще для следующего этапа выноса аудиоплеера и действий аятов.
screenshots:
  - qa-screens/2026-07-15-memorize-interactions-extract/mobile-memorize-settings.png
checks:
  - npm run build
  - Playwright memorize/interactions QA: 3 checks, 0 failures
deploy_url: local QA only
---

Notes for editor:
- What changed: `src/client/memorize.ts` owns memorize UI state; `src/client/interactions.ts` owns haptic pointer feedback.
- Where to verify: `/surah/1/`, open settings, toggle memorize, choose repeat count.
- Risks: Low; behavior extracted with targeted mobile settings regression.
