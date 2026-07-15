// @ts-nocheck
// Личный прогресс: хатм, дневная цель, календарь, карта сур и джузы.
(function () {
  var TOTAL = 6236;
  var K = {
    progress: 'q_progress',
    days: 'q_days',
    streak: 'q_streak',
    time: 'q_time',
    last: 'q_last',
    khatm: 'q_khatm',
    plan: 'q_khatm_plan',
    goal: 'q_goal',
  };
  var $ = function (s) {
    return document.querySelector(s);
  };
  var LS = {
    get: function (k, d) {
      try {
        var v = localStorage.getItem(k);
        return v == null ? d : JSON.parse(v);
      } catch (e) {
        return d;
      }
    },
    set: function (k, v) {
      try {
        localStorage.setItem(k, JSON.stringify(v));
      } catch (e) {}
    },
  };
  var ayahKey = /^\d{1,3}:\d{1,3}$/;
  function fmtTime(sec) {
    var s = Math.max(0, Math.round(sec || 0));
    var m = Math.round(s / 60);
    if (m < 1) return s > 0 ? '<1 мин' : '0 мин';
    if (m < 60) return m + ' мин';
    var h = Math.floor(m / 60),
      mm = m % 60;
    return h + ' ч' + (mm ? ' ' + mm + ' мин' : '');
  }
  function dayKey(d) {
    d = d || new Date();
    return (
      d.getFullYear() +
      '-' +
      String(d.getMonth() + 1).padStart(2, '0') +
      '-' +
      String(d.getDate()).padStart(2, '0')
    );
  }
  function dayNum(key) {
    var p = key.split('-').map(Number);
    if (!p[0]) return 0;
    return Math.floor(new Date(p[0], p[1] - 1, p[2]).getTime() / 86400000);
  }
  function fmtDate(dn) {
    var d = new Date(dn * 86400000);
    var mm = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
    return d.getDate() + ' ' + mm[d.getMonth()];
  }
  function plural(n, one, few, many) {
    var a = Math.abs(n) % 100,
      b = a % 10;
    if (a > 10 && a < 20) return many;
    if (b > 1 && b < 5) return few;
    if (b === 1) return one;
    return many;
  }

  var progress = LS.get(K.progress, {});
  var days = LS.get(K.days, {});
  var streak = LS.get(K.streak, { current: 0, best: 0, lastDay: '' });
  var time = LS.get(K.time, 0) || 0;
  var khatm = LS.get(K.khatm, 0) || 0;

  function readAyahs() {
    var c = 0;
    for (var k in progress) if (progress[k] === true && ayahKey.test(k)) c++;
    return c;
  }

  Promise.all([
    fetch('/data/index.json?v=5').then(function (r) {
      return r.json();
    }),
    fetch('/data/juz.json?v=5')
      .then(function (r) {
        return r.json();
      })
      .catch(function () {
        return [];
      }),
  ])
    .then(function (res) {
      render(res[0], res[1]);
    })
    .catch(function () {
      $('[data-prog]').insertAdjacentHTML(
        'beforeend',
        '<p style="color:var(--ink-faint)">Не удалось загрузить данные сур.</p>'
      );
    });

  function render(surahs, juz) {
    // офсеты глобального номера аята
    var offset = {};
    var acc = 0;
    surahs.forEach(function (s) {
      offset[s.n] = acc;
      acc += s.c;
    });
    var read = readAyahs();
    var pct = read / TOTAL;
    var pctR = Math.round(pct * 100);

    // ---- кольцо хатма ----
    $('[data-pct]').textContent = pctR + '%';
    $('[data-read]').textContent = read.toLocaleString('ru');
    $('[data-khatm]').textContent = khatm;
    if (!khatm) $('[data-khatm-line]').style.display = 'none';
    requestAnimationFrame(function () {
      $('[data-ring]').style.strokeDashoffset = 100 - pctR;
    });
    if (read >= TOTAL) $('[data-finish]').hidden = false;

    // Продолжить чтение
    var last = LS.get(K.last, null);
    var cont = $('[data-continue]');
    if (last && last.s) cont.href = '/surah/' + last.s + (last.a ? '#ayah-' + last.a : '');
    else cont.href = '/surah/1';

    // ---- статистика ----
    var activeDays = Object.keys(days).filter(function (d) {
      return (days[d] && (days[d].ayahs > 0 || days[d].sec > 0));
    });
    var lifetime = khatm * TOTAL + read;
    $('[data-t-ayahs]').textContent = lifetime.toLocaleString('ru');
    $('[data-t-time]').textContent = fmtTime(time);
    $('[data-t-days]').textContent = activeDays.length;
    $('[data-t-streak]').textContent = (streak.current || 0) + ' дн.';
    $('[data-t-best]').textContent = (streak.best || 0) + ' дн.';
    $('[data-t-avg]').textContent = activeDays.length
      ? Math.round(
          activeDays.reduce(function (a, d) {
            return a + (days[d].ayahs || 0);
          }, 0) / activeDays.length
        )
      : 0;

    renderPlan(read);
    renderGoal();
    renderCalendar();
    renderMap(surahs);
    renderJuz(surahs, juz, offset);
  }

  // ================= ПЛАН ХАТМА =================
  function renderPlan(read) {
    var plan = LS.get(K.plan, null);
    var form = $('[data-plan-form]');
    var view = $('[data-plan-view]');
    var editBtn = $('[data-plan-edit]');
    if (!plan) {
      form.hidden = false;
      view.hidden = true;
      editBtn.hidden = true;
      return;
    }
    form.hidden = true;
    view.hidden = false;
    editBtn.hidden = false;

    var today = dayNum(dayKey());
    var start = dayNum(plan.start);
    var elapsed = Math.max(1, today - start + 1);
    var startRead = plan.startRead || 0;
    var remaining0 = Math.max(1, TOTAL - startRead);
    var daily = Math.ceil(remaining0 / plan.days);
    var doneSince = Math.max(0, read - startRead);
    var expected = Math.min(remaining0, daily * elapsed);
    var diff = doneSince - expected; // >0 опережаешь
    var todayAyahs = (days[dayKey()] && days[dayKey()].ayahs) || 0;
    var todayLeft = Math.max(0, daily - todayAyahs);
    var pace = doneSince / elapsed;
    var leftAyahs = TOTAL - read;
    var projDaysLeft = pace > 0.01 ? Math.ceil(leftAyahs / pace) : null;
    var planFinish = start + plan.days - 1;
    var daysLeftPlan = planFinish - today + 1;
    var progressPct = Math.min(100, Math.round((doneSince / remaining0) * 100));

    var ok = diff >= 0;
    view.className = 'plan-view';
    view.innerHTML =
      '<div class="plan-target"><b>' +
      daily +
      '</b> ' +
      plural(daily, 'аят', 'аята', 'аятов') +
      ' в день · хатм за ' +
      plan.days +
      ' ' +
      plural(plan.days, 'день', 'дня', 'дней') +
      ' (до ' +
      fmtDate(planFinish) +
      ')</div>' +
      '<div class="plan-bar"><span style="width:' +
      progressPct +
      '%"></span></div>' +
      '<div class="plan-facts">' +
      '<div class="plan-fact"><span>Сегодня осталось</span><b>' +
      todayLeft +
      ' ' +
      plural(todayLeft, 'аят', 'аята', 'аятов') +
      '</b></div>' +
      '<div class="plan-fact ' +
      (ok ? 'ok' : 'behind') +
      '"><span>' +
      (ok ? 'Опережаешь план' : 'Отстаёшь от плана') +
      '</span><b>' +
      (ok ? '+' : '') +
      Math.round(diff) +
      ' ' +
      plural(Math.round(diff), 'аят', 'аята', 'аятов') +
      '</b></div>' +
      '<div class="plan-fact"><span>Дней по плану</span><b>' +
      Math.max(0, daysLeftPlan) +
      '</b></div>' +
      '<div class="plan-fact"><span>Прогноз (текущий темп)</span><b>' +
      (projDaysLeft == null
        ? '—'
        : leftAyahs <= 0
          ? 'готово 🎉'
          : '~' + fmtDate(today + projDaysLeft)) +
      '</b></div>' +
      '</div>';
  }

  function savePlan(daysN) {
    LS.set(K.plan, { days: daysN, start: dayKey(), startRead: readAyahs() });
    location.reload();
  }
  $('[data-plan-form]').addEventListener('submit', function (e) {
    e.preventDefault();
    var d = Math.max(1, Math.min(365, parseInt($('[data-plan-days]').value, 10) || 30));
    savePlan(d);
  });
  document.querySelectorAll('[data-preset]').forEach(function (b) {
    b.addEventListener('click', function () {
      savePlan(parseInt(b.getAttribute('data-preset'), 10));
    });
  });
  $('[data-plan-edit]').addEventListener('click', function () {
    LS.set(K.plan, null);
    location.reload();
  });

  // ================= ДНЕВНАЯ ЦЕЛЬ =================
  function renderGoal() {
    var goal = LS.get(K.goal, 20) || 20;
    var todayAyahs = (days[dayKey()] && days[dayKey()].ayahs) || 0;
    var p = Math.min(100, Math.round((todayAyahs / goal) * 100));
    $('[data-goal-cur]').textContent = todayAyahs;
    $('[data-goal-target]').textContent = goal;
    $('[data-goal-today]').textContent = todayAyahs;
    $('[data-goal-input]').value = goal;
    requestAnimationFrame(function () {
      $('[data-goal-ring]').style.strokeDashoffset = 100 - p;
    });
  }
  $('[data-goal-input]').addEventListener('change', function () {
    var v = Math.max(1, Math.min(500, parseInt(this.value, 10) || 20));
    LS.set(K.goal, v);
    renderGoal();
  });

  // ================= КАЛЕНДАРЬ =================
  function renderCalendar() {
    var cal = $('[data-cal]');
    var end = dayNum(dayKey());
    // выравниваем к неделе: заканчиваем сегодня, показываем 18 недель
    var weeks = 18;
    var dow = new Date(end * 86400000).getDay(); // 0=вс
    var startDn = end - (weeks * 7 - 1 - (6 - dow));
    var html = '';
    for (var dn = startDn; dn <= end; dn++) {
      var key = dayKey(new Date(dn * 86400000));
      var a = (days[key] && days[key].ayahs) || 0;
      var lv = a === 0 ? 0 : a < 5 ? 1 : a < 15 ? 2 : a < 40 ? 3 : 4;
      html +=
        '<i class="l' +
        lv +
        '" title="' +
        fmtDate(dn) +
        ': ' +
        a +
        ' ' +
        plural(a, 'аят', 'аята', 'аятов') +
        '"></i>';
    }
    cal.innerHTML = html;
  }

  // ================= КАРТА СУР =================
  function renderMap(surahs) {
    var map = $('[data-map]');
    var html = '';
    surahs.forEach(function (s) {
      var r = 0;
      for (var a = 1; a <= s.c; a++) if (progress[s.n + ':' + a] === true) r++;
      var cls = r === 0 ? '' : r >= s.c ? 'f' : 'p';
      html +=
        '<a class="' +
        cls +
        '" href="/surah/' +
        s.n +
        '" data-nm="' +
        s.nr +
        ' · ' +
        r +
        '/' +
        s.c +
        '">' +
        s.n +
        '</a>';
    });
    map.innerHTML = html;
  }

  // ================= ДЖУЗЫ =================
  function renderJuz(surahs, juz, offset) {
    if (!juz || !juz.length) {
      $('[data-juz]').parentElement.style.display = 'none';
      return;
    }
    // границы джузов в глобальной нумерации
    var starts = juz.map(function (z) {
      return { j: z.j, g: offset[z.s] + z.a };
    });
    starts.sort(function (a, b) {
      return a.g - b.g;
    });
    // читанные глобальные номера
    var readSet = {};
    for (var k in progress) {
      if (progress[k] === true && ayahKey.test(k)) {
        var sp = k.split(':');
        readSet[offset[+sp[0]] + +sp[1]] = 1;
      }
    }
    var html = '';
    for (var i = 0; i < starts.length; i++) {
      var from = starts[i].g;
      var to = i + 1 < starts.length ? starts[i + 1].g - 1 : TOTAL;
      var tot = to - from + 1;
      var r = 0;
      for (var g = from; g <= to; g++) if (readSet[g]) r++;
      var p = Math.round((r / tot) * 100);
      html +=
        '<div class="juz-row"><span class="jn">Джуз ' +
        starts[i].j +
        '</span><div class="juz-bar"><span style="width:' +
        p +
        '%"></span></div><span class="jp">' +
        p +
        '%</span></div>';
    }
    $('[data-juz]').innerHTML = html;
  }

  // ================= НОВЫЙ ХАТМ =================
  $('[data-finish]').addEventListener('click', function () {
    if (!confirm('Засчитать пройденный хатм и начать новый? Карта прочитанного обнулится, счётчик хатмов вырастет.'))
      return;
    LS.set(K.khatm, (LS.get(K.khatm, 0) || 0) + 1);
    LS.set(K.progress, {});
    if (navigator.vibrate) navigator.vibrate([12, 30, 14]);
    location.reload();
  });
})();
