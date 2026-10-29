---
title: "Shop: payments"
description: "Take money in Shop: card-to-card confirmed by a receipt or your bank's SMS, a generic HTTP gateway you point at your own relay, and exchange rates."
order: 5
group: shop
tags: [addons]
---

# Shop: payments

[[shop|NX Shop]] ships **no payment gateway**. It ships ways to take
money that are not gateways at all (card-to-card, confirmed by a person from
the customer's receipt or by your bank's SMS) and one general capability: a
**generic HTTP gateway**, a small JSON contract you can point at whatever
intermediary you choose. Which intermediary that is, and whether you may use
it, is your decision and your responsibility.

Set all of this up under **Payment methods** in Shop's admin.

## Money and the wallet

Every amount is an integer in the currency's smallest unit, beside the
currency's code. Money a customer pays lands in their **wallet** first and
pays the order from there. Paying a little more leaves the rest in the
wallet, and an order the wallet already covers needs no payment at all.

## Card-to-card

Add your cards (number, bank, holder, currency). Cards of one currency take
turns: each payment is given the card used longest ago.

Each card payment asks the customer for a **unique amount**: the price plus
a few units that no other open payment in that currency is asking. The extra
units stay in the customer's wallet. The unique amount is how a transfer is
matched to its payment.

- A payment is open for 60 minutes by default, but its amount stays held for
  a day, so a transfer that arrives late still lands on its own payment.
- A customer asking again for the same order is shown the payment already
  open.
- One customer opens at most 10 card payments a day by default, so
  abandoned taps or a script cannot hold every amount near a price.

A card payment is confirmed in one of two ways.

### By a person, from the receipt

The customer sends the last four digits of the card they paid from, and a
photo or PDF of the receipt, or the bank's tracking number. The receipt
waits in **Receipts** in Shop's admin and, once the bot is set up, in a
forum topic of your admins' Telegram group with approve and reject buttons.

- Only the Telegram users you list as approvers can decide a receipt.
- A receipt decided anywhere (the admin, Telegram or the bank's SMS) is
  marked on its post. Approving it twice, or from two places at once, pays
  once.
- A tracking number already used is refused, and so is the same receipt
  again, even when the first was rejected.
- A picture that only looks like an earlier receipt is let through but
  marked with the payment it resembles. A bank's receipts share a layout, so
  the comparison is yours.

### By your bank's SMS

Forward your bank's SMS from your phone to Shop. The deposit's amount
confirms the one payment that asked for exactly that amount, with no person
needed. The forwarder posts each SMS to `https://<shop>/pay/hook/card`,
signed with the **SMS secret** shown under **Payment methods**
([below](#signing)).

- The body is JSON with the SMS `text`, or the SMS text itself. It may carry
  `amount` when your forwarder reads the amount itself, and `card` when one
  phone receives SMS for several cards.
- Shop reads the deposit from the usual shapes, Persian digits included, and
  never from a balance, a date, a time or a masked account number. A
  withdrawal confirms nothing.
- A card's **SMS units per unit** converts the bank's unit to the card's
  currency: banks count rials, so a card in tomans divides the SMS's amount
  by 10. Set it to 1 if your bank's SMS counts tomans.
- The same SMS forwarded twice books the payment once. An SMS whose amount
  no open payment asks for is kept for you to look at.
- An SMS for the amount of a payment whose receipt was rejected books
  nothing: the receipt goes back to **Receipts** for a person to look at.
- **Make a new secret** if one leaks; the old one stops at once.

::: warning Unsigned SMS
A forwarder that cannot sign may send the secret itself, but only once you
turn on **Also take SMS that carry the secret instead of a signature**. Anyone who sees such a
request can forge a deposit, so leave it off unless your forwarder needs it.
:::

What Shop answers:

| Status | Meaning |
| --- | --- |
| `2xx` | Taken. The same SMS signed anew after it was booked is answered `200` as already heard. |
| `401` | The signature is wrong, or not within five minutes of Shop's clock. Check the sender's clock and sign again. |
| `409` | The very same signed request after the payment was booked: read it as done. |
| `429` | The address sent twenty refused requests in ten minutes. Wait. |
| `503` | Shop could not keep or book it just now. Send it again, signed with the current time. |
| `400` | The body is not an SMS. Sending it again changes nothing. |

## The generic HTTP gateway

A gateway in Shop is four addresses on **your** side, usually a small relay
in front of the intermediary you chose, and a shared secret:

| Address | Required | What Shop does with it |
| --- | --- | --- |
| Create | yes | Asks for a payment page. |
| Verify | | Asks whether a payment was made. |
| Refund | | Asks to send money back. |
| Health | | Checks whether the gateway can take money. |

Each gateway has its currencies and an on/off switch. Shop makes the secret
when you leave it out. Shop's public address must be set, because the
gateway sends the customer back there ([[shop-portal#https]]).

### Signing {#signing}

Every request in both directions, and every call Shop makes to a service of
yours, is signed the same way: the header `X-Nx-Timestamp` (Unix
seconds) and `X-Nx-Signature`, the hex HMAC-SHA256 of
`<timestamp>.<raw body>` under the secret. Check Shop's signature in your
relay. Shop refuses a callback whose signature is wrong or whose timestamp
is more than five minutes off its clock.

```bash
TS=$(date +%s)
BODY='{"text":"..."}'
SIG=$(printf '%s.%s' "$TS" "$BODY" | openssl dgst -sha256 -hmac "$SECRET" -hex | sed 's/^.* //')
curl -X POST https://shop.example.com/pay/hook/card \
  -H "X-Nx-Timestamp: $TS" -H "X-Nx-Signature: $SIG" \
  -H 'Content-Type: application/json' --data "$BODY"
```

### Create

```http
POST <create address>
{"checkout": "ck_9f2…", "amount": 150000, "currency": "IRT",
 "description": "order 12", "language": "en",
 "callbackUrl": "https://<shop>/pay/hook/gateway-1",
 "returnUrl": "https://<shop>/pay/return/ck_9f2…"}
```

Answer `200` with `{"payUrl": "https://…", "reference": "<your id>"}`. Shop
sends the customer to `payUrl`. Send them back to `returnUrl` when they are
done; Shop then asks `verify` and shows what it found. `language` is the
customer's own: `fa`, `en`, `ru` or `zh`.

### Callback

```http
POST <callbackUrl>
{"checkout": "ck_9f2…", "reference": "<your id>", "status": "paid",
 "amount": 150000, "currency": "IRT"}
```

`status` is `paid`, `pending` or `failed`. When the gateway has a verify
address, a callback is only a hint: Shop asks `verify` before it books
anything. Repeating a callback is safe; a checkout is paid once. The status
codes Shop answers mean the same as for the bank SMS above: `409` once the
payment is booked (stop sending it), `503` to send again signed with the
current time, `400` for a body that is not the contract's, `429` after
twenty badly signed callbacks in ten minutes from one address.

### Verify

```http
POST <verify address>
{"checkout": "ck_9f2…", "reference": "<your id>", "amount": 150000, "currency": "IRT"}
```

Answer with the same shape as the callback. Shop asks when the customer
comes back, when a callback arrives, every few minutes for three hours for a
payment whose callback never came, and every quarter of an hour for a day
about a checkout closed on Shop's side, so money paid at the gateway anyway
still reaches the customer's wallet. Money paid in a different currency
than asked waits for you to confirm it.

### Refund

```http
POST <refund address>
Idempotency-Key: shop-refund-7-3f9a…
{"checkout": "ck_9f2…", "reference": "<your id>", "amount": 50000,
 "currency": "IRT", "idempotencyKey": "shop-refund-7-3f9a…"}
```

Shop takes the amount out of the customer's wallet **before** it asks, and
names each refund with a key. **Your relay makes one refund per key**: a key
asked again is answered as it was the first time and never refunds twice.

| Your answer | What Shop does |
| --- | --- |
| `2xx` | The refund is done. |
| A `4xx` with `{"refused": true, "reason": "…"}` | Nothing was or will be refunded under the key. The money goes back to the wallet and the admin sees the reason. Send it only when that is certain. |
| Anything else | Nothing is certain. The refund stays on its way, out of the wallet, and the admin can ask again with the same key. |

Without a refund address, pay a customer back by hand with **Pay out** on
their page under **Customers**.

### Health

`health` is a `GET` that answers 2xx while the gateway can take money. Shop
asks every minute; a payment it could not open counts the same. After three
failures in a row the gateway is down: customers are offered the other ways
to pay, and your admins' Telegram group and the dashboard are told. The
first good answer brings it back. A gateway without a health address is
tried again fifteen minutes after it went down.

## Exchange rates

A **rate** says how many of one currency one of another is worth. Set it
under **Payment methods → Exchange rates**. Its source is any JSON address
you choose (Shop names none), with the **path** to the number in its answer,
such as `data.price`, and a **multiplier**. Shop asks every ten minutes. A
**manual rate** is used when the source has not answered within its age (60
minutes by default) or when you choose it.

A rate does two things:

- **A product priced only in another currency** is sold in the shop's
  currency at the day's rate, rounded up to the step you set.
- **A gateway that takes only another currency** is offered for the shop's
  currency too. The checkout asks the converted amount and credits the
  wallet with the amount due, the rate locked when the payment opened. Such
  a payment is refunded by hand.
