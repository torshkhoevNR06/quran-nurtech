#!/usr/bin/env node
import { createServer } from 'node:http';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

const PORT = Number(process.env.PORT || 4317);
const DATA_FILE = process.env.READ_API_DATA || '/var/lib/quran-read-api/readers.json';
const TOTAL_AYAHS = 6236;
const MAX_BODY = 64 * 1024;

const json = (res, status, data) => {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  });
  res.end(body);
};

const validUid = (v) => typeof v === 'string' && /^[a-zA-Z0-9_.:-]{8,96}$/.test(v);
const asInt = (v, max) => Math.max(0, Math.min(max, Math.round(Number(v) || 0)));
const todayKey = () => new Date().toISOString().slice(0, 10);
const dayNum = (key) => {
  const [y, m, d] = String(key).split('-').map(Number);
  if (!y || !m || !d) return 0;
  return Math.floor(Date.UTC(y, m - 1, d) / 86400000);
};
const safeDayKey = (key) => /^\d{4}-\d{2}-\d{2}$/.test(String(key));

async function loadDb() {
  try {
    const raw = await readFile(DATA_FILE, 'utf8');
    const db = JSON.parse(raw);
    if (db && typeof db === 'object' && db.readers) return db;
  } catch {}
  return { v: 1, readers: {} };
}

async function saveDb(db) {
  await mkdir(dirname(DATA_FILE), { recursive: true });
  const tmp = `${DATA_FILE}.${process.pid}.tmp`;
  await writeFile(tmp, JSON.stringify(db, null, 2));
  await rename(tmp, DATA_FILE);
}

function cleanDays(days) {
  const out = {};
  if (!days || typeof days !== 'object') return out;
  for (const key of Object.keys(days).slice(-180)) {
    if (!safeDayKey(key)) continue;
    const v = days[key] || {};
    out[key] = {
      sec: asInt(v.sec, 86400),
      ayahs: asInt(v.ayahs, TOTAL_AYAHS),
    };
  }
  return out;
}

function mergeDays(prev = {}, next = {}) {
  const out = { ...prev };
  for (const key of Object.keys(next)) {
    const a = out[key] || { sec: 0, ayahs: 0 };
    const b = next[key] || { sec: 0, ayahs: 0 };
    out[key] = {
      sec: Math.max(asInt(a.sec, 86400), asInt(b.sec, 86400)),
      ayahs: Math.max(asInt(a.ayahs, TOTAL_AYAHS), asInt(b.ayahs, TOTAL_AYAHS)),
    };
  }
  return out;
}

function computeStreak(days = {}) {
  const active = Object.keys(days)
    .filter((d) => (days[d]?.sec || 0) > 0 || (days[d]?.ayahs || 0) > 0)
    .sort((a, b) => dayNum(a) - dayNum(b));
  let best = 0;
  let run = 0;
  let prev = 0;
  for (const d of active) {
    const n = dayNum(d);
    run = prev && n === prev + 1 ? run + 1 : 1;
    best = Math.max(best, run);
    prev = n;
  }
  const today = dayNum(todayKey());
  let current = 0;
  const set = new Set(active.map(dayNum));
  let n = set.has(today) ? today : set.has(today - 1) ? today - 1 : 0;
  while (n && set.has(n)) {
    current++;
    n--;
  }
  return { current, best, lastDay: active[active.length - 1] || '' };
}

function publicSummary(db) {
  const readers = Object.values(db.readers || {});
  const now = Date.now();
  const activeToday = readers.filter((r) => now - Number(r.lastSeenAt || 0) < 86400000).length;
  const top = readers
    .slice()
    .sort((a, b) => (b.unitsRead || 0) - (a.unitsRead || 0) || (b.totalSeconds || 0) - (a.totalSeconds || 0))
    .slice(0, 20)
    .map((r) => ({
      device: `Устройство ${String(r.uid).slice(-6)}`,
      unitsRead: r.unitsRead || 0,
      totalSeconds: r.totalSeconds || 0,
      coverage: +(r.coverage || 0),
      streak: computeStreak(r.days).current,
      lastActiveAt: r.lastActiveAt || '',
    }));
  const days = {};
  for (const r of readers) {
    for (const [day, v] of Object.entries(r.days || {})) {
      if (!safeDayKey(day)) continue;
      days[day] = days[day] || { sec: 0, ayahs: 0, devices: 0 };
      days[day].sec += asInt(v.sec, 86400);
      days[day].ayahs += asInt(v.ayahs, TOTAL_AYAHS);
      days[day].devices += (v.sec || v.ayahs) ? 1 : 0;
    }
  }
  return {
    devices: readers.length,
    activeToday,
    totalUnitsRead: readers.reduce((sum, r) => sum + (r.unitsRead || 0), 0),
    totalSeconds: readers.reduce((sum, r) => sum + (r.totalSeconds || 0), 0),
    top,
    days,
  };
}

async function readBody(req) {
  let raw = '';
  for await (const chunk of req) {
    raw += chunk;
    if (raw.length > MAX_BODY) throw new Error('too large');
  }
  return JSON.parse(raw || '{}');
}

async function handleRead(req, res) {
  let body;
  try {
    body = await readBody(req);
  } catch {
    return json(res, 400, { error: 'bad json' });
  }
  if (!validUid(body.uid)) return json(res, 400, { error: 'bad uid' });

  const db = await loadDb();
  const prev = db.readers[body.uid] || {
    uid: body.uid,
    firstSeenAt: Date.now(),
    sessions: 0,
    days: {},
  };
  const sessionId = typeof body.sessionId === 'string' && body.sessionId.length <= 96 ? body.sessionId : '';
  const days = mergeDays(prev.days, cleanDays(body.days));
  const unitsRead = asInt(body.unitsRead, TOTAL_AYAHS);
  const totalSeconds = asInt(body.totalSeconds, 86400 * 365 * 20);
  const coverage = Math.min(1, Math.max(0, Number(body.coverage) || unitsRead / TOTAL_AYAHS));
  const next = {
    ...prev,
    uid: body.uid,
    unitsRead: Math.max(prev.unitsRead || 0, unitsRead),
    totalSeconds: Math.max(prev.totalSeconds || 0, totalSeconds),
    coverage: Math.max(prev.coverage || 0, coverage),
    lastActiveAt: typeof body.lastActiveAt === 'string' ? body.lastActiveAt.slice(0, 40) : new Date().toISOString(),
    lastSeenAt: Date.now(),
    tz: typeof body.tz === 'string' ? body.tz.slice(0, 80) : prev.tz || '',
    days,
    sessions: sessionId && sessionId !== prev.lastSessionId ? (prev.sessions || 0) + 1 : prev.sessions || 0,
    lastSessionId: sessionId || prev.lastSessionId || '',
    streak: computeStreak(days),
  };
  db.readers[body.uid] = next;
  await saveDb(db);
  json(res, 200, { ok: true });
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url || '/', 'http://127.0.0.1');
    if (req.method === 'POST' && url.pathname === '/api/read') return await handleRead(req, res);
    if (req.method === 'GET' && url.pathname === '/api/read/summary') return json(res, 200, publicSummary(await loadDb()));
    if (req.method === 'GET' && url.pathname === '/api/health') return json(res, 200, { ok: true });
    json(res, 404, { error: 'not found' });
  } catch (err) {
    json(res, 500, { error: 'server error' });
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`quran read api listening on 127.0.0.1:${PORT}`);
});
