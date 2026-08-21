---
project: quran-nurtech
public: true
type: feature
audience: users
title: Плавное перелистывание мусхафа
summary: Перелистывание страниц мусхафа стало стабильнее: лист больше не дергается и не меняет размеры во время перехода.
user_impact:
  - Свайп и соседние кнопки страниц на мобильных устройствах используют единый плавный переход.
  - Мусхаф сохраняет стабильную ширину и высоту во время загрузки следующей страницы.
  - Аяты не показываются в промежуточной геометрии до готовности QCF-шрифта и финальной раскладки.
screenshots: []
checks:
  - npm run data
  - Playwright QA: /mushaf/76 mobile 390x844 swipe, max sheet width/height delta 0
  - Playwright QA: /mushaf/76 mobile 390x844 next button, max sheet width/height delta 0
  - Playwright QA: /mushaf/76 immersive 390x844 next button, max sheet width/height delta 0
  - npm run build: failed on existing Windows route path issue dist\1:1 (ENOENT)
deploy_url: http://127.0.0.1:4321/mushaf/76
---

Notes for editor:
- What changed: stabilized swipe commit, delayed navigation completion until reveal finishes, and routed adjacent mobile page buttons through the same page-turn path.
- Where to verify: /mushaf/76 and /mushaf/67 on mobile widths, including immersive mode.
- Screenshots: QA-скриншоты не сохранены в репозитории перед пушем.
- Risks: the generated incoming peek still uses the existing skeleton while the next QCF page is preparing; geometry is stable, but the visual may be refined later by rendering the cached target page into the peek.
