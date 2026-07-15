---
project: quran-nurtech
public: false
type: internal
audience: team
title: Данные Корана вынесены из app.ts
summary: Индекс сур, чтецы, тафсиры и URL-логика аудио вынесены из центрального клиентского файла в отдельный модуль данных.
user_impact:
  - Поведение чтения, тафсира и аудио сохранено.
  - Следующий вынос аудиоплеера станет безопаснее, потому что данные теперь отделены от UI-логики.
screenshots:
  - qa-screens/2026-07-15-quran-data-extract/desktop-quran-data.png
checks:
  - npm run build
  - Playwright quran-data QA: 3 checks, 0 failures
deploy_url: local QA only
---

Notes for editor:
- What changed: `src/client/quran-data.ts` now owns `DV`, surah index, reciters, tafsir loaders, fallback reciter selection, and audio URL helpers.
- Where to verify: `/surah/1/`, copy an ayah, open tafsir, press play.
- Risks: Medium-low; many readers share these data helpers, covered by build and targeted browser regression.
