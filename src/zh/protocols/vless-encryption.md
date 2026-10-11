---
title: "VLESS Encryption"
description: "用后量子密钥交换加密 VLESS 数据流本身，使终止 TLS 的 CDN 只能看到密文。"
order: 4
tags: [protocols]
---

# VLESS Encryption

VLESS Encryption 加密 VLESS 数据流本身，无论外面是否有 TLS。它是 VLESS [[~inbound]]上的一个开关，只有 Xray 客户端和较新的 Clash 应用能读取。

## 它带来什么 {#what-it-adds}

- **越过 CDN 的隐私。** 在[[~front|域名前置]]后面，CDN 会终止 TLS，原本能读取经过的内容。开启 VLESS Encryption 后，它看到的是密文，而不是用户的 VLESS 流量。
- 每个连接都使用**后量子密钥交换**（ML-KEM-768 加 X25519），无论外面是否有 TLS。
- **应用能接受的无 TLS VLESS。** 当前 Xray 客户端会拒绝既没有 TLS 也没有 REALITY 的普通 VLESS；开启 VLESS Encryption 后，同一个入站就能被接受。

## 开启 {#turn-it-on}

1. 打开 VLESS 入站（**入站**，然后点击该行的编辑按钮），或新建一个。参见 [[use/inbounds]]。
2. 在 **Protocol** 选项卡上找到 **VLESS Encryption**，选择一种 **认证方式**：
   - **X25519（非后量子）**，或
   - **ML-KEM-768（后量子）**。

   这是用来证明服务器身份的密钥。任选其一；无论选哪种，每个连接内部的交换都是后量子的。
3. **保存。** 面板生成密钥，把服务端部分保存在入站上并发送给节点，把客户端部分写入每个链接和订阅文件。

| 字段 | |
| --- | --- |
| **模式** | `native`、`xorpub` 或 `random`：握手被伪装的程度。三者开销相同 |
| **票据有效期** | 客户端无需完整握手即可重新连接的秒数。`0` 表示每个连接都进行完整握手 |
| **服务端字符串** | 私有部分。保存在入站上并发送给节点，绝不写入链接。**生成新密钥** 会替换它 |
| **客户端字符串** | 由服务端字符串推导而来，已经包含在每个链接中。显示出来是为了手动设置客户端 |

## 它会让所有链接重新签发 {#it-re-issues-every-link}

在你开启它之前，或在你更改认证方式或密钥之前生成的链接，会在握手时被拒绝。请在客户导入该入站之前设置好，否则就要准备让该入站的每个用户都刷新订阅。同样的规则也适用于 [[protocols/xhttp|XHTTP 的高级字段]]。

## 哪些应用能用 {#which-apps-can-use-it}

| 应用 | |
| --- | --- |
| Xray 客户端（v2rayNG、v2rayN、Streisand、Happ） | 是，完整支持 |
| mihomo 1.19.14 及以上版本的 Clash 应用 | 是 |
| sing-box 应用（SFA、Karing、NekoBox） | 否。它们的订阅会省略该入站 |

由于 sing-box 应用无法使用加密的入站，请在同一个[[~template]]中为使用这些应用的用户保留另一个入站。

## vision 流控会被去掉 {#the-vision-flow-is-dropped}

`xtls-rprx-vision` 无法在加密的入站上工作，所以面板会在这类入站上去掉它，节点上和链接中都是如此。账户上设置了 **Flow（VLESS）** 的用户在你的其他 VLESS 入站上仍然使用它；用户这边无需任何改动。

## 何时使用 {#when-to-use-it}

- **CDN 后面的 VLESS 入站**（带前置的 WebSocket、gRPC、HTTPUpgrade 或 XHTTP）：开启它的主要理由。
- **没有 TLS 的 VLESS 入站**，例如在以普通 HTTP 与你的节点通信的 CDN 后面。

在 REALITY 入站上，它主要增加了后量子交换，代价是该入站上所有 sing-box 应用用户都无法使用。在那里开启之前请权衡。

## 相关内容 {#related}

- [[protocols/xhttp]] — 最常与它搭配的传输
- [[use/fronting]] — 把入站放在 CDN 后面
- [[protocols/vless-reality]] — vision 流控与 REALITY
