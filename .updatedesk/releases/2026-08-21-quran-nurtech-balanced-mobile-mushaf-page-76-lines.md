---
project: quran-nurtech
public: true
type: fix
audience: users
title: Ровные строки мусхафа на мобильной странице 76
summary: На мобильных экранах страница 76 больше не дробит длинные QCF-строки на два ряда и удерживает ровные границы текста без вылетов за край.
user_impact:
  - Строки аятов на странице 76 остаются цельными на ширинах 320, 360, 390 и 430 px.
  - Обычные страницы мусхафа заполняют доступную ширину ровнее, а слишком длинные строки мягко сжимаются без обрезки.
  - Компактные короткие суры, масштабирование, перелистывание и обновление страницы сохранили стабильную геометрию.
screenshots:
  - qa-screens/2026-08-21-mushaf-page-76-line-balance/p76-390x844-final2.png
  - qa-screens/2026-08-21-mushaf-page-76-line-balance/p76-320x740-final2.png
  - qa-screens/2026-08-21-mushaf-page-76-line-balance/p76-430x932-final2.png
  - qa-screens/2026-08-21-mushaf-page-76-line-balance/p76-reload-stable.png
  - qa-screens/2026-08-21-mushaf-page-76-line-balance/p76-swipe-settled.png
  - qa-screens/2026-08-21-mushaf-page-76-line-balance/p76-zoom.png
checks:
  - "Playwright mobile metrics: /mushaf/76 at 320x740, 360x800, 390x844, 430x932 => maxRows=1, overflowCount=0"
  - "Playwright regression metrics: /mushaf/67, /mushaf/42, /mushaf/2 at 390x844 => maxRows=1, overflowCount=0"
  - "Reload stability: /mushaf/76 at 390x844 kept sheet 384x664 and page 361x625 before and after settle"
  - "Swipe stability: /mushaf/76 to /mushaf/77 kept the same non-fullscreen sheet height during transition"
  - "Zoom check: /mushaf/76 enables internal scrolling after zoom without breaking line fit"
deploy_url: http://127.0.0.1:4321/mushaf/76
---

Notes for editor:
- What changed: mobile non-zoom Mushaf lines now use measured natural QCF width, full-width line boxes, and per-line scaling/spacing so page 76 keeps one visual row per QCF line.
- Where to verify: open /mushaf/76 on mobile widths around 390 px and compare the long lines near the top and middle of the page.
- Risks: the fix is intentionally scoped away from compact short-surah pages, which keep centered layout.
