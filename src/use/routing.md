---
title: "Routing and DNS"
description: "Write the rules that choose an outbound for each connection, set the DNS servers nodes use, and start from or add to the preset catalogue."
order: 14
group: core
tags: [routing]
---

# Routing and DNS

[[~routing|Routing]] decides what happens to each connection that reaches a
node: which [[~outbound]] carries it, or whether it is blocked. DNS decides
how the node resolves names. Both are part of a [[~template]], on its
**Routing** and **DNS** tabs, so every node on the template routes the same
way.

## How routing works

The node checks the rules from top to bottom for every new connection. The
first rule that matches decides. A connection that matches no rule goes to
the **Final outbound**.

With no rules at all, everything goes to the final outbound, which is the
built-in `direct` unless you choose another. That is a sensible start: add
rules only for traffic that should go somewhere else.

## Writing rules

On the template's **Routing** tab:

1. Under **Rule sets**, select the lists your rules will match on. Only
   selected rule sets can be named by a rule. See [[rule-sets]].
2. Click **Add rule**.
3. Under **Match**, set what the rule matches.
4. Choose the **Action**, and for `route` the **Outbound**.
5. Save the rule, then save the template.

The list numbers the rules in the order the node checks them. A new rule is
added at the end; to change the order, drag the rule by the handle at the
start of its row. On a keyboard, focus the handle and press the up or down
arrow.

### What a rule can match

A rule can combine several matchers. All of them must match, unless you tick
**Invert match**.

| Matcher | Matches |
| --- | --- |
| **Domain**, **Domain suffix**, **Domain keyword**, **Domain regex** | The destination's name |
| **IP CIDR**, **IP is private**, **IP version** | The destination's address |
| **Port**, **Port range** | The destination's port |
| **Rule set** | Any list the template selected; **Rule set matches source IP** matches the user's address against it instead |
| **Network** | `tcp` or `udp` |
| **Protocol** | What sniffing detected: `tls`, `http`, `quic`, `dns`, `bittorrent` and others |
| **Inbound** | The inbound tag the connection came in on |
| **Auth user (panel user)** | The user's account name |
| **Source IP CIDR**, **Source port**, **Source IP is private** | Where the connection comes from |

Rules about things only a phone or desktop app can see, such as the app's
process or the Wi-Fi network, are refused when you save: a node never sees
them, so such a rule would never match.

### Actions

| Action | Effect |
| --- | --- |
| `route` | Sends the connection to the chosen outbound. |
| `reject` | Refuses the connection. |
| `sniff` | Reads the start of the connection to detect its protocol and domain, then goes on to the next rule. |
| `resolve` | Looks up the domain, so later address rules can match it. |
| `hijack-dns` | Answers the connection as a DNS query with the node's own DNS. |
| `route-options` | Sets connection options without choosing an outbound. |

### Protocol sniffing

Many connections arrive with an address and no name. A `sniff` rule reads the
TLS server name or HTTP host, and the protocol, from the start of the
connection. Rules after it can then match by domain and by **Protocol**. Put
the `sniff` rule first when later rules match domains or protocols.

Sniffing is detection, not a guarantee: traffic it does not recognise passes
on to the next rule unmatched.

### The final outbound

**Final outbound** takes every connection no rule matched. It is the default
for the nodes on the template. A node that relays exactly one [[~tunnel]]
takes that tunnel as its final instead, unless the template's own rules send
some traffic to the tunnel: then the template's final stands for the rest. See
[[use/tunnels]].

### When the form is not enough

The **JSON** tab shows the whole routing block exactly as nodes receive it.
Write a shape the form does not offer there. The panel still refuses options
that would make a node reject the configuration.

## DNS {#dns}

The template's **DNS** tab sets the resolvers the node uses for its own
lookups: for `resolve` rules, for outbounds that dial a server by name, and
for `hijack-dns`.

Add servers with **Add server** and pick a type: plain UDP or TCP, encrypted
`tls`, `https`, `quic` or `h3`, the node's own system resolver (`local`), its
hosts file (`hosts`), `dhcp`, or `fakeip`. A server can send its queries
through an outbound with **Detour (outbound)**. DNS rules, below the servers,
send chosen names to chosen servers.

Servers and DNS rules are dragged into order the same way as routing rules.
DNS rules are checked from top to bottom. Without a **Final server**, the
first server answers every query no rule takes. A rule that matches the
answer (`match_response`) needs an `evaluate` rule above it; one moved above
its `evaluate` rule is marked **out of order**, and the template does not
save until it is moved back, because a node refuses the whole configuration
for it.

When a template defines more than one DNS server, set a
**Default domain resolver** on the **Routing** tab. Without one, a node cannot
resolve the names of outbound servers and refuses the whole configuration. The
editor warns you when it is missing.

## Presets {#presets}

**From a preset**, on the **Routing** and **DNS** tabs, applies a ready
block. See [[templates#presets]] for the list.

- A **routing preset** replaces the template's rules, because rule order is
  the routing. **Block torrents** is the exception and is added in front of
  your rules. The rule sets a preset needs are added to the selection.
- A **DNS preset** replaces the DNS block with Cloudflare, Google, Quad9 or
  AdGuard over DNS-over-TLS, or the node's system resolver.

### Lists a preset needs

A preset is only as good as its lists. If the panel has no copy of a list the
preset uses, the panel would leave out that list and every rule matching on it,
and the preset would quietly do nothing. So the dialog checks first:

- a list you do not have yet is named, and **Add the lists and apply**
  downloads it first;
- a list the panel lists but holds no copy of is named, and you fix it on the
  Rule sets page first;
- a list the catalogue gives no source for is refused outright.

### Blocking torrents

**Block torrents** adds a `sniff` rule and sends what looks like BitTorrent to
a block outbound named `block-torrent`. The node counts what it blocks: the
figure is on the node's row and in the panel's metrics, and above a rate you
set it raises a `node.rejections_high` [[~event]].

It is best effort. Sniffing recognises the BitTorrent handshake, and clients
that encrypt it, which most do by default, pass. Read the counter as what was
caught, not as all there was.

### Country presets

**Iran + block ads**, **China + block ads** and **Russia + block ads** send
that country's domains and addresses straight out from the node, so domestic
traffic does not travel further, and reject the ad list. On a relay this keeps
local traffic off the tunnel. The result is as complete as the country lists;
if you need fuller coverage, point the catalogue at a fuller list (below).

## Your own presets {#your-own-presets}

The presets shelves (rule sets, inbounds, routing and DNS) come from a
catalogue the panel serves. You can add to it, or replace entries in it,
without waiting for a release:

1. Put a `.json` file in the presets directory: `/var/opt/nexora/presets/` on
   a standard install, or the directory set under
   **Settings → General → Preset catalogue → Catalogue directory**.
2. Open the presets dialog again. No restart is needed.

Every `*.json` file there is merged onto the built-in catalogue in file-name
order. An entry with a new key or tag is added; one with an existing key or
tag replaces the built-in one. A file that does not parse is skipped and noted
in the panel log, and the settings page shows the files in effect.

For example, a file that adds a country to the rule-set shelf, from a mirror
you control:

```json
{
  "version": 1,
  "ruleSets": {
    "countries": [
      {
        "key": "tr",
        "label": "Turkey",
        "items": [
          { "tag": "geoip-tr", "url": "https://mirror.example.com/geoip-tr.srs", "label": "IP ranges" }
        ]
      }
    ]
  }
}
```

A country entry replaces the built-in one with the same `key` as a whole, so
to re-point one list of a built-in country, repeat that country's other lists
in your entry too. Rule-set services merge by `tag`; inbound, routing and DNS
presets merge by `key`.

## One node that routes differently {#node-override}

A node has no routing of its own: it routes exactly as its template does. When
one server must route differently, give it a template of its own: duplicate
its template, change the copy's **Routing** tab, and put the node on the copy.
See [[templates#a-template-of-its-own]]. A panel upgraded from a version that
had a per-node routing override made these copies by itself.

## Checking a route

**Route test**, in the menu of a node's or a user's row, walks the node's own
rules for a connection you describe (destination, port, and optionally the
sniffed protocol and domain) and names the rule and outbound that take it.
**Test and connect** also opens one real connection from the node down that
path. See [[nodes]].

## Related

- [[rule-sets]]: the lists rules match on.
- [[outbounds]]: where rules send traffic.
- [[templates]]: where routing and DNS live.
- [[packet-path]]: the path a connection takes through a node.
