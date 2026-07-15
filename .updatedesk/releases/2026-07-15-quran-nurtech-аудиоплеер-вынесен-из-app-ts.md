---
project: quran-nurtech
public: false
type: internal
audience: team
title: Аудиоплеер вынесен из app.ts
summary: Логика аудиоплеера вынесена из общей клиентской точки сборки в отдельный модуль.
user_impact:
  - Поведение плеера, скорости, повтора, перехода по аятам и режима заучивания сохранено.
  - Код стал проще поддерживать при дальнейшем Apple-like polish плеера и reader shell.
screenshots:
  - qa-screens/2026-07-15-audio-player-extract/desktop-audio-player.png
checks:
  - npm run build
  - Playwright audio-player extract QA: 8 checks, 0 failures
deploy_url: http://127.0.0.1:4331/surah/1/
---

Notes for editor:
- What changed: `src/client/audio-player.ts` now owns playlist, reciter choice, playback controls, fallback audio URL, highlight and preloading. `src/client/app.ts` is reduced to boot orchestration.
- Where to verify: `/surah/1/`, click the ayah play button, then test speed, repeat, next and memorize controls.
- Risks: Audio CDN playback is still network-dependent; targeted QA stubs mp3 requests and checks UI/state wiring.
