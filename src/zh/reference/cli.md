---
title: "命令行"
description: "nexora-panel 和 nexora-node 的所有命令，以及如何重新进入被锁在外面的面板。"
order: 2
tags: [reference, panel]
---

# 命令行

[[~panel]]和[[~node]]各是一个带有少量命令的程序。平时你几乎用不到它们：安装程序和面板页面会完成这些工作。以下情况需要它们：恢复一个无法访问的面板、在面板无法启动时还原备份，或者用脚本安装。

面板安装程序会把 `nexora-panel` 放进 PATH，它也能自己找到配置文件，所以每条命令在任何目录下都能运行。在 Docker 中，请在前面加上 `docker compose exec panel /app/`：`docker compose exec panel /app/nexora-panel config list`。

## nexora-panel {#nexora-panel}

| 命令 | 作用 |
| --- | --- |
| `run [-config FILE] [-listen IP:PORT]` | 启动面板。服务会替你执行这一步 |
| `migrate [-config FILE] [-user U -pass P]` | 创建或更新数据库表。带上 `-user` 和 `-pass` 时还会创建主管理员，适用于没有浏览器的安装；不带时面板会打开设置向导 |
| `config list` | 显示面板全局设置 |
| `config get KEY` | 读取一项设置 |
| `config set KEY VALUE` | 写入一项设置。`""` 表示清空。大多数设置在面板重启后生效 |
| `setup-token [-rotate]` | 打印设置向导的一次性令牌，或换成新令牌 |
| `admin list` | 列出管理员账户，并标出面板的所有者 |
| `admin reset-password [-user U] [-pass P]` | 设置管理员的密码 |
| `restore FILE [-passphrase P] [-yes]` | 用备份归档替换数据库 |
| `hwid` | 打印 **许可证** 页面显示的 **硬件 ID（HWID）** |
| `version` | 打印面板版本 |
| `help` | 显示命令列表 |

`-config FILE` 让命令使用另一个配置文件。会打开数据库的命令在其他参数之后接受它，例如 `nexora-panel config list -config /path/to/config.json`。

### 从命令行修改设置 {#settings-from-the-command-line}

`config` 读写只有主管理员才能修改的设置：面板的地址、域名、路径和证书，订阅域名和路径，备份，受信任代理和登录白名单，以及其他几项。`config list` 会全部列出。

机密信息（例如备份口令）只显示为 `(set)`。`config set` 会拒绝不是面板设置的键，也会拒绝面板不接受的值。备份设置无需重启，一小时内生效；其他设置请重启面板（`systemctl restart nexora-panel`）。

### restore {#restore}

```bash
systemctl stop nexora-panel
nexora-panel restore /var/opt/nexora/backups/nexora-backup-20260914-030000.tar.gz
systemctl start nexora-panel
```

它先读取归档，打印其中的内容和所有警告，然后要求你输入 `replace-database`。在脚本中改为传入 `-yes`。加密的归档需要 `-passphrase`，否则会提示输入。

与在面板中还原一样，本服务器自己的地址设置和许可证会被保留。`-keep-web-settings=false` 和 `-keep-license=false` 会改用归档中的设置。任何改动之前，都会先写入当前数据库的快照。

请先停止面板。使用 SQLite 时，替换在面板下次启动时发生，因此运行中的面板在此期间写入的内容都会丢失；使用 PostgreSQL 时，数据行会立即在面板底下被替换。

## 被锁在外面 {#locked-out}

所有可能让面板无法访问的设置，都可以在面板不运行的情况下从命令行修改：

```bash
nexora-panel config list                       # what is set
nexora-panel config set web_listen_port 2095   # a port you can reach
nexora-panel config set web_listen_ip ""       # listen everywhere again (IPv4 and IPv6)
nexora-panel config set web_domain ""          # stop restricting the hostname
nexora-panel config set web_basepath ""        # serve at the root again
nexora-panel config set sub_domain ""          # stop reserving hosts for subscriptions
systemctl restart nexora-panel
```

当面板 **没有基础路径** 时，最后一项最容易让人中招。`sub_domain` 中的域名只提供订阅，不提供其他任何内容，所以当面板位于根路径时，这些域名永远不会显示面板。如果你只使用这些域名，面板在任何地方都无法访问。设置基础路径就能避开这个陷阱：面板在每个域名下的该路径都能访问。

在 Docker 中，端口在 compose 文件中设置，而不是用 `config set`。

### 忘记密码 {#forgotten-password}

```bash
nexora-panel admin list                        # the accounts, and which one owns the panel
nexora-panel admin reset-password              # the owner; the password is typed, not shown
nexora-panel admin reset-password -user alice  # any other account
```

不带 `-user` 时，它重置面板 **所有者** 的密码。新密码需要输入两次，且从不显示。`-pass` 可以一次设好，但密码会留在 shell 历史中。

重置还会 **关闭该账户的两步验证**，以便它在面板中重新绑定，并 **结束该账户所有已打开的会话**。运行中的面板可能会在最多一分钟的活动内继续认可缓存的会话；如果这很重要，请重启面板。

### 因封禁被锁在外面 {#locked-out-by-a-ban}

同一地址登录失败五次就会被封禁，封禁在重启后依然有效。两项设置决定这个地址是谁、谁永远不会被封禁：

```bash
nexora-panel config set trusted_proxies "10.0.0.0/8"   # your reverse proxy or CDN, or empty
nexora-panel config set login_allowlist "203.0.113.7"  # addresses never banned
```

::: warning 位于代理或 CDN 之后
没有设置 `trusted_proxies` 时，位于反向代理或 CDN 之后的面板会把每个访问者都看成代理的地址，因此第一次封禁就会把所有人锁在外面。请把它设为代理的地址，并把你自己的地址放进 `login_allowlist`。
:::

重新进入后，主管理员可以在 **设置 → 安全** 中解除封禁（[[use/security]]）。

## nexora-node {#nexora-node}

节点由面板安装和配置，所以它的命令很少：

| 命令 | 作用 |
| --- | --- |
| `run [-config FILE]` | 启动节点。服务会替你执行这一步 |
| `gencerts [-dir DIR]` | 生成节点自己的证书和密钥，用于手动安装 |
| `version` | 打印节点版本 |
| `help` | 显示命令列表 |

节点的安装程序是由你的面板提供的独立脚本；它的选项列在 [[add-node#install-options]] 中。

## 相关内容 {#related}

- [[files-and-ports]]：两个程序存放文件的位置，以及它们读取的环境变量。
- [[troubleshooting]]：按症状列出的问题。
