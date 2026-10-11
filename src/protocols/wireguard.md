---
title: "WireGuard"
description: "Serve WireGuard to your users: a peer and an address per account, a ready .conf file, and how big the address range must be."
order: 11
tags: [protocols]
---

# WireGuard

WireGuard is a standard VPN, read by the official WireGuard apps, routers and
most proxy apps. In Nexora it is an [[~endpoint]], made on the **Endpoints**
page, and every user becomes a peer with their own keys and address. Users get
a ready `.conf` file; you never edit peers by hand.

## What it is good for

- **The official WireGuard apps**, routers and devices that run nothing else.
- **A fast UDP VPN** with the whole device's traffic in it.

It runs over UDP, has no TLS and no transport, and cannot be put behind a CDN.

## Create it

1. **Endpoints → Add**, type `wireguard`. The general form is on
   [[use/endpoints]].
2. The form starts as a server: a **Listen port**, an address range and a
   generated **Private key**. Check the address range (below) before saving.
3. **Save**, and add the endpoint to a [[~template]]. Every user of that
   template becomes a peer on each node that serves it.
4. If the node's host runs a firewall, let in UDP on the listen port.

| Field | |
| --- | --- |
| **Address (CIDR list)** | the server's own address and the range users' addresses come from, for example `10.7.0.1/16`. Add an IPv6 prefix as a second line to give every user an IPv6 address too |
| **Private key** | the server's key, generated for you |
| **Listen port (set to serve panel users)** | with a port, the endpoint serves your users. Without one, it is a client endpoint that sends traffic out through someone else's WireGuard server, and the panel adds no peers |
| **MTU**, **Workers** (advanced) | leave empty unless you have a reason |

## Make the address range big enough

Each user's address is worked out from their account number inside the range,
counted up from the server's own address. It is not a free-list: the range has
to reach your **highest** account number, not just your number of users.

The form starts with a `/24`, which runs out after about 250 accounts have
ever been created on the panel. A user past the end of the range gets a
`.conf` that says so instead of a working one. Widen the range to a `/16`
before you go live, and it covers tens of thousands.

## What each user gets

Every user on the template gets a peer with keys the panel generated for
them, and three ways to connect:

- **A `.conf` file**: on the user's **QR / Links** dialog, under **Client
  apps**, with a QR code and **Save file**. The same file is on their
  [[~subscription-page|subscription page]]. It imports straight into the
  official WireGuard apps.
- **An entry in their subscription** for Clash apps, sing-box apps and
  Xray-based apps.
- The node's [[~link-address|link address]] as the server. A `.conf` is saved
  once and cannot list alternatives, so it always uses the node's first
  address.

Accounting, quotas, speed and address limits apply per user, exactly as on any
inbound.

## Adding and removing users

Adding or removing a user on a WireGuard endpoint briefly restarts the
endpoint on each node. Connected WireGuard users reconnect by themselves, in
about 20 seconds. Disabling an account removes its peer the same way.

::: tip Peers of your own
Peers you add by hand in the **Advanced (JSON)** view survive the panel's
rebuilds only if they carry no `user` field. Peers with one belong to the
panel and are rewritten from the user list.
:::

## Related

- [[use/endpoints]] — the endpoints page
- [[protocols/openvpn]] — OpenVPN and OpenConnect
- [[protocols/index]] — every protocol compared
