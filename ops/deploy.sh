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

echo "✓ deployed https://${DOMAIN}  (откат: rsync ${WR}.bak/ -> ${WR}/)"
