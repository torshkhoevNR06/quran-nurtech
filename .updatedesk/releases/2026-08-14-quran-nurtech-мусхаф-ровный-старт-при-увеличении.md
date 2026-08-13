---
project: quran-nurtech
public: true
type: fix
audience: users
title: "Мусхаф: ровный старт при увеличении"
summary: "Исправлено стартовое смещение увеличенной страницы Мусхафа: после масштабирования лист больше не открывается с обрезанным левым краем."
user_impact:
  - "На телефонах при увеличении Мусхафа страница начинается с видимого левого края, без ощущения, что аяты обрезаны."
  - "В обычном масштабе Мусхаф остаётся по центру на мобильных, планшетных и desktop-ширинах."
  - "Горизонтальная прокрутка при большом масштабе остаётся доступной, но стартовая позиция больше не съезжает влево."
screenshots:
  - "qa-screens/mushaf-centered-page13-390-z100.png"
  - "qa-screens/mushaf-centered-page13-390-z150.png"
  - "qa-screens/mushaf-centered-page13-704-z100.png"
  - "qa-screens/mushaf-centered-page13-1200-z100.png"
checks:
  - "Manual Playwright/Chrome: page 13 at 390px, 704px, 1200px; max line overflow = 0."
  - "Manual Playwright/Chrome: page 13 at 390px with 125% and 150% zoom; sheetLeft >= 0 after zoom start."
  - "Manual local server check: http://127.0.0.1:4321/mushaf/13 returned HTTP 200."
deploy_url: "http://127.0.0.1:4321/mushaf/13"
---

Notes for editor:
- Root cause: zoom startup centered the scroll container horizontally, which shifted oversized mobile sheets to a negative left position.
- Fix: zoom startup now resets horizontal scroll to the left edge while keeping vertical scroll at the top.
