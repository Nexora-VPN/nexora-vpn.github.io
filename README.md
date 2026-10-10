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
(`.github/workflows/deploy.yml`). The site answers only on
`docs.nexora-panel.org`; `nexora-vpn.github.io/docs` redirects there.

Licence: text and images CC BY 4.0, code MIT — see `LICENSE.md`.
