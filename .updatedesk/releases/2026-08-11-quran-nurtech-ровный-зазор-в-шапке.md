---
project: quran-nurtech
public: true
type: design
audience: users
title: Ровный зазор в шапке
summary: В верхней панели уменьшен и зафиксирован отступ между названием текущего раздела и быстрым поиском.
user_impact:
  - Шапка выглядит плотнее и аккуратнее на desktop и планшетных ширинах.
  - Короткие названия разделов больше не создают большой пустой промежуток перед поиском.
  - Центрирование содержимого шапки сохраняется на проверенных ширинах.
screenshots:
  - qa-screens/topbar-context-gap-1190.png
  - qa-screens/topbar-context-gap-tasbih-1190.png
  - qa-screens/topbar-context-gap-mushaf-1120.png
  - qa-screens/topbar-context-gap-glossary-1366.png
  - qa-screens/topbar-context-gap-search-390.png
  - qa-screens/topbar-context-width-glossary-1190.png
  - qa-screens/topbar-context-width-glossary-1120.png
checks:
  - Playwright visual/metrics check for /tasbih at 1190px: gap 12px, centered cluster, overflow 0.
  - Playwright visual/metrics check for /mushaf/56 at 1120px: gap 12px, centered cluster, overflow 0.
  - Playwright visual/metrics check for /glossary at 1366px: gap 12px, centered cluster, overflow 0.
  - Playwright visual/metrics check for /glossary at 1190px and 1120px: section title is not clipped, gap 12px, centered cluster, overflow 0.
  - Playwright visual/metrics check for /search at 390px: mobile layout preserved, overflow 0.
deploy_url: http://127.0.0.1:4321/tasbih
---

Notes for editor:
- What changed: toolbar context sizing no longer reserves a large clamp-based width for short section names.
- Where to verify: topbar on Tasbih, Mushaf, Glossary and mobile Search.
- Risks: only the topbar context flex sizing was changed; quick search and navigation behavior were not changed.
