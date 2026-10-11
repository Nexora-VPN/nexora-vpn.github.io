---
title: "The event bus"
description: "How the panel turns a change into deliveries: the outbox, one delivery per subscriber, signed envelopes, retries, and the people-facing channels."
order: 8
tags: [events, api]
---

# The event bus

When something worth knowing happens, the [[~panel]] raises an [[~event]] and
delivers it to every subscriber that asked for it: webhooks, [[~addon|addons]],
Telegram chats and email addresses. This page explains how a delivery is made
and what a receiver can rely on. The list of events and their payloads is on
[[reference/events]]; setting up a webhook is on [[use/webhooks]].

<NxDiagram id="events" />

## Events report changes

An event says that something changed: an account reached its quota, a node
stopped answering, an admin signed in from a new address, a backup finished.
A state that lasts is reported once, when it starts, and once more when it
ends where that makes sense (a node's disk filling, then recovering). A node
that is simply switched off does not raise an event every heartbeat.

Warnings that must survive a restart, such as an account's expiry warning or
an addon's health, are remembered in the database, so a panel restart repeats
none of them. A few states judged on a timer, such as a reseller over its
allowance, are remembered in memory, and a restart may repeat each one once.

## Four families

The first word of an event's name says what it is about, and that decides who
may hear it:

| Family | About | Examples |
| --- | --- | --- |
| `user.*` | one account; always names the admin who owns it | `user.quota_reached`, `user.expiring`, `user.first_fetch` |
| `node.*` | a node | `node.disconnected`, `node.disk_high`, `node.rejections_high` |
| `admin.*` | an operator account | `admin.login_new_ip`, `admin.resale_cap_reached` |
| `panel.*` | the install itself; never names an account | `panel.backup_failed`, `panel.cert_expiring`, `panel.addon_unhealthy` |

Because every `user.*` event names its owner, a notification can go to the
[[~reseller]] whose customer it is. A `panel.*` event never reaches a subscriber
bound to a reseller.

## The outbox

Raising an event is one database transaction:

1. The event is written once to the outbox.
2. For every enabled subscriber whose event filter wants it, and whose owner
   may see it, one delivery row is written beside it.

When no subscriber wants an event, nothing is written at all, so an install
with no subscribers keeps an empty table. Because the event and its
deliveries are written together, an event is never half-delivered: either
every subscriber has its delivery waiting, or none does.

Events and deliveries are kept for the event retention, 7 days by default and
at most 90, and they are part of every backup.

## Delivery and retries

A background worker in the panel sends due deliveries:

- **In order per subscriber.** Each subscriber's deliveries go one after
  another, so a receiver sees events in the order they happened. Different
  subscribers do not wait for each other.
- **A failure is retried** after a delay that doubles each time, starting at
  30 seconds and capped at one hour, with a little randomness so retries do
  not arrive in step.
- **After 10 tries the delivery is dead.** It stays listed with its last
  answer, and **Send again** retries it by hand.
- **A subscriber is switched off** only when its failures are both a long
  streak and more than a day old. A receiver that was down for an hour, with a
  backlog retrying against it, is not switched off. Switching it on again
  starts the count afresh.
- **Redirects are not followed.**

**Send test event** sends `panel.ping` at once and shows the receiver's
answer.

## The envelope

A webhook receives a POST with a JSON body:

```json
{
  "v": 1,
  "id": 1842,
  "event": "user.quota_reached",
  "time": 1791711000,
  "data": { "userId": 57, "name": "ali", "adminId": 3 },
  "recipients": [3]
}
```

`id` is the event's own id, the same for every subscriber and every retry.
`time` is in Unix seconds. `recipients`, when present, lists the admins the
event is about.

It comes with three headers:

| Header | Carries |
| --- | --- |
| `X-Nexora-Event` | the event's name |
| `X-Nexora-Delivery` | the delivery id; a retry repeats it, so a receiver drops repeats by this id |
| `X-Nexora-Signature` | a timestamp and an HMAC-SHA256 of the timestamp and the body, made with the subscriber's secret |

A receiver checks the signature with the secret it was shown once, when the
subscriber was made. A restore from a backup brings back the deliveries table
too, so delivery ids can repeat after one: a receiver that keeps ids across a
restore should start afresh on `panel.restore_applied`.

## Thin payloads

A payload carries ids, names and what changed, never a credential: no
password, key, subscription token or link. A receiver that needs more reads it
from the API with its own token, under its own permissions.

- Bulk actions and batch creation raise one summary event, not one per
  account.
- `panel.settings_changed` names the setting, never its value.

## Who may subscribe where

- **A webhook you add by hand** may not point at the panel's own network:
  loopback, private and similar addresses are refused when the panel
  connects, whatever the name resolves to.
- **An addon's webhook belongs to its API token.** It hears only the events
  you approved from its manifest, may reach an addon running beside the panel
  on a private network, and is silent while the addon is suspended.

## People-facing channels

Telegram chats and email addresses are people, not programs. The bus hands
each delivery to the Telegram or email sender instead of a POST, with the
same retries, and filters it first:

- **A chat or address hears only what its account's role may read.** A
  reseller's chat hears about its own customers and nothing else.
- **A switched-off service delivers nothing.**
- **An email address must be confirmed** before anything is sent to it.

See [[use/telegram]] and [[use/email]].

## The bus as a health signal

A delivery that never lands tells its receiver nothing. The panel therefore
exports the count of pending, delivered and dead deliveries on its metrics
endpoint, always, so an alert on dead deliveries can fire; see
[[how/monitoring]].
