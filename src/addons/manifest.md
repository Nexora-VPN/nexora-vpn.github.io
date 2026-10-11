---
title: "The addon manifest"
description: "Reference for nexora-addon.json: every field, the install section and its option types, requires.panel, and how manifests and releases are signed."
order: 11
group: authors
tags: [addons, api, reference]
---

# The addon manifest

The manifest, `nexora-addon.json`, is the contract between an [[~addon]] and
the panel, the [[directory|addon directory]] and the panel's install form. It
says who the addon is, what it asks for and how it is installed. This page
lists every field; [[build]] explains how to use them.

The addon kit's `manifest` package enforces this contract, and the panel
validates with the same code. Check a manifest before you publish it:

```bash
nexora-addon check nexora-addon.json
```

## Where it lives

- **At the root of the addon's public repository.** The directory and the
  install form read it there before anything runs. For a closed addon, that
  is its public distribution repository.
- **Served by the running addon** at `/.well-known/nexora-addon.json`, which
  registration reads.

## A complete example

```json
{
  "api": 1,
  "slug": "template",
  "name": "Addon template",
  "version": "0.1.0",
  "publisher": "Example Ltd",
  "license": "Apache-2.0",
  "description": { "en": "A minimal addon to start from." },
  "docs": "https://github.com/nexora-vpn/addon-template",
  "install": {
    "docker": { "image": "ghcr.io/nexora-vpn/addon-template", "compose": "deploy/compose.yml" },
    "binary": { "linux-amd64": "addon-template-linux-amd64.tar.gz" },
    "options": [
      { "key": "port", "type": "port", "default": 8090, "label": { "en": "Port" } }
    ]
  },
  "scopes": [
    { "scope": "users:read", "purpose": "to show how many accounts the panel has" }
  ],
  "events": ["user.created", "panel.addon_removed"],
  "webhook": "/nexora/events",
  "setup": "/nexora/setup",
  "health": "/health",
  "ui": "/",
  "rateLimit": 60,
  "signature": "…"
}
```

## Fields

| Field | Required | Meaning |
| --- | --- | --- |
| `api` | yes | The manifest version: `1` (this page) or `0` (the earlier version, which may not carry any field marked *v1* below). |
| `slug` | yes | The addon's id: `a-z`, `0-9`, `_` and `-`, starting with a letter or digit, at most 32 characters. |
| `name` | yes | At most 64 characters. |
| `version` | | The release, as semver. The directory compares it to show that an update is available. |
| `publisher` | | At most 64 characters. |
| `scopes` | one of `scopes` or `webhook` | `[{"scope": …, "purpose": …}]`: the API token's permissions, each with the reason shown on the approval screen. |
| `events`, `webhook` | together | The events the addon hears and the path they are posted to. See [Events and scopes](#events-and-scopes). |
| `setup` | yes | The path the credentials are delivered to, with the claim code. |
| `health` | | A path that answers `200` when the addon is healthy. Polled every minute. |
| `ui` | | The addon's entry point: a path, or an absolute `http(s)` URL. |
| `description` | v1 | By language (`en`, `fa`, `ru`, `zh`), English required when given, at most 500 characters each. |
| `license` | v1 | An SPDX id or `proprietary`, at most 64 characters. |
| `paid` | v1 | The addon is sold. Its licence is its own; the panel checks nothing. |
| `docs` | v1 | An absolute `http(s)` URL. |
| `requires.panel` | v1 | `">=X.Y.Z"`. A panel older than that refuses the addon and says why. |
| `install` | v1 | How the addon is installed ([below](#install)). An addon without one can only be registered by its address. |
| `rateLimit` | v1 | Requests a minute the token may make, 1 to 600. Absent means the panel's default, 120. Shown on the approval screen; a newer manifest asking for more waits for approval. |
| `signature` | | A base64 Ed25519 signature ([Signing](#signing)). |

### Paths

`setup`, `webhook` and `health` are three different clean paths, and none
of them is the manifest's own path. Each:

- starts with `/`;
- has no empty, `.` or `..` segment (a trailing `/` is fine);
- contains none of `?`, `#`, `%`, `{`, `}`, `\` or a space.

### Events and scopes {#events-and-scopes}

Each event is granted by the scope the panel's event catalog names for it
(`GET /api/events`; see [[reference/events]]). That scope, or its `:write`,
must be among `scopes`, or the panel refuses the manifest.
`panel.addon_removed` is the exception: an addon is told of its own removal
whatever it holds.

### A duplicated key

A manifest that names one key twice in any object is refused.

## `install` {#install}

```json
"install": {
  "docker": { "image": "ghcr.io/nexora-vpn/shop", "compose": "deploy/compose.yml" },
  "binary": { "linux-amd64": "shop-linux-amd64.tar.gz", "linux-arm64": "shop-linux-arm64.tar.gz" },
  "options": [ … ]
}
```

At least one of `docker` and `binary` is required.

| Field | Meaning |
| --- | --- |
| `docker.image` | A registry path **without a tag**: the release's version is the tag. |
| `docker.compose` | A relative path to the compose file, in the repository and the release. |
| `binary` | Maps a platform to a release asset's file name. The addon's install script puts it under systemd (`--method script`). |
| `options` | The questions the install asks ([below](#install-options)). |

Platforms for `binary`: `linux-amd64`, `linux-arm64`, `linux-armv7`,
`linux-armv6`, `linux-armv5`, `linux-386`, `linux-s390x`, `linux-riscv64`.

## `install.options` {#install-options}

The questions the install asks, at most 32, in the order shown:

```json
{ "key": "database", "type": "choice", "choices": ["sqlite", "postgres"], "default": "sqlite",
  "label": { "en": "Database" } },
{ "key": "database_dsn", "type": "secret", "required": true, "when": { "database": "postgres" },
  "label": { "en": "PostgreSQL DSN" } }
```

| Field | Meaning |
| --- | --- |
| `key` | `a-z`, `0-9` and `_`, starting with a letter, at most 32 characters; unique. |
| `type` | One of the types below. |
| `label` | By language, English required, at most 80 characters each. |
| `help` | By language, at most 300 characters each. |
| `default` | A JSON value of the option's type. Never on a `secret` or a `password`. |
| `required` | The install cannot go on without an answer. |
| `choices` | A `choice`'s values, 1 to 32, each at most 64 characters. |
| `when` | `{"<key>": "<value>"}`: shown only while that option, declared **before** this one and a `choice` or `bool`, has that value (`"true"` or `"false"` for a bool). |

### Option types

| Type | What it asks for |
| --- | --- |
| `string` | Free text. |
| `secret` | Text the panel never stores; a command that carries it is shown once. |
| `password` | A `secret` that becomes the addon's admin password: at least 10 characters and at most 72 bytes. The panel refuses one outside that in its form. |
| `number` | A number. |
| `port` | A port number. |
| `bool` | Yes or no. |
| `choice` | One of `choices`. |
| `url` | An address. |
| `path` | The base path the addon serves its admin under. At most one per manifest ([below](#the-path-type)). |

That is the whole list. A panel older than a type refuses a manifest that
uses it before it reads `requires.panel`. Set `requires.panel` all the same,
and say in your release notes which panel your addon needs.

### How answers reach the addon

Answers arrive as environment variables `NEXORA_OPT_<KEY>`, in an `.env`
beside the compose file or the systemd unit's `EnvironmentFile`. Beside
them come `NEXORA_PANEL_URL` and `NEXORA_CLAIM_CODE`, the code the panel
issued for this install. A `bool` is `true` or `false`, a number in its JSON
spelling.

### The `path` type {#the-path-type}

One segment of letters, digits, `-` and `_` (at most 64), with or without
slashes, or empty for the root. The panel's install form proposes a random
one when the option has no `default`, and joins the answer into the address
it registers the addon at, as it does the `port`. A script install draws one
when the command gives none.

The addon serves its admin, its API and the routes the panel calls (the
manifest, `setup`, the webhook, `health`) under it, and its customers' pages
outside it.

### A new install

A new claim code over the data of an earlier install (the addon removed
without its data, then installed again) is a **new install**: the addon
drops the earlier registration it kept, so the panel that issued the code
can register it, and applies the answers it otherwise uses only once, such
as its first admin's password. An update keeps the claim code.

## Signing {#signing}

### The manifest

- An **official** addon is signed by Nexora.
- A **verified** addon is signed with its developer's own key
  (`nexora-addon keygen`, `nexora-addon sign`), which the directory's signed
  index vouches for.
- An **unsigned** addon is registered by hand.

The signature covers every field but `signature`, re-encoded with keys
sorted, so the file may be indented or reordered freely.

### The release's checksums

A release publishes **`SHA256SUMS`**, covering every asset (`install.sh` and
the binaries among them) as `sha256sum` writes it, and **`SHA256SUMS.sig`**,
the signature over it made after the build with **the key that signs the
manifest**:

```bash
nexora-addon sign-sums -key addon.key SHA256SUMS > SHA256SUMS.sig
gh release upload v1.2.3 SHA256SUMS.sig
```

The signature is the base64 Ed25519 signature of `nexora-addon SHA256SUMS
v1\n` followed by the file's bytes, so it can never pass for a manifest's.

| Install | What is checked |
| --- | --- |
| Over SSH, or on the panel's own server | The release's `install.sh`, and for a script install its binary, must match a `SHA256SUMS` signed by the key that signed the release's manifest. |
| Script install where the host downloads the release | The install script is handed the binary's checksum as `--sha256` and checks it. |
| Docker | The image is pulled by its tag and is not covered. |
| A release without `SHA256SUMS.sig` | Installed by its command only. |

The manifest names no digest itself: an addon embeds its manifest in its
binary, so the binary's digest cannot be in it.
