---
title: "API tokens"
description: "Create API tokens for scripts, bots and addons: bound to an admin, narrowed by scopes, rate-limited, and shown only once."
order: 24
group: access
tags: [access, api]
---

# API tokens

An [[~api-token|API token]] lets a program use the panel's API: your billing
script, a bot, a monitoring job. Each token acts as one admin account and never
reaches further than that account. This page is under **Access → API tokens**
and is open to main admins.

<NxShot page="tokens" alt="The API tokens page: a list of tokens with the admin each acts as, its role, scopes, last use and expiry" />

## How a token is limited

A token is narrowed three ways, and each is checked again on every request:

1. **Acts as**: the admin it is bound to. The token sees what that admin sees.
   A token bound to a reseller sees only that reseller's users and spends its
   allowance. Deleting the admin deletes the token.
2. **Role**: the tier the token works on, never above its admin's. Demoting the
   admin demotes the token with it.
3. **Scopes**: the routes the token may reach inside that role, intersected
   with the permissions of its admin's role. Narrowing the admin's role narrows
   every token bound to it at once, with nothing to issue again.

A change to any of these takes effect on the token's next request.

## Creating a token

1. **Add**.
2. **Description**: what the token is for, so you recognise it later.
3. **Acts as**: the admin whose access the token gets.
4. **Role**: the tier, up to that admin's.
5. **Scopes**: leave **No restriction** for every route the role reaches
   (including scopes a later release adds), or untick it and choose.
6. **Addon id**: leave it empty for an ordinary integration. It is for a token
   that belongs to an addon you add by hand (see [[use/addons]]).
7. **Requests per minute**: `0` uses the panel default of 120.
8. **Validity (days)**: `0` means it never expires.
9. **Save**.

The panel then shows the token **once**. Copy it before you close the dialog:
only a hash is stored, so it cannot be shown again. A lost token is deleted and
replaced.

::: tip
If two-factor authentication is on for your account, creating or deleting a
token asks for your code again when your last one is more than ten minutes
old.
:::

Send the token on every request:

```bash
curl -H "Authorization: Bearer $NEXORA_TOKEN" \
  https://panel.example.com/your-base-path/api/v1/me
```

`/api/v1/me` answers which admin the token acts as and which scopes it holds.

## Scopes

A `:write` scope includes the matching `:read`. The panel's form shows the
names in the second column; the API and the API reference use the first.

| Scope | Shown as |
| --- | --- |
| `users:read` | See users |
| `users:write` | Create and edit users |
| `nodes:read` | See nodes |
| `nodes:write` | Configure nodes |
| `tunnels:read` | See tunnels |
| `tunnels:write` | Configure tunnels |
| `nodes:install` | Install nodes over SSH |
| `templates:read` | See templates |
| `templates:write` | Edit templates |
| `pool:read` | See inbounds, outbounds and rule sets |
| `pool:write` | Edit inbounds, outbounds and rule sets |
| `certificates:read` | See certificates |
| `certificates:write` | Issue and edit certificates |
| `settings:read` | See settings |
| `settings:write` | Change settings |
| `stats:read` | Traffic, reports and health |
| `tools:write` | Key generators |
| `admins:write` | Manage operators and roles |
| `tokens:write` | Manage API tokens |
| `license:write` | Manage the licence |
| `backup:read` | Download backups |
| `backup:write` | Take and delete backups |
| `backup:deliver` | Send files to the backup chat |
| `security:read` | See the ban list |
| `security:write` | Change the ban list |
| `webhooks:read` | See event subscribers |
| `webhooks:write` | Change event subscribers |
| `services:read` | See panel services |
| `services:write` | Configure and test panel services |

Grant the least a program needs. Three scopes are the panel's own
administration: `admins:write`, `tokens:write` and `license:write`. Leave them
off unless the program truly needs them; a token without them cannot create
accounts or mint further tokens, so a leaked one cannot make itself permanent.
`backup:read` reads out the whole database with every credential in it, and
`nodes:install` logs in to your servers as root, so both are worth the same
care.

A few routes are closed to every token whatever its scopes: changing the
caller's own password, its dashboard layout, restarting the panel, the panel
update, and restoring a backup. A few are open to every token: `/api/v1/me`,
the scope list and the event catalogue.

## Rate limit

Each token has a budget of requests per minute (120 unless you set another).
Every answer carries `X-RateLimit-Limit`, `X-RateLimit-Remaining` and
`X-RateLimit-Reset`. A request over the budget gets `429` with `Retry-After`;
wait that many seconds before the next one.

## The list

| Column | |
| --- | --- |
| **Description** | with an **Addon: name** tag when an addon holds the token |
| **Acts as** | the admin it is bound to |
| **Role** | its tier |
| **Scopes** | **No restriction**, or the number of scopes (point at it for the list) |
| **Last used** | when it was last used; point at it for the address it came from |
| **Expires** | its expiry date, or never |

A token is not edited after it is made: delete it and create another. A token
that an addon holds cannot be deleted here; it is changed or removed with the
addon on the [[use/addons]] page.

## The API

**API reference** at the top of this page opens the reference for this
install, with its own addresses filled in: every route, the scope it needs,
listing and paging, retries with `Idempotency-Key`, and the status codes. The
same material is on [[reference/api]].

Build against the `/api/v1` prefix. It is the stable public contract. The
unversioned `/api` prefix is the panel interface's own and may change with it.

## Related

- [[admins]] and [[roles]]: what the token's admin may do.
- [[webhooks]]: receive events instead of polling.
- [[reference/api]]: the API reference.
- [[audit]]: what a token changed.
