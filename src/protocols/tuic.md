---
title: "TUIC"
description: "Serve TUIC, a QUIC protocol over UDP with a choice of congestion control, for sing-box and Clash apps."
order: 9
tags: [protocols, tls]
---

# TUIC

TUIC is a proxy protocol over QUIC, on UDP. Like
[[protocols/hysteria2|Hysteria2]] it holds up on lossy links where TCP
protocols stall; unlike Hysteria2 it lets you choose the congestion control
and has no port hopping. Offer it beside a TCP inbound for users whose apps
read it.

## What it is good for

- **Lossy or high-latency networks**, with a UDP protocol.
- **A second QUIC option** for networks that treat Hysteria2 differently.

It needs UDP to reach the node, and a CDN cannot carry it, so the panel
refuses a [[~front|domain front]] on it.

## Create it

**Inbounds → Add**, type `tuic`. The general form is on [[use/inbounds]].

- **Port** on the **Basic** tab, a UDP port. Let it in on the node's firewall
  if there is one.
- The **TLS** tab is required and starts on **Node certificate**. Any
  [[~certificate]] from [[use/certificates]] will do.
- Each user signs in with their **UUID** and **Password**, both generated for
  every account.

| Field (**Protocol** tab) | |
| --- | --- |
| **Congestion control** | `cubic`, `bbr` or `new_reno`. `bbr` suits long and lossy paths; `cubic` is the conservative choice |
| **Zero-RTT handshake** (advanced) | lets a returning client send data before the handshake completes. Leave it off unless you need the saved round trip |
| **Auth timeout**, **Heartbeat** (advanced) | how long a client has to sign in, and how often the connection is kept alive |
| QUIC tuning (advanced) | receive windows, idle timeout, keep-alive; leave empty unless you have measured a reason |

## Client apps

| Format | |
| --- | --- |
| Share link (`tuic://`) | yes |
| Clash apps | yes |
| sing-box apps | yes |
| Xray-based apps | no; their subscriptions leave it out |

## Related

- [[protocols/hysteria2]] — the other QUIC protocol, with port hopping
- [[protocols/index]] — every protocol compared
