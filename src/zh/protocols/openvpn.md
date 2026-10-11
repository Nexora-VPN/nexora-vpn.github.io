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

**端点 → 添加**，类型选 `openvpn-server`。通用表单见 [[use/endpoints]]。表单初始包含一个随机端口、`tls` 模式、一个客户端地址池和节点证书。

| 字段 | |
| --- | --- |
| **Listen port** | 用户连接的端口 |
| **Mode** | `tls`（默认）适合客户使用：服务器用证书证明身份，每个用户用名称和密码登录。`static_key` 是所有人共用的一个密钥，没有按用户的登录 |
| **Network** | `udp`（留空时也是）或 `tcp` |
| **Address (CIDR list)** | 用户隧道地址所取自的地址池，例如 `10.9.0.1/24` |
| TLS 证书 | 默认为节点证书，也可使用 [[use/certificates]] 中的证书 |
| **Push: redirect gateway**、**Push: DNS servers**（高级） | 让设备的所有流量走 VPN，以及设备应使用的解析服务器 |
| **Advertised remote host**、**Advertised remote port**（高级） | `.ovpn` 文件中写明的服务器，用于它与节点地址不同的情况，例如经过端口转发时 |
| **Verify client certificate**（高级） | 默认关闭。要求客户端证书会使该端点从用户订阅中消失，因为面板不签发客户端证书 |

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

- 用户修改密码、被删除或被停用时，会立即从 OpenVPN 断开；其他用户保持连接。
- `tls` 模式的 OpenVPN 端点或 OpenConnect 端点，如果其模板上没有用户，就完全不提供服务：空的 OpenVPN 服务器会接受任何密码。至少有一个用户后，面板才会把它下发给节点。
- 与任何入站一样，流量统计、额度、速度和地址限制按用户生效。

## 相关内容 {#related}

- [[use/endpoints]] — 端点页面
- [[use/certificates]] — 两种端点使用的证书
- [[protocols/wireguard]] — 另一种标准 VPN
