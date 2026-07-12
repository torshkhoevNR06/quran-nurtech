#!/usr/bin/env node
// Готовит public/data/ из vendored-датасета в data/:
//   - index.json       — метаданные 114 сур (+ slug для быстрого перехода)
//   - search-index.json — {s,a,r} по всем 6236 аятам (русский текст Кулиева) для клиентского поиска
//   - reciters.json    — список чтецов (EveryAyah folders)
// Источник текста/тафсира: data/quran/*.json, data/tafsir/*.json (см. /about — источники).
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DATA = join(ROOT, 'data');
const OUT = join(ROOT, 'public', 'data');
if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });

const readJson = (p) => JSON.parse(readFileSync(p, 'utf8'));

// slug из транслит-названия: "Al-Faatiha" -> "al-faatiha"
const slugify = (s) =>
  String(s || '')
    .toLowerCase()
    .replace(/['`ʼʾ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

// ---- 1. индекс сур ----
const index = readJson(join(DATA, 'quran', 'index.json'));
const surahs = index.map((s) => ({
  n: s.n,
  na: s.na, // арабское название
  ne: s.ne, // транслит
  nr: s.nr, // русское название
  nm: s.nm, // перевод названия
  t: s.t, // мекканская/мединская
  c: s.c, // число аятов
  slug: slugify(s.ne),
}));
writeFileSync(join(OUT, 'index.json'), JSON.stringify(surahs));

// ---- 2. поисковый индекс (русский текст) ----
const searchIndex = [];
let totalAyahs = 0;
for (const s of surahs) {
  const surah = readJson(join(DATA, 'quran', `${s.n}.json`));
  for (const ayah of surah.a) {
    totalAyahs++;
    searchIndex.push({ s: s.n, a: ayah.n, r: ayah.ru });
  }
}
writeFileSync(join(OUT, 'search-index.json'), JSON.stringify(searchIndex));

// ---- 3. чтецы (EveryAyah) ----
// Аудио строится как https://everyayah.com/data/<folder>/<SSS><AAA>.mp3
const reciters = [
  { id: 'alafasy', name: 'Мишари Рашид аль-Афаси', folder: 'Alafasy_128kbps' },
  { id: 'qatami', name: 'Нассир аль-Катами', folder: 'Nasser_Alqatami_128kbps' },
  { id: 'ghamdi', name: 'Саад аль-Гамиди', folder: 'Ghamadi_40kbps' },
  { id: 'shuraim', name: 'Сауд аш-Шурейм', folder: 'Saood_ash-Shuraym_128kbps' },
  { id: 'shatri', name: 'Абубакр аш-Шатри', folder: 'Abu_Bakr_Ash-Shaatree_128kbps' },
  { id: 'luhaidan', name: 'Мухаммад аль-Люхайдан', folder: 'Muhammad_al_Luhaidan_128kbps' },
  { id: 'minshawi', name: 'Мухаммад Сиддик аль-Миншави', folder: 'Minshawy_Murattal_128kbps' },
  { id: 'hudhaify', name: 'Али аль-Хузейфи', folder: 'Hudhaify_128kbps' },
  { id: 'dossari', name: 'Ясир ад-Даусари', folder: 'Yasser_Ad-Dussary_128kbps' },
  { id: 'husary', name: 'Махмуд Халиль аль-Хусари', folder: 'Husary_128kbps' },
];
writeFileSync(join(OUT, 'reciters.json'), JSON.stringify(reciters));

console.log(
  `[build-data] сур: ${surahs.length}, аятов: ${totalAyahs}, чтецов: ${reciters.length} -> public/data/`
);
