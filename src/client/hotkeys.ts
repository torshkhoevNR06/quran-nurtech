import { $, $$, toast } from './shared';

interface HotkeyTrack {
  s: number;
  a: number;
}

interface HotkeyPlayer {
  idx: number;
  playlist: HotkeyTrack[];
  toggle(): void;
}

interface HotkeyDeps {
  player: HotkeyPlayer;
  setViewHotkey(view: 'arabic' | 'translation' | 'translit' | 'tafsir'): void;
  toggleBookmark(s: number, a: number): boolean;
  closeMenus(): void;
}

export function initHotkeys({ player, setViewHotkey, toggleBookmark, closeMenus }: HotkeyDeps) {
  const currentAyahIdx = () => (player.idx >= 0 ? player.idx : 0);

  const jumpAyah = (delta: number) => {
    const box = $('[data-ayahs]');
    if (!box) return;
    const els = $$('[data-ayah-key]');
    if (!els.length) return;
    const base = player.idx >= 0 ? player.idx : 0;
    const target = Math.min(Math.max(base + delta, 0), els.length - 1);
    els[target].scrollIntoView({ block: 'center', behavior: 'smooth' });
    els[target].classList.add('active');
    setTimeout(() => {
      if (player.idx < 0) els[target].classList.remove('active');
    }, 1200);
    player.idx = target;
  };

  const navSurah = (delta: number) => {
    const sid = document.body.getAttribute('data-surah');
    if (!sid) return;
    const n = +sid + delta;
    if (n >= 1 && n <= 114) location.href = `/surah/${n}`;
  };

  document.addEventListener('keydown', (e) => {
    const tag = (e.target as Element)?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') {
      if (e.key === 'Escape') (e.target as HTMLElement).blur();
      return;
    }
    const sid = document.body.getAttribute('data-surah');
    switch (e.key) {
      case '/':
        e.preventDefault();
        $<HTMLInputElement>('[data-quick-input]')?.focus();
        break;
      case '[':
        if (e.altKey) navSurah(-1);
        else if (e.shiftKey) jumpAyah(-10);
        else jumpAyah(-1);
        break;
      case ']':
        if (e.altKey) navSurah(1);
        else if (e.shiftKey) jumpAyah(10);
        else jumpAyah(1);
        break;
      case 'p':
      case 'P':
        e.preventDefault();
        player.toggle();
        break;
      case 'a':
      case 'A':
        setViewHotkey('arabic');
        break;
      case 's':
      case 'S':
        setViewHotkey('translation');
        break;
      case 'd':
      case 'D':
        setViewHotkey('translit');
        break;
      case 't':
      case 'T':
        setViewHotkey('tafsir');
        break;
      case 'b':
      case 'B':
        if (sid) {
          const t = player.playlist[currentAyahIdx()];
          if (t) {
            const on = toggleBookmark(t.s, t.a);
            toast(on ? 'В закладках' : 'Убрано');
          }
        }
        break;
      case 'Escape':
        closeMenus();
        break;
    }
  });
}
