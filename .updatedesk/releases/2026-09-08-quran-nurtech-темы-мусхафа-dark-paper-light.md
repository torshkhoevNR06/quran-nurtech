---
project: quran-nurtech
public: true
type: feature
audience: users
title: Темы мусхафа Dark Paper Light
summary: В режиме мусхафа цвет страницы теперь переключается между Dark, Paper и Light ближе к поведению Sajda.
user_impact:
  - Тема меняет именно поле мусхафа: ночной режим, тёплая бумага или белая страница.
  - Таджвидная палитра сохраняется при смене темы, включая полноэкранный режим.
  - Старые сохранённые варианты стиля автоматически приводятся к новым Dark, Paper и Light.
screenshots:
  - qa-screens/2026-09-08-mushaf-color-themes/dark-mobile390.png
  - qa-screens/2026-09-08-mushaf-color-themes/paper-mobile390.png
  - qa-screens/2026-09-08-mushaf-color-themes/light-mobile390.png
  - qa-screens/2026-09-08-mushaf-color-themes/dark-desktop1366.png
  - qa-screens/2026-09-08-mushaf-color-themes/paper-desktop1366.png
  - qa-screens/2026-09-08-mushaf-color-themes/light-desktop1366.png
  - qa-screens/2026-09-08-mushaf-color-themes/dark-mobile390-fullscreen.png
  - qa-screens/2026-09-08-mushaf-color-themes/paper-mobile390-fullscreen.png
  - qa-screens/2026-09-08-mushaf-color-themes/light-mobile390-fullscreen.png
checks:
  - npm run data
  - git diff --check
  - npx playwright screenshot: /mushaf/76, Dark/Paper/Light, 390x844 and 1366x768
  - Playwright DOM metrics: /mushaf/76, Dark/Paper/Light, normal and mobile fullscreen, overflowX=0
  - npx tsc --noEmit (fails on existing unrelated errors in src/client/audio.ts, src/client/search.ts, src/client/topbar.ts)
  - npm run build (fails on existing Windows path issue: dist/1:1)
deploy_url: http://127.0.0.1:4321/mushaf/76
---

Notes for editor:
- What changed: Mushaf-specific color themes now use Dark, Paper and Light naming and QCF font palettes. Mobile fullscreen no longer forces dark inversion.
- Where to verify: /mushaf/76, style-cycle button, then fullscreen button on mobile viewport.
- Risks: Global TypeScript/build errors remain outside this change and are recorded above.
