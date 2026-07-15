---
project: quran-nurtech
public: false
type: internal
audience: team
title: Mushaf CSS разделён на отдельные слои
summary: Большой src/styles/mushaf.css разнесён на action sheet, QCF page, reader shell, zoom, immersive mode и responsive rules с сохранением прежнего порядка каскада.
user_impact: Внешний вид мусхафа сохраняется, а дальнейшие правки полноэкранного режима, масштаба, мобильной панели и QCF-страницы становятся безопаснее.
screenshots:
  - /Users/ilnur_ryazhapov/Desktop/code_src/quran-nurtech-codex-apple-ui/qa-screens/2026-07-15-mushaf-css-split/desktop-mushaf-page-2.png
  - /Users/ilnur_ryazhapov/Desktop/code_src/quran-nurtech-codex-apple-ui/qa-screens/2026-07-15-mushaf-css-split/desktop-mushaf-page-49.png
  - /Users/ilnur_ryazhapov/Desktop/code_src/quran-nurtech-codex-apple-ui/qa-screens/2026-07-15-mushaf-css-split/mobile-mushaf-page-2.png
  - /Users/ilnur_ryazhapov/Desktop/code_src/quran-nurtech-codex-apple-ui/qa-screens/2026-07-15-mushaf-css-split/mobile-mushaf-page-49.png
checks:
  - npm run build
  - git diff --check
  - Playwright QA with document.fonts.ready: /mushaf/2 and /mushaf/49 on desktop and mobile
deploy_url: https://quran.nurtech.dev
---
