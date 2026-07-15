import { $, $$, K, LS, toast, type Dict } from './shared';
import { markMenu } from './ui-menus';

interface ReadCfg {
  ar: number;
  ru: number;
  lh: number;
  font: string;
  hb?: boolean;
}

interface Layers {
  ar: boolean;
  tl: boolean;
  tr: boolean;
}

let layersState: Layers = { ar: true, tl: false, tr: true };

function applyTheme(t: string) {
  const eff =
    t === 'system'
      ? matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
      : t;
  document.documentElement.setAttribute('data-theme', eff);
}

const stripBrackets = (s: string) =>
  s
    .replace(/\s*[([][^)\]]*[)\]]/g, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+([,.;:!?])/g, '$1')
    .trim();

function applyBrackets(on: boolean) {
  $$('.translation').forEach((el) => {
    const e = el as HTMLElement;
    if (on) {
      if (e.dataset.full == null) e.dataset.full = e.innerHTML;
      const parts = e.dataset.full.split('<br>');
      const tail = parts.pop()!;
      const head = parts.length ? parts.join('<br>') + '<br>' : '';
      e.innerHTML = head + stripBrackets(tail);
    } else if (e.dataset.full != null) {
      e.innerHTML = e.dataset.full;
      delete e.dataset.full;
    }
  });
}

function applyLayers(l: Layers) {
  if (!l.ar && !l.tl && !l.tr) l.ar = true;
  const box = $('[data-ayahs]');
  if (box) {
    box.classList.toggle('hide-ar', !l.ar);
    box.classList.toggle('hide-tl', !l.tl);
    box.classList.toggle('hide-tr', !l.tr);
  }
  $$('[data-layer]').forEach((b) =>
    b.classList.toggle('on', !!(l as any)[b.getAttribute('data-layer')!])
  );
}

export function initTheme() {
  const cur = LS.get<string>(K.theme, 'system');
  applyTheme(cur);
  markMenu('theme', 'theme-set', cur);
  $$('[data-theme-set]').forEach((b) =>
    b.addEventListener('click', () => {
      const v = b.getAttribute('data-theme-set')!;
      LS.set(K.theme, v);
      applyTheme(v);
      markMenu('theme', 'theme-set', v);
    })
  );
  $$('[data-theme-toggle]').forEach((b) =>
    b.addEventListener('click', () => {
      const effNow = document.documentElement.getAttribute('data-theme');
      const next = effNow === 'dark' ? 'light' : 'dark';
      LS.set(K.theme, next);
      applyTheme(next);
      markMenu('theme', 'theme-set', next);
    })
  );
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (LS.get<string>(K.theme, 'system') === 'system') applyTheme('system');
  });
}

export function initReading() {
  const cfg = LS.get<ReadCfg>(K.read, { ar: 30, ru: 18, lh: 1.9, font: 'Mushaf' });
  const rootStyle = document.documentElement.style;
  const apply = () => {
    rootStyle.setProperty('--ar-size', cfg.ar + 'px');
    rootStyle.setProperty('--ru-size', cfg.ru + 'px');
    rootStyle.setProperty('--lh', String(cfg.lh));
    rootStyle.setProperty('--ar-font', cfg.font);
    LS.set(K.read, cfg);
  };
  const markHb = () =>
    $$('[data-hide-brackets]').forEach((b) => b.classList.toggle('on', !!cfg.hb));

  $$('[data-hide-brackets]').forEach((b) =>
    b.addEventListener('click', () => {
      cfg.hb = !cfg.hb;
      apply();
      applyBrackets(!!cfg.hb);
      markHb();
    })
  );
  markHb();
  if (cfg.hb) applyBrackets(true);

  const bind = (key: keyof ReadCfg, parse: (v: string) => number) =>
    $$<HTMLInputElement>(`[data-set="${key}"]`).forEach((inp) => {
      inp.value = String(cfg[key]);
      inp.addEventListener('input', () => {
        (cfg[key] as number) = parse(inp.value);
        apply();
      });
    });

  bind('ar', (v) => parseInt(v, 10));
  bind('ru', (v) => parseInt(v, 10));
  bind('lh', (v) => parseFloat(v));

  const markFont = () =>
    $$('[data-font]').forEach((b) => b.classList.toggle('on', b.getAttribute('data-font') === cfg.font));
  $$('[data-font]').forEach((b) =>
    b.addEventListener('click', () => {
      cfg.font = b.getAttribute('data-font')!;
      apply();
      markFont();
    })
  );
  markFont();
  apply();
}

export function initView() {
  layersState = LS.get<Layers>(K.layers, { ar: true, tl: false, tr: true });
  applyLayers(layersState);
  $$('[data-layer]').forEach((b) =>
    b.addEventListener('click', () => {
      const k = b.getAttribute('data-layer') as keyof Layers;
      layersState[k] = !layersState[k];
      LS.set(K.layers, layersState);
      applyLayers(layersState);
    })
  );
}

export function initTranslation() {
  const cur = document.body.getAttribute('data-tr') || LS.get<string>(K.tr, 'saadi');
  const names: Dict<string> = {
    kuliev: 'Кулиев',
    saadi: 'Тафсир',
    abuadel: 'Абу Адель',
    'ibn-kathir': 'Ибн Касир',
  };
  const label = $('[data-tr-current]');
  if (label) label.textContent = names[cur] || 'Перевод';
  markMenu('tr', 'tr', cur);
  markMenu('settings', 'tr', cur);
  $$('button[data-tr]').forEach((b) =>
    b.addEventListener('click', () => {
      if ((b as HTMLButtonElement).disabled) return;
      const v = b.getAttribute('data-tr')!;
      LS.set(K.tr, v);
      const sid = document.body.getAttribute('data-surah');
      if (sid) location.href = `/surah/${sid}/${v}`;
      else toast('Перевод сохранён — откроется в суре');
    })
  );
}

export function initTransShow() {
  const box = $('[data-ayahs]');
  if (!box) return;
  const cfg = LS.get<Dict<boolean>>(K.transShow, { kuliev: true, abuadel: true });
  const apply = () => {
    box.setAttribute('data-tr-kuliev', cfg.kuliev ? '1' : '0');
    box.setAttribute('data-tr-abuadel', cfg.abuadel ? '1' : '0');
    $$('[data-tr-show]').forEach((b) =>
      b.classList.toggle('on', !!cfg[b.getAttribute('data-tr-show')!])
    );
  };
  apply();
  $$('[data-tr-show]').forEach((b) =>
    b.addEventListener('click', () => {
      const k = b.getAttribute('data-tr-show')!;
      cfg[k] = !cfg[k];
      LS.set(K.transShow, cfg);
      apply();
    })
  );
}

export function setViewHotkey(v: string) {
  const map: Dict<keyof Layers> = { arabic: 'ar', translation: 'tr', translit: 'tl' };
  const k = map[v];
  if (!k) return;
  layersState[k] = !layersState[k];
  LS.set(K.layers, layersState);
  applyLayers(layersState);
  const names: Dict<string> = { ar: 'Арабский', tr: 'Перевод', tl: 'Транслитерация' };
  toast(`${names[k]}: ${layersState[k] ? 'вкл' : 'выкл'}`);
}
