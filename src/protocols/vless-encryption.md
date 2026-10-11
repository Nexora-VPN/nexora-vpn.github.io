---
title: "VLESS Encryption"
description: "Encrypt the VLESS stream itself with a post-quantum key exchange, so a CDN that terminates TLS sees only ciphertext."
order: 4
tags: [protocols]
---

# VLESS Encryption

VLESS Encryption encrypts the VLESS stream itself, inside TLS or with no TLS
at all. It is a switch on a VLESS [[~inbound]], and it
is read by Xray-based apps and recent Clash apps only.

## What it adds

- **Privacy past a CDN.** Behind a [[~front|domain front]], the CDN
  terminates TLS and could read what passes through. With VLESS Encryption on,
  it sees ciphertext instead of your users' VLESS traffic.
- **A post-quantum key exchange** on every connection (ML-KEM-768 together
  with X25519), whether or not there is TLS around it.
- **VLESS without TLS that apps accept.** Current Xray-based apps refuse plain
  VLESS with neither TLS nor REALITY; with VLESS Encryption on, the same
  inbound is accepted.

## Turn it on

1. Open the VLESS inbound (**Inbounds**, then the row's edit button), or
   create one. See [[use/inbounds]].
2. On the **Protocol** tab, find **VLESS Encryption** and pick an
   **Authentication**:
   - **X25519 (not post-quantum)**, or
   - **ML-KEM-768 (post-quantum)**.

   This is the key that proves the server. Pick one; the exchange inside each
   connection is post-quantum either way.
3. **Save.** The panel generates the key, keeps the server half on the
   inbound, sends it to the node, and puts the client half into every link
   and subscription file.

| Field | |
| --- | --- |
| **Mode** | `native`, `xorpub` or `random`: how much of the handshake is disguised. The three cost the same |
| **Ticket lifetime** | seconds a client may reconnect without a full handshake. `0` makes every connection a full handshake |
| **Server string** | the private half. Stored on the inbound and sent to the node, never put in a link. **Generate a new key** replaces it |
| **Client string** | derived from the server string and already in every link. Shown for a client you set up by hand |

## It re-issues every link

A link minted before you switched it on, or before you changed the
authentication or the key, is refused at the handshake. Set it before
customers import the inbound, or plan for every user of the inbound to refresh
their subscription. The same rule applies to
[[protocols/xhttp|XHTTP's advanced fields]].

## Which apps can use it

| Apps | |
| --- | --- |
| Xray-based apps (v2rayNG, v2rayN, Streisand, Happ) | yes, in full |
| Clash apps on mihomo 1.19.14 or later | yes |
| sing-box apps (SFA, Karing, NekoBox) | no. Their subscriptions leave the inbound out |

Because sing-box apps cannot use an encrypted inbound, keep another inbound
in the same [[~template]] for users on those apps.

## The vision flow is dropped

`xtls-rprx-vision` does not work on an encrypted inbound, so the panel leaves
it out there, on the node and in the links alike. Users who have **Flow
(VLESS)** set on their account keep it for your other VLESS inbounds; nothing
needs changing on the user.

## When to use it

- **A VLESS inbound behind a CDN** (WebSocket, gRPC, HTTPUpgrade or XHTTP
  with a front): the main reason to turn it on.
- **A VLESS inbound with no TLS**, for example behind a CDN that talks plain
  HTTP to your node.

On a REALITY inbound it mainly adds the post-quantum exchange, at the cost of
every sing-box app user on that inbound. Weigh that before turning it on
there.

## Related

- [[protocols/xhttp]] — the transport most often paired with it
- [[use/fronting]] — putting an inbound behind a CDN
- [[protocols/vless-reality]] — the vision flow and REALITY
