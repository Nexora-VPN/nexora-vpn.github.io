---
title: "Shop: the customer portal"
description: "Set up Shop's web app, which is both a browser portal and a Telegram mini-app, with HTTPS and sign-in by email, SMS or the bot."
order: 4
group: shop
tags: [addons, users]
---

# Shop: the customer portal

[[shop|NX Shop]] gives your customers one web app at
`https://<shop>/app/`. This page covers what it is, how to give it HTTPS,
and the three ways a customer signs in outside Telegram.

## One app, two places

- **The portal**, in any browser. It keeps your shop selling when Telegram
  is blocked or your bot is lost. A customer signs in with a code sent to
  their **email** or **mobile number**, or one the **bot** confirms, and
  buys, pays, renews and reads their services and usage as in the bot. It
  installs on a phone's home screen.
- **The mini-app**, inside Telegram. The bot's menu shows **Open the shop**
  once Shop's public address is `https://`, and Telegram signs the customer
  in by itself. A customer who bought on the web links their email or number
  once (a code proves it) and then sees the same services, wallet and orders
  in both.

## What a customer can do

- **My services**: the subscription link with a copy button and a QR code,
  usage, the expiry date, renew, add traffic, and the wallet-paid automatic
  renewal.
- **Buy and pay**: by card with a photo, PDF or tracking number of the
  receipt, or through your gateway ([[shop-payments]]).
- **The wallet**: its balance and top-up, gift codes, and their referral
  link ([[shop-promotions]]).
- **The free trial**, when you offer one.

The app speaks the languages you turned on, each customer in their own, with
a switch at the top. It says so when new services are paused, or when an
order went back to the wallet because the panel had no room.

## The public address and HTTPS {#https}

The install asks for Shop's **public address**, how Shop gets its **HTTPS
certificate**, and the **bot's token**. The token can wait and be set in
Shop. The address can change later on **Set-up**, on the same port; the
certificate mode changes by running the install again with a new answer.

With HTTPS on, Shop serves it on its install port alone, with nothing plain
beside it, and the public address names that port (443 when it names none).
The panel reaches Shop at that address too.

| `https` | When to use it |
| --- | --- |
| `panel` (default) | Shop serves the certificate you chose at install from the panel's **Certificates**. The panel issues and renews it; Shop fetches it every few minutes and keeps a copy. Shop needs no port 443, so it can share a server with the panel: give it its own port, such as 8443, and the address `https://shop.example.com:8443`. |
| `acme` | The domain of the public address points at Shop's server and port 443 is free there. Shop gets and renews its own certificate on 443, and nothing listens on 80. |
| `acme-http` | The same on any port, for a server whose 443 is taken. The authority checks on port 80. |
| `self-signed` | An address by IP, such as `https://203.0.113.9:8443`. Browsers warn once; the traffic is encrypted. **Set-up** shows the fingerprint to compare with the browser's and with the one the panel showed when you approved Shop. |
| `off` | Plain HTTP on the port, for your own reverse proxy or the panel (below). |

::: warning No mini-app on a self-signed address
Telegram opens no mini-app on a self-signed address, so the bot offers none.
Customers use the bot, and the web app in a browser. Shop renews a
self-signed certificate about once a year; trust the new one in the panel
with **Certificate** on Shop's row.
:::

## Sign-in by email

Set your SMTP server in Shop's **Settings**: host, port, user name,
password, sender address, and security: `starttls` (port 587), `tls` (port
465) or `none` (only for a relay on the same server).

A code is six digits, good for ten minutes and five tries. An address gets
three codes in fifteen minutes, an IP address ten an hour.

## Sign-in by SMS

Shop names no SMS service. Point it at yours through a small relay of your
own, by its URL under **Settings**. Shop makes the shared secret when you
leave it out. Each code is sent as:

```http
POST <your relay URL>
X-Nx-Timestamp: 1790000000
X-Nx-Signature: <hex HMAC-SHA256 of "1790000000.<body>" under the secret>
Content-Type: application/json

{"to": "+15550100", "text": "Your shop sign-in code: 123456"}
```

Answer with any 2xx status once the message is on its way. The signature is
the same as on every call Shop makes to a service of yours
([[shop-payments#signing]]); check it in the relay. Numbers arrive in
international form; Iranian numbers typed as `0912…` become `+98912…`.

## Sign-in by the bot

When a bot is set, the portal offers **Sign in with the Telegram bot**. It
opens the bot with a one-time code; the customer presses Start, and the bot
asks them to confirm, naming the browser's address, device and time. The
page signs in by itself on **Confirm**; **Refuse** spends the code.

The code is good for five minutes, and only the browser that asked for it is
signed in: someone who sends a customer their own link gets nothing. This
needs Telegram to be reachable; email and SMS are for when it is not.

## Behind a reverse proxy

Codes, sign-ins and payment checks are rate-limited per client address.
When Shop runs behind a reverse proxy that terminates TLS, set
`NX_OPT_TRUSTED_PROXIES` in the install's `.env` to the proxy's
addresses or ranges, for example `127.0.0.1, 10.0.0.0/8`. Shop then reads
the client from the proxy's `X-Forwarded-For`. Left empty, the default, no
forwarded header is believed.

The panel can be that proxy. On **Settings → Addresses**, add an
**Another program** route on Shop's host name with **Proxy to** set to Shop
([[use/ingress#another-program]]). Customers then reach Shop on the panel's
port, and Shop's own port need not be open to the internet. The panel sends
the client's address in `X-Forwarded-For`, so list the panel's address as
Shop sees it, such as `127.0.0.1` on the same server.
