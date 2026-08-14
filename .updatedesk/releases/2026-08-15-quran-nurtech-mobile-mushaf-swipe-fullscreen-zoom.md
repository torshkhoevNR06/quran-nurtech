---
project: quran-nurtech
public: true
type: fix
audience: users
title: Mobile Mushaf swipe, fullscreen and zoom controls
summary: Mobile Mushaf reading is more stable: swipe previews now show the next page, fullscreen exits back to the same page size, and zoom controls are horizontal on phones.
user_impact:
  - Readers can swipe between Mushaf pages and see the neighboring page during the gesture.
  - Exiting fullscreen no longer leaves the Mushaf in a temporary squeezed or shifted layout.
  - The mobile bottom controls are aligned edge-to-edge with balanced spacing and no right-side gap.
  - Zoomed Mushaf pages stay inside the phone viewport and scroll vertically instead of cutting text horizontally.
screenshots:
  - qa-screens/mushaf-mobile-360x740-post-fix.png
  - qa-screens/mushaf-mobile-390x844-post-fix.png
  - qa-screens/mushaf-mobile-414x896-post-fix.png
  - qa-screens/mushaf-mobile-dark-p28-swipe-peek.png
  - qa-screens/mushaf-mobile-fullscreen-p28-post-fix.png
  - qa-screens/mushaf-mobile-after-fullscreen-exit-post-fix.png
  - qa-screens/mushaf-mobile-p44-zoomed-post-fix-v2.png
checks:
  - git diff --check
  - Playwright mobile visual checks at 360x740, 390x844 and 414x896
  - Playwright fullscreen enter/exit check on Mushaf page 28
  - Playwright swipe-preview check on Mushaf page 28
  - Playwright zoomed reflow check on Mushaf page 44
  - npm.cmd run build failed on existing Windows static route issue: ENOENT creating dist/1:1
deploy_url: http://127.0.0.1:4321/mushaf/28
---

Notes for editor:
- Scope: mobile Mushaf layout, swipe preview, fullscreen settle, and floating zoom controls.
- Risk: Arabic line balancing remains handled by the existing Mushaf renderer; this card covers the mobile container and interaction regressions.
