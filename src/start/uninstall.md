---
title: "Uninstall"
description: "Remove the panel or a node from a server, and what each removal keeps."
order: 11
tags: [install]
---

# Uninstall

Removing the [[~panel]] or a [[~node]] takes away the program and its service.
Data that is hard to replace, the panel's database and backups and the node's
certificates, is left in place for you to delete when you are sure.

## The panel

```bash
bash <(curl -fsSL https://raw.githubusercontent.com/nx-panel/panel/main/install.sh) --uninstall
```

| Removed | Kept |
| --- | --- |
| the `nx-panel` service | the database in `/var/opt/nx-panel` |
| `/opt/nx-panel`, with the binary and `config.json` | backups in `/var/opt/nx-panel/backups` |
| the `nx-panel` command | node binaries, themes and rule sets under `/var/opt/nx-panel` |

::: danger Copy your backups first
If the server itself is going away, copy `/var/opt/nx-panel/backups` somewhere
else before you delete anything. Then remove the rest yourself:
`rm -rf /var/opt/nx-panel`. A node on the same server keeps its own files in
`/var/opt/nx-node` and is not affected.
:::

With PostgreSQL, the database lives in PostgreSQL and is not touched.

In Docker, stop the stack with `docker compose down` in its directory. The
database, backups and other data stay in the directories next to the compose
file (and, for PostgreSQL, in its named volume) until you delete them.

## A node

From the panel: open the node's **Install** drawer, switch to **Automatic
(SSH)** and use **Remove from server**. The certificates are left in place, so a
reinstall later is still recognised by the panel.

On the node's server, the installer removes it too:

```bash
curl -fsSL https://PANEL/install-node.sh | bash -s -- --uninstall
```

It removes the service or container and `/opt/nx-node`, and leaves the
certificates in `/var/opt/nx-node/certs` and the cache in `/var/opt/nx-node/cache`.
If this server will not host a node again, delete those two:

```bash
rm -rf /var/opt/nx-node/certs /var/opt/nx-node/cache
```

Or remove everything by hand:

```bash
systemctl disable --now nx-node
rm -f /etc/systemd/system/nx-node.service
systemctl daemon-reload
rm -rf /opt/nx-node /var/opt/nx-node/certs /var/opt/nx-node/cache
```

::: tip Panel on the same server
The panel keeps its files in `/var/opt/nx-panel`, so removing the node's leaves
the panel untouched.
:::

Then **delete the node in the panel** too. Otherwise it keeps counting against
your licence and keeps showing as offline.

## Related

- [[same-server]]: what the panel and a node share on one server.
- [[files-and-ports]]: every path the two use.
