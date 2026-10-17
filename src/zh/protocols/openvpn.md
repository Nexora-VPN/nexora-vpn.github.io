---
title: "OpenVPN 与 OpenConnect"
description: "向用户提供 OpenVPN 和 OpenConnect（AnyConnect），每个账户独立登录，并提供现成的 .ovpn 文件。"
order: 12
tags: [protocols, certificates]
---

# OpenVPN 与 OpenConnect

办公笔记本、路由器和受限设备上往往已经自带 OpenVPN 和 OpenConnect 这两种 VPN。Nexora 把两者都作为[[~endpoint|端点]]提供：每个用户用自己的账户名和密码登录，面板为他们生成客户端配置。

## 适用场景 {#what-they-are-good-for}

- **OpenVPN**：OpenVPN 官方应用、内置客户端的路由器和防火墙，以及任何能导入 `.ovpn` 文件的用户。
- **OpenConnect**：Cisco Secure Client（AnyConnect）和 OpenConnect 客户端，常见于工作设备。

两者都不能放在 CDN 后面。

## OpenVPN {#openvpn}

**端点 → 添加**，类型选 `openvpn-server`。通用表单见 [[use/endpoints]]。表单初始包含一个随机端口、`tls` 模式、`udp`、一个客户端地址池和节点证书。

| 字段 | |
| --- | --- |
| **Listen port** | 用户连接的端口 |
| **Mode** | `tls`（默认）是面向客户的模式：服务器用证书证明身份，每个用户用自己的名称和密码登录。`static_key` 是面向单个客户端的点对点隧道，见下文 |
| **Network** | `udp`（默认）或 `tcp`。一个端点只监听其中一种；需要两种时再添加一个端点 |
| **Address (CIDR list)** | 用户隧道地址所取自的地址池，例如 `10.9.0.1/24` |
| TLS 证书 | 默认是节点证书，或 [[use/certificates]] 中的证书。只有选择端点自带的证书时才显示证书字段 |
| **Verify client certificate**（高级） | 默认关闭。要求客户端证书会把端点从用户订阅中移除，因为面板不签发这类证书 |

**+ 添加设置**下是微调选项。大多数添加时都从节点在没有它时本就使用的值开始，因此添加后在修改之前不会改变任何东西。例外是 **Data ciphers fallback**：节点本身没有这个值，添加它会让早于 OpenVPN 2.4 的客户端用它指定的加密算法连接。

- **Data ciphers**、**Data ciphers fallback**、**Auth digest**：数据通道。fallback 用于 OpenVPN 2.4 之前的客户端。
- **Min/Max TLS version**、**TLS 1.2 cipher suites**、**TLS key exchange groups**、**Certificate profile**：控制通道的 TLS。
- **MTU**、**MSS fix (bytes)**、**Replay window (packets)**、**Max clients**、**Topology**。
- **Ping interval/restart**、**Renegotiate every/after**、**Handshake window**：服务器端的计时。

### 控制通道保护 {#control-channel-protection}

开启**控制通道保护**，用密钥对每个控制通道数据包签名（`tls_auth`）或同时加密（`tls_crypt`、`tls_crypt_v2`）。这样没有密钥的探测完全得不到响应；使用 `tls_crypt` 或 `tls_crypt_v2` 时，网络上无法读取 TLS 握手和服务器证书。三者都不能隐藏这是 OpenVPN 流量：数据包头仍然可读，无论选哪种都能据此识别出 OpenVPN。

密钥由面板生成，**重新生成**按钮会生成新密钥。每个用户的 `.ovpn` 文件和订阅都带有对应的客户端部分：

- `tls_crypt` 和 `tls_auth`：所有人使用同一个密钥。
- `tls_crypt_v2`：每个用户有自己的密钥，用服务器密钥封装。服务器密钥永远不会离开端点。用户每次得到的都是同一个密钥；重新生成服务器密钥会给所有用户新密钥，他们需要重新下载文件。

### 推送给客户端 {#push-to-clients}

**推送给客户端**是服务器在每个客户端连接后告诉它的内容。关闭时使用面板默认值：全部流量走隧道，每 10 秒 ping 一次，60 秒后重启。开启时从同样的默认值开始，可以修改：

- **Route all traffic through the tunnel** 及其标志，以及经由隧道发送的网络 **Routes**（前者关闭时只发送这些）；
- 所有客户端都读取的 **DNS servers (dhcp-option)**、**Search domains**，以及**供 OpenVPN 2.6 客户端使用的 DNS 服务器（优先级、分域 DNS、DNSSEC、DNS over TLS 或 HTTPS）**；
- **Block DNS outside the tunnel (Windows)**、额外的 DHCP 选项和客户端 ping 计时。

客户端从服务器获取所有这些内容；它们的文件不会改变。

### 静态密钥模式 {#static-key-mode}

`static_key` 模式是本端点与持有相同密钥的单个客户端之间的一条隧道，无需登录。它需要：

- **Static key**：自动生成，并带有生成新密钥的按钮；
- **Cipher**；
- **Client tunnel address**，客户端在隧道内的地址（地址池包含 IPv6 时还需要 IPv6 地址）；
- 使用 UDP 时，**Client address** 和 **Client port**：服务器只回应该地址。

这样的端点没有用户：没有 TLS，不推送任何内容，也不会生成 `.ovpn` 文件或订阅条目。它唯一的客户端需要您自己配置。

### .ovpn 文件 {#the-ovpn-file}

模板上的每个用户都会得到一个 `.ovpn` 文件，位于其 **二维码 / 链接** 对话框的 **客户端应用** 下（**保存文件**），也在其[[~subscription-page|订阅页面]]上。这个文件是完整的：

- 服务器证书就在文件里，所以自签名的节点证书无需在设备上做任何设置即可使用；
- 用户的名称和密码也在文件里，所以 OpenVPN Connect 3 和 OpenVPN 2.6 及以上版本无需询问即可连接。

内含证书的 `.ovpn` 通常太大，放不进二维码；这时对话框只提供复制和保存。文件使用节点的第一个[[~link-address|链接地址]]，因为保存下来的文件无法列出备选地址。

sing-box 应用的订阅中也会包含该端点的条目。

## OpenConnect {#openconnect}

**端点 → 添加**，类型选 `openconnect-server`。表单初始包含一个随机端口、一个客户端地址池，以及使用节点证书的 TLS。

| 字段 | |
| --- | --- |
| **Listen port** | 通常为 443，这是 AnyConnect 客户端所期望的 |
| **Client IP pool (CIDR)** | 用户隧道地址所取自的地址池 |
| TLS 证书 | 默认为节点证书，也可使用 [[use/certificates]] 中的证书。用户拿到的登录信息不含证书，所以客户端会像浏览器一样校验它：为真实域名签发的 ACME 证书可以避免设备上出现警告或拒绝连接 |
| **Pushed DNS servers** | 设备应使用的解析服务器 |
| **Search domain**、**Split-include routes**、**MTU**、**DPD/keepalive (seconds)**（高级） | 与任何 AnyConnect 服务器相同 |

OpenConnect 客户端使用服务器地址和登录信息，而不是文件。用户的 **客户端应用** 选项卡和订阅页面会显示这两项。sing-box 应用的订阅中也会包含该端点。

## 用户 {#users}

- **在 OpenVPN 上每个用户同一时间只有一台设备。** 用同一账户登录的第二台设备会接管会话，第一台被断开。使用 TCP 时它立即察觉；使用 UDP 时它不会收到通知，要到下一次 ping 超时时才察觉。两种情况下它都会重新连接并夺回会话。因此同一用户的两台设备会不断互相挤掉，而立即重连的客户端（例如 sing-box 应用）总是获胜。请给每台设备单独的账户，或让第二台设备使用其他协议。**Allow duplicate CN** 可以取消这条规则，但这样每次连接都会得到新的隧道地址，设有地址限制的用户在重连后可能会被拒绝几分钟。
- 用户修改密码、被删除或被停用时，会立即从 OpenVPN 断开；其他用户保持连接。
- `tls` 模式的 OpenVPN 端点或 OpenConnect 端点，如果其模板上没有用户，就完全不提供服务：空的 OpenVPN 服务器会接受任何密码。至少有一个用户后，面板才会把它下发给节点。
- 与任何入站一样，流量统计、额度、速度和地址限制按用户生效。

## 相关内容 {#related}

- [[use/endpoints]] — 端点页面
- [[use/certificates]] — 两种端点使用的证书
- [[protocols/wireguard]] — 另一种标准 VPN
