---
project: quran-nurtech
public: true
type: fix
audience: users
title: Mobile fullscreen Mushaf alignment
summary: The mobile fullscreen Mushaf layout now keeps Arabic lines inside the readable area and moves the page number away from the close button.
user_impact:
  - Arabic text no longer appears clipped on the left edge in smartphone fullscreen reading.
  - Page numbers stay visible without overlapping the fullscreen close control.
  - Fullscreen reading remains clean, without extra panels or horizontal overflow.
screenshots:
  - qa-screens/mushaf-mobile-fullscreen-align-360-p28.png
  - qa-screens/mushaf-mobile-fullscreen-align-390-p28.png
  - qa-screens/mushaf-mobile-fullscreen-align-390-p57.png
  - qa-screens/mushaf-mobile-fullscreen-align-414-p44.png
checks:
  - git diff --check
  - Playwright mobile fullscreen checks at 360x740, 390x844 and 414x896
  - Verified no horizontal overflow and no page-number/close-button overlap
deploy_url: http://127.0.0.1:4321/mushaf/28
---

Notes for editor:
- Scope: smartphone fullscreen Mushaf only.
- The Quran text data is unchanged; this is a layout alignment fix.
