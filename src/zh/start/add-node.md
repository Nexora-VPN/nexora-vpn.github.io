---
title: "添加节点"
description: "把服务器添加到面板并在上面安装节点：用一条命令，或通过 SSH 自动安装。"
order: 4
tags: [install, node]
---

# 添加节点

[[~node]]是用户连接的服务器。它没有数据库，也没有自己的设置：一切都由[[~panel]]告诉它。你先在面板中添加节点，面板随后给出安装它的命令。

<NxShot page="node-install" alt="节点的安装抽屉：包含安装命令的“手动”选项卡和“自动 (SSH)”选项卡" />

## 开始之前 {#before-you-start}

- 一台带 systemd 或 Docker 的 Linux 服务器。支持 amd64、arm64、armv5/v6/v7、386、s390x 和 riscv64。
- root 权限，或可以使用 sudo 的用户。
- 面板能通过 IPv4 或 IPv6 访问的 TCP **62050** 端口。
- 节点入站要使用的端口。这些端口之后在面板中选择。

节点不需要自己的许可证密钥。面板的许可证决定它能管理多少个节点。

## 用面板给出的命令安装 {#install-with-the-panel-s-command}

1. 打开 **节点** 并添加一个节点。填写 **名称** 和 **地址**，即面板访问它所用的 IP 或域名。**端口** 保持 62050。
2. 在该节点上打开 **安装**。开始安装时会先保存节点。
3. 在 **手动** 选项卡中复制命令。它类似这样：

   ```bash
   curl -fsSL https://PANEL/install-node.sh | bash -s -- --panel PANEL --token TOKEN --port 62050
   ```

   命令中的 `--port` 就是节点的 **端口**。要换端口，请在节点对话框中修改，而不是改命令：面板连接的是那里保存的端口，这条命令和自动安装都会让节点监听它。如果节点在端口转发之后，请在两端使用相同的端口号：每次安装和更新都会让节点监听已保存的 **端口**。

4. 在节点服务器上以 root 身份运行它。

::: info 使用自签名证书的面板
设置向导让面板以自签名证书启动，节点上普通的 `curl` 会拒绝它。面板知道这种情况，此时它给出的命令会按证书的密钥来校验面板：

```bash
curl -fsSLk --pinnedpubkey 'sha256//KEY' https://PANEL/install-node.sh | bash -s -- --panel PANEL --token TOKEN --port 62050 --pin 'sha256//KEY'
```

这里的 `-k` 并没有关闭校验：`--pinnedpubkey` 仍会拒绝任何密钥与你的面板不符的服务器，`--pin` 让安装脚本从面板的下载也同样校验。请按面板显示的原样复制命令。面板拿到 Let's Encrypt 或其他 ACME 机构签发的证书（[[use/certificates]]）后，命令会恢复为普通形式。

使用纯 HTTP 的面板显示的命令会明确写出 `http://`。这种连接上没有任何校验；如果你不信任两台服务器之间的网络，请优先使用[通过 SSH 自动安装](#install-automatically-over-ssh)：

```bash
curl -fsSL http://PANEL/install-node.sh | bash -s -- --panel http://PANEL --token TOKEN --port 62050
```
:::

::: warning 面板 v0.0.3 及更早版本
这些面板无论证书如何都显示普通命令。面板使用自签名证书时，请给 `curl` 加上 `-k`，给脚本加上 `--insecure`：

```bash
curl -fsSLk https://PANEL/install-node.sh | bash -s -- --panel PANEL --token TOKEN --insecure
```

这样会跳过“下载确实来自你的面板”这一检查。使用纯 HTTP 的面板根本无法使用这条命令；请改用通过 SSH 自动安装。
:::

不到一分钟，它会：

1. **从你的面板** 而不是从互联网下载节点程序；
2. 用令牌换取面板的证书。令牌只能用一次，并会过期；
3. 生成节点自己的证书；
4. 写入 `/opt/nexora-node/config.json` 和一个服务，然后启动它。

随后面板发起连接。它在第一次连接时记住节点的证书，之后只接受这一张证书；节点也只接受这个面板。其他任何东西都无法使用 62050 端口。

节点在节点页面上显示为 **已连接**。在拥有[[~template|模板]]之前，它不提供任何服务：编辑节点，在模板字段中选择一个。你的第一个模板在 [[first-user]] 中创建。

## 通过 SSH 自动安装 {#install-automatically-over-ssh}

面板可以自己完成这一切。在节点的 **安装** 抽屉中切换到 **自动 (SSH)**：

1. 填写 **SSH 主机**、**SSH 端口**、**用户**，以及 **密码** 或 **私钥**。非 root 用户需要 sudo。
2. 点击 **检测**。面板会报告服务器的系统、架构、是否有 systemd 或 Docker、已经装了什么，然后显示它的安装计划。
3. 点击 **安装**。输出会实时回传。

这种方式通过 SSH 连接 **上传** 所有内容：安装程序、面板证书和节点程序。服务器不需要能访问面板，也不需要令牌。

凭据只用于这一次连接，不会保存。勾选 **在此服务器上授权面板密钥**，面板以后就能用自己的密钥登录，更新时不再需要密码。用节点菜单中的 **撤销面板密钥** 可以收回这一权限。

第一次连接会记住服务器的 SSH 主机密钥。如果服务器之后出示不同的密钥，面板会拒绝连接并提示原因。确实更换了机器时，请使用节点菜单中的 **迁移到其他服务器**。

## 防火墙 {#firewall}

62050 端口只接受面板，但也没有理由对所有人开放：

```bash
ufw allow from 203.0.113.10 to any port 62050 proto tcp
```

如果面板通过 IPv6 访问节点，规则中必须写面板的 IPv6 地址：IPv4 规则不覆盖 IPv6 连接。

给节点分配模板、知道它使用哪些端口之后，再开放用户要连接的端口。

## 安装选项 {#install-options}

把这些选项加在命令末尾：

| 选项 | 作用 |
| --- | --- |
| `--port PORT` | 控制端口；已安装的节点保留其绑定地址，只更换端口（默认：保持现状，否则为 `[::]:62050`） |
| `--listen ADDR` | 完整的控制地址（主机和端口）；优先于 `--port` 和已安装的设置 |
| `--method script\|docker` | 安装为 systemd 服务或容器（默认：保持现有方式） |
| `--source panel\|github` | 从面板或公开发布版获取程序 |
| `--version TAG` | 安装指定的节点版本（从 GitHub 获取） |
| `--image REF` | `--method docker` 使用的容器镜像 |
| `--binary-url URL` | 从其他地址下载程序 |
| `--binary-file PATH` | 使用本服务器上已有的程序 |
| `--ca-file PATH` | 使用本服务器上已有的面板证书，而不是令牌 |
| `--pin sha256//KEY` | 按密钥接受面板的证书（需要时面板会自动加上） |
| `--insecure` | 下载时不检查面板的 TLS 证书 |
| `--detect` | 打印本服务器上的情况，不做任何修改 |
| `--uninstall` | 停止并移除节点 |

面板为 amd64 和 arm64 准备了程序。其他架构上，安装程序从 GitHub 获取节点。如果安装因 `node binary not provisioned` 而中止，见 [[troubleshooting]]。

## Docker {#docker}

**手动** 选项卡还显示一条 Docker 命令：就是加上 `--method docker` 的同一条命令。安装程序会替你写好 compose 文件并启动容器。

如果想手动运行节点的 compose 文件，请把同一选项卡中 **mTLS 证书** 下显示的证书保存为 `certs/panel_ca.pem`，然后：

```bash
git clone https://github.com/nexora-vpn/node
cd node
mkdir -p certs
cp /path/to/panel_ca.pem certs/
docker compose up -d
```

节点容器使用主机网络，因此入站端口无需修改 compose 文件即可工作。

## IPv6 {#ipv6}

无需额外操作。节点同时监听 IPv4 和 IPv6，在关闭了 IPv6 的服务器上会退回 IPv4。添加只有 IPv6 地址的节点时，地址直接书写（`2001:db8::1`）；面板会在链接中需要的地方加上方括号。

## 下一步 {#next}

- [[first-user]] 让节点有内容可提供。
- [[use/nodes]] 介绍节点页面上的其他所有功能。
- 如果这个节点与面板共用服务器，见 [[same-server]]。
