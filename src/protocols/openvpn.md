---
title: "OpenVPN and OpenConnect"
description: "Serve OpenVPN and OpenConnect (AnyConnect) to your users, with a sign-in per account and ready .ovpn files."
order: 12
tags: [protocols, certificates]
---

# OpenVPN and OpenConnect

OpenVPN and OpenConnect are the VPNs that office laptops, routers and locked-down
devices often already have. Nexora serves both as [[~endpoint|endpoints]]: each
user signs in with their own account name and password, and the panel writes
their client configuration for them.

## What they are good for

- **OpenVPN**: the official OpenVPN apps, routers and firewalls with a built-in
  client, and any user who can import an `.ovpn` file.
- **OpenConnect**: Cisco Secure Client (AnyConnect) and the OpenConnect
  clients, common on work devices.

Neither can be put behind a CDN.

## OpenVPN

**Endpoints → Add**, type `openvpn-server`. The general form is on
[[use/endpoints]]. The form starts with a random port, the `tls` mode, `udp`,
a client address pool and the node's certificate.

| Field | |
| --- | --- |
| **Listen port** | the port users connect to |
| **Mode** | `tls` (the default) is the one for customers: the server proves itself with a certificate and each user signs in with their name and password. `static_key` is one point-to-point tunnel for a single client, see below |
| **Network** | `udp` (the default) or `tcp`. One endpoint listens on one of them; for both, add a second endpoint |
| **Address (CIDR list)** | the pool users' tunnel addresses come from, for example `10.9.0.1/24` |
| TLS certificate | the node's certificate by default, or one from [[use/certificates]]. The certificate fields show only while it is set to the endpoint's own certificate |
| **Verify client certificate** (advanced) | off by default. Requiring client certificates drops the endpoint from users' subscriptions, because the panel does not issue them |

Under **+ Add setting** are the tuning options. Most start at the value the
node already uses without them, so adding one changes nothing until you edit
it. **Data ciphers fallback** is the exception: the node has none, and adding
it lets clients older than OpenVPN 2.4 in with the cipher it names.

- **Data ciphers**, **Data ciphers fallback**, **Auth digest**: the data
  channel. The fallback is for clients older than OpenVPN 2.4.
- **Min/Max TLS version**, **TLS 1.2 cipher suites**, **TLS key exchange
  groups**, **Certificate profile**: the control channel's TLS.
- **MTU**, **MSS fix (bytes)**, **Replay window (packets)**, **Max clients**,
  **Topology**.
- **Ping interval/restart**, **Renegotiate every/after**, **Handshake window**:
  timing on the server's side.

### Control channel protection

Turn on **Control channel protection** to sign (`tls_auth`) or also encrypt
(`tls_crypt`, `tls_crypt_v2`) every control-channel packet with a key. A probe
without the key then gets no answer at all, and with `tls_crypt` or
`tls_crypt_v2` the TLS handshake and the server's certificate cannot be read on
the wire. None of the three hides that the traffic is OpenVPN: the packet
header stays readable, and OpenVPN can be recognised by it whichever is chosen.

The panel makes the key, and **Regenerate** makes a new one. Every user's
`.ovpn` file and subscription carry the matching client side:

- `tls_crypt` and `tls_auth`: the same key for everyone.
- `tls_crypt_v2`: a key of each user's own, wrapped with the server's key. The
  server key never leaves the endpoint. A user always gets the same key; a
  regenerated server key gives every user a new one, so they must download
  their file again.

### Push to clients

**Push to clients** is what the server tells every client once it connects.
Off, the panel's default applies: all traffic through the tunnel, a ping every
10 seconds, a restart after 60. On, it starts from that default and you can
change:

- **Route all traffic through the tunnel**, with its redirect flags, and
  **Routes**, the networks sent through it (all that is sent when the first is
  off);
- **DNS servers (dhcp-option)**, which every client reads, **Search domains**,
  and **DNS servers for OpenVPN 2.6 clients (priority, split DNS, DNSSEC, DNS over TLS or HTTPS)**;
- **Block DNS outside the tunnel (Windows)**, extra DHCP options, and the
  client ping timing.

Clients take all of it from the server; their files do not change.

### Static key mode

`static_key` mode is one tunnel between this endpoint and a single client that
holds the same key, with no sign-in. It needs:

- **Static key**: made for you, with a button to make a new one;
- **Cipher**;
- **Client tunnel address**, the client's address inside the tunnel (and the
  IPv6 one when the pool has IPv6);
- over UDP, **Client address** and **Client port**: the server answers that
  address only.

Such an endpoint has no users: it carries no TLS, pushes nothing, and gets no
`.ovpn` files or subscription entries. You set up its one client yourself.

### The .ovpn file

Every user on the template gets an `.ovpn` file, on their **QR / Links**
dialog under **Client apps** (**Save file**) and on their
[[~subscription-page|subscription page]]. The file is complete:

- the server's certificate is inside it, so a self-signed node certificate
  works without any setup on the device;
- the user's name and password are inside it too, so OpenVPN Connect 3 and
  OpenVPN 2.6 or later connect without asking.

An `.ovpn` with a certificate inside is usually too large for a QR code; the
dialog then offers copy and save only. The file names the node's first
[[~link-address|link address]], since a saved file cannot list alternatives.

Sing-box apps also get the endpoint as an entry in their subscription.

## OpenConnect

**Endpoints → Add**, type `openconnect-server`. The form starts with a random
port, a client address pool and TLS on the node's certificate.

| Field | |
| --- | --- |
| **Listen port** | often 443, which is what AnyConnect clients expect |
| **Client IP pool (CIDR)** | the pool users' tunnel addresses come from |
| TLS certificate | the node's certificate by default, or one from [[use/certificates]]. The sign-in details users get carry no certificate, so their client checks it the way a browser does: an ACME certificate for a real domain avoids a warning or a refusal on the device |
| **Pushed DNS servers** | the resolvers the device should use |
| **Search domain**, **Split-include routes**, **MTU**, **DPD/keepalive (seconds)** (advanced) | as in any AnyConnect server |

OpenConnect clients take a server address and a sign-in rather than a file.
The user's **Client apps** tab and subscription page show both. Sing-box apps
also get the endpoint in their subscription.

## Users

- **One device at a time per user on OpenVPN.** A second device that signs
  in with the same account takes over the session, and the first is dropped.
  Over TCP it sees that at once; over UDP it is not told and notices at its
  next ping timeout. Either way it connects again and takes the session back,
  so two devices of one user keep pushing each other off, and a client that
  reconnects at once, such as sing-box apps, always wins. Give each device its
  own account, or use another protocol for the second device.
  **Allow duplicate CN** lifts the rule, but then every connection gets a new
  tunnel address, so a user with an address limit can be locked out for some
  minutes after reconnecting.
- A user changing their password, or being removed or disabled, is
  disconnected from OpenVPN at once; the rest stay connected.
- An OpenVPN endpoint in `tls` mode, or an OpenConnect endpoint, with no users
  on its template is not served at all: an empty OpenVPN server would accept
  any password. The panel sends it to the node once there is at least one
  user.
- Accounting, quotas, speed and address limits apply per user, as on any
  inbound.

## Related

- [[use/endpoints]] — the endpoints page
- [[use/certificates]] — certificates for both endpoints
- [[protocols/wireguard]] — the other standard VPN
