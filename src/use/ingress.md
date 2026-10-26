---
title: "Addresses"
description: "Choose every port, host name and path the panel answers on, what each one serves, and what answers a request none of them takes."
order: 18.5
group: settings
tags: [panel, tls, access]
---

# Addresses

**Settings → Addresses** decides where the [[~panel]] can be reached and what
it serves there: the admin panel, subscriptions, the API, a web site, another
program, or a fixed answer. Only the main admin opens it. A change is applied
at once, without a restart, and is put back by itself unless it is confirmed
within two minutes.

<NxShot page="ingress" alt="The Addresses page: tabs for listeners, routes, fallbacks, brandings, a request test and the change history, above the list of listeners" />

## This page or General settings

A new panel has one address: one port, the panel on it, and maybe a domain, a
base path and subscription domains. **Settings → General** and
[[use/subscriptions]] edit that address field by field, and those changes
apply after **Restart panel**. This page edits the same thing in full.

Once you add something those fields cannot describe, such as a second port or
a route for something other than the panel and subscriptions, change the
address here only. Saving a different value on General is then refused with a
message that points here; the rest of that page saves as before.

## How a request is answered

1. A **listener** accepts the connection on its port, with its own TLS.
2. The **routes** on that listener are tried in order. The first whose hosts
   and path prefix match, and whose service takes the path, answers.
3. A request no route takes gets a **fallback**: the route's, else the
   listener's, else a plain "not found".

A fallback answers only what the panel refuses. The panel's own errors, such
as a wrong password or an API "not found", are never replaced.

## Listeners

A listener is one port the panel binds. The **primary** listener is the one the
panel always starts on: it is always on, and in Docker its address is fixed by
the compose file.

| Field | What it does |
| --- | --- |
| **Listen address** | An IP address of this server; empty listens on every address, IPv4 and IPv6. |
| **Port** | The port. On the primary listener, empty keeps the port the panel was started with. |
| **TLS** | **Plain HTTP**, **A certificate from the store** (from [[use/certificates]]) or **Certificate files on disk**. |
| **More certificates** | Further certificates from the store. A client asking for a name one of them carries gets that one; anything else gets the listener's own. |
| **Refuse unknown names** | A TLS handshake asking for a name no certificate here carries is refused. Opening the panel by its IP still works when the certificate carries that IP. |
| **Host must match the handshake** | A request whose host name differs from the name its TLS handshake asked for gets the fallback. |
| **Trusted proxies** | Addresses and CIDRs whose `X-Forwarded-For` this listener believes. The primary listener's list is the one on [[use/security#trusted-proxies]]. |
| **Fallback** | What answers a request no route on this listener takes. |
| **Passthrough** | Host names whose TLS connections are handed, untouched, to another `host:port` (below). |

A listener that cannot bind its port, or whose certificate does not load, shows
**Not serving** with the reason, and the others keep serving. A TLS listener
whose certificate does not load is never served as plain HTTP instead. The
primary listener is the exception, so that you can still reach the panel: it
falls back to plain HTTP and says so.

The panel answers ACME HTTP-01 and TLS-ALPN-01 challenges on its own
listeners. A panel on ports 80 and 443 can still obtain certificates by those
challenges; see [[use/certificates]].

### Passthrough

A passthrough row sends a TLS connection for one host name to another program
before the panel reads anything of it. The program terminates TLS with its own
certificate. Use it to share port 443 with something that must see its own
handshake, such as an inbound on a node running on the same server.

The program sees the panel's address as the client's. No PROXY protocol is
sent, so per-client address limits in that program do not work through it.

## Routes

Each route has a name, the listeners it is on, and three things that decide
which requests it matches:

- **Hosts**: names or addresses, without a port. `*.example.com` matches one
  label under it. Empty matches every host.
- **Except hosts**: names it never answers, for a route on every host.
- **Path prefix**: empty, or `/name`. The prefix is removed before the service
  sees the path.

Routes are tried from the top; **Move up** and **Move down** change the order.

### What a route serves

| Serves | Takes | What it is for |
| --- | --- | --- |
| **Panel** | everything | The admin panel and its own API, plus the parts switched on: **Subscriptions**, **/api/v1**, **/metrics**, **Node installer** |
| **Subscriptions** | `/sub/…` | Users' subscription links and pages |
| **API** | `/api/v1/…` | The API for [[use/tokens\|API tokens]] only |
| **Metrics** | `/metrics` | Prometheus; see [[how/monitoring]] |
| **Node installer** | `/install…` | The node install script and the panel's CA |
| **Static site** | everything | A directory of files |
| **Redirect** | everything | Sends every request to another address |
| **Fixed answer** | everything | The same status, headers and body for every request |
| **Another program** | everything | A reverse proxy to an addon or to your own software |

A **Subscriptions** route takes only `/sub`, so the next route still gets
everything else on the same host.

### Panel routes

**Who may sign in** limits sign-in on this route to main admins, operators or
resellers. Empty lets every account in, and the panel's owner always gets in.

### API routes

An **API** route accepts API tokens only. A browser's session is ignored
there, the login and setup pages are not there, and a login used as a token
is refused. **Tokens** and **Addons** limit it to the tokens you pick; with
neither, every token gets in.

To keep `/api/v1` off the panel's public address, switch **/api/v1** off on the
panel route and give an API route a listener of its own, such as one on
`127.0.0.1` or a private address.

### Another program

**Proxy to** is **A URL** or **An addon**. An addon target uses the addon's own
address and the trust the panel keeps for it, and a suspended addon's route
answers its fallback.

- **Send the request's Host**: off sends the target's own host name.
- **Strip the prefix**: sends the path under the prefix instead of the whole
  path.
- **Verify the target**: **By the system's authorities**, **By a pinned
  certificate**, or **Not at all**.

WebSocket connections pass through. The panel's session cookie never reaches
the program, and the program cannot set it. For the same reason a route to
another program cannot share a host with a panel route: give it its own host
name, and when the panel route matches every host, list that name under the
panel route's **Except hosts**.

### Other route fields

| Field | What it does |
| --- | --- |
| **Bound to an account** | Ties the route to one admin account (below). |
| **Its own customers only** | On a subscription route bound to a reseller: any other subscription gets the fallback. |
| **Allowed addresses** | Only these addresses or CIDRs are answered; any other gets the fallback. |
| **Fallback** | What answers a request this route matched but did not take. Empty uses the listener's. |
| **Branding** | The look of this route's pages (below). |
| **Publish links here** | Links to this service are built on this route, such as subscription links. |
| **Public address** | The origin links are built on, when people reach the panel through a CDN or a proxy in front of it. |
| **Headers** | Response headers for this route. A header the service sets itself wins. |
| **HSTS max-age (seconds)** | Sent over TLS only; `0` is off. |

## Accounts bound to hosts

**Bound to an account** on a panel route makes its hosts that account's:

- On that route only the bound account signs in, or uses its API tokens.
- An account bound to a route signs in nowhere else, and its tokens work
  nowhere else. The panel's owner is the exception: it can always sign in on
  the panel's other addresses.

A refused sign-in reads exactly like a wrong password, and is not counted
towards a ban.

A **Subscriptions** route bound to a [[~reseller]] is that reseller's
subscription address. With **Publish links here** on, its customers' links are
built there. **Its own customers only** is on by default for a new route, so
that domain does not show it shares a panel with another reseller's.

## Fallbacks

A fallback is a reusable answer: **Static site**, **Redirect** or
**Fixed answer**. The list shows which listeners and routes use each one.

A **Static site** serves an absolute directory on the panel's server as an
ordinary web site: no directory listings, no dotfiles, and its own `404.html`
for missing paths. On an upgraded panel, the old **Masquerade directory** is a
static-site fallback here.

## Brandings

A branding is a look, in two halves:

- **Admin panel**: **Product name**, **Logo**, **Favicon**, **Colour**,
  **Density** and **Login page message**. The login page draws in it from the
  first moment.
- **Subscription page**: **Theme**, **Title**, **Support link**,
  **Page link in the client** and **Announcement**.

The logo and the favicon are at most 256 KB together and are kept in the
database, so they are in every backup.

A route picks one under **Branding**, and the main admin gives a reseller one
on its account ([[resellers]]). The admin panel takes the route's branding,
else the branding of the account the route is bound to. A subscription takes
its owner's, then its route's, then the subscription settings. An empty field
falls through to the next one.

## Saving and confirming

Edit as much as you like, then click **Save and apply**:

1. The panel checks the change. One that would leave the address you are on
   without the panel is refused.
2. It applies the change at once. Open connections stay up; a listener is
   restarted only when its address changes or TLS is switched on or off.
3. The page confirms the change from the address it is on. If that address no
   longer reaches the panel, for example after you changed its port, the page
   lists the new addresses. Open one within the time shown to confirm there.
4. A change nobody confirms within two minutes is put back by itself. A panel
   stopped while waiting puts it back when it starts.

To move the panel somewhere else, add the new address first, save, open it,
and remove the old one from there.

**History** lists every change: from this page, from General settings, an
upgrade, a restore or `ingress reset`. **Restore** applies an older one, and it
needs confirming like any other change.

## Test a request

**Test a request** shows what a request would get, without sending one. Pick
the listener and give the host, path, the TLS name and the client's address.
The answer names the route that takes it and the path its service sees, or
the fallback that answers, and lists every route it passed with the reason.
**Against the unsaved changes** tests your edits before you save them.

## Warnings

The page warns about what saves and serves but probably does not do what you
meant:

- a route that never answers, because an earlier route takes its requests;
- a route that answers nothing at all;
- a host name on a TLS listener that none of its certificates carries;
- a listener other than the primary inside a container, which is reachable
  only when the container publishes its port;
- a node installer served only on a route of its own, while the install
  command on [[use/nodes]] uses the address you opened the panel on.

## Examples

### The panel on 443 with a domain

1. Issue a certificate for `panel.example.com` and `sub.example.com` on
   [[use/certificates]].
2. Add a listener on port 443 with **A certificate from the store**, that
   certificate, and **Refuse unknown names** on.
3. Add a **Panel** route on it with the host `panel.example.com`, and a
   **Subscriptions** route with the host `sub.example.com` and
   **Publish links here**.
4. Save, open `https://panel.example.com`, and from there remove the old
   address if you no longer want it.

### A reseller with its own addresses

Add a **Panel** route on `panel.reseller.example.com` and a **Subscriptions**
route on `sub.reseller.example.com`, both **Bound to an account** to the
reseller, with its branding. The reseller signs in only there, and its
customers' links and pages carry its name.

### An addon behind 443

Add an **Another program** route on `shop.example.com` with **Proxy to** set to
the addon. If a panel route on the same listener matches every host, add
`shop.example.com` to its **Except hosts**.

## Locked out

If a change leaves the panel unreachable and was confirmed anyway, put the
addresses back from the server's command line with `nexora-panel ingress
reset`, which leaves one plain listener with the panel on every host. See
[[reference/cli#locked-out]].

## Related

- [[use/settings]]: the address as General settings show it.
- [[use/subscriptions]]: where subscription links point.
- [[use/certificates]]: certificates for the listeners.
- [[use/security]]: trusted proxies and login protection.
