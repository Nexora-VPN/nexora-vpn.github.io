---
title: "فهرست رویدادها"
description: "همهٔ رویدادهایی که پنل منتشر می‌کند: خانواده، دامنهٔ دسترسی لازم برای شنیدنش، فیلدهای محتوا، و پاکت امضاشده‌ای که در آن می‌رسد."
order: 4
tags: [reference, events]
---

# فهرست رویدادها

همهٔ [[~event|رویدادهایی]] که پنل منتشر می‌کند، همراه با دامنهٔ دسترسی‌ای که
شنونده برای شنیدنش لازم دارد و فیلدهایی که با خود می‌آورد. مشترک‌های وبهوک،
افزونه‌ها، چت‌های تلگرام و آدرس‌های ایمیل همه از همین فهرست انتخاب می‌کنند. برای
تنظیم یک مشترک [[webhooks]] را ببینید؛ برای اینکه رویدادها چطور صف و تحویل
می‌شوند [[how/events]] را.

همین فهرست را خود پنل در `GET /api/v1/events` سرو می‌کند، که هر توکن API
می‌تواند بخواندش.

## پاکت {#the-envelope}

هر رویداد به صورت یک `POST` با بدنهٔ JSON به وبهوک می‌رسد:

```json
{
  "v": 1,
  "id": 4182,
  "event": "user.quota_warning",
  "time": 1760180000,
  "data": {
    "userId": 57,
    "name": "alice",
    "adminId": 3,
    "usedPercent": 81,
    "threshold": 80,
    "used": 86973087744,
    "volume": 107374182400
  },
  "recipients": [3]
}
```

| فیلد | |
| --- | --- |
| `v` | نسخهٔ پاکت، `1` |
| `id` | شناسهٔ رویداد: برای همهٔ مشترک‌ها و در هر تلاش دوباره یکسان است |
| `event` | نام رویداد |
| `time` | زمان انتشار، به ثانیهٔ Unix |
| `data` | محتوا: فیلدهایی که برای هر رویداد در ادامه آمده |
| `recipients` | شناسهٔ مدیرهایی که رویداد دربارهٔ آن‌هاست، وقتی دربارهٔ یکی باشد؛ در غیر این صورت نیست |

زمان‌ها در محتوا ثانیهٔ Unix و ارقام ترافیک بایت‌اند. محتوا هرگز گذرواژه، کلید یا
لینک اشتراک ندارد؛ اگر لازمشان دارید با یک توکن از API بخوانیدشان.

## هدرها و امضا {#headers-and-signature}

| هدر | |
| --- | --- |
| `Content-Type` | `application/json` |
| `User-Agent` | `nexora-panel` |
| `X-Nexora-Event` | نام رویداد |
| `X-Nexora-Delivery` | شناسهٔ تحویل: در هر تلاش دوباره و با **ارسال دوباره** یکسان است |
| `X-Nexora-Signature` | `t=<unix seconds>,v1=<hex>`، وقتی مشترک کلید امضا داشته باشد |

`v1` مقدار hex از HMAC-SHA256 روی زمان، یک نقطه و بدنهٔ خام است، با کلید امضای
مشترک:

```text
v1 = hex( HMAC-SHA256( secret, "<t>" + "." + <raw body bytes> ) )
```

گیرنده باید:

1. بدنهٔ خام را پیش از تجزیه بخواند؛ بدنه‌ای که دوباره سریال شده مطابقت ندارد.
2. `v1` را با کلیدش دوباره حساب کند و در زمان ثابت مقایسه کند.
3. درخواستی را که `t` آن بیش از پنج دقیقه با ساعت خودش فاصله دارد رد کند، تا
   تحویلی که شنود شده بعداً قابل تکرار نباشد.
4. سریع با `2xx` جواب دهد. هر جواب دیگر، یا نبود جواب در ده ثانیه، شکست است و
   دوباره تلاش می‌شود.

در Python:

```python
import hashlib, hmac, time

def verify(secret: bytes, header: str, body: bytes, max_skew: int = 300) -> bool:
    parts = dict(p.strip().split("=", 1) for p in header.split(",") if "=" in p)
    t, v1 = parts.get("t"), parts.get("v1")
    if not t or not v1 or abs(time.time() - int(t)) > max_skew:
        return False
    mac = hmac.new(secret, t.encode() + b"." + body, hashlib.sha256).hexdigest()
    return hmac.compare_digest(mac, v1)
```

برای اینکه هر رویداد را یک بار پردازش کنید، مقدارهای `id` را که پردازش کرده‌اید
نگه دارید. بازیابی از پشتیبان شناسه‌های همان پشتیبان را برمی‌گرداند، پس گیرنده‌ای
که شناسه‌ها را در طول بازیابی به خاطر می‌سپارد، با رسیدن
`panel.restore_applied` باید از نو شروع کند.

## چه کسی چه چیزی را می‌شنود {#who-hears-what}

**دامنهٔ دسترسی.** هر رویداد دامنهٔ دسترسی‌ای را که شنونده لازم دارد نام می‌برد.
افزونه فقط وقتی می‌تواند رویدادی را بخواهد که توکنش هم همان دامنه را داشته باشد،
و صفحهٔ رضایت هر دو را نشان می‌دهد (دامنهٔ `:write` شامل `:read` متناظرش هم
هست). چت تلگرام یا آدرس ایمیل فقط وقتی رویدادی را می‌شنود که نقش حسابش آن دامنه
را داشته باشد. وبهوکی که مدیر اصلی دستی اضافه کند هر رویدادی را که فیلترش نام
ببرد می‌شنود.

**خانواده‌ها.** بخش پیش از نقطه خانواده است و مسیر رویداد را تعیین می‌کند:

| خانواده | دربارهٔ | به یک حساب اشاره می‌کند |
| --- | --- | --- |
| `user.*` | حساب یک مشتری | بله: `adminId` نماینده‌ای است که صاحب آن است (۰ برای پنل) |
| `node.*` | یک نود | خیر |
| `admin.*` | حساب یک اپراتور | بله: `adminId` همان حساب است |
| `panel.*` | خود پنل | خیر |

مشترکی که روی **فقط رویدادهای مربوط به** یک حساب تنظیم شده، و چت یا آدرس هر
نماینده، فقط رویدادهایی را می‌گیرد که به همان حساب اشاره کنند. پس رویدادهای
`node.*` و `panel.*` هرگز به نماینده نمی‌رسند.

**کار گروهی یک رویداد منتشر می‌کند.** یک عملیات گروهی در صفحهٔ کاربرها یک
`user.bulk` منتشر می‌کند، و ساختن دسته‌ای از حساب‌ها یک `user.generated`، به هر
تعداد حسابی که دست زده باشند.

## user.* {#user}

هر رویداد `user.*` این سه فیلد را دارد، به‌علاوهٔ فیلدهای ردیف خودش:

| فیلد | نوع | |
| --- | --- | --- |
| `userId` | عدد صحیح | شناسهٔ حساب |
| `name` | رشته | نام حساب |
| `adminId` | عدد صحیح | نماینده‌ای که صاحب آن است؛ ۰ برای پنل |

| رویداد | دامنه | کی منتشر می‌شود | فیلدهای بیشتر |
| --- | --- | --- | --- |
| `user.created` | `users:read` | حسابی ساخته شد. | |
| `user.deleted` | `users:read` | حسابی حذف شد. | |
| `user.enabled` | `users:read` | پنل حسابی را دوباره روشن کرد، مثلاً بعد از تمدید یا صفر کردن مصرف. | |
| `user.disabled` | `users:read` | پنل حسابی را خاموش کرد. `reason` یکی از `volume`، `expiry`، `resale-volume` یا `resale-expiry` است. | `reason` |
| `user.quota_reached` | `users:read` | حالت ترافیکی `user.disabled`: حساب هر چه را خریده بود مصرف کرد. | `reason` |
| `user.expired` | `users:read` | حالت تاریخی `user.disabled`: زمان حساب تمام شد. | `reason` |
| `user.quota_warning` | `users:read` | حساب از آستانهٔ **مصرف ترافیک** (پیش‌فرض ۸۰٪) گذشت. یک بار برای هر سقف و آستانه. | `usedPercent`، `threshold`، `used`، `volume` |
| `user.expiring` | `users:read` | حساب وارد یکی از بازه‌های **روز مانده به انقضا** شد (پیش‌فرض ۷ و ۱). یک بار برای هر بازه. | `expiry`، `daysLeft`، `threshold` |
| `user.renewed` | `users:read` | حساب تمدید شد. تاریخ و ترافیک تازه‌اش را دارد. | `expiry`، `volume` |
| `user.activated` | `users:read` | پلنی که با اولین اتصال شروع می‌شود شروع شد؛ انقضا حالا ثابت است. | `expiry` |
| `user.first_fetch` | `users:read` | یک کلاینت برای اولین بار پیکربندی‌های حساب را گرفت. `client` نام اپ است. | `client` |
| `user.device_limit_reached` | `users:read` | اشتراک به یک دستگاه داده نشد چون محدودیت دستگاه حساب پر است. حداکثر یک بار برای هر دستگاه در ساعت. | `hwid`، `limit` |

دو رویداد `user.*` به جای سه فیلد بالا فیلدهای خودشان را دارند:

| رویداد | دامنه | کی منتشر می‌شود | فیلدها |
| --- | --- | --- | --- |
| `user.bulk` | `users:read` | یک عملیات گروهی تمام شد. `op` عملیات است؛ `ids` حساب‌هایی است که به آن‌ها رسید؛ `adminId` نماینده است، وقتی نماینده انجامش داده باشد. | `op`، `matched`، `affected`، `blocked`، `failed`، `actor`، `adminId`، `ids` |
| `user.generated` | `users:read` | دسته‌ای از حساب‌ها از روی یک الگوی نام ساخته شد. | `pattern`، `count`، `skipped`، `planId`، `actor`، `adminId` |

آستانه‌ها در صفحهٔ [[webhooks]] تنظیم می‌شوند.

## node.* {#node}

بیشتر رویدادهای `node.*` شناسه و نام نود را دارند:

| رویداد | دامنه | کی منتشر می‌شود | فیلدها |
| --- | --- | --- | --- |
| `node.connected` | `nodes:read` | نودی شروع به جواب دادن به پنل کرد. `warnings` هر چیزی را که اجرا نمی‌کند فهرست می‌کند. | `nodeId`، `name`، `status`، `message`، `warnings` |
| `node.disconnected` | `nodes:read` | نودی دیگر جواب نداد. `message` خطاست. | `nodeId`، `name`، `status`، `message`، `warnings` |
| `node.limit_reached` | `nodes:read` | نودی به سقف ترافیک دوره‌ای‌اش رسید و خاموش شد. `period` دوره است. | `nodeId`، `name`، `used`، `limit`، `period` |
| `node.disk_high` | `nodes:read` | فایل‌سیستم ریشهٔ نود از **مصرف دیسک** (پیش‌فرض ۹۰٪) گذشت. یک بار برای هر عبور. | فیلدهای میزبان |
| `node.disk_recovered` | `nodes:read` | دست‌کم پنج واحد زیر آستانه برگشت. | فیلدهای میزبان |
| `node.memory_high` | `nodes:read` | حافظهٔ نود از **مصرف حافظه** (پیش‌فرض ۹۰٪) گذشت. یک بار برای هر عبور. | فیلدهای میزبان |
| `node.memory_recovered` | `nodes:read` | دست‌کم پنج واحد زیر آستانه برگشت. | فیلدهای میزبان |
| `node.rejections_high` | `nodes:read` | نود در یک ساعت بیش از **اتصال‌های ردشده در ساعت** (پیش‌فرض ۱۰۰) اتصال را از راه یک اوتباند مسدودکننده رد کرد. `outbound` تگ آن اوتباند است؛ `window` برابر `1h` است. یک بار برای هر عبور. | `nodeId`، `name`، `outbound`، `count`، `threshold`، `window` |

فیلدهای میزبان این‌هاست: `nodeId`، `name`، `resource` (`disk` یا `memory`)،
`usedPercent`، `threshold`، `used` و `total` (بایت). دیسک و حافظه هر پنج دقیقه
خوانده می‌شوند.

## admin.* {#admin}

| رویداد | دامنه | کی منتشر می‌شود | فیلدها |
| --- | --- | --- | --- |
| `admin.login` | `admins:write` | یک اپراتور وارد شد. | `adminId`، `username`، `ip` |
| `admin.login_failed` | `admins:write` | یک ورود رد شد. `username` همان چیزی است که تایپ شده؛ `stage` برای کد دومرحله‌ای اشتباه برابر `mfa` است. | `username`، `ip`، `stage` |
| `admin.login_new_ip` | `admins:write` | یک اپراتور از آدرسی غیر از آدرس ورود قبلی‌اش وارد شد. | `adminId`، `username`، `ip`، `previousIp` |
| `admin.2fa_changed` | `admins:write` | یک اپراتور ورود دومرحله‌ای را روشن یا خاموش کرد. | `adminId`، `username`، `enabled` |
| `admin.owner_changed` | `admins:write` | پنل به مدیر اصلی دیگری سپرده شد. `previous` حسابی است که آن را واگذار کرد. | `adminId`، `username`، `previous` |
| `admin.resale_cap_reached` | `admins:write` | نماینده سهمیه‌اش را تمام کرد یا حسابش منقضی شد؛ کاربرهایش هم همراهش آفلاین شدند. `reason` برابر `volume` یا `expiry` است. | `adminId`، `username`، `reason`، `used`، `volume` |

## panel.* {#panel}

| رویداد | دامنه | کی منتشر می‌شود | فیلدها |
| --- | --- | --- | --- |
| `panel.started` | `stats:read` | پنل بالا آمد. `restored` می‌گوید در این میان یک بازیابی اعمال شده است. | `version`، `listen`، `restored` |
| `panel.stopping` | `stats:read` | پنل به‌درستی خاموش می‌شود، از جمله در راه‌اندازی مجدد. `panel.started` بدون `panel.stopping` پیش از آن یعنی پنل غیرمنتظره متوقف شده است. | `version` |
| `panel.crashed` | `stats:read` | هنگام جواب دادن به یک درخواست خطای داخلی‌ای گرفته شد؛ پنل هنوز در حال اجراست. حداکثر یک بار برای هر مسیر و پیام در هر پنج دقیقه. | `method`، `path`، `error`، `version` |
| `panel.setup_completed` | `settings:read` | ویزارد راه‌اندازی تمام شد و مدیر اصلی وجود دارد. | `username`، `restart` |
| `panel.settings_changed` | `settings:read` | یک تنظیم سراسری پنل (آدرس، TLS، مسیر پایه و مانند آن) تغییر کرد. مقدار هرگز فرستاده نمی‌شود. | `setting`، `actor` |
| `panel.restore_applied` | `users:read` | یک پشتیبان روی این پنل بازیابی شد. | `superseded`، `tables`، `rows` |
| `panel.backup_done` | `backup:read` | پشتیبان‌گیری زمان‌بندی‌شده یک فایل نوشت. | `name`، `size` |
| `panel.backup_failed` | `backup:read` | پشتیبان‌گیری زمان‌بندی‌شده شکست خورد؛ در کمتر از یک ساعت دوباره تلاش می‌شود. | `error` |
| `panel.backup_upload_failed` | `backup:read` | یک فایل به مقصد پشتیبان نرسید. همچنان روی سرور پنل هست. | `destination`، `name`، `error` |
| `panel.cert_renewed` | `certificates:read` | گواهی‌ای که پنل مدیریتش می‌کند تمدید شد. | فیلدهای گواهی |
| `panel.cert_renew_failed` | `certificates:read` | یک تمدید شکست خورد؛ هر شش ساعت دوباره تلاش می‌شود. | فیلدهای گواهی، `error` |
| `panel.cert_expiring` | `certificates:read` | گواهی‌ای که بارگذاری کرده‌اید به پایانش نزدیک است؛ پنل نمی‌تواند تمدیدش کند. یک بار برای هر گواهی. | فیلدهای گواهی |
| `panel.ruleset_refresh_failed` | `pool:read` | تازه‌سازی ساعتی رول‌ست‌ها شکست خورد. | `error` |
| `panel.update_available` | `stats:read` | نسخهٔ جدیدتری از پنل وجود دارد. `version` نسخهٔ تازه است و `current` نسخهٔ در حال اجرا. یک بار برای هر نسخه. | `version`، `current`، `url` |
| `panel.license_changed` | `license:write` | وضعیت لایسنس تغییر کرد: دارای لایسنس، منقضی یا رایگان، یا محدودیت‌های تازه. | `licensed`، `reason`، `previousReason`، `licenseId`، `issuedTo`، `expiresAt`، `limits` |
| `panel.license_expiring` | `license:write` | لایسنس تا ۳۰، ۱۴، ۷ یا ۱ روز دیگر تمام می‌شود. یک بار برای هر آستانه. بعد از تاریخ هیچ مهلتی نیست. | `licenseId`، `issuedTo`، `expiresAt`، `daysLeft`، `threshold` |
| `panel.license_unverified` | `license:write` | پنل چند روز است نتوانسته لایسنسش را تأیید کند. `deadline` زمانی است که اگر این وضع ادامه یابد پنل به سطح رایگان برمی‌گردد. | `licenseId`، `verifiedAt`، `deadline`، `daysLeft` |
| `panel.ip_banned` | `security:read` | محافظت ورود یک آدرس را مسدود کرد. | `ip`، `until`، `reason` |
| `panel.addon_registered` | `tokens:write` | یک افزونه ثبت شد. | فیلدهای افزونه |
| `panel.addon_removed` | `tokens:write` | یک افزونه همراه با توکن و وبهوکش حذف شد. خود افزونه، فیلترش هر چه باشد، اول همین رویداد را می‌گیرد. | فیلدهای افزونه |
| `panel.addon_unhealthy` | `tokens:write` | مسیر سلامت یک افزونه دو بار پشت سر هم شکست خورد. یک بار برای هر عبور. | فیلدهای افزونه، `error` |
| `panel.addon_recovered` | `tokens:write` | افزونهٔ ناسالم دوباره به مسیر سلامتش جواب داد. | فیلدهای افزونه |
| `panel.addon_update_waiting` | `tokens:write` | نسخهٔ جدیدتر یک افزونهٔ امضاشده بیش از آنچه دارد می‌خواهد و منتظر تأیید است. | فیلدهای افزونه، `version` |
| `panel.ping` | هر کدام | رویداد آزمایشی که **ارسال رویداد آزمایشی** به یک مشترک می‌فرستد. | `subscriberId`، `name`، `by` |

فیلدهای گواهی این‌هاست: `kind` (`node` یا `panel`)، `certificateId`، `nodeId`،
`name` و `notAfter`. فیلدهای افزونه: `addonId`، `slug`، `name` و `signed`.

برای اینکه رویدادهای لایسنس برای پنل شما چه معنایی دارند [[licence]] را ببینید؛
برای افزونه‌ها [[use/addons]] را.

## مرتبط {#related}

- [[webhooks]]: مشترک‌ها، تلاش‌های دوباره و آستانه‌ها.
- [[how/events]]: صف و تحویل رویدادها چطور کار می‌کند.
- [[telegram]] و [[email]]: رویدادها برای آدم‌ها.
- [[reference/api]]: APIای که شنونده اطلاعات بیشتر را از آن می‌خواند.
