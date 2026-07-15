---
project: quran-nurtech
public: true
type: feature
audience: users
title: Мушаф получил сохранение масштаба и жесты
summary: В режиме мушафа масштаб и позиция страницы теперь сохраняются, а на телефоне работает pinch-жест для увеличения текста.
user_impact:
  - Можно увеличить страницу, сдвинуть её в удобное место и вернуться к тому же виду после перезагрузки.
  - На телефоне страницу можно увеличивать привычным жестом двумя пальцами.
  - Полноэкранный режим мушафа проверен отдельно для светлой и тёмной темы.
screenshots:
  - qa-screens/2026-07-15-mushaf-advanced-polish/desktop-zoom-restored.png
  - qa-screens/2026-07-15-mushaf-advanced-polish/desktop-immersive.png
  - qa-screens/2026-07-15-mushaf-advanced-polish/mobile-light.png
  - qa-screens/2026-07-15-mushaf-advanced-polish/mobile-dark.png
  - qa-screens/2026-07-15-mushaf-advanced-polish/mobile-immersive.png
checks:
  - "npm run build"
  - "Playwright mushaf advanced polish audit: 9 checks, 0 failures"
deploy_url: https://quran.nurtech.dev
---

Notes for editor:
- What changed: per-page zoom/pan persistence, mobile pinch zoom, fullscreen/theme verification.
- Where to verify: /mushaf/2 and /mushaf/8.
- Risks: actual iOS Safari gesture physics can still differ slightly from Playwright touch simulation.
