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
[[use/endpoints]]. The form starts with a random port, the `tls` mode, a
client address pool and the node's certificate.

| Field | |
| --- | --- |
| **Listen port** | the port users connect to |
| **Mode** | `tls` (the default) is the one for customers: the server proves itself with a certificate and each user signs in with their name and password. `static_key` is one shared key for everyone, with no per-user sign-in |
| **Network** | `udp` (also when empty) or `tcp` |
| **Address (CIDR list)** | the pool users' tunnel addresses come from, for example `10.9.0.1/24` |
| TLS certificate | the node's certificate by default, or one from [[use/certificates]] |
| **Push: redirect gateway**, **Push: DNS servers** (advanced) | send all of the device's traffic through the VPN, and the resolvers it should use |
| **Advertised remote host**, **Advertised remote port** (advanced) | what the `.ovpn` file names as the server, when it differs from the node's address, behind a port forward for example |
| **Verify client certificate** (advanced) | off by default. Requiring client certificates drops the endpoint from users' subscriptions, because the panel does not issue them |

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
