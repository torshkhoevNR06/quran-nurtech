---
project: quran-nurtech
public: false
type: internal
audience: team
title: QCF стили мусхафа вынесены из общего CSS
summary: Базовые правила страничного QCF-мусхафа перенесены из global.css в src/styles/mushaf.css рядом с fullscreen, zoom и reader-полировкой.
user_impact: Визуально поведение не меняется, но слой мусхафа стал изолированнее, поэтому будущие правки меньше рискуют ломать весь интерфейс.
screenshots:
  - /Users/ilnur_ryazhapov/Desktop/code_src/quran-nurtech-codex-apple-ui/qa-screens/2026-07-14-qcf-split/mushaf-desktop-dark.png
  - /Users/ilnur_ryazhapov/Desktop/code_src/quran-nurtech-codex-apple-ui/qa-screens/2026-07-14-qcf-split/mushaf-mobile-light.png
  - /Users/ilnur_ryazhapov/Desktop/code_src/quran-nurtech-codex-apple-ui/qa-screens/2026-07-14-qcf-split/surah-mobile-light.png
checks:
  - npm run build
  - git diff --check
  - Playwright QA: /mushaf/3 desktop dark, /mushaf/3 mobile light, /surah/1 desktop dark, /surah/1 mobile light
deploy_url: https://quran.nurtech.dev
---
