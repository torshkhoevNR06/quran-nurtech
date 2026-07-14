---
project: quran-nurtech
public: true
type: design
audience: users
title: Интерфейс стал визуально легче
summary: Смягчили тяжёлые выделения, фокус-кольца, активные пункты, бейджи аятов и кнопки тафсира по всему приложению.
user_impact: Страницы чтения и боковое меню выглядят спокойнее: меньше жирных плашек и резких рамок, при этом клавиатурный фокус остаётся видимым.
screenshots:
  - /Users/ilnur_ryazhapov/Desktop/code_src/quran-nurtech/qa-screens/2026-07-14-visual-softening/surah-23-dark-softened.png
checks:
  - npm run build
  - Playwright QA: surah/23, dark theme, focused drawer search, overflowX=0
deploy_url: https://quran.nurtech.dev
---
