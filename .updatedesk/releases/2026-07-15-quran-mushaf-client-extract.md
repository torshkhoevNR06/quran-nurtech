---
project: quran-nurtech
public: false
type: internal
audience: team
title: Mushaf client вынесен из страницы
summary: Поведение мушафа вынесено из inline-скрипта страницы в `src/client/mushaf.ts`, а статичное immersive-display правило перенесено в CSS-слой.
user_impact:
  - Режим мушафа сохраняет прежнее поведение: страница, zoom и immersive работают.
  - Код подготовлен к отдельному polish-проходу по fullscreen, zoom/pan и мобильной композиции.
screenshots:
  - qa-screens/2026-07-15-mushaf-client-extract/desktop-mushaf.png
  - qa-screens/2026-07-15-mushaf-client-extract/mobile-mushaf.png
  - qa-screens/2026-07-15-mushaf-client-extract/mobile-mushaf-immersive.png
checks:
  - npm run build
  - Playwright smoke: /mushaf/2 desktop and mobile, zoom, immersive
deploy_url: local http://127.0.0.1:4354/mushaf/2/
---

Notes for editor:
- What changed:
  - `src/pages/mushaf/[page].astro` now keeps page markup and dynamic page font CSS.
  - Mushaf client behavior now lives in `src/client/mushaf.ts`.
- Where to verify:
  - `/mushaf/2/`
- Risks:
  - Low: behavior was moved mechanically and smoke-tested. Further visual polish is still required.
