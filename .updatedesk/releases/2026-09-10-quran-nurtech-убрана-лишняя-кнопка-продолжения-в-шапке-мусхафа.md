---
project: quran-nurtech
public: true
type: feature
audience: users
title: Убрана лишняя кнопка продолжения в шапке мусхафа
summary: В разделе мусхафа из верхней шапки убрана лишняя кнопка продолжения, чтобы не дублировать действие из панели мусхафа.
user_impact:
  - В шапке мусхафа больше нет лишней маленькой кнопки с иконкой продолжения.
  - Кнопка продолжения остается в панели инструментов на ПК и в мобильном меню мусхафа.
screenshots: []
checks:
  - git diff --check
  - Invoke-WebRequest http://127.0.0.1:4321/mushaf/76 returned HTTP 200
  - HTML check confirmed no TopBarContinue component on /mushaf/76 and three data-mushaf-continue controls remain
deploy_url: http://127.0.0.1:4321/mushaf/76
---

Notes for editor:
- What changed: TopBarContinue is no longer rendered on mushaf routes.
- Where to verify: /mushaf/76, desktop toolbar and mobile action menu.
- Risks: Low; change is scoped to topbar rendering on mushaf pages.
