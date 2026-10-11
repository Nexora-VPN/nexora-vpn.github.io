---
title: "XHTTP"
description: "使用 XHTTP 传输：它的模式、每个链接都携带的高级字段、哪些应用能读取，以及在 CDN 后面运行。"
order: 3
tags: [protocols, fronting]
---

# XHTTP

XHTTP 是用于 VLESS、VMess 和 Trojan 入站的一种传输，它把连接作为普通的 HTTP 请求承载。长连接数据流过不去的 CDN 和 HTTP 反向代理，它能通过；它可以与 TLS、[[~reality|REALITY]] 一起使用，也可以完全不用 TLS。只有 Xray 客户端能读取它，所以请把它与一个所有应用都能使用的入站一起提供。

## 创建 {#create-it}

1. **入站 → 添加**，类型选 `vless`（或 `vmess`、`trojan`）。通用表单见 [[use/inbounds]]。
2. 在 **Transport** 选项卡上选择 `xhttp`。**Path** 是大多数入站唯一需要的字段；其余字段都在高级选项中。
3. 在 **TLS** 选项卡上选择使用[[~certificate]]的 TLS、REALITY 或无。只有在前面的 CDN 替你终止 TLS 时才选无。
4. **保存**，并把该入站加入一个[[~template]]。

## 模式 {#modes}

**Mode** 决定客户端如何把上传和下载两部分拆分为请求。留空和 `auto` 由客户端选择。

| 模式 | 如何承载流量 |
| --- | --- |
| `packet-up` | 上传以一系列独立请求发送。在 CDN 后面最稳妥，因为每一块都是普通请求 |
| `stream-up` | 上传以一个持续的流式请求发送 |
| `stream-one` | 两个方向共用一个请求 |

有些高级字段只在 `packet-up` 模式下有效，面板会在保存时拒绝其他模式下的这些设置。

## 高级字段写在链接里 {#the-advanced-fields-travel-in-the-link}

下面每个高级字段都由节点强制执行，**同时**在链接中告知客户端，使两端保持一致。这带来一个值得反复强调的后果：

::: warning 修改任何一个，所有链接都必须重新签发
仍持有旧链接的客户端会被节点拒绝。XHTTP 的拒绝表现为时断时续的错误，而不是干脆的失败，所以你的客服收到的反馈是“有时能用”。请在客户导入该入站之前确定这些字段，否则就要准备让所有人刷新订阅。
:::

表单会在每个这样的字段旁加上说明此事的提示。

| 字段 | 作用 |
| --- | --- |
| **X-Padding bytes** | 两端给每个请求添加的填充的大小范围。范围越宽，每个请求的字节越多，大小越不规则。无法关闭 |
| **X-Padding obfuscation** | 关闭时，填充放在固定位置，下面四个字段被忽略。开启时，由你选择它放在哪里 |
| **X-Padding placement** | 它放在哪里：`queryInHeader`、`header`、`query` 或 `cookie` |
| **X-Padding key**、**X-Padding header** | 它使用的名称 |
| **X-Padding method** | 填充的生成方式：`repeat-x` 或 `tokenish` |
| **Session placement**、**Session key** | 会话 id 放在哪里：路径（默认）、查询参数、头部或 cookie，以及使用的名称 |
| **Sequence placement**、**Sequence key** | 同上，用于数据包序号 |
| **Uplink HTTP method** | `POST`（默认）或 `GET`。`GET` 只在 `packet-up` 模式下被接受 |
| **Uplink data placement**、**Uplink data key** | 上传数据放在哪里：请求体（默认）、头部或 cookie。头部和 cookie 只在 `packet-up` 模式下被接受 |
| **Max bytes per post** | 最大的上传块。节点会拒绝更大的块，所以客户端会得知这个值并保持在它以下 |

只有你修改过的值会写入链接。默认值永远不会写入，所以之后默认值的变化对旧链接和新链接同样生效。

## 哪些应用能读取 {#which-apps-read-it}

Xray 客户端（v2rayNG、v2rayN、Streisand、Happ）支持 XHTTP，并通过分享链接和 Xray JSON 格式获得所有字段。sing-box 应用和 Clash 应用不支持 XHTTP，所以它们的订阅文件会省略该入站，而不是只带一半。使用这些应用的用户根本看不到这个入站；请给他们另一个。

## 经由 CDN {#behind-a-cdn}

XHTTP 是[[~front|域名前置]]能承载的传输之一。在 [[use/fronting]] 中设置前置，并在这个入站上启用它。

填充、会话 id 和序号在任何放置位置都能正常传递：它们是路径、查询、头部或 cookie 中的短值，任何转发 HTTP 的 CDN 都会转发它们。CDN 无法承载的两种形式，是把上传数据放在 **header** 或 **cookie** 中。保存前置时面板会拒绝它们。`GET` 上传也没有可供 CDN 转发的请求体。

### 客户端的真实地址 {#the-client-s-real-address}

在 CDN 后面，每个连接都从 CDN 的地址到达节点。要保留用户自己的地址（用于地址数限制和日志），节点必须从 CDN 写入地址的头部中读取它。

在前置的 **客户端地址头** 字段中指定该头部：Cloudflare 为 `CF-Connecting-IP`，该字段也列出了其他 CDN 的常用头部。之后，启用了该前置的每个 XHTTP 入站都会信任这个头部。保存修改了头部的前置会在其节点上重启该入站，从而断开它的现有连接。

这个地址是否可靠取决于三件事：

1. **CDN 自己写入该头部。** Cloudflare 会这样做；有些 CDN 会把客户端发来的值原样传下去，除非你配置它们不这样做。请查阅你的 CDN 文档。
2. **节点只接受来自 CDN 的连接。** 直接连到节点的客户端也能发送这个头部。
3. **入站上的每个前置都指定同一个头部。** 一个 CDN 会把另一个 CDN 的头部原样传下去。

三者都满足时，这个地址可以作为限制的依据。否则，只把它当作参考。

入站也可以在自己的 JSON 中携带自己的列表，即 `transport` 下的 `trusted_x_forwarded_for`，它优先于前置的头部。两者都没有时（入站上没有列表，也没有前置指定头部），节点会信任任何人发来的任何 `X-Forwarded-For` 头部：直接连到入站的客户端可以自己指定地址。因此请在前置上指定头部，并且不要把没有前置的入站放在其他代理后面。

## 相关内容 {#related}

- [[protocols/vless-encryption]] — 在 CDN 终止 TLS 的地方保持流量私密
- [[use/fronting]] — 设置前置
- [[protocols/index]] — 每个应用读取哪些传输
