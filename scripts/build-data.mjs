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
// Полный поиск: по Кулиеву(r), Абу Аделю(aa), транслиту(tl), арабскому(ar).
const searchIndex = [];
let totalAyahs = 0;
for (const s of surahs) {
  const surah = readJson(join(DATA, 'quran', `${s.n}.json`));
  for (const ayah of surah.a) {
    totalAyahs++;
    searchIndex.push({
      s: s.n,
      a: ayah.n,
      r: ayah.ru,
      aa: ayah.aa || '',
      tl: ayah.tl || '',
      ar: ayah.ar || '',
    });
  }
}
writeFileSync(join(OUT, 'search-index.json'), JSON.stringify(searchIndex));

// ---- 3. чтецы ----
// Аудио: основной источник — Cloudflare CDN islamic.network (надёжен глобально, вкл. РФ):
//   https://cdn.islamic.network/quran/audio/<br>/<ed>/<globalAyah 1..6236>.mp3
// Фолбэк при ошибке — EveryAyah: https://everyayah.com/data/<ea>/<SSS><AAA>.mp3
// Битрейт (br) у каждой редакции свой — проверено, что файлы существуют.
const reciters = [
  { id: 'alafasy', name: 'Мишари Рашид аль-Афаси', ed: 'ar.alafasy', br: 128, ea: 'Alafasy_128kbps' },
  { id: 'husary', name: 'Махмуд Халиль аль-Хусари', ed: 'ar.husary', br: 128, ea: 'Husary_128kbps' },
  { id: 'minshawi', name: 'Мухаммад Сиддик аль-Миншави', ed: 'ar.minshawi', br: 128, ea: 'Minshawy_Murattal_128kbps' },
  { id: 'sudais', name: 'Абдуррахман ас-Судайс', ed: 'ar.abdurrahmaansudais', br: 192, ea: 'Abdurrahmaan_As-Sudais_192kbps' },
  { id: 'abdulbasit', name: 'Абдуль-Басит Абдус-Самад', ed: 'ar.abdulbasitmurattal', br: 192, ea: 'Abdul_Basit_Murattal_192kbps' },
  { id: 'shuraim', name: 'Сауд аш-Шурейм', ed: 'ar.saoodshuraym', br: 64, ea: 'Saood_ash-Shuraym_128kbps' },
  { id: 'shatri', name: 'Абубакр аш-Шатри', ed: 'ar.shaatree', br: 128, ea: 'Abu_Bakr_Ash-Shaatree_128kbps' },
  { id: 'maher', name: 'Махер аль-Муайкли', ed: 'ar.mahermuaiqly', br: 128, ea: 'MaherAlMuaiqly128kbps' },
  { id: 'hudhaify', name: 'Али аль-Хузейфи', ed: 'ar.hudhaify', br: 128, ea: 'Hudhaify_128kbps' },
  { id: 'ayyoub', name: 'Мухаммад Айюб', ed: 'ar.muhammadayyoub', br: 128, ea: 'Muhammad_Ayyoub_128kbps' },
  // По-суровые чтецы (mp3quran.net): целая сура одним файлом <srv>/<NNN>.mp3.
  // skip — суры, которых у чтеца нет (не читал/не записаны) → фолбэк на чтеца по умолчанию.
  {
    id: 'binhumaid',
    name: 'Ахмад Талиб бин Хумайд',
    type: 'surah',
    srv: 'https://server16.mp3quran.net/a_binhameed/Rewayat-Hafs-A-n-Assem/',
    skip: [9, 14, 16, 17, 23, 24, 33],
  },
  {
    id: 'souilass',
    name: 'Юнус ас-Сувейлис · Марокко (Варш)',
    type: 'surah',
    srv: 'https://server16.mp3quran.net/souilass/Rewayat-Warsh-A-n-Nafi/',
    skip: [
      3, 4, 5, 6, 7, 8, 9, 44, 49, 55, 58, 59, 60, 61, 62, 63, 64, 65, 66, 68, 69, 70, 72, 74, 75,
      83, 84, 85, 87, 88, 92, 94, 96, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110,
      111, 113, 114,
    ],
  },
];
writeFileSync(join(OUT, 'reciters.json'), JSON.stringify(reciters));

console.log(
  `[build-data] сур: ${surahs.length}, аятов: ${totalAyahs}, чтецов: ${reciters.length} -> public/data/`
);
