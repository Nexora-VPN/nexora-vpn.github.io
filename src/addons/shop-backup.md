---
title: "Shop: backup"
description: "Back up Shop's own database, keep its key safe, move Shop to a new server, and settle accounts after a panel restore."
order: 8
group: shop
tags: [addons, backup]
---

# Shop: backup

The money is in [[shop|Shop's]] database and the accounts are in the
panel's, so there are two databases to keep. The panel backs up its own
([[use/backup]]); Shop backs up its own, under **Backup** in Shop's admin.
This page covers both sides: Shop's archives, and what to do when the panel
is restored.

## What a backup is

An archive of Shop's database (a consistent copy, taken while Shop runs) and
the card-to-card receipts, encrypted with a key only you keep.

| Setting | Default | What it does |
| --- | --- | --- |
| Every how many hours | `24` | `0` turns the schedule off. |
| Archives kept on the host | `7` | Older ones are deleted. |
| Send a copy off the host | on | To the panel's backup chat, or through Shop's bot. |

Archives are written to `data/backups/` as `shop-<date>-<time>.nxsb`, and
each can be downloaded from the same page. **Back up now** takes one at
once.

**The copy off the host** goes to the Telegram chat you chose for backups on
the panel ([[backup-destinations]]), through the panel's own bot; Shop never
sees that chat. When that is off on the panel, the copy goes through Shop's
bot to each admin paired with it. Telegram takes files up to 50 MB: a larger
archive stays on the host, and the page says so. Neither the panel nor
Telegram can read an archive.

On **PostgreSQL** the database is yours and so is its backup: use `pg_dump`
as for the rest of that server. Shop's archives then hold the receipts only,
and say so.

## The key

**Show the key** shows the key that opens every archive (`nxsb-…`). An
archive opens with it and nothing else. The key does not change, so an
archive made with it opens with it forever.

::: danger Keep the key off this server
Copy the key somewhere safe, away from Shop's server. A lost server takes its
copy of the key with it, and without the key no archive can be restored.
:::

## Moving to a new server

1. Install Shop on the new server as usual ([[shop#install]]), then stop it:
   `systemctl stop nexora-addon-shop`, or `docker compose stop shop`.
2. Copy an archive there and restore it with the key:

   ```bash
   nexora-shop restore -i shop-20261004-120000.nxsb -key nxsb-…
   ```

   With Docker, copy the archive into `data/backups/` first, then:

   ```bash
   docker compose run --rm shop restore -i /data/backups/shop-….nxsb -key nxsb-…
   ```

3. Start Shop again.

The restore checks the key, and that the database inside is Shop's, before
it touches anything. It keeps what it replaced as `shop.db.before-restore`
and `receipts.before-restore`. A wrong key or a damaged archive changes
nothing.

The panel's registration is not in the archive. If the new server keeps the
old address, copy `data/nexora-credentials.json` along. Otherwise remove Shop
on the panel's **Addons** page and register it again ([[directory]]).

`nexora-shop backup` takes an archive by hand, with the same key.

## After a panel restore

When the panel is restored from a backup, its accounts are as they were
then, and what Shop sold since may be gone from it. The panel tells Shop,
and Shop checks every account it sold against the panel.

An account the panel no longer has, or whose date or traffic is behind what
Shop's last order left it with, is listed under **Backup → After a panel
restore** with the order that paid for it. The dashboard says how many are
open.

1. Open each entry.
2. Settle it by hand: renew the account on the panel, or refund the order.
3. Mark it **Settled**.

**Check now** runs the same check at any time. The same list also shows a
gateway refund the gateway made after refusing it, for you to settle
([[shop-payments#refund]]).
