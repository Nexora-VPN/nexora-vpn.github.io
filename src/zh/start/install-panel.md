---
title: "安装面板"
description: "用一条命令或 Docker 部署安装 NX 面板，并拿到一次性设置链接。"
order: 2
tags: [install, panel]
---

# 安装面板

[[~panel]]用一条命令安装，不问任何问题。它唯一替你做的选择是数据库，因为面板必须先有数据库，才能保存其他任何设置。其余一切都在你首次访问面板时打开的[[~setup-wizard|设置向导]]中选择。

选择要安装的内容，然后复制命令：

<NxCommandBuilder />

## 用脚本安装 {#install-with-the-script}

以 root 身份运行。使用 SQLite 时不需要其他服务：

```bash
bash <(curl -fsSL https://raw.githubusercontent.com/nx-panel/panel/main/install.sh)
```

安装程序最后会打印设置链接：

```terminal title="root@server: ~"
$ bash <(curl -fsSL https://raw.githubusercontent.com/nx-panel/panel/main/install.sh)
==> installing NX Panel (linux-amd64)
==> downloading the panel
==> downloading node binaries
==> migrating the database
database migrated: sqlite
no admin seeded; the panel will open its setup wizard on first start
==> the panel will listen on port 28431
==> NX 0.0.3 is installed

  Finish the setup by opening one of these links — whichever address
  reaches this server from where you are:

    http://203.0.113.10:28431/setup?t=9f3c1ad2…    (as the internet sees this host)

  Port 28431 was picked at random and is free on this host — open it in
  the firewall if one is running. The wizard can move it before you finish.

  Service:  systemctl status nx-panel
  Logs:     journalctl -u nx-panel -f
```

打开链接，继续阅读 [[setup-wizard]]。链接中的令牌可以创建主管理员，请勿外泄。设置完成后它就失效。

### 选项 {#options}

| 选项 | 作用 |
| --- | --- |
| `--postgres` | 在本服务器上安装并配置 PostgreSQL，用它代替 SQLite |
| `--version v1.2.3` | 安装指定的面板版本，而不是最新版 |
| `--node-version v1.2.3` | 为节点安装程序准备指定的节点版本，而不是最新版 |
| `--uninstall` | 移除面板；见 [[uninstall]] |

### SQLite 还是 PostgreSQL {#sqlite-or-postgresql}

SQLite 适合大多数面板：只有一个文件，备份和迁移都容易。以下情况选择 PostgreSQL：你已经在运行一个；数据库会放在网络存储上；或者同时产生流量的用户超过约 10,000 个。以后想切换，就用另一种数据库全新安装，再在设置向导中还原备份。

## 用 Docker 安装 {#install-with-docker}

两套部署，每种数据库一套：

```bash
git clone https://github.com/nx-panel/panel
cd panel/docker/sqlite      # or: cd panel/docker/postgres
docker compose up -d
docker compose logs panel | grep setup
```

使用 PostgreSQL 部署时，首次启动前把 `.env.example` 复制为 `.env` 并设置密码。

Docker 中的面板监听 2095 端口。该端口与发布的端口映射一起固定在 compose 文件中（`NX_WEB_LISTEN`），因此向导无法修改它：如需其他端口，请在 compose 文件中同时修改两处。在 [[use/ingress]] 中添加的其他端口也必须在 compose 文件中发布。

Docker 默认只在 IPv4 上发布端口。在仅有 IPv6 的主机上，请在 Docker 守护进程中启用 IPv6（在 `/etc/docker/daemon.json` 中设置 `"ipv6": true` 和 `"ip6tables": true`），并在两种地址族上发布：

```yaml
    ports:
      - "0.0.0.0:2095:2095"
      - "[::]:2095:2095"
```

要在同一台服务器上用 Docker 运行节点，见 [[same-server]]。

## 系统要求 {#requirements}

- 带 systemd 的 Linux：Debian 11+、Ubuntu 20.04+、RHEL 9+ 或类似系统。支持 64 位 x86 和 ARM，以及 32 位 x86 和 ARM。没有 systemd 时请使用 Docker。
- root 权限，服务器上要有 `curl` 和 `tar`。
- 面板需要一个开放的 TCP 端口。之后可以在 [[use/ingress]] 中添加更多端口。

## 安装程序做了什么 {#what-the-installer-does}

1. 按本服务器的架构把面板下载到 `/opt/nx-panel`。
2. 在 `/var/opt/nx-panel/bin` 中准备 amd64 和 arm64 的节点程序。面板之后会把它们交给节点安装程序，因此节点从你的面板下载。
3. 写入包含数据库连接的 `config.json`；使用 `--postgres` 时安装并配置 PostgreSQL。
4. 创建数据库表。
5. 随机选择一个空闲的高位端口，这样尚未设置的面板不会出现在扫描器最先查看的端口上。
6. 安装并启动 `nx-panel` 服务，并把 `nx-panel` 放进 PATH，供[[reference/cli|命令行]]使用。
7. 为找到的每个地址打印一个设置链接，排在最前的是互联网看到的本服务器地址。

它使用的所有路径都列在 [[files-and-ports]] 中。设置完成之前，面板只响应设置链接。之后再次运行同一条命令会就地更新面板；见 [[start/update]]。

### 链接丢了？ {#lost-the-link}

重新打印令牌，再用它拼出地址：

```bash
nx-panel setup-token
nx-panel config get web_listen_port
# then open http://203.0.113.10:PORT/setup?t=TOKEN
```

在 Docker 中：`docker compose exec panel /app/nx-panel setup-token`。

## IPv6 {#ipv6}

无需任何配置。面板监听 IPv6 通配地址，在双栈服务器上它同样响应 IPv4；在关闭了 IPv6 的服务器上，它会自动退回 IPv4。IPv6 设置链接会带方括号打印，浏览器需要方括号：

```
http://[2001:db8::10]:28431/setup?t=9f3c1ad2…
```

如果只想绑定一种地址族，请在向导中设置监听 IP。
