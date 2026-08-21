// @ts-nocheck
// Мушаф: QCF layout sizing, zoom/pan, immersive mode and page navigation.
(function () {
  if (!/firefox/i.test(navigator.userAgent)) return;
  document.querySelectorAll('[data-mushaf-page]').forEach(function (page) {
    page.setAttribute('data-mushaf-firefox', '1');
  });
})();

(function () {
  if (document.body.getAttribute('data-page-mode') !== 'mushaf') return;

  var root = document.documentElement;
  var body = document.body;
  var reader = document.querySelector('.mushaf-reader');
  var sheet = document.querySelector('.mushaf-sheet');
  var toolbar = document.querySelector('.mushaf-toolbar');
  var pageEl = document.querySelector('.qcf-page');
  var range = document.querySelector('[data-mushaf-zoom-range]');
  var fitEls = document.querySelectorAll('[data-mushaf-fit]');
  var ZOOM_KEY = 'q_mushaf_zoom';
  var STATE_KEY = 'q_mushaf_zoom_state';
  var IMM_KEY = 'q_mushaf_reader';
  var LAST_KEY = 'q_mushaf_last';
  var STYLE_KEY = 'q_mushaf_style';
  var TAJWEED_KEY = 'q_mushaf_tajweed';
  var PAGE_RATIO = 0.704;
  var MOBILE_QCF_FIT = 0.72;
  var MOBILE_IMMERSIVE_QCF_FIT = 0.82;
  var MIN_SCALE = 1;
  var MAX_SCALE = 3;
  var scale = 1;
  var panX = 0;
  var panY = 0;
  var fitTimer = 0;
  var resizeLayoutFrame = 0;
  var jumpTimer = 0;
  var pageLoadToken = 0;
  var fontLoadToken = 0;
  var pageCache = {};
  var fontPreloadCache = {};
  var mobilePageFitCache = {};
  var allPreloadState = { running: false, done: false, total: 0, completed: 0, failed: 0, loadedBytes: 0, totalBytes: 0 };
  var allPreloadStatusTimer = 0;
  var activePage = currentPage();
  var lastImmersiveNavAt = 0;
  var swipeNavigating = false;
  var qcfVersesPromise = null;
  var lastToolEventAt = 0;

  function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
  }

  function currentPage() {
    return parseInt((location.pathname.match(/\/mushaf\/(\d+)/) || [])[1], 10) || 1;
  }

  function formatMb(bytes) {
    return (Math.max(0, bytes || 0) / 1024 / 1024).toFixed(2).replace('.', ',') + ' МБ';
  }

  function resetMobileReaderFit() {
    root.style.setProperty('--mushaf-qcf-fit', MOBILE_QCF_FIT.toFixed(4));
  }

  function estimatePreloadBytes(type) {
    if (type === 'font') return 110 * 1024;
    if (type === 'surah') return 42 * 1024;
    return 70 * 1024;
  }

  function cssFontName(name) {
    return '"' + String(name || '').replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';
  }

  function getActiveMushafFont(page) {
    var el = page || pageEl;
    if (!el) return '';
    var computed = getComputedStyle(el).getPropertyValue('--mushaf-page-font').trim();
    return computed.replace(/^['"]|['"]$/g, '') || el.getAttribute('data-mushaf-font-family') || '';
  }

  function setFontLoading(loading) {
    if (!pageEl) return;
    pageEl.classList.toggle('is-font-loading', !!loading);
    body.classList.toggle('mushaf-font-loading', !!loading);
    root.classList.toggle('mushaf-font-loading', !!loading);
  }

  function revealMushafPage() {
    if (sheet) {
      sheet.classList.remove('is-page-pending');
      sheet.style.removeProperty('--mushaf-pending-height');
    }
    // Resolve the final sheet geometry while Quran lines are still hidden.
    // This prevents the pending-height lock from triggering a visible refit.
    layoutMushaf(null);
    if (isMobileViewport() && !isImmersive()) {
      // Measure the canonical 15-line page at its real 100% geometry while it
      // is still hidden, then use that stable fit as the zoom baseline.
      body.classList.remove('mushaf-mobile-reflow-zoom');
      fitMobilePage();
      root.style.setProperty('--mushaf-mobile-zoom-fit', getComputedStyle(root).getPropertyValue('--mushaf-qcf-fit').trim() || '1');
      body.classList.add('mushaf-mobile-reflow-zoom');
      fitQcfLines(true);
    } else {
      fitQcfLines(true);
    }
    if (pageEl) pageEl.offsetWidth;
    var revealPage = String(pageEl?.getAttribute('data-mushaf-page') || activePage);
    // Keep the skeleton for two paint frames after the final font metrics and
    // geometry are applied. Quran text is never exposed at the temporary fit.
    return new Promise(function (resolve) {
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          if (!pageEl || String(pageEl.getAttribute('data-mushaf-page')) !== revealPage || String(activePage) !== revealPage) {
            resolve(false);
            return;
          }
          setFontLoading(false);
          resolve(true);
        });
      });
    });
  }

  function syncViewportHeight() {
    var vv = window.visualViewport;
    var height = Math.max(360, Math.floor((vv && vv.height) || window.innerHeight || 0));
    root.style.setProperty('--mushaf-vvh', height + 'px');
  }

  function px(value) {
    return parseFloat(value || '0') || 0;
  }

  function safeInset(name) {
    var probe = document.createElement('div');
    probe.style.cssText = 'position:absolute;visibility:hidden;pointer-events:none;' + name + ':env(safe-area-inset-' + name + ');';
    document.body.appendChild(probe);
    var value = px(getComputedStyle(probe).getPropertyValue(name));
    probe.remove();
    return value;
  }

  function nonImmersivePageWidth(isMobile) {
    var vw = Math.max(320, window.innerWidth || 0);
    var vh = Math.max(360, window.innerHeight || 0);
    var reservedWidth = isMobile ? 56 : 88;
    var reservedHeight = isMobile ? 152 : vw >= 900 ? 225 : 246;
    var widthSpace = Math.max(1, vw - safeInset('left') - safeInset('right') - reservedWidth);
    if (isMobile) return Math.floor(Math.min(Math.max(1, vw - safeInset('left') - safeInset('right') - 6), 620));
    var heightSpace = Math.max(1, vh - reservedHeight);
    var maxPageWidth = isMobile ? 620 : 760;
    return Math.floor(Math.min(widthSpace, heightSpace * PAGE_RATIO, maxPageWidth));
  }

  function isMobileViewport() {
    return window.matchMedia('(max-width: 650px)').matches;
  }

  function mobileReaderBaseScale() {
    var vw = Math.max(320, Math.min(520, window.innerWidth || 0));
    if (vw <= 390) return 1.55;
    if (vw <= 430) return 1.55 - ((vw - 390) / 40) * 0.12;
    if (vw <= 480) return 1.43 - ((vw - 430) / 50) * 0.07;
    return 1.36;
  }

  function stableMobileSheetHeight() {
    if (!reader) return 0;
    var style = getComputedStyle(reader);
    var verticalChrome = px(style.paddingTop) + px(style.paddingBottom);
    return Math.max(360, Math.floor(reader.clientHeight - verticalChrome));
  }

  function preserveCenter() {
    if (!reader) return null;
    return {
      x: (reader.scrollLeft + reader.clientWidth / 2) / Math.max(1, reader.scrollWidth),
      y: (reader.scrollTop + reader.clientHeight / 2) / Math.max(1, reader.scrollHeight),
    };
  }

  function restoreCenter(center) {
    if (!reader || !center) return;
    requestAnimationFrame(function () {
      reader.scrollLeft = center.x * reader.scrollWidth - reader.clientWidth / 2;
      reader.scrollTop = center.y * reader.scrollHeight - reader.clientHeight / 2;
    });
  }

  function scrollZoomToStart() {
    if (!reader) return;
    var sync = function () {
      reader.scrollLeft = 0;
      reader.scrollTop = 0;
    };
    requestAnimationFrame(function () {
      sync();
      requestAnimationFrame(function () {
        sync();
        window.setTimeout(sync, 80);
        window.setTimeout(sync, 220);
      });
    });
  }

  function layoutMushaf(center) {
    if (!reader || !sheet) return;
    syncViewportHeight();
    var isMobile = isMobileViewport();
    var isImmersive = body.classList.contains('mushaf-immersive');
    var pageWidth = nonImmersivePageWidth(isMobile);
    if (isImmersive) {
      var style = getComputedStyle(reader);
      var horizontalChrome = px(style.paddingLeft) + px(style.paddingRight);
      var verticalChrome = px(style.paddingTop) + px(style.paddingBottom);
      var widthSpace = Math.max(1, reader.clientWidth - horizontalChrome - 2);
      var heightSpace = Math.max(1, reader.clientHeight - verticalChrome - 2);
      pageWidth = Math.floor(isMobile ? widthSpace : Math.min(widthSpace, heightSpace * PAGE_RATIO, 920));
    }
    pageWidth = Math.max(1, pageWidth);

    root.style.setProperty('--mushaf-page-w', pageWidth + 'px');
    body.style.setProperty('--mushaf-page-w', pageWidth + 'px');
    if (isMobile && !isImmersive) {
      var mobileSheetHeight = stableMobileSheetHeight();
      root.style.setProperty('--mushaf-mobile-sheet-h', mobileSheetHeight + 'px');
      body.style.setProperty('--mushaf-mobile-sheet-h', mobileSheetHeight + 'px');
    } else {
      root.style.removeProperty('--mushaf-mobile-sheet-h');
      body.style.removeProperty('--mushaf-mobile-sheet-h');
    }
    var qcfRatio = isImmersive && isMobile ? 0.066 : isMobile ? 0.052 : 0.052;
    var qcfMin = isMobile ? 12.5 : 20;
    var qcfMax = isImmersive && isMobile ? 34 : isMobile ? 29 : 44;
    root.style.setProperty('--mushaf-qcf-size', clamp(pageWidth * qcfRatio, qcfMin, qcfMax).toFixed(2) + 'px');
    applyZoom();
    scheduleLineFit();
    if (isImmersive) {
      reader.scrollLeft = 0;
      reader.scrollTop = 0;
      return;
    }
    restoreCenter(center);
  }

  function measureLineContentBounds(line) {
    var items = line.querySelectorAll('.qcf-word, .qcf-surah-title, .qcf-basmala');
    if (!items.length) return { left: 0, right: 0, width: 0 };
    var min = Infinity;
    var max = -Infinity;
    for (var i = 0; i < items.length; i++) {
      var r = items[i].getBoundingClientRect();
      min = Math.min(min, r.left);
      max = Math.max(max, r.right);
    }
    return { left: min, right: max, width: Math.max(0, max - min) };
  }

  function measureLineNaturalWidth(line) {
    var clone = line.cloneNode(true);
    clone.setAttribute('aria-hidden', 'true');
    clone.style.setProperty('position', 'fixed', 'important');
    clone.style.setProperty('inset', '0 auto auto -10000px', 'important');
    clone.style.setProperty('width', 'max-content', 'important');
    clone.style.setProperty('max-width', 'none', 'important');
    clone.style.setProperty('min-width', '0', 'important');
    clone.style.setProperty('left', '0', 'important');
    clone.style.setProperty('margin', '0', 'important');
    clone.style.setProperty('visibility', 'hidden', 'important');
    clone.style.setProperty('pointer-events', 'none', 'important');
    clone.style.setProperty('transform', 'none', 'important');
    clone.style.setProperty('--qcf-line-scale', '1');
    clone.style.setProperty('--qcf-line-shift', '0px');
    (pageEl || document.body).appendChild(clone);
    var bounds = measureLineContentBounds(clone);
    var width = bounds.width || clone.scrollWidth || clone.getBoundingClientRect().width || 0;
    clone.remove();
    return width;
  }

  function syncLineTargetWidth() {
    if (!pageEl) return 0;
    var lines = pageEl.querySelectorAll('.qcf-line:not(.is-empty):not(.qcf-line-deco):not(.center)');
    var widths = [];
    for (var i = 0; i < lines.length; i++) {
      widths.push(measureLineNaturalWidth(lines[i]));
    }
    widths.sort(function (a, b) { return a - b; });
    var available = Math.max(1, pageEl.clientWidth - 4);
    var median = widths.length ? widths[Math.floor(widths.length * 0.62)] : available;
    var maxNatural = widths.length ? widths[widths.length - 1] : available;
    var target = Math.min(available, Math.max(median, Math.min(maxNatural, available * 0.96)));
    if (isMobileViewport() && isImmersive()) {
      target = Math.max(1, pageEl.clientWidth - 18);
    } else if (isMobileViewport() && !isImmersive() && scale <= 1.001) {
      target = Math.max(1, pageEl.clientWidth - 8);
    }
    if (target > 0) root.style.setProperty('--mushaf-line-w', target + 'px');
    return target;
  }

  function applyLineScales(target) {
    if (!pageEl || !target) return;
    var isMobile = isMobileViewport();
    if (scale > 1.001 && !isImmersive()) return;
    // Mobile Mushaf lines use the full readable measure. Keep the scale bounded,
    // then let the overflow guard below compress only glyphs that truly exceed it.
    var immersiveMobile = isMobile && isImmersive();
    var normalMobile = isMobile && !isImmersive() && scale <= 1.001;
    var regularPage = pageEl.getAttribute('data-mushaf-compact') !== '1' && !pageEl.hasAttribute('data-mushaf-compact-section');
    var maxStretch = immersiveMobile ? 1.12 : normalMobile ? 1 : isMobile ? 1.08 : 1.1;
    var minCompress = immersiveMobile ? 0.86 : normalMobile ? 0.68 : isMobile ? 0.88 : 0.91;
    var lineSelector = regularPage
      ? '.qcf-line:not(.is-empty):not(.qcf-line-deco)'
      : '.qcf-line:not(.is-empty):not(.qcf-line-deco):not(.center)';
    var lines = pageEl.querySelectorAll(lineSelector);
    var pageRect = pageEl.getBoundingClientRect();
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];
      line.style.setProperty('--qcf-line-shift', '0px');
      line.offsetWidth;
      var natural = Math.max(1, measureLineNaturalWidth(line));
      var scaleLine;
      if (normalMobile) {
        line.style.setProperty('--qcf-line-scale', '1');
        line.offsetWidth;
        var mobileNatural = natural;
        var mobileSafeWidth = Math.max(1, pageEl.clientWidth - 12);
        var mobileDesiredWidth = Math.max(1, pageEl.clientWidth - 28);
        scaleLine = mobileNatural > mobileSafeWidth ? mobileSafeWidth / mobileNatural : Math.min(1, mobileDesiredWidth / mobileNatural);
        scaleLine = clamp(scaleLine, minCompress, 1);
        line.style.setProperty('--qcf-line-scale', scaleLine.toFixed(4));
        line.style.setProperty('--qcf-line-shift', '0px');
        if (regularPage) line.style.justifyContent = 'center';
        else line.style.removeProperty('justify-content');
        continue;
      } else {
        scaleLine = clamp(target / natural, minCompress, maxStretch);
        var visualWidth = natural * scaleLine;
        if (visualWidth > pageEl.clientWidth - 4) {
          scaleLine = Math.min(scaleLine, (pageEl.clientWidth - 4) / natural);
        }
      }
      line.style.setProperty('--qcf-line-scale', scaleLine.toFixed(4));
      if (!normalMobile) {
        var bounds = measureLineContentBounds(line);
        var overLeft = Math.max(0, pageRect.left + 2 - bounds.left);
        var overRight = Math.max(0, bounds.right - pageRect.right + 2);
        if (overLeft > 0 || overRight > 0) {
          var safeWidth = Math.max(1, bounds.width - overLeft - overRight - 4);
          scaleLine = Math.max(0.72, scaleLine * (safeWidth / Math.max(1, bounds.width)));
        }
      }
      line.style.setProperty('--qcf-line-scale', scaleLine.toFixed(4));
      line.offsetWidth;
      var finalBounds = measureLineContentBounds(line);
      if (normalMobile && regularPage && finalBounds.width > 0) {
        var normalMobileSafeWidth = Math.max(1, pageEl.clientWidth - 10);
        if (finalBounds.width > normalMobileSafeWidth) {
          scaleLine = Math.max(minCompress, scaleLine * (normalMobileSafeWidth / finalBounds.width));
          line.style.setProperty('--qcf-line-scale', scaleLine.toFixed(4));
          line.offsetWidth;
          finalBounds = measureLineContentBounds(line);
        }
      }
      line.style.setProperty('--qcf-line-shift', '0px');
      var normalMobileRegular =
        normalMobile &&
        pageEl &&
        pageEl.getAttribute('data-mushaf-compact') !== '1' &&
        !pageEl.hasAttribute('data-mushaf-compact-section');
      if (normalMobileRegular) line.style.justifyContent = 'center';
      else line.style.removeProperty('justify-content');
    }
  }

  function fitMobilePage() {
    if (!pageEl) return;
    var lines = pageEl.querySelectorAll('.qcf-line:not(.is-empty):not(.qcf-line-deco)');
    if (!lines.length) return;

    for (var i = 0; i < lines.length; i++) {
      lines[i].style.setProperty('--qcf-line-scale', '1');
      lines[i].style.setProperty('--qcf-line-shift', '0px');
    }

    // QCF data already contains the canonical 15 Mushaf lines. Every mobile
    // page shares one safe font baseline; page content must never make the
    // same user zoom percentage render at a different physical size.
    var fitKey = [
      pageEl.clientWidth,
      getActiveMushafFont(pageEl),
      getComputedStyle(root).getPropertyValue('--mushaf-qcf-size').trim(),
      isImmersive() ? 'immersive' : 'reader',
    ].join(':');
    if (mobilePageFitCache[fitKey]) {
      root.style.setProperty('--mushaf-qcf-fit', mobilePageFitCache[fitKey]);
      return;
    }

    root.style.setProperty('--mushaf-qcf-fit', '1');
    pageEl.offsetWidth;

    var pageFit = (isImmersive() ? MOBILE_IMMERSIVE_QCF_FIT : MOBILE_QCF_FIT).toFixed(4);
    mobilePageFitCache[fitKey] = pageFit;
    root.style.setProperty('--mushaf-qcf-fit', pageFit);
  }

  function fitQcfLines(force) {
    if (!pageEl) return;
    if (pageEl.classList.contains('is-font-loading') && !force) return;
    if (isMobileViewport() && isImmersive()) {
      fitMobilePage();
      for (var immersivePass = 0; immersivePass < 2; immersivePass++) {
        applyLineScales(syncLineTargetWidth());
        pageEl.offsetWidth;
      }
      return;
    }
    if (isMobileViewport() && !isImmersive()) {
      if (scale > 1.001) return;
      resetMobileReaderFit();
      if (scale <= 1.001) {
        for (var mobilePass = 0; mobilePass < 2; mobilePass++) {
          applyLineScales(syncLineTargetWidth());
          pageEl.offsetWidth;
        }
      }
      return;
    }
    root.style.setProperty('--mushaf-qcf-fit', '1');
    for (var pass = 0; pass < 2; pass++) {
      var targetWidth = syncLineTargetWidth();
      applyLineScales(targetWidth);
      pageEl.offsetWidth;
    }
  }

  function scheduleLineFit() {
    window.clearTimeout(fitTimer);
    fitTimer = window.setTimeout(function () {
      requestAnimationFrame(function () {
        layoutMushaf(null);
        requestAnimationFrame(function () {
          fitQcfLines();
          window.setTimeout(function () {
            fitQcfLines();
          }, 80);
        });
      });
    }, 0);
  }

  function scheduleViewportLayout() {
    if (resizeLayoutFrame) cancelAnimationFrame(resizeLayoutFrame);
    resizeLayoutFrame = requestAnimationFrame(function () {
      resizeLayoutFrame = 0;
      layoutMushaf(preserveCenter());
    });
  }

  function settleMushafLayout(center) {
    requestAnimationFrame(function () {
      layoutMushaf(center || null);
      fitQcfLines();
      requestAnimationFrame(function () {
        layoutMushaf(null);
        fitQcfLines();
        window.setTimeout(function () {
          layoutMushaf(null);
          fitQcfLines();
        }, 120);
      });
    });
  }

  // --- Zoom (scales the whole paper frame, not just text inside it) ---
  function clampPan() {
    if (!pageEl) return;
    var w = pageEl.clientWidth;
    var h = pageEl.clientHeight;
    panX = clamp(panX, w * (1 - scale), 0);
    panY = clamp(panY, h * (1 - scale), 0);
  }

  function updateZoomUi() {
    var pct = Math.round(scale * 100);
    if (range) range.value = String(pct);
    for (var i = 0; i < fitEls.length; i++) fitEls[i].textContent = pct + '%';
  }

  function saveViewState() {
    try {
      localStorage.setItem(ZOOM_KEY, String(scale));
      localStorage.setItem(STATE_KEY, JSON.stringify({ page: activePage, scale: scale, panX: panX, panY: panY }));
    } catch (e) {}
  }

  function applyZoom() {
    root.style.setProperty('--mushaf-page-zoom', scale.toFixed(4));
    root.style.setProperty('--mushaf-mobile-reader-base', mobileReaderBaseScale().toFixed(4));
    root.style.setProperty('--mushaf-zoom-top-pad', clamp(scale * 12, 18, 44).toFixed(1) + 'px');
    var mobileReader = isMobileViewport() && !isImmersive();
    body.classList.toggle('mushaf-mobile-reflow-zoom', mobileReader);
    if (scale <= 1.001) {
      if (!mobileReader) root.style.removeProperty('--mushaf-mobile-zoom-fit');
      panX = 0;
      panY = 0;
      if (pageEl) {
        pageEl.style.transform = '';
        pageEl.style.transformOrigin = '';
        pageEl.style.willChange = '';
      }
      body.classList.remove('mushaf-zoomed');
    } else {
      if (pageEl) {
        pageEl.style.transform = '';
        pageEl.style.transformOrigin = '';
        pageEl.style.willChange = '';
      }
      body.classList.add('mushaf-zoomed');
    }
    updateZoomUi();
    scheduleLineFit();
  }

  function setScale(next, focalX, focalY, keepCenter) {
    var oldS = scale;
    var newS = clamp(next, MIN_SCALE, MAX_SCALE);
    if (Math.abs(newS - oldS) < 0.0005) {
      if (keepCenter) layoutMushaf(preserveCenter());
      return;
    }
    var center = preserveCenter();
    if (isMobileViewport() && oldS <= 1.001 && newS > 1.001 && !isImmersive()) {
      root.style.setProperty('--mushaf-mobile-zoom-fit', getComputedStyle(root).getPropertyValue('--mushaf-qcf-fit').trim() || '1');
    }
    scale = newS;
    applyZoom();
    if (newS > 1.001) scrollZoomToStart();
    else restoreCenter(center);
    saveViewState();
  }

  function sheetCenter() {
    if (!sheet) return null;
    var r = sheet.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }

  function zoomBy(deltaPercent) {
    var c = sheetCenter();
    setScale(scale + deltaPercent / 100, c && c.x, c && c.y);
  }

  function resetZoom() {
    setScale(1);
  }

  function goToPage(page) {
    var next = clamp(parseInt(page, 10) || 1, 1, 604);
    if (next === activePage) return;
    navigateMushafPage(next);
  }

  function isImmersive() {
    return body.classList.contains('mushaf-immersive');
  }

  function findPageFontCss(doc, page) {
    var needle = 'MushafTajweed' + page;
    var styles = doc.querySelectorAll('style');
    for (var i = 0; i < styles.length; i++) {
      var css = styles[i].textContent || '';
      if (css.indexOf(needle) !== -1) return css;
    }
    return '';
  }

  function setPageLink(link, page, visible) {
    if (!link) return;
    link.classList.toggle('disabled', !visible);
    link.setAttribute('aria-hidden', visible ? 'false' : 'true');
    link.style.display = visible ? '' : 'none';
    if (visible) {
      link.setAttribute('href', '/mushaf/' + page);
    } else {
      link.removeAttribute('href');
    }
  }

  function ensureImmersiveNav(className, sourceSelector) {
    var link = document.querySelector(className);
    if (link || !reader) return link;
    var source = document.querySelector(sourceSelector);
    link = document.createElement('a');
    link.className = 'mushaf-imm-nav ' + className.replace('.', '');
    link.innerHTML = source ? source.innerHTML : '';
    link.setAttribute('aria-label', className.indexOf('prev') !== -1 ? 'Previous page' : 'Next page');
    link.setAttribute('title', className.indexOf('prev') !== -1 ? 'Previous page' : 'Next page');
    reader.insertBefore(link, sheet || null);
    return link;
  }

  function handleImmersivePageNav(event) {
    var pageLink = event.target && event.target.closest && event.target.closest('a[href^="/mushaf/"]');
    if (!pageLink || !isImmersive()) return;
    var match = (pageLink.getAttribute('href') || '').match(/\/mushaf\/(\d+)/);
    if (!match) return;
    if (event.type === 'click' && Date.now() - lastImmersiveNavAt < 1500) {
      event.preventDefault();
      event.stopImmediatePropagation();
      return;
    }
    if (event.type === 'pointerup') {
      if (event.button != null && event.button !== 0) return;
      lastImmersiveNavAt = Date.now();
    }
    event.preventDefault();
    event.stopImmediatePropagation();
    turnAdjacentMushafPage(match[1], { inline: true });
  }

  function bindImmersiveNavLinks() {
    document.querySelectorAll('.mushaf-imm-nav').forEach(function (link) {
      if (link.getAttribute('data-mushaf-inline-nav') === '1') return;
      link.setAttribute('data-mushaf-inline-nav', '1');
      link.addEventListener('pointerup', handleImmersivePageNav, true);
      link.addEventListener('click', handleImmersivePageNav, true);
    });
  }

  function syncPageControls(page) {
    var prev = page > 1 ? page - 1 : null;
    var next = page < 604 ? page + 1 : null;
    document.querySelectorAll('[data-mushaf-jump] input[name="page"]').forEach(function (input) {
      input.value = String(page);
    });

    var groupLinks = document.querySelectorAll('.mushaf-page-group .icon-btn');
    setPageLink(groupLinks[0], prev, !!prev);
    setPageLink(groupLinks[groupLinks.length - 1], next, !!next);

    var prevImm = ensureImmersiveNav('.mushaf-imm-prev', '.mushaf-page-group .icon-btn:first-child');
    var nextImm = ensureImmersiveNav('.mushaf-imm-next', '.mushaf-page-group .icon-btn:last-child');
    setPageLink(prevImm, prev, !!prev);
    setPageLink(nextImm, next, !!next);
    bindImmersiveNavLinks();

    document.querySelectorAll('.mushaf-bottom .btn:first-child').forEach(function (link) {
      setPageLink(link, prev, !!prev);
    });
    document.querySelectorAll('.mushaf-bottom .btn.primary').forEach(function (link) {
      if (next) {
        setPageLink(link, next, true);
        link.innerHTML = 'Вперёд <span class="ui-inline-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"></path></svg></span>';
      } else {
        link.classList.remove('disabled');
        link.setAttribute('aria-hidden', 'false');
        link.style.display = '';
        link.setAttribute('href', '/mushaf/khatm');
        link.innerHTML = 'Дуа хатма <span class="ui-inline-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5a2 2 0 0 1 2-2h6v18H6a2 2 0 0 0-2 2zM20 5a2 2 0 0 0-2-2h-6v18h6a2 2 0 0 1 2 2z"></path></svg></span>';
      }
    });
    document.querySelectorAll('[data-mushaf-preload-all]').forEach(function () {
      updatePreloadButton();
    });
    syncTopbarState(page);
    syncMushafContinue();
  }

  function readJsonStorage(key) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function writeJsonStorage(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {}
  }

  function rememberMushafPosition(page, ayahKey) {
    var value = { page: clamp(parseInt(page, 10) || activePage || 1, 1, 604), ayah: ayahKey || null, at: Date.now() };
    writeJsonStorage(LAST_KEY, value);
    syncMushafContinue();
  }

  function syncMushafContinue() {
    var last = readJsonStorage(LAST_KEY);
    var page = clamp(parseInt(last && last.page, 10) || activePage || 1, 1, 604);
    var href = '/mushaf/' + page + (last && last.ayah ? '?ayah=' + encodeURIComponent(last.ayah) : '');
    document.querySelectorAll('[data-mushaf-continue]').forEach(function (link) {
      link.setAttribute('href', href);
      link.setAttribute('title', 'Продолжить: страница ' + page + (last && last.ayah ? ', аят ' + last.ayah : ''));
    });
    document.querySelectorAll('[data-continue]').forEach(function (link) {
      link.setAttribute('href', href);
      link.setAttribute('title', 'Продолжить мусхаф: страница ' + page);
      link.classList.remove('hide');
      link.removeAttribute('hidden');
    });
  }

  function applyMushafStyle(style) {
    var next = ['classic', 'plain', 'focus'].indexOf(style) >= 0 ? style : 'classic';
    body.setAttribute('data-mushaf-style', next);
    document.querySelectorAll('[data-mushaf-style-cycle]').forEach(function (button) {
      button.setAttribute('data-mushaf-style-current', next);
      button.setAttribute('title', next === 'plain' ? 'Стиль: чистый' : next === 'focus' ? 'Стиль: фокус' : 'Стиль: классический');
    });
  }

  function cycleMushafStyle() {
    var styles = ['classic', 'plain', 'focus'];
    var cur = body.getAttribute('data-mushaf-style') || 'classic';
    var next = styles[(Math.max(0, styles.indexOf(cur)) + 1) % styles.length];
    try {
      localStorage.setItem(STYLE_KEY, next);
    } catch (e) {}
    applyMushafStyle(next);
  }

  function applyMushafTajweed(on) {
    body.classList.toggle('mushaf-tajweed-off', !on);
    document.querySelectorAll('[data-mushaf-tajweed-toggle]').forEach(function (button) {
      button.classList.toggle('off', !on);
      button.setAttribute('aria-pressed', on ? 'true' : 'false');
      button.setAttribute('title', on ? 'Таджвид включен' : 'Таджвид выключен');
    });
  }

  function toggleMushafTajweed() {
    var on = body.classList.contains('mushaf-tajweed-off');
    writeJsonStorage(TAJWEED_KEY, on);
    applyMushafTajweed(on);
  }

  function loadQcfVerses() {
    if (qcfVersesPromise) return qcfVersesPromise;
    qcfVersesPromise = fetch('/data/qcf4/verses.json', { credentials: 'same-origin', cache: 'force-cache' })
      .then(function (response) {
        if (!response.ok) throw new Error('QCF verses ' + response.status);
        return response.json();
      });
    return qcfVersesPromise;
  }

  function openAyahOnCurrentPage(key) {
    if (!key) return;
    window.dispatchEvent(new CustomEvent('quran:mushaf-open-ayah', { detail: { key: String(key) } }));
  }

  function navigateToAyahRef(raw) {
    var match = String(raw || '').trim().match(/^(\d{1,3})\s*[:.,/ ]\s*(\d{1,3})$/);
    if (!match) {
      alert('Введите аят в формате 2:255');
      return;
    }
    var key = parseInt(match[1], 10) + ':' + parseInt(match[2], 10);
    loadQcfVerses()
      .then(function (verses) {
        var hit = verses && verses[key];
        if (!hit || !hit.page) throw new Error('not found');
        var page = clamp(parseInt(hit.page, 10) || 1, 1, 604);
        rememberMushafPosition(page, key);
        if (page === activePage) {
          history.replaceState({ mushafPage: page }, '', '/mushaf/' + page + '?ayah=' + encodeURIComponent(key));
          openAyahOnCurrentPage(key);
          return true;
        }
        return navigateMushafPage(page, { inline: true, ayah: key });
      })
      .catch(function () {
        alert('Аят не найден. Проверьте номер суры и аята.');
      });
  }

  function syncTopbarState(page) {
    var context = document.querySelector('[data-context]');
    if (context) {
      context.innerHTML = '<span class="tc-t"></span><span class="tc-s"></span>';
      var title = context.querySelector('.tc-t');
      var subtitle = context.querySelector('.tc-s');
      if (title) title.textContent = '\u041c\u0443\u0441\u0445\u0430\u0444';
      if (subtitle) subtitle.textContent = '\u0421\u0442\u0440\u0430\u043d\u0438\u0446\u0430 ' + page + ' \u0438\u0437 604';
    }

    var continueBtn = document.querySelector('[data-continue]');
    if (continueBtn) {
      var readpos = readJsonStorage('q_readpos');
      var last = readJsonStorage('q_last');
      var pos = readpos && readpos.s ? readpos : last;
      if (pos && pos.s) {
        continueBtn.setAttribute('href', '/surah/' + pos.s + '#ayah-' + (pos.a || 1));
        continueBtn.setAttribute('title', '\u041f\u0440\u043e\u0434\u043e\u043b\u0436\u0438\u0442\u044c: \u0441\u0443\u0440\u0430 ' + pos.s + ', \u0430\u044f\u0442 ' + (pos.a || 1));
        continueBtn.classList.remove('hide');
        continueBtn.removeAttribute('hidden');
      }
    }
  }

  function waitForPageFont(page, el) {
    var target = el || pageEl;
    var token = ++fontLoadToken;
    setFontLoading(true);
    if (/firefox/i.test(navigator.userAgent) && target) target.setAttribute('data-mushaf-firefox', '1');
    var family = getActiveMushafFont(target) || ('MushafTajweed' + page);
    if (!document.fonts || !document.fonts.load || !family) {
      return Promise.resolve(true);
    }
    var spec = '28px ' + cssFontName(family);
    var sample = target
      ? Array.prototype.map.call(target.querySelectorAll('.qcf-word'), function (word) { return word.textContent || ''; }).join('').slice(0, 48)
      : '';
    return Promise.race([
      document.fonts.load(spec, sample),
      new Promise(function (resolve) {
        window.setTimeout(resolve, 9000);
      }),
    ])
      .catch(function () {})
      .then(function () {
        if (token !== fontLoadToken) return false;
        return document.fonts.ready;
      })
      .then(function () {
        if (token !== fontLoadToken) return false;
        return new Promise(function (resolve) {
          window.setTimeout(function () {
            requestAnimationFrame(function () {
              requestAnimationFrame(function () { resolve(true); });
            });
          }, 120);
        });
      });
  }

  function preloadMushafPage(page) {
    var next = clamp(parseInt(page, 10) || 1, 1, 604);
    var url = '/mushaf/' + next;
    if (pageCache[url]) return;
    fetch(url, { credentials: 'same-origin' })
      .then(function (response) {
        if (!response.ok) return '';
        return response.text();
      })
      .then(function (html) {
        if (html) pageCache[url] = html;
      })
      .catch(function () {});
  }

  function extractFontUrls(html) {
    var urls = [];
    var seen = {};
    String(html || '').replace(/url\(['"]?([^'")]+\.woff2)['"]?\)/g, function (_, url) {
      if (!seen[url]) {
        seen[url] = true;
        urls.push(url);
      }
      return _;
    });
    return urls;
  }

  function updatePreloadStatus(state) {
    var panel = document.querySelector('[data-mushaf-preload-status]');
    if (panel) {
      var title = panel.querySelector('[data-mushaf-preload-title]');
      var detail = panel.querySelector('[data-mushaf-preload-detail]');
      var bar = panel.querySelector('[data-mushaf-preload-bar]');
      panel.hidden = !state || state.hidden;
      if (state && !state.hidden) {
        if (title) title.textContent = state.title || 'Предзагрузка';
        if (detail) detail.textContent = state.detail || '';
        if (bar) bar.style.width = Math.max(0, Math.min(100, state.progress || 0)).toFixed(1) + '%';
        panel.style.setProperty('--mushaf-preload-progress', Math.max(0, Math.min(100, state.progress || 0)).toFixed(1) + '%');
      }
    }
    updateTopbarPreloadIndicator(state);
  }

  function updateTopbarPreloadIndicator(state) {
    var indicator = document.querySelector('[data-mushaf-preload-indicator]');
    if (!indicator) return;
    var hidden = !state || state.hidden;
    indicator.hidden = hidden;
    if (hidden) {
      indicator.classList.remove('is-running', 'is-done', 'is-error', 'is-open');
      body.classList.remove('mushaf-preload-popover-open');
      var toggle = indicator.querySelector('[data-mushaf-preload-popover-toggle]');
      if (toggle) toggle.setAttribute('aria-expanded', 'false');
      return;
    }
    var progress = Math.max(0, Math.min(100, state.progress || 0));
    indicator.classList.toggle('is-running', state.status === 'running');
    indicator.classList.toggle('is-done', state.status === 'done');
    indicator.classList.toggle('is-error', state.status === 'error');
    var topTitle = indicator.querySelector('[data-mushaf-preload-top-title]');
    var topPercent = indicator.querySelector('[data-mushaf-preload-top-percent]');
    var topDetail = indicator.querySelector('[data-mushaf-preload-top-detail]');
    var topSize = indicator.querySelector('[data-mushaf-preload-top-size]');
    var topBar = indicator.querySelector('[data-mushaf-preload-top-bar]');
    if (topTitle) topTitle.textContent = state.title || 'Подгрузка мусхафа';
    if (topPercent) topPercent.textContent = state.status === 'running' && progress > 0 && progress < 1 ? '<1%' : Math.round(progress) + '%';
    if (topDetail) topDetail.textContent = state.detail || '';
    if (topSize) topSize.textContent = state.size || '';
    if (topBar) topBar.style.width = progress.toFixed(1) + '%';
  }

  function updatePreloadButton(state) {
    var nextState = state || (allPreloadState.running ? 'loading' : allPreloadState.done ? 'ready' : allPreloadState.failed ? 'error' : 'idle');
    document.querySelectorAll('[data-mushaf-preload-all]').forEach(function (button) {
      button.classList.toggle('is-loading', nextState === 'loading');
      button.classList.toggle('is-ready', nextState === 'ready');
      button.classList.toggle('is-error', nextState === 'error');
      button.disabled = nextState === 'loading';
      var label = button.querySelector('span:not(.ui-inline-icon)');
      if (!label) return;
      if (nextState === 'loading') label.textContent = 'В фоне';
      else if (nextState === 'ready') label.textContent = 'Готово';
      else if (nextState === 'error') label.textContent = 'Повторить';
      else label.textContent = 'Подгрузить';
    });
  }

  function schedulePreloadStatusUpdate() {
    if (allPreloadStatusTimer) return;
    allPreloadStatusTimer = window.setTimeout(function () {
      allPreloadStatusTimer = 0;
      if (!allPreloadState.running) return;
      var total = Math.max(1, allPreloadState.total || 1);
      var done = Math.min(total, allPreloadState.completed + allPreloadState.failed);
      var taskProgress = (done / total) * 100;
      var byteProgress = allPreloadState.totalBytes ? (allPreloadState.loadedBytes / allPreloadState.totalBytes) * 100 : 0;
      var progress = Math.max(taskProgress, byteProgress);
      var remainingBytes = Math.max(0, (allPreloadState.totalBytes || 0) - (allPreloadState.loadedBytes || 0));
      var detail = done + ' / ' + total + (allPreloadState.failed ? ', ошибок: ' + allPreloadState.failed : '');
      updatePreloadStatus({
        title: 'Фоновая подгрузка',
        detail: detail,
        size: 'Осталось примерно ' + formatMb(remainingBytes),
        progress: progress,
        status: 'running',
      });
    }, 220);
  }

  function waitForIdleSlot() {
    return new Promise(function (resolve) {
      var cb = function () { resolve(); };
      if ('requestIdleCallback' in window) window.requestIdleCallback(cb, { timeout: 900 });
      else window.setTimeout(cb, 24);
    });
  }

  function mushafFontUrl(page) {
    return 'https://verses.quran.foundation/fonts/quran/hafs/v4/colrv1/woff2/p' + page + '.woff2';
  }

  function preloadRouteHtml(url, onProgress) {
    if (url.indexOf('/mushaf/') === 0 && pageCache[url]) return Promise.resolve();
    return trackedFetchText(url, onProgress)
      .then(function (html) {
        if (url.indexOf('/mushaf/') === 0 && html) pageCache[url] = html;
        return html;
      });
  }

  function trackTaskBytes(task, loaded, total) {
    if (total && !task.totalKnown) {
      allPreloadState.totalBytes += total - (task.estimatedBytes || 0);
      task.totalBytes = total;
      task.totalKnown = true;
    }
    var nextLoaded = Math.max(task.loadedBytes || 0, loaded || 0);
    var delta = nextLoaded - (task.loadedBytes || 0);
    if (delta > 0) {
      task.loadedBytes = nextLoaded;
      allPreloadState.loadedBytes += delta;
    }
    schedulePreloadStatusUpdate();
  }

  function markPreloadTask(done) {
    if (done) allPreloadState.completed += 1;
    else allPreloadState.failed += 1;
    schedulePreloadStatusUpdate();
  }

  function finishPreloadTaskBytes(task, bytes) {
    var finalBytes = Math.max(task.loadedBytes || 0, bytes || task.totalBytes || task.estimatedBytes || 0);
    if (!task.totalKnown) {
      allPreloadState.totalBytes += finalBytes - (task.estimatedBytes || 0);
      task.totalBytes = finalBytes;
      task.totalKnown = true;
    }
    trackTaskBytes(task, finalBytes, task.totalBytes);
    schedulePreloadStatusUpdate();
  }

  function runPreloadTask(task) {
    return waitForIdleSlot().then(function () {
      if (task.type === 'font') {
        return trackedFetchBinary(task.url, function (loaded, total) {
          trackTaskBytes(task, loaded, total);
        }).then(function (bytes) {
          finishPreloadTaskBytes(task, bytes);
          markPreloadTask(true);
        });
      }
      return preloadRouteHtml(task.url, function (loaded, total) {
        trackTaskBytes(task, loaded, total);
      }).then(function (html) {
        finishPreloadTaskBytes(task, html ? html.length : task.loadedBytes);
        markPreloadTask(true);
      });
    }).catch(function () {
      markPreloadTask(false);
    });
  }

  function preloadAllMushafBackground() {
    if (allPreloadState.running) return Promise.resolve(false);
    var tasks = [];
    for (var page = 1; page <= 604; page++) {
      tasks.push({ type: 'page', url: '/mushaf/' + page, estimatedBytes: estimatePreloadBytes('page'), loadedBytes: 0 });
      tasks.push({ type: 'font', url: mushafFontUrl(page), estimatedBytes: estimatePreloadBytes('font'), loadedBytes: 0 });
    }
    for (var surah = 1; surah <= 114; surah++) {
      tasks.push({ type: 'surah', url: '/surah/' + surah, estimatedBytes: estimatePreloadBytes('surah'), loadedBytes: 0 });
    }

    allPreloadState = {
      running: true,
      done: false,
      total: tasks.length,
      completed: 0,
      failed: 0,
      loadedBytes: 0,
      totalBytes: tasks.reduce(function (sum, task) { return sum + (task.estimatedBytes || 0); }, 0),
    };
    updatePreloadButton('loading');
    updatePreloadStatus({
      title: 'Фоновая подгрузка',
      detail: '0 / ' + tasks.length,
      size: 'Осталось примерно ' + formatMb(allPreloadState.totalBytes),
      progress: 1,
      status: 'running',
    });

    var index = 0;
    var workers = Math.min(3, tasks.length);
    function worker() {
      if (index >= tasks.length) return Promise.resolve();
      var task = tasks[index++];
      return runPreloadTask(task).then(worker);
    }

    return Promise.all(Array.from({ length: workers }, worker))
      .then(function () {
        allPreloadState.running = false;
        allPreloadState.done = allPreloadState.failed === 0;
        updatePreloadButton(allPreloadState.done ? 'ready' : 'error');
        updatePreloadStatus({
          title: allPreloadState.done ? 'Мусхаф готов офлайн' : 'Подгрузка завершена с ошибками',
          detail: allPreloadState.completed + ' / ' + allPreloadState.total + (allPreloadState.failed ? ', ошибок: ' + allPreloadState.failed : ''),
          size: allPreloadState.done ? 'Всё подгружено' : 'Осталось примерно ' + formatMb(Math.max(0, allPreloadState.totalBytes - allPreloadState.loadedBytes)),
          progress: 100,
          status: allPreloadState.done ? 'done' : 'error',
        });
        if (allPreloadState.done) {
          window.setTimeout(function () { updatePreloadStatus({ hidden: true }); }, 3600);
        }
        return allPreloadState.done;
      });
  }

  function trackedFetchText(url, onProgress) {
    return fetch(url, { credentials: 'same-origin', cache: 'force-cache' }).then(function (response) {
      if (!response.ok) throw new Error('Failed to preload ' + url);
      var total = parseInt(response.headers.get('content-length') || '0', 10) || 0;
      if (!response.body || !response.body.getReader) return response.text();
      var readerStream = response.body.getReader();
      var decoder = new TextDecoder();
      var loaded = 0;
      var text = '';
      function pump() {
        return readerStream.read().then(function (chunk) {
          if (chunk.done) return text + decoder.decode();
          loaded += chunk.value.byteLength;
          text += decoder.decode(chunk.value, { stream: true });
          if (onProgress) onProgress(loaded, total);
          return pump();
        });
      }
      return pump();
    });
  }

  function trackedFetchBinary(url, onProgress) {
    if (fontPreloadCache[url]) return Promise.resolve(0);
    return fetch(url, { mode: 'cors', cache: 'force-cache' }).then(function (response) {
      if (!response.ok) throw new Error('Failed to preload font');
      var total = parseInt(response.headers.get('content-length') || '0', 10) || 0;
      if (!response.body || !response.body.getReader) {
        return response.blob().then(function (blob) {
          fontPreloadCache[url] = true;
          if (onProgress) onProgress(blob.size || total, blob.size || total);
          return blob.size || total || 0;
        });
      }
      var readerStream = response.body.getReader();
      var loaded = 0;
      function pump() {
        return readerStream.read().then(function (chunk) {
          if (chunk.done) {
            fontPreloadCache[url] = true;
            return loaded || total || 0;
          }
          loaded += chunk.value.byteLength;
          if (onProgress) onProgress(loaded, total);
          return pump();
        });
      }
      return pump();
    });
  }

  function preloadAdjacentPages(page) {
    if (page > 1) preloadMushafPage(page - 1);
    if (page < 604) preloadMushafPage(page + 1);
  }

  function swapMushafPage(doc, page) {
    var nextSheet = doc.querySelector('.mushaf-sheet');
    var nextMeta = doc.querySelector('.mushaf-meta');
    var nextPage = doc.querySelector('.qcf-page');
    if (!nextSheet || !nextMeta || !nextPage || !sheet || !pageEl) return false;

    var fontCss = findPageFontCss(doc, page);
    if (fontCss) {
      var style = document.getElementById('mushaf-page-font-css');
      if (!style) {
        style = document.createElement('style');
        style.id = 'mushaf-page-font-css';
        document.head.appendChild(style);
      }
      style.textContent = fontCss;
    }

    if (!isMobileViewport()) root.style.setProperty('--mushaf-qcf-fit', '1');
    root.style.removeProperty('--mushaf-line-w');
    sheet.setAttribute('aria-label', nextSheet.getAttribute('aria-label') || 'Mushaf page ' + page);
    var meta = sheet.querySelector('.mushaf-meta');
    if (meta) meta.innerHTML = nextMeta.innerHTML;
    pageEl.innerHTML = nextPage.innerHTML;
    pageEl.classList.add('is-font-loading');
    pageEl.setAttribute('data-mushaf-page', String(page));
    pageEl.setAttribute('dir', nextPage.getAttribute('dir') || 'rtl');
    pageEl.setAttribute('data-mushaf-font-url', nextPage.getAttribute('data-mushaf-font-url') || '');
    pageEl.setAttribute('data-mushaf-font-family', nextPage.getAttribute('data-mushaf-font-family') || ('MushafTajweed' + page));
    pageEl.setAttribute('data-mushaf-compact', nextPage.getAttribute('data-mushaf-compact') || '0');
    var compactSection = nextPage.getAttribute('data-mushaf-compact-section');
    if (compactSection) pageEl.setAttribute('data-mushaf-compact-section', compactSection);
    else pageEl.removeAttribute('data-mushaf-compact-section');
    pageEl.setAttribute('data-mushaf-visible-lines', nextPage.getAttribute('data-mushaf-visible-lines') || '15');
    pageEl.style.setProperty(
      '--mushaf-visible-lines',
      nextPage.style.getPropertyValue('--mushaf-visible-lines') || String(15 - pageEl.querySelectorAll('.qcf-line.is-leading-empty').length)
    );
    pageEl.style.setProperty('--mushaf-compact-offset', nextPage.style.getPropertyValue('--mushaf-compact-offset') || '0');
    if (/firefox/i.test(navigator.userAgent)) pageEl.setAttribute('data-mushaf-firefox', '1');
    else pageEl.removeAttribute('data-mushaf-firefox');
    if (doc.title) document.title = doc.title;
    return true;
  }

  function navigateMushafPage(page, opts) {
    var next = clamp(parseInt(page, 10) || 1, 1, 604);
    if (next === activePage) {
      swipeNavigating = false;
      return Promise.resolve(false);
    }

    var token = ++pageLoadToken;
    var url = '/mushaf/' + next;
    var nextUrl = url + (opts && opts.ayah ? '?ayah=' + encodeURIComponent(opts.ayah) : '');
    var pendingHeight = sheet ? sheet.getBoundingClientRect().height : 0;
    var alreadyPending =
      pageEl &&
      pageEl.getAttribute('data-mushaf-page') === String(next) &&
      pageEl.classList.contains('is-font-loading');
    body.classList.add('mushaf-page-loading');
    activePage = next;
    rememberMushafPosition(next, opts && opts.ayah);
    if (!alreadyPending) showSwipePlaceholder(next, pendingHeight, nextUrl);
    else {
      syncPageControls(next);
      if (location.pathname + location.search !== nextUrl) history.pushState({ mushafPage: next }, '', nextUrl);
    }

    var load = pageCache[url]
      ? Promise.resolve(pageCache[url])
      : fetch(url, { credentials: 'same-origin' })
          .then(function (response) {
            if (!response.ok) throw new Error('Failed to load page ' + next);
            return response.text();
          })
          .then(function (html) {
            pageCache[url] = html;
            return html;
          });

    return load
      .then(function (html) {
        if (token !== pageLoadToken) return false;
        var doc = new DOMParser().parseFromString(html, 'text/html');
        var fontCss = findPageFontCss(doc, next);
        if (fontCss) {
          var style = document.getElementById('mushaf-page-font-css');
          if (!style) {
            style = document.createElement('style');
            style.id = 'mushaf-page-font-css';
            document.head.appendChild(style);
          }
          style.textContent = fontCss;
        }
        if (!swapMushafPage(doc, next)) {
          location.href = url;
          return false;
        }
        if (location.pathname + location.search !== nextUrl) history.pushState({ mushafPage: next }, '', nextUrl);
        syncPageControls(next);
        applyZoom();
        layoutMushaf(null);
        return waitForPageFont(next).then(function (ready) {
          if (!ready || token !== pageLoadToken || activePage !== next) return false;
          return revealMushafPage().then(function (revealed) {
            if (!revealed) return false;
            if (opts && opts.ayah) openAyahOnCurrentPage(opts.ayah);
            preloadAdjacentPages(next);
            return true;
          });
        });
      })
      .catch(function () {
        location.href = url;
        return false;
      })
      .finally(function () {
        swipeNavigating = false;
        if (token === pageLoadToken) body.classList.remove('mushaf-page-loading');
      });
  }

  function schedulePageJump(input) {
    if (!input) return;
    var raw = String(input.value || '').trim();
    window.clearTimeout(jumpTimer);
    if (!/^\d{1,3}$/.test(raw)) return;
    jumpTimer = window.setTimeout(function () {
      goToPage(raw);
    }, 700);
  }

  function exitBrowserFullscreen() {
    var exit = document.exitFullscreen || document.webkitExitFullscreen || document.msExitFullscreen;
    if (!exit) return;
    if (!document.fullscreenElement && !document.webkitFullscreenElement && !document.msFullscreenElement) return;
    try {
      var result = exit.call(document);
      if (result && result.catch) result.catch(function () {});
    } catch (e) {}
  }

  function setImmersive(enabled) {
    if (enabled && toolbar && toolbar.contains(document.activeElement)) {
      try { document.activeElement.blur(); } catch (e) {}
    }
    body.classList.toggle('mushaf-immersive', enabled);
    root.classList.toggle('mushaf-immersive', enabled);
    body.setAttribute('data-mushaf-immersive-state', enabled ? '1' : '0');
    root.setAttribute('data-mushaf-immersive-state', enabled ? '1' : '0');
    if (toolbar) {
      toolbar.hidden = enabled;
      toolbar.setAttribute('aria-hidden', enabled ? 'true' : 'false');
      toolbar.style.display = enabled ? 'none' : '';
    }
    if (enabled) {
      bindImmersiveNavLinks();
      if (reader) {
        reader.scrollLeft = 0;
        reader.scrollTop = 0;
      }
      resetZoom();
      try {
        sessionStorage.setItem(IMM_KEY, '1');
      } catch (e) {}
      preloadAdjacentPages(activePage);
    } else {
      scale = 1;
      if (isMobileViewport()) resetMobileReaderFit();
      applyZoom();
      try {
        sessionStorage.removeItem(IMM_KEY);
      } catch (e) {}
      exitBrowserFullscreen();
    }
    settleMushafLayout(null);
  }

  try {
    var stored = parseFloat(localStorage.getItem(ZOOM_KEY) || '1');
    scale = stored >= MIN_SCALE && stored <= MAX_SCALE ? stored : 1;
  } catch (e) {}

  try {
    var state = JSON.parse(localStorage.getItem(STATE_KEY) || 'null');
    if (state && state.page === currentPage()) {
      scale = state.scale >= MIN_SCALE && state.scale <= MAX_SCALE ? state.scale : scale;
      panX = typeof state.panX === 'number' ? state.panX : 0;
      panY = typeof state.panY === 'number' ? state.panY : 0;
    } else {
      scale = 1;
      panX = 0;
      panY = 0;
    }
  } catch (e) {}

  try {
    if (sessionStorage.getItem(IMM_KEY) === '1') setImmersive(true);
  } catch (e) {}

  try {
    applyMushafStyle(localStorage.getItem(STYLE_KEY) || 'classic');
  } catch (e) {
    applyMushafStyle('classic');
  }

  try {
    applyMushafTajweed(readJsonStorage(TAJWEED_KEY) !== false);
  } catch (e) {
    applyMushafTajweed(true);
  }

  syncTopbarState(activePage);
  rememberMushafPosition(activePage, new URLSearchParams(location.search).get('ayah'));
  layoutMushaf(null);
  var initialFontPage = activePage;
  waitForPageFont(initialFontPage).then(function (ready) {
    if (!ready || activePage !== initialFontPage || String(pageEl?.getAttribute('data-mushaf-page')) !== String(initialFontPage)) return;
    revealMushafPage();
    settleMushafLayout(null);
    openAyahOnCurrentPage(new URLSearchParams(location.search).get('ayah'));
    preloadAdjacentPages(activePage);
    if (scale > 1.001) scrollZoomToStart();
  });
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(scheduleLineFit).catch(function () {});
  } else {
    scheduleLineFit();
  }
  window.addEventListener('resize', function () {
    scheduleViewportLayout();
  }, { passive: true });
  window.addEventListener('orientationchange', function () {
    layoutMushaf(null);
  }, { passive: true });
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', function () {
      scheduleViewportLayout();
    }, { passive: true });
    window.visualViewport.addEventListener('scroll', syncViewportHeight, { passive: true });
  }
  if (reader && 'ResizeObserver' in window) {
    var readerResizeObserver = new ResizeObserver(scheduleViewportLayout);
    readerResizeObserver.observe(reader);
  }

  document.addEventListener('submit', function (event) {
    var form = event.target && event.target.closest && event.target.closest('[data-mushaf-jump]');
    if (!form) return;
    event.preventDefault();
    var input = form.querySelector('input[name="page"]');
    window.clearTimeout(jumpTimer);
    goToPage(input && input.value);
  });

  document.addEventListener('change', function (event) {
    var sel = event.target && event.target.closest && event.target.closest('[data-mushaf-goto]');
    if (!sel || !sel.value) return;
    var page = clamp(parseInt(sel.value, 10) || 1, 1, 604);
    navigateMushafPage(page);
  });

  document.addEventListener('input', function (event) {
    var control = event.target && event.target.closest && event.target.closest('[data-mushaf-zoom-range]');
    if (control) {
      var c = sheetCenter();
      setScale((parseInt(control.value, 10) || 100) / 100, c && c.x, c && c.y);
      return;
    }

    var pageInput = event.target && event.target.closest && event.target.closest('[data-mushaf-jump] input[name="page"]');
    if (pageInput) schedulePageJump(pageInput);
  });

  function handleMushafToolEvent(event) {
      if (event.type === 'click' && Date.now() - lastToolEventAt < 450) return;
      var ayahJumpBtn = event.target && event.target.closest && event.target.closest('[data-mushaf-ayah-jump]');
      if (ayahJumpBtn) {
        event.preventDefault();
        event.stopImmediatePropagation();
        lastToolEventAt = Date.now();
        var last = readJsonStorage(LAST_KEY);
        var value = prompt('Перейти к аяту', (last && last.ayah) || '2:255');
        if (value != null) navigateToAyahRef(value);
        return;
      }

      var styleBtn = event.target && event.target.closest && event.target.closest('[data-mushaf-style-cycle]');
      if (styleBtn) {
        event.preventDefault();
        event.stopImmediatePropagation();
        lastToolEventAt = Date.now();
        cycleMushafStyle();
        return;
      }

      var tajweedBtn = event.target && event.target.closest && event.target.closest('[data-mushaf-tajweed-toggle]');
      if (tajweedBtn) {
        event.preventDefault();
        event.stopImmediatePropagation();
        lastToolEventAt = Date.now();
        toggleMushafTajweed();
      }
  }

  document.addEventListener('pointerup', handleMushafToolEvent, true);
  document.addEventListener('click', handleMushafToolEvent, true);

  document.addEventListener(
    'click',
    function (event) {
      var pageLink = event.target && event.target.closest && event.target.closest('a[href^="/mushaf/"]');
      if (!pageLink || (!isImmersive() && !pageLink.closest('.mushaf-reader'))) return;
      var match = (pageLink.getAttribute('href') || '').match(/\/mushaf\/(\d+)/);
      if (!match) return;
      if (isImmersive() && Date.now() - lastImmersiveNavAt < 1500) {
        event.preventDefault();
        event.stopImmediatePropagation();
        return;
      }
      event.preventDefault();
      event.stopImmediatePropagation();
      var hrefUrl = new URL(pageLink.getAttribute('href'), location.origin);
      var ayah = hrefUrl.searchParams.get('ayah');
      if ((parseInt(match[1], 10) || 1) === activePage && ayah) {
        history.replaceState({ mushafPage: activePage }, '', '/mushaf/' + activePage + '?ayah=' + encodeURIComponent(ayah));
        openAyahOnCurrentPage(ayah);
      } else {
        turnAdjacentMushafPage(match[1], { inline: true, ayah: ayah });
      }
    },
    true
  );

  document.addEventListener('click', function (event) {
    var preloadToggle = event.target && event.target.closest && event.target.closest('[data-mushaf-preload-popover-toggle]');
    if (preloadToggle) {
      event.preventDefault();
      var indicator = preloadToggle.closest('[data-mushaf-preload-indicator]');
      var isOpen = indicator && indicator.classList.toggle('is-open');
      body.classList.toggle('mushaf-preload-popover-open', !!isOpen);
      preloadToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      if (!isOpen && preloadToggle.blur) preloadToggle.blur();
      return;
    }

    var openIndicator = document.querySelector('[data-mushaf-preload-indicator].is-open');
    if (openIndicator && event.target && !event.target.closest('[data-mushaf-preload-indicator]')) {
      openIndicator.classList.remove('is-open');
      body.classList.remove('mushaf-preload-popover-open');
      var openToggle = openIndicator.querySelector('[data-mushaf-preload-popover-toggle]');
      if (openToggle) openToggle.setAttribute('aria-expanded', 'false');
    }

    var pageLink = event.target && event.target.closest && event.target.closest('a[href^="/mushaf/"]');
    if (pageLink && (isImmersive() || pageLink.closest('.mushaf-reader'))) {
      var match = (pageLink.getAttribute('href') || '').match(/\/mushaf\/(\d+)/);
      if (match) {
        event.preventDefault();
        var hrefUrl = new URL(pageLink.getAttribute('href'), location.origin);
        var ayah = hrefUrl.searchParams.get('ayah');
        if ((parseInt(match[1], 10) || 1) === activePage && ayah) {
          history.replaceState({ mushafPage: activePage }, '', '/mushaf/' + activePage + '?ayah=' + encodeURIComponent(ayah));
          openAyahOnCurrentPage(ayah);
        } else {
          turnAdjacentMushafPage(match[1], { inline: true, ayah: ayah });
        }
        return;
      }
    }

    var zoomBtn = event.target && event.target.closest && event.target.closest('[data-mushaf-zoom-step]');
    if (zoomBtn) {
      zoomBy(parseInt(zoomBtn.getAttribute('data-mushaf-zoom-step'), 10) || 0);
      return;
    }

    var fitBtn = event.target && event.target.closest && event.target.closest('[data-mushaf-fit]');
    if (fitBtn) {
      resetZoom();
      return;
    }

    var preloadBtn = event.target && event.target.closest && event.target.closest('[data-mushaf-preload-all]');
    if (preloadBtn) {
      event.preventDefault();
      preloadAllMushafBackground();
      return;
    }

    var immersiveBtn = event.target && event.target.closest && event.target.closest('button[data-mushaf-immersive]');
    if (!immersiveBtn) return;
    setImmersive(!body.classList.contains('mushaf-immersive'));
  });

  var sx = 0;
  var sy = 0;
  var stime = 0;
  var swiping = false;
  var swipeDx = 0;
  var swipePendingPage = null;
  var swipePeekEl = null;
  var swipePeekToken = 0;

  function setSwipeOffset(dx) {
    if (!sheet) return;
    if (reader) reader.style.setProperty('--mushaf-swipe-x', dx.toFixed(1) + 'px');
    sheet.style.setProperty('--mushaf-swipe-x', dx.toFixed(1) + 'px');
    sheet.classList.toggle('is-swiping', Math.abs(dx) > 0.5);
  }

  function clearSwipe() {
    if (!sheet) return;
    var hadPeek = !!swipePeekEl;
    if (hadPeek) sheet.classList.add('is-swipe-resetting');
    sheet.classList.remove('is-swiping', 'is-swipe-commit');
    sheet.style.removeProperty('--mushaf-swipe-x');
    if (reader) reader.style.removeProperty('--mushaf-swipe-x');
    if (hadPeek) sheet.offsetWidth;
    if (swipePeekEl) swipePeekEl.remove();
    if (hadPeek) {
      window.requestAnimationFrame(function () {
        if (sheet) sheet.classList.remove('is-swipe-resetting');
      });
    }
    swipePeekEl = null;
    swipePendingPage = null;
    swipeDx = 0;
    swiping = false;
  }

  function mushafSkeletonHtml() {
    var widths = [54, 78, 70, 86, 74, 90, 80, 88, 76, 84, 72, 82];
    return (
      '<div class="mushaf-font-skeleton" aria-hidden="true">' +
      '<span class="mushaf-skeleton-title"></span>' +
      widths
        .map(function (width) {
          return '<span class="mushaf-skeleton-line" style="--skeleton-line-w:' + width + '%"></span>';
        })
        .join('') +
      '</div>'
    );
  }

  function ensureSwipePeek(page, dir) {
    if (!reader || !sheet || !page) return;
    if (swipePeekEl && swipePendingPage === page) return;
    if (swipePeekEl) swipePeekEl.remove();
    swipePendingPage = page;
    swipePeekEl = sheet.cloneNode(true);
    swipePeekEl.classList.add('mushaf-swipe-peek', dir < 0 ? 'is-next' : 'is-prev');
    swipePeekEl.setAttribute('aria-hidden', 'true');
    var rect = sheet.getBoundingClientRect();
    swipePeekEl.style.setProperty('--mushaf-peek-top', rect.top + 'px');
    swipePeekEl.style.setProperty('--mushaf-peek-left', rect.left + 'px');
    swipePeekEl.style.setProperty('--mushaf-peek-width', rect.width + 'px');
    swipePeekEl.style.setProperty('--mushaf-peek-height', rect.height + 'px');
    swipePeekEl.style.setProperty('--mushaf-peek-offset', (dir < 0 ? 1 : -1) * Math.max(1, reader.clientWidth) + 'px');
    var peekPage = swipePeekEl.querySelector('.qcf-page');
    if (peekPage) {
      peekPage.classList.add('is-font-loading');
      peekPage.innerHTML = pageEl ? pageEl.querySelector('.mushaf-font-skeleton')?.outerHTML || mushafSkeletonHtml() : mushafSkeletonHtml();
    }
    reader.insertBefore(swipePeekEl, sheet.nextSibling);
    var token = ++swipePeekToken;
    var url = '/mushaf/' + page;
    var load = pageCache[url] ? Promise.resolve(pageCache[url]) : fetch(url, { credentials: 'same-origin' }).then(function (r) { return r.ok ? r.text() : ''; });
    load.then(function (html) {
      if (token !== swipePeekToken || !swipePeekEl || swipePendingPage !== page || !html) return;
      pageCache[url] = html;
    }).catch(function () {});
  }

  function showSwipePlaceholder(page, pendingHeight, href) {
    if (!pageEl || !sheet) return;
    var skeleton = pageEl.querySelector('.mushaf-font-skeleton');
    var skeletonHtml = skeleton ? skeleton.outerHTML : mushafSkeletonHtml();
    pageEl.innerHTML = skeletonHtml;
    pageEl.classList.add('is-font-loading');
    pageEl.setAttribute('data-mushaf-page', String(page));
    pageEl.setAttribute('data-mushaf-font-family', 'MushafTajweed' + page);
    pageEl.setAttribute('data-mushaf-compact', '0');
    pageEl.removeAttribute('data-mushaf-compact-section');
    pageEl.setAttribute('data-mushaf-visible-lines', '15');
    pageEl.style.setProperty('--mushaf-visible-lines', '15');
    pageEl.style.setProperty('--mushaf-compact-offset', '0');
    var stableHeight = pendingHeight || (sheet ? sheet.getBoundingClientRect().height : 0);
    if (isMobileViewport() && !isImmersive()) {
      stableHeight = stableHeight || stableMobileSheetHeight();
    }
    if (stableHeight > 0) {
      sheet.classList.add('is-page-pending');
      sheet.style.setProperty('--mushaf-pending-height', stableHeight + 'px');
    }
    var meta = sheet.querySelector('.mushaf-meta');
    var pageNumber = meta && meta.querySelector('b');
    if (pageNumber) pageNumber.textContent = String(page);
    sheet.setAttribute('aria-label', 'Страница ' + page + ' мусхафа');
    setFontLoading(true);
    syncPageControls(page);
    var url = href || '/mushaf/' + page;
    if (location.pathname + location.search !== url) history.pushState({ mushafPage: page }, '', url);
  }

  function commitSwipe(page, dir) {
    if (swipeNavigating) return;
    swipeNavigating = true;
    if (!sheet) return navigateMushafPage(page);
    sheet.classList.add('is-swipe-commit');
    if (swipePeekEl) swipePeekEl.classList.add('is-swipe-commit');
    var span = Math.max(1, reader?.clientWidth || window.innerWidth);
    setSwipeOffset(dir < 0 ? -span : span);
    window.setTimeout(function () {
      navigateMushafPage(page, { fromSwipe: true }).finally(function () {
        clearSwipe();
      });
    }, 160);
  }

  function turnAdjacentMushafPage(page, opts) {
    var next = clamp(parseInt(page, 10) || 1, 1, 604);
    if (
      opts &&
      opts.ayah ||
      !isMobileViewport() ||
      !reader ||
      !sheet ||
      swipeNavigating ||
      Math.abs(next - activePage) !== 1
    ) {
      return navigateMushafPage(next, opts);
    }
    ensureSwipePeek(next, next > activePage ? -1 : 1);
    setSwipeOffset(0);
    window.requestAnimationFrame(function () {
      commitSwipe(next, next > activePage ? -1 : 1);
    });
    return Promise.resolve(true);
  }

  if (reader) {
    var swipePointerId = null;
    reader.addEventListener('pointerdown', function (e) {
      if (!isMobileViewport() || !e.isPrimary || swipeNavigating) return;
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      swipePointerId = e.pointerId;
      sx = e.clientX;
      sy = e.clientY;
      stime = Date.now();
      swipeDx = 0;
      swiping = false;
      try { reader.setPointerCapture(e.pointerId); } catch (err) {}
    });
    reader.addEventListener('pointermove', function (e) {
      if (!isMobileViewport() || e.pointerId !== swipePointerId || swipeNavigating) return;
      var dx = e.clientX - sx;
      var dy = e.clientY - sy;
      if (!swiping && (Math.abs(dx) < 18 || Math.abs(dx) < Math.abs(dy) * 1.35)) return;
      var target = dx < 0 ? activePage + 1 : activePage - 1;
      if (target < 1 || target > 604) return;
      swiping = true;
      swipeDx = dx;
      ensureSwipePeek(target, dx < 0 ? -1 : 1);
      setSwipeOffset(dx * 0.92);
    });
    reader.addEventListener('pointerup', function (e) {
      if (!isMobileViewport() || e.pointerId !== swipePointerId || swipeNavigating) return;
      swipePointerId = null;
      var dx = e.clientX - sx;
      var dy = e.clientY - sy;
      var elapsed = Math.max(1, Date.now() - stime);
      var velocity = Math.abs(dx) / elapsed;
      var enoughDistance = Math.abs(dx) >= Math.min(36, reader.clientWidth * 0.09);
      var enoughVelocity = Math.abs(dx) >= 22 && velocity >= 0.25;
      if (elapsed > 1200 || (!enoughDistance && !enoughVelocity) || Math.abs(dx) < Math.abs(dy) * 1.1) {
        clearSwipe();
        return;
      }
      var cur = activePage;
      if (dx < 0 && cur < 604) commitSwipe(cur + 1, -1);
      else if (dx > 0 && cur > 1) commitSwipe(cur - 1, 1);
      else clearSwipe();
    });
    reader.addEventListener('pointercancel', function () {
      swipePointerId = null;
      if (!swipeNavigating) clearSwipe();
    });
  }

  // Zoom with wheel + Ctrl (and trackpad pinch, which reports ctrlKey)
  if (sheet) {
    sheet.addEventListener(
      'wheel',
      function (e) {
        if (!e.ctrlKey && !e.metaKey) return;
        e.preventDefault();
        setScale(scale - e.deltaY * 0.01, e.clientX, e.clientY);
      },
      { passive: false }
    );
  }

  // Double-tap / double-click to toggle zoom, centered on the point
  var lastTap = 0;
  var lastTapX = 0;
  var lastTapY = 0;
  function toggleZoomAt(x, y) {
    if (scale > 1.001) setScale(1);
    else setScale(2, x, y);
  }
  if (pageEl) {
    pageEl.addEventListener('dblclick', function (e) {
      e.preventDefault();
      toggleZoomAt(e.clientX, e.clientY);
    });
    pageEl.addEventListener(
      'touchend',
      function (e) {
        if (e.changedTouches.length !== 1) return;
        var t = e.changedTouches[0];
        var now = Date.now();
        if (now - lastTap < 320 && Math.abs(t.clientX - lastTapX) < 30 && Math.abs(t.clientY - lastTapY) < 30) {
          e.preventDefault();
          toggleZoomAt(t.clientX, t.clientY);
          lastTap = 0;
          return;
        }
        lastTap = now;
        lastTapX = t.clientX;
        lastTapY = t.clientY;
      },
      { passive: false }
    );
  }

  // Drag to pan while zoomed (mouse + touch via Pointer Events)
  if (reader && sheet && pageEl) {
    var dragging = false;
    var dragId = null;
    var dragStartX = 0;
    var dragStartY = 0;
    var dragPanX = 0;
    var dragPanY = 0;
    var dragScrollLeft = 0;
    var dragScrollTop = 0;
    var dragMoved = false;
    var suppressZoomDragClickUntil = 0;
    reader.addEventListener('pointerdown', function (e) {
      if (!isMobileViewport() || scale <= 1.001 || !e.isPrimary) return;
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      if (e.target && e.target.closest && e.target.closest('button, a, input, select, [role="button"]')) return;
      dragging = true;
      dragId = e.pointerId;
      dragStartX = e.clientX;
      dragStartY = e.clientY;
      dragPanX = panX;
      dragPanY = panY;
      dragScrollLeft = reader ? reader.scrollLeft : 0;
      dragScrollTop = reader ? reader.scrollTop : 0;
      dragMoved = false;
    });
    reader.addEventListener('pointermove', function (e) {
      if (!dragging || e.pointerId !== dragId) return;
      var dx = e.clientX - dragStartX;
      var dy = e.clientY - dragStartY;
      if (!dragMoved && Math.hypot(dx, dy) < 6) return;
      if (!dragMoved && Math.abs(dx) > Math.abs(dy) * 1.15) {
        dragging = false;
        dragId = null;
        return;
      }
      if (!dragMoved) {
        swipePointerId = null;
        clearSwipe();
        sheet.classList.add('is-drag-scrolling');
      }
      dragMoved = true;
      e.preventDefault();
      if (reader) {
        reader.scrollLeft = dragScrollLeft - dx;
        reader.scrollTop = dragScrollTop - dy;
      }
    });
    function endDrag(e) {
      if (!dragging || (e && e.pointerId !== dragId)) return;
      dragging = false;
      dragId = null;
      sheet.classList.remove('is-drag-scrolling');
      if (dragMoved) suppressZoomDragClickUntil = Date.now() + 350;
      try {
        reader.releasePointerCapture(e.pointerId);
      } catch (err) {}
      saveViewState();
    }
    reader.addEventListener('pointerup', endDrag);
    reader.addEventListener('pointercancel', endDrag);
    sheet.addEventListener('click', function (e) {
      if (Date.now() >= suppressZoomDragClickUntil) return;
      e.preventDefault();
      e.stopImmediatePropagation();
    }, true);

    var pinching = false;
    var pinchStartDist = 0;
    var pinchStartScale = 1;
    var pinchStartPanX = 0;
    var pinchStartPanY = 0;
    var pinchStartCenterX = 0;
    var pinchStartCenterY = 0;
    var pinchStartRelX = 0;
    var pinchStartRelY = 0;

    function touchDistance(t0, t1) {
      var dx = t1.clientX - t0.clientX;
      var dy = t1.clientY - t0.clientY;
      return Math.sqrt(dx * dx + dy * dy);
    }

    function touchCenter(t0, t1) {
      return { x: (t0.clientX + t1.clientX) / 2, y: (t0.clientY + t1.clientY) / 2 };
    }

    sheet.addEventListener(
      'touchstart',
      function (e) {
        if (e.touches.length !== 2 || !pageEl) return;
        var c = touchCenter(e.touches[0], e.touches[1]);
        var r = pageEl.getBoundingClientRect();
        pinching = true;
        pinchStartDist = Math.max(1, touchDistance(e.touches[0], e.touches[1]));
        pinchStartScale = scale;
        pinchStartPanX = panX;
        pinchStartPanY = panY;
        pinchStartCenterX = c.x;
        pinchStartCenterY = c.y;
        pinchStartRelX = c.x - r.left;
        pinchStartRelY = c.y - r.top;
      },
      { passive: true }
    );

    sheet.addEventListener(
      'touchmove',
      function (e) {
        if (!pinching || e.touches.length !== 2 || !pageEl) return;
        e.preventDefault();
        var c = touchCenter(e.touches[0], e.touches[1]);
        var nextScale = clamp(pinchStartScale * (touchDistance(e.touches[0], e.touches[1]) / pinchStartDist), MIN_SCALE, MAX_SCALE);
        var ratio = nextScale / Math.max(0.001, pinchStartScale);
        scale = nextScale;
        panX = pinchStartPanX + (c.x - pinchStartCenterX) + pinchStartRelX * (1 - ratio);
        panY = pinchStartPanY + (c.y - pinchStartCenterY) + pinchStartRelY * (1 - ratio);
        applyZoom();
      },
      { passive: false }
    );

    function endPinch() {
      if (!pinching) return;
      pinching = false;
      saveViewState();
    }

    sheet.addEventListener('touchend', endPinch, { passive: true });
    sheet.addEventListener('touchcancel', endPinch, { passive: true });
  }

  document.addEventListener('keydown', function (e) {
    var tag = (e.target && e.target.tagName) || '';
    if (/INPUT|TEXTAREA|SELECT/.test(tag) || e.metaKey || e.ctrlKey || e.altKey) return;
    var cur = activePage;
    if (e.key === 'Escape' && body.classList.contains('mushaf-immersive')) {
      setImmersive(false);
    } else if (e.key === 'ArrowLeft' && cur < 604) {
      navigateMushafPage(cur + 1);
    } else if (e.key === 'ArrowRight' && cur > 1) {
      navigateMushafPage(cur - 1);
    } else if (e.key === '+' || e.key === '=') {
      zoomBy(25);
    } else if (e.key === '-' || e.key === '_') {
      zoomBy(-25);
    } else if (e.key === '0') {
      resetZoom();
    }
  });

  document.addEventListener('fullscreenchange', function () {
    settleMushafLayout(null);
  });

  window.addEventListener('popstate', function () {
    if (!isImmersive()) return;
    var page = currentPage();
    navigateMushafPage(page, { inline: true });
  });
})();
