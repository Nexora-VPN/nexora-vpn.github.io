---
title: "Inside a tunnel"
description: "What happens inside a tunnel: relay and origins, derived credentials, profiles pooled into one session pool, how users stick to an origin, and how health is judged."
order: 5
tags: [tunnels, node]
---

# Inside a tunnel

A [[~tunnel]] carries traffic from one [[~node]], the relay, to others, the
origins, which send it to the internet. This page explains the parts you do
not see in the form: how the two ends trust each other, how several ways of
carrying one tunnel become one pool, and how a user keeps the same exit
address. Setting one up is on [[use/tunnels]].

<NxDiagram id="tunnel" />

## Two halves

A tunnel is two halves on two kinds of node, and each is configured on its own:

- **The relay half** is an [[~outbound]] on the relay. Whatever the relay's
  [[~routing]] sends to it goes into the tunnel. When the relay carries exactly
  one tunnel, the panel makes it the relay's final outbound by itself, so all
  traffic the template's rules do not handle goes down the tunnel.
- **The origin half** is a way in on each origin. It accepts the streams the
  relay opens and hands them to the origin's own routing, which sends them on
  like any other traffic arriving there.

Which side listens and which side dials is a separate choice, the mode. In
**reverse** mode (the default) the relay listens and each origin dials out to
it, so an origin needs no open port and can sit behind NAT. In **direct** mode
the relay dials each origin. Either way traffic flows the same direction:
users, relay, origin, internet.

Neither half touches the node's users, inbounds or route rules. A tunnel has
its own port and its own credentials; no account is created for it and no
inbound is used.

<NxTunnel scene="modes" />

## Credentials are derived, never stored

Each origin needs a credential the relay accepts. The panel does not generate
one and store it: it derives it from a secret kept in the panel and the
tunnel's name and the origin. Both halves receive the same value, computed the
same way, so there is no stored copy that could fall out of step between two
machines.

This is also why a tunnel's name cannot be changed after saving: the tag both
halves carry, the credentials and the certificate's name are all built from
it.

The link between the nodes is protected by REALITY by default, or by TLS with
a certificate the panel issues for the tunnel's own name and the other side
pins. Both are completed when you save; there is nothing to fill in.

## Profiles: several ways onto one tunnel

A profile is one way the tunnel is carried: its own port, its own security and
its own transport. A tunnel can have up to eight. They are not separate
tunnels: every link, over every profile, joins **one session pool** under the
same origin identity.

- **A blocked protocol costs throughput, not the tunnel.** If one profile's
  port or protocol is blocked, its links drop and the others go on carrying
  everything.
- **Links are the weight.** Each origin keeps several links (four by default)
  per profile. A profile with six links takes three times the traffic of one
  with two.
- **Each link has its own congestion window**, so one lost packet stalls only
  the streams on that link.

With two or more profiles, **Load balancing** chooses how the pool is used:

| Mode | What carries a new connection |
| --- | --- |
| **Spread** | every profile that is connected; a new connection takes the link with the fewest open streams |
| **Priority** | the first profile in the list that is connected; the next one is used only when it has no links |

<NxTunnel scene="pool" />

## A user sticks to one origin

For every new connection, the relay picks in this order:

1. **The origin**, from the user's name. The same user lands on the same
   origin every time, for as long as that origin is connected. Their exit
   address therefore does not change between connections, which keeps sites
   from logging them out or asking for a CAPTCHA.
2. **The profile**, by the load balancing mode.
3. **The link**, the least busy one.

Neither load balancing mode changes which origin a user reaches. Losing a
profile costs throughput; it never moves a user to another exit. When a whole
origin is lost, only the users who were on it move to another.

<NxTunnel scene="sticky" />

## Several addresses: warm failover

The dialing side dials **every** link address of the listening node at once,
under one identity. All of them stay connected, so there is no standby to
wake up: if one address is blocked, the links it carried drop and the others
already carry the traffic. An address that cannot connect, such as a CDN
address the tunnel cannot pass, stays in backoff while the others work.

## Changes reach the nodes live

Creating, editing, disabling or deleting a tunnel restarts neither node's core.

- **Membership** goes live: adding or removing an origin, rotating a
  credential, a peer's certificate reissued. Links that are up stay up; a
  removed origin's links are dropped and it is kept out.
- **Shape** rebuilds that tunnel's half: its ports, security, transport,
  balancing or windows. Only that tunnel is affected; every other item on the
  node keeps running.
- **The relay's final outbound** changes as part of a live routing update.

See [[how/config-sync]] for how live changes and rebuilds work in general.

## Traffic and accounting

Users' traffic is counted where they connect: on the relay, against their
account, once. On the origin, tunnel traffic is not counted against users and
its source addresses do not count toward an address limit, because the source
there is the relay. The tunnel's own usage graph shows the payload that went
through it, read from the relay.

## Health

A tunnel's health cannot be read from its settings, so the panel asks the
nodes.

- **Healthy** means the relay has links: *n* links up.
- **No links attached** means the relay answers but no origin is connected to
  it.
- **Relay unreachable** means the panel cannot reach the relay.

**Live status** asks every node of the tunnel: per origin, its links and
streams, and on the dialing side the connections wanted, the wait until the
next try and the last error. A dialing side that keeps failing backs off up to
one minute between tries.

### When the configuration is right but nothing flows

Links that are up but carry nothing, or a dialer waiting out its backoff after
a block that has since been lifted, are exactly the configuration the panel
wants, so a sync finds nothing to change. **Reset** rebuilds the tunnel's half
on every node from the database: links are dropped and the dialing side starts
again at once. Traffic on that tunnel stops until it reconnects.

## One tunnel per relay

Several relays reaching the same origins are one tunnel per relay. A
credential taken from one relay then opens nothing on another, and adding a
relay is a new tunnel instead of an edit to the ones carrying traffic.
**Duplicate** copies a tunnel for another relay with fresh keys of its own.

## Related pages

- [[use/tunnels]]: creating and running tunnels.
- [[how/packet-path]]: where a tunnel sits in a connection's path.
- [[how/accounting]]: how traffic is counted and limited.
