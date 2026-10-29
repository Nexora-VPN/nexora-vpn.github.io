---
title: "Event catalogue"
description: "Every event the panel raises: its family, the scope needed to hear it, its payload fields, and the signed envelope it arrives in."
order: 4
tags: [reference, events]
---

# Event catalogue

Every [[~event]] the panel raises, with the scope a listener needs to hear it
and the fields it carries. Webhook subscribers, addons, Telegram chats and
email addresses all choose from this list. To set up a subscriber, see
[[webhooks]]; for how events are queued and delivered, see [[how/events]].

The same catalogue is served by the panel itself at `GET /api/v1/events`,
which every API token may read.

## The envelope

Each event reaches a webhook as a `POST` with a JSON body:

```json
{
  "v": 1,
  "id": 4182,
  "event": "user.quota_warning",
  "time": 1760180000,
  "data": {
    "userId": 57,
    "name": "alice",
    "adminId": 3,
    "usedPercent": 81,
    "threshold": 80,
    "used": 86973087744,
    "volume": 107374182400
  },
  "recipients": [3]
}
```

| Field | |
| --- | --- |
| `v` | the envelope version, `1` |
| `id` | the event's id: the same for every subscriber and on every retry |
| `event` | the event name |
| `time` | when it was raised, in Unix seconds |
| `data` | the payload: the fields listed for the event below |
| `recipients` | the admin ids the event is about, when it is about one; absent otherwise |

Times in payloads are Unix seconds, and traffic figures are bytes. A payload
never carries a password, key or subscription link; read those from the API
with a token if you need them.

## Headers and signature

| Header | |
| --- | --- |
| `Content-Type` | `application/json` |
| `User-Agent` | `nx-panel` |
| `X-Nx-Event` | the event name |
| `X-Nx-Delivery` | the delivery's id: the same on every retry and on **Send again** |
| `X-Nx-Signature` | `t=<unix seconds>,v1=<hex>`, present when the subscriber has a secret |

`v1` is the hex HMAC-SHA256 of the timestamp, a dot and the raw body, keyed
with the subscriber's signing secret:

```text
v1 = hex( HMAC-SHA256( secret, "<t>" + "." + <raw body bytes> ) )
```

A receiver should:

1. Read the raw body before parsing it; a re-serialised body does not match.
2. Recompute `v1` with its secret and compare in constant time.
3. Refuse a request whose `t` is more than five minutes from its own clock, so
   a captured delivery cannot be replayed later.
4. Answer `2xx` quickly. Anything else, or no answer within ten seconds, is a
   failure and is retried.

In Python:

```python
import hashlib, hmac, time

def verify(secret: bytes, header: str, body: bytes, max_skew: int = 300) -> bool:
    parts = dict(p.strip().split("=", 1) for p in header.split(",") if "=" in p)
    t, v1 = parts.get("t"), parts.get("v1")
    if not t or not v1 or abs(time.time() - int(t)) > max_skew:
        return False
    mac = hmac.new(secret, t.encode() + b"." + body, hashlib.sha256).hexdigest()
    return hmac.compare_digest(mac, v1)
```

To process each event once, keep the `id` values you have handled. A restore
from backup brings back the backup's ids, so a receiver that remembers ids
across a restore should start over when it receives `panel.restore_applied`.

## Who hears what

**Scope.** Each event names the scope a listener needs. An addon may ask for
an event only if its token holds that scope too, and the consent screen shows
both (a `:write` scope includes the matching `:read`). A Telegram chat or
email address hears an event only if its account's role holds the scope. A
webhook the main admin adds by hand hears every event its filter names.

**Families.** The part before the dot is the family, and it decides routing:

| Family | About | Names an account |
| --- | --- | --- |
| `user.*` | a customer account | yes: `adminId` is the reseller that owns it (0 for the panel) |
| `node.*` | a node | no |
| `admin.*` | an operator account | yes: `adminId` is that account |
| `panel.*` | the panel itself | no |

A subscriber set to **Only events about** one account, and every reseller's
chat or address, receives only the events that name that account. `node.*`
and `panel.*` events therefore never reach a reseller.

**Bulk work raises one event.** A bulk operation on the users page raises a
single `user.bulk`, and generating a batch of accounts a single
`user.generated`, however many accounts they touched.

## user.*

Every `user.*` event carries these three fields, plus the ones in its row:

| Field | Type | |
| --- | --- | --- |
| `userId` | integer | the account's id |
| `name` | string | the account's name |
| `adminId` | integer | the reseller that owns it; 0 for the panel |

| Event | Scope | Raised when | More fields |
| --- | --- | --- | --- |
| `user.created` | `users:read` | An account was created. | |
| `user.deleted` | `users:read` | An account was deleted. | |
| `user.enabled` | `users:read` | The panel switched an account back on, for example after a renewal or a usage reset. | |
| `user.disabled` | `users:read` | The panel switched an account off. `reason` is `volume`, `expiry`, `resale-volume` or `resale-expiry`. | `reason` |
| `user.quota_reached` | `users:read` | The traffic case of `user.disabled`: the account used what it paid for. | `reason` |
| `user.expired` | `users:read` | The date case of `user.disabled`: the account's time ran out. | `reason` |
| `user.quota_warning` | `users:read` | The account crossed the **Traffic used** threshold (default 80 %). Once per cap and threshold. | `usedPercent`, `threshold`, `used`, `volume` |
| `user.expiring` | `users:read` | The account entered one of the **Days before expiry** windows (default 7 and 1). Once per window. | `expiry`, `daysLeft`, `threshold` |
| `user.renewed` | `users:read` | The account was renewed. Carries its new date and traffic. | `expiry`, `volume` |
| `user.activated` | `users:read` | A plan that starts at the first connection started; the expiry is now fixed. | `expiry` |
| `user.first_fetch` | `users:read` | A client took the account's configurations for the first time. `client` names the app. | `client` |
| `user.device_limit_reached` | `users:read` | A device was refused the subscription because the account's device limit is full. At most once per device per hour. | `hwid`, `limit` |

Two `user.*` events carry their own fields instead of the three above:

| Event | Scope | Raised when | Fields |
| --- | --- | --- | --- |
| `user.bulk` | `users:read` | One bulk operation finished. `op` is the operation; `ids` are the accounts it reached; `adminId` is the reseller when one did it. | `op`, `matched`, `affected`, `blocked`, `failed`, `actor`, `adminId`, `ids` |
| `user.generated` | `users:read` | A batch of accounts was generated from a name pattern. | `pattern`, `count`, `skipped`, `planId`, `actor`, `adminId` |

The thresholds are set on the [[webhooks]] page.

## node.*

Most `node.*` events carry the node's id and name:

| Event | Scope | Raised when | Fields |
| --- | --- | --- | --- |
| `node.connected` | `nodes:read` | A node started answering the panel. `warnings` lists anything it is not running. | `nodeId`, `name`, `status`, `message`, `warnings` |
| `node.disconnected` | `nodes:read` | A node stopped answering. `message` is the error. | `nodeId`, `name`, `status`, `message`, `warnings` |
| `node.limit_reached` | `nodes:read` | A node reached its periodic traffic limit and was switched off. `period` is the cycle. | `nodeId`, `name`, `used`, `limit`, `period` |
| `node.disk_high` | `nodes:read` | The node's root filesystem crossed **Disk usage** (default 90 %). Once per crossing. | host fields |
| `node.disk_recovered` | `nodes:read` | It fell back under the threshold by at least five points. | host fields |
| `node.memory_high` | `nodes:read` | The node's memory crossed **Memory usage** (default 90 %). Once per crossing. | host fields |
| `node.memory_recovered` | `nodes:read` | It fell back under the threshold by at least five points. | host fields |
| `node.rejections_high` | `nodes:read` | The node refused more connections through one block outbound inside an hour than **Rejected connections per hour** (default 100). `outbound` is that outbound's tag; `window` is `1h`. Once per crossing. | `nodeId`, `name`, `outbound`, `count`, `threshold`, `window` |

The host fields are `nodeId`, `name`, `resource` (`disk` or `memory`),
`usedPercent`, `threshold`, `used` and `total` (bytes). Disk and memory are
read every five minutes.

## admin.*

| Event | Scope | Raised when | Fields |
| --- | --- | --- | --- |
| `admin.login` | `admins:write` | An operator logged in. | `adminId`, `username`, `ip` |
| `admin.login_failed` | `admins:write` | A login was refused. `username` is what was typed; `stage` is `mfa` for a wrong two-factor code. | `username`, `ip`, `stage` |
| `admin.login_new_ip` | `admins:write` | An operator logged in from an address other than its previous login's. | `adminId`, `username`, `ip`, `previousIp` |
| `admin.2fa_changed` | `admins:write` | An operator turned two-factor authentication on or off. | `adminId`, `username`, `enabled` |
| `admin.owner_changed` | `admins:write` | The panel was handed to another main admin. `previous` names the account that gave it up. | `adminId`, `username`, `previous` |
| `admin.resale_cap_reached` | `admins:write` | A reseller spent its allowance or its account expired; its users went offline with it. `reason` is `volume` or `expiry`. | `adminId`, `username`, `reason`, `used`, `volume` |

## panel.*

| Event | Scope | Raised when | Fields |
| --- | --- | --- | --- |
| `panel.started` | `stats:read` | The panel came up. `restored` says a restore was applied on the way. | `version`, `listen`, `restored` |
| `panel.stopping` | `stats:read` | The panel is shutting down cleanly, a restart included. A `panel.started` with no `panel.stopping` before it means the panel stopped unexpectedly. | `version` |
| `panel.crashed` | `stats:read` | An internal error was caught while answering a request; the panel is still running. At most once per route and message every five minutes. | `method`, `path`, `error`, `version` |
| `panel.setup_completed` | `settings:read` | The setup wizard finished and the main admin exists. | `username`, `restart` |
| `panel.settings_changed` | `settings:read` | A panel-wide setting (address, TLS, base path and the like) was changed. The value is never carried. | `setting`, `actor` |
| `panel.restore_applied` | `users:read` | A backup was restored over this panel. | `superseded`, `tables`, `rows` |
| `panel.backup_done` | `backup:read` | The scheduled backup wrote an archive. | `name`, `size` |
| `panel.backup_failed` | `backup:read` | The scheduled backup failed; it is tried again within the hour. | `error` |
| `panel.backup_upload_failed` | `backup:read` | An archive did not reach a backup destination. It is still on the panel's server. | `destination`, `name`, `error` |
| `panel.cert_renewed` | `certificates:read` | A certificate the panel manages was renewed. | certificate fields |
| `panel.cert_renew_failed` | `certificates:read` | A renewal failed; it is tried again every six hours. | certificate fields, `error` |
| `panel.cert_expiring` | `certificates:read` | A certificate you uploaded is close to its end; the panel cannot renew it. Once per certificate. | certificate fields |
| `panel.ruleset_refresh_failed` | `pool:read` | The hourly refresh of the rule sets failed. | `error` |
| `panel.update_available` | `stats:read` | A newer panel release exists. `version` is the new one, `current` the running one. Once per release. | `version`, `current`, `url` |
| `panel.license_changed` | `license:write` | The licence state changed: licensed, expired or free, or new limits. | `licensed`, `reason`, `previousReason`, `licenseId`, `issuedTo`, `expiresAt`, `limits` |
| `panel.license_expiring` | `license:write` | The licence ends in 30, 14, 7 or 1 days. Once per threshold. There is no grace period after the date. | `licenseId`, `issuedTo`, `expiresAt`, `daysLeft`, `threshold` |
| `panel.license_unverified` | `license:write` | The panel has not been able to confirm its licence for some days. `deadline` is when it falls back to the free tier if that goes on. | `licenseId`, `verifiedAt`, `deadline`, `daysLeft` |
| `panel.ip_banned` | `security:read` | The login protection banned an address. | `ip`, `until`, `reason` |
| `panel.addon_registered` | `tokens:write` | An addon was registered. | addon fields |
| `panel.addon_removed` | `tokens:write` | An addon was removed with its token and webhook. The addon itself is sent this first, whatever its filter. | addon fields |
| `panel.addon_unhealthy` | `tokens:write` | An addon's health path failed twice in a row. Once per crossing. | addon fields, `error` |
| `panel.addon_recovered` | `tokens:write` | An unhealthy addon answered its health path again. | addon fields |
| `panel.addon_update_waiting` | `tokens:write` | A newer version of a signed addon asks for more than it holds and waits for approval. | addon fields, `version` |
| `panel.ping` | any | The test event **Send test event** sends to one subscriber. | `subscriberId`, `name`, `by` |

The certificate fields are `kind` (`node` or `panel`), `certificateId`,
`nodeId`, `name` and `notAfter`. The addon fields are `addonId`, `slug`,
`name` and `signed`.

For what the licence events mean for your panel, see [[licence]]; for addons,
see [[use/addons]].

## Related

- [[webhooks]]: subscribers, retries and the thresholds.
- [[how/events]]: how the bus queues and delivers.
- [[telegram]] and [[email]]: events for people.
- [[reference/api]]: the API a listener reads more from.
