---
title: "插件清单"
description: "nx-addon.json 参考：每个字段、install 部分及其选项类型、requires.panel，以及清单和发布版本如何签名。"
order: 11
group: authors
tags: [addons, api, reference]
---

# 插件清单

清单 `nx-addon.json` 是[[~addon|插件]]与面板、[[directory|插件目录]]以及面板安装表单之间的约定。它说明插件是谁、请求什么、如何安装。本页列出每个字段；[[build]] 说明如何使用它们。

插件工具包的 `manifest` 包强制执行这份约定，面板也用同样的代码进行校验。发布前请检查清单：

```bash
nx-addon check nx-addon.json
```

## 存放位置 {#where-it-lives}

- **在插件公开仓库的根目录。** 目录和安装表单会在任何东西运行之前从那里读取它。对于闭源插件，这是它的公开分发仓库。
- **由运行中的插件提供**，地址为 `/.well-known/nx-addon.json`，注册时会读取它。

## 完整示例 {#a-complete-example}

```json
{
  "api": 1,
  "slug": "template",
  "name": "Addon template",
  "version": "0.1.0",
  "publisher": "Example Ltd",
  "license": "Apache-2.0",
  "description": { "en": "A minimal addon to start from." },
  "docs": "https://github.com/nx-panel/addon-template",
  "install": {
    "docker": { "image": "ghcr.io/nx-panel/addon-template", "compose": "deploy/compose.yml" },
    "binary": { "linux-amd64": "addon-template-linux-amd64.tar.gz" },
    "options": [
      { "key": "port", "type": "port", "default": 8090, "label": { "en": "Port" } }
    ]
  },
  "scopes": [
    { "scope": "users:read", "purpose": "to show how many accounts the panel has" }
  ],
  "events": ["user.created", "panel.addon_removed"],
  "webhook": "/nx/events",
  "setup": "/nx/setup",
  "health": "/health",
  "ui": "/",
  "rateLimit": 60,
  "signature": "…"
}
```

## 字段 {#fields}

| 字段 | 必填 | 含义 |
| --- | --- | --- |
| `api` | 是 | 清单版本：`1`（本页）或 `0`（较早的版本，不能带有下文标为 *v1* 的字段）。 |
| `slug` | 是 | 插件的 id：`a-z`、`0-9`、`_` 和 `-`，以字母或数字开头，最多 32 个字符。 |
| `name` | 是 | 最多 64 个字符。 |
| `version` | | 发布版本，采用 semver。目录通过比较它来显示有可用更新。 |
| `publisher` | | 最多 64 个字符。 |
| `scopes` | `scopes` 与 `webhook` 至少一个 | `[{"scope": …, "purpose": …}]`：API 令牌的权限，每项附有在批准页面上显示的理由。 |
| `events`、`webhook` | 同时出现 | 插件接收的事件，以及事件投递到的路径。见[事件与权限范围](#events-and-scopes)。 |
| `setup` | 是 | 接收凭据（连同认领码）的路径。 |
| `health` | | 插件健康时返回 `200` 的路径。每分钟轮询一次。 |
| `ui` | | 插件的入口：一个路径，或绝对 `http(s)` URL。 |
| `description` | v1 | 按语言（`en`、`fa`、`ru`、`zh`）提供，提供时必须包含英文，每种最多 500 个字符。 |
| `license` | v1 | SPDX id 或 `proprietary`，最多 64 个字符。 |
| `paid` | v1 | 插件是收费的。它的许可由它自己负责；面板不做任何检查。 |
| `docs` | v1 | 绝对 `http(s)` URL。 |
| `requires.panel` | v1 | `">=X.Y.Z"`。低于该版本的面板会拒绝插件并说明原因。 |
| `install` | v1 | 插件的安装方式（[见下文](#install)）。没有它的插件只能通过地址注册。 |
| `rateLimit` | v1 | 令牌每分钟可发出的请求数，1 到 600。不填时使用面板默认值 120。在批准页面上显示；请求更多的新清单需要等待批准。 |
| `signature` | | base64 编码的 Ed25519 签名（[签名](#signing)）。 |

### 路径 {#paths}

`setup`、`webhook` 和 `health` 是三个互不相同的规范路径，且都不能是清单自身的路径。每个路径：

- 以 `/` 开头；
- 不含空段、`.` 段或 `..` 段（末尾的 `/` 可以）；
- 不含 `?`、`#`、`%`、`{`、`}`、`\` 或空格。

### 事件与权限范围 {#events-and-scopes}

每个事件由面板事件目录为它指定的权限范围授予（`GET /api/events`；见 [[reference/events]]）。该权限范围或其 `:write` 必须在 `scopes` 中，否则面板会拒绝清单。`panel.addon_removed` 是例外：无论插件持有什么权限，都会被告知自己被移除。

### 重复的键 {#a-duplicated-key}

在任一对象中重复同一个键的清单会被拒绝。

## `install` {#install}

```json
"install": {
  "docker": { "image": "ghcr.io/nx-panel/shop", "compose": "deploy/compose.yml" },
  "binary": { "linux-amd64": "shop-linux-amd64.tar.gz", "linux-arm64": "shop-linux-arm64.tar.gz" },
  "options": [ … ]
}
```

`docker` 和 `binary` 至少需要一个。

| 字段 | 含义 |
| --- | --- |
| `docker.image` | **不带标签** 的镜像仓库路径：发布版本号就是标签。 |
| `docker.compose` | compose 文件的相对路径，在仓库和发布版本中都适用。 |
| `binary` | 把平台映射到发布资产的文件名。插件的安装脚本会把它放到 systemd 下运行（`--method script`）。 |
| `options` | 安装时要问的问题（[见下文](#install-options)）。 |

`binary` 的平台：`linux-amd64`、`linux-arm64`、`linux-armv7`、`linux-armv6`、`linux-armv5`、`linux-386`、`linux-s390x`、`linux-riscv64`。

## `install.options` {#install-options}

安装时要问的问题，最多 32 个，按显示顺序排列：

```json
{ "key": "database", "type": "choice", "choices": ["sqlite", "postgres"], "default": "sqlite",
  "label": { "en": "Database" } },
{ "key": "database_dsn", "type": "secret", "required": true, "when": { "database": "postgres" },
  "label": { "en": "PostgreSQL DSN" } }
```

| 字段 | 含义 |
| --- | --- |
| `key` | `a-z`、`0-9` 和 `_`，以字母开头，最多 32 个字符；不可重复。 |
| `type` | 下列类型之一。 |
| `label` | 按语言提供，必须包含英文，每种最多 80 个字符。 |
| `help` | 按语言提供，每种最多 300 个字符。 |
| `default` | 与选项类型一致的 JSON 值。`secret` 和 `password` 不能有默认值。 |
| `required` | 没有回答时安装无法继续。 |
| `choices` | `choice` 的取值，1 到 32 个，每个最多 64 个字符。 |
| `when` | `{"<key>": "<value>"}`：只有当该选项取这个值时才显示（布尔值用 `"true"` 或 `"false"`）；该选项必须在本选项 **之前** 声明，且为 `choice` 或 `bool`。 |

### 选项类型 {#option-types}

| 类型 | 询问的内容 |
| --- | --- |
| `string` | 自由文本。 |
| `secret` | 面板从不保存的文本；带有它的命令只显示一次。 |
| `password` | 作为插件管理员密码的 `secret`：至少 10 个字符，最多 72 字节。超出此范围时，面板表单会拒绝。 |
| `number` | 数字。 |
| `port` | 端口号。 |
| `bool` | 是或否。 |
| `choice` | `choices` 中的一个。 |
| `url` | 一个地址。 |
| `path` | 插件提供管理界面的基础路径。每个清单最多一个（[见下文](#the-path-type)）。 |

完整的列表就是这些。不认识某个类型的旧面板，会在读取 `requires.panel` 之前就拒绝使用该类型的清单。尽管如此，仍请设置 `requires.panel`，并在发布说明中写明插件需要哪个版本的面板。

### 回答如何到达插件 {#how-answers-reach-the-addon}

回答以环境变量 `NX_OPT_<KEY>` 的形式到达，写在 compose 文件旁边的 `.env` 中，或 systemd 单元的 `EnvironmentFile` 中。同时提供的还有 `NX_PANEL_URL` 和 `NX_CLAIM_CODE`（面板为这次安装签发的认领码）。`bool` 为 `true` 或 `false`，数字采用其 JSON 写法。

### `path` 类型 {#the-path-type}

由字母、数字、`-` 和 `_` 组成的一段（最多 64 个字符），可带或不带斜杠，留空表示根路径。选项没有 `default` 时，面板安装表单会建议一个随机值，并像 `port` 一样把回答拼进注册插件时使用的地址。脚本安装时，如果命令没有给出，会自动生成一个。

插件在该路径下提供管理界面、API 以及面板调用的路由（清单、`setup`、Webhook、`health`），客户页面则在路径之外。

### 新安装 {#a-new-install}

在早先安装的数据之上使用新的认领码（插件被移除但保留了数据，然后再次安装），就是一次 **新安装**：插件会丢弃之前保留的注册信息，使签发该认领码的面板可以注册它，并应用那些平时只使用一次的回答，例如第一个管理员的密码。更新会保留认领码。

## 签名 {#signing}

### 清单 {#the-manifest}

- **官方** 插件由 NX 签名。
- **已验证** 插件用开发者自己的密钥签名（`nx-addon keygen`、`nx-addon sign`），目录的签名索引为该密钥背书。
- **未签名** 插件需要手动注册。

签名覆盖除 `signature` 以外的所有字段，按键排序后重新编码，因此文件可以随意缩进或调整顺序。

### 发布版本的校验和 {#the-release-s-checksums}

发布版本会发布 **`SHA256SUMS`**，以 `sha256sum` 的格式覆盖所有资产（包括 `install.sh` 和各个程序）；以及 **`SHA256SUMS.sig`**，即构建后用 **签名清单的同一把密钥** 对它做的签名：

```bash
nx-addon sign-sums -key addon.key SHA256SUMS > SHA256SUMS.sig
gh release upload v1.2.3 SHA256SUMS.sig
```

该签名是对 `nx-addon SHA256SUMS v1\n` 加上文件字节所做的 base64 Ed25519 签名，因此它永远不会被当作清单的签名。

| 安装方式 | 校验内容 |
| --- | --- |
| 通过 SSH，或在面板自己的服务器上 | 发布版本的 `install.sh`（脚本安装时还有其程序）必须与一个 `SHA256SUMS` 相符，且该文件由签名该版本清单的密钥签名。 |
| 由主机下载发布版本的脚本安装 | 安装脚本通过 `--sha256` 得到程序的校验和并进行校验。 |
| Docker | 镜像按标签拉取，不在校验范围内。 |
| 没有 `SHA256SUMS.sig` 的发布版本 | 只能用命令安装。 |

清单本身不包含任何摘要：插件把清单嵌入到自己的程序中，所以程序的摘要不可能写在清单里。
