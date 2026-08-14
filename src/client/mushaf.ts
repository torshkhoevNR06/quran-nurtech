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
  var PAGE_RATIO = 0.704;
  var MIN_SCALE = 1;
  var MAX_SCALE = 3;
  var scale = 1;
  var panX = 0;
  var panY = 0;
  var fitTimer = 0;
  var jumpTimer = 0;
  var pageLoadToken = 0;
  var fontLoadToken = 0;
  var pageCache = {};
  var fontPreloadCache = {};
  var activePage = currentPage();
  var lastImmersiveNavAt = 0;

  function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
  }

  function currentPage() {
    return parseInt((location.pathname.match(/\/mushaf\/(\d+)/) || [])[1], 10) || 1;
  }

  function formatMb(bytes) {
    return (Math.max(0, bytes || 0) / 1024 / 1024).toFixed(2).replace('.', ',') + ' МБ';
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
    fitQcfLines();
    setFontLoading(false);
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
    if (isMobile) return Math.floor(Math.min(Math.max(1, vw - safeInset('left') - safeInset('right') - 12), 620));
    var heightSpace = Math.max(1, vh - reservedHeight);
    var maxPageWidth = isMobile ? 620 : 760;
    return Math.floor(Math.min(widthSpace, heightSpace * PAGE_RATIO, maxPageWidth));
  }

  function isMobileViewport() {
    return window.matchMedia('(max-width: 650px)').matches;
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
    var previous = line.style.getPropertyValue('--qcf-line-scale');
    line.style.setProperty('--qcf-line-scale', '1');
    var width = line.scrollWidth || line.getBoundingClientRect().width || 0;
    if (previous) line.style.setProperty('--qcf-line-scale', previous);
    else line.style.removeProperty('--qcf-line-scale');
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
    var target = Math.min(available, Math.max(median, Math.min(maxNatural, available * 0.92)));
    if (target > 0) root.style.setProperty('--mushaf-line-w', target + 'px');
    return target;
  }

  function applyLineScales(target) {
    if (!pageEl || !target) return;
    var isMobile = isMobileViewport();
    if (isMobile && scale > 1.001 && !isImmersive()) {
      lines = pageEl.querySelectorAll('.qcf-line');
      for (i = 0; i < lines.length; i++) lines[i].style.setProperty('--qcf-line-scale', '1');
      return;
    }
    var maxStretch = isMobile ? 1.045 : 1.055;
    var minCompress = isMobile ? 0.88 : 0.91;
    var lines = pageEl.querySelectorAll('.qcf-line:not(.is-empty):not(.qcf-line-deco):not(.center)');
    var pageRect = pageEl.getBoundingClientRect();
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];
      var natural = Math.max(1, measureLineNaturalWidth(line));
      var scaleLine = clamp(target / natural, minCompress, maxStretch);
      var visualWidth = natural * scaleLine;
      if (visualWidth > pageEl.clientWidth - 4) {
        scaleLine = Math.min(scaleLine, (pageEl.clientWidth - 4) / natural);
      }
      line.style.setProperty('--qcf-line-scale', scaleLine.toFixed(4));
      var bounds = measureLineContentBounds(line);
      var overLeft = Math.max(0, pageRect.left + 2 - bounds.left);
      var overRight = Math.max(0, bounds.right - pageRect.right + 2);
      if (overLeft > 0 || overRight > 0) {
        var safeWidth = Math.max(1, bounds.width - overLeft - overRight - 4);
        scaleLine = Math.max(0.72, scaleLine * (safeWidth / Math.max(1, bounds.width)));
      }
      line.style.setProperty('--qcf-line-scale', scaleLine.toFixed(4));
    }
  }

  function fitQcfLines() {
    if (!pageEl) return;
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
        fitQcfLines();
      });
    }, 0);
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
    body.classList.toggle('mushaf-mobile-reflow-zoom', isMobileViewport() && scale > 1.001 && !isImmersive());
    if (scale <= 1.001) {
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
    navigateMushafPage(match[1], { inline: true });
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
      setPageLink(link, next, !!next);
    });
    document.querySelectorAll('[data-mushaf-preload-next]').forEach(function (button) {
      if (next) {
        button.hidden = false;
        button.disabled = false;
        button.setAttribute('data-mushaf-preload-next', String(next));
        button.setAttribute('data-mushaf-preload-font', 'https://verses.quran.foundation/fonts/quran/hafs/v4/colrv1/woff2/p' + next + '.woff2');
        button.setAttribute('aria-label', 'Preload Mushaf page ' + next);
        button.setAttribute('title', 'Preload Mushaf page ' + next);
        updatePreloadButton(next, pageCache['/mushaf/' + next] ? 'ready' : 'idle');
      } else {
        button.hidden = true;
      }
    });
    syncTopbarState(page);
  }

  function readJsonStorage(key) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
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
      return Promise.resolve();
    }
    var spec = '28px ' + cssFontName(family);
    if (document.fonts.check && document.fonts.check(spec)) {
      return Promise.resolve();
    }
    return Promise.race([
      document.fonts.load(spec),
      new Promise(function (resolve) {
        window.setTimeout(resolve, 9000);
      }),
    ])
      .catch(function () {})
      .then(function () {
        if (token !== fontLoadToken) return;
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
    if (!panel) return;
    var title = panel.querySelector('[data-mushaf-preload-title]');
    var detail = panel.querySelector('[data-mushaf-preload-detail]');
    var bar = panel.querySelector('[data-mushaf-preload-bar]');
    panel.hidden = !state || state.hidden;
    if (!state || state.hidden) return;
    if (title) title.textContent = state.title || 'Предзагрузка';
    if (detail) detail.textContent = state.detail || '';
    if (bar) bar.style.width = Math.max(0, Math.min(100, state.progress || 0)).toFixed(1) + '%';
    panel.style.setProperty('--mushaf-preload-progress', Math.max(0, Math.min(100, state.progress || 0)).toFixed(1) + '%');
  }

  function updatePreloadButton(page, state) {
    document.querySelectorAll('[data-mushaf-preload-next]').forEach(function (button) {
      var matches = parseInt(button.getAttribute('data-mushaf-preload-next'), 10) === page;
      button.classList.toggle('is-loading', matches && state === 'loading');
      button.classList.toggle('is-ready', matches && state === 'ready');
      button.disabled = matches && state === 'loading';
      var label = button.querySelector('span:not(.ui-inline-icon)');
      if (!label) return;
      if (matches && state === 'loading') label.textContent = 'Загрузка';
      else if (matches && state === 'ready') label.textContent = 'Готово';
      else label.textContent = 'Подгрузить';
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

  function manualPreloadMushafPage(page) {
    var next = clamp(parseInt(page, 10) || 1, 1, 604);
    var url = '/mushaf/' + next;
    updatePreloadButton(next, 'loading');
    updatePreloadStatus({ title: 'Страница ' + next, detail: 'Запрашиваем разметку...', progress: 5 });
    var totalKnown = 0;
    var totalLoaded = 0;

    function showProgress(label, loaded, total) {
      if (total) totalKnown = Math.max(totalKnown, totalLoaded + total);
      var knownRemaining = total ? Math.max(0, totalKnown - (totalLoaded + loaded)) : 0;
      var progress = totalKnown ? ((totalLoaded + loaded) / totalKnown) * 100 : Math.min(92, 18 + (loaded / 524288) * 16);
      var detail = total
        ? label + ': осталось ' + formatMb(knownRemaining)
        : label + ': загружено ' + formatMb(totalLoaded + loaded);
      updatePreloadStatus({ title: 'Страница ' + next, detail: detail, progress: progress });
    }

    return trackedFetchText(url, function (loaded, total) {
      showProgress('Разметка', loaded, total);
    })
      .then(function (html) {
        pageCache[url] = html;
        var preferredFont = document.querySelector('[data-mushaf-preload-next="' + next + '"]')?.getAttribute('data-mushaf-preload-font');
        var fontUrls = preferredFont ? [preferredFont] : extractFontUrls(html).slice(0, 1);
        if (!fontUrls.length) return;
        return fontUrls.reduce(function (chain, fontUrl, index) {
          return chain.then(function () {
            return trackedFetchBinary(fontUrl, function (loaded, total) {
              showProgress('Шрифт', loaded, total);
            }).then(function (bytes) {
              totalLoaded += bytes || 0;
            });
          });
        }, Promise.resolve());
      })
      .then(function () {
        updatePreloadButton(next, 'ready');
        updatePreloadStatus({ title: 'Страница ' + next + ' готова', detail: 'Можно открыть без ожидания шрифта', progress: 100 });
        window.setTimeout(function () {
          updatePreloadStatus({ hidden: true });
        }, 2600);
      })
      .catch(function () {
        updatePreloadButton(next, 'idle');
        updatePreloadStatus({ title: 'Не удалось подгрузить', detail: 'Проверьте соединение и попробуйте ещё раз', progress: 100 });
      });
  }

  function preloadAdjacentPages(page) {
    if (!isImmersive()) return;
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

    sheet.setAttribute('aria-label', nextSheet.getAttribute('aria-label') || 'Mushaf page ' + page);
    var meta = sheet.querySelector('.mushaf-meta');
    if (meta) meta.innerHTML = nextMeta.innerHTML;
    pageEl.innerHTML = nextPage.innerHTML;
    pageEl.classList.add('is-font-loading');
    pageEl.setAttribute('data-mushaf-page', String(page));
    pageEl.setAttribute('dir', nextPage.getAttribute('dir') || 'rtl');
    pageEl.setAttribute('data-mushaf-font-url', nextPage.getAttribute('data-mushaf-font-url') || '');
    pageEl.setAttribute('data-mushaf-font-family', nextPage.getAttribute('data-mushaf-font-family') || ('MushafTajweed' + page));
    if (/firefox/i.test(navigator.userAgent)) pageEl.setAttribute('data-mushaf-firefox', '1');
    else pageEl.removeAttribute('data-mushaf-firefox');
    if (doc.title) document.title = doc.title;
    return true;
  }

  function navigateMushafPage(page, opts) {
    var next = clamp(parseInt(page, 10) || 1, 1, 604);
    if (next === activePage) return Promise.resolve(false);

    var token = ++pageLoadToken;
    var url = '/mushaf/' + next;
    body.classList.add('mushaf-page-loading');

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
        activePage = next;
        if (location.pathname !== url) history.pushState({ mushafPage: next }, '', url);
        syncPageControls(next);
        if (!isImmersive()) resetZoom();
        layoutMushaf(null);
        return waitForPageFont(next).then(function () {
          if (token !== pageLoadToken) return false;
          revealMushafPage();
          preloadAdjacentPages(next);
          return true;
        });
      })
      .catch(function () {
        location.href = url;
        return false;
      })
      .finally(function () {
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
      try {
        sessionStorage.removeItem(IMM_KEY);
      } catch (e) {}
      exitBrowserFullscreen();
    }
    requestAnimationFrame(function () {
      layoutMushaf(null);
    });
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

  syncTopbarState(activePage);
  layoutMushaf(null);
  waitForPageFont(activePage).then(function () {
    revealMushafPage();
    if (scale > 1.001) scrollZoomToStart();
  });
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(scheduleLineFit).catch(function () {});
  } else {
    scheduleLineFit();
  }
  window.addEventListener('resize', function () {
    layoutMushaf(preserveCenter());
  }, { passive: true });
  window.addEventListener('orientationchange', function () {
    layoutMushaf(null);
  }, { passive: true });
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', function () {
      layoutMushaf(preserveCenter());
    }, { passive: true });
    window.visualViewport.addEventListener('scroll', syncViewportHeight, { passive: true });
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
      navigateMushafPage(match[1], { inline: true });
    },
    true
  );

  document.addEventListener('click', function (event) {
    var pageLink = event.target && event.target.closest && event.target.closest('a[href^="/mushaf/"]');
    if (pageLink && (isImmersive() || pageLink.closest('.mushaf-reader'))) {
      var match = (pageLink.getAttribute('href') || '').match(/\/mushaf\/(\d+)/);
      if (match) {
        event.preventDefault();
        navigateMushafPage(match[1], { inline: true });
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

    var preloadBtn = event.target && event.target.closest && event.target.closest('[data-mushaf-preload-next]');
    if (preloadBtn) {
      event.preventDefault();
      manualPreloadMushafPage(preloadBtn.getAttribute('data-mushaf-preload-next'));
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
    sheet.style.setProperty('--mushaf-swipe-x', dx.toFixed(1) + 'px');
    sheet.classList.toggle('is-swiping', Math.abs(dx) > 0.5);
  }

  function clearSwipe() {
    if (!sheet) return;
    sheet.classList.remove('is-swiping', 'is-swipe-commit');
    sheet.style.removeProperty('--mushaf-swipe-x');
    if (swipePeekEl) swipePeekEl.remove();
    swipePeekEl = null;
    swipePendingPage = null;
    swipeDx = 0;
    swiping = false;
  }

  function ensureSwipePeek(page, dir) {
    if (!reader || !sheet || !page) return;
    if (swipePeekEl && swipePendingPage === page) return;
    if (swipePeekEl) swipePeekEl.remove();
    swipePendingPage = page;
    swipePeekEl = sheet.cloneNode(true);
    swipePeekEl.classList.add('mushaf-swipe-peek', dir < 0 ? 'is-next' : 'is-prev');
    swipePeekEl.setAttribute('aria-hidden', 'true');
    var peekPage = swipePeekEl.querySelector('.qcf-page');
    if (peekPage) {
      peekPage.classList.add('is-font-loading');
      peekPage.innerHTML = pageEl ? pageEl.querySelector('.mushaf-font-skeleton')?.outerHTML || '' : '';
    }
    reader.insertBefore(swipePeekEl, sheet.nextSibling);
    var token = ++swipePeekToken;
    var url = '/mushaf/' + page;
    var load = pageCache[url] ? Promise.resolve(pageCache[url]) : fetch(url, { credentials: 'same-origin' }).then(function (r) { return r.ok ? r.text() : ''; });
    load.then(function (html) {
      if (token !== swipePeekToken || !swipePeekEl || swipePendingPage !== page || !html) return;
      pageCache[url] = html;
      var doc = new DOMParser().parseFromString(html, 'text/html');
      var nextSheet = doc.querySelector('.mushaf-sheet');
      if (nextSheet && swipePeekEl) swipePeekEl.innerHTML = nextSheet.innerHTML;
    }).catch(function () {});
  }

  function commitSwipe(page, dir) {
    if (!sheet) return navigateMushafPage(page);
    sheet.classList.add('is-swipe-commit');
    setSwipeOffset(dir < 0 ? -window.innerWidth : window.innerWidth);
    window.setTimeout(function () {
      clearSwipe();
      navigateMushafPage(page);
    }, 180);
  }

  if (reader) {
    reader.addEventListener('touchstart', function (e) {
      if (!isMobileViewport() || e.touches.length !== 1) return;
      var t = e.changedTouches[0];
      sx = t.clientX;
      sy = t.clientY;
      stime = Date.now();
      swipeDx = 0;
      swiping = false;
    }, { passive: true });
    reader.addEventListener('touchmove', function (e) {
      if (!isMobileViewport() || e.touches.length !== 1 || scale > 1.001) return;
      var t = e.touches[0];
      var dx = t.clientX - sx;
      var dy = t.clientY - sy;
      if (!swiping && (Math.abs(dx) < 18 || Math.abs(dx) < Math.abs(dy) * 1.35)) return;
      var target = dx < 0 ? activePage + 1 : activePage - 1;
      if (target < 1 || target > 604) return;
      swiping = true;
      swipeDx = dx;
      ensureSwipePeek(target, dx < 0 ? -1 : 1);
      setSwipeOffset(dx * 0.86);
    }, { passive: true });
    reader.addEventListener('touchend', function (e) {
      if (!isMobileViewport() || scale > 1.001) return;
      var t = e.changedTouches[0];
      var dx = t.clientX - sx;
      var dy = t.clientY - sy;
      if (Date.now() - stime > 700 || Math.abs(dx) < 55 || Math.abs(dx) < Math.abs(dy) * 1.45) {
        clearSwipe();
        return;
      }
      if (reader.scrollWidth > reader.clientWidth + 6) {
        var maxScroll = reader.scrollWidth - reader.clientWidth;
        if (reader.scrollLeft > 4 && reader.scrollLeft < maxScroll - 4) {
          clearSwipe();
          return;
        }
      }
      var cur = activePage;
      if (dx < 0 && cur < 604) commitSwipe(cur + 1, -1);
      else if (dx > 0 && cur > 1) commitSwipe(cur - 1, 1);
      else clearSwipe();
    }, { passive: true });
    reader.addEventListener('touchcancel', clearSwipe, { passive: true });
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
  if (sheet && pageEl) {
    var dragging = false;
    var dragId = null;
    var dragStartX = 0;
    var dragStartY = 0;
    var dragPanX = 0;
    var dragPanY = 0;
    sheet.addEventListener('pointerdown', function (e) {
      return;
      dragging = true;
      dragId = e.pointerId;
      dragStartX = e.clientX;
      dragStartY = e.clientY;
      dragPanX = panX;
      dragPanY = panY;
      try {
        sheet.setPointerCapture(e.pointerId);
      } catch (err) {}
    });
    sheet.addEventListener('pointermove', function (e) {
      if (!dragging || e.pointerId !== dragId) return;
      e.preventDefault();
      panX = dragPanX + (e.clientX - dragStartX);
      panY = dragPanY + (e.clientY - dragStartY);
      clampPan();
      pageEl.style.transform = '';
    });
    function endDrag(e) {
      if (!dragging || (e && e.pointerId !== dragId)) return;
      dragging = false;
      dragId = null;
      try {
        sheet.releasePointerCapture(e.pointerId);
      } catch (err) {}
      saveViewState();
    }
    sheet.addEventListener('pointerup', endDrag);
    sheet.addEventListener('pointercancel', endDrag);

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
    layoutMushaf(null);
  });

  window.addEventListener('popstate', function () {
    if (!isImmersive()) return;
    var page = currentPage();
    navigateMushafPage(page, { inline: true });
  });
})();
