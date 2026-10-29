---
title: "Security model"
description: "How NX protects the panel, its nodes and its operators: mutual TLS and pinning, sessions, two-factor sign-in, roles, scopes and ownership, API tokens, login protection, the setup gate and the audit log."
order: 11
tags: [security, access]
---

# Security model

This page describes what protects your service and what each protection
achieves, from the link between the [[~panel]] and its nodes to the
permissions of every admin account. Switching the protections on and managing
accounts is on [[use/security]], [[use/admins]], [[use/roles]] and
[[use/tokens]].

## Between the panel and its nodes

- **Mutual TLS.** The panel and every [[~node]] prove who they are on every
  connection. A node accepts only the panel's client certificate; nothing else
  on the internet gets past the TLS handshake on its control port.
- **Pinning on first use.** The panel records each node's certificate on the
  first connection and accepts only that one afterwards. A different machine
  at the same address is refused, not trusted.
- **Single-use install tokens.** The install command exchanges its token for
  the panel's client certificate once; the token never works again. The
  automatic install over SSH needs no token: it uploads everything over the
  SSH connection.
- **SSH is pinned too, and never stored.** The panel records a server's SSH
  host key on first contact and refuses a different one. A password is used
  for one connection and dropped. The panel's own SSH key is added to a server
  only when you tick the option, and can be revoked from the node's menu.
- **Nodes keep no secrets of yours.** Users, keys and certificates reach a node
  in memory and are gone when it stops.

See [[how/node-lifecycle]].

## Sessions

- A sign-in creates a random session token, delivered as a cookie the page's
  scripts cannot read. The panel stores only a hash of it, so the sessions
  table is no way in.
- A session ends after 24 hours without use, or 30 days with
  **Keep me signed in for 30 days**. Sessions survive a panel restart.
- Every admin can list their own sessions, with address, app and last
  activity, and end any of them. The main admin can end all sessions of
  another account.
- Every sign-in and every failed sign-in is recorded, even with the change log
  off, and a sign-in from a new address raises `admin.login_new_ip`.

## Two-factor sign-in and re-confirmation

- **Two-factor authentication** uses a code from an authenticator app (TOTP),
  plus ten single-use recovery codes. A code is accepted only once.
- **Re-confirmation.** Sensitive actions ask for a fresh code when the last one
  was given more than 10 minutes ago: managing admins, creating or deleting API
  tokens, restoring a backup, restarting the panel, and
  changing the panel's address, certificate or base path settings. Accounts
  without two-factor and API tokens are not asked.
- **Single sign-on** never creates an account, and an account with two-factor
  is still asked for its code after the provider.

## Roles, scopes and ownership

What an admin may do is decided by two separate mechanisms, and keeping them
apart is what keeps resellers apart:

- **Scopes decide which actions.** Every route of the API needs a scope, and
  every request, from a sign-in or a token, is checked against the scopes of
  the caller's [[~role]].
- **Ownership decides which rows.** A [[~reseller]] sees and changes only the
  users it owns. No scope widens that: a reseller given permission to read
  users still reads only its own.

Roles add three rules:

- **A role narrows a tier; nothing widens one.** A custom role starts from the
  main admin, admin or reseller tier and takes permissions away.
- **Nobody grants what they do not hold.** Creating a role, putting an account
  on a role, resetting another account's password and minting a token for
  another account each require the caller to hold every permission involved.
- **Changing a role ends the sign-ins of everyone on it**, so the new
  permissions apply at once.

The panel has a single **owner**, the one account that cannot be deleted or
demoted, so there is always one account the recovery command can reach.

## API tokens

An [[~api-token|API token]] lets a program use the API:

- **Bound to an admin.** A token acts as its admin: it reaches only that
  admin's users and is held to that admin's allowance.
- **Never more than its admin.** Its scopes are cut down to its admin's role on
  every request, so narrowing the admin narrows every token at once, and
  deleting the admin deletes its tokens.
- **Shown once, stored as a hash.** The token appears once when it is created.
- **Rationed.** 120 requests a minute by default, or the rate set on the token.
- **Some actions are closed to every token**: changing a password, restarting
  or updating the panel, and restoring a backup.

## Login protection

- **Five failed attempts** from one address lock it out of signing in for 10
  minutes. The two-factor step and the setup page count too.
- **Repeated lockouts become bans** that survive a restart and grow with each
  repetition within a week: 10 minutes, 1 hour, 24 hours, 7 days. The main
  admin can also ban an address by hand.
- **A ban closes only what can be reached without a session**: the login, its
  second step and the setup page.
- **Behind a CDN or reverse proxy**, list it under **Trusted proxies**, or the
  panel sees every visitor as the proxy's address and one ban would lock
  everyone out. The **Login allowlist** names addresses that are never locked
  out or banned: your own network, your way back in.
- **An account can be bound to its own host names** ([[use/ingress]]). Only
  that account signs in there, and it signs in nowhere else; its API tokens
  follow the same rule. A refused sign-in reads exactly like a wrong password
  and is not counted towards a ban.
- **Another program behind the panel never sees an admin's session.** The
  panel removes its own cookies from what it forwards, and refuses a route
  that would put the program on the panel's host name.

## The setup gate

Until the [[~setup-wizard]] has run, the panel answers "not found" to every
request except the one-time link the installer printed. Nothing can sign in
before an admin exists, so the panel shows no login page to anyone. The
wizard's token authorises one submission, which creates the main admin, every
setting and the panel's certificate together, and is deleted when it is used.

## Secrets are never echoed

- **Stored credentials are never shown again.** A saved password, token or key
  in a form reads *Set — leave empty to keep*; an empty box keeps what is
  stored.
- **Bearer secrets are not readable at all.** The setup token, the backup
  passphrase and the secret every tunnel credential is derived from are left
  out of the settings API and of the command line's listing.
- **Events carry no credentials.** See [[how/events]].
- **Backups hold every credential.** Set a backup passphrase so an archive is
  useless to whoever finds it.

## Where the panel can be reached

- **The panel answers under its own base path** when one is set (the setup
  wizard proposes a random one), so its port alone shows no login page.
- **Subscription addresses are separate.** On a subscription domain the panel
  answers only at its base path, so the address every customer holds says
  nothing about where the panel is administered.
- **Other sites cannot frame the panel**, so its buttons cannot be hidden under
  someone else's page.
- **Webhooks you add cannot point into the panel's own network.**

## The audit log

The change log records who changed what and when. It is off by default and
switched on in the settings; sign-ins, failed sign-ins and exports of
subscription links are recorded either way. Secret-looking fields (passwords,
keys, tokens, credentials, subscription addresses) are replaced with
`[redacted]` when written and again when read. Only the main admin can read or
clear it, and clearing it is recorded too. See [[use/audit]].

## Recovery

`nx-panel admin reset-password`, run on the panel's server, sets a new
password for an account (the owner by default), turns its two-factor sign-in
off, ends its sessions and removes its single sign-on links. A lost phone and a
lost password are one recovery, and the command stays the one way back in. See
[[start/install-panel]].
