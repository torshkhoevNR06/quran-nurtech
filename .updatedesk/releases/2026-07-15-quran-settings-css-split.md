---
project: quran-nurtech
public: false
type: internal
audience: team
title: Settings CSS разделён на слои
summary: Меню настроек разнесено на panel, sections, controls, responsive и toggles CSS-слои с сохранением исходного порядка каскада.
user_impact:
  - Внешний вид и поведение панели настроек должны сохраниться.
  - Дальнейшая переработка inspector/sheet-логики стала безопаснее и локальнее.
screenshots:
  - qa-screens/2026-07-15-settings-css-split/desktop-settings-open.png
  - qa-screens/2026-07-15-settings-css-split/mobile-settings-open.png
checks:
  - npm run build
  - git diff --check
  - Browser QA: desktop settings, narrow desktop settings, mobile surah settings, mobile home settings
deploy_url: https://quran.nurtech.dev
---

Notes for editor:
- What changed: src/styles/settings.css удалён, его правила разложены по тематическим settings-*.css файлам.
- Where to verify: /surah/9 и /surah/1/?v=settings-redesign-3, кнопка настроек в topbar.
- Risks: изменение каскада механическое; визуальные отличия не ожидаются, но настройки остаются важной зоной для полного UI QA.
