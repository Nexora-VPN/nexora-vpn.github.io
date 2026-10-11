---
title: "Troubleshooting"
description: "Common problems by symptom: the panel, nodes, users who cannot connect, empty subscriptions and failing backups."
order: 6
tags: [reference]
---

# Troubleshooting

Problems by what you see, with the usual cause first. Two places help with most
of them: the service log (`journalctl -u nexora-panel -n 50` on the panel,
`journalctl -u nexora-node -n 50` on a node) and the node's row on the
**Nodes** page, whose status shows the last error when you point at it.

## The panel does not open after install

- **The port is closed.** The installer picked a random port and printed it.
  Open it in the server's firewall, and in your cloud provider's firewall or
  security group if it has one.
- **The wrong address.** The installer prints one link per address it found.
  Use the one that reaches the server from where you are: on a VPS that is
  usually the public one, marked "as the internet sees this host". Inside a
  container most of the others reach nothing.
- **An IPv6 link without brackets.** Paste it whole:
  `http://[2001:db8::10]:28431/setup?t=…`.
- **The page says "not found".** Until setup is finished, the panel answers only
  the full setup link with its token. Print the token again with
  `nexora-panel setup-token` (see [[install-panel#lost-the-link]]).

## The panel does not open after the setup wizard

The wizard moved the panel to the address it showed under **The panel will be
reachable at**: usually `https://`, a new port if you changed it, and the panel
path.

- **The path is part of the address.** Opening the server's address without it
  answers "not found".
- **A certificate warning** is expected: the panel's own certificate is
  self-signed. Accept it once.
- **With a panel domain set,** the panel answers on that name. Make sure it
  points at the server.
- **Still nothing?** Every address setting can be reset from the server's
  command line: [[reference/cli#locked-out]].

## Locked out

- **Forgotten password:** `nexora-panel admin reset-password`. It also turns off
  two-factor authentication for the account.
- **Banned after failed logins:** add your address to `login_allowlist`, and set
  `trusted_proxies` if the panel sits behind a proxy or a CDN.
- **Unreachable address, domain or path:** `nexora-panel config set …` and a
  restart.

All three are in [[reference/cli#locked-out]].

## A node stays on Connecting or Error

The node runs but the panel cannot reach it, or reaches it and is refused.
Check in this order:

```bash
systemctl status nexora-node          # on the node
journalctl -u nexora-node -n 50       # on the node
nc -vz 198.51.100.20 62050            # from the panel server
```

- **A firewall** that does not let the panel's address in on port 62050 is the
  usual cause; a cloud security group is the second. If the panel reaches the
  node over IPv6, the rule must be an IPv6 rule.
- **The node was reinstalled.** A reinstall makes a new certificate, and the
  panel still expects the old one. Use **Re-pin** in the node's menu, or delete
  the node in the panel and add it again.
- **The server was replaced.** Use **Move to another server** in the node's
  menu instead of only changing its address, then install on the new server.
- **The node shows Switched off.** It was disabled, by you or by its usage limit
  (**Disabled by usage limit**). A switched-off node serves nothing.

## The node install fails

- **`node binary not provisioned`.** The panel has no node binary for this
  server's architecture. It stages amd64 and arm64. Put the right one on the
  **panel** server and run the command again with a fresh token:

  ```bash
  curl -fsSL -o /tmp/node.tar.gz \
    https://github.com/nexora-vpn/node/releases/latest/download/nexora-node-linux-armv7.tar.gz
  tar -C /tmp -xzf /tmp/node.tar.gz
  install -m 0755 /tmp/nexora-node/nexora-node /var/opt/nexora/bin/nexora-node-linux-armv7
  ```

  Or add `--source github` to the command so the node server downloads the
  release itself.
- **`invalid token` or `token already used`.** An install token works once and
  for a limited time. Open the node's **Install** drawer again for a new
  command.
- **Over SSH, the host key does not match.** The server shows a different SSH
  key from the one the panel remembered. Either the machine was replaced (use
  **Move to another server**) or something is between you and it.

## The node is connected but serves nothing

- **No template.** A node serves only what its template carries. Edit the node
  and choose one.
- **Items not applied.** The node's row says how many items it could not apply
  (**Not applied on the node**), and **Last engine error** shows the node's last
  error. The rest of the configuration still runs. Fix the items it names.

## Users cannot connect

- **Mux is on.** In v2rayNG, v2rayN, Streisand and other Xray-based apps, the
  **Mux** switch must be off. With it on, the connection fails with no useful
  error. The subscription page warns about it under **Advanced**.
- **The link names the wrong address.** Links use the node's address, or its
  **Link addresses** when you set some. A node added as `127.0.0.1` or by a
  private address needs its public address there. See [[use/nodes]].
- **The port is closed on the node.** Open the inbound's port in the node
  server's firewall.
- **A certificate error.** An inbound with TLS and no server name makes the app
  check the certificate against the address, so the node's certificate must name
  that address (IPv6 included). A domain must be on the certificate too. See
  [[use/certificates]].
- **The inbound changed.** Some changes, such as VLESS Encryption or an XHTTP
  inbound's advanced settings, need every user to import the link again.
- **The app cannot use that inbound.** sing-box apps have no XHTTP or VLESS
  Encryption, so their subscriptions leave those inbounds out. Offer those users
  another inbound.

## The app or the subscription shows nothing

- **v2rayNG** updates only the subscription group that is on screen. Select
  the new group's tab, then update.
- **No links for the user.** **QR / Links** says "No links" when none of the
  user's templates is on a node with inbounds. Give a node a template with an
  inbound, and check the user's **Templates**.

How a subscription is put together is in [[use/subscriptions]].

## Backups fail

- **A scheduled backup never appears.** Check that the schedule is on under
  **Settings → Backup** and that the backup directory is an absolute path. The
  schedule is read once an hour.
- **An upload to a destination fails.** The archive is still on the server; the
  destination shows the error and the next archive is sent again. For S3, the
  bucket must already exist and the key must be allowed to write, list and
  delete. For SFTP, a rebuilt server has a new host key: clear the saved **Host
  key**. For Telegram, files over 50 MB are refused. See
  [[backup-destinations]].
- **A restore says the licence will not validate.** The archive came from
  another server. Move the licence from the **License** page after restoring;
  see [[use/licence]].
- **An encrypted archive will not open.** It needs the passphrase it was taken
  with. A lost passphrase cannot be recovered.
