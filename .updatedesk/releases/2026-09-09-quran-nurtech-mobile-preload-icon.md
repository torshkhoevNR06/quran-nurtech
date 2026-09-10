project: quran-nurtech
public: true
type: fix
audience: users
title: Убрана лишняя подгрузка из мобильной шапки
summary: На мобильных экранах статус подгрузки больше не перекрывает меню мусхафа.
user_impact: Верхняя шапка не содержит дублирующую надпись или индикатор подгрузки. В последнем пункте меню остается компактная кнопка с иконкой. Десктопная версия не изменена.
screenshots:
  - qa-screens/2026-09-09-mushaf-qcf-fixes-after/mobile-preload-menu-final.png
checks:
  - git diff --check
  - Playwright mobile 390x844: header preload hidden, menu action label hidden, icon visible
  - Desktop styles remain outside the mobile media query
deploy_url: http://127.0.0.1:4321/mushaf/76
