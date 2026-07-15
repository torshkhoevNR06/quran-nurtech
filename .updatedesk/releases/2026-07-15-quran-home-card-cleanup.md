---
project: quran-nurtech
public: false
type: internal
audience: team
title: Home card CSS очищен от дублей
summary: Убраны устаревшие визуальные правила карточек сур на главной странице, чтобы общий card-компонент был единственным источником внешнего вида.
user_impact:
  - Карточки сур на главной странице сохраняют прежний вид, но больше не получают конфликтующие CSS-слои.
  - Снижен риск возврата старых glass-эффектов, лишнего hover-смещения и нестабильных переопределений.
screenshots:
  - qa-screens/2026-07-15-home-card-cleanup/desktop-home.png
  - qa-screens/2026-07-15-home-card-cleanup/mobile-home.png
checks:
  - npm run build
  - git diff --check
  - Playwright visual smoke: / desktop 1440x900, / mobile 390x844, filter states
deploy_url: local http://127.0.0.1:4353/
---

Notes for editor:
- What changed:
  - Removed duplicate visual card styling from home-specific CSS.
  - Kept home-specific layout, spacing, truncation, and action layout rules.
- Where to verify:
  - Главная страница, список сур, поиск/фильтр по сурам.
- Risks:
  - Низкий: правка удаляет только правила, которые уже перекрывались общим компонентным слоем.
