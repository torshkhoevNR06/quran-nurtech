---
project: quran-nurtech
public: true
type: fix
audience: users
title: Убран лишний поиск и очищены старые стили
summary: В верхней панели оставлен один поиск, а старый совместимый CSS-слой хидера удалён, чтобы новые стили дизайн-системы не перебивались устаревшими правилами.
user_impact:
  - В хидере больше нет двух поисков одновременно: осталось одно поле быстрого поиска и перехода.
  - Переключатели и тумблеры теперь берут базовый вид из общих компонентных стилей, поэтому сайдбар и настройки меньше конфликтуют между собой.
screenshots:
  - qa-screens/2026-07-15-design-system-topbar-cleanup.png
checks:
  - npm run build
  - Browser smoke desktop: quick search = 1, search icon = 0, body/topbar overflow = 0, вкладка "Джузы" внутри сайдбара
  - Browser smoke mobile 390x844: quick search = 1, search icon = 0, body/topbar overflow = 0
deploy_url: https://quran.nurtech.dev/
---

Notes for editor:
- What changed: удалён `shell-compat.css`, добавлен `component-segmented.css`, компонентные CSS-импорты подняты перед shell/page-слоями, лишняя search-иконка удалена из TopBar.
- Where to verify: главная, страница суры, левое меню "Суры / Джузы", мобильный хидер.
- Risks: средний риск для визуального каскада, потому что изменён порядок базовых component CSS; сборка и smoke-проверки пройдены.
