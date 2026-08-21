---
project: quran-nurtech
public: true
type: fix
audience: users
title: Мусхаф плотнее заполняет экран
summary: На мобильных устройствах лист мусхафа теперь начинается сразу под шапкой, а плотные страницы равномерно распределяют 15 строк по доступной высоте.
user_impact:
  - Между шапкой приложения и листом мусхафа больше нет лишнего верхнего зазора.
  - Страницы с большим количеством строк используют высоту листа до зоны кнопок масштаба, без большого пустого поля снизу.
  - Zoom-режим сохранил reflow и внутреннюю прокрутку.
screenshots:
  - qa-screens/2026-08-21-mushaf-mobile-fill-height/mobile-390x844-p42-after.png
  - qa-screens/2026-08-21-mushaf-mobile-fill-height/mobile-430x932-p42-after.png
  - qa-screens/2026-08-21-mushaf-mobile-fill-height/mobile-390x844-p42-dark-after.png
  - qa-screens/2026-08-21-mushaf-mobile-fill-height/mobile-390x844-p2-after.png
  - qa-screens/2026-08-21-mushaf-mobile-fill-height/mobile-390x844-p42-system-zoom-click.png
  - qa-screens/2026-08-21-mushaf-mobile-fill-height/desktop-1200x900-p42-after.png
checks:
  - Playwright mobile 390x844 page 42 verified sheet top equals topbar bottom and dense 15 lines fill the page grid
  - Playwright mobile 430x932 page 42 verified the same filled layout at a wider phone size
  - Playwright mobile 390x844 page 2 verified compact surah centering still works
  - Playwright mobile 390x844 zoom click verified 110% zoom keeps reflow and internal scroll
  - Playwright desktop 1200x900 page 42 smoke check passed
deploy_url: http://127.0.0.1:4321/mushaf/42
---

Notes for editor:
- What changed: mobile Mushaf grid placement and normal-scale line distribution were tightened.
- Where to verify: open /mushaf/42 on a phone viewport and compare the top edge and bottom whitespace before the zoom controls.
- Risks: very small phone heights still depend on browser safe-area calculations, so keep checking real iOS Safari during release QA.
