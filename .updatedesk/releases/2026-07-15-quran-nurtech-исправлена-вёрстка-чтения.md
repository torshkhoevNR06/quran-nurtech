---
project: quran-nurtech
public: true
type: fix
audience: users
title: Исправлена вёрстка чтения
summary: Страница чтения снова центрируется в рабочей области, а верхняя панель показывает название суры и номер без склейки текста.
user_impact:
  - На desktop контент суры больше не прилипает к левому меню и не выглядит съехавшим.
  - Карточки аятов сохраняют вертикальную структуру: арабский текст, перевод и тафсир не растягиваются в странную широкую раскладку.
  - На мобильном экране сохранена ширина без горизонтального переполнения.
screenshots:
  - qa-screens/2026-07-15-layout-regression-after.png
  - qa-screens/2026-07-15-layout-regression-mobile.png
checks:
  - npm run build
  - Playwright layout metrics: desktop 1980x1180, overflowX=0
  - Playwright layout metrics: iPhone 14 Pro, overflowX=0
deploy_url: https://quran.nurtech.dev/surah/1/
---

Notes for editor:
- What changed: centered the non-wide app content inside the available shell area, fixed toolbar context stacking, and locked ayah reader blocks to a vertical layout.
- Where to verify: /surah/1/ in light and dark themes, desktop with sidebar open and iPhone-sized viewport.
- Risks: low; CSS-only stabilization of platform and reader layers.
