---
project: quran-nurtech
public: true
type: feature
audience: users
title: Ровная раскладка страницы 76 в мусхафе
summary: Страница 76 в режиме мусхафа теперь заполняет окно ровнее на мобильных и десктопных размерах без срезания строк по краям.
user_impact:
  - Аяты на 14-строчной странице 76 больше не уходят в левую или правую границу мусхафа.
  - Страница использует фактические 14 строк вместо пустой 15-й строки, поэтому нижний пустой зазор стал меньше.
  - Обычные 15-строчные страницы сохраняют прежнюю геометрию и не получают новый сдвиг строк.
screenshots:
  - qa-screens/2026-08-21-mushaf-page-76-balanced-fit/after14-final-page76-390x844.png
  - qa-screens/2026-08-21-mushaf-page-76-balanced-fit/after14-final-page76-517x710.png
  - qa-screens/2026-08-21-mushaf-page-76-balanced-fit/after14-final-page76-768x900.png
  - qa-screens/2026-08-21-mushaf-page-76-balanced-fit/after14-control-page67-390x844.png
checks:
  - Headless Chromium visual QA: /mushaf/76 at 390x844, 517x710, 768x900.
  - Control metrics: /mushaf/67, /mushaf/42, /mushaf/2 at 390x844 all report overflow = 0.
  - npm run build: failed on existing Windows static route issue dist\1:1, after generating routes through /surah/114.
deploy_url: http://127.0.0.1:4321/mushaf/76
---

Notes for editor:
- What changed: limited the special mobile recentering to regular 14-line Mushaf pages and made the page grid use the real visible line count.
- Where to verify: /mushaf/76 on 390px, 517px and desktop widths; compare /mushaf/67 and /mushaf/42 as controls.
- Risks: Build remains blocked by the unrelated colon route output on Windows.
