---
title: "事件目录"
description: "面板产生的每个事件：所属族、接收它所需的权限范围、负载字段，以及承载它的签名信封。"
order: 4
tags: [reference, events]
---

# 事件目录

面板产生的每个[[~event|事件]]，以及接收者收听它所需的权限范围和它携带的字段。Webhook 订阅者、插件、Telegram 聊天和电子邮件地址都从这个列表中选择。设置订阅者见 [[webhooks]]；事件如何排队和投递见 [[how/events]]。

面板本身也在 `GET /api/v1/events` 提供同一份目录，任何 API 令牌都可以读取。

## 信封 {#the-envelope}

每个事件以带 JSON 正文的 `POST` 请求到达 Webhook：

```json
{
  "v": 1,
  "id": 4182,
  "event": "user.quota_warning",
  "time": 1760180000,
  "data": {
    "userId": 57,
    "name": "alice",
    "adminId": 3,
    "usedPercent": 81,
    "threshold": 80,
    "used": 86973087744,
    "volume": 107374182400
  },
  "recipients": [3]
}
```

| 字段 | |
| --- | --- |
| `v` | 信封版本，`1` |
| `id` | 事件的 id：对每个订阅者、每次重试都相同 |
| `event` | 事件名称 |
| `time` | 产生时间，Unix 秒 |
| `data` | 负载：下文为该事件列出的字段 |
| `recipients` | 事件所涉及的管理员 id（事件涉及某个账户时）；否则不出现 |

负载中的时间为 Unix 秒，流量数值为字节。负载从不携带密码、密钥或订阅链接；如有需要，请用令牌从 API 读取。

## 请求头与签名 {#headers-and-signature}

| 请求头 | |
| --- | --- |
| `Content-Type` | `application/json` |
| `User-Agent` | `nexora-panel` |
| `X-Nexora-Event` | 事件名称 |
| `X-Nexora-Delivery` | 投递的 id：每次重试以及 **重新发送** 时都相同 |
| `X-Nexora-Signature` | `t=<unix seconds>,v1=<hex>`，订阅者设置了密钥时出现 |

`v1` 是用订阅者的签名密钥，对时间戳、一个点和原始正文计算的 HMAC-SHA256 的十六进制值：

```text
v1 = hex( HMAC-SHA256( secret, "<t>" + "." + <raw body bytes> ) )
```

接收方应当：

1. 在解析之前读取原始正文；重新序列化后的正文无法匹配。
2. 用自己的密钥重新计算 `v1`，并以恒定时间比较。
3. 拒绝 `t` 与自己的时钟相差超过五分钟的请求，使截获的投递无法在之后被重放。
4. 迅速回复 `2xx`。其他任何回复，或十秒内没有回复，都视为失败并会重试。

Python 示例：

```python
import hashlib, hmac, time

def verify(secret: bytes, header: str, body: bytes, max_skew: int = 300) -> bool:
    parts = dict(p.strip().split("=", 1) for p in header.split(",") if "=" in p)
    t, v1 = parts.get("t"), parts.get("v1")
    if not t or not v1 or abs(time.time() - int(t)) > max_skew:
        return False
    mac = hmac.new(secret, t.encode() + b"." + body, hashlib.sha256).hexdigest()
    return hmac.compare_digest(mac, v1)
```

要让每个事件只处理一次，请记录已处理过的 `id`。从备份还原会带回备份中的 id，因此跨还原记录 id 的接收方在收到 `panel.restore_applied` 时应当从头开始。

## 谁能收到什么 {#who-hears-what}

**权限范围。** 每个事件都指明接收者所需的权限范围。插件只有在其令牌也持有该权限范围时才能请求该事件，授权页面会同时显示两者（`:write` 权限范围包含对应的 `:read`）。Telegram 聊天或电子邮件地址只有在其账户的角色持有该权限范围时才能收到事件。主管理员手动添加的 Webhook 会收到其过滤器指定的所有事件。

**族。** 点号之前的部分是族，它决定路由：

| 族 | 涉及 | 是否指向某个账户 |
| --- | --- | --- |
| `user.*` | 客户账户 | 是：`adminId` 是拥有它的代理商（面板为 0） |
| `node.*` | 节点 | 否 |
| `admin.*` | 运营者账户 | 是：`adminId` 就是该账户 |
| `panel.*` | 面板自身 | 否 |

设为 **仅限关于** 某个账户的订阅者，以及每个代理商的聊天或地址，只会收到指向该账户的事件。因此 `node.*` 和 `panel.*` 事件永远不会到达代理商。

**批量操作只产生一个事件。** 在用户页面上执行一次批量操作只产生一个 `user.bulk`，批量生成账户只产生一个 `user.generated`，无论涉及多少账户。

## user.* {#user}

每个 `user.*` 事件都携带以下三个字段，再加上其所在行列出的字段：

| 字段 | 类型 | |
| --- | --- | --- |
| `userId` | integer | 账户的 id |
| `name` | string | 账户的名称 |
| `adminId` | integer | 拥有它的代理商；面板为 0 |

| 事件 | 权限范围 | 触发时机 | 其他字段 |
| --- | --- | --- | --- |
| `user.created` | `users:read` | 创建了一个账户。 | |
| `user.deleted` | `users:read` | 删除了一个账户。 | |
| `user.enabled` | `users:read` | 面板重新启用了一个账户，例如在续费或用量重置之后。 | |
| `user.disabled` | `users:read` | 面板停用了一个账户。`reason` 为 `volume`、`expiry`、`resale-volume` 或 `resale-expiry`。 | `reason` |
| `user.quota_reached` | `users:read` | `user.disabled` 的流量情形：账户用完了所购买的流量。 | `reason` |
| `user.expired` | `users:read` | `user.disabled` 的日期情形：账户的时间用完了。 | `reason` |
| `user.quota_warning` | `users:read` | 账户越过了 **已用流量** 阈值（默认 80 %）。每个额度和阈值只触发一次。 | `usedPercent`、`threshold`、`used`、`volume` |
| `user.expiring` | `users:read` | 账户进入了某个 **到期前天数** 窗口（默认 7 和 1）。每个窗口只触发一次。 | `expiry`、`daysLeft`、`threshold` |
| `user.renewed` | `users:read` | 账户已续费。携带新的日期和流量。 | `expiry`、`volume` |
| `user.activated` | `users:read` | 从首次连接开始计算的套餐开始了；到期时间现已确定。 | `expiry` |
| `user.first_fetch` | `users:read` | 某个客户端首次获取了该账户的配置。`client` 指明应用。 | `client` |
| `user.device_limit_reached` | `users:read` | 因账户的设备数已满，某台设备被拒绝获取订阅。每台设备每小时最多一次。 | `hwid`、`limit` |

有两个 `user.*` 事件携带自己的字段，而不是上面三个：

| 事件 | 权限范围 | 触发时机 | 字段 |
| --- | --- | --- | --- |
| `user.bulk` | `users:read` | 一次批量操作完成。`op` 是操作；`ids` 是它涉及的账户；由代理商执行时，`adminId` 是该代理商。 | `op`、`matched`、`affected`、`blocked`、`failed`、`actor`、`adminId`、`ids` |
| `user.generated` | `users:read` | 按名称模式批量生成了一批账户。 | `pattern`、`count`、`skipped`、`planId`、`actor`、`adminId` |

阈值在 [[webhooks]] 页面上设置。

## node.* {#node}

大多数 `node.*` 事件携带节点的 id 和名称：

| 事件 | 权限范围 | 触发时机 | 字段 |
| --- | --- | --- | --- |
| `node.connected` | `nodes:read` | 节点开始响应面板。`warnings` 列出它未能运行的内容。 | `nodeId`、`name`、`status`、`message`、`warnings` |
| `node.disconnected` | `nodes:read` | 节点停止响应。`message` 是错误信息。 | `nodeId`、`name`、`status`、`message`、`warnings` |
| `node.limit_reached` | `nodes:read` | 节点达到周期流量限制并被停用。`period` 是周期。 | `nodeId`、`name`、`used`、`limit`、`period` |
| `node.disk_high` | `nodes:read` | 节点根文件系统越过了 **磁盘占用** 阈值（默认 90 %）。每次越过触发一次。 | 主机字段 |
| `node.disk_recovered` | `nodes:read` | 回落到阈值以下至少五个百分点。 | 主机字段 |
| `node.memory_high` | `nodes:read` | 节点内存越过了 **内存占用** 阈值（默认 90 %）。每次越过触发一次。 | 主机字段 |
| `node.memory_recovered` | `nodes:read` | 回落到阈值以下至少五个百分点。 | 主机字段 |
| `node.rejections_high` | `nodes:read` | 一小时内节点通过某个拦截出站拒绝的连接数超过了 **每小时被拒绝的连接数**（默认 100）。`outbound` 是该出站的标签；`window` 为 `1h`。每次越过触发一次。 | `nodeId`、`name`、`outbound`、`count`、`threshold`、`window` |

主机字段为 `nodeId`、`name`、`resource`（`disk` 或 `memory`）、`usedPercent`、`threshold`、`used` 和 `total`（字节）。磁盘和内存每五分钟读取一次。

## admin.* {#admin}

| 事件 | 权限范围 | 触发时机 | 字段 |
| --- | --- | --- | --- |
| `admin.login` | `admins:write` | 运营者登录。 | `adminId`、`username`、`ip` |
| `admin.login_failed` | `admins:write` | 一次登录被拒绝。`username` 是输入的内容；两步验证码错误时 `stage` 为 `mfa`。 | `username`、`ip`、`stage` |
| `admin.login_new_ip` | `admins:write` | 运营者从与上次登录不同的地址登录。 | `adminId`、`username`、`ip`、`previousIp` |
| `admin.2fa_changed` | `admins:write` | 运营者开启或关闭了两步验证。 | `adminId`、`username`、`enabled` |
| `admin.owner_changed` | `admins:write` | 面板被移交给另一位主管理员。`previous` 指明交出面板的账户。 | `adminId`、`username`、`previous` |
| `admin.resale_cap_reached` | `admins:write` | 代理商用完了额度或账户到期；其用户随之下线。`reason` 为 `volume` 或 `expiry`。 | `adminId`、`username`、`reason`、`used`、`volume` |

## panel.* {#panel}

| 事件 | 权限范围 | 触发时机 | 字段 |
| --- | --- | --- | --- |
| `panel.started` | `stats:read` | 面板启动。`restored` 表示启动过程中应用了还原。 | `version`、`listen`、`restored` |
| `panel.stopping` | `stats:read` | 面板正在正常关闭，包括重启。一个 `panel.started` 之前没有 `panel.stopping`，说明面板意外停止。 | `version` |
| `panel.crashed` | `stats:read` | 处理请求时捕获到内部错误；面板仍在运行。每个路由和消息每五分钟最多一次。 | `method`、`path`、`error`、`version` |
| `panel.setup_completed` | `settings:read` | 设置向导完成，主管理员已存在。 | `username`、`restart` |
| `panel.settings_changed` | `settings:read` | 修改了一项面板全局设置（地址、TLS、基础路径等）。从不携带设置的值。 | `setting`、`actor` |
| `panel.restore_applied` | `users:read` | 在此面板上还原了一个备份。 | `superseded`、`tables`、`rows` |
| `panel.backup_done` | `backup:read` | 计划备份写入了一个归档。 | `name`、`size` |
| `panel.backup_failed` | `backup:read` | 计划备份失败；一小时内会重试。 | `error` |
| `panel.backup_upload_failed` | `backup:read` | 某个归档没能到达备份目的地。它仍在面板服务器上。 | `destination`、`name`、`error` |
| `panel.cert_renewed` | `certificates:read` | 面板管理的一张证书已续期。 | 证书字段 |
| `panel.cert_renew_failed` | `certificates:read` | 续期失败；每六小时重试一次。 | 证书字段、`error` |
| `panel.cert_expiring` | `certificates:read` | 你上传的某张证书即将到期；面板无法为它续期。每张证书一次。 | 证书字段 |
| `panel.ruleset_refresh_failed` | `pool:read` | 规则集的每小时刷新失败。 | `error` |
| `panel.update_available` | `stats:read` | 有更新的面板版本。`version` 是新版本，`current` 是正在运行的版本。每个版本一次。 | `version`、`current`、`url` |
| `panel.license_changed` | `license:write` | 许可证状态改变：已授权、已过期或免费，或者额度变化。 | `licensed`、`reason`、`previousReason`、`licenseId`、`issuedTo`、`expiresAt`、`limits` |
| `panel.license_expiring` | `license:write` | 许可证将在 30、14、7 或 1 天后到期。每个阈值一次。到期后没有宽限期。 | `licenseId`、`issuedTo`、`expiresAt`、`daysLeft`、`threshold` |
| `panel.license_unverified` | `license:write` | 面板已有数天无法确认其许可证。`deadline` 是这种情况持续下去时面板退回免费版的时间。 | `licenseId`、`verifiedAt`、`deadline`、`daysLeft` |
| `panel.ip_banned` | `security:read` | 登录保护封禁了一个地址。 | `ip`、`until`、`reason` |
| `panel.addon_registered` | `tokens:write` | 注册了一个插件。 | 插件字段 |
| `panel.addon_removed` | `tokens:write` | 一个插件连同其令牌和 Webhook 被移除。无论插件自身的过滤器如何，它都会先收到这个事件。 | 插件字段 |
| `panel.addon_unhealthy` | `tokens:write` | 插件的健康检查路径连续两次失败。每次越过触发一次。 | 插件字段、`error` |
| `panel.addon_recovered` | `tokens:write` | 不健康的插件再次响应了健康检查路径。 | 插件字段 |
| `panel.addon_update_waiting` | `tokens:write` | 某个已签名插件的新版本请求的权限超过其现有权限，正在等待批准。 | 插件字段、`version` |
| `panel.ping` | 任意 | **发送测试事件** 发给某个订阅者的测试事件。 | `subscriberId`、`name`、`by` |

证书字段为 `kind`（`node` 或 `panel`）、`certificateId`、`nodeId`、`name` 和 `notAfter`。插件字段为 `addonId`、`slug`、`name` 和 `signed`。

许可证事件对你的面板意味着什么，见 [[licence]]；插件见 [[use/addons]]。

## 相关内容 {#related}

- [[webhooks]]：订阅者、重试和阈值。
- [[how/events]]：事件总线如何排队和投递。
- [[telegram]] 和 [[email]]：面向人的事件。
- [[reference/api]]：接收者获取更多信息所用的 API。
