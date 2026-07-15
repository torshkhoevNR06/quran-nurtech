---
project: quran-nurtech
public: false
type: internal
audience: team
title: Клиентская аналитика вынесена из app.ts
summary: Общие клиентские хелперы и dwell-аналитика чтения вынесены из большого `app.ts` в отдельные модули.
user_impact:
  - Прогресс чтения, drawer и dwell-учёт продолжают работать на десктопе и мобилке.
  - Дальнейшая переработка клиента стала безопаснее: storage, toast и аналитика больше не смешаны с остальной логикой интерфейса.
screenshots:
  - qa-screens/2026-07-15-app-modules/desktop-home.png
  - qa-screens/2026-07-15-app-modules/desktop-surah-dwell.png
  - qa-screens/2026-07-15-app-modules/desktop-progress.png
  - qa-screens/2026-07-15-app-modules/mobile-surah-dwell-active-zone.png
checks:
  - npm run build
  - Playwright smoke: /, /surah/2/, /progress/ on desktop and mobile
deploy_url: local-only
---

Notes for editor:
- What changed: `src/client/shared.ts` owns shared DOM/storage/toast helpers; `src/client/reading-analytics.ts` owns q_progress/q_time/q_days dwell logic.
- Where to verify: open `/`, `/surah/2/`, and `/progress/`; check drawer progress and local dwell counting after several seconds on an ayah.
- Risks: `src/client/app.ts` still contains audio, menus, drawer, ayah actions, and hotkeys; those need later extraction.
