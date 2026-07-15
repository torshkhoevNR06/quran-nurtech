---
project: quran-nurtech
public: false
type: internal
audience: team
title: Reader CSS разделён на поддерживаемые слои
summary: Большой src/styles/reader.css разнесён на reader-structure, reader-tafsir, reader-modes, reader-context, reader-compat и reader-polish без изменения порядка каскада.
user_impact: Внешний вид чтения сохраняется, а дальнейшие правки сур, тафсира, режимов отображения и контекстного меню становятся безопаснее и предсказуемее.
screenshots:
  - /Users/ilnur_ryazhapov/Desktop/code_src/quran-nurtech-codex-apple-ui/qa-screens/2026-07-15-reader-css-split/desktop-surah-9.png
  - /Users/ilnur_ryazhapov/Desktop/code_src/quran-nurtech-codex-apple-ui/qa-screens/2026-07-15-reader-css-split/desktop-surah-1.png
  - /Users/ilnur_ryazhapov/Desktop/code_src/quran-nurtech-codex-apple-ui/qa-screens/2026-07-15-reader-css-split/desktop-ayah-2-255.png
  - /Users/ilnur_ryazhapov/Desktop/code_src/quran-nurtech-codex-apple-ui/qa-screens/2026-07-15-reader-css-split/mobile-surah-1.png
checks:
  - npm run build
  - git diff --check
  - Browser QA: /surah/9, /surah/1, /2:255 desktop and /surah/1 mobile
deploy_url: https://quran.nurtech.dev
---
