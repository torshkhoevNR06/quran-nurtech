---
project: quran-nurtech
public: true
type: feature
audience: users
title: Быстрее переключение страниц мусхафа
summary: Кнопки перехода между страницами мусхафа теперь мгновенно обновляют номер страницы и показывают стабильный skeleton, пока текст и QCF-шрифт догружаются.
user_impact:
  - Нажатие на стрелки рядом с номером страницы ощущается быстрее.
  - URL, поле номера страницы и состояние кнопок обновляются сразу после клика.
  - Текст мусхафа по-прежнему раскрывается только после готовности шрифта, без показа битых fallback-глифов.
screenshots:
  - qa-screens/2026-08-21-mushaf-compact-surah-centering/mobile390-p2-dark-final.png
checks:
  - Playwright Chrome desktop: /mushaf/12 -> /mushaf/13 URL updates in 88ms, input updates in 94ms, qcf page attr updates in 101ms
  - Playwright Chrome desktop: repeated next clicks /mushaf/12 -> /mushaf/14 complete with correct final page and no horizontal overflow
deploy_url: http://127.0.0.1:4321/mushaf/12
---

Notes for editor:
- What changed: page navigation now performs an optimistic pending-page update before fetch/font readiness, then swaps in the loaded page once the QCF font is ready.
- Where to verify: open /mushaf/12 and click the next/previous page buttons around the page number.
- Risks: low; fallback still navigates with a full page load if fetching or swapping fails.
