---
title: "How Nexora works"
description: "The architecture in one page: the panel as the control plane, nodes as the data plane, how they talk, and where addons and users fit."
order: 1
tags: [panel, node]
---

# How Nexora works

Nexora has two parts: one [[~panel]] that decides everything, and any number of
[[~node|nodes]] that carry your users' traffic. This section explains how they
work inside, for when you want to know why something behaves as it does. You
do not need it to run a service; the [[use/index|Use the panel]] section
covers that.

<NxDiagram id="overview" />

## The control plane: the panel

The panel is one program with a web interface. It holds four things:

- **The database, the single source of truth.** Every admin, user, plan,
  inbound, template, node, tunnel, certificate and setting lives there, on
  SQLite or PostgreSQL. Nodes keep no copy of their own; if the two disagree,
  the panel is right and the node is changed to match.
- **The scheduler.** The panel does its periodic work itself, on a fixed
  rhythm (below).
- **The API.** The web interface, your scripts and [[~addon|addons]] all use the
  same API, each with its own permissions.
- **The subscription service.** Users' apps fetch their configuration from
  their [[~subscription]] address. It can run on its own domains, apart from
  the address you administer the panel at.

### The panel's rhythm

| Every | The panel |
| --- | --- |
| 10 seconds | merges the addresses each node saw and pushes the per-user address table back where it changed |
| 15 seconds | checks every node (the heartbeat) and re-sends the configuration to a node that is not serving it |
| 30 seconds | collects traffic counters from every node |
| minute | enforces quotas, expiry dates, reset cycles and node limits; checks addons' health |
| 5 minutes | samples each node's disk, memory and load |
| 10 minutes | compares route, DNS and rule sets on every node with what it should run |
| hour | refreshes rule sets that are due, prunes old records, compacts health history, re-reads addon manifests |
| 6 hours | renews certificates that are due |

## The data plane: nodes

A node is a server that carries traffic. It is **stateless**:

- It has no database. Inbounds, outbounds, endpoints, routing, users and
  limits all arrive from the panel and are held in memory.
- On disk it keeps only its own TLS identity and a cache of files that can be
  fetched again, such as rule sets the panel pushed.
- After a restart it serves nothing until the panel sends its configuration
  again, which the next heartbeat does within seconds.
- It serves only while its panel reaches it. Cut off from the panel for about
  three minutes, it stops serving. See [[how/node-lifecycle]].

What a node serves is its [[~template]]: the inbounds, outbounds, endpoints,
rule sets and routing in it, plus the users who belong to that template.

## How they talk

The panel connects to each node over HTTPS on the node's control port (62050 by default), with
**mutual TLS**:

- The node accepts only the panel's client certificate, which it received
  when it was installed.
- The panel records the node's own certificate on the first connection and
  from then on accepts only that one. This is trust on first use: a different
  certificate at the same address is refused.

Once a node is installed, the panel always calls the node, never the other way round. Over that
link the panel sends configuration and changes, and reads back state,
counters, warnings and host figures. A change is sent as only that change,
without restarting the node; see [[how/config-sync]].

## Users touch only nodes and the subscription address

Your customers never reach the panel. Their app fetches its configuration from
the subscription address, then connects to the nodes' link addresses. The
panel's own address, its login page and its API need not be known to anyone
but you and your staff.

## Addons sit beside the panel

An addon, such as Nexora Shop or the notifier, is a separate program with its
own process, database and interface. It works with the panel over the network
only: an API token with the permissions you approved, and a webhook that
receives the events it asked for. The panel never runs an addon's code. See
[[how/addon-platform]] and [[how/events]].

## The pages in this section

| Page | What it explains |
| --- | --- |
| [[how/packet-path]] | one connection through a node, stage by stage |
| [[how/config-sync]] | how a change reaches nodes without restarts |
| [[how/node-lifecycle]] | trust, sessions, heartbeats, and what a node does without its panel |
| [[how/tunnels]] | relays, origins and the session pool inside a tunnel |
| [[how/subscriptions]] | how a user's links are built from templates, addresses and fronts |
| [[how/accounting]] | traffic counting, quotas, limits and resellers' allowances |
| [[how/events]] | the event bus and how deliveries are retried |
| [[how/addon-platform]] | registration, consent, grants and updates of addons |
| [[how/certificates]] | who issues certificates, and how they renew and reload |
| [[how/security]] | the security model, from mutual TLS to roles and audit |
| [[how/monitoring]] | health history, live connections and the metrics endpoint |
