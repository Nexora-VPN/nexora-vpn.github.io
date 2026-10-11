---
title: "Протоколы"
description: "Все протоколы инбаундов, которые предлагает панель: поверх чего они работают, может ли их нести CDN и какие клиентские приложения их читают."
order: 1
tags: [protocols]
---

# Протоколы

Этот раздел помогает выбрать, через что будут подключаться ваши пользователи.
Каждый протокол — это [[~inbound|инбаунд]], который вы один раз создаёте в
общем пуле и добавляете в [[~template|шаблон]]. Узлы этого шаблона его
обслуживают, а каждый пользователь шаблона получает для него запись в своей
[[~subscription|подписке]]. Как создать инбаунд, описано в [[use/inbounds]];
страницы этого раздела объясняют поля и ограничения каждого протокола.

<NxShot page="inbounds" alt="Страница инбаундов: список инбаундов с протоколом, портом и режимом TLS" />

## Все инбаунды кратко {#every-inbound-at-a-glance}

**Работает поверх** — то, что слушает узел, и значит, то, что должен пропускать
ваш файрвол. **TLS** перечисляет режимы, которые предлагает форма: сертификат
(собственный сертификат узла, сертификат из хранилища панели или ваша пара
PEM), [[~reality|REALITY]] или без TLS. **За CDN** показывает, может ли его
нести [[~front|доменный фронт]].

| Протокол | Работает поверх | TLS | За CDN | Страница |
| --- | --- | --- | --- | --- |
| VLESS | TCP (UDP с транспортом `quic` или `mkcp`) | TLS, REALITY, без TLS | да, с HTTP-подобным транспортом и без REALITY | [[protocols/vless-reality]] |
| VMess | как VLESS | TLS, REALITY, без TLS | как VLESS | [[protocols/vmess]] |
| Trojan | как VLESS | TLS, REALITY, без TLS | как VLESS | [[protocols/trojan]] |
| Shadowsocks | TCP и UDP | нет (собственное шифрование) | нет | [[protocols/shadowsocks]] |
| Hysteria2, Hysteria (v1) | UDP (QUIC) | TLS, обязательно | нет | [[protocols/hysteria2]] |
| TUIC | UDP (QUIC) | TLS, обязательно | нет | [[protocols/tuic]] |
| NaiveProxy | TCP (HTTP/2), по желанию UDP (HTTP/3) | TLS, обязательно | нет | [[protocols/naive]] |
| AnyTLS | TCP | TLS или REALITY, обязательно | нет | [[protocols/more#anytls]] |
| ShadowTLS | TCP | заимствован у настоящего сайта | нет | [[protocols/more#shadowtls]] |
| Mieru | TCP или UDP | нет (собственное шифрование) | нет | [[protocols/more#mieru]] |
| Snell | TCP | нет (собственное шифрование) | нет | [[protocols/more#snell]] |
| MTProxy | TCP | нет (собственное шифрование) | нет | [[protocols/more#mtproxy]] |
| SSH | TCP | собственный у SSH | нет | [[protocols/more#ssh]] |
| TrustTunnel | TCP или UDP | TLS, обязательно | нет | [[protocols/more#trusttunnel]] |
| Sudoku | TCP | нет (собственное шифрование) | нет | [[protocols/more#sudoku]] |
| SOCKS, mixed | TCP | нет | нет | [[protocols/more#socks-http-and-mixed]] |
| HTTP | TCP | TLS, REALITY, без TLS | нет | [[protocols/more#socks-http-and-mixed]] |
| Ingress | TCP | TLS или без TLS | через своих потомков | [[protocols/ingress]] |
| WireGuard (эндпоинт) | UDP | собственный у WireGuard | нет | [[protocols/wireguard]] |
| OpenVPN (эндпоинт) | UDP или TCP | TLS (сертификат) | нет | [[protocols/openvpn]] |
| OpenConnect (эндпоинт) | TCP и UDP | TLS (сертификат) | нет | [[protocols/openvpn]] |

VLESS, VMess и Trojan принимают транспорт: `tcp (none)`, `ws`, `grpc`, `http`
(HTTP/2), `httpupgrade`, `quic`, `xhttp` или `mkcp`. У других протоколов
транспорта нет. CDN может нести HTTP-подобные транспорты: `ws`, `grpc`,
`http`, `httpupgrade` и `xhttp`.

WireGuard, OpenVPN и OpenConnect — это [[~endpoint|эндпоинты]], их создают на
странице [[use/endpoints]]. Пользователи получают их так же, как инбаунды.
Локальные типы, которые тоже есть в форме (`tun`, `redirect`, `tproxy`,
`direct`), не предназначены для клиентов; см. [[protocols/more]].

## Какие приложения что читают {#which-apps-read-what}

Подписка отвечает в том формате, который запрашивает приложение. Важны четыре
формата:

- **Ссылки** (`vless://`, `trojan://`, `hysteria2://`…) читает почти любое
  приложение, в том числе приложения на базе Xray (v2rayNG, v2rayN,
  Streisand, Happ).
- **Clash** читают Clash Meta и другие приложения на mihomo.
- **sing-box** читают приложения sing-box (SFA, SFI, Karing, NekoBox).
- **Xray JSON** читают приложения на базе Xray.

Запись, которую приложение не может использовать, не попадает в файл этого
приложения, поэтому один и тот же пользователь может видеть разные списки в
двух приложениях.

| Протокол | Ссылка | Clash | sing-box | Xray JSON |
| --- | --- | --- | --- | --- |
| VLESS | да | да | да, кроме VLESS Encryption | да, кроме варианта без TLS, REALITY и VLESS Encryption |
| VMess, Trojan | да | да | да | да |
| Shadowsocks | да | да | да | да |
| Hysteria2 | да | да | да | да |
| Hysteria, TUIC, AnyTLS | да | да | да | нет |
| NaiveProxy | да | нет | да | нет |
| SOCKS, mixed | да | да | да | да |
| HTTP | нет | да | да | да |
| SSH | нет | да | да | нет |
| Mieru | нет | да | нет | нет |
| Snell | нет | нет | да | нет |
| ShadowTLS, MTProxy, TrustTunnel, Sudoku | нет | нет | нет | нет |
| WireGuard | файл `.conf` | да | да | да |
| OpenVPN | файл `.ovpn` | нет | да | нет |
| OpenConnect | сервер и данные для входа | нет | да | нет |

Для VLESS, VMess и Trojan значение имеет и транспорт:

| Транспорт | Clash | sing-box | Xray JSON | За CDN |
| --- | --- | --- | --- | --- |
| `tcp (none)` | да | да | да | нет |
| `ws` (WebSocket) | да | да | да | да |
| `grpc` | да | да | да | да |
| `http` (HTTP/2) | да | да | нет | да |
| `httpupgrade` | да | да | да | да |
| `quic` | нет | да | нет | нет |
| `xhttp` | нет | нет | да | да |
| `mkcp` | нет | нет | да | нет |

Ссылки передают любой транспорт; сможет ли конкретное приложение по нему
подключиться, зависит от самого приложения.

::: tip Попросите пользователей выключить Mux
В приложениях на базе Xray есть переключатель **Mux**. Если он включён,
соединение не устанавливается, а приложение никак это не объясняет.
[[~subscription-page|Страница подписки]] об этом предупреждает; повторите это
в своих инструкциях по настройке. См. [[use/subscriptions]].
:::

## Как выбрать {#how-to-choose}

- **Начните с [[protocols/vless-reality|VLESS + REALITY]].** Ему не нужны
  домен и сертификат, он работает почти в любом приложении и стоит первым в
  **Входящие → Из пресета**.
- **Добавьте инбаунд WebSocket, gRPC или [[protocols/xhttp|XHTTP]] с TLS**,
  если хотите поставить перед ним CDN. REALITY нельзя поставить за фронт. См.
  [[use/fronting]].
- **Добавьте [[protocols/hysteria2|Hysteria2]]** для пользователей на
  мобильных сетях с потерями или на дальних каналах, где UDP-протокол держится
  лучше TCP. Ему нужен доступ к узлу по UDP, а смена портов помогает там, где
  блокируются отдельные UDP-порты.
- **Предложите два-три разных варианта.** Разные сети блокируют разное.
  Подписка с TCP-протоколом, протоколом за CDN и UDP-протоколом оставляет
  пользователю рабочий вариант, когда один из них перестаёт работать.
- **Используйте [[protocols/ingress|ingress]]**, если свободен только порт 443,
  а на нём нужно несколько TCP-инбаундов.
- **Используйте [[protocols/wireguard|WireGuard]] или
  [[protocols/openvpn|OpenVPN / OpenConnect]]** для пользователей, которым
  нужно стандартное VPN-приложение, роутер или рабочий ноутбук, где можно
  запустить только одно из них.

Учёт трафика, квоты, ограничения скорости и адресов работают для каждого
пользователя одинаково на любом протоколе; выбор протокола не меняет того, как
вы продаёте учётную запись.

## Связанные страницы {#related}

- [[use/inbounds]] — создание, редактирование и размещение инбаундов
- [[use/endpoints]] — WireGuard, OpenVPN и OpenConnect
- [[use/certificates]] — сертификаты, которые используют TLS-инбаунды
- [[how/subscriptions]] — как собирается подписка
