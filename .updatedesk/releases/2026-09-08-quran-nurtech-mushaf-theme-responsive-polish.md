project: quran-nurtech
public: true
type: design
audience: users
title: Мобильный мусхаф стал компактнее и лучше поддерживает темы
summary: Плавающие controls на мобильных экранах стали компактнее, zoom перенесён рядом с кнопкой меню, а выбранная тема теперь применяется ко всему интерфейсу мусхафа.
user_impact: Страница мусхафа занимает доступную высоту без лишнего нижнего резерва. Меню действий и zoom не расходятся по разным краям экрана. Dark, Paper и Light синхронно меняют шапку, фон, controls, меню, выпадающие элементы и сам мусхаф. На светлых режимах подписи и границы стали заметнее.
screenshots:
  - qa-screens/2026-09-08-mushaf-mobile-floating-controls/22-light-compact-final.png
  - qa-screens/2026-09-08-mushaf-mobile-floating-controls/23-light-menu-final.png
  - qa-screens/2026-09-08-mushaf-mobile-floating-controls/24-dark-full-height-final.png
  - qa-screens/2026-09-08-mushaf-mobile-floating-controls/25-paper-full-height-final.png
  - qa-screens/2026-09-08-mushaf-mobile-floating-controls/26-desktop-paper-final.png
  - qa-screens/2026-09-08-mushaf-mobile-floating-controls/27-mobile320-menu-final.png
checks:
  - npm run data
  - npm run build
  - git diff --check
  - Playwright CLI QA at 320x700, 390x844, and 1366x768
  - Theme sync check for Dark, Paper, and Light
  - Mobile menu width, zoom adjacency, full-height sheet, and horizontal overflow checks
  - npx tsc --noEmit (existing unrelated errors remain in audio.ts, search.ts, and topbar.ts)
deploy_url: http://127.0.0.1:4321/mushaf/76
