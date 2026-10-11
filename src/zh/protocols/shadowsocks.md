---
title: "Shadowsocks"
description: "使用 2022 加密方式和每用户独立密钥提供 Shadowsocks，不用 TLS，同时支持 TCP 和 UDP。"
order: 7
tags: [protocols]
---

# Shadowsocks

Shadowsocks 用密钥而不是 TLS 加密：不需要证书，不需要域名，一个端口同时承载 TCP 和 UDP。面板为每个用户提供独立密钥，因此每个账户都单独计量、单独限制、单独停用。

## 适用场景 {#what-it-is-good-for}

- **一个不用 TLS 的轻量协议**，供支持它的应用和路由器使用。
- **UDP 流量**，例如通话和游戏，使用同一个端口。
- **所有类别的应用**：分享链接、Clash（mihomo）应用、sing-box 应用和 Xray 客户端都能读取它。

它没有传输，也没有 TLS，所以不能放在 CDN 后面。

## 创建 {#create-it}

**入站 → 添加**，类型选 `shadowsocks`。通用表单见 [[use/inbounds]]。默认值可以直接保存：一种 2022 加密方式和一个自动生成的服务器密钥。

| 字段（**Protocol** 选项卡） | |
| --- | --- |
| **Method** | 加密算法。除非某个应用需要旧算法，否则保留 `2022-blake3-…` 系列 |
| **Server password**（高级） | 入站自己的密钥，自动为你生成 |
| **Network**（高级） | `tcp`、`udp`，或留空表示两者都用 |

## 加密方式 {#methods}

| 加密方式 | 密钥长度 |
| --- | --- |
| `2022-blake3-aes-128-gcm`（默认） | 16 字节 |
| `2022-blake3-aes-256-gcm` | 32 字节 |
| `2022-blake3-chacha20-poly1305` | 32 字节 |
| `aes-128-gcm`、`aes-256-gcm`、`chacha20-ietf-poly1305`、`xchacha20-ietf-poly1305` | 任意密码 |
| `none` | 不加密 |

2022 系列需要长度精确、以 base64 书写的密钥。**Server password** 必须与加密方式匹配：`2022-blake3-aes-128-gcm` 用 16 字节密钥，另外两种用 32 字节密钥。如果更换加密方式，也要生成长度正确的新密钥，否则节点会拒绝该入站。

旧加密方式是为不支持 2022 的应用保留的。`none` 不加密地发送流量，只用于测试。

## 每用户密钥 {#keys-per-user}

每个账户的 **凭据** 选项卡上都有两个 Shadowsocks 密钥：**Shadowsocks 密钥（16B）** 和 **Shadowsocks 密钥（32B）**。面板选用与入站加密方式匹配的那个，应用在链接中同时收到服务器密钥和自己的用户密钥。使用旧加密方式时，改用用户的 **密码**。

正是这一点让入站支持多用户：每个用户有自己的密钥，所以流量按账户计量，被停用的用户会立即无法使用。

::: warning 没有用户时绝不提供服务
没有用户的 Shadowsocks 入站会成为一台单密钥服务器，而密钥就在每个链接里。在至少有一个用户之前，面板不会把这样的入站下发给节点。
:::

## 客户端应用 {#client-apps}

| 格式 | |
| --- | --- |
| 分享链接（`ss://`） | 是 |
| Clash 应用 | 是 |
| sing-box 应用 | 是 |
| Xray 客户端 | 是 |

## 相关内容 {#related}

- [[protocols/index]] — 所有协议的对比
- [[use/users]] — 账户的凭据
