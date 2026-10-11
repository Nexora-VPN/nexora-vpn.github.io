# Nexora documentation

The source of **https://docs.nexora-panel.org** — how to install, run and
extend Nexora, in English, Persian, Russian and Chinese.

Found a mistake? Every page has an *Edit this page* link; pull requests and
issues are welcome.

## Layout

| path | what |
|---|---|
| `src/` | English pages (the root locale) |
| `src/fa/`, `src/ru/`, `src/zh/` | the same pages, same paths, translated |
| `src/public/` | images and files served as they are; `CNAME` pins the domain |
| `.vitepress/` | site configuration and the Nexora theme |
| `scripts/` | the checks CI runs |

## Work on it

```sh
npm ci
npm run dev      # http://localhost:5173
npm run check    # everything CI checks, then a full build
```

## Writing pages

Pages are written by the rules in [CONTRIBUTING.md](CONTRIBUTING.md): voice,
page shape, pictures, and the two rules no page may break.

Building blocks a page can use:

| write | gives |
|---|---|
| `<NxShot page="users" alt="…" />` | a screenshot of that panel page in the reader's theme (`src/public/shots/<lang>/`, taken by the demo fleet's `shots.sh`) |
| `<NxDiagram id="overview" />` | a diagram from `.vitepress/diagrams.ts`; boxes with a `note` make a click-through walk |
| a ```` ```terminal title="…" ```` fence | an animated terminal: `$ ` lines are commands |
| `<NxCommandBuilder />` | the install command builder |
| `<NxApi />` | the API reference, from `src/public/openapi.yaml` |

The sidebar is built from the pages: a section per directory, ordered by each
page's `order`, grouped by its `group`. Every build also writes `llms.txt` and
`llms-full.txt` (the English pages as plain text, for AI assistants). A tag
`v…` publishes an offline copy of the whole site on the releases page
(`.github/workflows/offline.yml`).

Front-matter carries `title`, a one-line `description` and `tags` (only the
tags listed in `.vitepress/tags.ts`; an unknown one fails the build).

Link between pages wiki-style; a link is resolved in the page's own language,
and one that leads nowhere fails the build:

| write | gives |
|---|---|
| `[[users]]` | the page whose path ends in `users`, titled with its title |
| `[[use/users\|text]]` | that page with your own text |
| `[[users#limits]]` | a heading on that page |
| `[[~inbound]]` | a glossary term: a link with a hover card (`src/reference/glossary.md`, `## Term {#id}`) |

Every page lists the pages that link to it and the pages sharing its tags.
Search is per language and understands Persian spelling variants
(ي/ی, ك/ک, the zero-width non-joiner, Persian digits) and Chinese words.

## Rules a change must pass

- **Every page in every language.** A page added in English needs its `fa`,
  `ru` and `zh` files at the same path (`scripts/check-locales.mjs`).
- **Nothing loads from another host.** Fonts, icons and scripts are bundled;
  many CDNs are slow or blocked where Nexora is used (`scripts/check-dist.mjs`).
- **Images are small and described.** ≤ 500 KB each, alt text always
  (`scripts/check-images.mjs`).
- **Client software is named as client software.** A sing-box subscription
  or Xray-based apps are fine to name as what a customer's device runs; the
  pages describe Nexora's own server side in Nexora's terms
  (`scripts/check-core-names.mjs`).
- **Nothing that helps someone find or block a server.** Protection features
  are described by what they do and how to turn them on, not by how they work
  on the wire.
- Example addresses only: `203.0.113.x`, `198.51.100.x`, `example.com`.

## Deploy

Every push to `main` builds and publishes to GitHub Pages
(`.github/workflows/deploy.yml`). This repository is the organisation's own
Pages site (`nexora-vpn.github.io`) with the custom domain
`docs.nexora-panel.org`, so the site answers only there: every address under
`nexora-vpn.github.io` redirects to the same path on the domain. A Pages site
in another repository of the organisation would be served under this domain
too (`docs.nexora-panel.org/<repo>`), so none should be switched on.

Licence: text and images CC BY 4.0, code MIT — see `LICENSE.md`.
