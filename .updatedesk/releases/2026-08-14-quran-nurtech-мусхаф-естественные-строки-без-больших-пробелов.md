---
project: quran-nurtech
public: true
type: fix
audience: users
title: "Мусхаф: естественные строки без больших пробелов"
summary: "В режиме Мусхафа переработано выравнивание QCF-строк: текст больше не растягивается огромными пробелами, а страницы остаются аккуратно центрированными при переключении и масштабировании."
user_impact:
  - "Арабский текст выглядит ближе к книжной странице: без резких провалов между словами и без обрезания по краям."
  - "При переключении страниц и изменении масштаба строки сохраняют стабильную ширину и не пересчитываются в другой визуальный вариант."
  - "Проверены desktop и mobile размеры, включая проблемные страницы 13, 42, 44 и 57."
screenshots:
  - qa-screens/mushaf-balanced-p44-1000-z100.png
  - qa-screens/mushaf-balanced-p44-390-z100.png
  - qa-screens/mushaf-balanced-p44-390-z125.png
  - qa-screens/mushaf-balanced-p42-704-z100.png
  - qa-screens/mushaf-balanced-p13-704-z100.png
  - qa-screens/mushaf-balanced-p57-704-z100.png
checks:
  - "git diff --check"
  - "Playwright/Chrome визуальная проверка страниц 13, 42, 44, 57 на 390px, 704px и 1000px; maxOver=0, без forced justify gaps."
  - "npm.cmd run build: данные и Astro routes генерируются, но Windows-сборка останавливается на существующем маршруте dist\\1:1 из-за двоеточия в имени папки."
deploy_url: "http://127.0.0.1:4321/mushaf/44"
---

Notes for editor:
- What changed: убрано принудительное `space-between/justify` для QCF-строк, добавлено ограниченное построчное масштабирование без изменения исходного Quran text.
- Where to verify: открыть `/mushaf/44`, `/mushaf/42`, `/mushaf/57`, проверить 100%, 125% и мобильную ширину 390px.
- Risks: на очень большом пользовательском zoom страница может становиться шире viewport; это ожидаемо, прокрутка сохраняет доступ ко всей странице.
