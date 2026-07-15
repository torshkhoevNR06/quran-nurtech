// Контекст тулбара и shortcut настроек.
// Контекст-заголовок тулбара: текущее «местоположение» (как в Finder/Preview).
  function qFillContext() {
    var el = document.querySelector('[data-context]');
    if (!el) return;
    var p = location.pathname;
    var t = '',
      s = '';
    var mush = p.match(/^\/mushaf\/(\d+)/);
    var body = document.body;
    if (mush) {
      t = 'Мусхаф';
      s = 'Страница ' + mush[1] + ' из 604';
    } else if (/^\/(surah|ayah)\//.test(p) || /^\/\d+:\d+/.test(p)) {
      var h1 = document.querySelector('.surah-head h1, h1');
      var sur = body.getAttribute('data-surah');
      var ay = body.getAttribute('data-ayah');
      t = (h1 && h1.textContent.trim()) || 'Сура';
      s = sur ? (ay ? sur + ':' + ay : 'Сура ' + sur) : '';
    } else if (p === '/search' || p.indexOf('/search') === 0) {
      t = 'Поиск';
    } else if (p.indexOf('/progress') === 0) {
      t = 'Мой прогресс';
    }
    if (t) el.innerHTML = '<span class="tc-t"></span><span class="tc-s"></span>';
    if (t) el.querySelector('.tc-t').textContent = t;
    if (s) el.querySelector('.tc-s').textContent = s;
    else if (t) el.querySelector('.tc-s').remove();
  }
  if (document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', qFillContext);
  else qFillContext();


  // ⌘, / Ctrl+, — открыть инспектор настроек (как в macOS-приложениях)
  document.addEventListener('keydown', function (e) {
    if ((e.metaKey || e.ctrlKey) && e.key === ',') {
      var btn = document.querySelector('[aria-label="Настройки чтения"]');
      if (btn) {
        e.preventDefault();
        btn.click();
      }
    }
  });
