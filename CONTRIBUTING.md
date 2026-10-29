# Writing for docs.nx-panel.org

This is the style guide every page follows, whoever writes it. The reader is
an **operator**: someone who runs a VPN service for customers on their own
servers. They know Linux and networking, they are busy, and many of them read
this in their second language. Write for that person.

## Voice

- Plain, direct sentences. Second person ("you"), present tense, active voice.
- Say what a thing does and when to use it, then how. No marketing, no
  "powerful", "seamless", "simply", "just".
- One idea per sentence. Short paragraphs. Prefer a numbered list for a
  procedure and a table for a set of options.
- Name controls exactly as the panel's English interface does, in **bold**
  (`nx-panel/frontend/src/i18n/locales/en.ts` holds every label).
- No em-dash-heavy asides, no "not X but Y" constructions, no rhetorical
  questions.

## A page

```md
---
title: "Users"                       # keep; it is the sidebar entry
description: "One line: what this page lets the reader do."
order: 5                             # keep (sidebar position)
group: customers                     # keep where present
tags: [users]                        # only tags from .vitepress/tags.ts
---

# Users

One or two sentences: what this page covers and who needs it.

<NxShot page="users" alt="The users page: a summary strip above a list of accounts" />

## A section per task or concept
```

- The H1 repeats the title. Sections are H2, sub-sections H3; never skip a level.
- Put a screenshot near the top of a page about a panel page (see below).
- Use VitePress containers for asides: `::: tip`, `::: warning`, `::: danger`
  (danger only for data loss or lock-out).
- Length: a "Get started" page 40–150 lines, a "Use the panel" page 80–250,
  a "How it works" page 80–250. Cover what an operator needs; skip what the
  form already makes obvious.

## Links

- Between pages, wiki-style: `[[users]]`, `[[use/users|the users page]]`,
  `[[inbounds#tls]]` (a heading's anchor). A link resolves in the page's own
  language; one that leads nowhere fails the build.
- The first time a page uses a glossary word, link it as a term:
  `[[~inbound|inbounds]]` (definitions in `src/reference/glossary.md`). Once per
  page is enough.
- External links only to `github.com/nx-panel/*`, `nx-panel.org`,
  `addons.nx-panel.org`, and an app's own site when the page is about using
  that app.

## Pictures

- `<NxShot page="NAME" alt="what the picture shows" />` shows a panel screen in
  the reader's theme (and Persian for Persian pages). Available names:
  `dashboard nodes tunnels users plans certificates templates inbounds
  outbounds endpoints rule-sets fronting settings subscriptions ingress backup security
  update webhooks telegram email backup-destinations sso addons admins roles
  tokens audit license`, plus `setup-wizard node-install user-new inbound-new`.
- `<NxDiagram id="ID" />` draws a diagram from `.vitepress/diagrams.ts`. A new
  diagram goes there with its words in all four languages; boxes with a `note`
  make a click-through walk.
- A shell session that is worth watching (an install) can be a
  ```` ```terminal title="root@server: ~" ```` fence: lines starting with `$ `
  are commands, the rest output. Use it sparingly; plain ```` ```bash ```` for
  anything a reader copies.
- `<NxCommandBuilder />` is the install command builder (Get started only).

## Facts

- State only what the sources say: the panel and node guides
  (`panel/docs/en`, `node/docs/en`), the Shop and notifier docs, the migration
  guide, the addon kit's `SPEC.md`, and the panel's own behaviour. If unsure,
  leave it out.
- Example addresses only: `203.0.113.x`, `198.51.100.x`, `2001:db8::/32`,
  `example.com` and its sub-domains.
- No prices, no release plans, no project history, no names of other panels
  except as migration sources (`nx-migrate` imports from s-ui, 3x-ui,
  x-ui, Marzban, PasarGuard, Hiddify, Marzneshin, Remnawave).
- Never cite source files, functions, commits or internal plan documents. The
  reader has the product, not its source.

## Two rules that are never bent

**1. Client software is named as client software; NX's server side is
described in NX's terms.** It is fine to say a *sing-box subscription*,
*sing-box apps (SFA, Karing, NekoBox)*, *Xray-based apps (v2rayNG, v2rayN,
Streisand, Happ)*, the `singbox` and `xray` format names, or that an option is
*what Xray-based clients call Mux*. It is never fine to say or imply that the
node or the panel is built on, contains, forks, embeds, wraps or follows the
code of sing-box or Xray, to name their versions as the node's, or to mention
their licences or authors. Describe the node as "the node" and its engine as
"NX's core". `scripts/check-core-names.mjs` checks every paragraph.

**2. Nothing that helps someone find, fingerprint or block a server, or break
the licence.** Describe a protection feature by what it achieves and how to
switch it on, never by how it hides on the wire. No default patterns beyond
what the public installer already prints. Nothing about how the licence is
checked, bound to hardware or verified, beyond what an operator does in the
**License** page. No keys, tokens or real hostnames.

## Before you finish

```sh
node scripts/check-core-names.mjs src .vitepress
npx vitepress build      # broken [[links]] and unknown tags fail here
npm run check            # everything CI runs
```
