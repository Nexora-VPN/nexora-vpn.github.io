---
title: "协议"
description: "面板提供的每种入站协议：运行在什么之上、能否经由 CDN 承载，以及哪些客户端应用能读取。"
order: 1
tags: [protocols]
---

# 协议

本节帮助你选择用户使用哪种方式连接。每种协议都是一个[[~inbound]]：你在共享池中创建一次，再放到[[~template]]上；该模板的节点提供它，模板的每个用户在自己的[[~subscription]]中都会得到对应的一条。创建方法见 [[use/inbounds]]；本节各页说明每种协议的字段和限制。

<NxShot page="inbounds" alt="入站页面：入站列表，显示协议、端口和 TLS 模式" />

## 所有入站一览 {#every-inbound-at-a-glance}

**运行在**是节点监听的对象，也就是防火墙需要放行的内容。**TLS** 列出表单提供的模式：证书（节点自己的、面板证书库中的，或你自己的 PEM 证书对）、[[~reality|REALITY]]，或不使用。**经由 CDN** 表示能否由[[~front|域名前置]]承载。

| 协议 | 运行在 | TLS | 经由 CDN | 页面 |
| --- | --- | --- | --- | --- |
| VLESS | TCP（使用 `quic` 或 `mkcp` 传输时为 UDP） | TLS、REALITY、无 | 可以，需使用 HTTP 形态的传输且不用 REALITY | [[protocols/vless-reality]] |
| VMess | 同 VLESS | TLS、REALITY、无 | 同 VLESS | [[protocols/vmess]] |
| Trojan | 同 VLESS | TLS、REALITY、无 | 同 VLESS | [[protocols/trojan]] |
| Shadowsocks | TCP 和 UDP | 无（自带加密） | 不可以 | [[protocols/shadowsocks]] |
| Hysteria2、Hysteria（v1） | UDP（QUIC） | TLS，必需 | 不可以 | [[protocols/hysteria2]] |
| TUIC | UDP（QUIC） | TLS，必需 | 不可以 | [[protocols/tuic]] |
| NaiveProxy | TCP（HTTP/2），可选 UDP（HTTP/3） | TLS，必需 | 不可以 | [[protocols/naive]] |
| AnyTLS | TCP | TLS 或 REALITY，必需 | 不可以 | [[protocols/more#anytls]] |
| ShadowTLS | TCP | 借用真实网站的 | 不可以 | [[protocols/more#shadowtls]] |
| Mieru | TCP 或 UDP | 无（自带加密） | 不可以 | [[protocols/more#mieru]] |
| Snell | TCP | 无（自带加密） | 不可以 | [[protocols/more#snell]] |
| MTProxy | TCP | 无（自带加密） | 不可以 | [[protocols/more#mtproxy]] |
| SSH | TCP | SSH 自带 | 不可以 | [[protocols/more#ssh]] |
| TrustTunnel | TCP 或 UDP | TLS，必需 | 不可以 | [[protocols/more#trusttunnel]] |
| Sudoku | TCP | 无（自带加密） | 不可以 | [[protocols/more#sudoku]] |
| SOCKS、mixed | TCP | 无 | 不可以 | [[protocols/more#socks-http-and-mixed]] |
| HTTP | TCP | TLS、REALITY、无 | 不可以 | [[protocols/more#socks-http-and-mixed]] |
| Ingress | TCP | TLS 或无 | 通过其子入站 | [[protocols/ingress]] |
| WireGuard（端点） | UDP | WireGuard 自带 | 不可以 | [[protocols/wireguard]] |
| OpenVPN（端点） | UDP 或 TCP | TLS（证书） | 不可以 | [[protocols/openvpn]] |
| OpenConnect（端点） | TCP 和 UDP | TLS（证书） | 不可以 | [[protocols/openvpn]] |

VLESS、VMess 和 Trojan 需要选择传输：`tcp (none)`、`ws`、`grpc`、`http`（HTTP/2）、`httpupgrade`、`quic`、`xhttp` 或 `mkcp`。其他协议都没有传输。CDN 能承载其中 HTTP 形态的几种：`ws`、`grpc`、`http`、`httpupgrade` 和 `xhttp`。

WireGuard、OpenVPN 和 OpenConnect 是[[~endpoint|端点]]，在 [[use/endpoints]] 中创建。它们与入站一样送达用户。表单中还列出的本地类型（`tun`、`redirect`、`tproxy`、`direct`）不是给客户用的；参见 [[protocols/more]]。

## 哪些应用读取什么 {#which-apps-read-what}

订阅按应用请求的格式应答。重要的格式有四种：

- **分享链接**（`vless://`、`trojan://`、`hysteria2://`…），几乎所有应用都能读取，包括 Xray 客户端（v2rayNG、v2rayN、Streisand、Happ）。
- **Clash**，由 Clash Meta 和其他 mihomo 应用读取。
- **sing-box**，由 sing-box 应用（SFA、SFI、Karing、NekoBox）读取。
- **Xray JSON**，由 Xray 客户端读取。

应用用不了的条目不会出现在该应用的文件中，所以同一个用户在两个应用里看到的列表可能不同。

| 协议 | 分享链接 | Clash | sing-box | Xray JSON |
| --- | --- | --- | --- | --- |
| VLESS | 是 | 是 | 是，使用 VLESS Encryption 时除外 | 是，不使用 TLS、REALITY 或 VLESS Encryption 时除外 |
| VMess、Trojan | 是 | 是 | 是 | 是 |
| Shadowsocks | 是 | 是 | 是 | 是 |
| Hysteria2 | 是 | 是 | 是 | 是 |
| Hysteria、TUIC、AnyTLS | 是 | 是 | 是 | 否 |
| NaiveProxy | 是 | 否 | 是 | 否 |
| SOCKS、mixed | 是 | 是 | 是 | 是 |
| HTTP | 否 | 是 | 是 | 是 |
| SSH | 否 | 是 | 是 | 否 |
| Mieru | 否 | 是 | 否 | 否 |
| Snell | 否 | 否 | 是 | 否 |
| ShadowTLS、MTProxy、TrustTunnel、Sudoku | 否 | 否 | 否 | 否 |
| WireGuard | `.conf` 文件 | 是 | 是 | 是 |
| OpenVPN | `.ovpn` 文件 | 否 | 是 | 否 |
| OpenConnect | 服务器和登录信息 | 否 | 是 | 否 |

对 VLESS、VMess 和 Trojan 来说，传输也起决定作用：

| 传输 | Clash | sing-box | Xray JSON | 经由 CDN |
| --- | --- | --- | --- | --- |
| `tcp (none)` | 是 | 是 | 是 | 否 |
| `ws`（WebSocket） | 是 | 是 | 是 | 是 |
| `grpc` | 是 | 是 | 是 | 是 |
| `http`（HTTP/2） | 是 | 是 | 否 | 是 |
| `httpupgrade` | 是 | 是 | 是 | 是 |
| `quic` | 否 | 是 | 否 | 否 |
| `xhttp` | 否 | 否 | 是 | 是 |
| `mkcp` | 否 | 否 | 是 | 否 |

分享链接可以携带所有传输；某个应用能否拨通，取决于应用本身。

::: tip 告诉用户关闭 Mux
Xray 客户端有一个 **Mux** 开关。打开后连接会失败，而应用里没有任何提示说明原因。[[~subscription-page|订阅页面]]会提醒这一点；请在你自己的设置说明中再强调一次。参见 [[use/subscriptions]]。
:::

## 如何选择 {#how-to-choose}

- **从 [[protocols/vless-reality|VLESS + REALITY]] 开始。** 它不需要域名和证书，几乎所有应用都支持，并且是 **入站 → 从预设添加** 中的第一个预设。
- **想在前面加 CDN 时，添加带 TLS 的 WebSocket、gRPC 或 [[protocols/xhttp|XHTTP]] 入站。** REALITY 不能被前置。参见 [[use/fronting]]。
- **为使用丢包严重的移动网络或长距离链路的用户添加 [[protocols/hysteria2|Hysteria2]]。** 在这类网络上，UDP 协议比 TCP 更稳定。它需要 UDP 能到达节点；单个 UDP 端口被封锁时，端口跳跃会有帮助。
- **提供两到三种形态。** 不同网络封锁的东西不同。一个订阅里同时有 TCP 协议、经 CDN 前置的协议和 UDP 协议，其中一种失效时用户仍有可用的。
- **只能腾出 443 端口、又想在上面放多个 TCP 入站时，使用 [[protocols/ingress|ingress]]。**
- **用户需要标准 VPN 应用、路由器，或只能运行这类软件的工作电脑时，使用 [[protocols/wireguard|WireGuard]] 或 [[protocols/openvpn|OpenVPN / OpenConnect]]。**

每种协议对每个用户都有同样的流量统计、额度、速度和地址限制；选择哪种协议都不影响你销售账户的方式。

## 相关内容 {#related}

- [[use/inbounds]] — 创建、编辑和放置入站
- [[use/endpoints]] — WireGuard、OpenVPN 和 OpenConnect
- [[use/certificates]] — TLS 入站使用的证书
- [[how/subscriptions]] — 订阅是如何组装的
