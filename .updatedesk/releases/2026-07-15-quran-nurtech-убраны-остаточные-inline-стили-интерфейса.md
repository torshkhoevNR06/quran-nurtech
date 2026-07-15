---
project: quran-nurtech
public: true
type: design
audience: users
title: Убраны остаточные inline-стили интерфейса
summary: Оставшиеся ручные inline-стили интерфейса заменены системными классами и отдельными CSS-слоями.
user_impact:
  - Навигационные кнопки, справочные страницы и поиск стали консистентнее с общей дизайн-системой.
  - Заметки к аятам вынесены в отдельный reader-слой, что снижает риск конфликтов стилей.
screenshots:
  - qa-screens/2026-07-15-inline-css-cleanup/desktop-home.png
  - qa-screens/2026-07-15-inline-css-cleanup/mobile-search.png
  - qa-screens/2026-07-15-inline-css-cleanup/desktop-surah-bookmarks-menu.png
  - qa-screens/2026-07-15-inline-css-cleanup/mobile-mushaf.png
checks:
  - npm run build
  - Playwright inline CSS cleanup QA: 16 checks, 0 failures
deploy_url: https://quran.nurtech.dev
---

Notes for editor:
- What changed: shared inline icon utilities, shortcut/tool classes, search classes, and reader-notes.css replaced scattered inline styles.
- Where to verify: /, /search, /surah/1, /2:255, /mushaf/2, /howto, /videos.
- Risks: low; the only remaining inline style is the required QCF @font-face block for mushaf pages.
