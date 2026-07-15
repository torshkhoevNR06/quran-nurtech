---
project: quran-nurtech
public: false
type: internal
audience: team
title: Home CSS разделён на слои
summary: Стили главной страницы и каталога сур разнесены на hero, tools, surah cards, layout, refinements, responsive, polish и typography слои.
user_impact:
  - Внешний вид главной и каталога сур должен сохраниться.
  - Дальнейшая чистка старых card/layout правил стала безопаснее и локальнее.
screenshots:
  - qa-screens/2026-07-15-home-css-split/desktop-home.png
  - qa-screens/2026-07-15-home-css-split/mobile-home.png
  - qa-screens/2026-07-15-home-css-split/mobile-home-filtered.png
checks:
  - npm run build
  - git diff --check
  - Browser QA: desktop home, desktop filtered home, mobile home, mobile filtered home
deploy_url: https://quran.nurtech.dev
---

Notes for editor:
- What changed: src/styles/home.css удалён, правила разложены по тематическим home-*.css файлам с прежним порядком подключения.
- Where to verify: главная страница `/`, быстрые суры, фильтр каталога, мобильная главная.
- Risks: это механическая реорганизация каскада; следующей задачей можно отдельно чистить дубли с component-cards.css.
