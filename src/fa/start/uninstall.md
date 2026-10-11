---
title: "حذف نصب"
description: "پنل یا یک نود را از سرور حذف کنید، و ببینید هر حذف چه چیزهایی را نگه می‌دارد."
order: 10
tags: [install]
---

# حذف نصب

حذف [[~panel|پنل]] یا یک [[~node|نود]]، برنامه و سرویسش را برمی‌دارد. داده‌هایی
که جایگزینی‌شان سخت است، یعنی پایگاه داده و پشتیبان‌های پنل و گواهی‌های نود،
سر جایشان می‌مانند تا وقتی مطمئن شدید خودتان پاکشان کنید.

## پنل {#the-panel}

```bash
bash <(curl -fsSL https://raw.githubusercontent.com/nexora-vpn/panel/main/install.sh) --uninstall
```

| حذف می‌شود | می‌ماند |
| --- | --- |
| سرویس `nexora-panel` | پایگاه داده در `/var/opt/nexora` |
| `/opt/nexora-panel`، همراه با باینری و `config.json` | پشتیبان‌ها در `/var/opt/nexora/backups` |
| دستور `nexora-panel` | باینری‌های نود، تم‌ها و رول‌ست‌ها زیر `/var/opt/nexora` |

::: danger اول پشتیبان‌هایتان را کپی کنید
اگر خود سرور قرار است کنار گذاشته شود، پیش از پاک کردن هر چیزی
`/var/opt/nexora/backups` را جای دیگری کپی کنید. بعد بقیه را خودتان حذف کنید:
`rm -rf /var/opt/nexora`. اگر نودی روی همین سرور اجرا می‌شود، این کار را بدون
خواندن بخش بعدی انجام ندهید.
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

این دستور سرویس یا کانتینر و `/opt/nexora-node` را حذف می‌کند، و گواهی‌ها را در
`/var/opt/nexora/certs` و کش را در `/var/opt/nexora/cache` باقی می‌گذارد. اگر
این سرور دیگر میزبان نود نخواهد بود، این دو را پاک کنید:

```bash
rm -rf /var/opt/nexora/certs /var/opt/nexora/cache
```

یا همه چیز را دستی حذف کنید:

```bash
systemctl disable --now nexora-node
rm -f /etc/systemd/system/nexora-node.service
systemctl daemon-reload
rm -rf /opt/nexora-node /var/opt/nexora/certs /var/opt/nexora/cache
```

::: danger پنل روی همین سرور
روی سروری که پنل هم روی آن اجرا می‌شود، هرگز کل `/var/opt/nexora` را حذف
نکنید. این پوشه پایگاه دادهٔ پنل را در خود دارد. فقط `certs` و `cache` را حذف
کنید.
:::

بعد **نود را در پنل هم حذف کنید**. وگرنه همچنان از ظرفیت لایسنس شما کم می‌کند و
آفلاین نشان داده می‌شود.

## مرتبط {#related}

- [[same-server]]: آنچه پنل و نود روی یک سرور مشترک دارند.
- [[files-and-ports]]: همهٔ مسیرهایی که این دو استفاده می‌کنند.
