---
title: "The path of a packet"
description: "One user's connection through a node, stage by stage: where it lands, where the user is known, where it is limited and counted, and how it leaves."
order: 2
tags: [node, protocols, routing]
---

# The path of a packet

This page follows one connection through a [[~node]], from the moment it
reaches the node to the moment it leaves for the internet. It is useful when
you need to know where a setting takes effect: which layer reads the
certificate, where a user is recognised, and where limits and counters sit.

Choose a box in the diagram to read what happens at that stage. The sections
below say the same in more detail.

<NxDiagram id="packet-path" />

## Two separate paths

A node carries two kinds of traffic that never mix:

- **The data path**: your users' connections, through the stages on this page.
- **The control path**: the [[~panel]] talking to the node over its own port,
  with mutual TLS. It sends configuration, users and limits, and collects
  counters. Nothing the panel sends passes through a user's connection, and a
  user's connection never reaches the panel.

The two meet in three places only: the table of users each inbound accepts,
the table of per-user limits, and the traffic counters. Everything else the
node holds came from the panel and lives in memory; see
[[how/node-lifecycle]].

## 1. The listener

The connection lands on a port the node opened for an [[~inbound]]. There are
three shapes:

| Shape | What it does |
| --- | --- |
| One inbound, one port | The usual case. The port belongs to that inbound alone. |
| An ingress | One port, usually 443, shared by several inbounds. The ingress reads the name and the application protocol in the TLS handshake and hands the connection, inside the node, to the inbound a rule names. |
| A port set (port hopping) | For Hysteria and Hysteria2. The node listens on every port of the set, up to 512, and answers each client from the port that client sent to. |

An ingress hands the connection over inside the same process; it does not
relay it to another port. That is why the user's real address survives, and
with it every per-user mechanism further down: counters, the address limit and
the speed limit all see the user, not the ingress. Rules are tried in order,
and the first match wins. Details and the two ingress modes are on
[[protocols/ingress]].

Port hopping is done by the node itself, with no firewall rule. A client that
changes ports every few seconds still gets its replies from the port it used,
because the node remembers where each client was last seen.

## 2. TLS, REALITY and the transport

If the inbound uses TLS, the handshake completes here with the certificate the
panel put into the node's configuration. A [[~reality|REALITY]] inbound
completes its own handshake with the keys the panel generated. With an
ingress in terminate mode, the ingress has already done this step and hands
the inbound a plain stream.

Then the transport is unwrapped, if the inbound has one: WebSocket, gRPC,
HTTP, HTTPUpgrade, XHTTP, mKCP or QUIC. What is left is the protocol's own
stream. A VLESS inbound may also carry VLESS Encryption, a layer between TLS
and the protocol; see [[protocols/vless-encryption]].

## 3. The protocol: the user is identified

The protocol (VLESS, VMess, Trojan, Shadowsocks, Hysteria2, TUIC and the
others) reads the credentials in the stream and looks the user up in the set
the panel gave this inbound. From here on the connection carries the user's
name.

- **An unknown credential is refused** here, before anything is routed.
- **Users are matched by their credentials, not by position.** When an account
  is removed or its credential changes, the node stops accepting new streams
  for it at once, including streams inside a connection that already carries
  several (QUIC, multiplexing).
- **The device limit is not checked here.** A node cannot see a device, only
  an address. The device limit acts when the app fetches its
  [[~subscription]]; see [[how/accounting]].

### Endpoints identify the user themselves

WireGuard, OpenVPN and OpenConnect [[~endpoint|endpoints]] skip stages 2 and 3.
They are a way in and a way out at once, and each identifies the user by its
own means: a WireGuard peer by the keys the panel made for that user, OpenVPN
and OpenConnect by the user's login. The traffic then goes straight to
routing.

### Traffic from a tunnel

On an origin node of a [[~tunnel]], the tunnel's half accepts streams from the
relay and hands them straight to routing. That traffic is not counted against
users on the origin and its addresses do not count toward an address limit:
the relay already counted the user, and on the origin the source address is
the relay's, not the user's. See [[how/tunnels]].

## 4. Sniffing

When the routing rules ask for it, the node reads the first bytes of the
connection to learn what it is: the domain name in a TLS or HTTP request, or a
protocol such as BitTorrent. Rules can then match on the real domain even
when the app connected by address, and on protocols the user did not declare.

## 5. Routing

The [[~routing]] of the node's [[~template]] decides where the connection goes.
Rules are tried in order and match on domain, address, [[~rule-set]],
protocol, inbound, user and more. The first rule that matches picks the
[[~outbound]]; when none matches, the **final** outbound takes it.

- **Rule sets come from the panel.** The panel downloads each list, keeps it
  current and pushes it to the node over the control link. The node never
  fetches a list itself, so a list's source being unreachable from a node
  changes nothing.
- **The route is the template's.** A node adds no rules of its own. A server
  that must route differently runs a template of its own, which is also how
  one relay sends only some traffic down a tunnel. See
  [[use/templates#a-template-of-its-own]].
- **Route test** on a node shows which rule an address would match and where it
  would go, without sending anything. See [[use/routing]].

## 6. Limits and counters

Once routing has chosen an outbound, the connection is wrapped twice before
any byte moves:

1. **The user's limits.** The address limit decides whether one more source
   address may connect for this user. An IPv4 address counts on its own, an
   IPv6 address by its /64, and an address keeps counting for ten minutes
   after it was last seen. The speed limit is a budget per direction, applied
   on this node. See [[how/accounting]] for how the address limit is settled
   across the fleet.
2. **The counters.** Bytes are counted per inbound, per outbound and per
   user, and the connection joins the node's list of live connections.

The limits sit closest to the connection, so the speed limit throttles exactly
the bytes the counters report.

## 7. The outbound

The outbound sends the connection on:

| Outbound | Where the connection goes |
| --- | --- |
| Direct | Straight to the destination, from this node's address. |
| A proxy | On through another server you named, such as another provider's proxy. |
| Block | Refused. Every refusal is counted per block outbound and per node. |
| A tunnel | To an origin node, which sends it to the internet. |
| An endpoint | Out through a WireGuard or similar interface. |

Rejections are counted only when they go through an outbound of type block,
which is why ready-made presets such as the torrent block route to a block
outbound. The tally reaches the panel with every heartbeat, and the panel can
raise an alert when its rate gets high; see [[how/monitoring]].

## 8. Back to the user

Replies come back the same way, through the same layers in reverse: the
outbound, the counters, the protocol, the transport and TLS. The same counters
see both directions.

## Where the counters go

The node keeps its counters in memory and the panel collects them:

- **Every 30 seconds** the panel collects each node's counters. The node zeroes
  each counter as it reports it, so every byte is reported once.
- **Every 10 seconds** the panel merges the addresses every node saw and sends
  back the table of who may connect from where.
- **On demand** the panel asks a node for its live connections when you open
  them on a user or a node.

What happens to those numbers next is on [[how/accounting]]. How the
configuration that shaped every stage above reaches the node is on
[[how/config-sync]].
