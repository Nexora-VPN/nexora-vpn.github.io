---
title: "卸载"
description: "从服务器上移除面板或节点，以及每种移除会保留什么。"
order: 10
tags: [install]
---

# 卸载

移除[[~panel]]或[[~node]]会去掉程序及其服务。难以替代的数据，即面板的数据库和备份以及节点的证书，会留在原处，等你确定后再自行删除。

## 面板 {#the-panel}

```bash
bash <(curl -fsSL https://raw.githubusercontent.com/nexora-vpn/panel/main/install.sh) --uninstall
```

| 移除 | 保留 |
| --- | --- |
| `nexora-panel` 服务 | `/var/opt/nexora` 中的数据库 |
| `/opt/nexora-panel`，包括程序和 `config.json` | `/var/opt/nexora/backups` 中的备份 |
| `nexora-panel` 命令 | `/var/opt/nexora` 下的节点程序、主题和规则集 |

::: danger 先复制备份
如果服务器本身也要停用，删除任何东西之前，先把 `/var/opt/nexora/backups` 复制到别处。然后自行删除其余内容：`rm -rf /var/opt/nexora`。如果同一台服务器上还运行着节点，请先阅读下一节，否则不要这样做。
:::

使用 PostgreSQL 时，数据库在 PostgreSQL 中，不会被改动。

在 Docker 中，在部署目录下用 `docker compose down` 停止。数据库、备份和其他数据会留在 compose 文件旁边的目录中（PostgreSQL 则在其命名卷中），直到你删除它们。

## 节点 {#a-node}

从面板操作：打开节点的 **安装** 抽屉，切换到 **自动 (SSH)**，然后使用 **从服务器移除**。证书会保留在原处，因此以后重新安装时面板仍能识别。

在节点服务器上，安装程序也可以移除它：

```bash
curl -fsSL https://PANEL/install-node.sh | bash -s -- --uninstall
```

它会移除服务或容器以及 `/opt/nexora-node`，保留 `/var/opt/nexora/certs` 中的证书和 `/var/opt/nexora/cache` 中的缓存。如果这台服务器不会再承载节点，请删除这两处：

```bash
rm -rf /var/opt/nexora/certs /var/opt/nexora/cache
```

或者全部手动移除：

```bash
systemctl disable --now nexora-node
rm -f /etc/systemd/system/nexora-node.service
systemctl daemon-reload
rm -rf /opt/nexora-node /var/opt/nexora/certs /var/opt/nexora/cache
```

::: danger 面板在同一台服务器上
在同时运行面板的服务器上，绝不要整个删除 `/var/opt/nexora`。该目录保存着面板的数据库。只删除 `certs` 和 `cache`。
:::

然后还要 **在面板中删除该节点**。否则它会继续占用你的许可证额度，并一直显示为离线。

## 相关内容 {#related}

- [[same-server]]：面板和节点在同一台服务器上共用哪些东西。
- [[files-and-ports]]：两者使用的所有路径。
