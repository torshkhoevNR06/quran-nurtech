---
project: quran-nurtech
public: true
type: feature
audience: users
title: Исправлена кнопка продолжения в мусхафе
summary: Кнопка продолжения в панели мусхафа и мобильном меню снова открывает сохранённое место чтения.
user_impact:
  - Нажатие на кнопку продолжения больше не перехватывается как обычное перелистывание страницы.
  - На мобильных при переходе закрывается меню действий, не оставаясь поверх мусхафа.
screenshots: []
checks:
  - git diff --check
  - Invoke-WebRequest http://127.0.0.1:4321/mushaf/76 returned HTTP 200
deploy_url: http://127.0.0.1:4321/mushaf/76
---

Notes for editor:
- What changed: data-mushaf-continue now has a dedicated click path before generic mushaf page-link interception.
- Where to verify: /mushaf/76, desktop toolbar continue button and mobile action-menu continue row.
- Risks: Low; prev/next mushaf navigation still uses the existing generic handler.
