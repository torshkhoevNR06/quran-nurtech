export interface Reciter {
  id: string;
  name: string;
  ed?: string; // редакция islamic.network
  br?: number; // битрейт
  ea?: string; // папка EveryAyah (фолбэк)
  type?: 'ayah' | 'surah';
  srv?: string; // база по-суровых файлов (mp3quran)
  skip?: number[]; // недоступные суры у по-сурового чтеца
}

export interface SurahMeta {
  n: number;
  na: string;
  ne: string;
  nr: string;
  nm: string;
  t: string;
  c: number;
  slug: string;
}

// версия данных — сбивает кэш браузера при изменении public/data/* (напр. новые чтецы)
export const DV = '5';

export let reciters: Reciter[] = [];
export let surahIndex: SurahMeta[] = [];
let ayahOffset: number[] = []; // ayahOffset[s] = число аятов до суры s (для глобального номера)

function computeOffsets(idx: SurahMeta[]) {
  ayahOffset = [];
  let acc = 0;
  for (const s of idx) {
    ayahOffset[s.n] = acc;
    acc += s.c;
  }
}

export const loadReciters = async () => {
  if (!reciters.length) reciters = await fetch(`/data/reciters.json?v=${DV}`).then((r) => r.json());
  return reciters;
};

export const loadIndex = async () => {
  if (!surahIndex.length) {
    surahIndex = await fetch(`/data/index.json?v=${DV}`).then((r) => r.json());
    computeOffsets(surahIndex);
  }
  return surahIndex;
};

const saadiCache: Record<string, any[]> = {};
const ikCache: Record<string, any[]> = {};

export const loadSaadi = async (s: number): Promise<any[]> => {
  if (!saadiCache[s]) {
    const r = await fetch(`/data/tafsir-saadi/${s}.json?v=${DV}`);
    if (!r.ok) throw new Error('saadi ' + r.status);
    saadiCache[s] = await r.json();
  }
  return saadiCache[s];
};

export const loadIbnKathir = async (s: number): Promise<any[]> => {
  if (!ikCache[s]) {
    const r = await fetch(`/data/tafsir-ibnkathir/${s}.json?v=${DV}`);
    if (!r.ok) throw new Error('ibnkathir ' + r.status);
    ikCache[s] = await r.json();
  }
  return ikCache[s];
};

const pad3 = (x: number) => String(x).padStart(3, '0');
const globalAyah = (s: number, a: number) => (ayahOffset[s] || 0) + a;
const cdnUrl = (r: Reciter, s: number, a: number) =>
  `https://cdn.islamic.network/quran/audio/${r.br}/${r.ed}/${globalAyah(s, a)}.mp3`;

export const eaUrl = (r: Reciter, s: number, a: number) =>
  `https://everyayah.com/data/${r.ea}/${pad3(s)}${pad3(a)}.mp3`;
export const surahUrl = (r: Reciter, s: number) => `${r.srv}${pad3(s)}.mp3`;
export const surahHas = (r: Reciter, s: number) => !(r.skip || []).includes(s);
export const ayahSrc = (r: Reciter, s: number, a: number) => (r.ed ? cdnUrl(r, s, a) : eaUrl(r, s, a));
export const shortName = (r: Reciter) => r.name.split('·')[0].trim();

const FALLBACK_CHAIN = ['binhumaid', 'souilass', 'alafasy'];

export function pickReciterForSurah(r: Reciter, s: number): Reciter {
  if (r.type !== 'surah' || surahHas(r, s)) return r;
  for (const id of FALLBACK_CHAIN) {
    if (id === r.id) continue;
    const c = reciters.find((x) => x.id === id);
    if (c && (c.type !== 'surah' || surahHas(c, s))) return c;
  }
  return reciters.find((x) => x.id === 'alafasy') || reciters[0];
}
