---
project: quran-nurtech
public: false
type: internal
audience: team
title: Reader и mushaf CSS вынесены из global.css
summary: Базовые стили страницы суры, аятов, тафсира, режимов перевода и таджвида перенесены в reader.css. Нижний лист аята в режиме мусхафа перенесён в mushaf.css.
user_impact: Видимых изменений для пользователей нет; структура CSS стала ближе к назначению экранов и устойчивее к конфликтам каскада в читалке и мусхафе.
screenshots:
  - qa-screens/2026-07-14-reader-split/desktop-surah-1.png
  - qa-screens/2026-07-14-reader-split/mobile-surah-1.png
  - qa-screens/2026-07-14-reader-split/desktop-mushaf-3.png
  - qa-screens/2026-07-14-reader-split/mobile-mushaf-3.png
checks:
  - npm run build
  - Reader split QA: /surah/1, /surah/9, /mushaf/3 desktop/mobile, horizontal overflow false, console errors 0
deploy_url: https://quran.nurtech.dev
---
