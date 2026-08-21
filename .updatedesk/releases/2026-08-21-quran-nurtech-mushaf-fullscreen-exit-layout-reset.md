---
project: quran-nurtech
public: true
type: fix
audience: users
title: Исправлен выход из fullscreen мусхафа
summary: После выхода из полноэкранного режима мусхаф снова возвращается к обычной мобильной геометрии строк без наложения аятов.
user_impact:
  - Аяты больше не накладываются друг на друга после входа и выхода из режима чтения.
  - Обычный мобильный размер QCF-страницы корректно восстанавливается после fullscreen.
  - Повторные входы и выходы не накапливают неверный масштаб.
screenshots:
  - qa-screens/2026-08-21-mushaf-immersive-exit-reset/p67-dom-after.png
  - qa-screens/2026-08-21-mushaf-immersive-exit-reset/p67-after-fixed-dom.png
  - qa-screens/2026-08-21-mushaf-immersive-exit-reset/dom-390x844-p67-system-2toggles.png
  - qa-screens/2026-08-21-mushaf-immersive-exit-reset/dom-390x844-p67-dark-2toggles.png
  - qa-screens/2026-08-21-mushaf-immersive-exit-reset/dom-320x740-p67-system-1toggles.png
  - qa-screens/2026-08-21-mushaf-immersive-exit-reset/dom-430x932-p67-system-1toggles.png
checks:
  - Reproduced page 67 fullscreen exit leak where --mushaf-qcf-fit stayed 0.8200 after exit
  - Verified page 67 after exit returns --mushaf-qcf-fit to 0.7200 and has no line overlaps
  - Verified two fullscreen enter/exit cycles on page 67 at 390x844 in system and dark themes
  - Verified page 67 at 320x740 and 430x932 after fullscreen exit has no overlaps or overflow
  - Verified pages 57 and 2 after fullscreen exit have no overlaps or overflow
deploy_url: http://127.0.0.1:4321/mushaf/67
---

Notes for editor:
- What changed: mobile reader QCF fit is reset when leaving immersive mode and guarded in normal mobile line fitting.
- Where to verify: open /mushaf/67 on mobile, enter fullscreen, exit, and confirm the ayah lines remain separated.
- Risks: browser mouse automation in mobile emulation does not trigger the fullscreen toggle reliably, so release QA should also tap the real button on device.
