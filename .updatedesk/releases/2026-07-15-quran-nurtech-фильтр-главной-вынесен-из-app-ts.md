---
project: quran-nurtech
public: false
type: internal
audience: team
title: Фильтр главной вынесен из app.ts
summary: Логика фильтрации сур на главной и кликабельных карточек вынесена из общего клиентского файла в отдельный модуль.
user_impact:
  - Поведение главной страницы сохранено без видимых изменений.
  - Общий клиентский файл стал меньше и безопаснее для дальнейшего Apple-like редизайна.
screenshots:
  - qa-screens/2026-07-15-home-filter-extract/desktop-home-filter.png
checks:
  - npm run build
  - Playwright home-filter QA: 3 checks, 0 failures
deploy_url: local QA only
---

Notes for editor:
- What changed: `src/client/home-filter.ts` now owns home search filtering and surah-card navigation.
- Where to verify: `/`, type into the surah search, click a surah card.
- Risks: Low; scoped extraction with targeted regression.
