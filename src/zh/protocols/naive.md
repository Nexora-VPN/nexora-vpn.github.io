---
title: "NaiveProxy"
description: "通过 HTTP/2 和 TLS 提供 NaiveProxy，并选择其客户端能接受的证书。"
order: 10
tags: [protocols, tls]
---

# NaiveProxy

NaiveProxy 以 HTTP/2 上的 HTTPS 请求承载流量，就像浏览器与 Web 服务器通信一样。它需要 TLS 和证书，用用户名和密码登录用户，分享链接和 sing-box 应用能读取它。

## 适用场景 {#what-it-is-good-for}

- **形态与浏览器流量一致的流量。** 它的客户端基于浏览器自身的网络代码构建。
- **一个无需额外调优的 TCP 选项**：一个端口、一张证书，再加上用户。

它没有传输，所以 CDN 无法承载它，[[protocols/ingress|ingress]] 也无法路由到它。请给它一个独立的端口。

## 创建 {#create-it}

**入站 → 添加**，类型选 `naive`。通用表单见 [[use/inbounds]]。

- 在 **Basic** 选项卡填写 **Port**。
- **TLS** 选项卡是必需的，默认为 **节点证书**。保留它之前，请先阅读下面关于证书的说明。
- 每个用户用自己的账户名和 **密码** 登录。

| 字段（**Protocol** 选项卡） | |
| --- | --- |
| **Network** | `tcp`（默认）：基于 TCP 的 HTTP/2，也就是分享链接所描述的方式。`udp` 改为提供基于 QUIC 的 HTTP/3，留空则两者都提供。除非你确定用户的应用支持 HTTP/3，否则保持 `tcp` |
| **QUIC congestion control**（高级） | `bbr`、`cubic` 或 `reno`，用于 HTTP/3。它会写入链接 |

## 谨慎选择证书 {#choose-the-certificate-with-care}

::: warning 长期有效的自签名证书会被拒绝
sing-box 应用中的 naive 客户端遵循浏览器关于证书有效期的规则，即使是被告知要信任的证书也一样。有效期超过约 200 天的自签名证书会因 "cert validity too long" 而失败，2027 年 3 月起这一上限降为 100 天。面板自己的自签名证书（包括自签名的节点证书）有效期为一年。
:::

请改为给 naive 入站使用以下证书之一：

- **ACME 证书**：为指向该节点的域名签发，在 [[use/certificates]] 中完成。它受公众信任，使用 Let's Encrypt 时有效期 90 天，并会自动续期。
- **你自己的证书**：有效期不超过 100 天，以 PEM 证书对的形式粘贴。

## 没有用户时绝不提供服务 {#never-served-without-users}

没有用户的 naive 入站无法启动，所以在至少有一个用户之前，面板不会把它下发给节点。

## 客户端应用 {#client-apps}

| 格式 | |
| --- | --- |
| 分享链接（`naive+https://`） | 是 |
| sing-box 应用 | 是 |
| Clash 应用 | 否；它们的订阅会省略它 |
| Xray 客户端 | 否；它们的订阅会省略它 |

## 相关内容 {#related}

- [[use/certificates]] — 签发 ACME 证书
- [[protocols/index]] — 所有协议的对比
