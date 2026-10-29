---
title: "Get started"
description: "What you need before you begin, and the order to set up the panel, a node and your first user."
order: 1
tags: [install]
---

# Get started

NX is a [[~panel]] you run on one server and any number of
[[~node|nodes]] that carry your users' traffic. This section takes you from an
empty server to a first customer with a working link.

## What you need

- **A Linux server for the panel**, 64-bit or 32-bit, with systemd (Debian 11+,
  Ubuntu 20.04+, RHEL 9+ or similar), or with Docker.
- **Root access** on it.
- **One open TCP port** for the panel. The installer picks a free high port at
  random and prints it; the Docker stacks use 2095.
- **A server for each node.** It needs TCP port 62050 reachable from the panel,
  and the ports your users will connect to.

The panel and a node can share one server, with trade-offs: see
[[same-server]].

## The order

1. **[[install-panel|Install the panel]].** One command, no questions. It ends
   by printing a one-time setup link.
2. **[[setup-wizard|Finish the setup wizard]].** Create the main administrator
   and choose the panel's address, path and HTTPS.
3. **[[add-node|Add a node]].** Add it in the panel and run the command it shows
   on the node's server, or let the panel install it over SSH.
4. **[[first-user|Create your first user]].** An inbound from a preset, a
   template, the template on the node, a user, and a link in an app.

Each step needs the one before it. The panel's **Getting started** card on the
dashboard follows the same order and ticks off each step as you finish it.

## Other ways in

- **Coming from another panel?** [[migrate]] moves your users, inbounds and
  routing into NX.
- **Moving NX to a new server?** Restore a backup from the setup wizard; see
  [[setup-wizard#restore-a-backup-instead]].
- **Adding a shop or a bot?** [[install-addon]].

## Later

- [[start/update|Updating]] the panel and its nodes.
- [[uninstall|Removing]] NX from a server.
- [[reference/cli|The command line]], [[files-and-ports|files and ports]] and
  [[troubleshooting]] when something does not work.
