---
project: quran-nurtech
public: true
type: design
audience: users
title: Интерфейс ближе к iOS и macOS
summary: Обновили визуальную систему приложения: системная типографика, спокойные материалы, компактный desktop toolbar, inspector настроек, iOS-style нижняя навигация и bottom sheet меню на телефоне.
user_impact: На десктопе настройки больше ощущаются как боковой inspector и аккуратно ужимают контент. На телефоне меню открывается как нижняя панель без автопоказа клавиатуры, нижняя навигация стала ближе к iOS, а режим мусхафа не перекрывается таббаром.
screenshots:
  - qa-screens/2026-07-14-apple-platform-polish/desktop-surah-settings-dark.png
  - qa-screens/2026-07-14-apple-platform-polish/mobile-surah-light.png
  - qa-screens/2026-07-14-apple-platform-polish/mobile-surah-drawer.png
  - qa-screens/2026-07-14-apple-platform-polish/mobile-mushaf-dark.png
checks:
  - npm run build
  - Playwright smoke: desktop surah with settings inspector, mobile surah, mobile drawer, mobile mushaf
deploy_url: https://quran.nurtech.dev
---

## Что изменилось

- Введены финальные Apple-like дизайн-токены для фона, материалов, separator/fill цветов, control sizes, радиусов, теней и системных шрифтов.
- Десктопный shell стал ближе к macOS: компактная панель инструментов, спокойный сайдбар, inspector настроек справа, без перекрытия контента.
- Мобильный shell стал ближе к iOS: floating topbar, bottom tabbar, bottom sheet для меню и настроек, safe-area отступы.
- В читалке приглушены тяжелые состояния выделения и кнопки тафсира, чтобы интерфейс меньше спорил с текстом.
- В режиме мусхафа нижний tabbar скрывается, навигация остается отдельной и не перекрывает страницу.
