---
title: "Moving to NX"
description: "Nexora is now NX. Run the new install script once on the panel's server: it moves the panel, a node beside it and its database to the new names." # rebrand-ok
order: 10
tags: [install, panel, node]
---

# Moving to NX

The product is now **NX**, published from
[github.com/nx-panel](https://github.com/nx-panel). Version 0.1.0 is the first
NX release, and it uses only the new names: its directories, services, database,
environment variables, cookies and the addon contract.

**The update button of an older panel cannot install it.** It fails on purpose
and shows the release notes, which point here. Run the new install script once,
as root, on the panel's server:

```bash
bash <(curl -fsSL https://raw.githubusercontent.com/nx-panel/panel/main/install.sh)
```

## What the script does

1. It finds the old install (`/opt/nexora-panel`, its service, `/var/opt/nexora`) <!-- rebrand-ok -->
   and saves a copy in `/var/opt/nx-panel/transfer-<time>.tar.gz`.
2. It stops the old service and moves the panel to `/opt/nx-panel` and
   `/var/opt/nx-panel`. A PostgreSQL database that the old script set up on this
   server is renamed, with its role.
3. A node installed beside the panel with the node script moves with it, to
   `/opt/nx-node` and `/var/opt/nx-node`, and keeps running.
4. It installs NX Panel. `nx-panel migrate` picks up the database, the settings
   and the backup archives.

If a step fails, the old install is put back and runs again; running the script
again tries once more. Your admins, users, nodes, templates and settings come
along. Everyone is logged out once, because the session cookie has a new name.

## Then, in the panel

- **Nodes** are marked *Needs migration*. Update each one from the Nodes page,
  or run its install command on the node. Until then the panel still reaches it.
- **Addons** are marked *Needs migration*. Update each one on its host from the
  Addons page: that installs its new release and registers it again. For an
  addon installed by hand, remove it there and run its new install command.
- **OpenVPN** profiles use new keys: users download their profile or their
  subscription again. **Tunnels** reconnect by themselves.

## A panel in Docker

Containers are moved by hand. In your compose file, change the image to
`ghcr.io/nx-panel/panel`, rename every `NEXORA_` variable to `NX_`, and start <!-- rebrand-ok -->
it again. The container runs `migrate` first, which renames the database file it
finds beside the new one. A PostgreSQL database keeps its name: the DSN says
which one to use.

## A PostgreSQL server of your own

The script renames only a database it set up on this server. Any other keeps its
name, and the panel goes on using the DSN in `/opt/nx-panel/config.json`.

## The old addresses

The old website, documentation and GitHub organisation redirect to the new
ones. The licence service answers on both addresses until 24 September 2027.
