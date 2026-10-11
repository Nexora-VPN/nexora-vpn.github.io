---
title: "Certificates, issued and renewed"
description: "Who issues each certificate, where it is kept, how it reaches nodes, when it renews, what happens to pins, and how the panel's own certificate is handled."
order: 10
tags: [certificates, tls]
---

# Certificates, issued and renewed

The [[~panel]] keeps every TLS [[~certificate]] your service uses: for
inbounds and endpoints on nodes, for the panel's own HTTPS, for tunnels and
for addons. This page explains where each one comes from, how it reaches the
servers that use it, and how it is renewed without restarting anything.
Managing them is on [[use/certificates]].

## Kinds of certificate

| Kind | Made by | Renewed |
| --- | --- | --- |
| **Self-signed** | the panel, at once, with no outside party; valid for a year | by the panel |
| **ACME** | a certificate authority such as Let's Encrypt, after a challenge proves you control the name | by the panel |
| **Uploaded** | you, as a PEM certificate and key | never; replace it before it expires |

[[~reality|REALITY]] inbounds need no certificate at all: the panel generates
their keys.

## Who answers the ACME challenge

An authority issues a certificate only after a challenge proves control of the
name. The panel picks who answers it:

| Challenge | Answered by | Works when |
| --- | --- | --- |
| **dns-01** | the panel, through your DNS provider's API (Cloudflare, Alibaba Cloud DNS or acme-dns) | always, for any name, including wildcards and names that point at no server of yours |
| **http-01**, **tls-alpn-01** by the panel | the panel's server | the name resolves to the panel's server, and port 80 or 443 is free there |
| **any of the three** by a node | the node chosen under **Obtained by** | for http-01 and tls-alpn-01, the name points at that node |

A node only answers the challenge. The certificate it obtains is handed to
the panel, which stores it like any other.

## Where certificates live

- **In the panel's database**, keys included. They are part of every backup,
  which is one more reason to set a backup passphrase.
- **Not on nodes.** A node receives a certificate and its key inside its
  configuration, held in memory, and keeps none on disk. The only certificate a
  node stores is its own identity for the control link with the panel.
- **ACME account data** is in the database too, so it survives a replaced
  container.

## How a certificate reaches an inbound

An inbound or endpoint takes its certificate from one of three places, set
under **TLS certificate**: its own (written in its configuration), the node's
certificate, or one from the panel's store. A node can also have a
**Fallback certificate**, put into any of its TLS inbounds that would
otherwise have none, including one whose certificate file is missing on the
node.

The panel puts the certificate and key into the configuration it builds for
each node. Changing which certificate an inbound uses, or renewing it, is an
ordinary change to that inbound: the node rebuilds only the items that carry
the certificate, and nothing restarts. See [[how/config-sync]].

## Renewal

Every 6 hours the panel checks every certificate it can renew:

- **A certificate is due** 30 days before it expires, or in the last third of
  its life when it was issued for less than 90 days.
- **A self-signed certificate** is made again; **an ACME certificate** is
  obtained again with the challenge it was first issued with.
- **Every node that uses it** gets the new one as a live change.
- **A failed renewal keeps the old certificate serving.** The panel retries on
  the next check and raises `panel.cert_renew_failed`; a renewal that works
  raises `panel.cert_renewed`.

An uploaded certificate is never renewed. When one comes close to its expiry,
the panel raises `panel.cert_expiring`, so a notification can remind you.

## Pins rotate with the certificate

A self-signed certificate cannot be checked against an authority, so the
panel puts its pin, a fingerprint of the exact certificate, into users'
links and profiles. The pin is computed whenever the certificate is issued or
renewed.

When a self-signed certificate is renewed or reissued, its pin changes. Apps
pick up the new pin with their next [[~subscription]] refresh; until then they
refuse the new certificate. Self-signed certificates last a year, so this
happens about once a year, and an app that refreshes on its usual schedule
never notices. ACME certificates are never pinned, so their renewals change
nothing for apps. See [[how/subscriptions]].

## The panel's own certificate

The [[~setup-wizard]] creates the panel's own HTTPS certificate, self-signed by
default, covering the addresses you listed.

- **It follows your addresses.** Setting a panel domain or subscription
  domains reissues it so it names every one, including a wildcard
  subscription domain.
- **It reloads without a restart.** The panel's web server checks its
  certificate every 10 seconds and switches to a new one when it changes. A
  broken update is ignored and the last good certificate keeps serving.
- **It can be replaced** by an ACME or uploaded certificate from the store, or
  by certificate files on disk you manage yourself. Then every name in use must
  be on it: a domain the certificate does not cover is a TLS error in the app.

The panel only rewrites its own reserved certificate when your addresses
change. A certificate from the store that you chose for the panel is never
rewritten, since it may also serve inbounds whose clients pin it.

## Tunnel and addon certificates

- **Tunnels** using TLS get a self-signed certificate for the tunnel's own
  internal name, valid for ten years, which the other side pins. Both ends are
  your own nodes, so there is nothing to buy and nothing to renew.
- **Addons** can take a certificate from the panel's store, which the panel
  renews and the addon fetches every few minutes. For an addon on another
  server only certificates the panel's server did not prove are offered, and
  the panel's own HTTPS certificate never is. See
  [[how/addon-platform]].

## Related pages

- [[use/certificates]]: issuing, assigning and replacing certificates.
- [[how/security]]: the certificates that secure the link between panel and
  nodes.
