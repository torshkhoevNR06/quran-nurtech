---
project: quran-nurtech
public: true
type: design
audience: users
title: Типографика приведена к системным весам Apple-like UI
summary: Заголовки и UI-текст стали спокойнее: тяжёлые веса заменены системными токенами, а крупные заголовки уменьшены.
user_impact:
  - Интерфейс меньше выглядит как веб-страница с жирными заголовками и ближе к нативной iOS/macOS иерархии.
  - Типографика стала консистентнее между главной, чтением, поиском, статистикой и служебными страницами.
screenshots:
  - qa-screens/2026-07-15-typography-pass/desktop-home.png
  - qa-screens/2026-07-15-typography-pass/desktop-surah-1.png
  - qa-screens/2026-07-15-typography-pass/mobile-home.png
  - qa-screens/2026-07-15-typography-pass/mobile-stats.png
checks:
  - npm run build
  - Playwright typography pass QA: 72 checks, 0 failures
deploy_url: https://quran.nurtech.dev
---

Notes for editor:
- What changed: title weight is now 650, oversized page/reader headings were reduced, and raw CSS font weights were normalized to tokens.
- Where to verify: compare home, surah, search, stats, audio, topics, glossary, bookmarks and tasbih on desktop/mobile.
- Risks: Arabic/QCF reading typography was intentionally not aggressively resized in this pass.
