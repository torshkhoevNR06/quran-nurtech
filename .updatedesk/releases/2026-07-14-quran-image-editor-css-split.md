---
project: quran-nurtech
public: false
type: internal
audience: team
title: CSS редактора картинок вынесен в отдельный файл
summary: Стили модалки экспорта аята в картинку перенесены из global.css в src/styles/image-editor.css и подключены в общем layout после базовых компонентов.
user_impact: Внешний вид редактора не меняется, но CSS стал изолированнее и проще поддерживать без риска задеть чтение или мусхаф.
screenshots:
  - /Users/ilnur_ryazhapov/Desktop/code_src/quran-nurtech-codex-apple-ui/qa-screens/2026-07-14-image-editor-css-split/editor-desktop-dark.png
  - /Users/ilnur_ryazhapov/Desktop/code_src/quran-nurtech-codex-apple-ui/qa-screens/2026-07-14-image-editor-css-split/editor-mobile-light.png
checks:
  - npm run build
  - git diff --check
  - Playwright QA: injected image-editor DOM on /surah/1 desktop dark and mobile light
deploy_url: https://quran.nurtech.dev
---
