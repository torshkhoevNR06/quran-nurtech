// Инлайн-SVG иконки (currentColor, 24x24, stroke). Возвращают строку — вставляем через set:html.
const s = (p: string, extra = '') =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" ${extra}>${p}</svg>`;

export const icons = {
  play: s('<path d="M6 4.5v15l13-7.5z" fill="currentColor" stroke="none"/>'),
  pause: s('<rect x="6" y="5" width="4" height="14" rx="1" fill="currentColor" stroke="none"/><rect x="14" y="5" width="4" height="14" rx="1" fill="currentColor" stroke="none"/>'),
  prev: s('<path d="M18 6L9 12l9 6zM7 6v12"/>'),
  next: s('<path d="M6 6l9 6-9 6zM17 6v12"/>'),
  repeat: s('<path d="M17 2l3 3-3 3"/><path d="M4 11V9a4 4 0 0 1 4-4h12"/><path d="M7 22l-3-3 3-3"/><path d="M20 13v2a4 4 0 0 1-4 4H4"/>'),
  repeatRange: s('<path d="M8 3v4M16 3v4"/><rect x="4" y="7" width="16" height="14" rx="2"/><path d="M9 14l2 2 4-4"/>'),
  copy: s('<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h8"/>'),
  bookmark: s('<path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1z"/>'),
  bookmarkFill: s('<path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1z" fill="currentColor"/>'),
  share: s('<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/>'),
  details: s('<circle cx="12" cy="12" r="9"/><path d="M12 8h.01M11 12h1v4h1"/>'),
  search: s('<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>'),
  home: s('<path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10.5V20h13v-9.5"/><path d="M9.5 20v-5h5v5"/>'),
  menu: s('<path d="M3 6h18M3 12h18M3 18h18"/>'),
  settings: s('<path d="M4 6h10M18 6h2M4 12h2M10 12h10M4 18h6M14 18h6"/><circle cx="16" cy="6" r="2"/><circle cx="8" cy="12" r="2"/><circle cx="12" cy="18" r="2"/>'),
  theme: s('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M19 5l-1.5 1.5M6.5 17.5L5 19"/>'),
  book: s('<path d="M4 5a2 2 0 0 1 2-2h6v18H6a2 2 0 0 0-2 2zM20 5a2 2 0 0 0-2-2h-6v18h6a2 2 0 0 1 2 2z"/>'),
  headphones: s('<path d="M4 14v-2a8 8 0 0 1 16 0v2"/><rect x="3" y="14" width="4" height="6" rx="1"/><rect x="17" y="14" width="4" height="6" rx="1"/>'),
  study: s('<path d="M3 7l9-4 9 4-9 4-9-4z"/><path d="M7 9v5c0 1 2.2 2.5 5 2.5s5-1.5 5-2.5V9"/>'),
  minus: s('<path d="M5 12h14"/>'),
  plus: s('<path d="M12 5v14M5 12h14"/>'),
  arrowLeft: s('<path d="M15 6l-6 6 6 6"/>'),
  arrowRight: s('<path d="M9 6l6 6-6 6"/>'),
  close: s('<path d="M6 6l12 12M18 6L6 18"/>'),
  continue: s('<circle cx="12" cy="12" r="9"/><path d="M10 8l5 4-5 4z" fill="currentColor" stroke="none"/>'),
  download: s('<path d="M12 3v12M7 10l5 5 5-5"/><path d="M4 20h16"/>'),
  video: s('<rect x="3" y="6" width="13" height="12" rx="2"/><path d="M16 10l5-3v10l-5-3z"/>'),
  compare: s('<path d="M12 3v18"/><path d="M7 7L4 10l3 3M17 7l3 3-3 3"/>'),
  memorize: s('<path d="M9 18V6l7 3-7 3"/><circle cx="12" cy="12" r="9"/>'),
  chevron: s('<path d="M6 9l6 6 6-6"/>'),
};

export type IconName = keyof typeof icons;
