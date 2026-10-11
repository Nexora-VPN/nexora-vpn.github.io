---
title: "From a template to a link"
description: "How the panel builds a user's subscription: which inbounds they reach, how addresses and fronts become entries, how client TLS settings and pins are merged, and what each app is sent."
order: 6
tags: [subscriptions, protocols]
---

# From a template to a link

A user's [[~subscription]] is built when their app asks for it, from what the
panel knows at that moment. Nothing is cached and nothing is sent to a node,
so an edit to an address, a front or a name template is live on the next
fetch. This page follows the build from the user's [[~template|templates]] to
the bytes their app receives. The settings themselves are on
[[use/subscriptions]].

## 1. Which inbounds a user reaches

The panel starts from the account:

1. **Templates.** A user belongs to one template, several, or all of them.
2. **Nodes.** Every enabled [[~node]] on those templates serves the user.
3. **Inbounds.** Every [[~inbound]] of the node's template is a way in, and each
   becomes entries in the file.

Some inbounds are left out or changed on the way:

- **An inbound behind an ingress** is reached through the ingress's port and
  under the name its route matches, since the user's app talks to the ingress
  first. An inbound that keeps its own port as well gets two entries: one
  direct and one through the ingress. An inbound reachable neither way is left
  out.
- **Only through a front**, switched on for an inbound, drops its direct
  entries for every user who has a front that rendered.
- **An entry the app could not use** is dropped rather than written broken,
  because one bad entry makes some apps reject the whole file.

[[~endpoint|Endpoints]] (WireGuard, OpenVPN, OpenConnect) appear as the tunnel
the app dials. WireGuard keys and the user's address inside the tunnel are
made by the panel from the user's id, so the file and the node always agree.

## 2. Addresses and fronts: add, never multiply

Each inbound on each node becomes one entry per [[~link-address|link address]]
of that node. Then each [[~front|domain front]] on the inbound adds one more
entry, once, whatever the number of nodes.

```
3 nodes × 2 link addresses = 6 direct entries
          2 fronts on the inbound = 2 front entries
                                    8 entries
```

The reason is who each one belongs to. A link address is another way to reach
one machine, so it repeats per node. A front is the CDN's name for the
inbound, and the CDN chooses which origin server to forward to, so one front
covers every node that serves the inbound.

- **The first link address is the primary.** WireGuard, OpenVPN and
  OpenConnect entries, and downloadable `.conf` and `.ovpn` files, use it
  alone, since a saved file cannot carry alternatives.
- **The address the panel dials a node at is separate** from its link
  addresses. The panel can reach a node on a private address while users reach
  it on a public one.
- **A front replaces** the address, port, server name, Host header, ALPN and
  fingerprint of the entry, and **drops** the certificate pin and any port
  hopping range: a CDN presents its own certificate and listens on one port.

## 3. Client options per inbound

An inbound has settings for the node and settings for the app. The second
kind, under **Client settings (links & subscriptions)**, is used only when
links are built and never sent to a node. It can, among others:

- advertise a different address or port than the node's, for an inbound
  reached through something in front of it;
- set the server name, ALPN, fingerprint or other client TLS options;
- set options only the client reads, such as the port hopping interval.

An entry whose address the inbound's client settings name is not copied
across the node's other link addresses: you named that address on purpose.

## 4. Client TLS: three layers, merged field by field

What the app is told about TLS comes from three places. Each field is taken
from the most specific one that sets it:

| Priority | Where it is set | Typical use |
| --- | --- | --- |
| 1 (wins) | the inbound's **Client settings** | one inbound's server name or ALPN |
| 2 | the client settings of the node's certificate | the same for every inbound that uses that node's certificate |
| 3 | the client settings of a panel certificate | shared defaults for a certificate several nodes use |

Below all three are values derived from the certificate itself: the server
name is the first DNS name on it (never a wildcard), and a self-signed
certificate is marked as one to pin. [[~reality|REALITY]] inbounds skip the
certificate layers entirely: they carry their public key and short id
instead.

## 5. Certificate pins

A pin is the fingerprint of the certificate a client should accept. The
panel computes it when the certificate is issued or renewed; you never type
one.

- **Self-signed certificates are always pinned**, so an app verifies the exact
  certificate instead of accepting any.
- **An uploaded certificate is pinned** only when its client settings turn
  verification off.
- **An ACME certificate is never pinned**: a public authority vouches for it,
  and it changes at every renewal.

Each format carries the pin in the form its apps read, and an app that
supports a pin is given it in preference to switching verification off. When
a self-signed certificate is renewed, its pin changes, and apps pick up the new
one on their next refresh. See [[how/certificates]].

## 6. Names

Each entry needs a name the app shows. With the **Name template** under
**Link names** empty, entries keep the panel's fixed names. A template such as
`{USER} · {ROUTE} · {REMAINING}` is filled per entry with the account, the
inbound, the node, the route (the link address's or front's label), the
address dialled, usage and expiry. A variable that is empty takes its
separator with it, an unknown one is left as written, and a name that resolves
to nothing falls back to the fixed name. Apps remember a user's chosen entry by
its name, so a template is something to choose once, not to change often.

## 7. The format each app reads

One subscription address answers in several formats:

| Format | Read by |
| --- | --- |
| Share links, base64 (the default) | most apps: v2rayNG, v2rayN, Streisand, Happ, Shadowrocket |
| Plain share links | anything that reads one link per line |
| Clash | Clash Meta and Stash apps |
| sing-box profile | sing-box apps: SFA, SFI, Hiddify, Karing |
| Xray JSON profile | Xray-based apps that import a full profile |
| The subscription page | a browser |

The format is chosen in this order: one named in the address (a format path
or `?format=`) always wins. Otherwise a browser gets the
[[~subscription-page|subscription page]], and an app is recognised by its name
and given its format. The structured formats start from a base document you
can replace under **Subscription defaults**; the generated entries are merged
into it, with a default group that tests every entry.

## 8. What travels with the file

A subscription response also carries headers that apps show without the user
opening anything: a profile title, the quota and expiry bar, the refresh
interval, an announcement, a support link and a link back to the page. Text in
other alphabets is encoded the way these apps expect. Details are on
[[use/subscriptions]].

## 9. Before the file is handed over

- **The device limit.** An app that identifies its device is counted against
  the user's **Device limit** before anything is sent. A device past the limit
  gets a refusal, while devices already counted keep fetching. Apps that send
  no device id are served unless the strict setting is on. This is the only
  place the device limit acts; nodes never see devices. See
  [[how/accounting]].
- **The fetch is recorded.** The time, the app and the address are written
  when the body is handed over. The first fetch of an account raises an event.
  Opening the page in a browser is recorded separately, so it never overwrites
  the name of the app the user connects with.

## Where the address comes from

The subscription address itself is built on the first of your subscription
domains, or a hostname per subscriber under a wildcard domain, or the panel's
public address. Every domain in the list keeps serving the links it issued, so
a blocked domain is replaced by adding a new one first. On those names the
panel answers only at its base path, so the address your customers hold says
nothing about where the panel is administered. See
[[use/subscriptions]] and [[use/fronting]].
