---
title: "一个端口承载多个入站"
description: "用一个按服务器名称、ALPN 或路径分流的 ingress，把多个入站放在同一个端口后面，并选择由哪一端完成 TLS。"
order: 14
tags: [protocols, tls]
---

# 一个端口承载多个入站

ingress 是一种独占一个端口（通常是 443）的入站，它根据客户端请求的名称、ALPN 或路径，把每个连接交给另一个入站。借助它，使用 [[~reality|REALITY]] 的 VLESS、基于 WebSocket 的 Trojan 等可以在一个节点上共用 443 端口，各自保留自己的用户、统计和限制。

## 适用场景 {#what-it-is-good-for}

- **只有一个开放端口**（通常是 443），却要在上面提供多个入站。
- **一个地址上的不同名称**：`a.example.com` 指向一个入站，`b.example.com` 指向另一个。
- **对任何不是你用户的访问者，表现得像一台普通 Web 服务器。**

ingress 本身没有用户，也从不出现在订阅中。出现在订阅中的是它的子入站，使用 ingress 的端口。

## 创建 {#create-it}

1. 先创建要放在它后面的入站（即**子入站**）。参见 [[use/inbounds]]。
2. **入站 → 添加**，类型选 `ingress`。**Port** 默认为 443。
3. 在 **TLS** 选项卡上决定模式（见下文）。
4. 在 **Protocol** 选项卡上，用 **添加规则** 为每个子入站加一条规则，再加一个 **兜底**。
5. **保存**，并把 ingress **及其子入站**放到同一个[[~template]]上。

## 规则 {#rules}

规则自上而下检查，第一个匹配的生效，所以请把最具体的放在前面（**上移**、**下移**）。

| 字段 | 匹配内容 |
| --- | --- |
| **服务器名称 (SNI)** | 客户端请求的名称。精确匹配；以点号开头时（`.example.com`）为后缀匹配。留空匹配任意名称 |
| **ALPN** | 协商的应用层协议，例如 `h2` 或 `http/1.1` |
| **路径** | WebSocket 或 HTTPUpgrade 子入站请求的路径，使多个子入站可以共用一个名称。以 `/` 结尾表示前缀匹配。仅限终止模式 |
| **发送到** | 一个子入站，或带 **地址** 和 **端口** 的 **外部地址…** |

一条规则中的所有条件都必须匹配；一个条件中的多个值是“或”的关系。对于外部地址，**PROXY 协议** 会把客户端的真实地址传给能读取它的服务器，例如 nginx。子入站不需要这个：它总能看到客户端的真实地址。

**兜底** 接收所有未被任何规则匹配的连接。务必设置一个；可选项取决于模式。

## 两种模式：由哪一端完成 TLS {#two-modes-which-end-does-tls}

只能由一端完成 TLS：ingress 或其子入站。

### 窥探模式：ingress 上关闭 TLS {#peek-mode-tls-off-on-the-ingress}

ingress 只读取 TLS 握手的第一条消息（其中带有服务器名称和 ALPN），然后把整个连接转交出去。**每个子入站自己完成 TLS**：用自己的证书，或用 REALITY。

- 每个子入站都必须启用 TLS 或 REALITY，否则没有可用于路由的信息。
- 不能使用 **路径** 规则：握手之后的一切都是加密的。
- 兜底可以是运行真实 Web 服务器的 **外部地址…**，由它用自己的证书应答。

把 REALITY 入站放在 ingress 后面时使用这种模式。

### 终止模式：ingress 上开启 TLS {#terminate-mode-tls-on-the-ingress}

ingress 用其 **TLS** 选项卡上的证书自己完成 TLS 握手，再把明文流交给各个子入站。**子入站不带 TLS。**

- 可以使用 **路径** 规则，适用于使用 HTTP/1.1 的子入站（WebSocket、HTTPUpgrade）。gRPC 和任何基于 HTTP/2 的传输以压缩形式携带路径；请改用 **ALPN** 区分它们。
- **ALPN** 规则只匹配 ingress 提供的协议。请把它加入 ingress **TLS** 选项卡上的 ALPN 列表，否则面板拒绝保存。
- 兜底或任意规则都可以是 **模拟的网页响应…**，它像普通 Web 服务器一样应答：**固定页面**、**真实站点（反代）** 或 **文件目录**（节点上的绝对路径）。三者中真实站点最逼真。
- 用户链接的 TLS 设置取自 ingress，因为子入站自己的设置永远到不了客户端。

无法建立的模拟响应（目录不存在、地址错误）只会禁用它自己那条规则；其他子入站照常工作。

## 子入站 {#children}

以下入站类型可以放在 ingress 后面：VLESS、VMess、Trojan、AnyTLS、Snell、Shadowsocks、ShadowTLS、Sudoku、SSH、SOCKS、HTTP、mixed 和 direct。UDP 协议（Hysteria2、TUIC 等）、NaiveProxy、Mieru、MTProxy、TrustTunnel 以及另一个 ingress 都不行，面板会拒绝指向它们的规则。

子入站有两种存在方式：

| 子入站 | 访问方式 | 在订阅中 |
| --- | --- | --- |
| **有自己的端口** | 直接访问，也可经 ingress 访问 | 两条：它自己的一条，以及一条名为 `<child>-<ingress>` 的 |
| **没有端口** | 只能经 ingress 访问 | 一条，经由 ingress |

经由 ingress 的条目使用 ingress 的端口和规则的服务器名称。既没有端口、也没有 ingress 路由到它的入站，会在入站列表中标记为 **不可达**，并且不会出现在订阅中，直到你给它一个端口或一条规则。

当一对入站的 TLS 与模式不符（两端都有 TLS，或都没有），或某条规则指向不存在的入站时，面板会显示警告，但仍然保存。ingress 常常先于子入站创建，请边做边修正。

## 模板与节点 {#templates-and-nodes}

一个模板可以只携带 ingress 的部分子入站：一个模板在 443 上提供 VLESS 和 Trojan，另一个只提供 VLESS。在每个节点上，子入站不在场的规则会被去掉，没有剩余规则的 ingress 也会被去掉。

## 经由 CDN {#behind-a-cdn}

ingress 本身不能被前置，但适合 CDN 的子入站可以。CDN 会自己与你的节点建立连接，携带的是**前置**的主机名，而不是子入站的，所以规则必须列出前置的主机名（或 `.cdn.example.com` 这样的后缀）。否则连接会进入兜底，用户永远到不了。面板会在前置上提示这一点。参见 [[use/fronting]]。

## 高级 {#advanced}

**ClientHello timeout**（高级，位于 **Protocol** 选项卡）是 ingress 放弃之前等待客户端第一条握手消息的时长。

## 相关内容 {#related}

- [[protocols/vless-reality]] — 窥探模式下最常见的子入站
- [[use/inbounds]] — 入站页面
- [[use/certificates]] — ingress 终止 TLS 时使用的证书
