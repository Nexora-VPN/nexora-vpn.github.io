---
title: "Trojan"
description: "Serve Trojan over TLS: a password per user, any transport, and a CDN front when the transport is HTTP-shaped."
order: 6
tags: [protocols, tls]
---

# Trojan

Trojan authenticates each user by password and relies on TLS for everything
else. It is widely supported, simple to set up, and a good second protocol
beside [[protocols/vless-reality|VLESS]], especially over WebSocket behind a
CDN.

## What it is good for

- **Apps that default to it.** Many apps offer Trojan first, and almost all
  of them read it.
- **A CDN-fronted inbound.** **Inbounds → From a preset → Trojan +
  WebSocket + TLS** gives you one ready for a [[~front|domain front]].

## Create it

Start from the preset above, or **Inbounds → Add** and type `trojan`. See
[[use/inbounds]] for the general form.

| Tab | What to set |
| --- | --- |
| **Basic** | **Port** |
| **Transport** | `tcp (none)`, or `ws`, `grpc`, `httpupgrade`, `xhttp`… |
| **TLS** | **TLS** with a [[~certificate]] (usually **Node certificate**), or **REALITY** |
| **Multiplex** | optional, for sing-box and Clash apps that multiplex |

Each user signs in with the **Password** on their **Credentials** tab, which
the panel generates for every account.

## TLS is the protection

Trojan's own security is TLS. The form lets you pick **None**, and that is
right in exactly two places:

- **Behind an [[protocols/ingress|ingress]] that terminates TLS** for it.
- **Behind a CDN** that terminates TLS and talks plain HTTP to your node.

Anywhere else, an inbound with no TLS sends your users' passwords and traffic
in the clear.

With a self-signed certificate (the node's own, for example), the panel puts
the certificate's pin into every link and subscription file, so apps trust it
without a public authority. See [[use/certificates]].

## Behind a CDN

With a `ws`, `grpc`, `httpupgrade`, `xhttp` or `http` transport and TLS or no
TLS (never REALITY), a front can carry it. See [[use/fronting]].

## Client apps

| Format | |
| --- | --- |
| Share link (`trojan://`) | yes |
| Clash apps | yes, except the `quic`, `xhttp` and `mkcp` transports |
| sing-box apps | yes, except `xhttp` and `mkcp` |
| Xray-based apps | yes, except `http` (HTTP/2) and `quic` |

## Related

- [[protocols/index]] — every protocol compared
- [[use/fronting]] — putting it behind a CDN
