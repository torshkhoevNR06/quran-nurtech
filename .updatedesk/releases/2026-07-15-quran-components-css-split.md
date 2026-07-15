---
project: quran-nurtech
public: false
type: internal
audience: team
title: Components CSS разделён на UI-слои
summary: Большой src/styles/components.css разнесён на primitives, controls, lists, switches, cards, page helpers, focus и mobile layers с сохранением прежнего порядка каскада.
user_impact:
  - Внешний вид общих кнопок, меню, карточек и списков должен сохраниться.
  - Дальнейшая доработка компонентной системы стала безопаснее: маленькие CSS-слои проще проверять и менять отдельно.
screenshots:
  - qa-screens/2026-07-15-components-css-split/desktop-home.png
  - qa-screens/2026-07-15-components-css-split/desktop-surah-9.png
  - qa-screens/2026-07-15-components-css-split/mobile-settings-open.png
checks:
  - npm run build
  - git diff --check
  - Playwright QA: desktop home, surah, search, stats, audio; mobile home, surah, settings
deploy_url: https://quran.nurtech.dev
---

Notes for editor:
- What changed: общий компонентный CSS разбит на тематические файлы без изменения порядка подключения.
- Where to verify: /, /surah/9, /search/, /stats/, /audio/ и мобильное открытие настроек.
- Risks: это реорганизация каскада; визуальные отличия не ожидаются, но следующие проходы всё равно должны проверять все экраны.
