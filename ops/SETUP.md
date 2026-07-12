# Развёртывание quran.nurtech.dev

VPS: `85.239.36.234` (тот же, что aiengineer.nurtech.dev). **Уже развёрнуто и работает по HTTPS.**
Ниже — как это было сделано и как катить обновления.

## Статус

- DNS: `quran.nurtech.dev A 85.239.36.234` (Timeweb, поддомен привязан) — ✓ резолвится.
- nginx: `/etc/nginx/sites-enabled/quran.nurtech.dev` (см. `ops/nginx-quran.conf`) — ✓.
- SSL: Let’s Encrypt (`certonly --webroot`), автопродление через certbot timer — ✓ (до 2026-10-10).
- Сайт: https://quran.nurtech.dev — ✓ live.

## Повторный деплой (при изменениях кода/данных)

```bash
bash ops/deploy.sh
```

Скрипт: собирает данные + Astro, проверяет, что страниц ≥ 6000, заливает `dist/` в
`/var/www/quran.nurtech.dev` (staging + swap, с бэкапом `.bak` для отката).

Откат: `ssh root@85.239.36.234 'rsync -a --delete /var/www/quran.nurtech.dev.bak/ /var/www/quran.nurtech.dev/'`

## Первичная настройка (уже выполнена; для воспроизведения на новом сервере)

```bash
# 1. DNS: A-запись quran.nurtech.dev -> IP сервера; дождаться dig +short quran.nurtech.dev

# 2. Залить файлы
ssh root@SERVER 'mkdir -p /var/www/quran.nurtech.dev'
rsync -az --delete dist/ root@SERVER:/var/www/quran.nurtech.dev/

# 3. Временный HTTP-конфиг для ACME-челленджа (server_name + root на webroot), включить, reload nginx

# 4. Выпустить сертификат по webroot (не трогает nginx-конфиг)
ssh root@SERVER 'certbot certonly --webroot -w /var/www/quran.nurtech.dev \
  -d quran.nurtech.dev --non-interactive --agree-tos -m blvckxboy@gmail.com'

# 5. Поставить финальный конфиг (с SSL) и перезагрузить
scp ops/nginx-quran.conf root@SERVER:/etc/nginx/sites-available/quran.nurtech.dev
ssh root@SERVER 'ln -sf /etc/nginx/sites-available/quran.nurtech.dev /etc/nginx/sites-enabled/ \
  && nginx -t && systemctl reload nginx'
```
