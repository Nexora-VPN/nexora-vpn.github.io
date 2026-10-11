---
title: "One port for many inbounds"
description: "Put several inbounds behind one port with an ingress that routes by server name, ALPN or path, and choose which end does TLS."
order: 14
tags: [protocols, tls]
---

# One port for many inbounds

An ingress is an inbound that owns one port, usually 443, and hands each
connection to another inbound according to the name the client asked for, its
ALPN, or its path. It lets VLESS with [[~reality|REALITY]], Trojan over
WebSocket and others share port 443 on one node, each keeping its own users,
statistics and limits.

## What it is good for

- **Only one open port**, typically 443, and several inbounds to offer on it.
- **Different names on one address**: `a.example.com` to one inbound,
  `b.example.com` to another.
- **Answering like an ordinary web server** to anything that is not one of
  your users.

An ingress has no users of its own and never appears in a subscription. Its
children do, with the ingress's port.

## Create it

1. Create the inbounds that will sit behind it first (the **children**). See
   [[use/inbounds]].
2. **Inbounds → Add**, type `ingress`. The **Port** starts at 443.
3. Decide the mode on the **TLS** tab (below).
4. On the **Protocol** tab, add a rule per child with **Add rule**, then a
   **Fallback**.
5. **Save**, and put the ingress **and its children** on the same
   [[~template]].

## Rules

Rules are checked top to bottom and the first match wins, so put the most
specific first (**Move up**, **Move down**).

| Field | Matches |
| --- | --- |
| **Server name (SNI)** | the name the client asked for. Exact, or a suffix when it starts with a dot (`.example.com`). Empty matches any name |
| **ALPN** | the application protocol negotiated, such as `h2` or `http/1.1` |
| **Path** | the path a WebSocket or HTTPUpgrade child asks for, so several can share one name. A trailing `/` matches a prefix. Terminate mode only |
| **Send to** | a child inbound, or **External address…** with an **Address** and **Port** |

Conditions in one rule must all match; several values in one condition are
alternatives. For an external address, **PROXY protocol** passes the client's
real address to a server that reads it, such as nginx. A child inbound needs
no such thing: it always sees the real client address.

The **Fallback** takes every connection no rule matched. Always set one; the
choices depend on the mode.

## Two modes: which end does TLS

Exactly one end may do TLS: the ingress or its children.

### Peek mode: TLS off on the ingress

The ingress only reads the first message of the TLS handshake, which carries
the server name and the ALPN, and passes the whole connection on. **Each child
does its own TLS**: its own certificate, or REALITY.

- Every child must have TLS or REALITY, or there is nothing to route on.
- **Path** rules are not available: everything after the handshake is
  encrypted.
- The fallback can be an **External address…** running a real web server,
  which then answers with its own certificate.

This is the mode for putting REALITY inbounds behind an ingress.

### Terminate mode: TLS on the ingress

The ingress completes the TLS handshake itself, with the certificate on its
**TLS** tab, and hands each child a plain stream. **Children carry no TLS.**

- **Path** rules become available, for children that speak HTTP/1.1
  (WebSocket, HTTPUpgrade). gRPC and anything on HTTP/2 carry their path in a
  compressed form; separate those by **ALPN** instead.
- An **ALPN** rule matches only a protocol the ingress offers. Add it to the
  ingress's ALPN list on its **TLS** tab, or the panel refuses the save.
- The fallback, or any rule, can be a **Simulated web response…**, which
  answers like an ordinary web server: **A fixed page**, **A real site
  (proxied)** or **A directory of files** (an absolute path on the node). A
  real site is the most convincing of the three.
- Users' links take their TLS settings from the ingress, since the child's
  own never reaches the client.

A simulated response that cannot be set up (a missing directory, a bad
address) disables only its own rule; the other children keep working.

## Children

These inbound types can sit behind an ingress: VLESS, VMess, Trojan, AnyTLS,
Snell, Shadowsocks, ShadowTLS, Sudoku, SSH, SOCKS, HTTP, mixed and direct.
UDP protocols (Hysteria2, TUIC and the rest), NaiveProxy, Mieru, MTProxy,
TrustTunnel and another ingress cannot, and the panel refuses a rule that
names one.

A child can live two ways:

| Child | Reached | In subscriptions |
| --- | --- | --- |
| **With a port of its own** | directly, and through the ingress | two entries: its own, and one named `<child>-<ingress>` |
| **With no port** | only through the ingress | one entry, through the ingress |

An entry through the ingress carries the ingress's port and the rule's server
name. An inbound with no port and no ingress routing to it is marked
**Unreachable** on the inbounds list and is left out of subscriptions until
you give it a port or a rule.

The panel shows a warning, and still saves, when the TLS of a pair does
not fit the mode (both ends with TLS, or neither) or a rule names an inbound
that does not exist. An ingress is often written before its children, so fix
those as you go.

## Templates and nodes

A template may carry only some of an ingress's children: one template can
offer VLESS and Trojan on 443, another only VLESS. On each node, a rule whose
child is not there is dropped, and an ingress left with no rules is left out.

## Behind a CDN

An ingress cannot be fronted itself, but a CDN-friendly child can. A CDN opens
its own connection to your node carrying the **front's** hostname, not the
child's, so the rule must list the front's hostname (or a suffix such as
`.cdn.example.com`). Otherwise the connection goes to the fallback and the
user never arrives. The panel warns about this on the front. See
[[use/fronting]].

## Advanced

**ClientHello timeout** (advanced, on the **Protocol** tab) is how long the
ingress waits for a client's first handshake message before giving up.

## Related

- [[protocols/vless-reality]] — the most common child in peek mode
- [[use/inbounds]] — the inbounds page
- [[use/certificates]] — the certificate an ingress terminates with
