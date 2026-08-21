# Sajda Mushaf Comparison

Date: 2026-08-21

## Evidence Checked

- Sajda FAQ confirms Quran reading modes: `Surah`, `Page`, and Sajda+ `Mushaf` with Tajweed.
  Source: https://faq.sajda.app/question/100
- Sajda FAQ confirms translation, transcription, Tajweed rules, customizable colors, font size, and translation language options.
  Source: https://faq.sajda.app/question/112
- Google Play listing confirms current Sajda app version context, Quran reader, and offline Quran positioning under Sajda+.
  Source: https://play.google.com/store/apps/details?hl=en&id=com.raimbekov.android.sajde
- App Store screenshot indexing showed Sajda Quran screens with page/juz indicators, inline translation/transliteration in Surah mode, bookmark affordance, and a full-page Mushaf-like Arabic mode.
  Source image examples:
  - https://is1-ssl.mzstatic.com/image/thumb/PurpleSource211/v4/80/37/8d/80378d1b-5d20-c053-e5e5-31e783f06b3c/Simulator_Screenshot_-_iPhone_16_Pro_Max_-_2025-07-24_at_10.16.03.png/471x1024.jpeg
  - https://fastly.mwm-storage.mwmcdn.com/raw_files/6da920af-1415-4ec4-96f1-8a541741ee27?format=webp&height=1280
- Third-party changelog mirror mentions selected-ayah translation support in Mushaf mode.
  Source: https://sajde-kz-ios.soft112.com/

## Local Baseline Screenshots

- `qa-screens/2026-08-21-sajda-mushaf-comparison/desktop-light.png`
- `qa-screens/2026-08-21-sajda-mushaf-comparison/mobile-light.png`
- `qa-screens/2026-08-21-sajda-mushaf-comparison/mobile-dark.png`

## Gaps Found Before Implementation

- Reading mode switching was incomplete in the Mushaf toolbar: the app had a dedicated Mushaf route and Surah route, but no in-reader Sajda-like mode switch.
- Selected ayah translation was already present in the bottom sheet, but direct opening via `/mushaf/<page>?ayah=s:a` and jump-to-ayah workflow were missing.
- Tajweed was always visually present in the QCF/Tajweed font; the user could not turn coloring off from Mushaf mode.
- Ayah actions had copy text, image editor, bookmark, audio, tafsir, and open ayah, but no explicit copy-link action.
- Page number jump existed. Jump to a concrete ayah from Mushaf mode was missing.
- Last position was saved for Surah reading, but not as a Mushaf page/ayah position.
- Continue did not consistently return to the last Mushaf page/ayah.
- Offline handling cached same-origin pages/data/assets but did not cache the remote QCF/Tajweed page fonts used by Mushaf pages.
- Page 604 had no completion path to a khatm dua screen.

## Implementation Direction

Keep quran-nurtech's visual language and current QCF layout. Add Sajda-like behavior as small workflow controls and persisted state, without replacing the existing zoom, pan, swipe, immersive mode, or ayah sheet architecture.
