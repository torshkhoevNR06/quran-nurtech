project: quran-nurtech
public: true
type: design
audience: users
title: Улучшено мобильное меню мусхафа
summary: Мобильное меню мусхафа стало компактнее и аккуратнее на разных размерах экранов.
user_impact: Блок номера страницы теперь использует доступную ширину, выбор суры и джуза не выходит за границы, действия отображаются без лишнего пространства, а нижние контролы подняты от края экрана. Иконка меню плавно превращается в крестик. В полноэкранном режиме плавающий zoom скрывается.
screenshots:
  - qa-screens/2026-09-08-mushaf-mobile-floating-controls/33-dark-menu-layout-fixed-430.png
  - qa-screens/2026-09-08-mushaf-mobile-floating-controls/31-dark-menu-layout-open-320.png
  - qa-screens/2026-09-08-mushaf-mobile-floating-controls/34-fab-x-open-430.png
checks:
  - npm run data
  - git diff --check
  - HTTP 200: http://127.0.0.1:4321/mushaf/76
  - Playwright QA: 320x700, 390x844, 430x932; dark theme; mobile menu open/close; fullscreen
  - npm run build: blocked by existing Windows Astro route `/1:1` ENOENT during static generation
  - npx tsc --noEmit: only pre-existing errors in audio.ts, search.ts and topbar.ts
deploy_url: http://127.0.0.1:4321/mushaf/76
