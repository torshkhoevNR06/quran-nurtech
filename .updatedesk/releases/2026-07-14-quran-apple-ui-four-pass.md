---
project: quran-nurtech
public: true
type: design
audience: users
title: Интерфейс стал спокойнее и системнее
summary: Убрали часть старых CSS-слоёв, перенесли совместимые токены в дизайн-систему, смягчили жирные выделения и привели базовые UI-состояния к более нативной iOS/macOS стилистике.
user_impact: Интерфейс меньше спорит с текстом Корана: фокусные рамки стали мягче, выбранные элементы выглядят спокойнее, мобильное меню прокручивается внутри себя, а локальная статистика больше не шумит ошибками API в preview.
screenshots:
  - qa-screens/2026-07-14-apple-ui-four-pass/desktop-surah-17.png
  - qa-screens/2026-07-14-apple-ui-four-pass/desktop-surah-settings.png
  - qa-screens/2026-07-14-apple-ui-four-pass/mobile-drawer-open.png
  - qa-screens/2026-07-14-apple-ui-four-pass/mobile-mushaf-3.png
checks:
  - npm run build
  - Playwright QA: 23 routes x desktop/mobile, failures = 0
  - Playwright interactions: settings desktop/mobile, drawer own scroll, mushaf zoom
deploy_url: https://quran.nurtech.dev
---

## Что изменилось

- Токены теперь импортируются первым слоем, а недостающие legacy-алиасы перенесены в `design-tokens.css`.
- `global.css` очищен от старой шапки токенов и позднего theme override-блока.
- UI-веса 700/800 заменены на системные `--weight-semibold` и `--weight-strong`.
- В `components.css` добавлены базовые `ui-*` паттерны для страниц, секций, inset-list и empty state.
- Мобильный drawer получил фиксированную sheet-высоту и гарантированный внутренний scroll.
- Локальный preview больше не отправляет запросы к `/api/read/summary`, если API недоступен.
