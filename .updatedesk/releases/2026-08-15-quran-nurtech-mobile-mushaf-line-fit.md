project: quran-nurtech
public: false
type: fix
audience: team
title: Stabilize mobile Mushaf swipes and page geometry
summary: Stabilized mobile Mushaf rendering across swipes, loading, fullscreen transitions, and zoom. All mobile pages now share one typography baseline, 100% is tuned to the readable 390px/430px mobile proportions, and horizontal page swipes preserve the selected zoom while vertical drags scroll the current page.
user_impact: Quran pages no longer change text size from one page to another. Readers can swipe to the next page at any zoom level, keep their chosen percentage, scroll enlarged text with a finger, see a centered skeleton locked to the same sheet height while the destination font loads, and dismiss mobile sheets with a downward swipe.
screenshots:
  - qa-screens/mushaf-mobile-final-reader-p504-390.png
  - qa-screens/mushaf-mobile-final-fullscreen-p504-390.png
  - qa-screens/mushaf-mobile-swipe-controls-p42-430.png
  - qa-screens/mushaf-mobile-fullscreen-swipe-p43-320.png
  - qa-screens/mushaf-mobile-swipe-skeleton-p411-390.png
  - qa-screens/mushaf-mobile-preload-status-p69-390.png
  - qa-screens/mushaf-mobile-zoom-110-p69-390.png
  - qa-screens/mushaf-mobile-stable-fullscreen-p600-390.png
  - qa-screens/mobile-real-swipe-pending-29-visible-skeleton.png
  - qa-screens/mobile-settings-scrollbar-fixed.png
  - qa-screens/mobile-settings-scrollbar-track-fixed.png
  - qa-screens/mobile-settings-scrollbar-body-inset.png
  - qa-screens/mobile-settings-handle-matched.png
  - qa-screens/mobile-settings-handle-integrated.png
  - qa-screens/mobile-ayah-sheet-bookmark-on.png
  - qa-screens/mobile-ayah-sheet-states.png
  - qa-screens/mobile-ayah-sheet-dark-bookmark-on.png
checks:
  - Mobile browser checks at 360px, 390px, and 430px
  - Pages 502, 504, 597, 598, and 600 checked in reader and fullscreen modes
  - Repeated page-return and fullscreen enter/exit geometry checks
  - Real pointer drag checks in reader and fullscreen modes
  - Immediate destination skeleton verified before the page font completed
  - Repeated 307 -> 308 -> 307 -> 308 metrics stayed identical per page
  - Browser console remained free of swipe and aria-hidden warnings
  - Toolbar checked without overflow at 320px, 390px, and 430px
  - Zoom checked at 100%, 110%, 120%, and 130% on pages 59, 69, and 502
  - Skeleton page height stayed identical before, during, and after page loading
  - Preload status verified above both zoom controls and the bottom toolbar
  - Fullscreen pages 91 and 92 verified with the same 0.7200 fit and 16.9641px rendered font size
  - Intermediate loading geometry verified hidden until two final animation frames completed
  - 300% mobile zoom drag moved the reader from scrollTop 0 to 340 without using the scrollbar
  - Fullscreen close control verified above the page with a 12px safe gap
  - Pages 1, 2, 76, 78, 304, 504, and 600 verified at 390px with the same 0.7200 fit, 17.1966px font size, and 656px sheet height
  - Page edges checked at 320px, 390px, and 430px with zero clipped word boxes and zero horizontal viewport overflow
  - Zoomed swipe 77 -> 78 preserved 130% and the same 22.3555px font size
  - Vertical drag at 130% scrolled the page while horizontal drag changed the page
  - Fullscreen swipe 601 -> 602 preserved the final 0.7200 fit and 20.34px font size
  - Swipe preview min/max height locked to the source sheet so mobile reflow cannot stretch the skeleton
  - Browser console remained empty after reader and fullscreen swipe checks
  - Horizontal overflow and line transform checks
  - npm.cmd run prebuild
  - git diff --check
  - Mobile 100% baseline retuned to match the previously preferred 390px/120% and 430px/110% proportions
  - Mobile swipe placeholder no longer resets qcf-fit before the destination font is ready
  - Pending skeleton height locked to the stable mobile reader height instead of the temporary page content height
  - Delayed real swipe 28 -> 29 verified a visible 12-line skeleton, 656px pending sheet height, 654px skeleton height, and 0px center delta
  - Mobile settings and drawer scrollbars checked with transparent tracks and neutral thin thumbs
  - Settings scrollbar track now uses the panel background color, with hidden WebKit scrollbar buttons and transparent track-piece cleanup
  - Settings panel scrolling moved from the rounded outer sheet to the inner body, so the scrollbar starts below the header and no longer enters the rounded corner
  - Settings sheet drag handle matched to the other mobile sheet handle: static 36x4 indicator, no sticky line
  - Swipe-down close verified for the drawer, settings panel, and Mushaf ayah sheet
  - Settings sheet handle verified inside the sheet header background without a separate dark strip
  - Mushaf ayah sheet opens from mobile tap on Quran text and closes with a downward touch drag
  - Ayah bookmark action verified: gold active state, q_bookmarks persistence, and repeat-click removal
  - Ayah listen action verified through audio state events: active fill appears on play and clears on stop
  - Mobile screenshots captured for settings handle and ayah action states
  - Dark-theme ayah action buttons verified: inactive icons stay muted gray after tap, bookmark active state is gold, copy shows temporary "Скопировано" feedback, and Tafsir toggles on/off
  - Ayah sheet downward dismiss now verified with real TouchEvent flow: touchmove updates drag offset and touchend closes the sheet
  - Ayah sheet single-pull dismiss verified from both handle and title zones with a 48px downward gesture
  - npm.cmd run build (route generation completed; existing Windows failure on the colon route dist/1:1)
deploy_url: http://127.0.0.1:4321/mushaf/504
