---
title: "从其他面板迁移"
description: "用 nexora-migrate 向导把其他 VPN 面板的用户、入站、路由和管理员复制到 Nexora。"
order: 7
tags: [migration, install]
---

# 从其他面板迁移

**nexora-migrate** 是一个小程序，可以把其他 VPN 面板的用户和设置复制到 Nexora：凭据、剩余流量、到期日期、入站、出站、路由、DNS 和管理员。只要旧面板的链接格式允许，你的客户可以继续使用已有的订阅链接。

它在你的电脑或服务器上作为本地网页向导运行，读取旧面板，再通过 Nexora 面板的 API 写入。

## 支持哪些面板 {#which-panels}

| 面板 | 读取来源 | 迁移的内容 |
| --- | --- | --- |
| **s-ui** | 数据库文件，或正在运行的面板 | 用户、入站、出站、端点、路由、DNS、管理员 |
| **3x-ui** | 数据库文件，或正在运行的面板 | 用户、入站、作为端点的 WireGuard、出站、路由、DNS、管理员 |
| **x-ui**（原版及其分支） | 数据库文件，或正在运行的面板 | 与 3x-ui 相同 |
| **Marzban** | 正在运行的面板 | 用户、管理员、入站、出站、路由、DNS |
| **PasarGuard** | 正在运行的面板 | 与 Marzban 相同；每个核心配置成为一个独立的模板 |
| **Hiddify** | 正在运行的面板 | 用户和管理员 |
| **Marzneshin** | 正在运行的面板 | 用户和管理员 |
| **Remnawave** | 正在运行的面板 | 用户 |

s-ui、3x-ui 和 x-ui 把所有内容保存在一个 SQLite 文件中，你可以把它从服务器上复制下来拖到页面上；旧面板不必在运行。3x-ui 和 x-ui 的文件都叫 `x-ui.db`，但保存路由的方式不同：3x-ui 请选 **3x-ui**，原版 x-ui 及其分支请选 **x-ui**。选错时用户仍会迁移过来，但路由和出站为空，向导会给出警告。

其他面板通过它们自己的 API 读取，需要 sudo 管理员的登录信息或 API 密钥。

## 运行 {#run-it}

从[发布页面](https://github.com/nexora-vpn/nexora-migrate/releases/latest)下载适合你系统的版本（Windows、Linux 和 macOS）。在 Linux 上：

```bash
curl -LO https://github.com/nexora-vpn/nexora-migrate/releases/latest/download/nexora-migrate-linux-amd64.tar.gz
tar -xzf nexora-migrate-linux-amd64.tar.gz
./nexora-migrate
```

在 Windows 上，解压后双击 `nexora-migrate.exe`。在 macOS 上，先运行一次 `xattr -d com.apple.quarantine nexora-migrate` 解除下载隔离。

它会打印类似 `http://127.0.0.1:8787/?key=…` 的链接。在浏览器中打开它。密钥只能用一次，向导只监听 `127.0.0.1`。要在服务器上运行时，不要开放端口；通过 SSH 隧道访问，在你自己的电脑上打开链接：

```bash
ssh -L 8787:127.0.0.1:8787 root@203.0.113.10
```

`-listen 127.0.0.1:9000` 可选择其他端口，`-no-browser` 只打印链接。

## 五个步骤 {#the-five-steps}

1. **源面板。** 选择旧面板，然后提供它的数据库文件或地址。地址请按你平时打开它的样子原样粘贴，包括任何秘密路径。
2. **检查并选择。** 每个转换后的条目都分组列出。可以全选、选一个分组或选单行。黄色行会带着改动迁移过来，备注说明了改动内容。红色行无法迁移，列出来是为了让你知道。
3. **连接 Nexora。** 填写 Nexora 面板的地址，以及用户名和密码或 API 令牌。启用了两步验证登录时，还要填写当前验证码。
4. **预览。** 准确显示将创建的内容、许可证剩余的额度，以及已经存在的名称。此时还没有写入任何东西。
5. **迁移。** 实时显示进度。结束时可以保存一份报告。

## 迁移前须知 {#what-to-know-before-the-transfer}

- **订阅链接。** Nexora 也响应旧的 `/sub/{token}` 链接。对于 s-ui、3x-ui、x-ui、Marzban 和 PasarGuard，只要旧域名指向 Nexora，现有链接就能继续使用。Marzneshin、Hiddify 和 Remnawave 的用户会得到新链接；向导会按用户逐一说明。
- **每个用户一套凭据。** Nexora 为每个用户保存一个 UUID 和一个密码。如果旧面板为每种协议各保存一套，UUID 取自 VLESS/VMess，密码取自 Trojan/Shadowsocks，并在该行注明丢弃了哪些。
- **入站会转换为 Nexora 的格式。** Nexora 中没有对应项的设置，例如 fallback、mux 和 TCP 头部混淆，会被丢弃并在该行注明。没有私钥的 REALITY 入站会得到新密钥，因此其用户需要新链接。把入站放到节点上之前，请逐一检查。
- **`direct` 出站。** Nexora 会自行为每个节点提供 `direct` 出站，因此不会再次创建旧的那个，引用它的规则会改用 Nexora 的。
- **WireGuard 对等端** 会按原样迁移到其端点上。它们不会成为 Nexora 用户。
- **迁移期间节点会暂停**，在结束时统一同步一次，以避免成千上万次更新。即使迁移失败，节点也会重新启用。
- **管理员密码无法迁移。** 导入的管理员会得到一个生成的密码，只在最后一页显示一次，不会保存在任何地方。请把它记下来。

## 迁移之后 {#after-the-move}

导入的入站、出站和规则会被归入一个 Nexora [[~template|模板]]。把该模板分配给你的节点，然后检查节点能否连接、链接能否使用（[[first-user]]）。

运行期间，该程序持有两个面板的登录信息。之后它不保留任何东西：拖入的数据库文件在程序关闭时被删除，报告只在你要求时才保存。
