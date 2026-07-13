// Заметки к аяту (self-contained, без правок app.ts — merge-safe).
// Инжектит кнопку «заметка» в .ayah-acts и раскрывает inline-редактор; хранит в q_notes.
(function () {
  const KEY = 'q_notes';
  const load = (): Record<string, string> => {
    try {
      return JSON.parse(localStorage.getItem(KEY) || '{}');
    } catch {
      return {};
    }
  };
  const save = (o: Record<string, string>) => {
    try {
      localStorage.setItem(KEY, JSON.stringify(o));
    } catch {}
  };
  const NOTE_ICON =
    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H14l6 6v8.5a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18.5z"/><path d="M13.5 4v6H20"/></svg>';

  const notes = load();
  const ayahs = document.querySelectorAll<HTMLElement>('.ayah[data-ayah-key]');
  if (!ayahs.length) return;

  ayahs.forEach((el) => {
    const key = el.getAttribute('data-ayah-key') || '';
    const acts = el.querySelector('.ayah-acts');
    if (!acts || acts.querySelector('.ayah-note-btn')) return;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'ayah-note-btn secondary-action' + (notes[key] ? ' has' : '');
    btn.setAttribute('aria-label', 'Заметка к аяту');
    btn.title = 'Заметка';
    btn.innerHTML = NOTE_ICON;
    const bm = acts.querySelector('[data-bm]');
    if (bm && bm.nextSibling) acts.insertBefore(btn, bm.nextSibling);
    else acts.appendChild(btn);
    btn.addEventListener('click', () => toggleNote(el, key, btn));
  });

  function toggleNote(el: HTMLElement, key: string, btn: HTMLElement) {
    const existing = el.querySelector('.ayah-note') as HTMLElement | null;
    if (existing) {
      existing.remove();
      return;
    }
    const panel = document.createElement('div');
    panel.className = 'ayah-note';
    const ta = document.createElement('textarea');
    ta.placeholder = 'Ваша заметка к этому аяту…';
    ta.value = notes[key] || '';
    ta.rows = 3;
    const meta = document.createElement('div');
    meta.className = 'ayah-note-meta';
    meta.innerHTML = '<span>Заметка сохраняется на этом устройстве</span>';
    const del = document.createElement('button');
    del.type = 'button';
    del.className = 'ayah-note-del';
    del.textContent = 'Удалить';
    meta.appendChild(del);
    panel.append(ta, meta);
    el.appendChild(panel);
    ta.focus();
    ta.setSelectionRange(ta.value.length, ta.value.length);

    let t: ReturnType<typeof setTimeout> | undefined;
    const persist = () => {
      const v = ta.value.trim();
      if (v) notes[key] = v;
      else delete notes[key];
      save(notes);
      btn.classList.toggle('has', !!v);
    };
    ta.addEventListener('input', () => {
      clearTimeout(t);
      t = setTimeout(persist, 400);
    });
    ta.addEventListener('blur', persist);
    del.addEventListener('click', () => {
      ta.value = '';
      persist();
      panel.remove();
    });
  }
})();
