---
title: "更多协议"
description: "面板提供的其余协议，从 AnyTLS、Mieru 到 SOCKS 和 SSH：各自的用途、哪些应用能读取，以及限制。"
order: 13
tags: [protocols]
---

# 更多协议

除了有独立页面的协议，入站表单还提供许多其他协议。它们大多只适用于特定场景：某一类应用、某一种网络，或你自己的工具。本页为每种协议提供简短说明。它们的创建方式都相同，在 **入站 → 添加** 中完成（[[use/inbounds]]），除非条目另有说明，它们都带有按用户的流量统计和限制。

::: tip 销售前先确认应用支持
其中有几种只有一类应用能用，还有四种无法通过订阅送达任何应用。[[protocols/index]] 中的表格列出了每种格式能携带什么。
:::

## AnyTLS {#anytls}

一种带可调填充的 TLS 代理协议，目的是让流量的大小不呈现固定规律。

- **TLS**：必需，使用证书（默认为节点证书）或 [[~reality|REALITY]]。
- **用户** 用自己的 **密码** 登录。
- **Padding scheme**（高级）控制填充方式；留空使用默认值。
- **应用**：分享链接（`anytls://`）、Clash 应用和 sing-box 应用。Xray 客户端不读取它。
- 可以放在 [[protocols/ingress|ingress]] 后面。不能被前置。

## ShadowTLS {#shadowtls}

像 REALITY 一样借用真实网站的 TLS 握手，通常与 Shadowsocks 搭配使用。

- **Version** 3（默认）用账户名和 **密码** 登录用户；版本 1 和 2 使用一个共享的 **Password (v1/v2)**。
- **Handshake server** 和 **Handshake port** 指定真实网站。建议与 [[protocols/vless-reality|REALITY 的目标网站]]相同：节点能够访问，且对你的用户没有被封锁。
- **Strict mode** 和 **Wildcard SNI**（高级）收紧或放宽可接受的握手。
- **应用**：没有任何订阅格式携带它。客户端必须手动设置，因此不适合用于销售。
- 没有用户的版本 3 入站不会提供服务。

## Mieru {#mieru}

一种独立的协议，运行在 TCP 或 UDP 上，可使用一段端口。

- **Transport**：`TCP` 或 `UDP`。
- **Listen port ranges**（高级）：额外的端口，格式为 `2012-2022`，客户端会把连接分散到这些端口上。
- **用户** 用账户名和 **密码** 登录。
- **应用**：仅 Clash 应用（mihomo）。没有分享链接，也没有 sing-box 或 Xray 条目。
- 没有用户的入站不会提供服务。

## Snell {#snell}

一种使用预共享密钥的轻量加密协议。

- **Version (5 or 6)**：每个版本有自己的选项，5 为 **Obfs mode**，6 为 **Mode**，表单只显示对应的那一个。
- **PSK**：服务器密钥，自动为你生成。每个用户自己的密钥就是其 **密码**。
- **应用**：仅 sing-box 应用。Clash 的 Snell 没有按用户的密钥，所以在 Clash 中被省略；也没有分享链接。
- 没有用户的入站不会提供服务：否则它会成为一台单密钥服务器，而密钥就在每个链接里。

## MTProxy {#mtproxy}

Telegram 自己的代理协议，供 Telegram 应用使用。它只承载 Telegram 流量。

- 每个账户都有自己的密钥（secret），因此用户分别计量、分别限制。
- 高级字段用于调整连接处理，以及代理向非 Telegram 客户端展示的网站。
- **应用**：Telegram。没有任何订阅格式携带 MTProxy 条目，所以用户不会和其他配置一起收到它。
- 没有用户的入站不会提供服务。

## SSH {#ssh}

把 SSH 服务器用作代理：应用与节点建立 SSH 会话，再通过它建立隧道。它不需要证书，可以运行在任何 TCP 端口上。

- **用户** 用账户名和 **密码** 登录。这是一个独立于主机自身 SSH 的服务；它永远不提供 shell。
- **Host key**（高级）：留空时自动生成。
- **Max auth tries**（高级）：每个连接允许的登录失败次数。
- **应用**：Clash 应用和 sing-box 应用。
- 没有用户的入站不会提供服务。

## TrustTunnel {#trusttunnel}

一种基于 TLS 的 VPN 协议，运行在 TCP 上；把 **Network** 设为 `udp` 时运行在 UDP 上。

- **TLS**：必需，默认使用节点证书。
- **用户** 用账户名和 **密码** 登录。
- **应用**：没有任何订阅格式携带它；其客户端需手动设置。

## Sudoku {#sudoku}

一种所有连接者共用**一个共享密钥**、没有按用户账户的协议。

- **Key**：自动为你生成。
- 高级字段控制编码和填充，并可设置 **Fallback (host:port)**。
- 由于所有人共用密钥，面板无法对其中某个用户计量、限制或停用。请只留给自己使用。
- **应用**：没有任何订阅格式携带它。

## SOCKS、HTTP 和 mixed {#socks-http-and-mixed}

普通代理：`socks`、`http` 和 `mixed`（同一端口上的 SOCKS 和 HTTP）。

- **用户** 用账户名和 **密码** 登录。
- SOCKS 和普通 HTTP 不加密。`http` 入站可以使用 TLS（HTTPS 代理）或 REALITY；`socks` 和 `mixed` 不行。请在你信任的网络上使用它们，供只支持普通代理的工具使用，或用来串联服务器。
- **应用**：`socks` 和 `mixed` 适用于所有格式（分享链接、Clash 应用、sing-box 应用、Xray 客户端）；`http` 适用于 Clash 应用、sing-box 应用和 Xray 客户端。

::: warning 没有用户时绝不提供服务
没有用户的 SOCKS、HTTP 或 mixed 入站，对任何发现该端口的人都是一个开放代理。在至少有一个用户之前，面板不会把它下发给节点，节点也会拒绝它。
:::

## Tailscale {#tailscale}

Tailscale 是 **端点** 页面（[[use/endpoints]]）上的一种[[~endpoint]]，它用 **Auth key** 把节点加入你的 Tailscale 网络。可以用它私密地访问你的节点、经由 tailnet 中的另一台机器转发出站流量，或把节点设为出口节点（**Advertise as exit node**）。它供你自己使用，不会出现在任何订阅中。

## 本地类型：tun、redirect、tproxy、direct {#local-types}

表单还列出四种接收到达节点主机本身流量的类型。它们不会出现在任何订阅中。

- **direct** 把到达其端口的所有流量转发到固定的 **Override address** 和 **Override port**。
- **tun**、**redirect** 和 **tproxy** 在主机本身上捕获流量。大多数运营者永远用不到它们。

## 相关内容 {#related}

- [[protocols/index]] — 完整对比
- [[use/inbounds]] — 创建任意入站
