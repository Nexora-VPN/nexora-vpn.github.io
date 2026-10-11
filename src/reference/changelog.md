---
title: "Changelog"
description: "What changed in each release of the panel, the node and the official addons, and what to do when you update."
order: 7
tags: [reference]
---

# Changelog

The panel and the node have their own version numbers. **Update the panel
first, then the nodes** ([[start/update]]). Downloads and full notes are on
the releases pages of [the panel](https://github.com/nexora-vpn/panel/releases)
and [the node](https://github.com/nexora-vpn/node/releases).

## Panel

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
- **Addons:** browse the [addon directory](https://addons.nexora-panel.org),
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
| Nexora Shop v0.0.2 | 9 October 2026 | Install from the panel's **Addons** page or with `ghcr.io/nexora-vpn/shop:0.0.2` ([[addons/shop]]) |
| Nexora Shop v0.0.1 | 4 October 2026 | First release |
| Notifier v0.3.0 | 9 October 2026 | `ghcr.io/nexora-vpn/notif:0.3.0` ([[addons/notifier]]) |
| Notifier v0.2.0 | 4 October 2026 | |
| Notifier v0.1.0 | 4 October 2026 | First release |
| nexora-migrate v0.0.2 | 9 October 2026 | Windows, Linux and macOS builds ([[start/migrate]]) |
| nexora-migrate v0.0.1 | 23 September 2026 | First release |
