---
project: quran-nurtech
public: true
type: fix
audience: users
title: "Мусхаф: стабильный масштаб без рывков"
summary: "Исправлена нестабильность отображения аятов при перелистывании и масштабировании: строки больше не меняют размер после появления на странице, а увеличенный Мусхаф не обрезает текст слева."
user_impact:
  - "При переходе между страницами Мусхафа пользователь видит уже рассчитанную страницу, без короткого растягивания и последующего сжатия строк."
  - "Масштабирование увеличивает собранную страницу целиком, не пересобирая арабские строки заново."
  - "На desktop и mobile сохранены ровные поля текста без горизонтального overflow."
screenshots:
  - qa-screens/mushaf-stable-v4-p9-704-z120.png
  - qa-screens/mushaf-stable-v4-p9-390-z120.png
  - qa-screens/mushaf-stable-v4-fastnav-p12-704.png
checks:
  - "git diff --check"
  - "Playwright/Chrome: страницы 8 → 9 → 10 → 11 → 12; font-size=23.92px, --mushaf-qcf-fit=1 после каждой страницы."
  - "Playwright/Chrome: страница 9 при zoom 120% на 704px и 390px; текст не обрезается слева, mobile scrollWidth=390."
  - "npm.cmd run build: генерация данных и Astro routes стартуют, затем Windows-сборка падает на существующем маршруте dist\\1:1 из-за двоеточия в имени папки."
deploy_url: "http://127.0.0.1:4321/mushaf/9"
---

Notes for editor:
- What changed: скрытие QCF до финального расчёта, удаление глобального fit-пересчёта текста, zoom как масштабирование уже собранного слоя.
- Where to verify: `/mushaf/8`, `/mushaf/9`, быстрый переход вперёд и zoom 120%.
- Risks: существующий build blocker `dist\\1:1` не связан с текущими стилями Мусхафа.
