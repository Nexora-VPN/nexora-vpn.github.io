---
title: "API reference"
description: "Every route of the panel's REST API: what it takes, what it answers, and who may call it."
order: 5
tags: [reference, api]
outline: [2, 2]
---

<script setup>
// Loaded on this page only: the reference is large.
import NxApi from '../../.vitepress/theme/NxApi.vue'
</script>

# API reference

Everything the panel's web interface does goes through this API, and so can
your own programs: a billing system, a bot, a monitoring script or an
[[addons/index|addon]]. This page lists every route, built from the same
document the panel serves at `/api/openapi.json`. You can also
[download it as YAML](/openapi.yaml) for code generators and API clients.

## Before you call it

- **Base address.** The panel's own address, with its base path if it has one:
  `https://panel.example.com:28431/secret-path/api/v1/users`.
- **Use `/api/v1`.** Every route is served twice, under `/api/…` and
  `/api/v1/…`. The `/api/v1` prefix is the stable contract for integrations;
  the unversioned one belongs to the panel's own interface and may change.
- **Authenticate with a token.** Create an [[~api-token]] on the
  [[use/tokens|API tokens]] page and send it as `Authorization: Bearer <token>`.
  A token acts as the admin it belongs to, never with more rights, and only
  on the routes its scopes allow.
- **Lists are paged.** Under `/api/v1` a list answers
  `{items, total, limit, offset}` and takes `limit`, `offset`, `q` and
  `updated_since`.
- **Retries are safe.** Send an `Idempotency-Key` header with a create, and a
  retry after a timeout returns the first answer instead of creating twice.
- **Events instead of polling.** To learn when something changes, subscribe to
  [[reference/events|events]] with a [[use/webhooks|webhook]].

```bash
curl -s https://panel.example.com:28431/api/v1/users?limit=5 \
  -H "Authorization: Bearer $TOKEN"
```

## Routes

<NxApi />
