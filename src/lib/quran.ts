// Доступ к данным Корана на этапе сборки (SSG). Читаем vendored JSON из data/.
// Пути от корня проекта (process.cwd()) — стабильно и в dev, и при бандле в dist/.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const DATA = join(ROOT, 'data');
const PUBLIC_DATA = join(ROOT, 'public', 'data');

const readJson = <T>(p: string): T => JSON.parse(readFileSync(p, 'utf8')) as T;

export interface SurahMeta {
  n: number; // номер суры 1..114
  na: string; // арабское название
  ne: string; // транслит названия
  nr: string; // русское название
  nm: string; // перевод названия
  t: string; // "мекканская" | "мединская"
  c: number; // количество аятов
  slug: string; // slug из транслита (для быстрого перехода)
}

export interface Ayah {
  n: number; // номер аята в суре
  ar: string; // арабский текст (Усмани)
  tj: string; // арабский с таджвид-разметкой
  ru: string; // перевод Кулиева
  aa?: string; // перевод Абу Аделя
}

export interface Surah {
  n: number;
  na: string;
  ne: string;
  nr: string;
  nm: string;
  t: string;
  c: number;
  bism: boolean; // есть ли басмала перед сурой
  a: Ayah[];
}

export interface TafsirBlock {
  f: number; // от аята
  t: number; // до аята (включительно)
  x: string; // текст тафсира ас-Саади
}

let _surahs: SurahMeta[] | null = null;
export function getSurahs(): SurahMeta[] {
  if (!_surahs) _surahs = readJson<SurahMeta[]>(join(PUBLIC_DATA, 'index.json'));
  return _surahs;
}

export function getSurahMeta(n: number): SurahMeta | undefined {
  return getSurahs().find((s) => s.n === n);
}

const _surahCache = new Map<number, Surah>();
export function getSurah(n: number): Surah {
  if (!_surahCache.has(n)) _surahCache.set(n, readJson<Surah>(join(DATA, 'quran', `${n}.json`)));
  return _surahCache.get(n)!;
}

const _tafsirCache = new Map<number, TafsirBlock[]>();
export function getTafsir(n: number): TafsirBlock[] {
  if (!_tafsirCache.has(n)) {
    try {
      _tafsirCache.set(n, readJson<TafsirBlock[]>(join(DATA, 'tafsir', `${n}.json`)));
    } catch {
      _tafsirCache.set(n, []);
    }
  }
  return _tafsirCache.get(n)!;
}

// Тафсир ас-Саади для конкретного аята (находим блок, покрывающий аят).
export function getTafsirForAyah(surahN: number, ayahN: number): TafsirBlock | undefined {
  return getTafsir(surahN).find((b) => ayahN >= b.f && ayahN <= b.t);
}

// Тафсир Ибн Касира — по аятам: [{ a, x }].
export interface IbnKathirBlock {
  a: number; // номер аята
  x: string; // текст тафсира
}
const _ikCache = new Map<number, IbnKathirBlock[]>();
export function getIbnKathir(n: number): IbnKathirBlock[] {
  if (!_ikCache.has(n)) {
    try {
      _ikCache.set(n, readJson<IbnKathirBlock[]>(join(DATA, 'tafsir-ibnkathir', `${n}.json`)));
    } catch {
      _ikCache.set(n, []);
    }
  }
  return _ikCache.get(n)!;
}
export function getIbnKathirForAyah(surahN: number, ayahN: number): IbnKathirBlock | undefined {
  return getIbnKathir(surahN).find((b) => b.a === ayahN);
}

export interface Reciter {
  id: string;
  name: string;
  ed?: string; // редакция islamic.network (напр. ar.alafasy) — для type 'ayah'
  br?: number; // битрейт islamic.network
  ea?: string; // папка EveryAyah (фолбэк) — для type 'ayah'
  type?: 'ayah' | 'surah'; // по умолчанию 'ayah'
  srv?: string; // базовый URL по-суровых файлов (mp3quran) — для type 'surah'
  skip?: number[]; // суры, которых нет у по-сурового чтеца
}
let _reciters: Reciter[] | null = null;
export function getReciters(): Reciter[] {
  if (!_reciters) _reciters = readJson<Reciter[]>(join(PUBLIC_DATA, 'reciters.json'));
  return _reciters;
}

// Список переводов/тафсиров (для верхней панели и роутов). MVP: Кулиев + ас-Саади.
export interface Translation {
  id: string;
  name: string;
  short: string;
  kind: 'translation' | 'tafsir';
  available: boolean;
}
export const TRANSLATIONS: Translation[] = [
  { id: 'kuliev', name: 'Эльмир Кулиев', short: 'Кулиев', kind: 'translation', available: true },
  { id: 'abuadel', name: 'Абу Адель', short: 'Абу Адель', kind: 'translation', available: true },
  { id: 'saadi', name: 'Тафсир ас-Саади', short: 'ас-Саади', kind: 'tafsir', available: true },
  { id: 'ibn-kathir', name: 'Тафсир Ибн Касира', short: 'Ибн Касир', kind: 'tafsir', available: true },
];
export const DEFAULT_TRANSLATION = 'saadi';
export const isTranslation = (id: string) => TRANSLATIONS.some((t) => t.id === id && t.available);

// Номер аята вида "2:255"
export const ref = (s: number, a: number) => `${s}:${a}`;
