---
title: "Protocols"
description: "Every inbound protocol the panel offers, what it runs over, whether a CDN can carry it, and which client apps read it."
order: 1
tags: [protocols]
---

# Protocols

This section is about choosing what your users connect with. Each protocol is
an [[~inbound]] you create once in the shared pool and put on a
[[~template]]; the nodes on that template serve it, and every user of the
template gets an entry for it in their [[~subscription]]. How to create one is
on [[use/inbounds]]; the pages here explain each protocol's fields and limits.

<NxShot page="inbounds" alt="The inbounds page: a list of inbounds with their protocol, port and TLS mode" />

## Every inbound at a glance

**Runs over** is what the node listens on, which is what your firewall has to
let in. **TLS** lists the modes the form offers: a certificate (the node's own,
one from the panel's store, or your own PEM pair), [[~reality|REALITY]], or
none. **Behind a CDN** says whether a [[~front|domain front]] can carry it.

| Protocol | Runs over | TLS | Behind a CDN | Page |
| --- | --- | --- | --- | --- |
| VLESS | TCP (UDP with the `quic` or `mkcp` transport) | TLS, REALITY, none | yes, with an HTTP-shaped transport and no REALITY | [[protocols/vless-reality]] |
| VMess | as VLESS | TLS, REALITY, none | as VLESS | [[protocols/vmess]] |
| Trojan | as VLESS | TLS, REALITY, none | as VLESS | [[protocols/trojan]] |
| Shadowsocks | TCP and UDP | none (its own encryption) | no | [[protocols/shadowsocks]] |
| Hysteria2, Hysteria (v1) | UDP (QUIC) | TLS, required | no | [[protocols/hysteria2]] |
| TUIC | UDP (QUIC) | TLS, required | no | [[protocols/tuic]] |
| NaiveProxy | TCP (HTTP/2), optionally UDP (HTTP/3) | TLS, required | no | [[protocols/naive]] |
| AnyTLS | TCP | TLS or REALITY, required | no | [[protocols/more#anytls]] |
| ShadowTLS | TCP | borrowed from a real site | no | [[protocols/more#shadowtls]] |
| Mieru | TCP or UDP | none (its own encryption) | no | [[protocols/more#mieru]] |
| Snell | TCP | none (its own encryption) | no | [[protocols/more#snell]] |
| MTProxy | TCP | none (its own encryption) | no | [[protocols/more#mtproxy]] |
| SSH | TCP | SSH's own | no | [[protocols/more#ssh]] |
| TrustTunnel | TCP or UDP | TLS, required | no | [[protocols/more#trusttunnel]] |
| Sudoku | TCP | none (its own encryption) | no | [[protocols/more#sudoku]] |
| SOCKS, mixed | TCP | none | no | [[protocols/more#socks-http-and-mixed]] |
| HTTP | TCP | TLS, REALITY, none | no | [[protocols/more#socks-http-and-mixed]] |
| Ingress | TCP | TLS or none | through its children | [[protocols/ingress]] |
| WireGuard (endpoint) | UDP | WireGuard's own | no | [[protocols/wireguard]] |
| OpenVPN (endpoint) | UDP or TCP | TLS (certificate) | no | [[protocols/openvpn]] |
| OpenConnect (endpoint) | TCP and UDP | TLS (certificate) | no | [[protocols/openvpn]] |

VLESS, VMess and Trojan take a transport: `tcp (none)`, `ws`, `grpc`, `http`
(HTTP/2), `httpupgrade`, `quic`, `xhttp` or `mkcp`. No other protocol has a
transport. A CDN can carry the HTTP-shaped ones: `ws`, `grpc`, `http`,
`httpupgrade` and `xhttp`.

WireGuard, OpenVPN and OpenConnect are [[~endpoint|endpoints]], made on
[[use/endpoints]]. They reach users the same way inbounds do. The local types the form also lists (`tun`, `redirect`, `tproxy`,
`direct`) are not for customers; see [[protocols/more]].

## Which apps read what

A subscription answers in the format the app asks for. Four formats matter:

- **Share links** (`vless://`, `trojan://`, `hysteria2://`…), read by almost every
  app, including the Xray-based apps (v2rayNG, v2rayN, Streisand, Happ).
- **Clash**, read by Clash Meta and other mihomo apps.
- **sing-box**, read by sing-box apps (SFA, SFI, Karing, NekoBox).
- **Xray JSON**, read by Xray-based apps.

An entry an app cannot use is left out of that app's file, so the same user
can see a different list in two apps.

| Protocol | Share link | Clash | sing-box | Xray JSON |
| --- | --- | --- | --- | --- |
| VLESS | yes | yes | yes, except with VLESS Encryption | yes, except without TLS, REALITY or VLESS Encryption |
| VMess, Trojan | yes | yes | yes | yes |
| Shadowsocks | yes | yes | yes | yes |
| Hysteria2 | yes | yes | yes | yes |
| Hysteria, TUIC, AnyTLS | yes | yes | yes | no |
| NaiveProxy | yes | no | yes | no |
| SOCKS, mixed | yes | yes | yes | yes |
| HTTP | no | yes | yes | yes |
| SSH | no | yes | yes | no |
| Mieru | no | yes | no | no |
| Snell | no | no | yes | no |
| ShadowTLS, MTProxy, TrustTunnel, Sudoku | no | no | no | no |
| WireGuard | `.conf` file | yes | yes | yes |
| OpenVPN | `.ovpn` file | no | yes | no |
| OpenConnect | server and sign-in details | no | yes | no |

For VLESS, VMess and Trojan the transport decides as well:

| Transport | Clash | sing-box | Xray JSON | Behind a CDN |
| --- | --- | --- | --- | --- |
| `tcp (none)` | yes | yes | yes | no |
| `ws` (WebSocket) | yes | yes | yes | yes |
| `grpc` | yes | yes | yes | yes |
| `http` (HTTP/2) | yes | yes | no | yes |
| `httpupgrade` | yes | yes | yes | yes |
| `quic` | no | yes | no | no |
| `xhttp` | no | no | yes | yes |
| `mkcp` | no | no | yes | no |

Share links carry every transport; whether a given app can dial it is the
app's business.

::: tip Tell users to turn Mux off
Xray-based apps have a **Mux** switch. Turned on, the connection fails with
nothing in the app to explain it. The [[~subscription-page|subscription page]]
warns about it; repeat it in your own setup instructions. See
[[use/subscriptions]].
:::

## How to choose

- **Start with [[protocols/vless-reality|VLESS + REALITY]].** It needs no
  domain and no certificate, works in nearly every app, and is the first
  preset on **Inbounds → From a preset**.
- **Add a WebSocket, gRPC or [[protocols/xhttp|XHTTP]] inbound with TLS** when
  you want to put a CDN in front. REALITY cannot be fronted. See
  [[use/fronting]].
- **Add [[protocols/hysteria2|Hysteria2]]** for users on lossy mobile or
  long-distance links, where a UDP protocol holds up better than TCP. It needs
  UDP to reach the node, and port hopping helps where single UDP ports are
  blocked.
- **Offer two or three shapes.** Different networks block different
  things. A subscription with a TCP protocol, a CDN-fronted one and a UDP one
  gives a user something that works when one of them stops.
- **Use [[protocols/ingress|an ingress]]** when you have only port 443 to
  spare and want several TCP inbounds on it.
- **Use [[protocols/wireguard|WireGuard]] or
  [[protocols/openvpn|OpenVPN / OpenConnect]]** for users who need a
  standard VPN app, a router, or a work laptop that can only run one of those.

Every protocol carries the same accounting, quotas, speed and address limits
per user; nothing about the choice changes how you sell an account.

## Related

- [[use/inbounds]] — creating, editing and placing inbounds
- [[use/endpoints]] — WireGuard, OpenVPN and OpenConnect
- [[use/certificates]] — the certificates TLS inbounds use
- [[how/subscriptions]] — how a subscription is assembled
