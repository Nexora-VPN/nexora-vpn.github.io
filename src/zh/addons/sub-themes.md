---
title: "编写订阅页面主题"
description: "编写自己的订阅页面：主题是什么、可复制的入门主题、面板交给它的每个值、辅助函数、应用导入链接以及实时刷新。"
order: 12
group: authors
tags: [subscriptions]
---

# 编写订阅页面主题

本页面向希望用户在浏览器中打开订阅地址时看到自己设计的人。主题会替换面板上每个用户的[[~subscription-page|订阅页面]]。它是一个 HTML 文件，旁边可以放图片和样式表，由面板填入用户的数据。如何选择主题以及页面的其他设置见 [[use/subscriptions#the-subscription-page]]。

## 主题是什么 {#what-a-theme-is}

主题是面板主题目录中的一个目录：

```
sub-themes/
└── aurora/
    ├── index.html     the page (or sub.html)
    ├── style.css
    └── logo.svg
```

- `index.html` 是一个 [Go `html/template`](https://pkg.go.dev/html/template)：普通的 HTML，带有 `{{ … }}` 占位符，面板在每次访问时填充它们。面板会按每个值所在的位置对其转义，因此用户的备注无法往页面里添加标记。
- 目录中的其他文件通过 `{{ .AssetBase }}/<name>` 提供：`<link rel="stylesheet" href="{{ .AssetBase }}/style.css">`。名称以点开头的文件永远不会被提供。
- 目录名就是主题在面板中的名称：字母、数字、`.`、`_` 和 `-`，最多 64 个字符。
- 字面的 `<title>` 是主题在面板选择器中的名称。标题中含有占位符时，选择器显示目录名。
- 不需要构建步骤。修改后几秒内面板会重新读取文件，无需重启。
- 加载或渲染失败的主题会退回内置的紫罗兰页面，因此错误永远不会让用户失去订阅。面板日志会说明出了什么问题。

主题只能格式化面板交给它的内容。它无法访问数据库、磁盘或网络。

## 从入门主题开始 {#start-from-the-starter}

公开仓库 [`github.com/nx-panel/sub-themes`](https://github.com/nx-panel/sub-themes) 采用 MIT 许可，包含：

| 目录 | 内容 |
| --- | --- |
| `starter/` | 最小的完整页面，带注释，供复制使用：状态、用量、到期时间、二维码、应用按钮、每个配置、配置文件、通知以及实时刷新。一个 HTML 文件和一个样式表。 |
| `builtin/violet/`、`builtin/amber/` | 面板自己的两个页面。更大，适合借鉴：标签页、用量环、流量历史图表。 |
| `check/` | `go run ./check` 按面板的方式解析每个主题。 |

1. 把 `starter/` 复制到一个以你的主题命名的目录。
2. 把它放到面板上（见下文），打开某个用户的页面。
3. 修改 HTML 和样式表。删除任何不需要的部分：各部分互不依赖。
4. 安装或分享之前，在仓库中运行 `go run ./check`。

## 安装与预览 {#install-and-preview}

1. 把主题目录复制到面板服务器上的主题目录：标准安装下是 `/var/opt/nx-panel/sub-themes/`，Docker 下是 compose 文件旁边的 `./sub-themes/`。主管理员可以把 **主题目录** 指向其他位置。
2. 在 **设置 → 订阅 → 订阅页面** 中，点击 **重新扫描主题目录**，然后在 **主题** 中选中该主题。
3. 在某个用户的订阅地址后加上 `/page` 打开，例如 `https://sub.example.com/sub/<token>/page`。这个地址总是显示页面，即使是应用访问也一样。
4. 加上 `?lang=fa`（或 `en`、`ru`、`zh`）可以查看页面的其他语言版本。

要在不把所有用户都切换过去的情况下试用主题，可以给某个品牌外观设置该主题，并把它挂到一个测试用的[[~reseller|代理商]]或测试主机上的某条路由（[[use/ingress#brandings]]）。只有采用该品牌外观的订阅才会看到它。

## 主题接收的数据 {#the-data-a-theme-receives}

页面由一个值填充，在模板中写作 `.`。字段按下面的名称访问：`{{ .User.Name }}`、`{{ .Usage.UsedText }}`。在 `{{ range }}` 内部，`.` 是当前项；用 `$` 访问页面的值，例如 `{{ index $.T "copy" }}`。

### 账户：`.User` {#the-account-user}

| 字段 | |
| --- | --- |
| `.Name`、`.Remark`、`.Desc`、`.Group` | 账户的名称、备注、说明和分组 |
| `.SubID` | 订阅令牌 |
| `.Enable` | 账户是否已启用 |
| `.Online` | 最近 90 秒内有流量 |
| `.OnlineAt` | 最近一次流量的 Unix 秒数；从未有过时为 `0` |
| `.Status` | 一个词：`active`、`disabled`、`pending`、`expired` 或 `limited`。`disabled` 优先于其他值；`pending` 是从首次连接开始计算、尚未开始的套餐 |

### 流量：`.Usage` {#traffic-usage}

| 字段 | |
| --- | --- |
| `.Up`、`.Down`、`.Used` | 当前周期的字节数 |
| `.Total` | 以字节计的额度；不限时为 `0` |
| `.Remaining` | 剩余字节数 |
| `.Percent` | `0` 到 `100`；不限时为 `0` |
| `.Unlimited` | 没有流量限制 |
| `.UsedText`、`.TotalText`、`.RemainingText` | 同样的值，写成便于阅读的形式，例如 `2.0 GB`。不限时 `.RemainingText` 为 `∞` |
| `.TotalUp`、`.TotalDown`、`.Lifetime`、`.LifetimeText` | 不受周期重置影响的总量 |

### 到期与重置：`.Expire`、`.Reset` {#expiry-and-reset-expire-reset}

| 字段 | |
| --- | --- |
| `.Expire.At` | Unix 秒数；永不到期时为 `0` |
| `.Expire.Never`、`.Expire.Expired` | 永不到期；已经到期 |
| `.Expire.Days` | 剩余天数，向上取整；到期后为 `0` |
| `.Expire.Pending` | 套餐从首次连接开始计算，且尚未开始 |
| `.Expire.Duration` | 套餐时长，以秒计；固定日期时为 `0` |
| `.Reset.Auto`、`.Reset.Days`、`.Reset.Next` | 周期流量重置：是否开启、每隔多少天，以及下一次重置的 Unix 秒数 |

::: warning 打印日期之前先检查 `.Expire.Pending`
从首次连接开始计算的套餐带有一个临时日期，用户连接时它会变化。此时 `.Expire.Days` 是整个套餐的时长。请写成类似"30 天，从你首次连接时开始"的形式，入门主题就是这样做的。
:::

### 连接方式：`.Configs`、`.Links`、`.Apps` {#ways-to-connect-configs-links-apps}

`.Configs` 为用户的每个连接提供一个条目：

| 字段 | |
| --- | --- |
| `.Name` | 条目的名称，与应用中显示的相同 |
| `.Protocol`、`.Network`、`.Security` | 例如 `vless`、`ws`，以及 `reality`、`tls` 或 `none` |
| `.Address` | 服务器和端口，可直接显示：`203.0.113.10:443`、`[2001:db8::1]:443` |
| `.Server`、`.Port` | 同样的内容，分开给出 |
| `.Link` | 分享链接 |

请显示 `.Address`。自己写 `{{ .Server }}:{{ .Port }}` 会把 IPv6 服务器变成 `2001:db8::1:443`，既读不出地址也读不出端口。

`.Links` 是同样的分享链接，以普通列表给出。

`.Apps` 是 WireGuard、OpenVPN 和 OpenConnect 用户的配置文件：`.Name`、`.Type`、`.FileName` 和 `.Content`（整个文件）。请提供二维码、下载和复制按钮：

```html
{{ range .Apps }}
  {{ $code := qr .Content }}
  {{ if $code }}{{ $code }}{{ else }}<p>{{ index $.T "qrTooBig" }}</p>{{ end }}
  <a download="{{ .FileName }}" href="{{ dataURI "text/plain" .Content }}">{{ index $.T "download" }}</a>
  <button data-copy="{{ .Content }}">{{ index $.T "copy" }}</button>
{{ end }}
```

### 订阅：`.Sub` {#the-subscription-sub}

| 字段 | |
| --- | --- |
| `.URL` | 用户的订阅地址 |
| `.URLs` | 每种格式的地址，用 `{{ index .Sub.URLs "clash" }}` 读取：`clash` 是 `<subscription>/clash`，`singbox` 是 `/singbox`，`xray` 是 `/xray`，`plain` 是 `/plain`，`v2ray` 就是订阅地址本身 |
| `.UpdateInterval` | 告诉应用两次刷新之间等待多少小时 |
| `.Incy`、`.V2RayTun` | INCY 和 V2RayTun 的现成导入链接，保存应用的密钥后会变为加密形式（[[use/subscriptions#encrypted-import-links]]）。每个都作为完整的 `href` 使用 |

### 流量历史：`.Chart` {#the-traffic-history-chart}

用户的流量，已经排成柱状图，因此页面无需脚本即可绘制。

- 面板不保存流量历史时，`.Chart.Recording` 为 false。此时什么都不要绘制。
- `.Chart.Ranges` 是按顺序排列的各个时段：24 根按小时的柱，然后是 7 根和 14 根按天的柱。每个时段有 `.Key`、`.LabelKey`（`.T` 中的一个词句）、`.Default`（首先显示的那个）、`.Width`、`.Empty`、`.MaxText`、`.TotalText` 和 `.Points`。
- 每个点是一根柱：`.At`、`.Label`、`.Up`、`.Down`、`.Text`，以及它的位置 `.X`、`.W`、`.DownY`、`.DownH`、`.UpY`、`.UpH`。

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

柱从面板本地时间的午夜和整点开始。它们显示的是实际经过线路的流量，在设有流量倍率的节点上或重置之后，可能与 `.Usage` 不同。内置页面用单选按钮在各时段之间切换，不需要脚本。

### 你的设置及其他 {#your-settings-and-the-rest}

| 字段 | |
| --- | --- |
| `.Panel.Title`、`.Panel.SupportURL`、`.Panel.Announce` | **配置文件标题**、**客服链接** 和 **公告** |
| `.Panel.Version` | 面板的版本 |
| `.Notices` | 给用户的简短警告，已翻译好，每条都有一个稳定的 `.Key` 和它的 `.Text`。请遍历它们，这样以后新增的通知无需修改主题即可显示 |
| `.Lang`、`.Dir` | 页面的语言（`en`、`fa`、`ru`、`zh`）和方向（`ltr`、`rtl`） |
| `.T` | 内置页面在该语言下的词句：`{{ index .T "copy" }}` |
| `.AssetBase` | 主题自己的文件的提供位置 |
| `.Now`、`.Timezone` | 访问时间（Unix 秒数）和面板的时区 |

## 辅助函数 {#helper-functions}

| 函数 | 示例 |
| --- | --- |
| `bytes` | `{{ bytes .Usage.Up }}` → `2.0 GB` |
| `date`、`datetime` | `{{ date .Expire.At }}` → `2026-11-03` |
| `when` | `{{ when .User.OnlineAt .T }}` → `Today 09:30` |
| `num` | `{{ num .Expire.Days }}` → `40` |
| `qr` | `{{ qr .Sub.URL }}` → 内联 SVG 形式的二维码；文本太长无法编码时不输出任何内容 |
| `dataURI` | `href="{{ dataURI "text/plain" .Content }}"`，用于下载 |
| `b64` | `{{ b64 .Sub.URL }}` → base64 |
| `default` | `{{ default "Subscription" .Panel.Title }}` |
| `hasPrefix` | `{{ if hasPrefix "vless" .Protocol }}…{{ end }}` |
| `json` | `<script>var configs = {{ json .Configs }}</script>` |
| `urlquery` | 对值进行百分号编码，用于在脚本中拼接地址 |

在波斯语页面上，`date`、`datetime` 和 `when` 输出伊朗太阳历日期，它们以及 `bytes` 和 `num` 都输出波斯数字：`{{ date .Expire.At }}` 得到 `۱۴۰۵/۰۸/۱۲`。你自己打印的任何数字都请经过 `num`，但地址、端口和链接永远不要经过它。要连接两个数值，请用 `{{ index .T "sep" }}`，它在大多数语言中是 ` · `，在波斯语中是 `، `。

始终把 `qr` 的结果保存在变量中并加以判断，就像上面 `.Apps` 的示例那样。很长的配置文件没有二维码，不加判断的 `qr` 会留下一块空白。

## 把订阅添加到应用的按钮 {#buttons-that-add-the-subscription-to-an-app}

每个应用打开自己的一种链接：

| 应用 | `href` | 地址放在哪里 |
| --- | --- | --- |
| Happ | `happ://add/{{ .Sub.URL }}` | 路径中 |
| V2RayTun | `{{ .Sub.V2RayTun }}` | 整个链接 |
| INCY | `{{ .Sub.Incy }}` | 整个链接 |
| Streisand | `streisand://import/{{ .Sub.URL }}` | 路径中 |
| Hiddify | `hiddify://import/{{ .Sub.URL }}` | 路径中 |
| Shadowrocket | `shadowrocket://add/sub://{{ b64 .Sub.URL }}` | Base64，放在路径中 |
| v2rayNG | `v2rayng://install-sub?url={{ .Sub.URL }}` | 查询参数 |
| V2Box | `v2box://install-sub?url={{ .Sub.URL }}&name={{ .Panel.Title }}` | 查询参数 |
| NekoBox | `sn://subscription?url={{ .Sub.URL }}&name={{ .Panel.Title }}` | 查询参数 |
| sing-box 应用（SFA、SFI） | `sing-box://import-remote-profile?url={{ index .Sub.URLs "singbox" }}` | 格式地址，查询参数 |
| Clash 应用（Clash Meta、mihomo） | `clash://install-config?url={{ index .Sub.URLs "clash" }}` | 格式地址，查询参数 |

`?url=` 后面的值按原样写。模板会替你编码，再用 `urlquery` 编码一次会得到任何应用都读不了的地址。Clash 和 sing-box 应用拿到的是各自格式的地址，因此无论面板是否识别出该应用，导入都能成功。

## 保持用量实时更新 {#keep-usage-live}

页面只在打开时绘制一次。要让用量和在线状态点保持最新，请以 JSON 获取同样的数据：

| 地址 | 返回 |
| --- | --- |
| `<subscription>/info` | 上述全部内容的 JSON，名称为小写开头（`usage.usedText`、`user.online`）。不含分享链接、配置文件内容和图表 |
| `<subscription>/info?chart=1` | 同上，并包含图表 |

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

打印到 `<script>` 中的值会自动写成 JavaScript 字符串。JSON 中的数值使用西方数字：入门主题展示了如何在波斯语页面上把它们转换成波斯数字。轮询间隔不要短于 30 秒，只在重绘图表时才请求图表。

## 语言与从右到左 {#languages-and-right-to-left}

页面的语言取自地址中的 `?lang=`，其次取自浏览器，最后是英语。

- 在 `<html>` 上写 `lang="{{ .Lang }}" dir="{{ .Dir }}"`。波斯语页面是从右到左的。
- 用逻辑属性编写样式表（`margin-inline-start`、`border-inline-start`、`text-align: start`），这样一套规则就能排好两个方向。
- 文字用 `.T`，或者自己准备全部四种语言的文字。某种语言缺少一个词，就会留下一个空元素。

## 值得遵守的规则 {#rules-worth-keeping}

- **不要从其他主机加载任何内容。** 用户往往在 VPN 连接之前打开这个页面，所在的网络常常屏蔽字体和脚本 CDN。等待这类资源的主题会显示空白页面。请把字体和图片放在主题目录中，或者使用系统字体。
- 打印 `qr` 之前先判断它。
- 打印日期之前先检查 `.Expire.Pending`。
- 显示 `.Address`，不要手动拼接 `.Server` 和 `.Port`。
- 遍历 `.Notices`，不要自己编写通知的文字。

## 分享你的主题 {#share-your-theme}

向 [`nx-panel/sub-themes`](https://github.com/nx-panel/sub-themes) 发送拉取请求，把你的主题作为一个新的顶层目录，并附上一个带截图的简短 `README.md`。仓库的 README 列出了其中的主题必须满足的要求。那里的每个主题都采用 MIT 许可，因此运营者可以为自己的服务修改它们。

## 相关页面 {#related}

- [[use/subscriptions]]：选择主题，设置标题、客服链接和公告，以及关闭该页面。
- [[how/subscriptions]]：页面上的条目是如何组成的。
- [[build]]：编写插件，用于主题做不到的功能。
