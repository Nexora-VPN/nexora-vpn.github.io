---
title: "Trojan"
description: "通过 TLS 提供 Trojan：每用户一个密码，任意传输，传输为 HTTP 形态时可使用 CDN 前置。"
order: 6
tags: [protocols, tls]
---

# Trojan

Trojan 用密码验证每个用户，其余一切都依赖 TLS。它支持广泛、设置简单，适合作为 [[protocols/vless-reality|VLESS]] 之外的第二种协议，尤其是在 CDN 后面通过 WebSocket 提供时。

## 适用场景 {#what-it-is-good-for}

- **默认使用它的应用。** 许多应用把 Trojan 放在第一位，而且几乎所有应用都能读取它。
- **经 CDN 前置的入站。** **入站 → 从预设添加 → Trojan + WebSocket + TLS** 会给你一个可直接用于[[~front|域名前置]]的入站。

## 创建 {#create-it}

从上面的预设开始，或在 **入站 → 添加** 中输入类型 `trojan`。通用表单见 [[use/inbounds]]。

| 选项卡 | 设置什么 |
| --- | --- |
| **Basic** | **Port** |
| **Transport** | `tcp (none)`，或 `ws`、`grpc`、`httpupgrade`、`xhttp`… |
| **TLS** | 使用[[~certificate]]的 **TLS**（通常为 **节点证书**），或 **REALITY** |
| **Multiplex** | 可选，供支持多路复用的 sing-box 和 Clash 应用使用 |

每个用户用其 **凭据** 选项卡上的 **密码** 登录，面板会为每个账户生成它。

## TLS 就是保护 {#tls-is-the-protection}

Trojan 自身的安全性就是 TLS。表单允许你选择 **无**，这只在两种情况下是正确的：

- **在为它终止 TLS 的 [[protocols/ingress|ingress]] 后面。**
- **在终止 TLS 并以普通 HTTP 与你的节点通信的 CDN 后面。**

在其他任何地方，不带 TLS 的入站都会以明文发送用户的密码和流量。

使用自签名证书（例如节点自己的证书）时，面板会把证书的固定值（pin）写入每个链接和订阅文件，应用无需公共证书机构即可信任它。参见 [[use/certificates]]。

## 经由 CDN {#behind-a-cdn}

使用 `ws`、`grpc`、`httpupgrade`、`xhttp` 或 `http` 传输，并使用 TLS 或不使用 TLS（绝不使用 REALITY）时，可以由前置承载。参见 [[use/fronting]]。

## 客户端应用 {#client-apps}

| 格式 | |
| --- | --- |
| 分享链接（`trojan://`） | 是 |
| Clash 应用 | 是，`quic`、`xhttp` 和 `mkcp` 传输除外 |
| sing-box 应用 | 是，`xhttp` 和 `mkcp` 除外 |
| Xray 客户端 | 是，`http`（HTTP/2）和 `quic` 除外 |

## 相关内容 {#related}

- [[protocols/index]] — 所有协议的对比
- [[use/fronting]] — 把它放在 CDN 后面
