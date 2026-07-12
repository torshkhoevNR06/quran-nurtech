# Развёртывание quran.nurtech.dev

Разовая настройка поддомена + деплой. VPS: `85.239.36.234` (тот же, что aiengineer.nurtech.dev).

## 1. DNS (нужно сделать руками у регистратора/DNS-провайдера)

Добавить A-запись:

```
quran.nurtech.dev.  A  85.239.36.234
```

(если nurtech.dev на Cloudflare — запись A на 85.239.36.234, прокси можно включить позже).
Проверка: `dig +short quran.nurtech.dev` → должен вернуть `85.239.36.234`.

## 2. nginx (один раз, на VPS)

```bash
# скопировать конфиг из репо на сервер
scp ops/nginx-quran.conf root@85.239.36.234:/etc/nginx/sites-available/quran.nurtech.dev
ssh root@85.239.36.234 '
  ln -sf /etc/nginx/sites-available/quran.nurtech.dev /etc/nginx/sites-enabled/quran.nurtech.dev
  mkdir -p /var/www/quran.nurtech.dev
  nginx -t && systemctl reload nginx
'
```

## 3. SSL (Let’s Encrypt, после того как DNS указывает на сервер)

```bash
ssh root@85.239.36.234 'certbot --nginx -d quran.nurtech.dev --non-interactive --agree-tos -m blvckxboy@gmail.com'
```

## 4. Деплой (каждый раз при изменениях)

```bash
bash ops/deploy.sh
```

Скрипт: собирает данные + Astro, проверяет, что страниц ≥ 6000, заливает `dist/` в
`/var/www/quran.nurtech.dev` (с бэкапом `.bak` для отката).

Откат: `ssh root@85.239.36.234 'rsync -a --delete /var/www/quran.nurtech.dev.bak/ /var/www/quran.nurtech.dev/'`
