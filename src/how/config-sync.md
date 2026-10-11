---
title: "Changes without restarts"
description: "How the panel sends a node only what changed, which changes go live, when an item is rebuilt, and why a restart is the last resort."
order: 3
tags: [node, panel]
---

# Changes without restarts

When you edit an [[~inbound]], add a [[~user]] or change [[~routing]], the
[[~panel]] does not send each affected [[~node]] a fresh configuration and
restart it. It works out what that node should run, compares it with what the
node is running, and sends only the difference. This page explains how, and
what each kind of change costs the users connected at that moment.

## The rule

Every change reaches a node as only that change:

1. **Live**, when the node can apply it to what is running. Nothing is
   dropped.
2. **Rebuild one item**, when it cannot go live. Only that inbound, outbound
   or endpoint is replaced.
3. **Restart the node's core**, only when nothing else can apply the change.

And a change never leaves a node worse than it was: a part that fails is
reported, and the rest still applies.

## Hashes: knowing what a node runs

The node reports an inventory of what it runs, with a hash for each item:

- **one hash per outbound, endpoint and tunnel half**, taken over the exact
  bytes the panel sent;
- **two hashes per inbound**: one for the inbound itself and one for its set of
  users, so a change to users is told apart from a change to the inbound;
- **one hash for the base**: routing, DNS, the log level, time sync and the
  node's trusted certificates, taken together.

The panel builds what the node should run and hashes it the same way. Where a
hash differs, that item changed. Where it matches, the item is left alone. An
empty answer is never read as "the same": a node that cannot tell is treated
as different.

## What goes live

| Change | How it reaches the node |
| --- | --- |
| Users of an inbound: added, removed, enabled, disabled, renewed, a new credential | The inbound's whole user set is replaced in place. Open connections of other users are untouched. A set equal to the one the inbound holds changes nothing. |
| A tunnel's membership: an origin added or removed, a credential rotated | The running half is told its new peers. Links that are up stay up; a removed origin's links are dropped. |
| Routing rules, rule sets, the final outbound, DNS, the log level, time sync, trusted certificates | Applied together as one base update. If a step is refused midway, the steps already taken are undone. |
| A new inbound, outbound or endpoint | Added beside what is running. |
| An item removed | Removed. A node refuses to remove what the running configuration still needs, such as the final outbound; the panel adds the replacement first and then retries the removal. |

When a user is added, enabled, disabled or deleted, the panel sends each node
the user touches the user set of each inbound there. A user's change never
reaches nodes outside their [[~template|templates]].

## What is rebuilt

Some changes cannot be applied to a running item, and then that one item is
built again:

- **A changed inbound**: its port, TLS, certificate, transport or protocol
  options.
- **Users of a few protocols** whose user list cannot be changed in place:
  SOCKS, HTTP, mixed, Naive, Mieru, ShadowTLS and WireGuard rebuild the one
  item on a user change.
- **A tunnel's shape**: its ports, TLS, transport or balancing.

A rebuild costs less than it sounds:

- A rebuilt TCP inbound keeps its open connections.
- A rebuilt QUIC inbound (Hysteria2, TUIC) tells its clients, so they reconnect
  at once instead of waiting for a timeout.
- WireGuard clients are back in about 20 seconds.

## When the node restarts

Only when the base cannot be applied live, the node answers that a restart is
required and applies nothing. The panel then sends the full configuration and
the node's core restarts. Every other change avoids it.

A full configuration is also what a node gets when it has nothing running: a
node that has just started, or one that was switched on again.

## A bad item does not stop a node

Before the node changes anything, it parses and builds the new configuration.
The running configuration stops only once the new one is ready.

- **An item that fails to build is skipped** with a warning. Everything else
  runs. The warning appears on the node in the panel until a later change
  applies the item.
- **A start that fails rolls back** to the configuration that was running, and
  the node keeps serving it.
- **A live change that fails** on one item is reported on the node's warnings.
  The other items of the same change still apply.

The panel checks at save time what the node would refuse at load time, so most
mistakes are caught in the form, before anything reaches a node.

## Self-healing

A change can fail on the way: a node was briefly unreachable, a step was
refused, or two changes crossed. The panel does not trust a change to have
landed:

1. **Every single change falls back to a full comparison.** If adding one user
   fails, the panel compares the whole node with what it should run and
   sends every difference.
2. **A full comparison falls back to a full push**, when the node has nothing
   running or cannot take the base live.
3. **The heartbeat**, every 15 seconds, re-sends the configuration to a node
   that is not serving what it was given. It backs off from 30 seconds up to
   10 minutes while the node keeps refusing.
4. **A drift sweep** compares every node's base (routing, DNS and rule sets)
   with what it should be, every 10 minutes, and corrects any difference.

**Sync** on a node's menu runs the same comparison by hand.

## Rule sets on the node

The panel downloads every [[~rule-set]], keeps it current and pushes it to each
node that needs it over the control link. Nodes fetch nothing from the
internet themselves.

A new version of a list arrives as a new file under a new name, and the node
switches to it as part of a base update. A file the node is reading never
changes under it. Old copies are removed once nothing names them. A list the
node does not have is left out together with the rules that name it, rather
than failing the node.

## What is never sent

- **Items that would serve anyone, or no one.** An inbound with no users is
  left out where an empty user list would make an open proxy (SOCKS, HTTP,
  mixed) or a server on one shared key (Shadowsocks, Snell), and the same holds
  for an OpenVPN or OpenConnect server with no users. It is sent once it has
  a user.
- **A user without the credential its protocol needs.** That user is left out
  of that inbound with a warning on the node, and every other user is served.

## Related pages

- [[how/node-lifecycle]]: sessions, heartbeats and what a node does without
  its panel.
- [[how/tunnels]]: how a tunnel's membership changes live.
- [[use/nodes]]: the node list, its warnings and the **Sync** action.
