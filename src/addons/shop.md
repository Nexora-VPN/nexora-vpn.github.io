---
title: "NX Shop"
description: "Sell your panel's plans through a Telegram bot and a web app: install Shop, set it up, and find your way around its admin."
order: 3
group: shop
tags: [addons, plans]
---

# NX Shop

NX Shop is the official [[~addon]] that sells your panel's
[[~plan|plans]] to customers: products, orders, a wallet, card-to-card and
gateway payments, a Telegram bot, a web app, discount and gift codes,
referrals and agents. This page covers installing Shop and its admin; the
pages after it cover each part in depth.

## How Shop fits with the panel

Shop is separate software with its own database. The money is in Shop's
database and the accounts are in the panel's:

- A customer buys in the bot or the web app and pays into their **wallet**.
- Shop asks the panel to create, renew or top up the account, through the
  token you approved at install.
- The customer gets their [[~subscription]] link from Shop.

Shop checks no licence of its own; the panel does. When the panel refuses a
new account because its [[~licence]] is full, Shop returns the order's money
to the customer's wallet at once, tells the customer why, tells your admins'
Telegram topic, and pauses new services and trials for an hour. Renewals and
extra traffic go on. Upgrade the licence or make room, then press **Reopen
sales** on Shop's dashboard.

## Install

The recommended way is from the panel: **Addons → Browse**, pick **NX
Shop**, answer its questions, and let the panel install it on its own
server, over SSH, or give you a command to run. The panel registers Shop
once it answers. Every way to install is in [[directory]].

By hand, on a Linux server, as root:

```bash
curl -fsSLO https://raw.githubusercontent.com/nx-panel/shop/main/install.sh
sh install.sh --method script --opt port=8095 \
  --panel-url https://panel.example.com --claim-code XXXX-XXXX-XXXX-XXXX
```

`--method script` runs the binary under the systemd unit
`nx-addon-shop`; `--method docker` runs Shop's compose stack. Everything
lives in `/opt/nx-addons/shop`: the answers in `.env`, the data in
`data/`.

### The install's questions

| Option | Default | What it sets |
| --- | --- | --- |
| `port` | `8095` | The port Shop listens on. With HTTPS on, its only port. |
| `database` | `sqlite` | `sqlite` keeps everything in `data/`; `postgres` uses a server you run. |
| `database_dsn` | | The PostgreSQL connection, asked only for `postgres`. |
| `admin_username` | `admin` | Shop's own admin account. |
| `admin_password` | | Its password, 10 characters to 72 bytes. Change it in Shop afterwards. |
| `base_path` | drawn at random | The path Shop's admin and API are under. Customers' pages (`/app/`, `/pay/`) stay at the root and never show it. Empty puts the admin at the root. |
| `public_url` | | Where customers reach Shop, `https://<host>:<port>`. With HTTPS on it names Shop's port (443 when it names none). |
| `https` | `panel` in the panel's form, `off` by hand | How Shop serves HTTPS: `panel`, `acme`, `acme-http`, `self-signed` or `off`. See [[shop-portal#https]]. |

Give Shop an address of its own, never one beside the panel's. Telegram opens
the mini-app only over HTTPS.

### Update and remove

- **Update**: run `sh install.sh` again, or press **Update on its host** in
  the panel. The answers and the data are kept.
- **Remove**: `sh install.sh --uninstall`, adding `--purge` to delete the
  data too. Take a [[shop-backup|backup]] first.

## Set-up

Open Shop's admin at its address and base path: `install.sh` prints it, and
the panel opens it from Shop's row. **Set-up** is a checklist of Shop's own
work, and nothing forces its order:

1. **Telegram bot**: make a bot with BotFather and paste its token. Use a bot
   of Shop's own, not the panel's or the notifier's.
2. **Your Telegram, as an admin**: open the link or scan the QR code and
   press Start.
3. **Receipts group**: add the bot to your admins' group and send `/receipts`
   in the topic you want receipts in.
4. **Cards for card-to-card**, if you take them ([[shop-payments]]).
5. **Products**, picked from the panel's plans.
6. **Sign-in by email or SMS**, optional ([[shop-portal]]).
7. **Customers' subscription address**.

What the panel's install did, the registration and the public address with
HTTPS, appears on the checklist only when something is wrong.

## The admin

Shop's admin is in English, Persian, Russian and Chinese. Everything Shop
does is operated from it.

| Page | What it is for |
| --- | --- |
| **Dashboard** | Today's and the last 30 days' sales, receipts waiting for a person, failed orders, customers and what their wallets hold, paused sales, accounts that no longer match the panel. |
| **Orders** | Every purchase. Refund a failed or fulfilled order to the wallet, cancel an unpaid one, or **Send again** a paid order whose panel call stopped. |
| **Receipts** | Card-to-card receipts to approve or reject, the same queue as the Telegram topic. |
| **Customers** | Find a customer by name, Telegram id, email or phone; edit details, credit or pay out their wallet, read their statement, see their services, place an order for them. |
| **Agents** | Levels and agents ([[shop-agents]]). |
| **Reports** | Sales per period and currency, new against renewal, the renewal rate, top products and agents, what promotions and refunds cost, what the wallets hold. |
| **Products** | New services from a panel plan, renewals (by days or calendar months, with optional traffic and cycle reset), extra traffic; prices per currency; take one off sale. |
| **Payment methods** | Cards, gateways with their health, payment settings, the bank-SMS address and secret, exchange rates ([[shop-payments]]). |
| **Codes** | Discount codes, gift codes, the referral reward ([[shop-promotions]]). |
| **Bot texts** | Every message the bot sends, in your own words. |
| **Settings** | The bot (currency, trial, a channel to join first, top-up amounts, support, reminders, auto-renew), customers' languages, reminders, broadcasts, sign-in by email and SMS. |
| **Set-up** | The checklist above. |
| **Security** | Your password and two-step sign-in. |
| **Backup** | The schedule, the archives, the key, and the check after a panel restore ([[shop-backup]]). |

::: warning Subscription links and the admin path
The dashboard warns when the panel hands customers subscription links on
the panel's admin path. Publish them on a **Subscriptions** route with a
**Path prefix** of their own, on **Settings → Addresses**, so customers never
see it ([[use/subscriptions]]).
:::

### Bot texts

Each message and button of the bot can be reworded in each language you
turned on. A text may use the values its step offers, shown as chips under
the editor (<code v-pre>{{.Name}}</code>, <code v-pre>{{.Amount}}</code> and so on). The editor previews it
with sample values, and Shop checks it before keeping it, so a mistake never
reaches a customer. Messages use Telegram's HTML: `<b>`, `<i>`, `<code>`,
`<a href="…">`. **Back to the built-in** returns to Shop's own wording.

### Reports

A **sale** is an order paid in the chosen window and not refunded; a trial
is not a sale. The **renewal rate** is the share of accounts sold before the
window (not trials, still on the panel) that were renewed or topped up
within it. **Held in wallets** is what the shop owes its customers now.
Money is shown per currency and never converted.

## Customers' languages

Shop speaks Persian, English, Russian and Chinese. Under **Settings**, turn
on the ones your customers use. Each customer is served in their own
(their Telegram's language, or the one they pick) when it is on, otherwise
in English or the first language on. A product asks for a name in each
language that is on.

## Shop's reminders, or the notifier

By default Shop tells its customers about their accounts: reminders before
expiry, and the panel's warnings when an account expires, runs out of
traffic, is renewed or deleted. If you run the [[notifier]], which does this
for every account on the panel, turn off **Shop tells customers about
expiry, traffic, renewals and deletions** under **Settings** so nobody hears
it twice. Shop still tells customers about what it does itself: purchases,
receipts, the wallet, an automatic renewal the wallet could not pay.
