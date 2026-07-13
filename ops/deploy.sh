#!/usr/bin/env bash
# Деплой quran.nurtech.dev (Astro static) — локальная сборка + rsync dist на VPS.
# По образцу nurtech/ops/deploy-aiengineer-astro.sh (Actions заблокирован биллингом → ручной выкат).
# nginx-конфиг ставится один раз отдельно: см. ops/nginx-quran.conf + ops/SETUP.md.
set -euo pipefail

VPS="${VPS:-root@85.239.36.234}"
DOMAIN="quran.nurtech.dev"
WR="/var/www/${DOMAIN}"
STAGING="/srv/nn/quran-dist"
SSH="ssh -o BatchMode=yes -o ConnectTimeout=15 -o StrictHostKeyChecking=no"

cd "$(dirname "$0")/.."

echo "▶ build (data + astro)"
npm ci --no-audit --no-fund >/dev/null 2>&1 || npm install --no-audit --no-fund >/dev/null
rm -rf .astro node_modules/.astro dist  # чистая сборка: иначе кэш Astro может отдать устаревшие компоненты (напр. старое меню)
npm run build

PAGES=$(find dist -name index.html | wc -l | tr -d ' ')
echo "▶ built pages: ${PAGES}"
if [ "${PAGES}" -lt 6000 ]; then
  echo "✗ подозрительно мало страниц (${PAGES}) — прерываю деплой"
  exit 1
fi

echo "▶ upload dist -> staging"
$SSH "$VPS" "mkdir -p ${STAGING}"
rsync -az -e "$SSH" --delete dist/ "$VPS":"${STAGING}/"

echo "▶ backup + swap"
$SSH "$VPS" "set -e; mkdir -p ${WR}; rm -rf ${WR}.bak; cp -a ${WR} ${WR}.bak 2>/dev/null || true; rsync -a --delete ${STAGING}/ ${WR}/; echo pages=\$(find ${WR} -name index.html | wc -l)"

echo "▶ read analytics api + nginx"
$SSH "$VPS" "mkdir -p /srv/quran-read-api /var/lib/quran-read-api"
rsync -az -e "$SSH" ops/read-api/server.mjs "$VPS":/srv/quran-read-api/server.mjs
rsync -az -e "$SSH" ops/read-api/quran-read-api.service "$VPS":/etc/systemd/system/quran-read-api.service
rsync -az -e "$SSH" ops/nginx-quran.conf "$VPS":/etc/nginx/sites-available/quran.nurtech.dev
$SSH "$VPS" "systemctl daemon-reload && systemctl enable --now quran-read-api && systemctl restart quran-read-api && nginx -t && systemctl reload nginx && curl -fsS http://127.0.0.1:4317/api/health >/dev/null"

echo "✓ deployed https://${DOMAIN}  (откат: rsync ${WR}.bak/ -> ${WR}/)"
