---
title: Glossary
description: The words Nexora uses, each in a sentence or two.
tags: [reference]
---

# Glossary

The words the panel and these pages use. Anywhere in the documentation, a
word with a dotted underline is one of these: point at it to read its entry.

## Panel {#panel}

The control side of Nexora: one program with a web interface that keeps every
setting, user and node in its database and tells each [[~node]] what to
serve. Users connect to nodes, never to the panel.

## Node {#node}

A server that carries your users' traffic. It takes its whole configuration
from the [[~panel]] over an encrypted link on which each side proves who it
is, and it stops serving when it has lost its panel for a few minutes.

## Template {#template}

A named set of [[~inbound|inbounds]], [[~outbound|outbounds]],
[[~endpoint|endpoints]], [[~rule-set|rule sets]] and [[~routing|routing]] that
one or more nodes serve. A node serves exactly what its template holds, and a
[[~user]] reaches the nodes of the templates they belong to.

## Inbound {#inbound}

A way in for users: one protocol on one port, such as VLESS with
[[~reality|REALITY]] on 443 or Hysteria2 on a UDP port. Inbounds live in a
shared pool and reach nodes through [[~template|templates]].

## Outbound {#outbound}

A way out for traffic that has reached a node: straight to the internet, on to
another proxy, or blocked. [[~routing|Routing]] picks the outbound for each
connection.

## Endpoint {#endpoint}

An interface that is a way in and a way out at once, such as WireGuard or
OpenVPN. Each user of a WireGuard endpoint gets their own keys and address,
made by the panel.

## Rule set {#rule-set}

A list of domains or address ranges, such as a country's addresses or a
service's domains, that [[~routing|routing]] rules match against. The panel
downloads each list, keeps it current and hands it to the nodes itself, so a
node never depends on reaching the list's source.

## Routing {#routing}

The rules that choose an [[~outbound]] for each connection, by domain,
address, [[~rule-set|rule set]], protocol and more. Routing and DNS are part
of a [[~template]].

## User {#user}

One of your customers: an account with credentials, a traffic allowance, an
expiry date and optional limits on devices, addresses and speed. A user gets a
[[~subscription]] and connects to the nodes of their templates.

## Plan {#plan}

A preset of limits (traffic, duration, devices) that a new [[~user]] is
created with. The plan is copied onto the account once: editing the plan later
never changes accounts already sold.

## Subscription {#subscription}

The personal address a user's app fetches its configuration from. It answers
in the format the app reads (share links, Clash, a sing-box profile, an Xray
JSON profile) or, in a browser, with the [[~subscription-page|subscription page]].

## Subscription page {#subscription-page}

What a user sees on opening their subscription address in a browser: usage,
expiry, and a QR code and link for each app. Its look comes from a theme you
pick or write.

## Link address {#link-address}

The address a [[~node]] is published under in users' links, which can differ
from the one the panel reaches it at. A node can have several; each becomes
its own entry in the [[~subscription]].

## Domain front {#front}

A CDN hostname put in front of an [[~inbound]]: users connect to the CDN and
the CDN passes the traffic on to your nodes. One front covers every node that
serves the inbound.

## Tunnel {#tunnel}

A link between two groups of your nodes: users connect to a relay node, and
the relay carries their traffic to origin nodes, whose addresses are the ones
the internet sees. One tunnel can use several ports and protocols at once.

## Certificate {#certificate}

A TLS certificate the panel keeps and puts on inbounds and on itself:
self-signed, issued by Let's Encrypt or another ACME authority, or uploaded.
Issued certificates renew by themselves.

## REALITY {#reality}

A TLS mode for an [[~inbound]] that needs no domain or certificate of your
own: to anyone but your users, the server looks like a real website you
choose. The panel makes its keys when you save the inbound.

## Reseller {#reseller}

An admin account that sells to its own customers. It sees and manages only the
users it created, within a traffic allowance, an expiry date and the
[[~plan|plans]] you allow it.

## Role {#role}

What an admin account may do. Three are built in (main admin, admin and
reseller), and you can make your own by taking permissions away from one of
them.

## API token {#api-token}

A key that lets another program use the panel's API. It acts as the admin it
belongs to, never with more rights, and can be narrowed to chosen
permissions.

## Event {#event}

Something that happened: a user reached their limit, a node went offline, a
backup was taken. The panel sends events to webhooks, Telegram chats, email
addresses and [[~addon|addons]].

## Addon {#addon}

A separate program that attaches to the panel, such as Nexora Shop or the
notifier. Once you approve it, the panel registers it, gives it exactly the
access its signed manifest asks for and links to its interface; the addon
runs on its own.

## Licence {#licence}

What sets how many users and nodes a panel serves. Without one, the panel runs
free with up to 25 users and 1 node.

## Setup wizard {#setup-wizard}

The page a newly installed [[~panel]] opens on. It creates the main admin,
the panel's address and its certificate in one step, and only the one-time
link the installer prints can open it.
