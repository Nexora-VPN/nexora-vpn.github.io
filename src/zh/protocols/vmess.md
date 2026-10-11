---
title: "VMess"
description: "为需要 VMess 的应用和用户提供它，传输和 TLS 模式与 VLESS 相同。"
order: 5
tags: [protocols]
---

# VMess

VMess 是 VLESS 的前辈：每个用户一个 id，可选的传输和 TLS 模式与 VLESS 相同。大多数运营者改为提供 VLESS，只为那些应用、路由器或习惯需要 VMess 的用户保留它。

## 适用场景 {#what-it-is-good-for}

- **兼容性。** 所有类别的应用都能读取 VMess：分享链接、Clash（mihomo）应用、sing-box 应用和 Xray 客户端。
- **在 CDN 后面不使用 TLS 运行。** VMess 自己加密载荷，所以在终止 TLS 的 CDN 后面，一个不带 TLS 的 WebSocket 或 gRPC 入站仍能防止 CDN 读取流量。对于 VLESS，同样的需求由 [[protocols/vless-encryption|VLESS Encryption]] 满足。

## 创建 {#create-it}

**入站 → 添加**，类型选 `vmess`。通用表单见 [[use/inbounds]]。

| 选项卡 | 设置什么 |
| --- | --- |
| **Basic** | **Port** |
| **Transport** | `tcp (none)`，或 `ws`、`grpc`、`httpupgrade`、`xhttp`… 以便放在 CDN 后面 |
| **TLS** | 使用[[~certificate]]的 **TLS**、**REALITY** 或 **无** |
| **Multiplex** | 可选；见下文 |

**Protocol** 选项卡上没有需要填写的内容。每个用户由其 **凭据** 选项卡上的 **UUID** 识别，面板会为每个账户生成它；客户端文件按当前所有应用期望的设置生成（没有 alter id，自动选择加密算法）。

## 经由 CDN {#behind-a-cdn}

使用 `ws`、`grpc`、`httpupgrade`、`xhttp` 或 `http` 传输，并使用 TLS 或不使用 TLS（绝不使用 REALITY）时，可以由[[~front|域名前置]]承载。参见 [[use/fronting]]。

## Multiplex {#multiplex}

**Multiplex** 选项卡允许在一个连接上承载多个连接的应用把它用于这个入站。sing-box 应用和 Clash 应用有这样的设置。它与 Xray 客户端中的 **Mux** 开关无关，后者必须保持关闭：打开后连接会失败，而应用里没有任何提示说明原因。

## 客户端应用 {#client-apps}

| 格式 | |
| --- | --- |
| 分享链接（`vmess://`） | 是 |
| Clash 应用 | 是，`quic`、`xhttp` 和 `mkcp` 传输除外 |
| sing-box 应用 | 是，`xhttp` 和 `mkcp` 除外 |
| Xray 客户端 | 是，`http`（HTTP/2）和 `quic` 除外 |

## 相关内容 {#related}

- [[protocols/vless-reality]] — 通常的首选
- [[protocols/index]] — 每个应用读取哪些传输
