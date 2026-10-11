---
title: "The addon platform"
description: "How the panel registers an addon: the signed manifest, the claim code, the consent screen, grants the addon holds, health, suspend, updates and certificates."
order: 9
tags: [addons, security]
---

# The addon platform

An [[~addon]] is a separate program: its own process or container, its own
database and its own interface. The [[~panel]] never runs its code, never shows
its pages inside its own and keeps none of its data. What the panel does is
register it, give it exactly the access you approved, and keep an eye on it.
This page explains how. Installing one is on [[start/install-addon]] and
[[use/addons]]; writing one is on [[addons/build]].

## What an addon can be given

Two things, and nothing else:

- **An [[~api-token|API token]]** with a set of permissions (scopes), each with
  the reason the addon gives for it. The addon reads and changes the panel
  through the same API as everyone else.
- **A webhook** that receives the [[~event|events]] it named. Each event needs
  the permission that would let the addon read what it is about, and the
  manifest is refused if that permission is not among those it asks for.

Basic facts about a user, such as contact details, live in the panel's own
columns, which an addon reads and writes with its token. Anything else an
addon needs to keep, such as a shop's orders and payments, stays in the
addon's own database.

## The manifest

Every addon describes itself in a manifest: its id, name and version, the
permissions it asks for with a reason for each, the events it wants, where its
setup, webhook and health paths are, a rate limit for its token, and how it
is installed. The same file sits in the addon's public repository, where the
directory and the install form read it, and is served by the running addon,
where registration reads it. The full format is on [[addons/manifest]].

### Signatures and trust

A manifest is trusted only by its signature:

| Kind | Signed by | Registered |
| --- | --- | --- |
| Official | Nexora's key | by its claim code |
| Verified | its developer's key, which the addon directory vouches for | by its claim code; the consent screen names the developer |
| Unsigned or unofficial | nobody the panel trusts | by hand, as your own addon |

The signature covers every field, so changing any of them breaks it. A
release's checksums are signed with the same key, and the panel installs an
addon on a server itself only when the files match them.

## Registration by claim code

1. **The addon starts with a one-time claim code**, which it shows in its log or
   on its own page. When the panel installs it, the panel makes the code and
   already knows it.
2. **The panel reads the manifest** from the addon's address, checks the
   signature, and shows the **consent screen**: each permission with its
   reason, each event, the rate limit, and who signed it.
3. **You approve.** The panel reads the manifest again and checks it is the
   very document the screen showed, then creates exactly that token and that
   webhook, and delivers them to the addon's setup path with the claim code.
4. **The addon accepts them only with its code.** If it answers anything but
   success (a wrong code, for example), the panel deletes what it just
   created. A failed registration leaves nothing behind.

The panel sends a live token to the addon, so it talks to an addon over plain
`http://` only when every address it resolves to is on this server, a private
network or a container network. Anywhere else the addon must be on `https://`.

## Grants belong to the addon row

Once registered, the token and webhook are held by the addon's row on
**Services → Addons**:

- They appear under **API tokens** and **Webhooks** marked with the addon's
  name, and cannot be edited, rotated or deleted there.
- **The token is bound to the panel's owner**, not to whoever clicked approve,
  so it keeps working when that admin leaves, and moves with the ownership if
  you transfer it.
- **Remove** tells the addon first, then deletes its token and webhook.
  Whatever the addon stored about your users in its own database stays there,
  so registering it again finds it.

## Health

When the manifest names a health path, the panel asks it every minute. An
answer of 200 is healthy.

- **Two failed asks in a row** mark the addon unhealthy, with the last error,
  and raise `panel.addon_unhealthy` once.
- **The next 200** brings it back and raises `panel.addon_recovered`.

The state is kept in the database, so a panel restart repeats neither event.
An addon without a health path is never asked.

## Suspend

**Suspend** stops an addon without removing it: its token stops working at
once, and its webhook stops receiving. Events raised while it is suspended are
not kept for it. A suspended addon is not asked for its health. **Resume**
turns both back on.

## Updates never widen a grant by themselves

The panel reads a signed addon's manifest again every hour, and when you press
**Check for an update**.

- **A version that asks for nothing more** than the addon holds is applied by
  itself.
- **A version that asks for more** permissions, events or a higher rate limit
  waits. The addon keeps exactly what it has, its row shows **Update waiting**,
  `panel.addon_update_waiting` is raised once, and the review lists only what
  the update adds, each with its reason, for you to approve.
- **A version that asks for a token or a webhook the addon never had** cannot be
  approved in place: its credentials would need the claim code the addon has
  already spent. Remove the addon and register it again.

## Certificates from the panel

An addon that serves HTTPS can take its certificate from the panel's own
store instead of getting one itself. The panel issues and renews it; the
addon fetches it every few minutes, by its claim code before it registers and
by its token after, and keeps a copy so it comes up with HTTPS even while the
panel is down. It then needs no port 80 or 443 of its own, so several addons
can share a server with the panel.

For an addon on another server, only certificates the panel's server did not
prove are offered: those issued by DNS challenge, self-signed or uploaded. The
panel's own HTTPS certificate is never handed to an addon on another server,
since its key would let that server pass for the panel. This is checked again
on every fetch. See [[how/certificates]].

## Installing on the panel's own server

When the panel runs directly on a Linux server (not in a container), it can
install an addon beside itself, with no SSH: it runs the addon's install script
as root, after checking the release against its signed checksums, and the
addon takes its certificate from the panel. Over SSH to another server the
same checks apply; the server's host key is remembered on first contact and
the SSH password or key is never stored.

## Related pages

- [[how/events]]: how events reach an addon's webhook.
- [[how/security]]: API tokens and scopes.
- [[addons/directory]]: the directory and its tiers.
