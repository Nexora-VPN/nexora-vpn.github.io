---
title: "编写插件"
description: "用插件工具包和模板编写自己的插件：认领码注册、签名事件、面板 API、健康检查、安装选项、证书以及上架目录。"
order: 10
group: authors
tags: [addons, api]
---

# 编写插件

本页面向想为 Nexora 编写[[~addon|插件]]的开发者：一个通过网络与面板协作的独立程序，带有限定权限范围的[[~api-token|API 令牌]]、面板的签名[[~event|事件]]，以及一份说明它需要什么的清单。本页逐一介绍插件的组成部分，以及替你完成大部分工作的工具。清单的字段见 [[manifest]]。

## 你要构建什么 {#what-you-build}

插件是独立的程序：有自己的服务或容器、自己的界面、自己的数据库。面板从不运行它的代码，也不保存它的任何数据。插件有四个部分与面板打交道：

| 部分 | 作用 |
| --- | --- |
| 清单 | `nexora-addon.json`：插件是谁、请求什么、如何安装。由运行中的插件在 `/.well-known/nexora-addon.json` 提供。 |
| setup 路径 | 注册时面板把令牌和 Webhook 密钥连同认领码投递到这里。 |
| Webhook 路径 | 面板把插件请求的事件投递到这里，每个事件都带签名。 |
| 健康检查路径 | 插件健康时返回 `200`。面板每分钟询问一次。 |

其他一切（你的页面、你的 API、你的数据库）都由你自己设计。面板如何对待插件见 [[how/addon-platform]]。

## 工具包和模板 {#the-kit-and-the-template}

两个公开仓库替你写好了大部分内容。

- **插件工具包**，Go 模块 [`github.com/nexora-vpn/addon-kit`](https://github.com/nexora-vpn/addon-kit)，采用 Apache-2.0 许可，因此基于它构建的插件可以开源也可以闭源。面板用同样的代码校验清单。
- **模板**，[`github.com/nexora-vpn/addon-template`](https://github.com/nexora-vpn/addon-template)：一个完整的最小插件，带有 compose 文件、程序发布版本和安装脚本。它通过认领码注册、接收事件、响应健康检查，并显示一个展示面板账户数量的页面。

| 工具包中的包 | 作用 |
| --- | --- |
| `manifest` | 读取、校验和签名清单。 |
| `addon` | 运行时部分：提供清单、在注册时接收凭据、校验事件投递、响应健康检查、读取安装时的回答。 |
| `panel` | 面板 API 的小型客户端，使用插件的令牌、幂等键，并在遇到 `429` 时等待。 |
| `auth` | 插件自己的管理员登录：哈希密码、会话、TOTP 第二因素、失败次数限制。 |
| `telegram` | 小型 Telegram Bot API 客户端，可通过代理或 Bot API 镜像访问；也支持 Bale。 |
| `web` | 在安装的基础路径下提供管理界面，在路径之外提供公开页面，HTTPS 证书可以来自面板、ACME 或自签名。 |
| `cmd/nexora-addon` | 对清单执行 `check`、`keygen`、`sign` 和 `verify`；对发布版本的校验和执行 `sign-sums` 和 `verify-sums`。 |

最小的插件：

```go
raw, _ := os.ReadFile("nexora-addon.json")
a, err := addon.New(addon.Config{Manifest: raw, DataDir: "data"}.FromEnv())
if err != nil { log.Fatal(err) }
a.OnEvent(func(e addon.Event) { log.Printf("%s %s", e.Event, e.Data) })
mux := http.NewServeMux()
a.Mount(mux) // the manifest, setup, webhook and health paths
log.Fatal(http.ListenAndServe(":8090", mux))
```

## 把模板改成你自己的 {#make-the-template-yours}

1. 修改 `nexora-addon.json` 中的 `slug`、`name`、`publisher`、权限范围和事件，以及 `install.sh` 顶部的 `SLUG`、`REPO` 和 `BIN`。
2. 在 `install.options` 下声明安装需要的问题（[[manifest#install-options]]）。
3. 把你自己的数据放在你自己的数据库中，用令牌读取面板。
4. 打一个发布标签。模板的发布工作流会构建程序、校验和、发布版本和镜像。然后签名校验和（见下文）。

## 用认领码注册 {#registration-with-a-claim-code}

插件启动时处于未注册状态。安装过程通过 `NEXORA_CLAIM_CODE` 传给它一个一次性 **认领码**；如果手动启动时没有认领码，工具包会生成一个并写入日志。

1. 面板在插件的地址上读取清单并检查签名。
2. 它向运营者展示插件请求的内容：每个权限范围及其用途、请求速率，以及每个事件。
3. 批准后，面板创建正好这些令牌和 Webhook，并连同认领码投递到插件的 `setup` 路径。插件只接受带有它自己认领码的投递，因此错误的认领码不会留下任何东西。

工具包把凭据保存在数据目录中，凭据到达后调用你用 `OnSetup` 设置的函数。`Credentials()` 返回凭据，注册前返回 nil；`ClaimCode()` 返回仍在等待的认领码。

面板只对由它信任的密钥签名的清单使用认领码注册：Nexora 的密钥，或目录为之背书的开发者密钥。开发期间请改为手动注册插件（**扩展 → 添加自有扩展**）：你自己选择令牌的权限和 Webhook 的事件，面板会把令牌和 Webhook 的签名密钥显示一次，供你填入程序的设置。

### 移除与新安装 {#removal-and-a-new-install}

运营者移除插件时，无论插件请求了哪些事件，面板都会先给它发送 `panel.addon_removed`，然后删除它的令牌和 Webhook。此时请调用 `Forget()`，以便它可以再次注册。

在早先安装的数据之上使用新的认领码（移除时保留了数据，然后再次安装），就是一次 **新安装**。工具包会丢弃旧的注册信息，`NewInstall()` 会告诉你的插件应用那些平时只使用一次的回答，例如第一个管理员的密码。保存好之后调用 `NewInstallApplied()`。更新会保留认领码，永远不算新安装。

## 接收事件 {#receiving-events}

面板把插件请求的每个事件投递到它的 `webhook` 路径。每次投递带有 `X-Nexora-Signature: t=<unix>,v1=<hex>`（十六进制值是用 Webhook 密钥对 `<t>.<body>` 计算的 HMAC-SHA256），以及在每次重试中保持不变的 `X-Nexora-Delivery` id。

工具包会检查签名，拒绝时间偏差超过五分钟的投递，把每个通过校验的事件按投递 id 只交给你的处理函数一次，并回复面板：

- `OnEvent` 用于不会失败的处理函数。
- `OnEventErr` 用于可能失败的处理函数：返回错误或发生 panic 时回复 `500`，面板会再次投递该事件。

已处理投递的集合保存在内存中，因此跨重启的重试会再次交给处理函数。请让处理函数的效果保持幂等。事件名称及其负载见 [[reference/events]]；面板如何投递见 [[how/events]]。

每个事件由一个权限范围授予：面板事件目录（`GET /api/events`）为它指定的权限范围或该权限范围的 `:write` 必须在清单的 `scopes` 中，否则面板会拒绝清单。

## 调用面板 {#calling-the-panel}

令牌只拥有你被授予的权限范围，请求速率为清单中请求的值（未指定时为每分钟 120 次）。工具包的 `panel` 客户端以 JSON 与面板 API 通信，在你提供时发送 `Idempotency-Key`，遇到 `429` 时等待一次：

```go
c := a.Credentials()
client := &panel.Client{Base: c.Panel.URL, Token: c.Token}
var list struct{ Total int `json:"total"` }
err := client.Get(ctx, "/users?limit=1", &list)
```

`Me()` 可以低成本地检查凭据是否仍然有效。路由及其请求体见面板的 API 描述（[[reference/api]]）。面板不替你保存任何东西：你自己的数据，以及你附加在用户上的数据，都请存放在你自己的数据库中。

## 健康检查 {#health}

在清单中提供一个 `health` 路径，插件能正常工作时返回 `200`。工具包会替你响应它。面板每分钟询问一次；连续两次失败会把插件标记为 **不健康** 并产生 `panel.addon_unhealthy`，下一次返回 `200` 时产生 `panel.addon_recovered`。没有健康检查路径的插件永远不会被询问。

## 安装选项 {#install-options}

`install.options` 中的每个问题都会成为面板安装表单中的一个字段，以及安装脚本的一个参数。回答以环境变量 `NEXORA_OPT_<KEY>` 的形式到达插件，同时还有 `NEXORA_PANEL_URL` 和 `NEXORA_CLAIM_CODE`；用 `addon.Option("key")` 读取。选项类型及其规则见 [[manifest#install-options]]。

有两种类型会改变面板安装你的插件的方式：

- **`password`** 会成为你的管理员密码。面板在表单中把它限制在 10 个字符到 72 字节之间，与工具包 `auth` 包的规则一致，因此你的插件会拒绝的密码永远不会到达它。
- **`path`** 是提供管理界面的基础路径。面板会建议一个随机值，并把回答拼进注册你的插件时使用的地址。请在该路径下提供管理界面、API 以及面板调用的路由（清单、`setup`、Webhook、`health`），客户页面则放在路径之外（`web.Mount`）。

## HTTPS 与来自面板的证书 {#https-and-certificates-from-the-panel}

工具包的 `web` 包在安装时指定的那一个端口上，用以下证书之一通过 HTTPS 提供你的公网地址：

- **来自面板的证书**：运营者从面板证书库中选择的证书。插件每隔几分钟从面板获取一次（注册前凭认领码，注册后凭令牌）并保留一份副本，因此即使面板宕机，它也能以 HTTPS 启动。它不需要自己占用 443 端口，因此多个插件可以与面板共用一台服务器。
- **ACME**：在 443 端口上使用 TLS-ALPN-01，或在任意端口上使用 HTTP-01（证书机构在 80 端口上发起验证）。
- **自签名证书**：用于以 IP 访问的地址。运营者在面板的批准页面上批准它的指纹。

它还会检查公网地址确实能到达这个程序本身。运营者如何在这些选项中选择，见 [[directory#https-for-the-addon]]。

## 发布与签名 {#releases-and-signing}

一个发布版本包括清单 `install.binary` 中列出的程序、`install.docker` 中的镜像、覆盖所有资产的 `SHA256SUMS`，以及用签名清单的同一把密钥签名的 `SHA256SUMS.sig`：

```bash
go install github.com/nexora-vpn/addon-kit/cmd/nexora-addon@latest
nexora-addon check nexora-addon.json                    # would a panel accept it?
nexora-addon keygen -out addon.key                      # once: your signing key
nexora-addon sign -key addon.key nexora-addon.json > signed.json
nexora-addon sign-sums -key addon.key SHA256SUMS > SHA256SUMS.sig
gh release upload v1.2.3 SHA256SUMS.sig
```

`keygen` 会打印你的公钥，并且从不覆盖已有的密钥文件。不要把私钥放进仓库。签名覆盖清单的每个字段，因此任何修改之后（包括每次发布的版本号）都要重新签名。

只有当发布版本的 `install.sh`（脚本安装时还有其程序）与一个由签名该版本清单的密钥签名的 `SHA256SUMS` 相符时，面板才会通过 SSH 安装、更新或移除插件。没有 `SHA256SUMS.sig` 的发布版本仍然可以用命令安装。详情见 [[manifest#signing]]。

## 上架目录 {#getting-listed}

插件在 [addons.nexora-panel.org](https://addons.nexora-panel.org) 上以官方、已验证或非官方的等级列出（[[directory#what-the-directory-lists]]）。要上架，请用你自己的密钥签名清单（`nexora-addon keygen`、`sign`），然后在目录仓库上发起 pull request。把 `nexora-addon.json` 放在你公开仓库的根目录（闭源插件则放在其公开分发仓库中）：目录和安装向导会从那里读取它。
