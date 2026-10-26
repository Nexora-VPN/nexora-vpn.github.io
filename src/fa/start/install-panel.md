---
title: "نصب پنل"
description: "پنل نکسورا را با یک دستور یا یک استک Docker نصب کنید و لینک راه‌اندازی یک‌بارمصرف را بگیرید."
order: 2
tags: [install, panel]
---

# نصب پنل

[[~panel|پنل]] با یک دستور نصب می‌شود که هیچ سؤالی نمی‌پرسد. تنها انتخابی که
به جای شما می‌کند پایگاه داده است، چون پنل پیش از ذخیرهٔ هر تنظیم دیگری به
پایگاه داده نیاز دارد. بقیهٔ انتخاب‌ها در
[[~setup-wizard|ویزارد راه‌اندازی]] انجام می‌شود که اولین بار که پنل را باز
می‌کنید نمایش داده می‌شود.

انتخاب کنید چه چیزی نصب شود و دستور را کپی کنید:

<NxCommandBuilder />

## نصب با اسکریپت {#install-with-the-script}

آن را با کاربر root اجرا کنید. با SQLite، که به هیچ سرویس دیگری نیاز ندارد:

```bash
bash <(curl -fsSL https://raw.githubusercontent.com/nexora-vpn/panel/main/install.sh)
```

نصب‌کننده در پایان لینک راه‌اندازی را چاپ می‌کند:

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

لینک را باز کنید و با [[setup-wizard]] ادامه دهید. توکن داخل لینک مدیر اصلی را
می‌سازد، پس آن را خصوصی نگه دارید. وقتی راه‌اندازی تمام شود، دیگر کار نمی‌کند.

### گزینه‌ها {#options}

| گزینه | اثر |
| --- | --- |
| `--postgres` | PostgreSQL را روی همین سرور نصب و پیکربندی می‌کند و به جای SQLite از آن استفاده می‌کند |
| `--version v1.2.3` | به جای جدیدترین نسخه، نسخهٔ مشخصی از پنل را نصب می‌کند |
| `--node-version v1.2.3` | به جای جدیدترین نسخه، نسخهٔ مشخصی از نود را برای نصب‌کننده‌های نود آماده می‌کند |
| `--uninstall` | پنل را حذف می‌کند؛ [[uninstall]] را ببینید |

### SQLite یا PostgreSQL {#sqlite-or-postgresql}

SQLite برای بیشتر پنل‌ها مناسب است: یک فایل، که پشتیبان‌گیری و جابه‌جایی‌اش
آسان است. PostgreSQL را وقتی انتخاب کنید که از قبل یکی دارید، وقتی پایگاه داده
روی فضای ذخیره‌سازی شبکه قرار می‌گیرد، یا وقتی بیش از حدود ۱۰٬۰۰۰ کاربر هم‌زمان
ترافیک دارند. برای تغییر در آینده، از نو با پایگاه دادهٔ دیگر نصب کنید و در
ویزارد راه‌اندازی یک پشتیبان را بازیابی کنید.

## نصب با Docker {#install-with-docker}

دو استک، یکی برای هر پایگاه داده:

```bash
git clone https://github.com/nexora-vpn/panel
cd panel/docker/sqlite      # or: cd panel/docker/postgres
docker compose up -d
docker compose logs panel | grep setup
```

برای استک PostgreSQL، پیش از اولین اجرا `.env.example` را به `.env` کپی کنید و
یک گذرواژه در آن بگذارید.

پنل Docker روی پورت ۲۰۹۵ گوش می‌دهد. این پورت در فایل compose
(`NEXORA_WEB_LISTEN`) همراه با نگاشت پورت منتشرشده ثابت شده است، پس ویزارد
نمی‌تواند آن را جابه‌جا کند: اگر پورت دیگری می‌خواهید، هر دو را در فایل compose
تغییر دهید. هر پورت دیگری که در [[use/ingress]] اضافه شود هم باید در فایل compose
منتشر شود.

Docker به طور پیش‌فرض پورت‌ها را فقط روی IPv4 منتشر می‌کند. روی سروری که فقط
IPv6 دارد، IPv6 را در سرویس Docker فعال کنید (`"ipv6": true` و
`"ip6tables": true` در `/etc/docker/daemon.json`) و روی هر دو خانواده منتشر
کنید:

```yaml
    ports:
      - "0.0.0.0:2095:2095"
      - "[::]:2095:2095"
```

برای اجرای یک نود روی همین سرور با Docker، [[same-server]] را ببینید.

## پیش‌نیازها {#requirements}

- لینوکس با systemd: Debian 11+، Ubuntu 20.04+، RHEL 9+ یا مشابه. x86 و ARM
  ۶۴ بیتی، و x86 و ARM ۳۲ بیتی پشتیبانی می‌شوند. بدون systemd، از Docker
  استفاده کنید.
- دسترسی root، و `curl` و `tar` روی سرور.
- یک پورت TCP باز برای پنل. بعداً می‌توان در [[use/ingress]] پورت‌های بیشتری
  اضافه کرد.

## نصب‌کننده چه می‌کند {#what-the-installer-does}

1. پنل را برای معماری این سرور در `/opt/nexora-panel` دانلود می‌کند.
2. باینری‌های نود را برای amd64 و arm64 در `/var/opt/nexora/bin` آماده می‌کند.
   پنل بعداً این‌ها را به نصب‌کننده‌های نود می‌دهد، پس نودها از پنل خودتان
   دانلود می‌کنند.
3. `config.json` را با اتصال پایگاه داده می‌نویسد، و با `--postgres`
   PostgreSQL را نصب و پیکربندی می‌کند.
4. جدول‌های پایگاه داده را می‌سازد.
5. یک پورت بالای آزاد را تصادفی انتخاب می‌کند، تا پنلی که هنوز کسی
   راه‌اندازی‌اش نکرده روی پورتی نباشد که اسکنرها اول سراغش می‌روند.
6. سرویس `nexora-panel` را نصب و اجرا می‌کند، و `nexora-panel` را برای
   [[reference/cli|خط فرمان]] در PATH قرار می‌دهد.
7. برای هر آدرسی که پیدا کرده یک لینک راه‌اندازی چاپ می‌کند، و اول آدرسی را
   می‌آورد که اینترنت این سرور را با آن می‌بیند.

همهٔ مسیرهایی که استفاده می‌کند در [[files-and-ports]] آمده است. تا وقتی
راه‌اندازی تمام نشده، پنل فقط به لینک راه‌اندازی جواب می‌دهد. اجرای دوبارهٔ همین
دستور در آینده پنل را درجا به‌روز می‌کند؛ [[start/update]] را ببینید.

### لینک را گم کرده‌اید؟ {#lost-the-link}

توکن را دوباره چاپ کنید و آدرس را دور آن بسازید:

```bash
nexora-panel setup-token
nexora-panel config get web_listen_port
# then open http://203.0.113.10:PORT/setup?t=TOKEN
```

در Docker: `docker compose exec panel /app/nexora-panel setup-token`.

## IPv6 {#ipv6}

به هیچ پیکربندی‌ای نیاز نیست. پنل روی همهٔ آدرس‌های IPv6 گوش می‌دهد، که روی سرور
دوپشته به IPv4 هم جواب می‌دهد؛ روی سروری که IPv6 آن خاموش است خودش به IPv4
برمی‌گردد. لینک راه‌اندازی IPv6 با کروشه چاپ می‌شود، که مرورگر به آن نیاز دارد:

```
http://[2001:db8::10]:28431/setup?t=9f3c1ad2…
```

برای گوش دادن فقط روی یک خانوادهٔ آدرس، آی‌پی شنود را در ویزارد تنظیم کنید.
