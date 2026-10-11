---
title: "The notifier"
description: "Tell every user on the panel about their account over Telegram, Bale, SMS, email or any HTTP API, and send your own messages, with the notifier addon."
order: 9
tags: [addons, events]
---

# The notifier

The notifier (Nexora Notif) is the official [[~addon]] that tells your
panel's users about their accounts: the expiry date drawing near, traffic
running low, a renewal, traffic added, and your own messages to one user or
a group. It sends over Telegram, Bale, Soroush Plus, Rubika, SMS, email,
ntfy or any HTTP API. This page covers installing it, its channels, what it
sends and when, and your own messages.

## One notice, one delivery

A notice is written once and handed to the user's channels in the order you
set. The next channel is tried only when one could not deliver: the user has
no address there, the channel refused (a blocked bot, a number that does not
exist), or it failed three times. A paid SMS goes out only when the free
channels could not reach the user, and nobody gets the same notice twice.

The notifier reads the panel with a scoped token and hears the panel's
signed [[~event|events]]. It keeps each user's messenger links in the
account's contact card on the panel (`telegram_id`, `bale_id`,
`soroush_id`, `rubika_id`), where other addons and the
[[use/users|users page]] see them too.

## Install

On the panel: **Addons → Browse → Nexora Notif → Install**. The panel asks
its questions and installs it on its own server or another one over SSH, or
gives you a command to run. Every way to install is in [[directory]].

| Question | What it sets |
| --- | --- |
| Port | `8097` by default. With HTTPS on, the notifier's only port. |
| Database | SQLite, or PostgreSQL with its connection string. |
| The first admin | A name and a password of 10 characters to 72 bytes. |
| Admin path | Everything the notifier serves is under it. Drawn at random; empty puts it at the root. |
| Public address | Where you open the notifier: scheme, host and port. |
| HTTPS | `panel` (the default in the panel's form), `acme`, `acme-http`, `self-signed` or `off`, as for every addon ([[directory#https-for-the-addon]]). |

By hand, on a Linux server as root:

```bash
sh install.sh --method docker --opt port=8097 --opt admin_password=… \
  --panel-url https://panel.example.com --claim-code …
```

`--method script` runs the binary under systemd instead of Docker. Running
the same command again updates in place; `--uninstall` removes it, and
`--purge` deletes its data too.

When you approve the notifier, it asks for two things: reading accounts, and
writing the messenger links into their contact cards.

### Set-up

Sign in at the public address with the admin path,
`https://<host>:<port>/<path>/`. The root of the address answers nothing.
**Set-up** is a checklist of the notifier's own work: two-factor sign-in,
the first channel, the backups. It also flags what the panel's install left
wrong: a missing or plain-HTTP address, the registration, or a password still
the install's, which stays in its `.env` in the clear. Change that password
first.

A lost password is reset on the server:

```bash
notif admin reset-password -user admin -pass …
```

## Channels

**Channels** lists your channels in the fall-back order. Move them with the
arrows, and switch one off without deleting it. Each shows what it sent
today and this month. **Test** sends a test notice to one account by name.

### Telegram, Bale and Soroush Plus

All three use the same kind of bot. Make a bot with each messenger's
BotFather and paste its token.

::: warning Give the notifier bots of its own
A bot's updates can be read by one program only. A token that Shop or
another tool already uses cannot be shared; the channel says so if it is.
:::

- **Telegram**: where your server cannot reach Telegram's API, set a
  **proxy** (`socks5://host:port`) or a Bot API mirror as the API address. A
  proxy on this server, the Docker host or your LAN must be named at install
  under **Allowed bot proxies**.
- **Bale**: Bale slows a bot that writes to users who are not talking to it.
  Its paid business API is made for notices; switch it on in the channel
  once your Bale business account is funded.
- **Soroush Plus**: works like Telegram, at its own API address.

### Rubika

Rubika has its own bot API, which the notifier speaks. Its API may refuse
servers outside Iran: give the channel a proxy inside Iran, or the address
of a relay there.

### Linking users to a bot

A bot can only write to someone who has started it. A user links their
account by sending the bot their [[~subscription]] link, or the **link
code** you find on their page under **Accounts**. For Telegram that page
also gives a link that carries the code, so one tap links.

- The chat id is written into the account's contact card, with the user's
  messenger language when the card has none.
- `/stop` unlinks. A user who blocks the bot is unlinked automatically, and
  their notices fall to the next channel.
- Five wrong tries in ten minutes lock a chat out for a while.

### SMS

**Kavenegar** and **Faraz SMS** are built in. Both send by an approved
template on a service line, which reaches numbers that block advertising
SMS. Write the template in the provider's panel and have it approved, then
tell the notifier which of its variables carries what, one line each, such
as `token={name}`. For Faraz SMS, also give the length each variable has in
the pattern (`name=20`); the notifier cuts every value to that length,
because Faraz holds a longer message for manual review while still
answering "sent".

The phone number comes from the contact card's `phone`, written any way an
operator types it. Other SMS providers work through the generic HTTP
channel below.

### Email

Any SMTP server: host, port (587 with STARTTLS, 465 with TLS), user,
password and sender. Mail is plain text. The address comes from the card's
`email`.

::: tip Send from your own domain
Set SPF, DKIM and DMARC for the sender's domain. QQ Mail, 163, Mail.ru,
Yandex and Gmail refuse or bury mail they cannot verify.
:::

### ntfy

ntfy is a push app users install themselves. Turn ntfy on for a user on
their page under **Accounts**: the notifier draws a topic nobody can guess,
keeps it in the card as `ntfy`, and shows the address to hand them. Whoever
knows the address can read it, so give it to that user only. On Android
phones without Google services, users turn on **instant delivery** in the
app.

### The generic HTTP channel

Any provider with an HTTP API: an address, a method, headers and a body,
each a template over the notice, and the contact field that holds the user's
address there (`phone`, or a key of your own such as `vk_id`). The
provider's key goes in **Secret** and never appears in the log. The body is
JSON, a form or none; there is HTTP Basic authentication, a **success
pattern** for providers that answer 200 to a failure, and a CA certificate
for a private one.

Templates can use the notice's text, title, the user's address and name, the
secret, a per-notice id and the notice's variables, with functions that
format a phone number in international or local form.

**Presets** fill everything in for SMS.ru, SMSC, SMS Aero, MTS Exolve, VK,
LINE, Matrix and Pushover; replace what is in capitals. WhatsApp is reached
through an intermediary of your choosing on this channel.

### Addresses the notifier refuses

Every channel's address (and a bot's proxy) must be on the public internet.
For a relay or server of your own on a private network (LAN, WireGuard,
Tailscale, a container beside the notifier), turn on **Address on my own
network** in the channel. The notifier's own server and the cloud metadata
service stay refused even then; run a local relay on another machine of your
network instead. Under Docker, the host is reached at
`host.docker.internal` with that switch on.

## Notices

**Notices** holds your **schedule**, the days before expiry (for example
`5, 1`) and the shares of traffic (for example `80, 95`) at which a user
hears, and every kind of notice, each on or off:

| When | Notices |
| --- | --- |
| On your schedule | Expiry coming, traffic running low. Each is said once and re-arms when the account is renewed, traffic is added or a new cycle starts. |
| When the panel says | Renewed, expired, traffic used up, created (with the subscription link), a reseller's allowance gone, back on, plan started, subscription added, device limit, deleted. |
| When an admin changes an account | Traffic added, the date moved, usage reset, switched off or on by hand. These wait a minute and a half; when the change was a renewal, the renewal's notice takes their place. |

**Words** opens a notice's text per language and, when one channel needs
other words such as a short SMS, per channel kind. A field left empty keeps
the default. Click a variable to add it: `{name}`, `{expiry}`, `{days}`,
`{traffic_total}`, `{traffic_used}`, `{traffic_left}`, `{percent}`,
`{added}`, `{sub_url}`, `{group}`. The preview shows the text for a sample
account.

A user's language is their card's `lang` (fa, en, ru or zh), otherwise the
language under **Settings**. Dates are in the Persian calendar for Persian
by default, or one calendar for all under **Dates**. **Quiet hours** under
**Settings** hold a notice until they end; nothing is dropped, and a notice
marked **urgent** goes through them.

## Messages

**Messages** writes to one or more accounts, or to a group the panel's own
filters pick: group, status, expiring within, traffic used, owner,
[[~template]], node, a search.

1. **Count** shows how many accounts match, which channel would carry each,
   how many are SMS and how many no channel reaches, with the message as the
   first account would read it.
2. **Send** asks once more, naming the SMS count.
3. The message goes out at the channels' rates in the background. What has
   not gone can be cancelled. The report gives what was sent, by which
   channel, and what failed.

An account's page lists what it was sent.

## Choosing the channel order

| Country | Reaches a user with the VPN on | Reaches a user with the VPN off |
| --- | --- | --- |
| Iran | Telegram, every other channel | Bale, Soroush Plus, Rubika, SMS, email |
| Russia | Telegram, email, ntfy | Email (Mail.ru and Yandex stay open in the mobile whitelist mode); SMS for an operator with a Russian legal entity |
| China | Telegram, ntfy, email | Email (QQ Mail, 163) |

A good order puts the free channel users read first and SMS or email last:
in Iran, Telegram, then Bale, then SMS; in Russia and China, Telegram, then
ntfy, then email. Keep notices about the account: the default texts carry no
prices, offers or the word VPN, which matters where advertising ways around
blocking is fined and where SMS providers forbid it.

## Log, privacy and backup

**Log** lists every delivery with each channel's attempt and its answer.
Finished deliveries, with their text, are deleted after the days set under
**Settings** (90 by default). The notifier keeps a copy of each account's
name, contact card, expiry and traffic to decide and write notices; the
secret part of the subscription link is kept only as a hash.

On SQLite the notifier copies its database once a day to `<data>/backups`,
keeping seven. By hand, `notif backup -o notif.db`, and with the notifier
stopped, `notif restore -i notif.db`. On PostgreSQL, back the database up
with `pg_dump`.

## When something is wrong

| What you see | What it means |
| --- | --- |
| A bot channel says another program reads its updates | The token is in use elsewhere (Shop, a webhook). Give the notifier its own bot. |
| **No address** in the log | The user has nothing for that channel in their card; the notice falls to the next channel. |
| **No channel reached the user** | Every channel was tried; the log's attempts say why each failed. |
| Nothing queued for an account | No channel that is on has an address for it. Link a bot, or add a phone or email to the card. |
| **Not public** for a channel | Its address is on this server or a private network. See [Addresses the notifier refuses](#addresses-the-notifier-refuses). |
| **Unknown** in the log | The provider took the request and its answer was lost. It may have been sent, so it is not sent again. |

If you also run [[shop|Shop]], turn off Shop's own account reminders so
customers do not hear the same notice twice.
