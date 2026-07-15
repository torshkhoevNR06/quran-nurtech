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
  var pageEl = document.querySelector('.qcf-page');
  var range = document.querySelector('[data-mushaf-zoom-range]');
  var fitEls = document.querySelectorAll('[data-mushaf-fit]');
  var ZOOM_KEY = 'q_mushaf_zoom';
  var IMM_KEY = 'q_mushaf_reader';
  var MIN_SCALE = 1;
  var MAX_SCALE = 3;
  var scale = 1;
  var panX = 0;
  var panY = 0;

  function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
  }

  function currentPage() {
    return parseInt((location.pathname.match(/\/mushaf\/(\d+)/) || [])[1], 10) || 1;
  }

  function syncViewportHeight() {
    var vv = window.visualViewport;
    var height = Math.max(360, Math.floor((vv && vv.height) || window.innerHeight || 0));
    root.style.setProperty('--mushaf-vvh', height + 'px');
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

  function layoutMushaf(center) {
    if (!reader || !sheet) return;
    syncViewportHeight();
    var isMobile = window.matchMedia('(max-width: 650px)').matches;
    var isImmersive = body.classList.contains('mushaf-immersive');
    var widthSpace = Math.max(280, reader.clientWidth - (isMobile ? 12 : 56));
    var heightReserve = isImmersive ? (isMobile ? 96 : 118) : isMobile ? 118 : 136;
    var heightSpace = Math.max(420, reader.clientHeight - heightReserve);
    var fitWidth = Math.min(widthSpace, heightSpace * 0.704, isMobile ? 620 : 760);
    var minWidth = isMobile ? Math.min(330, widthSpace) : 390;
    var pageWidth = Math.round(Math.max(minWidth, fitWidth));

    root.style.setProperty('--mushaf-page-w', pageWidth + 'px');
    root.style.setProperty('--mushaf-qcf-size', clamp(pageWidth * 0.048, isMobile ? 15.5 : 18, isMobile ? 36 : 44).toFixed(2) + 'px');
    clampPan();
    applyZoom();
    restoreCenter(center);
  }

  // --- Zoom (transform: scale on .qcf-page inside the fixed paper frame) ---
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

  function applyZoom() {
    if (!pageEl) return;
    if (scale <= 1.001) {
      panX = 0;
      panY = 0;
      pageEl.style.transform = '';
      pageEl.style.transformOrigin = '';
      pageEl.style.willChange = '';
      body.classList.remove('mushaf-zoomed');
    } else {
      clampPan();
      pageEl.style.transformOrigin = '0 0';
      pageEl.style.transform = 'translate(' + panX + 'px,' + panY + 'px) scale(' + scale + ')';
      pageEl.style.willChange = 'transform';
      body.classList.add('mushaf-zoomed');
    }
    updateZoomUi();
  }

  function setScale(next, focalX, focalY, keepCenter) {
    var oldS = scale;
    var newS = clamp(next, MIN_SCALE, MAX_SCALE);
    if (Math.abs(newS - oldS) < 0.0005) {
      if (keepCenter) layoutMushaf(preserveCenter());
      return;
    }
    if (pageEl && focalX != null && oldS > 0) {
      var r = pageEl.getBoundingClientRect();
      var relX = focalX - r.left;
      var relY = focalY - r.top;
      var k = 1 - newS / oldS;
      panX += relX * k;
      panY += relY * k;
    }
    scale = newS;
    try {
      localStorage.setItem(ZOOM_KEY, String(scale));
    } catch (e) {}
    applyZoom();
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

  try {
    var stored = parseFloat(localStorage.getItem(ZOOM_KEY) || '1');
    scale = stored >= MIN_SCALE && stored <= MAX_SCALE ? stored : 1;
  } catch (e) {}

  try {
    if (sessionStorage.getItem(IMM_KEY) === '1') body.classList.add('mushaf-immersive');
  } catch (e) {}

  layoutMushaf(null);
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
    var page = clamp(parseInt(input && input.value, 10) || 1, 1, 604);
    location.href = '/mushaf/' + page;
  });

  document.addEventListener('change', function (event) {
    var sel = event.target && event.target.closest && event.target.closest('[data-mushaf-goto]');
    if (!sel || !sel.value) return;
    var page = clamp(parseInt(sel.value, 10) || 1, 1, 604);
    location.href = '/mushaf/' + page;
  });

  document.addEventListener('input', function (event) {
    var control = event.target && event.target.closest && event.target.closest('[data-mushaf-zoom-range]');
    if (!control) return;
    var c = sheetCenter();
    setScale((parseInt(control.value, 10) || 100) / 100, c && c.x, c && c.y);
  });

  document.addEventListener('click', function (event) {
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

    var immersiveBtn = event.target && event.target.closest && event.target.closest('[data-mushaf-immersive]');
    if (!immersiveBtn) return;
    if (body.classList.contains('mushaf-immersive')) {
      body.classList.remove('mushaf-immersive');
      try {
        sessionStorage.removeItem(IMM_KEY);
      } catch (e) {}
    } else {
      body.classList.add('mushaf-immersive');
      try {
        sessionStorage.setItem(IMM_KEY, '1');
      } catch (e) {}
    }
    layoutMushaf(null);
  });

  var sx = 0;
  var sy = 0;
  var stime = 0;
  if (reader) {
    reader.addEventListener('touchstart', function (e) {
      var t = e.changedTouches[0];
      sx = t.clientX;
      sy = t.clientY;
      stime = Date.now();
    }, { passive: true });
    reader.addEventListener('touchend', function (e) {
      if (scale > 1.001) return;
      var t = e.changedTouches[0];
      var dx = t.clientX - sx;
      var dy = t.clientY - sy;
      if (Date.now() - stime > 600) return;
      if (Math.abs(dx) < 55 || Math.abs(dx) < Math.abs(dy) * 1.6) return;
      if (reader.scrollWidth > reader.clientWidth + 6) {
        var maxScroll = reader.scrollWidth - reader.clientWidth;
        if (reader.scrollLeft > 4 && reader.scrollLeft < maxScroll - 4) return;
      }
      var cur = currentPage();
      if (dx < 0 && cur < 604) location.href = '/mushaf/' + (cur + 1);
      else if (dx > 0 && cur > 1) location.href = '/mushaf/' + (cur - 1);
    }, { passive: true });
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
      if (scale <= 1.001) return;
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
      pageEl.style.transform = 'translate(' + panX + 'px,' + panY + 'px) scale(' + scale + ')';
    });
    function endDrag(e) {
      if (!dragging || (e && e.pointerId !== dragId)) return;
      dragging = false;
      dragId = null;
      try {
        sheet.releasePointerCapture(e.pointerId);
      } catch (err) {}
    }
    sheet.addEventListener('pointerup', endDrag);
    sheet.addEventListener('pointercancel', endDrag);
  }

  document.addEventListener('keydown', function (e) {
    var tag = (e.target && e.target.tagName) || '';
    if (/INPUT|TEXTAREA|SELECT/.test(tag) || e.metaKey || e.ctrlKey || e.altKey) return;
    var cur = currentPage();
    if (e.key === 'Escape' && body.classList.contains('mushaf-immersive')) {
      body.classList.remove('mushaf-immersive');
      try {
        sessionStorage.removeItem(IMM_KEY);
      } catch (err) {}
      layoutMushaf(null);
    } else if (e.key === 'ArrowLeft' && cur < 604) {
      location.href = '/mushaf/' + (cur + 1);
    } else if (e.key === 'ArrowRight' && cur > 1) {
      location.href = '/mushaf/' + (cur - 1);
    } else if (e.key === '+' || e.key === '=') {
      zoomBy(25);
    } else if (e.key === '-' || e.key === '_') {
      zoomBy(-25);
    } else if (e.key === '0') {
      resetZoom();
    }
  });
})();
