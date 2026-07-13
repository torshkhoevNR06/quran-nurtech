#!/usr/bin/env node
// Пересобирает data/tafsir-saadi из quran-online.ru.
// Важное отличие от spa5k: привязку к аятам берём из hint-{s}-{a}-{i}, где a —
// конец пассажa. Пассаж разворачиваем в поаятный формат [{a,x}].
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const QDIR = join(ROOT, 'data', 'quran');
const SDIR = join(ROOT, 'data', 'tafsir-saadi');
const CACHE = join(ROOT, '.cache', 'quran-online-saadi');
const USER_AGENT = 'quran-nurtech-tafsir-import/1.0 (+https://quran.nurtech.dev)';
const DELAY_MS = Number(process.env.QURAN_ONLINE_DELAY_MS || 300);
const REFRESH = process.argv.includes('--refresh');

if (!existsSync(SDIR)) mkdirSync(SDIR, { recursive: true });
if (!existsSync(CACHE)) mkdirSync(CACHE, { recursive: true });

const sleep = (ms) => new Promise((res) => setTimeout(res, ms));
const readJson = (p) => JSON.parse(readFileSync(p, 'utf8'));
const index = readJson(join(QDIR, 'index.json'));

function decodeEntities(s) {
  const named = {
    amp: '&',
    lt: '<',
    gt: '>',
    quot: '"',
    apos: "'",
    nbsp: ' ',
    laquo: '«',
    raquo: '»',
    ndash: '–',
    mdash: '—',
  };
  return String(s || '').replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (_, ent) => {
    if (ent[0] === '#') {
      const hex = ent[1]?.toLowerCase() === 'x';
      const n = Number.parseInt(ent.slice(hex ? 2 : 1), hex ? 16 : 10);
      return Number.isFinite(n) ? String.fromCodePoint(n) : _;
    }
    return named[ent] ?? _;
  });
}

function cleanHtml(raw) {
  return decodeEntities(String(raw || '').replace(/<[^>]+>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim();
}

function extractHints(html, s) {
  const re = new RegExp(`<span data-id='hint-${s}-(\\d+)-(\\d+)' class='hint sup-\\d+'>`, 'g');
  const byEnd = new Map();
  for (let m; (m = re.exec(html)); ) {
    const a = Number(m[1]);
    const hintIndex = Number(m[2]);
    const start = m.index + m[0].length;
    let depth = 1;
    let i = start;
    while (depth > 0) {
      const nextOpen = html.indexOf('<span', i);
      const nextClose = html.indexOf('</span>', i);
      if (nextClose === -1) throw new Error(`sura ${s}: unclosed hint at ayah ${a}`);
      if (nextOpen !== -1 && nextOpen < nextClose) {
        depth++;
        i = nextOpen + 5;
      } else {
        depth--;
        i = nextClose + 7;
      }
    }
    const raw = html.slice(start, i - 7);
    const text = cleanHtml(raw);
    if (!text) continue;
    if (!byEnd.has(a)) byEnd.set(a, []);
    byEnd.get(a).push({ hintIndex, text });
  }
  return Array.from(byEnd.entries())
    .map(([a, parts]) => ({
      a,
      x: parts
        .sort((p, q) => p.hintIndex - q.hintIndex)
        .map((p) => p.text)
        .join('\n\n'),
    }))
    .sort((p, q) => p.a - q.a);
}

function toPassages(hints, s, count) {
  const passages = [];
  let prev = 0;
  for (const h of hints) {
    if (h.a <= prev) throw new Error(`sura ${s}: non-increasing hint ending ${h.a} after ${prev}`);
    if (h.a > count) throw new Error(`sura ${s}: hint ending ${h.a} > ayah count ${count}`);
    passages.push({ f: prev + 1, t: h.a, x: h.x });
    prev = h.a;
  }
  if (prev !== count) throw new Error(`sura ${s}: hints cover 1..${prev}, expected 1..${count}`);
  return passages;
}

function expandPassages(passages) {
  const out = [];
  for (const p of passages) {
    for (let a = p.f; a <= p.t; a++) out.push({ a, x: p.x });
  }
  return out;
}

async function fetchHtml(s) {
  const cacheFile = join(CACHE, `${s}.html`);
  if (!REFRESH && existsSync(cacheFile)) return readFileSync(cacheFile, 'utf8');
  const url = `https://quran-online.ru/${s}/saadi`;
  const r = await fetch(url, { headers: { 'User-Agent': USER_AGENT, Accept: 'text/html' } });
  if (!r.ok) throw new Error(`${url}: HTTP ${r.status}`);
  const html = await r.text();
  writeFileSync(cacheFile, html);
  await sleep(DELAY_MS);
  return html;
}

function validateSurah(s, count, out, oldLen) {
  if (out.length !== count) throw new Error(`sura ${s}: got ${out.length} rows, expected ${count}`);
  for (let i = 0; i < count; i++) {
    if (out[i].a !== i + 1) throw new Error(`sura ${s}: row ${i} has ayah ${out[i].a}`);
    if (!out[i].x) throw new Error(`sura ${s}: empty tafsir at ayah ${out[i].a}`);
  }
  const newLen = out.reduce((sum, x) => sum + x.x.length, 0);
  if (oldLen > 1000 && newLen < oldLen * 0.55) {
    throw new Error(`sura ${s}: suspiciously short text ${newLen} vs old ${oldLen}`);
  }
  return newLen;
}

let totalRows = 0;
let totalLen = 0;
for (const meta of index) {
  const s = meta.n;
  const count = meta.c;
  const oldPath = join(SDIR, `${s}.json`);
  const old = existsSync(oldPath) ? readJson(oldPath) : [];
  const oldLen = old.reduce((sum, x) => sum + String(x.x || '').length, 0);
  const html = await fetchHtml(s);
  const hints = extractHints(html, s);
  if (!hints.length) throw new Error(`sura ${s}: no hints extracted`);
  const passages = toPassages(hints, s, count);
  const out = expandPassages(passages);
  const len = validateSurah(s, count, out, oldLen);
  writeFileSync(oldPath, JSON.stringify(out));
  totalRows += out.length;
  totalLen += len;
  console.log(`sura ${String(s).padStart(3, ' ')}: hints=${hints.length}, rows=${out.length}, chars=${len}`);
}

const check = (s, a) => readJson(join(SDIR, `${s}.json`)).find((x) => x.a === a)?.x || '';
const c112 = check(112, 1);
const c114 = check(114, 1);
const c3 = check(3, 2);
if (/Абу Ла[хһ]аб/i.test(c112)) throw new Error('control 112:1 still mentions Abu Lahab');
if (!/Единственн|самодостаточ|твердой уверенност/i.test(c112)) throw new Error('control 112:1 does not look like Al-Ikhlas');
if (/фалак|раскалывать/i.test(c114)) throw new Error('control 114:1 still looks like Al-Falaq');
if (!/прибег|защит|Господ[ау] людей/i.test(c114)) throw new Error('control 114:1 does not look like An-Nas');
if (/Смысл этих букв неизвестен/i.test(c3)) throw new Error('control 3:2 still has shifted letter commentary');
if (!/Жив|Вседержител/i.test(c3)) throw new Error('control 3:2 does not look like Ayat 3:2');

console.log(`Готово: ${totalRows} поаятных записей, ${totalLen} символов тафсира ас-Саади.`);
