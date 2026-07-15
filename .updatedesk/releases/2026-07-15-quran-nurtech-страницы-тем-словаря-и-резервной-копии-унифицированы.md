---
project: quran-nurtech
public: true
type: design
audience: users
title: Страницы тем, словаря и резервной копии унифицированы
summary: Темы, словарь терминов и резервная копия приведены к общей системе карточек, кнопок и page layout.
user_impact:
  - Страницы выглядят спокойнее и консистентнее с остальным приложением.
  - На мобильном сохранены корректные отступы и нет горизонтального переполнения.
screenshots:
  - qa-screens/2026-07-15-page-css-components/desktop-topics.png
  - qa-screens/2026-07-15-page-css-components/desktop-glossary-search.png
  - qa-screens/2026-07-15-page-css-components/mobile-backup.png
checks:
  - npm run build
  - Playwright page CSS/components QA: 10 checks, 0 failures
deploy_url: https://quran.nurtech.dev
---

Notes for editor:
- What changed: page-local CSS moved into dedicated page style layers; cards and export button now use shared UI components.
- Where to verify: /topics, /glossary, /backup.
- Risks: low; behavior hooks and localStorage backup logic are preserved.
