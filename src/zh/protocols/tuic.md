---
title: "TUIC"
description: "提供 TUIC：一种运行在 UDP 上、可选择拥塞控制的 QUIC 协议，供 sing-box 和 Clash 应用使用。"
order: 9
tags: [protocols, tls]
---

# TUIC

TUIC 是运行在 QUIC 之上、使用 UDP 的代理协议。与 [[protocols/hysteria2|Hysteria2]] 一样，它在 TCP 协议会卡住的丢包链路上依然稳定；与 Hysteria2 不同的是，它允许你选择拥塞控制，但没有端口跳跃。对于应用能读取它的用户，可以把它与一个 TCP 入站一起提供。

## 适用场景 {#what-it-is-good-for}

- **丢包或高延迟的网络**，使用 UDP 协议。
- **第二个 QUIC 选项**，用于对 Hysteria2 区别对待的网络。

它需要 UDP 能到达节点，并且 CDN 无法承载它，所以面板拒绝在它上面设置[[~front|域名前置]]。

## 创建 {#create-it}

**入站 → 添加**，类型选 `tuic`。通用表单见 [[use/inbounds]]。

- 在 **Basic** 选项卡填写 **Port**，这是一个 UDP 端口。如果节点有防火墙，请放行它。
- **TLS** 选项卡是必需的，默认为 **节点证书**。[[use/certificates]] 中的任何[[~certificate]]都可以。
- 每个用户用自己的 **UUID** 和 **密码** 登录，两者都会为每个账户自动生成。

| 字段（**Protocol** 选项卡） | |
| --- | --- |
| **Congestion control** | `cubic`、`bbr` 或 `new_reno`。`bbr` 适合长距离和丢包的路径；`cubic` 是保守的选择 |
| **Zero-RTT handshake**（高级） | 允许再次连接的客户端在握手完成前发送数据。除非你需要省下这一次往返，否则保持关闭 |
| **Auth timeout**、**Heartbeat**（高级） | 客户端完成登录的时限，以及保持连接活跃的频率 |
| QUIC 调优（高级） | 接收窗口、空闲超时、保活；除非你经过测量有明确理由，否则留空 |

## 客户端应用 {#client-apps}

| 格式 | |
| --- | --- |
| 分享链接（`tuic://`） | 是 |
| Clash 应用 | 是 |
| sing-box 应用 | 是 |
| Xray 客户端 | 否；它们的订阅会省略它 |

## 相关内容 {#related}

- [[protocols/hysteria2]] — 另一种 QUIC 协议，支持端口跳跃
- [[protocols/index]] — 所有协议的对比
