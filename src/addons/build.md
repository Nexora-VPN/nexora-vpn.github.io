---
title: "Build an addon"
description: "Write your own addon with the addon kit and the template: registration by claim code, signed events, the panel API, health, install options, certificates and getting listed."
order: 10
group: authors
tags: [addons, api]
---

# Build an addon

This page is for developers who want to write an [[~addon]] for NX: a
separate program that works with the panel over the network, with a scoped
[[~api-token]], the panel's signed [[~event|events]] and a manifest that says
what it needs. It walks through the parts an addon has and the tools that
write most of them for you. The manifest's fields are in [[manifest]].

## What you build

An addon is its own program: its own service or container, its own
interface, its own database. The panel never runs its code and stores none
of its data. An addon has four parts the panel touches:

| Part | What it does |
| --- | --- |
| The manifest | `nx-addon.json`: who the addon is, what it asks for, how it is installed. Served by the running addon at `/.well-known/nx-addon.json`. |
| A setup path | Where the panel delivers the token and webhook secret at registration, with the claim code. |
| A webhook path | Where the panel posts the events the addon asked for, each one signed. |
| A health path | Answers `200` while the addon is healthy. The panel asks every minute. |

Everything else (your pages, your API, your database) is yours to design.
How the panel treats an addon is described in [[how/addon-platform]].

## The kit and the template

Two public repositories write most of this for you.

- **The addon kit**, the Go module
  [`github.com/nx-panel/addon-kit`](https://github.com/nx-panel/addon-kit),
  licensed Apache-2.0, so an addon built on it may be open or closed. The
  panel validates manifests with the same code.
- **The template**,
  [`github.com/nx-panel/addon-template`](https://github.com/nx-panel/addon-template):
  a complete minimal addon with a compose file, a binary release and an
  install script. It registers by claim code, receives events, answers the
  health check and shows a page with the panel's account count.

| Kit package | What it does |
| --- | --- |
| `manifest` | Reads, validates and signs the manifest. |
| `addon` | The running half: serves the manifest, takes the credentials at registration, verifies event deliveries, answers the health check, reads the install's answers. |
| `panel` | A small client for the panel's API with the addon's token, idempotency keys and a wait on `429`. |
| `auth` | The addon's own admin sign-in: hashed passwords, sessions, a TOTP second factor, a limit on failed attempts. |
| `telegram` | A small Telegram Bot API client, through a proxy or a Bot API mirror; also Bale. |
| `web` | Serves the admin under the install's base path and public pages outside it, with HTTPS from the panel, ACME or a self-signed certificate. |
| `cmd/nx-addon` | `check`, `keygen`, `sign` and `verify` a manifest; `sign-sums` and `verify-sums` a release's checksums. |

The smallest addon:

```go
raw, _ := os.ReadFile("nx-addon.json")
a, err := addon.New(addon.Config{Manifest: raw, DataDir: "data"}.FromEnv())
if err != nil { log.Fatal(err) }
a.OnEvent(func(e addon.Event) { log.Printf("%s %s", e.Event, e.Data) })
mux := http.NewServeMux()
a.Mount(mux) // the manifest, setup, webhook and health paths
log.Fatal(http.ListenAndServe(":8090", mux))
```

## Make the template yours

1. Change `slug`, `name`, `publisher`, the scopes and the events in
   `nx-addon.json`, and `SLUG`, `REPO` and `BIN` at the top of
   `install.sh`.
2. Declare the questions your install needs under `install.options`
   ([[manifest#install-options]]).
3. Keep your own data in your own database, and read the panel with the
   token.
4. Tag a release. The template's release workflow builds the binaries, the
   checksums, the release and the image. Then sign the checksums (below).

## Registration with a claim code

An addon starts unregistered. The install passes it a one-time **claim code**
in `NX_CLAIM_CODE`; started by hand without one, the kit draws a code and
logs it.

1. The panel reads the manifest at the addon's address and checks its
   signature.
2. It shows the operator what the addon asks for: each scope with its
   purpose, the request rate, and each event.
3. On approval, the panel creates exactly that token and webhook and posts
   them to the addon's `setup` path with the claim code. The addon accepts
   them only with its own code, so a wrong code leaves nothing behind.

The kit keeps the credentials in its data directory and calls the function
you set with `OnSetup` once they arrive. `Credentials()` returns them, or
nil before registration; `ClaimCode()` returns the code still waiting.

A panel registers by claim code only a manifest signed by a key it trusts:
NX's, or a developer key the directory vouches for. While you develop,
register your addon by hand instead (**Addons → Add your own addon**): you
pick the token's permissions and the webhook's events, and the panel shows
the token and the webhook's signing secret once for your program's
settings.

### Removal and a new install

When the operator removes the addon, the panel first sends it
`panel.addon_removed`, whatever events it asked for, then deletes its token
and webhook. Call `Forget()` then, so it can be registered again.

A new claim code over the data of an earlier install (removed with its data
kept, then installed again) is a **new install**. The kit drops the old
registration, and `NewInstall()` tells your addon to apply the answers it
otherwise uses only once, such as the first admin's password. Call
`NewInstallApplied()` once they are stored. An update keeps the claim code
and is never a new install.

## Receiving events

The panel posts each event the addon asked for to its `webhook` path. A
delivery carries `X-Nx-Signature: t=<unix>,v1=<hex>`, the hex being the
HMAC-SHA256 of `<t>.<body>` under the webhook secret, and an
`X-Nx-Delivery` id that stays the same on every retry.

The kit checks the signature and refuses a delivery more than five minutes
off, hands each verified event to your handler once per delivery id, and
answers the panel:

- `OnEvent` for a handler that cannot fail.
- `OnEventErr` for one that can: an error, or a panic, answers `500`, and the
  panel delivers the event again.

The seen-delivery set lives in memory, so a retry across a restart is handed
on again. Keep your handler's effects idempotent. The event names and their
payloads are in [[reference/events]]; how the panel delivers them is in
[[how/events]].

Each event is granted by a scope: the scope the panel's event catalog
(`GET /api/events`) names for it, or that scope's `:write`, must be among
your manifest's `scopes`, or the panel refuses the manifest.

## Calling the panel

The token acts with exactly the scopes you were granted, at the request rate
your manifest asked for (120 a minute unless it says otherwise). The kit's
`panel` client speaks JSON to the panel's API, sends an `Idempotency-Key`
when you give one, and waits once on `429`:

```go
c := a.Credentials()
client := &panel.Client{Base: c.Panel.URL, Token: c.Token}
var list struct{ Total int `json:"total"` }
err := client.Get(ctx, "/users?limit=1", &list)
```

`Me()` is a cheap check that the credentials still work. The routes and
their bodies are the panel's API description ([[reference/api]]). The
panel keeps nothing of yours: store your own data, and data you keep beside
users, in your own database.

## Health

Give the manifest a `health` path that answers `200` while the addon can do
its work. The kit answers it for you. The panel asks every minute; two
failures in a row mark the addon **Unhealthy** and raise
`panel.addon_unhealthy`, and the next `200` raises `panel.addon_recovered`.
An addon without a health path is never asked.

## Install options

Each question in `install.options` becomes a field in the panel's install
form and a flag of your install script. Answers reach the addon as
environment variables `NX_OPT_<KEY>`, beside `NX_PANEL_URL` and
`NX_CLAIM_CODE`; read one with `addon.Option("key")`. The option types
and their rules are in [[manifest#install-options]].

Two types change how the panel installs you:

- **`password`** becomes your admin's password. The panel holds it to 10
  characters and 72 bytes in its form, the rule the kit's `auth` package
  holds, so a password your addon would refuse never reaches it.
- **`path`** is the base path your admin is served under. The panel proposes
  a random one and joins the answer into the address it registers you at.
  Serve your admin, your API and the routes the panel calls (the manifest,
  `setup`, the webhook, `health`) under it, and your customers' pages outside
  it (`web.Mount`).

## HTTPS and certificates from the panel

The kit's `web` package serves your public address over HTTPS on the
install's one port, from one of:

- **A certificate from the panel**: one the operator chose from the panel's
  store. The addon fetches it from the panel every few minutes (by its claim
  code before registration, by its token after) and keeps a copy, so it
  starts with HTTPS even while the panel is down. It needs no port 443 of
  its own, so several addons share a server with the panel.
- **ACME** by TLS-ALPN-01 on port 443, or by HTTP-01 on any port with the
  authority asking on port 80.
- **A self-signed certificate** for an address by IP. The operator approves
  its fingerprint on the panel's approval screen.

It also checks that the public address reaches this very program. How the
operator chooses among these is in [[directory#https-for-the-addon]].

## Releases and signing

A release publishes the binaries named in the manifest's `install.binary`,
the image in `install.docker`, a `SHA256SUMS` of every asset, and
`SHA256SUMS.sig`, signed with the key that signs the manifest:

```bash
go install github.com/nx-panel/addon-kit/cmd/nx-addon@latest
nx-addon check nx-addon.json                    # would a panel accept it?
nx-addon keygen -out addon.key                      # once: your signing key
nx-addon sign -key addon.key nx-addon.json > signed.json
nx-addon sign-sums -key addon.key SHA256SUMS > SHA256SUMS.sig
gh release upload v1.2.3 SHA256SUMS.sig
```

`keygen` prints your public key and never writes over an existing key file.
Keep the private key out of the repository. The signature covers every
field of the manifest, so sign again after any change, including the
version of each release.

The panel installs, updates or removes an addon over SSH only when the
release's `install.sh`, and for a script install its binary, match a
`SHA256SUMS` signed by the key that signed the release's manifest. A release
without `SHA256SUMS.sig` can still be installed by its command. The details
are in [[manifest#signing]].

## Getting listed

Addons are listed at
[addons.nx-panel.org](https://addons.nx-panel.org) as official,
verified or unofficial ([[directory#what-the-directory-lists]]). To be
listed, sign the manifest with your own key (`nx-addon keygen`, `sign`)
and open a pull request on the directory. Keep `nx-addon.json` at the
root of your public repository (for a closed addon, its public distribution
repository): the directory and the install wizard read it there.
