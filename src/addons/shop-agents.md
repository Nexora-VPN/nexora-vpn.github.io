---
title: "Shop: agents"
description: "Let customers resell through Shop: price levels, prepaid agent wallets, their statement, and how their accounts show on the panel."
order: 6
group: shop
tags: [addons, resellers]
---

# Shop: agents

An agent is one of your [[shop|Shop]] customers who resells. It buys services
for its own customers at its **level's** price, from a wallet it tops up
first, and hands each link over itself. Set agents up on the **Agents** page
of Shop's admin.

An agent lives in Shop only. It is not a [[~reseller]] on the panel and has
no panel account. If you want a reseller who logs in to the panel and
manages its own users there, see [[use/resellers]].

## Levels

A level is the price for a group of agents:

- **A percent off** the shop's price of every product.
- **Its own price** for any product you name, in place of the percent.
- **A referral rate**: when above zero, what an agent's referral link pays
  it of every order of the customers it brings, in place of the shop's
  referral percent. The shop's fixed first-order amount still applies
  ([[shop-promotions#referrals]]).

Changing a level changes the prices of every agent on it from their next
order. A level some agent is on cannot be deleted.

## Making an agent

Pick a customer (one who has started the bot or signed in to the web app), a
level and a **tag**. An empty tag takes the customer's name. The customer is
an agent at once. Ending the agency makes it an ordinary customer again; it
keeps its wallet and its services.

## What an agent sees

- **In the bot**, the menu has **Agent panel**: its level, its tag, its
  wallet and the last movements of it. The lists show its prices. Buying a
  new service asks which customer it is for (or no name), and the services
  list names each service that way.
- **In the web app**, the buy page has the same name field, the prices are
  its own, and the Wallet page shows its level and statement.

The rules:

- An agent pays from its wallet only; nothing is sold on credit. It tops up
  like any customer, or you credit its wallet on the **Agents** page.
- A discount code does not apply to an agent's price: the level is its
  discount.
- Renewals, extra traffic and automatic renewal of its services are at its
  price too.

## On the panel

The agent's customers are not Shop's customers, and the panel learns nothing
about them. Each account an agent buys carries the agent's **tag** as its
**group** label, so on the panel's [[use/users|users page]] you can filter,
count and bulk-edit one agent's accounts. Shop writes the label right after
the account is made, replacing the plan's group on that account.

## The statement

An agent's statement is on the **Agents** page, in the bot's agent panel and
on the web app's Wallet page. It is read from the wallet's own ledger: every
top-up, purchase, refund, payout, gift and referral reward, with the balance
after each. The last balance is the wallet.
