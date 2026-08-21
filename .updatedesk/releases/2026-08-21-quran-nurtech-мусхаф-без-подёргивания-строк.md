---
project: quran-nurtech
public: true
type: fix
audience: users
title: Мусхаф без подёргивания строк
summary: Убрано подёргивание строк мусхафа при наведении, обновлении страницы и повторных пересчётах масштаба.
user_impact:
  - При наведении мышью аяты больше не меняют положение и ширину.
  - После загрузки QCF-шрифта строки стабилизируются без повторного раскачивания scale.
  - Масштабирование и возврат к 100% не запускают новый цикл смещения строк.
screenshots: []
checks:
  - Visual QA через Chromium: /mushaf/76 на 390x844, hover delta 0 по word/line left и width.
  - Visual QA через Chromium: /mushaf/67 на 390x844, hover delta 0 по word/line left и width.
  - Visual QA через Chromium: /mushaf/81 на 1440x900, hover delta 0 по word/line left и width.
  - Visual QA через Chromium: /mushaf/76 и /mushaf/67, 100% -> 180% -> 100%, overflow 0 и shift 0px.
  - npm run build: ранее не прошёл из-за существующей Windows-проблемы генерации dist/1:1 (ENOENT, двоеточие в имени пути).
deploy_url: http://127.0.0.1:4321/mushaf/76
---

Notes for editor:
- What changed: Измерение natural width QCF-строк перенесено на невидимый клон, живые строки больше не меняют scale/width во время расчёта.
- Where to verify: /mushaf/76 и /mushaf/67 на мобильной ширине 390px, а также /mushaf/81 на desktop.
- Screenshots: QA-скриншоты не сохранены в репозитории перед пушем.
- Risks: Измерение стало немного дороже на проход fit, но затрагивает только 15 строк страницы и не меняет текстовый DOM.
