---
title: "Shop: promotions"
description: "Discount codes, gift codes and the referral reward in Shop: what each does, its limits, and how customers use them."
order: 7
group: shop
tags: [addons]
---

# Shop: promotions

[[shop|NX Shop]] has three kinds of promotion: discount codes, gift
codes and referrals. All three are set on the **Codes** page
of Shop's admin. Customers use them in the bot and in the web app; nothing
about them reaches the panel.

## Discount codes

A discount code takes a **percent** or an **amount** off one order. It can
be limited to:

- **A window**: a start date, an end date, or both.
- **A number of uses** across all customers (0 is unlimited), and **once per
  customer** (on by default).
- **Products**: some of them, or every product.
- **Kinds of purchase**: new services, renewals, extra traffic.

The customer enters the code before choosing: the bot's list has an **I have
a discount code** button, the web app's buy page a **Have a discount code?**
link. The list then shows each product's price with the code. A product the
code does not cover keeps its price. A code that does not apply is refused
with the reason: unknown, off, not started, expired, used up, not for that
product or kind of purchase, or already used by this customer.

**Holds.** An order placed with a code and not yet paid holds one of the
code's uses for **24 hours**, so the last use is never handed to two buyers
at once and never kept by one who walked away. A cancelled order gives its
use back at once. An order paid after its hold lapsed is still honoured at
the price the customer was shown, so a late payment can take a code one past
its limit.

An order a code makes free is paid at once and its service made. A code is
never in the wallet's ledger: the order simply asks less. Deleting a code
that orders carried switches it off instead, and those orders keep its name.

Agents do not get discount codes on top of their level's price
([[shop-agents]]).

## Gift codes

A gift code puts an **amount** in the customer's wallet, for a promotion or
to make up for something. Each customer can use it **once**, within an
optional end date and number of uses. In the bot it is on the wallet screen
(**Gift code**), in the web app on the Wallet page. Whatever the wallet then
covers is paid at once, so a customer with an unpaid order can pay it with a
gift.

Discount and gift codes share one namespace: a customer types a code without
saying which kind it is.

## Referrals

Every customer has their own referral link once referrals are on: in the bot
under **Invite friends**, and in the web app on the Wallet page.

A customer who **first** comes by a link belongs to that referrer for good.
The referral is bound when the customer is made, and nothing moves it later:
not another referrer's link, not the admin. A customer who was already the
shop's when they opened a link stays nobody's.

The reward, set under **Referrals**:

| Setting | What it pays |
| --- | --- |
| **Percent of each order** | A share of every order the referred customer pays. |
| **The percent on the first order only** | The same share, of the first order only. |
| **Fixed amount on the first order** | An amount in the shop's currency on the first order. |

Use either or both. With both at zero, referrals are off and no link is
shown. An agent's level can set its own referral rate ([[shop-agents]]).

When the reward is paid:

- It goes to the referrer's wallet **when the panel has made the order**, not
  when it is merely paid. An order the panel refuses is refunded and pays
  nothing. The referrer is told in the bot.
- A trial, or an order a code made free, pays nothing.
- A refund of the order takes the reward back, as far as the referrer's
  wallet still holds it.
- The **first order** is the first one the panel made with money in it. A
  refunded first order still counts as the first.

The rewards paid so far are listed under **Rewards paid**, and their cost
appears in **Reports**.
