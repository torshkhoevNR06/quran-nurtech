---
project: quran-nurtech
public: true
type: fix
audience: users
title: Исправлены меню и карточки
summary: Выровнены иконки в левом меню и защищены карточки главной страницы от выхода текста за границы.
user_impact:
  - В левом меню иконки теперь стоят в одинаковом слоте и не съезжают относительно текста.
  - Текст в быстрых карточках сур больше не вылезает за карточку.
  - Карточки списка сур сохраняют внутренние отступы и не дают названию, подписи или действиям выйти наружу.
screenshots:
  - qa-screens/2026-07-15-sidebar-cards-hotfix.png
checks:
  - npm run build
  - Playwright desktop metrics: sidebar icon slots 20px, card overflow=false, overflowX=0
deploy_url: https://quran.nurtech.dev/
---

Notes for editor:
- What changed: normalized drawer icon slots and added min-width/overflow guards to home quick surah and surah grid cards.
- Where to verify: / in light and dark themes with the desktop sidebar open.
- Risks: low; CSS-only layout hardening.
