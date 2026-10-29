---
title: "Files and ports"
description: "Where the panel and the node keep their files, which ports they use, and the environment variables you may set."
order: 3
tags: [reference, install]
---

# Files and ports

Where the [[~panel]] and the [[~node]] keep things on disk, which ports they
listen on, and the environment variables that change either. Everything not
listed here, from admins and settings to users and certificates, lives in the
panel's database and is managed from the panel.

## Panel files

| Path | What |
| --- | --- |
| `/opt/nx-panel/nx-panel` | the program |
| `/opt/nx-panel/nx-panel.previous` | the program before the last update, kept for a rollback |
| `/opt/nx-panel/config.json` | the database connection, and nothing else |
| `/var/opt/nx-panel/nx.db` | the SQLite database (with `-wal` and `-shm` files beside it while the panel runs) |
| `/var/opt/nx-panel/bin/` | node binaries the panel hands to node installers |
| `/var/opt/nx-panel/sub-themes/` | subscription page themes |
| `/var/opt/nx-panel/presets/` | your own preset catalogue files, added to the built-in presets |
| `/var/opt/nx-panel/backups/` | backup archives and pre-restore snapshots (readable by root only) |
| `/var/opt/nx-panel/rulesets/` | the panel's copies of rule-set files it hands to nodes; safe to clear, the panel downloads them again |
| `/etc/systemd/system/nx-panel.service` | the service |

Copying the database files while the panel runs is not a backup. Use the
panel's own backup ([[use/backup]]), which takes a consistent copy without
stopping anything.

`config.json` looks like this:

```json
{ "db": { "driver": "sqlite", "dsn": "/var/opt/nx-panel/nx.db" } }
```

With PostgreSQL, `driver` is `postgres` and `dsn` is the connection string.
`max_open_conns` sets the size of the connection pool; leave it out unless the
PostgreSQL server is shared with other programs.

### In Docker

Each panel stack keeps what must outlive the container next to its compose file:

| Path | What |
| --- | --- |
| `./data` | the SQLite database (the PostgreSQL stack uses a named volume) |
| `./backups` | backup archives |
| `./bin` | node binaries |
| `./rulesets` | rule-set copies; safe to clear |
| `./sub-themes` | subscription page themes |

## Node files

| Path | What |
| --- | --- |
| `/opt/nx-node/nx-node` | the program |
| `/opt/nx-node/config.json` | the control port's address and the certificate paths, nothing else |
| `/var/opt/nx-node/certs/ssl_cert.pem` | the node's own certificate |
| `/var/opt/nx-node/certs/ssl_key.pem` | its private key |
| `/var/opt/nx-node/certs/panel_ca.pem` | the panel's certificate, the only one the node accepts |
| `/var/opt/nx-node/cache/` | rule sets and other files the panel pushed, which it sends again if they are deleted, and a Tailscale endpoint's login, which is lost if they are |
| `/etc/systemd/system/nx-node.service` | the service |

Everything a node serves is sent by the panel and held in memory. A restarted
node serves nothing until the panel sends its configuration again, which takes
seconds. The certificates are the files on a node worth backing up, and on a node with
a Tailscale endpoint, `cache/tailscale` too.

In Docker, the node keeps `./certs` and `./cache` next to its compose file.

When the panel and a node share a server, `/var/opt/nx-panel` holds both: the
database, `bin`, `backups` and the rest are the panel's, `certs` and `cache` are
the node's. See [[same-server]].

## Ports

| Port | Who | What |
| --- | --- | --- |
| a random high TCP port | panel (script install) | the panel's web interface, API and subscriptions. The installer picks a free one and prints it |
| 2095 TCP | panel (Docker) | the same, pinned in the compose file |
| any port you add | panel | further listeners from **Settings → Addresses** ([[use/ingress]]); in Docker, publish each one in the compose file |
| 62050 TCP | node | the control port. Only the panel can use it; allow it from the panel's address alone |
| the inbounds' ports | node | what your users connect to, chosen in the panel |
| 5432 TCP, local only | PostgreSQL (with `--postgres`) | the database, reached by the panel on `127.0.0.1` |

The panel's port can be changed in the setup wizard and later on the settings
page, or with `nx-panel config set web_listen_port`. Both the panel and the
node listen on IPv6 and IPv4 at once, and fall back to IPv4 on a server with
IPv6 switched off.

## Environment variables

### Panel

| Variable | Effect |
| --- | --- |
| `NX_DB_DRIVER` | `sqlite` or `postgres` |
| `NX_DB_DSN` | the database connection: a file path for SQLite, a connection string for PostgreSQL |
| `NX_DB_MAX_OPEN_CONNS` | the database connection pool size |
| `NX_WEB_LISTEN` | pin the listen address (`IP:PORT`). The panel then ignores the address saved in its settings, and the setup wizard cannot change it. The Docker stacks use this |

These override `config.json`. `nx-panel run -listen IP:PORT` pins the
address the same way as `NX_WEB_LISTEN`.

### Node

| Variable | Effect |
| --- | --- |
| `NX_NODE_LISTEN` | the control port's address, `[::]:62050` by default |
| `NX_NODE_CERT` | the node's certificate file |
| `NX_NODE_KEY` | its private key file |
| `NX_NODE_CLIENT_CA` | the panel's certificate file |
| `NX_STATE_DIR` | the directory for `certs` and `cache`, `/var/opt/nx-panel` by default |

These override the node's `config.json`. The node installer also reads
`NX_INSTALL_TOKEN` in place of `--token`.

## Related

- [[reference/cli]]: the commands of both programs.
- [[install-panel]] and [[add-node]]: what the installers put where.
