---
title: "VMess"
description: "Serve VMess for apps and users that expect it, with the same transports and TLS modes as VLESS."
order: 5
tags: [protocols]
---

# VMess

VMess is the older sibling of VLESS: one id per user, the same choice of
transports and the same TLS modes. Most operators offer VLESS instead and keep
VMess for users whose app, router or habit expects it.

## What it is good for

- **Compatibility.** Every app family reads VMess: share links, Clash
  (mihomo) apps, sing-box apps and Xray-based apps.
- **Running without TLS behind a CDN.** VMess encrypts its own payload, so a
  WebSocket or gRPC inbound with no TLS behind a CDN that terminates TLS still
  keeps the CDN from reading the traffic. For VLESS the same need is met by
  [[protocols/vless-encryption|VLESS Encryption]].

## Create it

**Inbounds → Add**, type `vmess`. The general form is on [[use/inbounds]].

| Tab | What to set |
| --- | --- |
| **Basic** | **Port** |
| **Transport** | `tcp (none)`, or `ws`, `grpc`, `httpupgrade`, `xhttp`… to put it behind a CDN |
| **TLS** | **TLS** with a [[~certificate]], **REALITY**, or **None** |
| **Multiplex** | optional; see below |

There is nothing to fill in on the **Protocol** tab. Each user is identified by
the **UUID** on their **Credentials** tab, which the panel generates for every
account; the client files are written with the settings every current app
expects (no alter id, automatic cipher).

## Behind a CDN

With a `ws`, `grpc`, `httpupgrade`, `xhttp` or `http` transport, and TLS or no
TLS (never REALITY), a [[~front|domain front]] can carry it. See
[[use/fronting]].

## Multiplex

The **Multiplex** tab lets apps that open several connections over one carry
it to this inbound. sing-box apps and Clash apps have such a setting. It is
unrelated to the **Mux** switch in Xray-based apps, which must stay off: with
it on, the connection fails with nothing in the app to explain it.

## Client apps

| Format | |
| --- | --- |
| Share link (`vmess://`) | yes |
| Clash apps | yes, except the `quic`, `xhttp` and `mkcp` transports |
| sing-box apps | yes, except `xhttp` and `mkcp` |
| Xray-based apps | yes, except `http` (HTTP/2) and `quic` |

## Related

- [[protocols/vless-reality]] — the usual first choice
- [[protocols/index]] — which transport each app reads
