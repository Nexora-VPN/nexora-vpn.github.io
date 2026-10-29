---
title: "文件与端口"
description: "面板和节点把文件放在哪里、使用哪些端口，以及你可以设置的环境变量。"
order: 3
tags: [reference, install]
---

# 文件与端口

[[~panel]]和[[~node]]在磁盘上存放东西的位置、它们监听的端口，以及能改变它们行为的环境变量。这里没有列出的一切，从管理员和设置到用户和证书，都保存在面板的数据库中，并在面板中管理。

## 面板文件 {#panel-files}

| 路径 | 内容 |
| --- | --- |
| `/opt/nx-panel/nx-panel` | 程序 |
| `/opt/nx-panel/nx-panel.previous` | 上次更新前的程序，保留用于回退 |
| `/opt/nx-panel/config.json` | 数据库连接，仅此而已 |
| `/var/opt/nx-panel/nx.db` | SQLite 数据库（面板运行时旁边还有 `-wal` 和 `-shm` 文件） |
| `/var/opt/nx-panel/bin/` | 面板交给节点安装程序的节点程序 |
| `/var/opt/nx-panel/sub-themes/` | 订阅页面主题 |
| `/var/opt/nx-panel/presets/` | 你自己的预设目录文件，会添加到内置预设中 |
| `/var/opt/nx-panel/backups/` | 备份归档和还原前的快照（仅 root 可读） |
| `/var/opt/nx-panel/rulesets/` | 面板交给节点的规则集文件副本；可以安全清空，面板会重新下载 |
| `/etc/systemd/system/nx-panel.service` | 服务 |

在面板运行时复制数据库文件不算备份。请使用面板自带的备份功能（[[use/backup]]），它无需停止任何东西就能得到一致的副本。

`config.json` 的样子如下：

```json
{ "db": { "driver": "sqlite", "dsn": "/var/opt/nx-panel/nx.db" } }
```

使用 PostgreSQL 时，`driver` 为 `postgres`，`dsn` 为连接字符串。`max_open_conns` 设置连接池大小；除非 PostgreSQL 服务器与其他程序共用，否则不要设置。

### Docker 中 {#in-docker}

每套面板部署都把需要比容器活得更久的东西放在 compose 文件旁边：

| 路径 | 内容 |
| --- | --- |
| `./data` | SQLite 数据库（PostgreSQL 部署使用命名卷） |
| `./backups` | 备份归档 |
| `./bin` | 节点程序 |
| `./rulesets` | 规则集副本；可以安全清空 |
| `./sub-themes` | 订阅页面主题 |

## 节点文件 {#node-files}

| 路径 | 内容 |
| --- | --- |
| `/opt/nx-node/nx-node` | 程序 |
| `/opt/nx-node/config.json` | 控制端口的地址和证书路径，仅此而已 |
| `/var/opt/nx-node/certs/ssl_cert.pem` | 节点自己的证书 |
| `/var/opt/nx-node/certs/ssl_key.pem` | 它的私钥 |
| `/var/opt/nx-node/certs/panel_ca.pem` | 面板的证书，节点只接受这一张 |
| `/var/opt/nx-node/cache/` | 面板推送的规则集和其他文件（删除后面板会重新发送），以及 Tailscale 端点的登录状态（删除后即丢失） |
| `/etc/systemd/system/nx-node.service` | 服务 |

节点提供的一切都由面板发送并保存在内存中。重启后的节点在面板重新发送配置之前不提供任何服务，这只需几秒钟。证书是节点上值得备份的文件；有 Tailscale 端点的节点还应备份 `cache/tailscale`。

在 Docker 中，节点把 `./certs` 和 `./cache` 放在 compose 文件旁边。

面板和节点共用一台服务器时，`/var/opt/nx-panel` 同时存放两者的内容：数据库、`bin`、`backups` 等属于面板，`certs` 和 `cache` 属于节点。见 [[same-server]]。

## 端口 {#ports}

| 端口 | 使用者 | 用途 |
| --- | --- | --- |
| 随机的高位 TCP 端口 | 面板（脚本安装） | 面板的网页界面、API 和订阅。安装程序选择一个空闲端口并打印出来 |
| 2095 TCP | 面板（Docker） | 同上，固定在 compose 文件中 |
| 你添加的任意端口 | 面板 | 在 **设置 → 地址** 中添加的其他监听器（[[use/ingress]]）；在 Docker 中，每个端口都要在 compose 文件中发布 |
| 62050 TCP | 节点 | 控制端口。只有面板能使用它；请只允许面板的地址访问 |
| 入站的端口 | 节点 | 用户连接的端口，在面板中选择 |
| 5432 TCP，仅本地 | PostgreSQL（使用 `--postgres` 时） | 数据库，面板通过 `127.0.0.1` 访问 |

面板的端口可以在设置向导中修改，之后可以在设置页面中修改，也可以用 `nx-panel config set web_listen_port` 修改。面板和节点都同时监听 IPv6 和 IPv4，在关闭了 IPv6 的服务器上退回 IPv4。

## 环境变量 {#environment-variables}

### 面板 {#panel}

| 变量 | 作用 |
| --- | --- |
| `NX_DB_DRIVER` | `sqlite` 或 `postgres` |
| `NX_DB_DSN` | 数据库连接：SQLite 为文件路径，PostgreSQL 为连接字符串 |
| `NX_DB_MAX_OPEN_CONNS` | 数据库连接池大小 |
| `NX_WEB_LISTEN` | 固定监听地址（`IP:PORT`）。此时面板忽略设置中保存的地址，设置向导也无法修改它。Docker 部署使用这个变量 |

这些变量会覆盖 `config.json`。`nx-panel run -listen IP:PORT` 与 `NX_WEB_LISTEN` 一样固定地址。

### 节点 {#node}

| 变量 | 作用 |
| --- | --- |
| `NX_NODE_LISTEN` | 控制端口的地址，默认为 `[::]:62050` |
| `NX_NODE_CERT` | 节点的证书文件 |
| `NX_NODE_KEY` | 它的私钥文件 |
| `NX_NODE_CLIENT_CA` | 面板的证书文件 |
| `NX_STATE_DIR` | 存放 `certs` 和 `cache` 的目录，默认为 `/var/opt/nx-panel` |

这些变量会覆盖节点的 `config.json`。节点安装程序还会读取 `NX_INSTALL_TOKEN` 来代替 `--token`。

## 相关内容 {#related}

- [[reference/cli]]：两个程序的命令。
- [[install-panel]] 和 [[add-node]]：安装程序把什么放在哪里。
