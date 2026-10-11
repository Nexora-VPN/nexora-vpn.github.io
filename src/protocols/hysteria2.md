---
title: "Hysteria2 and port hopping"
description: "Serve Hysteria2 over UDP, spread it across a range of ports, and keep per-user speed limits working."
order: 8
tags: [protocols, tls]
---

# Hysteria2 and port hopping

Hysteria2 runs over QUIC, on UDP. It keeps going on lossy and long-distance
links where TCP protocols stall, which makes it a good second inbound beside a
TCP one. With port hopping, a client moves between many ports, so blocking one
port costs the user only that port.

## What it is good for

- **Mobile and lossy networks**, and users far from the node.
- **Networks that block single UDP ports**, with port hopping on. Where UDP
  is blocked as a whole, it cannot help.

What it cannot do: run where UDP does not reach the node, or sit behind a CDN.
A CDN carries TCP, so the panel refuses a [[~front|domain front]] on any QUIC
inbound.

## Create it

1. **Inbounds → From a preset → Hysteria2**, or **Add** and type `hysteria2`.
   See [[use/inbounds]] for the general form.
2. **Port** on the **Basic** tab. This is a UDP port.
3. The **TLS** tab is required and starts on **Node certificate**, so the
   inbound works with nothing more to set. Any certificate from
   [[use/certificates]] will do. With a self-signed one, the panel puts its pin
   into every link and file.
4. **Save**, and add it to a [[~template]].

If the node's host runs a firewall, let in UDP on the port, and on every
port-hopping range below.

## Port hopping

On the **Protocol** tab, **Port hopping ranges** lists extra UDP ports the
inbound also answers on, one range per line in `start:end` form, for example
`20000:20999`. Up to 512 ports in all.

- The node listens on every one of them itself. You add no firewall redirect
  rule.
- Each user's link and file carries the set, so their app knows which ports
  it may move between.
- A range that overlaps the ports of another inbound on the same template,
  or of a tunnel, is refused when you save.

How often the client moves is the client's choice, so it is set on the same
tab as a client setting:

| Field | |
| --- | --- |
| **Hop interval** | seconds between moves. Empty leaves the app's own default (30 seconds in most apps). At least 5 |
| **Hop interval, maximum** | Hysteria2 only. With both set, the app picks each move at random between the two, so the moves stop being regular |

Sing-box apps read both fields. Clash apps read the interval, and the range
too on mihomo 1.19.24 or later. A share link has no place for either, so an
app that imported a link keeps its own default. The panel refuses a maximum
without an interval, a maximum below the interval, and anything under five
seconds, the same values a client would refuse on the user's device.

## Speed and per-user limits

The node always runs Hysteria2 with BBR congestion control and ignores the
bandwidth an app announces. That is what lets a user's **Speed limit** hold on
Hysteria2 as it does everywhere else, which is why the inbound has no
bandwidth fields. Bandwidth settings in a user's app do not raise their speed.

**BBR profile** (advanced) sets how assertive the node's congestion control
is: empty or `standard`, `conservative`, or `aggressive`.

## Other fields

| Field (advanced) | |
| --- | --- |
| **Obfs password** | scrambles every packet with a password both ends share, so to a network that inspects traffic the connection no longer looks like Hysteria2. Every link carries it; changing it means every user has to refresh |
| **Masquerade URL** | a site the node shows to anyone who connects without a valid password, a browser for example |
| **Idle timeout**, **Keep-alive period**, the receive windows, **Max concurrent streams** | QUIC tuning; leave empty unless you have measured a reason |

## Hysteria (version 1)

The form also offers `hysteria`, the first version. It shares port hopping
(without the maximum) and **Obfs password**, but it always uses fixed rates:
**Up (Mbps)** and **Down (Mbps)** cannot be empty, and the panel fills in
deliberately high values when you leave them so, which leaves each user's
**Speed limit** as the real cap. Offer it only for apps that lack Hysteria2.

## Client apps

| Format | Hysteria2 | Hysteria |
| --- | --- | --- |
| Share link | yes (`hysteria2://`) | yes (`hysteria://`) |
| Clash apps | yes | yes |
| sing-box apps | yes | yes |
| Xray-based apps | yes | no |

## Related

- [[protocols/tuic]] — the other QUIC protocol
- [[protocols/index]] — every protocol compared
- [[use/users]] — speed limits on an account
