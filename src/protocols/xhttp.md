---
title: "XHTTP"
description: "Use the XHTTP transport: its modes, the advanced fields every link carries, which apps read it, and running it behind a CDN."
order: 3
tags: [protocols, fronting]
---

# XHTTP

XHTTP is a transport for VLESS, VMess and Trojan inbounds that carries the
connection as ordinary HTTP requests. It goes through CDNs and HTTP reverse
proxies that a long-lived stream would not, and it works with TLS,
[[~reality|REALITY]] or no TLS at all. Only Xray-based apps read it, so offer
it beside an inbound that every app can use.

## Create it

1. **Inbounds → Add**, type `vless` (or `vmess`, `trojan`). See
   [[use/inbounds]] for the general form.
2. On the **Transport** tab pick `xhttp`. The **Path** is the one field most
   inbounds need; the rest are under **Advanced**.
3. On the **TLS** tab pick TLS with a [[~certificate]], REALITY, or none.
   Choose none only when a CDN in front terminates TLS for you.
4. **Save**, and add the inbound to a [[~template]].

## Modes

**Mode** decides how the client splits the upload and download halves into
requests. Empty and `auto` let the client choose.

| Mode | How it carries traffic |
| --- | --- |
| `packet-up` | the upload goes as a series of separate requests. The safest behind a CDN, since each piece is an ordinary request |
| `stream-up` | the upload goes as one long streaming request |
| `stream-one` | both directions share one request |

Some advanced fields only work in `packet-up` mode, and the panel refuses the
others at save time.

## The advanced fields travel in the link

Every advanced field below is enforced by the node **and** told to the client
in its link, so both ends agree. That has one consequence worth reading
twice:

::: warning Change one, and every link must be re-issued
A client still holding an older link is refused by the node. XHTTP refuses
with intermittent errors rather than a clean failure, so what reaches your
support chat is "it works sometimes". Settle these fields before customers
import the inbound, or plan for everyone to refresh their subscription.
:::

The form marks each of these fields with a hint saying so.

| Field | What it does |
| --- | --- |
| **X-Padding bytes** | the size range of the padding both ends add to every request. Wider means more bytes per request and less regular sizes. It cannot be switched off |
| **X-Padding obfuscation** | off, the padding travels in a fixed place and the four fields below are ignored. On, you choose where it goes |
| **X-Padding placement** | where it travels: `queryInHeader`, `header`, `query` or `cookie` |
| **X-Padding key**, **X-Padding header** | the names it travels under |
| **X-Padding method** | how the padding is generated: `repeat-x` or `tokenish` |
| **Session placement**, **Session key** | where the session id travels: the path (default), a query parameter, a header or a cookie, and under which name |
| **Sequence placement**, **Sequence key** | the same, for the packet sequence number |
| **Uplink HTTP method** | `POST` (default) or `GET`. `GET` is accepted only in `packet-up` mode |
| **Uplink data placement**, **Uplink data key** | where the upload data goes: the body (default), a header or a cookie. Header and cookie are accepted only in `packet-up` mode |
| **Max bytes per post** | the largest upload chunk. The node refuses a larger one, so clients are told this value and stay under it |

Only the values you changed go into the link. A default never does, so a later
change of default applies to old links and new alike.

## Which apps read it

Xray-based apps (v2rayNG, v2rayN, Streisand, Happ) speak XHTTP and get every
field, through share links and the Xray JSON format. Sing-box apps and Clash
apps have no XHTTP, so their subscription files leave the inbound out rather
than carry half of it. A user on one of those apps simply does not see this
inbound; give them another one.

## Behind a CDN

XHTTP is one of the transports a [[~front|domain front]] can carry. Set up the
front on [[use/fronting]] and enable it on this inbound.

The padding, the session id and the sequence number travel fine in every
placement: they are short values in a path, a query, a header or a cookie,
which any CDN that forwards HTTP forwards. Two shapes a CDN cannot carry are
the upload data in a **header** or a **cookie**. The panel refuses those when
you save the front. A `GET` upload has no body for a CDN to forward either.

### The client's real address

Behind a CDN, every connection reaches the node from the CDN's address. To
keep the user's own address (for the address limit and the logs), the node has
to read it from the header the CDN writes it into.

Name that header in the front's **Client address header** field:
`CF-Connecting-IP` for Cloudflare, and the field lists the usual ones for
other CDNs. Every XHTTP inbound the front is enabled on then trusts that
header. Saving a front that changes the header restarts the inbound on its
nodes, which drops its open connections.

The address is only as good as three things:

1. **The CDN writes the header itself.** Cloudflare does; some CDNs pass on a
   value the client sent unless you configure them not to. Check your CDN's
   documentation.
2. **The node accepts connections from the CDN alone.** A client that reaches
   the node directly can send the header too.
3. **Every front on the inbound names the same header.** A CDN passes another
   CDN's header on unchanged.

With all three, the address can back limits. Without them, treat it as a
hint.

An inbound can also carry its own list in its JSON, as
`trusted_x_forwarded_for` under `transport`, which takes precedence over the
front's header. With neither (no list on the inbound and no front naming a
header), the node trusts any `X-Forwarded-For` header, from anyone: a client
that reaches the inbound directly can name its own address. So name the
header on the front, and do not put an inbound that has no front behind some
other proxy.

## Related

- [[protocols/vless-encryption]] — keeps traffic private where a CDN
  terminates TLS
- [[use/fronting]] — setting up a front
- [[protocols/index]] — which transports each app reads
