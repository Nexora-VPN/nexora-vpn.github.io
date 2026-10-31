---
title: "Build a subscription page theme"
description: "Write your own subscription page: what a theme is, the starter to copy, every value the panel hands it, the helper functions, app import links and live refresh."
order: 12
group: authors
tags: [subscriptions]
---

# Build a subscription page theme

This page is for anyone who wants their users to see their own design when
they open their subscription address in a browser. A theme replaces the
[[~subscription-page|subscription page]] for every user of the panel. It is
one HTML file, with any images and styles beside it, that the panel fills in
with the user's data. Choosing a theme and the page's other settings are
covered in [[use/subscriptions#the-subscription-page]].

## What a theme is

A theme is a directory in the panel's themes directory:

```
sub-themes/
└── aurora/
    ├── index.html     the page (or sub.html)
    ├── style.css
    └── logo.svg
```

- `index.html` is a [Go `html/template`](https://pkg.go.dev/html/template):
  ordinary HTML with `{{ … }}` placeholders the panel fills in on every
  visit. The panel escapes every value for the place it lands, so a user's
  remark cannot add markup to the page.
- Other files in the directory are served at `{{ .AssetBase }}/<name>`:
  `<link rel="stylesheet" href="{{ .AssetBase }}/style.css">`. Files whose
  name starts with a dot are never served.
- The directory's name is the theme's name in the panel: letters, digits,
  `.`, `_` and `-`, up to 64 characters.
- A literal `<title>` names the theme in the panel's picker. A title with a
  placeholder in it leaves the picker showing the directory's name.
- There is no build step. The panel reads the file again within a few
  seconds of an edit, with no restart.
- A theme that fails to load or to render falls back to the built-in violet
  page, so a mistake never costs a user their subscription. The panel's log
  says what went wrong.

A theme can only format what the panel gives it. It cannot reach the
database, the disk or the network.

## Start from the starter

The public repository
[`github.com/nx-panel/sub-themes`](https://github.com/nx-panel/sub-themes),
licensed MIT, holds:

| Directory | What it is |
| --- | --- |
| `starter/` | The smallest complete page, commented to be copied: status, usage, expiry, the QR code, app buttons, each configuration, config files, notices and live refresh. One HTML file and one stylesheet. |
| `builtin/violet/`, `builtin/amber/` | The panel's own two pages. Larger, and good to borrow from: tabs, a usage ring, the traffic history chart. |
| `check/` | `go run ./check` parses every theme the way the panel does. |

1. Copy `starter/` to a directory with your theme's name.
2. Put it on a panel (below) and open a user's page.
3. Change the HTML and the stylesheet. Delete any section you do not want:
   the sections do not depend on each other.
4. Run `go run ./check` from the repository before you install or share it.

## Install and preview

1. Copy the theme's directory into the themes directory on the panel's
   server: `/var/opt/nx-panel/sub-themes/` on a standard install,
   `./sub-themes/` next to the compose file in Docker. The main admin can
   point **Themes directory** somewhere else.
2. In **Settings → Subscriptions → Subscription page**, click
   **Rescan the themes directory** and pick the theme under **Theme**.
3. Open a user's subscription address with `/page` added, such as
   `https://sub.example.com/sub/<token>/page`. That address always shows the
   page, even to an app.
4. Add `?lang=fa` (or `en`, `ru`, `zh`) to see the page in another language.

To try a theme without switching every user to it, give a branding that
theme and attach it to a test [[~reseller]] or to a route on a test host
([[use/ingress#brandings]]). Only subscriptions that take that branding see
it.

## The data a theme receives

The page is filled in from one value, written `.` in the template. Fields are
addressed by the names below: `{{ .User.Name }}`, `{{ .Usage.UsedText }}`.
Inside a `{{ range }}`, `.` is the item; reach the page's value with `$`, as
in `{{ index $.T "copy" }}`.

### The account: `.User`

| Field | |
| --- | --- |
| `.Name`, `.Remark`, `.Desc`, `.Group` | The account's name, remark, description and label |
| `.SubID` | The subscription token |
| `.Enable` | Whether the account is switched on |
| `.Online` | Traffic in the last 90 seconds |
| `.OnlineAt` | Unix seconds of the last traffic; `0` for never |
| `.Status` | One word: `active`, `disabled`, `pending`, `expired` or `limited`. `disabled` wins over the others; `pending` is a plan that starts on first connection and has not started |

### Traffic: `.Usage`

| Field | |
| --- | --- |
| `.Up`, `.Down`, `.Used` | Bytes in the current period |
| `.Total` | The quota in bytes; `0` when there is no limit |
| `.Remaining` | Bytes left |
| `.Percent` | `0` to `100`; `0` when there is no limit |
| `.Unlimited` | No traffic limit |
| `.UsedText`, `.TotalText`, `.RemainingText` | The same, written for people, such as `2.0 GB`. `.RemainingText` is `∞` with no limit |
| `.TotalUp`, `.TotalDown`, `.Lifetime`, `.LifetimeText` | Totals that survive the periodic reset |

### Expiry and reset: `.Expire`, `.Reset`

| Field | |
| --- | --- |
| `.Expire.At` | Unix seconds; `0` for never |
| `.Expire.Never`, `.Expire.Expired` | No expiry; already expired |
| `.Expire.Days` | Days left, rounded up; `0` once expired |
| `.Expire.Pending` | The plan starts on the first connection and has not started |
| `.Expire.Duration` | The plan's length in seconds; `0` for a fixed date |
| `.Reset.Auto`, `.Reset.Days`, `.Reset.Next` | The periodic traffic reset: on or off, every how many days, and the next one in unix seconds |

::: warning Check `.Expire.Pending` before you print a date
A plan that starts on the first connection carries a provisional date that
moves when the user connects. `.Expire.Days` is then the whole plan. Write
something like "30 days, from your first connection", as the starter does.
:::

### Ways to connect: `.Configs`, `.Links`, `.Apps`

`.Configs` is one entry per connection the user has:

| Field | |
| --- | --- |
| `.Name` | The entry's name, as apps show it |
| `.Protocol`, `.Network`, `.Security` | Such as `vless`, `ws`, and `reality`, `tls` or `none` |
| `.Address` | Server and port, ready to show: `203.0.113.10:443`, `[2001:db8::1]:443` |
| `.Server`, `.Port` | The same, apart |
| `.Link` | The share link |

Show `.Address`. Writing `{{ .Server }}:{{ .Port }}` yourself turns an IPv6
server into `2001:db8::1:443`, which reads as neither.

`.Links` is the same share links as a plain list.

`.Apps` is the config files for WireGuard, OpenVPN and OpenConnect users:
`.Name`, `.Type`, `.FileName` and `.Content`, the whole file. Offer a QR code,
a download and a copy button:

```html
{{ range .Apps }}
  {{ $code := qr .Content }}
  {{ if $code }}{{ $code }}{{ else }}<p>{{ index $.T "qrTooBig" }}</p>{{ end }}
  <a download="{{ .FileName }}" href="{{ dataURI "text/plain" .Content }}">{{ index $.T "download" }}</a>
  <button data-copy="{{ .Content }}">{{ index $.T "copy" }}</button>
{{ end }}
```

### The subscription: `.Sub`

| Field | |
| --- | --- |
| `.URL` | The user's subscription address |
| `.URLs` | The address for each format, read as `{{ index .Sub.URLs "clash" }}`: `clash` is `<subscription>/clash`, `singbox` is `/singbox`, `xray` is `/xray`, `plain` is `/plain`, and `v2ray` is the address itself |
| `.UpdateInterval` | How many hours apps are told to wait between refreshes |
| `.Incy`, `.V2RayTun` | Ready import links for INCY and V2RayTun, encrypted once you store the app's key ([[use/subscriptions#encrypted-import-links]]). Use each as a whole `href` |

### The traffic history: `.Chart`

The user's traffic, already laid out as bars, so the page draws it with no
script.

- `.Chart.Recording` is false when the panel keeps no traffic history. Draw
  nothing then.
- `.Chart.Ranges` is the periods in order: 24 hourly bars, then 7 and 14
  daily ones. Each has `.Key`, `.LabelKey` (a phrase in `.T`), `.Default`
  (the one to show first), `.Width`, `.Empty`, `.MaxText`, `.TotalText` and
  `.Points`.
- Each point is one bar: `.At`, `.Label`, `.Up`, `.Down`, `.Text`, and its
  position `.X`, `.W`, `.DownY`, `.DownH`, `.UpY`, `.UpH`.

```html
{{ range .Chart.Ranges }}{{ if .Default }}
<svg viewBox="0 0 {{ .Width }} {{ $.Chart.Height }}" preserveAspectRatio="none">
  {{ range .Points }}
  <rect x="{{ .X }}" y="{{ .DownY }}" width="{{ .W }}" height="{{ .DownH }}" fill="#6d4aff"/>
  <rect x="{{ .X }}" y="{{ .UpY }}" width="{{ .W }}" height="{{ .UpH }}" fill="#b9a8ff"/>
  {{ end }}
</svg>
{{ end }}{{ end }}
```

Bars start on the panel's local midnight and hour. They show the traffic
that crossed the wire, which can differ from `.Usage` on a node with a
traffic multiplier, or after a reset. The built-in pages switch between the
ranges with radio buttons and no script.

### Your settings and the rest

| Field | |
| --- | --- |
| `.Panel.Title`, `.Panel.SupportURL`, `.Panel.Announce` | **Profile title**, **Support link** and **Announcement** |
| `.Panel.Version` | The panel's version |
| `.Notices` | Short warnings for users, already translated, each with a stable `.Key` and its `.Text`. Range over them, so a notice added later shows with no change to your theme |
| `.Lang`, `.Dir` | The page's language (`en`, `fa`, `ru`, `zh`) and direction (`ltr`, `rtl`) |
| `.T` | The built-in page's phrases in that language: `{{ index .T "copy" }}` |
| `.AssetBase` | Where the theme's own files are served |
| `.Now`, `.Timezone` | The time of the visit, in unix seconds, and the panel's timezone |

## Helper functions

| Function | Example |
| --- | --- |
| `bytes` | `{{ bytes .Usage.Up }}` → `2.0 GB` |
| `date`, `datetime` | `{{ date .Expire.At }}` → `2026-11-03` |
| `when` | `{{ when .User.OnlineAt .T }}` → `Today 09:30` |
| `num` | `{{ num .Expire.Days }}` → `40` |
| `qr` | `{{ qr .Sub.URL }}` → a QR code as inline SVG, or nothing for text too long for one |
| `dataURI` | `href="{{ dataURI "text/plain" .Content }}"` for a download |
| `b64` | `{{ b64 .Sub.URL }}` → base64 |
| `default` | `{{ default "Subscription" .Panel.Title }}` |
| `hasPrefix` | `{{ if hasPrefix "vless" .Protocol }}…{{ end }}` |
| `json` | `<script>var configs = {{ json .Configs }}</script>` |
| `urlquery` | Percent-encodes a value, for an address built inside a script |

On a Persian page `date`, `datetime` and `when` write the Solar Hijri date,
and they, `bytes` and `num` write Persian digits: `{{ date .Expire.At }}`
gives `۱۴۰۵/۰۸/۱۲`. Pass any number you print yourself through `num`, and
never an address, a port or a link. Join two figures with
`{{ index .T "sep" }}`, which is ` · ` in most languages and `، ` in
Persian.

Always keep the result of `qr` in a variable and test it, as the
`.Apps` example above does. A long config file has no QR code, and an
untested `qr` leaves an empty gap.

## Buttons that add the subscription to an app

Each app opens its own kind of link:

| App | `href` | The address goes |
| --- | --- | --- |
| Happ | `happ://add/{{ .Sub.URL }}` | In the path |
| V2RayTun | `{{ .Sub.V2RayTun }}` | The whole link |
| INCY | `{{ .Sub.Incy }}` | The whole link |
| Streisand | `streisand://import/{{ .Sub.URL }}` | In the path |
| Hiddify | `hiddify://import/{{ .Sub.URL }}` | In the path |
| Shadowrocket | `shadowrocket://add/sub://{{ b64 .Sub.URL }}` | Base64, in the path |
| v2rayNG | `v2rayng://install-sub?url={{ .Sub.URL }}` | Query |
| V2Box | `v2box://install-sub?url={{ .Sub.URL }}&name={{ .Panel.Title }}` | Query |
| NekoBox | `sn://subscription?url={{ .Sub.URL }}&name={{ .Panel.Title }}` | Query |
| sing-box apps (SFA, SFI) | `sing-box://import-remote-profile?url={{ index .Sub.URLs "singbox" }}` | Format address, query |
| Clash apps (Clash Meta, mihomo) | `clash://install-config?url={{ index .Sub.URLs "clash" }}` | Format address, query |

Write a value after `?url=` as it is. The template encodes it for you, and
encoding it again with `urlquery` gives an address no app can read. Clash and
sing-box apps get their own format's address, so the import works whether or
not the panel recognises the app.

## Keep usage live

The page is drawn once, when it opens. To keep usage and the online dot
current, fetch the same data as JSON:

| Address | Answers |
| --- | --- |
| `<subscription>/info` | Everything above as JSON, with lower-case names (`usage.usedText`, `user.online`). The share links, the config files' contents and the chart are left out |
| `<subscription>/info?chart=1` | The same, with the chart |

```html
<span data-info="usage.usedText">{{ num .Usage.UsedText }}</span>
<script>
  var INFO = {{ .Sub.URL }} + "/info";
  setInterval(function () {
    fetch(INFO, { cache: "no-store" }).then(function (r) { return r.json() }).then(function (info) {
      document.querySelectorAll("[data-info]").forEach(function (el) {
        el.textContent = el.dataset.info.split(".").reduce(function (v, k) { return v && v[k] }, info)
      })
    })
  }, 30000)
</script>
```

A value printed into a `<script>` is written as a JavaScript string for you.
JSON figures come in Western digits: the starter shows how to turn them into
Persian ones on a Persian page. Poll no more than every 30 seconds, and ask
for the chart only when you redraw it.

## Languages and right to left

The page's language comes from `?lang=` in the address, otherwise from the
browser, otherwise English.

- Put `lang="{{ .Lang }}" dir="{{ .Dir }}"` on `<html>`. Persian pages are
  right to left.
- Write the stylesheet with logical properties (`margin-inline-start`,
  `border-inline-start`, `text-align: start`) so one set of rules lays out
  both directions.
- Use `.T` for the words, or carry your own for all four languages. A word
  missing in one language leaves an empty element.

## Rules worth keeping

- **Load nothing from another host.** Users open this page before their VPN
  is connected, often on a network that blocks font and script CDNs. A theme
  that waits for one shows a blank page. Ship fonts and images in the theme's
  directory, or use system fonts.
- Test `qr` before you print it.
- Check `.Expire.Pending` before you print a date.
- Show `.Address`, never `.Server` and `.Port` joined by hand.
- Range over `.Notices` instead of writing their text yourself.

## Share your theme

Send a pull request to
[`nx-panel/sub-themes`](https://github.com/nx-panel/sub-themes) with your
theme as a new top-level directory and a short `README.md` with a
screenshot. The repository's README lists what a theme there must do. Every
theme there is MIT licensed, so operators can change it for their service.

## Related

- [[use/subscriptions]]: picking a theme, the title, support link and
  announcement, and turning the page off.
- [[how/subscriptions]]: how the entries on the page are put together.
- [[build]]: writing an addon, for features a theme cannot reach.
