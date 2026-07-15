---
project: quran-nurtech
public: false
type: internal
audience: team
title: Плеер переведён на UI-компоненты
summary: Нижний аудиоплеер переведён на общие Toolbar/IconButton-компоненты с сохранением текущей визуальной формы.
user_impact:
  - Play, speed и repeat продолжают работать как раньше.
  - Плеер стал ближе к общей Apple-like компонентной системе, без визуальной ломки floating material.
screenshots:
  - qa-screens/2026-07-15-player-component/desktop-player-component.png
  - qa-screens/2026-07-15-player-component/mobile-player-component.png
checks:
  - npm run build
  - Playwright player component QA: 7 checks, 0 failures
deploy_url: http://127.0.0.1:4331/surah/1/
---

Notes for editor:
- What changed: `Player.astro` now uses shared `Toolbar` and `IconButton` primitives while preserving player-specific classes and data hooks.
- Where to verify: `/surah/1/`, start ayah playback and test speed/repeat controls.
- Risks: The central play button keeps custom player styling intentionally; it is not visually normalized to a square icon button.
