---
title: "API 参考"
description: "面板 REST API 的每条路由：接受什么、返回什么，以及谁可以调用。"
order: 5
tags: [reference, api]
outline: [2, 2]
---

<script setup>
// Loaded on this page only: the reference is large.
import NxApi from '../../../.vitepress/theme/NxApi.vue'
</script>

# API 参考

面板网页界面所做的一切都经过这个 API，你自己的程序也可以使用它：计费系统、机器人、监控脚本或[[addons/index|插件]]。本页列出每条路由，内容来自面板在 `/api/openapi.json` 提供的同一份文档。你也可以[下载 YAML 版本](/openapi.yaml)，供代码生成器和 API 客户端使用。

## 调用之前 {#before-you-call-it}

- **基础地址。** 面板自己的地址，如有基础路径也要带上：`https://panel.example.com:28431/secret-path/api/v1/users`。
- **使用 `/api/v1`。** 每条路由都提供两次，分别在 `/api/…` 和 `/api/v1/…` 下。`/api/v1` 前缀是供集成使用的稳定约定；不带版本的前缀属于面板自己的界面，可能会变化。
- **用令牌认证。** 在[[use/tokens|API 令牌]]页面创建一个[[~api-token|API 令牌]]，以 `Authorization: Bearer <token>` 发送。令牌以其所属管理员的身份工作，权限绝不会更多，而且只能访问其权限范围允许的路由。
- **列表分页。** 在 `/api/v1` 下，列表返回 `{items, total, limit, offset}`，并接受 `limit`、`offset`、`q` 和 `updated_since`。
- **重试是安全的。** 创建时发送 `Idempotency-Key` 请求头，超时后的重试会返回第一次的结果，而不会重复创建。
- **用事件代替轮询。** 要知道何时发生了变化，请用[[use/webhooks|Webhook]]订阅[[reference/events|事件]]。

```bash
curl -s https://panel.example.com:28431/api/v1/users?limit=5 \
  -H "Authorization: Bearer $TOKEN"
```

## 路由 {#routes}

<NxApi />
