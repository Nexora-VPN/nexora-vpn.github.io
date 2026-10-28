---
title: "端点"
description: "通过每用户密钥和应用配置文件为用户提供 WireGuard、OpenVPN 和 OpenConnect，或把节点连接到另一个网络。"
order: 12
group: core
tags: [protocols]
---

# 端点

[[~endpoint|端点]]是同时作为入口和出口的接口。WireGuard、OpenVPN 和 OpenConnect 都是端点：用户用该协议的专用应用连接，面板为每个用户提供一个可导入的配置文件。端点位于**核心配置 → 端点**，和入站一样通过[[templates|模板]]到达节点。

<NxShot page="endpoints" alt="端点页面：端点标签和类型的列表，显示每个端点的监听地址和客户端地址池" />

## 为用户服务还是对外连接 {#serving-users-or-connecting-out}

端点承担两种工作之一，由监听端口决定：

- **有监听端口**时，它为你的用户提供服务。其模板的每个用户都会在上面拥有一个账户。
- **没有监听端口**时，它是客户端：节点向外连接到另一个网络，路由可以像使用[[~outbound|出站]]一样把流量送过去。列表会把这种端点标记为**仅客户端**。

| 类型 | 为用户服务 | 对外连接 |
| --- | --- | --- |
| `wireguard` | 是，有监听端口时 | 是，没有监听端口时 |
| `openvpn-server` | 是 | |
| `openconnect-server` | 是 | |
| `openvpn-client` | | 是 |
| `openconnect` | | 是 |
| `tailscale` | | 加入 Tailscale 网络 |

**客户端地址**列显示用户隧道地址所取自的地址池。

## WireGuard {#wireguard}

为用户服务的 WireGuard 端点需要 **Address (CIDR list)**（用户地址所取自的地址池）和 **Listen port (set to serve panel users)**。服务器的 **Private key** 会自动生成。

你永远不需要处理用户密钥。对于每个能访问该端点的用户，面板会：

- 为该用户生成专属的密钥对；
- 根据账户 id 计算出地址池中的一个固定地址分配给该用户，因此它永不改变，也不会与其他用户冲突；
- 在模板的每个节点上把该用户添加为 peer。

由于地址跟随账户 id，地址池必须覆盖到你最大的账户 id，而不只是用户数量。id 超出地址池范围的账户在该端点上不会有 peer。使用 `10.8.0.1/24` 时，约 250 以内的账户 id 可以容纳；面板规模较大或运行已久时，请使用更大的地址池，例如 `10.8.0.1/16`。

添加或移除用户会在其节点上重建 WireGuard 端点，已连接的 WireGuard 客户端会在约二十秒内恢复。

选项和客户端应用见 [[protocols/wireguard]]。

## OpenVPN 和 OpenConnect {#openvpn-and-openconnect}

`openvpn-server` 或 `openconnect-server` 端点通过账户名和密码验证每个用户。两者都提供 TLS，因此像 TLS 入站一样需要证书：在 **TLS 证书**中选择节点证书、[[use/certificates]] 中已存储的证书，或端点自带的证书。

只有当 **TLS 证书**选为端点自带的证书时才显示证书字段；其他 TLS 设置位于其下方。

在 OpenVPN 服务端上，**Address (CIDR list)** 是用户地址所取自的地址池。**推送给客户端**决定客户端是否把所有流量都经由它发送以及使用哪些解析器，开启**控制通道保护**后没有密钥的探测得不到响应；每个用户的文件都带有对应的密钥。在 OpenConnect 上，地址池是 **Client IP pool (CIDR)**，另有 **Pushed DNS servers** 和 **Split-include routes**。

**+ 添加设置**下的设置大多从节点在没有它们时本就使用的值开始，因此添加后在修改之前不会改变任何东西；例外见 [[protocols/openvpn]]。

完全没有用户的 `tls` 模式 OpenVPN 服务端或 OpenConnect 服务端不会启动：在其模板有用户之前，面板不会把它包含在发送的配置中。静态密钥模式的 OpenVPN 服务端没有用户，会按原样启动。

选项和客户端应用见 [[protocols/openvpn]]。

## 向外连接 {#connecting-out}

`openvpn-client` 端点列出它的**服务器**，按顺序（或随机）尝试，直到有一个响应；每个都有自己的端口和网络。拖动服务器的手柄即可调整顺序。在 `tls` 模式下，它需要用户名和密码、服务器的 CA 证书，以及在**控制通道保护**中填写服务器运营者提供的密钥。在 `static_key` 模式下，它需要静态密钥、加密算法和隧道地址。压缩只为不开启就无法连接的旧服务器提供，并带有警告：在加密隧道上它会泄露所传输的内容。

`openconnect` 端点可以用**一次性密码**（TOTP 或 RSA SecurID）回应第二因素认证，用**登录表单答案**回应额外的登录字段，因为节点上没有人可以输入它们。证书以文本粘贴；表单不引用节点上的任何文件。

## Tailscale {#tailscale}

`tailscale` 端点使用 **Auth key** 把节点加入 Tailscale 网络；使用 Headscale 服务器时，还需填写 **Control server URL (Headscale)**。它可以 **Advertise routes (CIDR list)**、**Advertise tags** 或 **Advertise as exit node**，也可以把另一台设备用作 **Exit node**。它不为面板用户提供服务；用它从节点访问私有网络，或经由私有网络把流量发送出去。

节点把该端点的登录状态保存在自己的缓存目录中。重新安装节点会保留缓存。如果缓存被清除，端点会用它的 auth key 作为新设备重新登录，所以请使用可重复使用的密钥（无论是否 ephemeral）；已经用过的一次性密钥需要换成新的。更换标签、auth key 或控制服务器同样会作为新设备重新登录。

## 应用配置文件 {#app-config-files}

WireGuard、OpenVPN 和 OpenConnect 用户导入的是文件，而不是链接。面板为每个用户在每个端点和节点上生成一个文件：

| 端点 | 文件 | 包含内容 |
| --- | --- | --- |
| WireGuard | `.conf` | 用户自己的私钥和地址，以及服务器的公钥和地址 |
| OpenVPN | `.ovpn` | 内嵌的服务器证书、用户名和密码，以及启用控制通道保护时的密钥（服务器共用的那一个密钥；使用 `tls_crypt_v2` 时为用户自己的密钥） |
| OpenConnect | `.txt` | 服务器地址以及用户名和密码 |

用户可以在两个地方找到这些文件：

- 在他们的[[~subscription-page|订阅页面]]上，每个文件都附有二维码、文本和下载按钮。
- 你可以从用户所在行分发：**二维码 / 链接**会打开**客户端应用**，每个文件都有**保存文件**和二维码。文件太大无法生成二维码时，只提供文本和下载。

配置文件只写入一个地址。它使用节点的第一个链接地址，即主地址，因此调整节点链接地址的顺序会改变用户之后下载的文件。用户已经保存的文件仍是旧地址；请给他们发送新文件。见 [[nodes]]。

## 只给一个节点的端点 {#per-node-endpoints}

端点会到达模板选择了它的那些节点。对于只有某一台服务器需要使用的、连接上游网络的 WireGuard 客户端，请给这个节点一个选择该端点的、它自己的模板。见 [[templates#a-template-of-its-own]]。

## 编辑和删除 {#editing-and-deleting}

修改会到达携带该端点的每个节点。**创建副本**会以新的标签和监听端口复制一个端点。只要选择了某个端点的模板中还有路由规则或默认出站引用它，面板就会拒绝删除它，并列出这些引用。

## 相关页面 {#related}

- [[protocols/wireguard]]、[[protocols/openvpn]]：协议详情。
- [[templates]]：端点如何到达节点和用户。
- [[use/certificates]]：OpenVPN 和 OpenConnect 的证书。
- [[use/subscriptions]]：提供这些文件的订阅页面。
