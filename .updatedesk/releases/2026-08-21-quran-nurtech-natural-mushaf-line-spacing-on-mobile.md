---
project: quran-nurtech
public: true
type: fix
audience: users
title: Естественные интервалы строк мусхафа
summary: Страница 76 мусхафа больше не растягивает строки через большие промежутки между словами и сохраняет плотную QCF-типографику на мобильных и широких экранах.
user_impact:
  - Убрано выравнивание строк через space-between, из-за которого появлялись визуальные провалы между словами.
  - Длинные строки страницы 76 остаются в один ряд и сжимаются только когда иначе вышли бы за границу страницы.
  - Компактные короткие суры сохраняют центрирование, zoom и перелистывание не меняются.
screenshots:
  - qa-screens/2026-08-21-mushaf-page-76-natural-lines/p76-390x844-naturalfit-v2.png
  - qa-screens/2026-08-21-mushaf-page-76-natural-lines/p76-517x710-naturalfit-v2.png
  - qa-screens/2026-08-21-mushaf-page-76-natural-lines/p76-768x900-desktop-v2.png
  - qa-screens/2026-08-21-mushaf-page-76-natural-lines/p67-390x844-naturalfit-v2.png
  - qa-screens/2026-08-21-mushaf-page-76-natural-lines/p42-390x844-naturalfit-v2.png
  - qa-screens/2026-08-21-mushaf-page-76-natural-lines/p2-390x844-naturalfit-v2.png
checks:
  - "Browser metrics: /mushaf/76 at 390x844, 430x932, 517x710 => maxRows=1, overflowCount=0, justify=center"
  - "Browser regression metrics: /mushaf/67, /mushaf/42, /mushaf/2 at 390x844 => maxRows=1, overflowCount=0"
  - "Desktop visual QA: /mushaf/76 at 768x900 keeps natural spacing without artificial gaps"
  - "npm run build reached static route generation but failed on existing Windows path blocker: ENOENT mkdir dist\\1:1"
deploy_url: http://127.0.0.1:4321/mushaf/76
---

Notes for editor:
- What changed: QCF lines no longer use flex space-between in normal mobile Mushaf mode; non-compact lines keep max-content centered layout and only over-wide lines receive bounded scaleX.
- Where to verify: /mushaf/76 around 390 px and around 517 px wide, plus /mushaf/67 and /mushaf/42 for dense pages.
- Risks: full Windows build remains blocked by the pre-existing colon route output path, unrelated to this typography fix.
