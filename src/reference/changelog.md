---
title: "Changelog"
description: "What changed in each release of the panel, the node and the official addons, and what to do when you update."
order: 7
tags: [reference]
---

# Changelog

The panel and the node have their own version numbers. **Update the panel
first, then the nodes** ([[start/update]]). Downloads and full notes are on
the releases pages of [the panel](https://github.com/nx-panel/panel/releases)
and [the node](https://github.com/nx-panel/node/releases).

## Panel

### v0.1.0 — 30 October 2026 {#panel-v0-1-0}

The move to the NX name. **The update button cannot install this release**: it
fails on purpose and changes nothing. Run the new install script once, as
root, on the panel's server; it moves the existing install, keeping admins,
users, nodes, templates and settings, and puts the old install back if a step
fails ([[start/move-to-nx]]).

- **Before you update:** take a backup and keep it, because older backup
  archives cannot be restored into this version. Do not go back to an older
  version over this one. Update the panel first, then the nodes.
- **The move:** the panel lives in `/opt/nx-panel` and `/var/opt/nx-panel` and
  runs as `nx-panel`; environment variables are `NX_*`; everyone is logged out
  once. Nodes and addons show *Needs migration* until you update them from the
  Nodes and Addons pages. Users download their OpenVPN profile or their
  subscription again; tunnels reconnect by themselves; the licence carries over.
- **Addresses:** **Settings → Addresses** replaces the address settings of the
  General page. The panel can listen on several ports, each with its own TLS,
  and choose per host and path what it serves: the panel, subscriptions, the
  API, a static site, a redirect, a fixed answer or another program behind it.
  A change applies at once and is put back unless confirmed within two minutes
  ([[use/ingress]]).
- **A node's own configuration is gone.** A node no longer carries outbounds,
  endpoints or routing of its own; a server that needs something different gets
  a template of its own. The upgrade makes those copies by itself, so each node
  serves what it served before ([[use/templates]]).
- **Limit configs** on a user serves the account only on the inbounds and
  endpoints that match its rules: by protocol, tag, TLS or transport
  ([[use/users]]).
- **Nodes page:** **Test outbounds** measures each outbound the node runs, and
  **Usage graph** opens the node's traffic over time.
- **Interface:** ordered lists are reordered by dragging or from the keyboard,
  hints beside each field's label, a routing rule's inbound picked from the
  template's own inbounds.

### v0.0.6 — 25 October 2026 {#panel-v0-0-6}

**Update the panel before your nodes**: node v0.0.6 refuses a configuration
with a route rule using the `direct` action. This panel works with nodes on
v0.0.3 to v0.0.6.

- **Route rules with the `direct` action are removed.** The action never did
  anything: a rule using it matched, and routing went on to the next rule. The
  panel no longer offers it and removes the stored ones on its first start, so
  routing does not change. To send traffic out directly, use the action
  **route** with the `direct` outbound ([[use/routing]]).
- Built with Go 1.27.3, which fixes a security issue in certificate
  verification; interface libraries updated.

### v0.0.5 — 17 October 2026 {#panel-v0-0-5}

Panel and nodes can be updated in either order; this panel works with nodes on
v0.0.3 and v0.0.4.

- **Resellers limited to chosen templates.** Turn on **Only chosen templates**
  on the admin and pick the **Allowed templates**: its users are put only on
  those templates and reach only their nodes. Removing a template takes the
  users off it as soon as you save, with no node restarts ([[use/resellers]]).
- **OpenVPN and OpenConnect endpoints:** the forms cover routes, DNS servers
  and ping timers pushed to clients, control channel protection (`tls_auth`,
  `tls_crypt`, `tls_crypt_v2`, with a client key per user), a list of servers
  for an OpenVPN client, and a one-time-password secret for OpenConnect
  clients ([[use/endpoints]]).
- **Cloudflare WARP preset** for outbounds: each node registers its own WARP
  device on first start, so nothing is typed and no account is shared between
  nodes ([[use/outbounds]]).
- **Nodes:** warnings no longer list items the panel has since removed;
  installing after a port change moves the node to the new port; the install
  button saves the node first.
- The Docker image runs on Alpine 3.24.

### v0.0.4 — 14 October 2026 {#panel-v0-0-4}

Panel and nodes can be updated in either order. Node v0.0.4 has an important
crash fix, so update your nodes too. A port in a subscription domain setting
(`sub.example.com:2095`) is removed on upgrade; links take the port the panel
listens on.

- **Users and owners:** every admin and operator sees every user; an operator
  owns the users it creates, and the users page opens on **My users only**. A
  main admin can hand users to another operator or reseller, one at a time or
  for a selection ([[use/users]]).
- **Nodes:** a node is marked disconnected only after two missed heartbeats in
  a row; the node install command works with the panel's self-signed
  certificate; a node with no name, a scheme or port in its address, or a port
  outside 1–65535 is refused.
- **Subscriptions:** a Persian subscription page shows dates in the Solar Hijri
  calendar and numbers in Persian digits.
- **Interface:** date fields use your language's calendar; after you change the
  panel's address, port, base path or HTTPS, the restart sends your browser to
  the new address; the help button on each page opens that page in this
  documentation; rule sets get a **From a preset** button.

### v0.0.3 — 9 October 2026 {#panel-v0-0-3}

Update the panel first, then your nodes: nodes on v0.0.3 expect this panel.
This panel still works with older nodes, but live configuration changes and
clean quota cut-offs need nodes on v0.0.3.

- **Changes reach nodes without restarts.** Editing a template, routing, DNS or
  rule sets is applied to a running node; it restarts only when it must
  ([[how/config-sync]]).
- **Rule sets come from the panel.** The panel downloads every list and sends
  it to the nodes, so one unreachable list can no longer stop a node.
- **Warnings instead of failures.** Items a node cannot run are listed on the
  node and the rest keeps working; accounts missing the credential an inbound
  needs are left out of that inbound with a warning.
- **A node you switch off stops serving**, and deleting a node stops it too.
- **Addons on the panel's own server**, without SSH, with an HTTPS certificate
  the panel issues ([[addons/directory]]).
- **Subscriptions** load and connect on current Xray-based apps and sing-box
  apps; options that only matter to client apps are no longer offered on the
  server side; VLESS Encryption on outbounds.
- **Interface:** a getting-started card on the dashboard, addresses blurred
  until you hover them, a notice when a node is behind the newest node release.

### v0.0.2 — 5 October 2026 {#panel-v0-0-2}

- **Services menu:** Telegram and email notices for admins, delivery logs,
  backup destinations (S3-compatible, SFTP, Telegram) and single sign-on
  (Google, Microsoft, GitHub, GitLab, Keycloak, Authentik, Okta, Auth0, any
  OpenID Connect or OAuth 2.0 provider). Webhooks moved under Services.
- **Addons:** browse the [addon directory](https://addons.nx-panel.org),
  install with a claim code or over SSH, suspend, watch health, approve an
  update only when it asks for more.
- **Route test:** ask a node which rule and outbound a connection would take.
- **Users and resellers:** an account an admin switches off stays off; an
  expired reseller can no longer use the panel; new routes to read, patch and
  renew one user; a `public_address` setting for links.
- **Interface:** a menu that can be pinned, a second built-in subscription page
  theme (amber).
- **Security:** the panel can no longer be framed by another site.
- **Removed:** the rule-set download mirror and its setting (nodes get rule
  sets by push, so update nodes to v0.0.2 as well), the old `/module/*` API,
  and the per-addon user and admin tables.

### v0.0.1 — 27 September 2026 {#panel-v0-0-1}

The first stable release. From this release on, the panel updates itself from
its **Update** page ([[use/panel-update]]).

## Node

### v0.1.0 — 30 October 2026 {#node-v0-1-0}

The move to the NX name. **Update the panel to v0.1.0 first**, then update each
node from the Nodes page, where it shows *Needs migration*, or run the install
command shown there on the node ([[start/move-to-nx]]).

- The node lives in `/opt/nx-node` and `/var/opt/nx-node` and runs as `nx-node`
  (`ghcr.io/nx-panel/node` for Docker). The install script moves a node
  installed under the old name, by script or in Docker, keeping its address and
  certificates, and puts the old node back if a step fails.
- Environment variables are `NX_*` (`NX_STATE_DIR`, `NX_NODE_LISTEN`, …).
- The protocols and features are those of v0.0.6.

### v0.0.6 — 25 October 2026 {#node-v0-0-6}

**Update the panel to v0.0.6 first**: this node refuses a whole configuration
with a route rule using the `direct` action, and older panels can still send
one.

- **urltest outbounds work.** The node picks the fastest member and switches
  when one fails; before, an outbound of this type stopped the whole
  configuration from starting.
- **QUIC and UDP sessions stay up on large packets**: Hysteria, Hysteria2 and
  TUIC sessions, and UDP relayed by other protocols, no longer close when a
  packet is too large for the network path.
- Tested with current Xray-based and sing-box apps on every protocol and
  transport.
- Built with Go 1.27.3, which fixes a security issue in certificate
  verification.

### v0.0.5 — 17 October 2026 {#node-v0-0-5}

No panel update is needed. In Docker with a Tailscale endpoint, keep
`/app/cache` on host storage, as the shipped `docker-compose.yml` does.

- **MikroTik (RouterOS) clients connect to the OpenVPN server.**
- **Tailscale endpoints keep their device** across restarts and new
  containers, and a one-off auth key stays logged in after it is spent.
- **Start warnings clear themselves** as soon as the panel adds, fixes or
  removes the item.
- The Docker image runs on Alpine 3.24.

### v0.0.4 — 14 October 2026 {#node-v0-0-4}

No panel update is needed. **Do not skip this one**: a crafted QUIC packet
could crash the whole node when a routing rule sniffs traffic, such as the
torrent-blocking preset.

- More input-validation fixes: a size cap on HTTP transport requests, the gRPC
  frame length check, a Trojan multiplex memory leak, a race in multi-user
  Shadowsocks.
- Changing an outbound updates the detours, selectors, URL tests and DNS
  servers that use it.
- Removed inbounds really stop serving: connected clients are cut off.
- Removing an OpenConnect endpoint while a client is connected no longer
  freezes the node; a refused configuration leaves nothing running.
- UDP fixes for Hysteria, Hysteria 2 and TUIC.

### v0.0.3 — 9 October 2026 {#node-v0-0-3}

- Routing, DNS, logging and rule-set changes apply without dropping
  connections.
- A refused configuration leaves the previous one running; items the node
  cannot run are reported as warnings.
- Adding or removing users on OpenVPN, OpenConnect, SOCKS, HTTP, mixed and
  naive inbounds no longer touches other users' connections.
- A node serves only while its panel is reachable: switched off in the panel,
  it stops; with the panel unreachable for three minutes, it stops until the
  connection returns ([[how/node-lifecycle]]).
- VLESS, VMess and Trojan outbounds can use XHTTP and mKCP; VLESS Encryption on
  outbounds.
- Faster transfers for Shadowsocks, VMess, Trojan and gRPC.

### v0.0.2 — 4 October 2026 {#node-v0-0-2}

Rule sets arrive from the panel by push. Pair it with panel v0.0.2 or later.

### v0.0.1 — 25 September 2026 {#node-v0-0-1}

The first stable release, paired with panel v0.0.1. Nodes are installed and
updated from the panel ([[start/add-node]]).

## Addons and tools

| Release | Date | Notes |
|---|---|---|
| NX Shop v0.1.1 | 30 October 2026 | Install from the panel's **Addons** page or with `ghcr.io/nx-panel/shop:0.1.1` ([[addons/shop]]) |
| NX Shop v0.1.0 | 30 October 2026 | The move to the NX name: update it on its host from the **Addons** page, where it shows *Needs migration* |
| NX Shop v0.0.3 | 24 October 2026 | Package and security updates |
| NX Shop v0.0.2 | 9 October 2026 | |
| NX Shop v0.0.1 | 4 October 2026 | First release |
| Notifier v0.4.1 | 30 October 2026 | `ghcr.io/nx-panel/notif:0.4.1` ([[addons/notifier]]) |
| Notifier v0.4.0 | 30 October 2026 | The move to the NX name: update it on its host from the **Addons** page, where it shows *Needs migration* |
| Notifier v0.3.1 | 24 October 2026 | Package and security updates |
| Notifier v0.3.0 | 9 October 2026 | |
| Notifier v0.2.0 | 4 October 2026 | |
| Notifier v0.1.0 | 4 October 2026 | First release |
| nx-migrate v0.1.0 | 30 October 2026 | The move to the NX name; package and security updates ([[start/migrate]]) |
| nx-migrate v0.0.2 | 9 October 2026 | Windows, Linux and macOS builds |
| nx-migrate v0.0.1 | 23 September 2026 | First release |
