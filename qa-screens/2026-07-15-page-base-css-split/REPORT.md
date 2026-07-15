# Page Base CSS Split QA

Base: http://127.0.0.1:4346

## Cases
- about-desktop-light: /about/ 1440x1000 light
  - title: О проекте — Коран онлайн
  - overflowX: false
  - errors: none
  - toast: block / 1 / QA toast
  - .page: grid 860x1331
  - .page h1: block 828x50
  - .footer: block 1195x161
- search-mobile-dark: /search/?q=милость 390x844 dark
  - title: Поиск по Корану — по русскому переводу
  - overflowX: false
  - errors: none
  - toast: block / 0 / empty
  - .only-mobile: grid 42x42
  - .search-page: block 390x54232
  - .footer: block 390x343
- surah-mobile-dark: /surah/1 390x844 dark
  - title: Сура 1: Аль-Фатиха (Открывающая) — читать с тафсиром ас-Саади
  - overflowX: false
  - errors: none
  - toast: block / 0 / empty
  - .only-mobile: grid 42x42
  - .surah-head: block 358x242
  - .footer: block 390x343
- audio-desktop-light: /audio/ 1440x1000 light
  - title: Аудио Корана — чтецы, суры, скачивание
  - overflowX: false
  - errors: none
  - toast: block / 0 / empty
  - .page-head: block 760x146
  - .eyebrow: block 760x19
  - .footer: block 1212x161
- home-desktop-light: / 1440x1000 light
  - title: Коран онлайн на русском — читать, слушать, изучать
  - overflowX: false
  - errors: none
  - toast: block / 0 / empty
  - .home-copy h1: block 342x141
  - .footer: block 1140x161
