---
title: "Command line"
description: "Every nx-panel and nx-node command, and how to get back into a panel you are locked out of."
order: 2
tags: [reference, panel]
---

# Command line

The [[~panel]] and the [[~node]] are each one program with a few commands. Most
days you never type them: the installers and the panel's pages do the work. You
need them to recover a panel you cannot reach, to restore a backup when the
panel will not start, or to script an install.

The panel installer puts `nx-panel` on your PATH, and it finds its own
configuration file, so every command works from any directory. In Docker, put
`docker compose exec panel /app/` in front: `docker compose exec panel
/app/nx-panel config list`.

## nx-panel

| Command | What it does |
| --- | --- |
| `run [-config FILE] [-listen IP:PORT]` | Start the panel. The service does this for you |
| `migrate [-config FILE] [-user U -pass P]` | Create or update the database tables. With `-user` and `-pass` it also creates a main administrator, for an install with no browser; without them the panel opens its setup wizard |
| `config list` | Show the panel-wide settings |
| `config get KEY` | Read one setting |
| `config set KEY VALUE` | Write one setting. `""` clears it. Most take effect when the panel restarts |
| `ingress list` | Show the panel's listeners and routes ([[use/ingress]]) |
| `ingress reset [-listen IP:PORT] [-yes]` | Replace them with one plain listener serving the panel on every host |
| `setup-token [-rotate]` | Print the setup wizard's one-time token, or replace it with a new one |
| `admin list` | List the administrator accounts, marking the panel's owner |
| `admin reset-password [-user U] [-pass P]` | Set an administrator's password |
| `restore FILE [-passphrase P] [-yes]` | Replace the database from a backup archive |
| `hwid` | Print the **Hardware ID (HWID)** the **License** page shows |
| `version` | Print the panel's version |
| `help` | Show the commands |

`-config FILE` points a command at another configuration file. The commands that
open the database accept it after their other arguments, for example
`nx-panel config list -config /path/to/config.json`.

### Settings from the command line

`config` reads and writes the settings that only the main administrator may
change: the panel's address, domain, path and certificate, the subscription
domains and path, backups, trusted proxies and the login allow-list, and a few
more. `config list` shows them all.

A secret, such as the backup passphrase, is shown only as `(set)`. `config set`
refuses a key that is not a panel setting and a value the panel would refuse.
Once **Settings → Addresses** holds more than one address, such as a second
port, `config set` refuses to change the address settings; use `ingress reset`
below.
The backup settings are picked up within the hour without a restart; for the
others, restart the panel (`systemctl restart nx-panel`).

### restore

```bash
systemctl stop nx-panel
nx-panel restore /var/opt/nx-panel/backups/nx-backup-20260914-030000.tar.gz
systemctl start nx-panel
```

It reads the archive first, prints what it holds and any warnings, and asks you
to type `replace-database`. In a script, pass `-yes` instead. An encrypted
archive takes `-passphrase` or asks for it.

As in the panel, this server's own address settings and licence are kept.
`-keep-web-settings=false` and `-keep-license=false` take the archive's instead.
A snapshot of the current database is written before anything changes.

Stop the panel first. On SQLite the swap happens when the panel next starts, so
anything a running panel writes meanwhile is lost; on PostgreSQL the rows are
replaced at once, underneath it.

## Locked out

Every setting that can make the panel unreachable can be changed from the
command line, without the panel running.

### The panel's addresses

If you changed the panel's addresses on **Settings → Addresses**, look at them
and put back one you can reach:

```bash
nx-panel ingress list                        # every listener and route
nx-panel ingress reset                       # one plain listener, the panel on every host
nx-panel ingress reset -listen 0.0.0.0:2095  # the same, on this address
systemctl restart nx-panel
```

`ingress reset` replaces every listener, route and fallback with one listener
on the primary listener's address (or `-listen`), in plain HTTP, and the panel
at the root of every host name. It prints what it will write and asks you to
type `reset`; in a script, pass `-yes`. Certificates, brandings and accounts
are not touched, and the change shows in the page's **History**. Once you are
back in, rebuild the rest on the page.

A change on the page that nobody confirms is put back by itself after two
minutes, so a reset is needed only for one that was confirmed.

### The address settings

While the panel has one address, its settings can be changed one by one:

```bash
nx-panel config list                       # what is set
nx-panel config set web_listen_port 2095   # a port you can reach
nx-panel config set web_listen_ip ""       # listen everywhere again (IPv4 and IPv6)
nx-panel config set web_domain ""          # stop restricting the hostname
nx-panel config set web_basepath ""        # serve at the root again
nx-panel config set sub_domain ""          # stop reserving hosts for subscriptions
systemctl restart nx-panel
```

The last one catches people out when the panel has **no base path**. A domain in
`sub_domain` serves subscriptions and nothing else, so with the panel at the root
those names never show it. If those are the only names you use, the panel is
unreachable everywhere. A base path removes the trap: the panel stays reachable
under it on every name.

In Docker, the port is set in the compose file, not with `config set` or
`-listen`.

### Forgotten password

```bash
nx-panel admin list                        # the accounts, and which one owns the panel
nx-panel admin reset-password              # the owner; the password is typed, not shown
nx-panel admin reset-password -user alice  # any other account
```

Without `-user` it resets the panel's **owner**. The new password is asked for
twice and never shown. `-pass` sets it in one go, but leaves it in your shell
history.

A reset also **turns off two-factor authentication** for that account, so it can
enrol again from the panel, and **ends every session** the account has open. A
running panel may honour a cached session for up to a minute of activity;
restart the panel if that matters.

### Locked out by a ban

Five failed logins from one address ban it, and the ban survives a restart. Two
settings decide who that address is and who is never banned:

```bash
nx-panel config set trusted_proxies "10.0.0.0/8"   # your reverse proxy or CDN, or empty
nx-panel config set login_allowlist "203.0.113.7"  # addresses never banned
```

::: warning Behind a proxy or a CDN
Without `trusted_proxies`, a panel behind a reverse proxy or a CDN sees every
visitor as the proxy's address, so the first ban locks everyone out. Set it to
the proxy's addresses, and keep your own address in `login_allowlist`.
:::

Once you are back in, the main administrator can lift a ban under **Settings →
Security** ([[use/security]]).

## nx-node

A node is installed and configured by the panel, so its commands are few:

| Command | What it does |
| --- | --- |
| `run [-config FILE]` | Start the node. The service does this for you |
| `gencerts [-dir DIR]` | Make the node's own certificate and key, for a manual install |
| `version` | Print the node's version |
| `help` | Show the commands |

The node's installer is a separate script served by your panel; its options are
listed in [[add-node#install-options]].

## Related

- [[files-and-ports]]: where both programs keep their files, and the environment
  variables they read.
- [[troubleshooting]]: problems by symptom.
