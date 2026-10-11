---
title: "VLESS 与 REALITY"
description: "设置最常用的第一个入站：使用 REALITY 的 VLESS、它借用的目标网站、密钥和 short ID，以及 vision 流控。"
order: 2
tags: [protocols, tls]
---

# VLESS 与 REALITY

使用 [[~reality|REALITY]] 的 VLESS 是大多数运营者的第一个入站。它不需要你自己的域名和证书，只占一个 TCP 端口，几乎所有客户端应用都能读取。本页介绍重要的字段，以及需要你自己做的选择。

<NxShot page="inbound-new" alt="新建入站对话框的 TLS 选项卡，已选中 REALITY 并填写了握手服务器" />

## 适用场景 {#what-it-is-good-for}

REALITY 是一种 TLS 模式。对你的用户的应用来说，它是到你节点的 TLS，密钥与节点绑定；对其他任何连接者来说，节点会以你指定的真实网站身份应答，并使用该网站自己的证书。你无需签发或续期证书就能获得 TLS，而且端口看起来就是一个普通的 HTTPS 网站。

它做不到的事：放在 CDN 后面。CDN 会出示自己的证书，而 REALITY 绑定在入站自己的密钥上，所以面板拒绝在 REALITY 入站上设置[[~front|域名前置]]。这种需求请使用带 TLS 的 WebSocket、gRPC 或 [[protocols/xhttp|XHTTP]] 入站。

## 创建 {#create-it}

1. 打开 **入站**，选择 **从预设添加**，然后选 **VLESS + REALITY**。这只会填好普通表单；此时还没有创建任何东西。
2. 检查 **Basic** 选项卡上的 **Port**。如果节点上没有其他服务，443 是自然的选择。
3. 在 **TLS** 选项卡上选择目标网站（见下文），或暂时保留建议值。
4. **保存。** 面板在保存时生成密钥对和 short ID。
5. 把该入站加入你的节点所在的[[~template]]。

你也可以手动创建：**添加**，类型选 `vless`，然后在 **TLS** 选项卡上选 **REALITY**。表单其余部分见 [[use/inbounds]]。

## 目标网站 {#the-target-site}

**TLS** 选项卡上的这三个字段决定节点以哪个网站的身份应答：

| 字段 | 含义 |
| --- | --- |
| **Server name (SNI)** | 用户的应用出示的名称。留空则取握手服务器的名称 |
| **Handshake server** | 节点向任何非你用户的访问者转发其 TLS 的真实网站 |
| **Handshake port** | 该网站的端口，通常为 443 |

什么是好的目标，取决于**节点**所在的网络：

- **从节点能快速访问。** 每当有连接到来，节点都会联系它，所以缓慢或无法访问的目标会让入站变慢或失效。
- **支持 TLS 1.3。** 不支持的网站无法借用。
- **与该服务器相符。** 是一个位于该国家、该托管商的服务器会合理地为之承载流量的网站。
- **在你用户的网络上未被封锁。** 被封锁的名称对你的入站同样被封锁。

表单会建议一个目标，让新入站能立即工作。对每个正式投入使用的入站，请自己选择目标；每次安装都用同一个网站，比各不相同更容易被发现。不同位置的节点可以提供使用不同目标的不同入站。

::: tip 从节点上测试
面板不会替你测试目标：从面板所在网络测试，说明不了节点网络的情况。请在节点本身上检查候选目标，例如使用 `curl -sv --tlsv1.3 https://example.com -o /dev/null`。
:::

## 密钥与 short ID {#keys-and-short-ids}

| 字段 | |
| --- | --- |
| **私钥** | 服务器的部分。为空或不可用时，保存时自动生成 |
| **公钥** | 由私钥推导而来并写入每个链接；仅供参考显示 |
| **Short ID** | 每行一个。用户收到的每个链接会从中选用一个 |

**生成新的密钥对 + short ID** 会同时替换两者，**重新生成 24 个随机 short ID** 只替换 short ID。无论哪种，都会改变每个链接必须携带的内容：用户的应用刷新订阅后才能继续使用。有理由时再做，并通知用户更新。

密钥永远不需要手动复制到任何地方。面板会把公钥和一个 short ID 写入每个用户的链接和订阅文件。

## vision 流控 {#the-vision-flow}

`xtls-rprx-vision` 是一个适合 REALITY 和普通 TCP 上的 TLS 的 VLESS 选项。它**按用户**设置，即用户 **凭据** 选项卡上的 **Flow（VLESS）**，新账户默认启用。

在它无法工作的地方，面板会自动去掉它：带传输的入站（WebSocket、gRPC、XHTTP 等）、没有 TLS 或 REALITY 的入站，以及启用了 [[protocols/vless-encryption|VLESS Encryption]] 的入站。因此设置了流控的用户仍然可以使用你提供的每个 VLESS 入站；你永远不必为此另建账户。

## 客户端设置 {#client-settings}

**TLS** 选项卡中的 **客户端设置（链接与订阅）** 部分只写入链接，永远不会下发到节点。大多数运营者会调整的字段是 **uTLS fingerprint**，即应用在握手时模仿的浏览器。

## 客户端应用 {#client-apps}

普通 TCP 上的 VLESS + REALITY 入站适用于所有订阅格式：分享链接、Clash（mihomo）应用、sing-box 应用（SFA、Karing、NekoBox）和 Xray 客户端（v2rayNG、v2rayN、Streisand、Happ）。

## 注意事项 {#caveats}

- **REALITY 与 `quic` 传输一起使用会被拒绝。** QUIC 自带 TLS。
- **REALITY 也可用于 VMess、Trojan、HTTP 和 AnyTLS** 入站。VLESS 是常见搭配，因为有 vision 流控。
- **时钟偏差。** **Max time difference**（高级）限制客户端时钟与节点时钟的最大差异。除非你确定需要，否则留空。

## 相关内容 {#related}

- [[protocols/index]] — 所有协议的对比
- [[protocols/ingress]] — 在一个端口上运行 REALITY 和其他入站
- [[use/fronting]] — REALITY 无法使用的 CDN 路线
