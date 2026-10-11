---
title: "پروتکل‌ها"
description: "همه‌ی پروتکل‌های اینباندی که پنل ارائه می‌دهد: روی چه چیزی اجرا می‌شوند، آیا CDN می‌تواند آن‌ها را حمل کند، و کدام اپ‌های کلاینت آن‌ها را می‌خوانند."
order: 1
tags: [protocols]
---

# پروتکل‌ها

این بخش درباره‌ی انتخاب چیزی است که کاربرهایتان با آن وصل می‌شوند. هر پروتکل یک
[[~inbound|اینباند]] است که یک بار در مخزن مشترک می‌سازید و روی یک
[[~template|قالب]] می‌گذارید. نودهای آن قالب سرویسش می‌دهند و هر کاربر آن قالب
یک ورودی برایش در [[~subscription|اشتراک]] خودش می‌گیرد. طرز ساختنش در
[[use/inbounds]] آمده است. صفحه‌های این بخش فیلدها و محدودیت‌های هر پروتکل را
توضیح می‌دهند.

<NxShot page="inbounds" alt="صفحه‌ی اینباندها: فهرستی از اینباندها با پروتکل، پورت و حالت TLS هر کدام" />

## همه‌ی اینباندها در یک نگاه {#every-inbound-at-a-glance}

**روی چه اجرا می‌شود** همان چیزی است که نود روی آن گوش می‌دهد، یعنی همان چیزی که
فایروال‌تان باید اجازه‌ی ورودش را بدهد. **TLS** حالت‌هایی را نشان می‌دهد که فرم
پیشنهاد می‌کند: یک گواهی (گواهی خود نود، یکی از مخزن گواهی‌های پنل، یا جفت PEM
خودتان)، [[~reality|REALITY]]، یا هیچ. **پشت CDN** می‌گوید آیا یک
[[~front|فرانت دامنه]] می‌تواند آن را حمل کند.

| پروتکل | روی چه اجرا می‌شود | TLS | پشت CDN | صفحه |
| --- | --- | --- | --- | --- |
| VLESS | TCP (با ترنسپورت `quic` یا `mkcp`، UDP) | TLS، REALITY، هیچ | بله، با ترنسپورتی به شکل HTTP و بدون REALITY | [[protocols/vless-reality]] |
| VMess | مثل VLESS | TLS، REALITY، هیچ | مثل VLESS | [[protocols/vmess]] |
| Trojan | مثل VLESS | TLS، REALITY، هیچ | مثل VLESS | [[protocols/trojan]] |
| Shadowsocks | TCP و UDP | هیچ (رمزنگاری خودش) | خیر | [[protocols/shadowsocks]] |
| Hysteria2، Hysteria (v1) | UDP (QUIC) | TLS، اجباری | خیر | [[protocols/hysteria2]] |
| TUIC | UDP (QUIC) | TLS، اجباری | خیر | [[protocols/tuic]] |
| NaiveProxy | TCP (HTTP/2)، به‌اختیار UDP (HTTP/3) | TLS، اجباری | خیر | [[protocols/naive]] |
| AnyTLS | TCP | TLS یا REALITY، اجباری | خیر | [[protocols/more#anytls]] |
| ShadowTLS | TCP | قرض‌گرفته از یک سایت واقعی | خیر | [[protocols/more#shadowtls]] |
| Mieru | TCP یا UDP | هیچ (رمزنگاری خودش) | خیر | [[protocols/more#mieru]] |
| Snell | TCP | هیچ (رمزنگاری خودش) | خیر | [[protocols/more#snell]] |
| MTProxy | TCP | هیچ (رمزنگاری خودش) | خیر | [[protocols/more#mtproxy]] |
| SSH | TCP | رمزنگاری خود SSH | خیر | [[protocols/more#ssh]] |
| TrustTunnel | TCP یا UDP | TLS، اجباری | خیر | [[protocols/more#trusttunnel]] |
| Sudoku | TCP | هیچ (رمزنگاری خودش) | خیر | [[protocols/more#sudoku]] |
| SOCKS، mixed | TCP | هیچ | خیر | [[protocols/more#socks-http-and-mixed]] |
| HTTP | TCP | TLS، REALITY، هیچ | خیر | [[protocols/more#socks-http-and-mixed]] |
| Ingress | TCP | TLS یا هیچ | از راه فرزندانش | [[protocols/ingress]] |
| WireGuard (اندپوینت) | UDP | رمزنگاری خود WireGuard | خیر | [[protocols/wireguard]] |
| OpenVPN (اندپوینت) | UDP یا TCP | TLS (گواهی) | خیر | [[protocols/openvpn]] |
| OpenConnect (اندپوینت) | TCP و UDP | TLS (گواهی) | خیر | [[protocols/openvpn]] |

VLESS، VMess و Trojan یک ترنسپورت می‌گیرند: `tcp (none)`، `ws`، `grpc`، `http`
(HTTP/2)، `httpupgrade`، `quic`، `xhttp` یا `mkcp`. هیچ پروتکل دیگری ترنسپورت
ندارد. CDN می‌تواند آن‌هایی را که شکل HTTP دارند حمل کند: `ws`، `grpc`، `http`،
`httpupgrade` و `xhttp`.

WireGuard، OpenVPN و OpenConnect [[~endpoint|اندپوینت]] هستند و در
[[use/endpoints]] ساخته می‌شوند. از همان راهی به کاربرها می‌رسند که اینباندها
می‌رسند. نوع‌های محلی‌ای که فرم هم فهرست می‌کند (`tun`، `redirect`، `tproxy`،
`direct`) برای مشتری‌ها نیستند. ببینید [[protocols/more]].

## کدام اپ چه چیزی را می‌خواند {#which-apps-read-what}

اشتراک با فرمتی جواب می‌دهد که اپ درخواست کرده است. چهار فرمت مهم‌اند:

- **لینک‌های اشتراک‌گذاری** (`vless://`، `trojan://`، `hysteria2://`…) که تقریباً
  همه‌ی اپ‌ها می‌خوانند، از جمله اپ‌های مبتنی بر Xray (v2rayNG، v2rayN، Streisand،
  Happ).
- **Clash** که Clash Meta و دیگر اپ‌های mihomo می‌خوانند.
- **sing-box** که اپ‌های sing-box (SFA، SFI، Karing، NekoBox) می‌خوانند.
- **Xray JSON** که اپ‌های مبتنی بر Xray می‌خوانند.

ورودی‌ای که اپ نمی‌تواند استفاده کند از فایل آن اپ کنار گذاشته می‌شود. پس یک
کاربر ممکن است در دو اپ دو فهرست متفاوت ببیند.

| پروتکل | لینک اشتراک‌گذاری | Clash | sing-box | Xray JSON |
| --- | --- | --- | --- | --- |
| VLESS | بله | بله | بله، جز با VLESS Encryption | بله، جز بدون TLS یا REALITY، یا با VLESS Encryption |
| VMess، Trojan | بله | بله | بله | بله |
| Shadowsocks | بله | بله | بله | بله |
| Hysteria2 | بله | بله | بله | بله |
| Hysteria، TUIC، AnyTLS | بله | بله | بله | خیر |
| NaiveProxy | بله | خیر | بله | خیر |
| SOCKS، mixed | بله | بله | بله | بله |
| HTTP | خیر | بله | بله | بله |
| SSH | خیر | بله | بله | خیر |
| Mieru | خیر | بله | خیر | خیر |
| Snell | خیر | خیر | بله | خیر |
| ShadowTLS، MTProxy، TrustTunnel، Sudoku | خیر | خیر | خیر | خیر |
| WireGuard | فایل `.conf` | بله | بله | بله |
| OpenVPN | فایل `.ovpn` | خیر | بله | خیر |
| OpenConnect | سرور و اطلاعات ورود | خیر | بله | خیر |

برای VLESS، VMess و Trojan ترنسپورت هم تعیین‌کننده است:

| ترنسپورت | Clash | sing-box | Xray JSON | پشت CDN |
| --- | --- | --- | --- | --- |
| `tcp (none)` | بله | بله | بله | خیر |
| `ws` (WebSocket) | بله | بله | بله | بله |
| `grpc` | بله | بله | بله | بله |
| `http` (HTTP/2) | بله | بله | خیر | بله |
| `httpupgrade` | بله | بله | بله | بله |
| `quic` | خیر | بله | خیر | خیر |
| `xhttp` | خیر | خیر | بله | بله |
| `mkcp` | خیر | خیر | بله | خیر |

لینک‌های اشتراک‌گذاری همه‌ی ترنسپورت‌ها را حمل می‌کنند. اینکه یک اپ خاص بتواند با
آن وصل شود به خود اپ مربوط است.

::: tip به کاربرها بگویید Mux را خاموش کنند
اپ‌های مبتنی بر Xray یک کلید **Mux** دارند. اگر روشن باشد، اتصال شکست می‌خورد و
هیچ چیزی در اپ دلیلش را توضیح نمی‌دهد. [[~subscription-page|صفحه‌ی اشتراک]] درباره‌اش
هشدار می‌دهد. در راهنمای راه‌اندازی خودتان هم تکرارش کنید. ببینید
[[use/subscriptions]].
:::

## چطور انتخاب کنیم {#how-to-choose}

- **با [[protocols/vless-reality|VLESS + REALITY]] شروع کنید.** نه دامنه لازم
  دارد نه گواهی، تقریباً در همه‌ی اپ‌ها کار می‌کند و اولین پیش‌تنظیم در
  **اینباندها ← از روی پیش‌تنظیم** است.
- **یک اینباند WebSocket، gRPC یا [[protocols/xhttp|XHTTP]] با TLS اضافه کنید**
  وقتی می‌خواهید یک CDN جلویش بگذارید. REALITY را نمی‌شود پشت فرانت برد. ببینید
  [[use/fronting]].
- **[[protocols/hysteria2|Hysteria2]] را اضافه کنید** برای کاربرهایی که روی
  شبکه‌های موبایل پراتلاف یا مسیرهای طولانی هستند، جایی که یک پروتکل UDP بهتر از
  TCP دوام می‌آورد. لازم است UDP به نود برسد، و جایی که تک‌پورت‌های UDP مسدودند
  پرش پورت کمک می‌کند.
- **دو یا سه شکل مختلف ارائه کنید.** شبکه‌های مختلف چیزهای مختلفی را مسدود
  می‌کنند. اشتراکی با یک پروتکل TCP، یکی پشت CDN و یکی UDP به کاربر چیزی می‌دهد
  که وقتی یکی از کار افتاد کار کند.
- **از [[protocols/ingress|یک اینگرس]] استفاده کنید** وقتی فقط پورت ۴۴۳ را در
  اختیار دارید و چند اینباند TCP را روی آن می‌خواهید.
- **از [[protocols/wireguard|WireGuard]] یا
  [[protocols/openvpn|OpenVPN / OpenConnect]] استفاده کنید** برای کاربرهایی که
  یک اپ VPN استاندارد، یک روتر، یا لپ‌تاپ کاری‌ای دارند که فقط یکی از این‌ها را
  اجرا می‌کند.

همه‌ی پروتکل‌ها همان حسابداری، سهمیه‌ها، و محدودیت‌های سرعت و آدرس را برای هر
کاربر دارند. انتخاب پروتکل هیچ چیزی را در طرز فروش یک حساب تغییر نمی‌دهد.

## مرتبط {#related}

- [[use/inbounds]]: ساختن، ویرایش و جای‌دادن اینباندها
- [[use/endpoints]]: WireGuard، OpenVPN و OpenConnect
- [[use/certificates]]: گواهی‌هایی که اینباندهای TLS از آن‌ها استفاده می‌کنند
- [[how/subscriptions]]: یک اشتراک چطور ساخته می‌شود
