---
title: "Panel and node on one server"
description: "Run a node on the panel's own server: when it is a fair trade, why it is not recommended, and how to set it up."
order: 5
tags: [install, node, panel]
---

# Panel and node on one server

A [[~node]] can run on the same server as the [[~panel]]. Nothing in Nexora
forbids it, and the two do not get in each other's way. It is **not
recommended** for a service you sell, and this page says why before it says how.

## When it is acceptable

- A lab or a test install.
- A demo.
- A small service on a single server, where you accept that the panel and the
  traffic share one address and one fate.

For anything you would be upset to lose, give the panel its own server.

## Why it is not recommended

- **It publishes the panel's address.** A node's address goes into every
  subscription link and every client profile you hand out. Every user, and
  anyone who collects those links, learns where your panel is. If that address
  is later blocked, you lose the panel and every subscription address with it,
  not one node.
- **One machine, one fate.** User traffic is bursty and has no ceiling. A busy
  node can starve the panel of CPU, memory or bandwidth, and a panel that is down
  stops serving the subscriptions of every other node's users too.
- **It mixes the disposable with the irreplaceable.** A node is meant to be
  thrown away and installed again. The panel's database is the one thing in the
  whole fleet worth backing up.
- **Uninstalling the node needs care.** Both use `/var/opt/nexora`. Removing
  that whole directory deletes the panel's database; see [[uninstall]].
- **It still counts as a node** against your licence.

## Set it up with the install script

The two install into separate directories and run as separate services:
`/opt/nexora-panel` and `/opt/nexora-node`. Under `/var/opt/nexora`, the
database, `bin/` and `backups/` are the panel's; `certs/` and `cache/` are the
node's.

1. Install the panel and finish the setup wizard as usual.
2. In the panel, add a node with the address `127.0.0.1` and port 62050.
3. Open the node's **Install** drawer and copy the command from the **Manual**
   tab.
4. Run it on the same server with `--listen 127.0.0.1:62050` added at the end,
   so the node's control port is reachable only from this machine:

   ```bash
   curl -fsSL https://PANEL/install-node.sh | bash -s -- \
     --panel PANEL --token TOKEN --listen 127.0.0.1:62050
   ```

With the panel still on its self-signed certificate, the command it shows carries the certificate's key (`--pinnedpubkey` and `--pin`); keep both. Panel v0.0.3 and earlier need `-k` and `--insecure` instead, as [[start/add-node]] explains.

5. Edit the node and add the server's public address under **Link addresses**.
   Links use the node's address when this list is empty, and `127.0.0.1` is of
   no use to your users.

Port 62050 never leaves the server, so it needs no firewall rule. Open only the
ports of the node's inbounds.

## Set it up with Docker

The panel repository has a ready stack, `docker/panel-and-node`: the SQLite panel
with a node beside it. The node needs the panel's certificate before it can
start, and the panel shows that certificate only once a node exists, so the
stack starts in two steps:

```bash
git clone https://github.com/nexora-vpn/panel
cd panel/docker/panel-and-node
docker compose up -d panel
docker compose logs panel | grep setup      # open the link, finish the wizard
```

Then, in the panel, add a node with address `127.0.0.1` and port 62050. Open its
**Install** drawer and save the certificate under **mTLS certificate** as
`./certs/panel_ca.pem` next to the compose file. Add the server's public address
under the node's **Link addresses**, as above. Start the node:

```bash
docker compose up -d node
```

Both containers use host networking. So, unlike the other Docker stacks, this
one does not pin the panel's port: the port you choose in the setup wizard is
used directly, as in a script install. The node's control port stays on the
machine.

## Related

- [[add-node]] for nodes on their own servers.
- [[use/nodes]] for link addresses and the rest of a node's settings.
