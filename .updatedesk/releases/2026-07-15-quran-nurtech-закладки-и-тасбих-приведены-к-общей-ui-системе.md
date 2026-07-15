---
project: quran-nurtech
public: true
type: design
audience: users
title: Закладки и тасбих приведены к общей UI-системе
summary: Страницы закладок и тасбиха получили общие кнопки, карточки, сегменты и плитки статистики.
user_impact:
  - Закладки выглядят ближе к остальным системным страницам приложения.
  - Тасбих стал визуально спокойнее и стабильнее на мобильном экране.
screenshots:
  - qa-screens/2026-07-15-bookmarks-tasbih-components/desktop-bookmarks.png
  - qa-screens/2026-07-15-bookmarks-tasbih-components/mobile-tasbih.png
checks:
  - npm run build
  - Playwright bookmarks/tasbih components QA: 9 checks, 0 failures
deploy_url: https://quran.nurtech.dev
---

Notes for editor:
- What changed: page-local styles moved into dedicated CSS layers; tasbih uses shared segmented/stat components; generated bookmark rows use shared card/button classes.
- Where to verify: /bookmarks, /tasbih.
- Risks: low; localStorage behavior and existing data keys are preserved.
