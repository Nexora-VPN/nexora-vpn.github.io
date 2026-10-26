---
title: "Установка панели"
description: "Установите панель Nexora одной командой или стеком Docker и получите одноразовую ссылку для настройки."
order: 2
tags: [install, panel]
---

# Установка панели

[[~panel|Панель]] устанавливается одной командой, которая ничего не
спрашивает. Единственное, что она выбирает за вас, — база данных: без неё
панель не может хранить остальные настройки. Всё прочее выбирается в
[[~setup-wizard|мастере настройки]], который открывается при первом заходе в
панель.

Выберите, что установить, и скопируйте команду:

<NxCommandBuilder />

## Установка скриптом {#install-with-the-script}

Запускайте от root. С SQLite, которой не нужна никакая другая служба:

```bash
bash <(curl -fsSL https://raw.githubusercontent.com/nexora-vpn/panel/main/install.sh)
```

В конце установщик печатает ссылку для настройки:

```terminal title="root@server: ~"
$ bash <(curl -fsSL https://raw.githubusercontent.com/nexora-vpn/panel/main/install.sh)
==> installing Nexora Panel (linux-amd64)
==> downloading the panel
==> downloading node binaries
==> migrating the database
database migrated: sqlite
no admin seeded; the panel will open its setup wizard on first start
==> the panel will listen on port 28431
==> Nexora 0.0.3 is installed

  Finish the setup by opening one of these links — whichever address
  reaches this server from where you are:

    http://203.0.113.10:28431/setup?t=9f3c1ad2…    (as the internet sees this host)

  Port 28431 was picked at random and is free on this host — open it in
  the firewall if one is running. The wizard can move it before you finish.

  Service:  systemctl status nexora-panel
  Logs:     journalctl -u nexora-panel -f
```

Откройте ссылку и продолжайте по странице [[setup-wizard]]. Токен в ссылке
создаёт главного администратора, поэтому никому её не показывайте. После
завершения настройки она перестаёт работать.

### Параметры {#options}

| Параметр | Действие |
| --- | --- |
| `--postgres` | установить и настроить PostgreSQL на этом сервере и использовать её вместо SQLite |
| `--version v1.2.3` | установить конкретный выпуск панели вместо самого нового |
| `--node-version v1.2.3` | подготовить для установщиков узлов конкретный выпуск узла вместо самого нового |
| `--uninstall` | удалить панель; см. [[uninstall]] |

### SQLite или PostgreSQL {#sqlite-or-postgresql}

SQLite подходит большинству панелей: один файл, который легко сохранить и
перенести. Выбирайте PostgreSQL, если она у вас уже работает, если база будет
лежать на сетевом хранилище или если одновременно трафик гонят больше
примерно 10 000 пользователей. Чтобы сменить базу позже, установите панель
заново с другой базой и восстановите резервную копию в мастере настройки.

## Установка через Docker {#install-with-docker}

Два стека, по одному на каждую базу:

```bash
git clone https://github.com/nexora-vpn/panel
cd panel/docker/sqlite      # or: cd panel/docker/postgres
docker compose up -d
docker compose logs panel | grep setup
```

Для стека с PostgreSQL перед первым запуском скопируйте `.env.example` в
`.env` и задайте пароль.

Панель в Docker слушает порт 2095. Порт закреплён в файле compose
(`NEXORA_WEB_LISTEN`) вместе с публикацией порта, поэтому мастер не может его
сменить: если нужен другой порт, измените оба места в файле compose.
Дополнительный порт, добавленный на [[use/ingress]], тоже нужно опубликовать
в файле compose.

По умолчанию Docker публикует порты только по IPv4. На сервере только с IPv6
включите IPv6 в демоне Docker (`"ipv6": true` и `"ip6tables": true` в
`/etc/docker/daemon.json`) и публикуйте порт в обоих семействах:

```yaml
    ports:
      - "0.0.0.0:2095:2095"
      - "[::]:2095:2095"
```

Как запустить узел в Docker на том же сервере, см. [[same-server]].

## Требования {#requirements}

- Linux с systemd: Debian 11+, Ubuntu 20.04+, RHEL 9+ или похожий.
  Поддерживаются 64-битные x86 и ARM, а также 32-битные x86 и ARM. Без systemd
  используйте Docker.
- Права root, а также `curl` и `tar` на сервере.
- Один открытый TCP-порт для панели. Позже на [[use/ingress]] можно
  добавить ещё.

## Что делает установщик {#what-the-installer-does}

1. Скачивает панель для архитектуры этого сервера в `/opt/nexora-panel`.
2. Кладёт бинарные файлы узла для amd64 и arm64 в `/var/opt/nexora/bin`.
   Позже панель отдаёт их установщикам узлов, так что узлы скачивают их с
   вашей панели.
3. Записывает `config.json` с подключением к базе, а с `--postgres`
   устанавливает и настраивает PostgreSQL.
4. Создаёт таблицы базы.
5. Выбирает случайный свободный высокий порт, чтобы ещё не настроенная панель
   не висела на порту, который сканеры проверяют первым.
6. Устанавливает и запускает службу `nexora-panel` и добавляет
   `nexora-panel` в PATH для [[reference/cli|командной строки]].
7. Печатает ссылку для настройки для каждого найденного адреса, начиная с
   того, под которым этот сервер видит интернет.

Все пути, которые он использует, перечислены в [[files-and-ports]]. Пока
настройка не завершена, панель отвечает только на ссылку для настройки. Если
позже снова выполнить ту же команду, панель обновится на месте; см.
[[start/update]].

### Потеряли ссылку? {#lost-the-link}

Выведите токен ещё раз и соберите адрес вокруг него:

```bash
nexora-panel setup-token
nexora-panel config get web_listen_port
# then open http://203.0.113.10:PORT/setup?t=TOKEN
```

В Docker: `docker compose exec panel /app/nexora-panel setup-token`.

## IPv6 {#ipv6}

Настраивать ничего не нужно. Панель слушает универсальный адрес IPv6,
который на сервере с двумя стеками отвечает и по IPv4; на сервере с
выключенным IPv6 она сама переходит на IPv4. Ссылка для настройки по IPv6
печатается в квадратных скобках — так её понимает браузер:

```
http://[2001:db8::10]:28431/setup?t=9f3c1ad2…
```

Чтобы слушать только одно семейство адресов, задайте IP для прослушивания в
мастере.
