---
title: "پایش و معیارها"
description: "پنل چطور نودهایش را زیر نظر دارد: تاریخچه‌ی سلامت و نوار uptime، اتصال‌های زنده در صورت نیاز، endpoint معیارهای Prometheus، و هشدارهایی که به شکل رویداد ایجاد می‌شوند."
order: 12
tags: [monitoring]
---

# پایش و معیارها

[[~panel|پنل]] هر [[~node|نود]] را خودش زیر نظر دارد و آنچه دیده را نگه می‌دارد. این
صفحه توضیح می‌دهد چه چیزی ثبت می‌کند، نوار uptime چطور تصمیم می‌گیرد چه رنگی بزند،
اتصال‌های زنده چطور خوانده می‌شوند، و endpoint معیارها چه چیزی منتشر می‌کند. هر قاعده
در اینجا از یک ایده پیروی می‌کند: **پنل چیزی را نشان می‌دهد که می‌داند، و وقتی
نمی‌داند همین را می‌گوید**، به‌جای اینکه صفر یا قطعی‌ای بکشد که نمی‌تواند ثابتش کند.

## ضربان چه چیزی به پنل می‌گوید {#what-the-heartbeat-tells-the-panel}

هر ۱۵ ثانیه هر نود گزارش می‌دهد که آیا چیزی را که به آن داده شده اجرا می‌کند، اتصال‌های
بازش در کل و برای هر اینباند، هسته‌اش چند بار ری‌استارت شده و آخرین خطای راه‌اندازی‌اش،
و آمار اتصال‌هایی که اوتباندهای block آن رد کرده‌اند. پنل تا وقتی نود جواب می‌دهد
این‌ها را در حافظه نگه می‌دارد. نودی که دیگر جواب ندهد «گزارش نشده» نشان داده می‌شود،
هرگز آخرین اعدادش.

## تاریخچه‌ی سلامت {#health-history}

پنل هر ۵ دقیقه آمار میزبان هر نود وصل را از آن می‌پرسد: دیسک، حافظه و بار. هر خوانش
فوراً روی نود نشان داده و در تاریخچه‌ی سلامت ذخیره می‌شود.

- **۷ روز گذشته** همه‌ی خوانش‌های ۵ دقیقه‌ای را نگه می‌دارد.
- **خوانش‌های قدیمی‌تر** به یکی برای هر نود در هر ساعت فشرده می‌شوند، میانگین
  خوانش‌هایی که هر عدد را داشته‌اند.
- **تاریخچه به‌طور پیش‌فرض ۹۰ روز نگه داشته می‌شود**، تا دو سال. ۰ ثبت را متوقف و آن
  را خالی می‌کند.
- **خوانشی که در آن نود هیچ چیزی گزارش نکرده هرگز ذخیره نمی‌شود.** نودی که نمی‌تواند
  آمار میزبان گزارش دهد اصلاً تاریخچه ندارد، به‌جای تاریخچه‌ای از صفرها.

## نوار uptime {#the-uptime-bar}

نوار روی یک نود یک بازه‌ی زمانی را به سه وضعیت تقسیم می‌کند:

| وضعیت | نمایش | معنا |
| --- | --- | --- |
| بالا | **بالا** | پنل در آن بازه خوانشی از نود دارد |
| پایین | **گزارش نمی‌داد** | پنل در تمام بازه در حال اجرا بوده و نود هیچ خوانشی نداده است |
| نامعلوم | **پایش نشده** | پنل نمی‌تواند بگوید: خاموش بوده، نود هنوز وجود نداشته، یا نود هرگز خوانشی تولید نکرده است |

نوار **هرگز قطعی‌ای را که نمی‌تواند ثابت کند رنگ نمی‌زند**. بازه‌ای فقط وقتی پایین
شمرده می‌شود که یک اجرای پنل تمام آن را زیر نظر داشته و چیزی نشنیده باشد. بازه‌ی کنار
یک ری‌استارت پنل نامعلوم است، نه پایین. نودی که هرگز آمار میزبان گزارش نکرده، چون روی
سکویی است که نمی‌تواند، ممکن است کاملاً درست سرویس بدهد، پس نوارش به‌جای قرمز نامعلوم
می‌ماند.

برای تشخیص «پنل خاموش بود» از «نود پایین بود»، پنل هر اجرای خودش را ثبت می‌کند: کی
شروع شده، آخرین بار کی زنده بوده، و آیا تمیز متوقف شده است. نوار در ۷ روز گذشته از
بازه‌های ۵ دقیقه‌ای و فراتر از آن از بازه‌های ساعتی استفاده می‌کند، مطابق تاریخچه‌ی
ذخیره‌شده.

## اتصال‌های زنده در صورت نیاز {#live-connections-on-demand}

هیچ چیزی از نودها به پنل جریان ندارد. نود فهرست اتصال‌های زنده‌اش را در حافظه نگه
می‌دارد، و پنل وقتی شما نگاه می‌کنید می‌پرسد:

- **تعدادها** برای یک کاربر هم‌زمان از همه‌ی نودهای وصل می‌آیند، از مجموع‌هایی که هر
  نود به‌روز نگه می‌دارد، پس پرسیدنش ارزان است.
- **ردیف‌ها** (مبدأ، مقصد، قانون، اوتباند، شبکه، عمر، بایت‌ها) هر بار از یک نود
  می‌آیند، تا وقتی پنجره باز است هر ۱۰ ثانیه تازه می‌شوند، جدیدترین اول و حداکثر ۵۰۰
  ردیف. تعدادها حتی وقتی ردیف‌ها بریده شوند کامل می‌مانند.
- **مقصد وضعیت زنده است، هرگز رکورد نیست.** پنل ثبت نمی‌کند کاربرها به کجا وصل
  می‌شوند.

**بستن** اتصال‌های یک کاربر برای هر اینباند، هر اوتباند، هر نود یا همه‌جا کار می‌کند.
این مسدود کردن نیست: اپ با بسته‌ی بعدی‌اش دوباره وصل می‌شود، مگر اینکه کاربر خاموش هم
شده باشد.

## endpoint معیارها {#the-metrics-endpoint}

پنل آمارش را در `/metrics` با فرمت Prometheus منتشر می‌کند، برای Prometheus و Grafana
خودتان. راه‌اندازی آن‌ها، یک داشبورد آماده‌ی Grafana و نام همه‌ی معیارها
[پایین‌تر](#prometheus-and-grafana) آمده است.

- **توکن لازم دارد.** از یک [[~api-token|توکن API]] فقط با scope `stats:read` استفاده
  کنید. این سند همه‌ی نودها و آدرسشان را نام می‌برد، پس حالت باز ندارد.
- **همه‌چیز برای هر نود، برای هر دسته‌ی ثابت یا برای کل ناوگان است.** هیچ چیزی برای
  هر کاربر برچسب نمی‌خورد: یک برچسب برای هر حساب یعنی یک سری برای هر حساب، که به مدت
  نگه‌داری شما نگه داشته می‌شود. پرسش‌ها درباره‌ی یک حساب را API گزارش‌های پنل
  (`/api/reports/*`) جواب می‌دهد، در دوره‌ای که خودتان انتخاب می‌کنید.
- **غایب، نه صفر.** عددی که نود گزارش نکرده (دیسک، حافظه، بار، اتصال‌ها، ری‌استارت‌ها،
  کاربرهای آنلاین) اصلاً سری ندارد. شکاف در نمودار یعنی پنل نمی‌داند، نه اینکه عدد
  پایین آمده است.
- **تنها استثنا** تعداد تحویل‌های رویداد بر اساس وضعیت است که همیشه منتشر می‌شود،
  تا هشداری روی تحویل‌های مرده بتواند فعال شود.
- **اتصال‌های ردشده** برای هر نود و هر اوتباند block منتشر می‌شوند.

هر scrape از روی پایگاه داده و اعداد زنده در همان لحظه حساب می‌شود، پس بازه‌ی scrape
۶۰ ثانیه‌ای چیزی از دست نمی‌دهد.

## Prometheus و Grafana {#prometheus-and-grafana}

مخزن پنل یک پیکربندی scrape برای Prometheus، یک داشبورد Grafana و یک compose overlay
دارد که هر دو را کنار پنل Docker اجرا می‌کند.

### با Docker {#with-docker}

overlay به شبکه‌ی compose پنل می‌پیوندد و با نام سرویس به پنل می‌رسد؛ پنل به پورت
منتشرشده‌ی اضافه‌ای نیاز ندارد.

```bash
# 1. Fetch the monitoring directory next to your docker-compose.yml
curl -fsSL https://github.com/nexora-vpn/panel/archive/refs/heads/main.tar.gz \
  | tar -xz --strip-components=1 panel-main/monitoring

# 2. Put a token with the stats:read scope where Prometheus reads it
printf '%s' 'PASTE-THE-TOKEN' > monitoring/prometheus/token

# 3. Set Grafana's password
cp monitoring/.env.example .env      # or merge its lines into your .env
nano .env

# 4. Start everything
docker compose -f docker-compose.yml -f monitoring/docker-compose.monitoring.yml up -d
```

از آن به بعد هر دو فایل `-f` را نگه دارید، وگرنه یک `docker compose up -d` ساده دو
سرویس را دوباره حذف می‌کند. برای اینکه خودکار شود:

```bash
echo 'COMPOSE_FILE=docker-compose.yml:monitoring/docker-compose.monitoring.yml' >> .env
```

Grafana فقط روی loopback سرور گوش می‌دهد. از راه SSH به آن برسید:

```bash
ssh -L 3000:localhost:3000 you@your-server
# then open http://localhost:3000 and sign in with GRAFANA_PASSWORD
```

داشبورد **Nexora fleet** از قبل آنجاست. Prometheus اصلاً منتشر نمی‌شود: ورود خودش را
ندارد و کل تصویر عملیاتی شما را در خود دارد.

- **پنل خودش HTTPS سرو می‌کند:** در `monitoring/prometheus/prometheus.yml`،
  `scheme: https` و `tls_config: { insecure_skip_verify: true }` را تنظیم کنید. گواهی
  پنل نام میزبان عمومی شما را دارد، نه نام سرویس `panel` که Prometheus به آن وصل
  می‌شود.
- **پنل مسیر پایه دارد:** `metrics_path: /your-base-path/metrics` را تنظیم کنید.
- **برای پنل نام میزبان تعیین شده:** `/metrics` فقط روی همان نام جواب می‌دهد. در فایل
  compose خودتان آن نام را به‌عنوان network alias به سرویس پنل بدهید
  (`networks: { default: { aliases: [panel.example.com] } }`) و
  `panel.example.com:2095` را scrape کنید.

### بدون Docker {#without-docker}

```yaml
scrape_configs:
  - job_name: nexora-panel
    scheme: https
    metrics_path: /metrics
    authorization:
      type: Bearer
      credentials_file: /etc/prometheus/nexora-token
    static_configs:
      - targets: ['panel.example.com']
```

برای Grafana، فایل `monitoring/grafana/dashboards/nexora-fleet.json` را از
[مخزن پنل](https://github.com/nexora-vpn/panel) وارد کنید. یک datasource از نوع
Prometheus با uid `nexora-prometheus` انتظار دارد.

### توکن {#the-token}

آن را در صفحه‌ی [[use/tokens|توکن‌های API]] فقط با scope `stats:read` و نه هیچ چیز
دیگری بسازید، و آن را در فایل جداگانه‌ای نگه دارید، نه درون `prometheus.yml` که معمولاً
در چت‌ها چسبانده می‌شود. لغو توکن scrape را فوراً متوقف می‌کند.

### چه چیزی منتشر می‌شود {#what-is-exported}

| معیار | معنا |
| --- | --- |
| `nexora_panel_build_info` | ۱، با نسخه‌ی در حال اجرا به‌عنوان برچسب |
| `nexora_panel_start_time_seconds` | زمان شروع پروسه‌ی پنل؛ `time() - this` مدت uptime آن است |
| `nexora_license_valid` | ۱ تا وقتی لایسنس معتبر است، در غیر این صورت ۰ |
| `nexora_license_expires_at_seconds` | انقضای لایسنس؛ وقتی منقضی نمی‌شود غایب است |
| `nexora_license_limit{resource}`، `nexora_license_used{resource}` | سقف و شمار برای `user` و `node` (‎−1 = نامحدود) |
| `nexora_users_total{status}` | حساب‌ها بر اساس وضعیت: active، disabled، expired، limited، pending |
| `nexora_users_online` | حساب‌هایی که در بازه‌ی آنلاین ترافیک داشته‌اند |
| `nexora_nodes_total` | نودهایی که پنل می‌شناسد |
| `nexora_node_up`، `nexora_node_enabled` | برای هر نود: جواب می‌دهد، و روشن است |
| `nexora_node_traffic_bytes_total{direction}` | ترافیکی که به حساب نود گذاشته شده |
| `nexora_node_online_users` | حساب‌هایی که در بازه‌ی آنلاین روی آن نود ترافیک داشته‌اند |
| `nexora_node_connections`، `nexora_node_engine_restarts_total` | اتصال‌های باز؛ ری‌استارت‌ها از زمان شروع نود |
| `nexora_node_rejected_connections_total{outbound}` | اتصال‌هایی که یک اوتباند block رد کرده |
| `nexora_node_disk_bytes`، `nexora_node_disk_used_bytes`، `nexora_node_memory_bytes`، `nexora_node_memory_used_bytes`، `nexora_node_load1` | میزبان نود |
| `nexora_event_deliveries{status}`، `nexora_event_subscribers` | تحویل‌های رویداد بر اساس وضعیت (pending، delivered، dead) و مشترک‌های فعال |

هر معیار نود برچسب‌های `node` (نامش) و `id` را دارد.

### هشدارهایی که ارزش داشتن دارند {#alerts-worth-having}

```yaml
groups:
  - name: nexora
    rules:
      - alert: NexoraPanelDown
        expr: up{job="nexora-panel"} == 0
        for: 5m
      - alert: NexoraNodeDown          # a switched-off node is not an outage
        expr: nexora_node_up == 0 and nexora_node_enabled == 1
        for: 10m
      - alert: NexoraNodeDiskFilling
        expr: nexora_node_disk_used_bytes / nexora_node_disk_bytes > 0.9
        for: 30m
      - alert: NexoraEventDeliveriesDead
        expr: increase(nexora_event_deliveries{status="dead"}[1h]) > 0
```

اگر با لایسنس می‌فروشید، `nexora_license_expires_at_seconds - time() < 7 * 86400` را هم
اضافه کنید.

## هشدارها به شکل رویداد {#alerts-as-events}

پنل چند چیز را خودش می‌سنجد و وقتی تغییر کنند یک [[~event|رویداد]] ایجاد می‌کند، یک
بار در هر عبور از آستانه و یک بار دیگر هنگام برگشت:

| رویداد | کی |
| --- | --- |
| `node.disconnected`، `node.connected` | نودی دیگر جواب نمی‌دهد یا دوباره جواب می‌دهد |
| `node.disk_high`، `node.disk_recovered` | مصرف دیسک از آستانه می‌گذرد، به‌طور پیش‌فرض ۹۰٪؛ پنج واحد پایین‌تر از آن برگشته حساب می‌شود |
| `node.memory_high`، `node.memory_recovered` | همین، برای حافظه |
| `node.rejections_high` | ردشده‌ها از راه یک اوتباند block از نرخی در ساعت می‌گذرند، به‌طور پیش‌فرض ۱۰۰ |
| `node.limit_reached` | محدودیت ترافیک دوره‌ای یک نود آن را خاموش کرده است |

آستانه‌ها در صفحه‌ی **وب‌هوک‌ها** تعیین می‌شوند؛ ۰ یک هشدار را خاموش می‌کند. نرخ رد
شدن در یک ساعت لغزان، از روی چیزی که خود پنل مشاهده کرده، اندازه گرفته می‌شود؛ پس آمار
بزرگی که در اولین ضربان پنل بعد از ری‌استارت گزارش شود تاریخچه است، نه یک انفجار.
رویدادها به وبهوک‌ها، تلگرام، ایمیل و افزونه‌ها می‌رسند؛ ببینید [[how/events]].

## صفحه‌های مرتبط {#related-pages}

- [[use/dashboard]]: ناوگان در یک نگاه.
- [[use/nodes]]: نمودار سلامت و نوار uptime یک نود.
- [[how/accounting]]: ترافیک و تعداد آنلاین چطور حساب می‌شوند.
