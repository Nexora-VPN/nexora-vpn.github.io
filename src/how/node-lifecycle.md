---
title: "A node and its panel"
description: "How a node is trusted, kept in step and switched off; what it does when it loses its panel; and what errors and warnings on a node mean."
order: 4
tags: [node, security]
---

# A node and its panel

A [[~node]] has no will of its own. It serves what its [[~panel]] sends, for as
long as the panel keeps reaching it. This page follows a node through its
life: installed and trusted, kept in step, switched off, cut off, refusing a
configuration, and moved to another server.

## Installed and trusted

Installing a node creates two certificates and one pin:

1. **The panel's client certificate** goes to the node, either fetched once
   with a single-use install token or uploaded over SSH by the panel's
   automatic install. From then on the node accepts only that certificate on
   its control port.
2. **The node's own server certificate** is generated on the node. It never
   leaves it.
3. **The pin.** On its first connection the panel records the node's
   certificate fingerprint, and from then on accepts only that certificate at
   that address. This is trust on first use.

Each side proves who it is on every connection, so nothing else on the
internet gets past the TLS handshake on the control port. Updating a node in
place keeps its certificate, so the pin still matches. Installing it afresh
makes a new certificate, which the panel refuses until the node is deleted and
added again, or moved (below). The steps are on [[start/add-node]].

## Sessions

The panel opens a session on the node and carries its id on every request.
Sessions are kept in memory on the node, so a restarted node has forgotten
them. The panel notices, opens a new session and repeats the request once;
nothing for you to do.

A node's control API answers one panel at a time. A tool that opens its own
session on the node takes it from the panel, which reconnects on its next
request.

## The heartbeat

Every 15 seconds the panel asks every node how it is, each on its own, so one
unreachable node never delays the others. The answer carries:

- whether the core is running and started what it was given;
- the number of open connections, in total and per inbound;
- how many times the core restarted, and its last start error;
- the items it skipped, as warnings;
- the tally of connections refused by block outbounds.

When a node answers that it is running nothing, the heartbeat sends its whole
configuration again. That is how a node that restarted, or lost its panel for
a while, is back in service within seconds.

## Switched off

You can switch a node off on the **Nodes** page, and its periodic traffic limit
can switch it off by itself. Either way the panel:

1. collects its counters one last time;
2. sends it an empty configuration at once, so it stops serving;
3. drops its session and stops contacting it.

A switched-off node is not synced, not heartbeaten and not marked connected,
whatever else changes in the panel, until it is switched on again. Then it
gets its full configuration. A panel that starts up empties every node that is
switched off, once.

## Cut off from its panel

A node serves only while its panel reaches it. When the panel is down, or the
network between them is cut:

- **For about three minutes** the node goes on serving. A panel restart or
  upgrade, or a short network fault, costs nobody a connection.
- **After three minutes** without hearing from the panel, the node stops its
  core and serves nothing.
- **When the panel reaches it again**, the first heartbeat finds it empty and
  sends its whole configuration.

The grace is measured on the node's monotonic clock, so a change of its wall
clock changes nothing. Traffic the node carried after the panel's last
collection, while it was cut off, is lost: the node keeps no counters across
a stop.

Deleting a node in the panel stops it at once if the panel can reach it. If it
cannot, the node stops by itself three minutes after it last heard from the
panel.

## A configuration the core refuses

A node checks a configuration before it lets go of the running one:

- **An item that fails to build** (an inbound whose port is taken, a bad
  certificate) is skipped, and the node serves everything else. The skipped
  item is a **warning**.
- **A whole configuration the core cannot start** is rolled back: the node goes
  on serving what it ran before and reports that it did not start the new one.

The panel does not count a node that rolled back as healthy. It shows the node
in error with the reason, and the heartbeat keeps sending the configuration,
waiting 30 seconds at first and up to 10 minutes between tries, until it starts
or you fix what it refuses.

## Errors and warnings

A node in the panel can carry two different kinds of message:

| | Error | Warnings |
| --- | --- | --- |
| Means | the node is not working: unreachable, refusing its configuration, or not running | the node works, but some items are missing from what it runs |
| Examples | connection refused, a certificate pin mismatch, a configuration that did not start | an inbound skipped at start, a change one item could not take, users left out for lacking a credential |
| Clears | on the next good heartbeat | when a later sync applies the items |

Warnings are kept in the panel's memory. After a panel restart they come back
with the next sync that finds them.

## Moving a node to another server

Three things are tied to the machine a node runs on: its certificate pin, the
SSH host key the panel recorded, and what the panel knows about how the node
was installed. Editing only the address would carry all three to a new
machine, where the pin refuses every connection.

**Move to another server** on the node's menu clears all three. You then
install on the new server as if it were new, and the first connection pins
the new certificate. Users, inbounds and everything else about the node stay
as they are, since they live in the panel.

## Related pages

- [[how/config-sync]]: how a change reaches a running node.
- [[how/security]]: mutual TLS and pinning in the wider security model.
- [[use/nodes]]: the node list, its status and its menu.
- [[reference/troubleshooting]]: a node that shows offline.
