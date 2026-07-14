---
project: quran-nurtech
public: false
type: internal
audience: team
title: Стили главной и списка сур вынесены из global.css
summary: Базовый CSS главной страницы, быстрых сур и карточек сур перенесён в src/styles/pages.css перед page compatibility layer.
user_impact: Внешний вид не меняется, но стили страниц теперь лежат ближе к своему домену, а global.css стал меньше и предсказуемее.
screenshots:
  - /Users/ilnur_ryazhapov/Desktop/code_src/quran-nurtech-codex-apple-ui/qa-screens/2026-07-14-home-css-split/home-desktop-light.png
  - /Users/ilnur_ryazhapov/Desktop/code_src/quran-nurtech-codex-apple-ui/qa-screens/2026-07-14-home-css-split/home-mobile-light.png
  - /Users/ilnur_ryazhapov/Desktop/code_src/quran-nurtech-codex-apple-ui/qa-screens/2026-07-14-home-css-split/search-mobile-light.png
checks:
  - npm run build
  - git diff --check
  - Playwright QA: / desktop light, / mobile light, /surah/1 desktop dark, /search mobile light
deploy_url: https://quran.nurtech.dev
---
