---
title: "More protocols"
description: "The rest of what the panel serves, from AnyTLS and Mieru to SOCKS and SSH: what each is for, which apps read it, and its limits."
order: 13
tags: [protocols]
---

# More protocols

Beyond the protocols with pages of their own, the inbound form offers a number
of others. Most fill a niche: one app family, one kind of network, or your own
tooling. This page gives each a short entry. All of them are created the same
way, on **Inbounds → Add** ([[use/inbounds]]), and all of them carry the
per-user accounting and limits unless the entry says otherwise.

::: tip Check the apps before you sell it
Several of these reach only one app family, and four reach none through the
subscription. The table on [[protocols/index]] shows which format carries
what.
:::

## AnyTLS {#anytls}

A TLS proxy protocol with adjustable padding, made to keep the sizes of its
traffic from following a fixed pattern.

- **TLS**: required, a certificate (the node's by default) or
  [[~reality|REALITY]].
- **Users** sign in with their **Password**.
- **Padding scheme** (advanced) shapes the padding; leave it empty for the
  default.
- **Apps**: share links (`anytls://`), Clash apps and sing-box apps.
  Xray-based apps do not read it.
- Can sit behind an [[protocols/ingress|ingress]]. Cannot be fronted.

## ShadowTLS {#shadowtls}

Borrows the TLS handshake of a real website, the way REALITY does, and is
usually paired with Shadowsocks.

- **Version** 3 (the default) signs users in with their account name and
  **Password**; versions 1 and 2 use one shared **Password (v1/v2)**.
- **Handshake server** and **Handshake port** name the real site. The same
  advice applies as for [[protocols/vless-reality|REALITY's target]]:
  reachable from the node and not blocked for your users.
- **Strict mode** and **Wildcard SNI** (advanced) tighten or relax which
  handshakes are accepted.
- **Apps**: no subscription format carries it. A client has to be set up by
  hand, which makes it a poor fit for selling.
- A version 3 inbound with no users is not served.

## Mieru {#mieru}

A protocol of its own, over TCP or UDP, with a range of ports.

- **Transport**: `TCP` or `UDP`.
- **Listen port ranges** (advanced): extra ports, in `2012-2022` form, that
  clients spread their connections over.
- **Users** sign in with their account name and **Password**.
- **Apps**: Clash apps only (mihomo). No share link, no sing-box or Xray
  entry.
- An inbound with no users is not served.

## Snell {#snell}

A lightweight encrypted protocol with a pre-shared key.

- **Version (5 or 6)**: each version has its own options, **Obfs mode** for 5
  and **Mode** for 6, and the form shows only the right one.
- **PSK**: the server key, generated for you. Each user's own key is their
  **Password**.
- **Apps**: sing-box apps only. Clash's Snell has no per-user key, so it is
  left out there, and there is no share link.
- An inbound with no users is not served: it would be a single-key server on
  the key every link carries.

## MTProxy {#mtproxy}

Telegram's own proxy protocol, for Telegram apps. It
carries Telegram traffic only.

- Each account gets its own secret, so users are counted and limited
  separately.
- The advanced fields tune connection handling and the site the proxy
  presents to anyone who is not a Telegram client.
- **Apps**: Telegram. No subscription format carries an MTProxy entry, so
  users do not receive it with their other configurations.
- An inbound with no users is not served.

## SSH {#ssh}

An SSH server used as a proxy: apps open an SSH session to the node and
tunnel through it. It needs no certificate and runs on any TCP port.

- **Users** sign in with their account name and **Password**. This is a
  separate service from the host's own SSH; it never gives a shell.
- **Host key** (advanced): generated when you leave it empty.
- **Max auth tries** (advanced): failed sign-ins allowed per connection.
- **Apps**: Clash apps and sing-box apps.
- An inbound with no users is not served.

## TrustTunnel {#trusttunnel}

A TLS-based VPN protocol, over TCP or, with **Network** set to `udp`, over
UDP.

- **TLS**: required, the node's certificate by default.
- **Users** sign in with their account name and **Password**.
- **Apps**: no subscription format carries it; its clients are set up by
  hand.

## Sudoku {#sudoku}

A protocol with **one shared key** for everyone who connects, and no
per-user accounts.

- **Key**: generated for you.
- The advanced fields shape the encoding and the padding, and set a
  **Fallback (host:port)**.
- Because everyone shares the key, the panel cannot count, limit or switch off
  one user on it. Keep it for your own needs.
- **Apps**: no subscription format carries it.

## SOCKS, HTTP and mixed {#socks-http-and-mixed}

Plain proxies: `socks`, `http`, and `mixed` (SOCKS and HTTP on one port).

- **Users** sign in with their account name and **Password**.
- SOCKS and plain HTTP do not encrypt. An `http` inbound can take TLS (an
  HTTPS proxy) or REALITY; `socks` and `mixed` cannot. Use them on networks
  you trust, for tools that only speak a plain proxy, or to chain servers.
- **Apps**: `socks` and `mixed` reach every format (share links, Clash apps,
  sing-box apps, Xray-based apps); `http` reaches Clash apps, sing-box apps
  and Xray-based apps.

::: warning Never served without users
A SOCKS, HTTP or mixed inbound with no users would be an open proxy for anyone
who finds the port. The panel leaves it out of what a node is sent until at
least one user is on it, and the node refuses it too.
:::

## Tailscale {#tailscale}

Tailscale is an [[~endpoint]] on the **Endpoints** page ([[use/endpoints]])
that joins the node to your Tailscale network with an **Auth key**. Use it to
reach your nodes privately, to route traffic out through another machine on
your tailnet, or to make the node an exit node (**Advertise as exit node**).
It is for your own use and appears in no subscription.

## Local types: tun, redirect, tproxy, direct {#local-types}

The form also lists four types that take traffic arriving on the node's own
host itself. They appear in no subscription.

- **direct** forwards whatever reaches its port to a fixed **Override
  address** and **Override port**.
- **tun**, **redirect** and **tproxy** capture traffic on the host itself.
  Most operators never need them.

## Related

- [[protocols/index]] — the full comparison
- [[use/inbounds]] — creating any inbound
