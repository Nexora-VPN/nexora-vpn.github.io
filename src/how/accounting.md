---
title: "Traffic, quotas and limits"
description: "How traffic is collected and recorded, how quotas, expiry and reset cycles are enforced, and where the address, speed and device limits act."
order: 7
tags: [users, monitoring]
---

# Traffic, quotas and limits

This page follows a user's traffic from the [[~node]] that carried it to the
numbers on the users page, and explains where each limit on an account
acts. Setting the limits is on [[use/users]] and [[use/plans]].

## Collecting traffic

Nodes count bytes per inbound, per outbound and per user, in memory. Every
30 seconds the panel collects every node's counters:

- **The node zeroes each counter as it reports it**, so every byte is reported
  exactly once.
- **The panel writes a whole collection in one database transaction.** If that
  write fails, the collection is held in memory and added to the next one, so
  nothing is lost to a busy database.
- **A node that is cut off from the panel** keeps counting until it stops
  serving. What it carried after the panel's last collection is lost if it
  stops before the panel reaches it again; see [[how/node-lifecycle]].

### Two records from one collection

Each collection is written to two places at once:

| Record | What it is for | Kept |
| --- | --- | --- |
| **The ledger**: per node, per user and per node and user, plus each account's totals | quotas, reseller allowances, the reports API (`/api/reports/*`) | for ever |
| **The graph series**: raw bytes in time buckets | the traffic graphs | for the stats retention, 30 days by default; 0 stops recording |

Reports read the ledger, so switching graphs off never changes what an account
is charged or what a report says. A node's graph and its lifetime total come
from the same samples, so they cannot disagree.

### The node multiplier

A node's **Traffic multiplier** scales what its users are charged. With a
multiplier of 2, a gigabyte through that node takes two gigabytes from the
user's quota and from their reseller's allowance. The node's own figures and
its periodic limit stay in raw bytes.

### Tunnels and endpoints

- Traffic through a [[~tunnel]] is charged on the relay, where users connect.
  On the origin it is not charged again.
- A WireGuard or OpenVPN endpoint counts what peers send and what it forwards
  under the endpoint's name, and the panel adds the two.

## Online

An account is online while it has traffic in the last 90 seconds. Each node's
online count is the number of accounts with traffic through that node in the
same window. With the graph series switched off, the per-node count is not
known and shows as a dash instead of a zero.

## Quotas and expiry

Every minute the panel judges every account against its traffic quota, its
expiry date and, for a reseller's customer, the reseller's allowance and
expiry.

- **An account past a limit is switched off** on every node it is on, live,
  without restarting anything, and the panel raises an event saying why.
- **An account back within its limits** (renewed, given more traffic, reset)
  is switched on again by the same check.
- **An account a person switched off stays off.** The minute check never
  switches on an account that you, or a bulk action, switched off by hand,
  even when it is within its limits.

### Durations that start at first use

A plan can be a length, such as 30 days, instead of a date. The account is
then waiting for its first connection, and its expiry is not enforced yet. On
the first minute after the node reports traffic for it, the expiry is set to
that moment plus the length. A subscription fetch does not start the clock: it
means an app read the links, not that anyone connected.

### Reset cycles

A cycle zeroes an account's traffic and starts again.

| Cycle | Resets |
| --- | --- |
| Rolling | every so many days after the last reset |
| Weekly, monthly, yearly | on a set weekday, day of the month or date, in the Gregorian or the Persian calendar |

Each step is counted from the anchor, not from the last reset, so an account
anchored on the 31st resets on the 28th in February and is back on the 31st
in March. A reset is applied on the minute check, like everything else.

### Warnings before the limit

The same minute pass raises a warning once while the account still works:

- **`user.quota_warning`** when usage crosses a share of the quota, 80% by
  default;
- **`user.expiring`** when the expiry enters a window before its date, 7 days
  and 1 day by default.

Each warning is said once per threshold and is remembered in the database, so
a panel restart repeats nothing. Selling more traffic or renewing re-arms it.
Telegram, email and addons can pass the warnings on to customers; see
[[how/events]].

## The address limit

The **Address limit** caps how many source addresses an account may connect
from at once, across the whole fleet.

1. **A node admits a new address on its own** while its view of the account is
   under the limit, without asking the panel per connection.
2. **Every 10 seconds** the panel merges the addresses all nodes saw, trims
   each limited account to its limit, keeping the most recently seen, and
   sends the result back.
3. **A connection from an address too many is refused** once the table has
   reached the node.

So the 10-second round is the window in which an account can briefly exceed
its limit across several nodes. An IPv4 address counts on its own and an IPv6
address by its /64. An address keeps counting for ten minutes after it was
last seen, so a phone switching networks does not lock itself out. Observed
addresses live only in memory; only the limits are stored. When the panel
shows an account's current addresses, it reads the same merged view, and
reading it never changes what the fleet enforces.

## The speed limit

The **Speed limit** caps each direction of an account's traffic in Mbps, and
it applies **on each node separately**: a limit of 20 Mbps lets the account
use 20 Mbps on every node it connects to at once. A rate budget inside one
machine's data path cannot be shared across machines. Changing a limit never
multiplies it, and a limit that is lifted and put back reaches connections
that are already open.

## The device limit

The **Device limit** is a limit on delivery, not on connections. A node sees
addresses, never devices. The panel sees a device only when the app fetching
the [[~subscription]] sends a device id, as several apps do.

- A device past the limit is refused the subscription and the page.
- A device that already holds the configuration keeps connecting until you
  free its place on the account.
- Apps that send no device id are served, unless **Device limit refuses
  clients without a device id** is on.

The address limit is the concurrency half of anti-sharing, and the device
limit the distribution half. They are meant to be used together.

## Nodes' own limits

A node can have a periodic traffic limit, weekly, monthly or yearly. When its
raw traffic in the period passes the limit, the panel switches the node off
until the next period, and switches it back on then, unless you had switched
it off yourself.

## Resellers' allowances

A [[~reseller]]'s allowance is computed, never stored: the traffic of all the
accounts it owns since its period began, scaled by each node's multiplier.

- Over its allowance, or past its expiry, every one of its accounts is switched
  off by the minute check, and they come back when the period rolls over or
  the reseller is renewed.
- An expired reseller cannot sign in to the panel, and its API tokens stop
  working until it is renewed.

See [[use/resellers]].

## Related pages

- [[how/packet-path]]: where in a connection the limits and counters sit.
- [[how/monitoring]]: live connections and the health history.
- [[use/user-operations]]: renewing, resetting and bulk changes.
