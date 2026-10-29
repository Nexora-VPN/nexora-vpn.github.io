---
title: "حذف نصب"
description: "پنل یا یک نود را از سرور حذف کنید، و ببینید هر حذف چه چیزهایی را نگه می‌دارد."
order: 11
tags: [install]
---

# حذف نصب

حذف [[~panel|پنل]] یا یک [[~node|نود]]، برنامه و سرویسش را برمی‌دارد. داده‌هایی
که جایگزینی‌شان سخت است، یعنی پایگاه داده و پشتیبان‌های پنل و گواهی‌های نود،
سر جایشان می‌مانند تا وقتی مطمئن شدید خودتان پاکشان کنید.

## پنل {#the-panel}

```bash
bash <(curl -fsSL https://raw.githubusercontent.com/nx-panel/panel/main/install.sh) --uninstall
```

| حذف می‌شود | می‌ماند |
| --- | --- |
| سرویس `nx-panel` | پایگاه داده در `/var/opt/nx-panel` |
| `/opt/nx-panel`، همراه با باینری و `config.json` | پشتیبان‌ها در `/var/opt/nx-panel/backups` |
| دستور `nx-panel` | باینری‌های نود، تم‌ها و رول‌ست‌ها زیر `/var/opt/nx-panel` |

::: danger اول پشتیبان‌هایتان را کپی کنید
اگر خود سرور هم کنار گذاشته می‌شود، پیش از حذف هر چیزی `/var/opt/nx-panel/backups`
را جای دیگری کپی کنید. بعد بقیه را خودتان حذف کنید: `rm -rf /var/opt/nx-panel`.
نودی که روی همین سرور است فایل‌هایش را در `/var/opt/nx-node` نگه می‌دارد و آسیبی
نمی‌بیند.
:::

با PostgreSQL، پایگاه داده درون PostgreSQL است و دست نمی‌خورد.

در Docker، استک را با `docker compose down` در پوشهٔ خودش متوقف کنید. پایگاه
داده، پشتیبان‌ها و داده‌های دیگر در پوشه‌های کنار فایل compose (و برای
PostgreSQL، در volume نام‌دارش) می‌مانند تا وقتی پاکشان کنید.

## نود {#a-node}

از پنل: کشوی **نصب** نود را باز کنید، به **خودکار (SSH)** بروید و از **حذف از
سرور** استفاده کنید. گواهی‌ها سر جایشان می‌مانند، پس اگر بعداً دوباره نصب کنید
پنل همچنان نود را می‌شناسد.

روی سرور نود هم نصب‌کننده آن را حذف می‌کند:

```bash
curl -fsSL https://PANEL/install-node.sh | bash -s -- --uninstall
```

این دستور سرویس یا کانتینر و `/opt/nx-node` را حذف می‌کند، و گواهی‌ها را در
`/var/opt/nx-node/certs` و کش را در `/var/opt/nx-node/cache` باقی می‌گذارد. اگر
این سرور دیگر میزبان نود نخواهد بود، این دو را پاک کنید:

```bash
rm -rf /var/opt/nx-node/certs /var/opt/nx-node/cache
```

یا همه چیز را دستی حذف کنید:

```bash
systemctl disable --now nx-node
rm -f /etc/systemd/system/nx-node.service
systemctl daemon-reload
rm -rf /opt/nx-node /var/opt/nx-node/certs /var/opt/nx-node/cache
```

::: tip پنل روی همین سرور
پنل فایل‌هایش را در `/var/opt/nx-panel` نگه می‌دارد، پس حذف فایل‌های نود به پنل
دست نمی‌زند.
:::

بعد **نود را در پنل هم حذف کنید**. وگرنه همچنان از ظرفیت لایسنس شما کم می‌کند و
آفلاین نشان داده می‌شود.

## مرتبط {#related}

- [[same-server]]: آنچه پنل و نود روی یک سرور مشترک دارند.
- [[files-and-ports]]: همهٔ مسیرهایی که این دو استفاده می‌کنند.
