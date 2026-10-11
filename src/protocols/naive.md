---
title: "NaiveProxy"
description: "Serve NaiveProxy over HTTP/2 and TLS, and pick a certificate its clients accept."
order: 10
tags: [protocols, tls]
---

# NaiveProxy

NaiveProxy carries traffic as HTTPS requests over HTTP/2, the way a browser
talks to a web server. It needs TLS and a certificate, signs users in with a
username and password, and is read by share links and sing-box apps.

## What it is good for

- **Traffic shaped like a browser's.** Its clients are built from a browser's
  own network code.
- **A TCP option with nothing else to tune**: a port, a certificate, and the
  users.

It has no transport, so a CDN cannot carry it and an
[[protocols/ingress|ingress]] cannot route to it. Give it its own port.

## Create it

**Inbounds → Add**, type `naive`. The general form is on [[use/inbounds]].

- **Port** on the **Basic** tab.
- The **TLS** tab is required and starts on **Node certificate**. Read the
  certificate note below before you keep it.
- Each user signs in with their account name and **Password**.

| Field (**Protocol** tab) | |
| --- | --- |
| **Network** | `tcp` (default): HTTP/2 over TCP, which is what the share link describes. `udp` serves HTTP/3 over QUIC instead, and empty serves both. Keep `tcp` unless you know your users' apps handle HTTP/3 |
| **QUIC congestion control** (advanced) | `bbr`, `cubic` or `reno`, for HTTP/3. It travels in the link |

## Choose the certificate with care

::: warning A long-lived self-signed certificate is refused
The naive client in sing-box apps follows a browser's rule on certificate
lifetime, even for a certificate it was told to trust. A self-signed
certificate valid for longer than about 200 days fails with "cert validity too
long", and that limit drops to 100 days in March 2027. The panel's own
self-signed certificates, including the node certificate when it is
self-signed, last a year.
:::

Serve a naive inbound one of these instead:

- **An ACME certificate** for a domain pointing at the node, issued on
  [[use/certificates]]. It is trusted publicly, lasts 90 days with Let's
  Encrypt, and renews itself.
- **A certificate of your own** with a validity under 100 days, pasted as a
  PEM pair.

## Never served without users

A naive inbound with no users refuses to start, so the panel leaves it out of
what a node is sent until at least one user is on it.

## Client apps

| Format | |
| --- | --- |
| Share link (`naive+https://`) | yes |
| sing-box apps | yes |
| Clash apps | no; their subscriptions leave it out |
| Xray-based apps | no; their subscriptions leave it out |

## Related

- [[use/certificates]] — issuing an ACME certificate
- [[protocols/index]] — every protocol compared
