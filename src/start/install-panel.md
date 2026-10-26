---
title: "Install the panel"
description: "Install the Nexora panel with one command or a Docker stack, and get the one-time setup link."
order: 2
tags: [install, panel]
---

# Install the panel

The [[~panel]] installs with one command that asks nothing. The only choice it
makes for you is the database, because the panel needs a database before it can
store any other setting. Everything else is chosen in the
[[~setup-wizard|setup wizard]] that opens when you first visit the panel.

Pick what to install and copy the command:

<NxCommandBuilder />

## Install with the script

Run it as root. With SQLite, which needs no other service:

```bash
bash <(curl -fsSL https://raw.githubusercontent.com/nexora-vpn/panel/main/install.sh)
```

The installer ends by printing the setup link:

```terminal title="root@server: ~"
$ bash <(curl -fsSL https://raw.githubusercontent.com/nexora-vpn/panel/main/install.sh)
==> installing Nexora Panel (linux-amd64)
==> downloading the panel
==> downloading node binaries
==> migrating the database
database migrated: sqlite
no admin seeded; the panel will open its setup wizard on first start
==> the panel will listen on port 28431
==> Nexora 0.0.3 is installed

  Finish the setup by opening one of these links — whichever address
  reaches this server from where you are:

    http://203.0.113.10:28431/setup?t=9f3c1ad2…    (as the internet sees this host)

  Port 28431 was picked at random and is free on this host — open it in
  the firewall if one is running. The wizard can move it before you finish.

  Service:  systemctl status nexora-panel
  Logs:     journalctl -u nexora-panel -f
```

Open the link and continue with [[setup-wizard]]. The token in it creates the
main administrator, so keep it private. It stops working once setup is done.

### Options

| Option | Effect |
| --- | --- |
| `--postgres` | install and configure PostgreSQL on this server and use it instead of SQLite |
| `--version v1.2.3` | install a specific panel release instead of the newest |
| `--node-version v1.2.3` | stage a specific node release for your node installers instead of the newest |
| `--uninstall` | remove the panel; see [[uninstall]] |

### SQLite or PostgreSQL

SQLite suits most panels: one file, easy to back up and move. Choose PostgreSQL
when you already run one, when the database would sit on network storage, or
when more than about 10,000 users pass traffic at the same time. To switch later,
install fresh with the other database and restore a backup in the setup wizard.

## Install with Docker

Two stacks, one per database:

```bash
git clone https://github.com/nexora-vpn/panel
cd panel/docker/sqlite      # or: cd panel/docker/postgres
docker compose up -d
docker compose logs panel | grep setup
```

For the PostgreSQL stack, copy `.env.example` to `.env` and set a password
before the first start.

The Docker panel listens on port 2095. The port is pinned in the compose file
(`NEXORA_WEB_LISTEN`) together with the published port mapping, so the wizard
cannot move it: change both in the compose file if you want another port. A
further port added on [[use/ingress]] must be published in the compose file
too.

Docker publishes ports on IPv4 only by default. On an IPv6-only host, enable
IPv6 in the Docker daemon (`"ipv6": true` and `"ip6tables": true` in
`/etc/docker/daemon.json`) and publish on both families:

```yaml
    ports:
      - "0.0.0.0:2095:2095"
      - "[::]:2095:2095"
```

To run a node on the same server in Docker, see [[same-server]].

## Requirements

- Linux with systemd: Debian 11+, Ubuntu 20.04+, RHEL 9+ or similar. 64-bit
  x86 and ARM, and 32-bit x86 and ARM, are supported. Without systemd, use
  Docker.
- Root access, and `curl` and `tar` on the server.
- One open TCP port for the panel. More can be added later on
  [[use/ingress]].

## What the installer does

1. Downloads the panel for this server's architecture into `/opt/nexora-panel`.
2. Stages node binaries for amd64 and arm64 in `/var/opt/nexora/bin`. The panel
   hands these to node installers later, so nodes download from your panel.
3. Writes `config.json` with the database connection, and with `--postgres`
   installs and configures PostgreSQL.
4. Creates the database tables.
5. Picks a free high port at random, so a panel nobody has set up yet is not on
   a port scanners look at first.
6. Installs and starts the `nexora-panel` service, and puts `nexora-panel` on
   your PATH for the [[reference/cli|command line]].
7. Prints a setup link for each address it found, led by the address the
   internet sees this server as.

Every path it uses is listed in [[files-and-ports]]. Until setup is finished,
the panel answers only the setup link. Running the
same command again later updates the panel in place; see [[start/update]].

### Lost the link?

Print the token again and build the address around it:

```bash
nexora-panel setup-token
nexora-panel config get web_listen_port
# then open http://203.0.113.10:PORT/setup?t=TOKEN
```

In Docker: `docker compose exec panel /app/nexora-panel setup-token`.

## IPv6

Nothing needs configuring. The panel listens on the IPv6 wildcard, which also
answers IPv4 on a dual-stack server; on a server with IPv6 switched off it falls
back to IPv4 by itself. An IPv6 setup link is printed with brackets, which a
browser needs:

```
http://[2001:db8::10]:28431/setup?t=9f3c1ad2…
```

To bind one address family only, set the listen IP in the wizard.
