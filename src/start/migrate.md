---
title: "Move from another panel"
description: "Copy users, inbounds, routing and admins from another VPN panel into NX with the nx-migrate wizard."
order: 7
tags: [migration, install]
---

# Move from another panel

**nx-migrate** is a small program that copies the users and settings of
another VPN panel into NX: credentials, remaining traffic, expiry dates,
inbounds, outbounds, routing, DNS and admins. Where the old panel's link shape
allows it, your customers keep the subscription link they already have.

It runs as a local web wizard on your computer or on a server, reads the old
panel, and writes into your NX panel through its API.

## Which panels

| Panel | Read from | What comes across |
| --- | --- | --- |
| **s-ui** | its database file, or the running panel | users, inbounds, outbounds, endpoints, routing, DNS, admins |
| **3x-ui** | its database file, or the running panel | users, inbounds, WireGuard as endpoints, outbounds, routing, DNS, admins |
| **x-ui** (the original and its forks) | its database file, or the running panel | the same as 3x-ui |
| **Marzban** | the running panel | users, admins, inbounds, outbounds, routing, DNS |
| **PasarGuard** | the running panel | the same as Marzban; each core configuration becomes its own template |
| **Hiddify** | the running panel | users and admins |
| **Marzneshin** | the running panel | users and admins |
| **Remnawave** | the running panel | users |

s-ui, 3x-ui and x-ui keep everything in one SQLite file, which you can copy off
the server and drop on the page; the old panel does not have to be running.
3x-ui and x-ui both call their file `x-ui.db` but store routing differently:
choose **3x-ui** for 3x-ui and **x-ui** for the original x-ui and its forks. With
the wrong choice, users still come across but routing and outbounds arrive
empty, and the wizard warns you.

The other panels are read through their own API, with a sudo admin's login or
an API key.

## Run it

Download it for your system from
[the releases page](https://github.com/nx-panel/nx-migrate/releases/latest)
(Windows, Linux and macOS). On Linux:

```bash
curl -LO https://github.com/nx-panel/nx-migrate/releases/latest/download/nx-migrate-linux-amd64.tar.gz
tar -xzf nx-migrate-linux-amd64.tar.gz
./nx-migrate
```

On Windows, unzip it and double-click `nx-migrate.exe`. On macOS, remove the
download quarantine once with `xattr -d com.apple.quarantine nx-migrate`.

It prints a link such as `http://127.0.0.1:8787/?key=…`. Open it in your browser.
The key works once, and the wizard listens only on `127.0.0.1`. To run it on a
server, do not open a port; reach it through an SSH tunnel and open the link on
your own computer:

```bash
ssh -L 8787:127.0.0.1:8787 root@203.0.113.10
```

`-listen 127.0.0.1:9000` picks another port and `-no-browser` only prints the
link.

## The five steps

1. **Source panel.** Choose the old panel, then give its database file or its
   address. Paste the address exactly as you open it, including any secret path.
2. **Review and select.** Every converted item is listed in groups. Tick
   everything, a group or single rows. A yellow row comes across with a change
   its note explains. A red row cannot come across and is listed so you know.
3. **Connect NX.** Your NX panel's address, and a username and password
   or an API token. With two-factor sign-in, also the current code.
4. **Preview.** Exactly what will be created, the room left in your licence, and
   names that already exist. Nothing has been written yet.
5. **Transfer.** Progress is shown live. At the end you can save a report.

## What to know before the transfer

- **Subscription links.** NX also answers the old `/sub/{token}` links. For
  s-ui, 3x-ui, x-ui, Marzban and PasarGuard, existing links keep working once
  the old domain points at NX. Marzneshin, Hiddify and Remnawave users get
  new links; the wizard says so per user.
- **One set of credentials per user.** NX keeps one UUID and one password per
  user. Where the old panel had one per protocol, the UUID comes from
  VLESS/VMess and the password from Trojan/Shadowsocks, and the row names what was
  dropped.
- **Inbounds are converted into NX's format.** Settings with no equivalent
  in NX, such as fallbacks, mux and TCP header obfuscation, are dropped with
  a note on the row. A REALITY inbound without a private key gets a new key, so
  its users need new links. Check each inbound before you put it on a node.
- **The `direct` outbound.** NX gives every node a `direct` outbound itself,
  so the old one is not created again and rules that named it use NX's.
- **WireGuard peers** come across on their endpoint as written. They do not
  become NX users.
- **Nodes are paused during the transfer** and synced once at the end, to avoid
  thousands of updates. They are switched back on even if the transfer fails.
- **Admin passwords cannot be moved.** Imported admins get a generated password,
  shown once on the last page and saved nowhere. Write it down.

## After the move

The imported inbounds, outbounds and rules are grouped in an NX
[[~template]]. Assign that template to your nodes, then check that the nodes
connect and the links work ([[first-user]]).

While it runs, the program holds the logins of both panels. It keeps nothing
afterwards: a dropped database file is deleted when it closes, and the report is
saved only when you ask.
