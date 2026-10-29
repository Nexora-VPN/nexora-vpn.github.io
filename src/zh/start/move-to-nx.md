---
title: "迁移到 NX"
description: "Nexora 现已更名为 NX。在面板服务器上运行一次新的安装脚本：它会把面板、同机的节点和数据库迁移到新名称。" # rebrand-ok
order: 10
tags: [install, panel, node]
---

# 迁移到 NX

产品现已更名为 **NX**，发布于 [github.com/nx-panel](https://github.com/nx-panel)。0.1.0 是 NX 的第一个版本，它只认新名称：目录、服务、数据库、环境变量、Cookie 和插件约定。

**旧面板的更新按钮无法安装它。** 它会故意失败并显示发布说明，说明会指向本页。请以 root 身份在面板服务器上运行一次新的安装脚本：

```bash
bash <(curl -fsSL https://raw.githubusercontent.com/nx-panel/panel/main/install.sh)
```

## 脚本做了什么

1. 找到旧安装（`/opt/nexora-panel`、它的服务、`/var/opt/nexora`），并在 `/var/opt/nx-panel/transfer-<time>.tar.gz` 保存一份副本。<!-- rebrand-ok -->
2. 停止旧服务，把面板迁移到 `/opt/nx-panel` 和 `/var/opt/nx-panel`。旧脚本在本服务器上创建的 PostgreSQL 数据库会连同其角色一起改名。
3. 用节点脚本安装在面板旁边的节点会随之迁移到 `/opt/nx-node` 和 `/var/opt/nx-node`，并继续运行。
4. 安装 NX Panel。`nx-panel migrate` 会接管数据库、设置和备份。

如果某一步失败，旧安装会被恢复并重新运行；再次运行脚本会重试。管理员、用户、节点、模板和设置都会一起迁移。所有人都需要重新登录一次，因为会话 Cookie 换了名称。

## 然后，在面板中

- **节点**会标记为*需要迁移*。在节点页面逐个更新，或在节点上运行它的安装命令。在此之前面板仍能连接它。
- **插件**会标记为*需要迁移*。在插件页面逐个在其主机上更新：这会安装新版本并重新注册。手动安装的插件，请在那里删除，然后运行它新的安装命令。
- **OpenVPN** 配置使用新密钥：用户需要重新下载配置或订阅。**隧道**会自行重新连接。

## Docker 中的面板

容器需要手动迁移。在 compose 文件中把镜像改为 `ghcr.io/nx-panel/panel`，把每个 `NEXORA_` 变量改名为 `NX_`，然后重新启动。容器会先运行 `migrate`，它会把在新文件旁找到的数据库文件改名。PostgreSQL 数据库保留原名：由 DSN 指定使用哪一个。<!-- rebrand-ok -->

## 自己的 PostgreSQL 服务器

脚本只会改名它自己在本服务器上创建的数据库。其他数据库保留原名，面板继续使用 `/opt/nx-panel/config.json` 中的 DSN。

## 旧地址

旧网站、文档和 GitHub 组织会重定向到新地址。许可证服务在 2027 年 9 月 24 日之前同时响应两个地址。
