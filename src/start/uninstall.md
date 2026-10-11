---
title: "Uninstall"
description: "Remove the panel or a node from a server, and what each removal keeps."
order: 10
tags: [install]
---

# Uninstall

Removing the [[~panel]] or a [[~node]] takes away the program and its service.
Data that is hard to replace, the panel's database and backups and the node's
certificates, is left in place for you to delete when you are sure.

## The panel

```bash
bash <(curl -fsSL https://raw.githubusercontent.com/nexora-vpn/panel/main/install.sh) --uninstall
```

| Removed | Kept |
| --- | --- |
| the `nexora-panel` service | the database in `/var/opt/nexora` |
| `/opt/nexora-panel`, with the binary and `config.json` | backups in `/var/opt/nexora/backups` |
| the `nexora-panel` command | node binaries, themes and rule sets under `/var/opt/nexora` |

::: danger Copy your backups first
If the server itself is going away, copy `/var/opt/nexora/backups` somewhere
else before you delete anything. Then remove the rest yourself:
`rm -rf /var/opt/nexora`. Do not do this if a node runs on the same server
without reading the next section.
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

It removes the service or container and `/opt/nexora-node`, and leaves the
certificates in `/var/opt/nexora/certs` and the cache in `/var/opt/nexora/cache`.
If this server will not host a node again, delete those two:

```bash
rm -rf /var/opt/nexora/certs /var/opt/nexora/cache
```

Or remove everything by hand:

```bash
systemctl disable --now nexora-node
rm -f /etc/systemd/system/nexora-node.service
systemctl daemon-reload
rm -rf /opt/nexora-node /var/opt/nexora/certs /var/opt/nexora/cache
```

::: danger Panel on the same server
Never remove `/var/opt/nexora` as a whole on a server that also runs the panel.
That directory holds the panel's database. Remove only `certs` and `cache`.
:::

Then **delete the node in the panel** too. Otherwise it keeps counting against
your licence and keeps showing as offline.

## Related

- [[same-server]]: what the panel and a node share on one server.
- [[files-and-ports]]: every path the two use.
