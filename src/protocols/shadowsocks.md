---
title: "Shadowsocks"
description: "Serve Shadowsocks with the 2022 methods and a key per user, for TCP and UDP without TLS."
order: 7
tags: [protocols]
---

# Shadowsocks

Shadowsocks encrypts with a key instead of TLS: no certificate, no domain, one
port for TCP and UDP. The panel serves it with a key for every user, so each
account is counted, limited and switched off on its own.

## What it is good for

- **A light protocol with no TLS** for apps and routers that support it.
- **UDP traffic** such as calls and games, on the same port.
- **Every app family**: share links, Clash (mihomo) apps, sing-box apps and
  Xray-based apps all read it.

It has no transport and no TLS, so it cannot be put behind a CDN.

## Create it

**Inbounds → Add**, type `shadowsocks`. The general form is on
[[use/inbounds]]. The defaults are ready to save: a 2022 method and a
generated server key.

| Field (**Protocol** tab) | |
| --- | --- |
| **Method** | the cipher. Keep a `2022-blake3-…` method unless an app needs an older one |
| **Server password** (advanced) | the inbound's own key, generated for you |
| **Network** (advanced) | `tcp`, `udp`, or empty for both |

## Methods

| Method | Key length |
| --- | --- |
| `2022-blake3-aes-128-gcm` (default) | 16 bytes |
| `2022-blake3-aes-256-gcm` | 32 bytes |
| `2022-blake3-chacha20-poly1305` | 32 bytes |
| `aes-128-gcm`, `aes-256-gcm`, `chacha20-ietf-poly1305`, `xchacha20-ietf-poly1305` | any password |
| `none` | no encryption |

The 2022 methods need keys of an exact length, written in base64. The
**Server password** must match its method: a 16-byte key for
`2022-blake3-aes-128-gcm`, a 32-byte key for the other two. If you change the
method, generate a key of the right length too, or the node refuses the
inbound.

The older methods are there for apps that do not support 2022. `none` sends
traffic unencrypted and is only for testing.

## Keys per user

Every account carries two Shadowsocks keys on its **Credentials** tab:
**Shadowsocks key (16B)** and **Shadowsocks key (32B)**. The panel picks the
one that fits the inbound's method, and the app receives the server key and
its own user key together in its link. On the older methods, the user's
**Password** is used instead.

This is what makes the inbound multi-user: each user has their own key, so
traffic is counted per account and a disabled user stops working at once.

::: warning Never served without users
A Shadowsocks inbound with no users would be a single-key server on the key
every link carries. The panel leaves such an inbound out of what a node is
sent until at least one user is on it.
:::

## Client apps

| Format | |
| --- | --- |
| Share link (`ss://`) | yes |
| Clash apps | yes |
| sing-box apps | yes |
| Xray-based apps | yes |

## Related

- [[protocols/index]] — every protocol compared
- [[use/users]] — an account's credentials
