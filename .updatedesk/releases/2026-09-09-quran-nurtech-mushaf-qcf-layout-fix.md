project: quran-nurtech
public: true
type: fix
audience: users
title: Исправлена геометрия страниц мусхафа
summary: Короткие страницы мусхафа больше не сжимаются на мобильных экранах, а страницы с началом чтения ниже верхней строки равномерно заполняют доступную область.
user_impact: Аль-Фатиха и начало Аль-Бакара читаются нормальным размером и по центру. На странице 600 убраны лишние верхние отступы и наложение строк. Квадраты на страницах 568, 570 и других обнаруженных страницах заменены корректными глифами через точечный совместимый fallback-шрифт. Проверены мобильный, десктопный и полноэкранный режимы.
screenshots:
  - qa-screens/2026-09-09-mushaf-qcf-fixes-before/page-1-desktop-before.png
  - qa-screens/2026-09-09-mushaf-qcf-fixes-before/page-568-desktop-before.png
  - qa-screens/2026-09-09-mushaf-qcf-fixes-before/page-600-desktop-before.png
  - qa-screens/2026-09-09-mushaf-qcf-fixes-after/page-1-mobile-after.png
  - qa-screens/2026-09-09-mushaf-qcf-fixes-after/page-2-mobile-after.png
  - qa-screens/2026-09-09-mushaf-qcf-fixes-after/page-568-mobile-after.png
  - qa-screens/2026-09-09-mushaf-qcf-fixes-after/page-570-mobile-after.png
  - qa-screens/2026-09-09-mushaf-qcf-fixes-after/page-600-desktop-after.png
checks:
  - npm run data
  - git diff --check
  - npx tsc --noEmit (existing unrelated errors remain in audio.ts, search.ts, and topbar.ts)
  - npm run build (existing Windows Astro failure at the /1:1 route)
  - Impeccable detector returned [] for changed Mushaf targets
  - Playwright QA at 390x844 and 1366x768 for pages 1, 2, 568, 570, 599, and 600
  - Client navigation 600 -> 599 -> 600, fullscreen enter/exit, and overlap checks
  - Dark, Paper, and Light theme font/render checks
deploy_url: http://127.0.0.1:4321/mushaf/600
