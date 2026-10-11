---
title: "监控与指标"
description: "面板如何监视其节点：健康历史和在线状态条、按需读取的实时连接、Prometheus 指标端点，以及作为事件发出的告警。"
order: 12
tags: [monitoring]
---

# 监控与指标

[[~panel]]会自行监视每个[[~node]]，并保存它所看到的。本页说明它记录什么、在线状态条如何决定显示什么、实时连接如何读取，以及指标端点导出什么。这里的每条规则都遵循同一个思路：**面板显示它知道的，不知道时就如实说明**，而不是画出一个它无法证明的零值或故障。

## 心跳告诉面板什么 {#what-the-heartbeat-tells-the-panel}

每个节点每 15 秒报告一次：它是否在运行所给的配置、它的总打开连接数和每个入站的打开连接数、它的核心重启了多少次以及最后一次启动错误，还有它的拦截出站拒绝的连接计数。只要节点持续应答，面板就把这些保存在内存中。停止应答的节点显示“未上报”，永远不会显示它最后的数据。

## 健康历史 {#health-history}

面板每 5 分钟向每个已连接的节点询问其主机数据：磁盘、内存和负载。每次读数会立即显示在该节点上，并存入健康历史。

- **最近 7 天** 保留每一次 5 分钟读数。
- **更早的读数** 会合并为每个节点每小时一条，取包含各项数据的读数的平均值。
- **历史默认保留 90 天**，最长两年。设为 0 会停止记录并清空历史。
- **节点什么都没报告的读数永远不会被保存。** 无法报告主机数据的节点没有历史，而不是一段全是零的历史。

## 在线状态条 {#the-uptime-bar}

节点上的状态条把一段时间窗口划分为三种状态：

| 状态 | 显示为 | 含义 |
| --- | --- | --- |
| 在线 | **在线** | 面板在该时间段内收到了节点的读数 |
| 离线 | **未上报** | 面板在整个时间段内都在运行，而节点没有给出读数 |
| 未知 | **未观测** | 面板无法判断：面板当时关闭、节点当时还不存在，或节点从未产生过读数 |

状态条**从不画出它无法证明的故障**。只有当面板的某一次运行完整地观察了一个时间段且什么都没收到时，该时间段才算离线。面板重启前后的时间段是未知，而不是离线。从未报告过主机数据的节点（因为它所在的平台无法报告）可能运行得非常好，所以它的状态条保持未知，而不是红色。

为了区分“面板当时关闭”和“节点当时离线”，面板会记录自己的每一次运行：何时启动、最后一次存活的时间，以及是否正常停止。状态条在最近 7 天内使用 5 分钟的时间段，更早的使用 1 小时的时间段，与保存的历史一致。

## 按需读取的实时连接 {#live-connections-on-demand}

节点不会向面板推送任何数据流。节点在内存中保存其实时连接列表，你查看时面板才去询问：

- 用户的**连接数**同时来自每个已连接的节点，取自各节点实时维护的总数，所以询问的代价很低。
- **连接行**（来源、目标、规则、出站、网络、时长、字节数）一次来自一个节点，对话框打开期间每 10 秒刷新一次，最新的在前，最多 500 行。即使行被截断，连接数仍然是完整的。
- **目标地址是实时状态，从不是记录。** 面板不记录用户连接到哪里。

**关闭** 用户的连接可以按入站、按出站、按节点或全部进行。这不是封禁：除非同时停用该用户，否则应用在下一个数据包时就会重连。

## 指标端点 {#the-metrics-endpoint}

面板以 Prometheus 格式在 `/metrics` 发布其数据，供你自己的 Prometheus 和 Grafana 使用。设置方法、现成的 Grafana 仪表盘和所有指标名称见[下文](#prometheus-and-grafana)。

- **它需要令牌。** 请使用只有 `stats:read` 权限范围的 [[~api-token|API 令牌]]。该文档列出了每个节点及其地址，所以没有开放模式。
- **一切都按节点、按固定类别或按整个节点群统计。** 没有任何按用户的标签：每个账户一个标签就意味着每个账户一条序列，并在你的保留期内一直保存。关于单个账户的问题，由面板的报表 API（`/api/reports/*`）在你选择的时间段内回答。
- **缺失，而不是零。** 节点没有报告的数据（磁盘、内存、负载、连接、重启、在线用户）根本没有序列。图表中的空缺表示面板不知道，而不是数字下降了。
- **唯一的例外** 是按状态统计的事件投递数，它总是被导出，以便针对作废投递的告警能够触发。
- **被拒绝的连接** 按节点和按拦截出站导出。

每次抓取都根据数据库和当时的实时数据计算，所以 60 秒的抓取间隔不会丢失任何东西。

## Prometheus 与 Grafana {#prometheus-and-grafana}

面板的仓库提供一份 Prometheus 抓取配置、一个 Grafana 仪表盘，以及一个在 Docker 面板旁同时运行两者的 compose 叠加文件。

### 使用 Docker {#with-docker}

叠加文件加入面板的 compose 网络，并通过服务名访问面板；面板不需要额外发布端口。

```bash
# 1. Fetch the monitoring directory next to your docker-compose.yml
curl -fsSL https://github.com/nexora-vpn/panel/archive/refs/heads/main.tar.gz \
  | tar -xz --strip-components=1 panel-main/monitoring

# 2. Put a token with the stats:read scope where Prometheus reads it
printf '%s' 'PASTE-THE-TOKEN' > monitoring/prometheus/token

# 3. Set Grafana's password
cp monitoring/.env.example .env      # or merge its lines into your .env
nano .env

# 4. Start everything
docker compose -f docker-compose.yml -f monitoring/docker-compose.monitoring.yml up -d
```

此后请始终同时使用这两个 `-f` 文件，否则单纯的 `docker compose up -d` 会再次移除这两个服务。要让它自动生效：

```bash
echo 'COMPOSE_FILE=docker-compose.yml:monitoring/docker-compose.monitoring.yml' >> .env
```

Grafana 只监听服务器的回环地址。请通过 SSH 访问：

```bash
ssh -L 3000:localhost:3000 you@your-server
# then open http://localhost:3000 and sign in with GRAFANA_PASSWORD
```

**Nexora fleet** 仪表盘已经在那里了。Prometheus 完全不对外发布：它没有自己的登录，而且掌握着你全部的运营情况。

- **面板自己提供 HTTPS 时：** 在 `monitoring/prometheus/prometheus.yml` 中设置 `scheme: https` 和 `tls_config: { insecure_skip_verify: true }`。面板的证书写的是你的公开主机名，而不是 Prometheus 拨号使用的 `panel` 服务名。
- **面板设置了基础路径时：** 设置 `metrics_path: /your-base-path/metrics`。
- **面板设置了主机名时：** `/metrics` 只在该名称上应答。请在 compose 文件中把这个名称作为网络别名赋给面板服务（`networks: { default: { aliases: [panel.example.com] } }`），并抓取 `panel.example.com:2095`。

### 不使用 Docker {#without-docker}

```yaml
scrape_configs:
  - job_name: nexora-panel
    scheme: https
    metrics_path: /metrics
    authorization:
      type: Bearer
      credentials_file: /etc/prometheus/nexora-token
    static_configs:
      - targets: ['panel.example.com']
```

对于 Grafana，从[面板的仓库](https://github.com/nexora-vpn/panel)导入 `monitoring/grafana/dashboards/nexora-fleet.json`。它需要一个 uid 为 `nexora-prometheus` 的 Prometheus 数据源。

### 令牌 {#the-token}

在 [[use/tokens|API 令牌]] 页面上创建它，只授予 `stats:read` 权限范围，并把它保存在单独的文件中，而不是写在常被粘贴到聊天里的 `prometheus.yml` 中。吊销令牌会立即停止抓取。

### 导出的内容 {#what-is-exported}

| 指标 | 含义 |
| --- | --- |
| `nexora_panel_build_info` | 值为 1，以运行中的版本作为标签 |
| `nexora_panel_start_time_seconds` | 面板进程的启动时间；`time() - this` 即为运行时长 |
| `nexora_license_valid` | 许可证有效时为 1，否则为 0 |
| `nexora_license_expires_at_seconds` | 许可证的到期时间；不会到期时不存在 |
| `nexora_license_limit{resource}`、`nexora_license_used{resource}` | `user` 和 `node` 的上限与数量（−1 = 不限） |
| `nexora_users_total{status}` | 按状态统计的账户：active、disabled、expired、limited、pending |
| `nexora_users_online` | 在在线窗口内有流量的账户 |
| `nexora_nodes_total` | 面板已知的节点 |
| `nexora_node_up`、`nexora_node_enabled` | 每个节点：是否在应答、是否已启用 |
| `nexora_node_traffic_bytes_total{direction}` | 计入该节点的流量 |
| `nexora_node_online_users` | 在在线窗口内在该节点上有流量的账户 |
| `nexora_node_connections`、`nexora_node_engine_restarts_total` | 打开的连接；节点启动以来的重启次数 |
| `nexora_node_rejected_connections_total{outbound}` | 被拦截出站拒绝的连接 |
| `nexora_node_disk_bytes`、`nexora_node_disk_used_bytes`、`nexora_node_memory_bytes`、`nexora_node_memory_used_bytes`、`nexora_node_load1` | 节点的主机 |
| `nexora_event_deliveries{status}`、`nexora_event_subscribers` | 按状态（pending、delivered、dead）统计的事件投递，以及已启用的订阅者 |

每个节点指标都带有 `node`（其名称）和 `id` 两个标签。

### 值得设置的告警 {#alerts-worth-having}

```yaml
groups:
  - name: nexora
    rules:
      - alert: NexoraPanelDown
        expr: up{job="nexora-panel"} == 0
        for: 5m
      - alert: NexoraNodeDown          # a switched-off node is not an outage
        expr: nexora_node_up == 0 and nexora_node_enabled == 1
        for: 10m
      - alert: NexoraNodeDiskFilling
        expr: nexora_node_disk_used_bytes / nexora_node_disk_bytes > 0.9
        for: 30m
      - alert: NexoraEventDeliveriesDead
        expr: increase(nexora_event_deliveries{status="dead"}[1h]) > 0
```

如果你按许可证销售，再加上 `nexora_license_expires_at_seconds - time() < 7 * 86400`。

## 作为事件的告警 {#alerts-as-events}

面板自己判断少数几件事，并在它们变化时发出一个[[~event]]，每次越过阈值时一次，恢复时再一次：

| 事件 | 时机 |
| --- | --- |
| `node.disconnected`、`node.connected` | 节点停止或开始应答 |
| `node.disk_high`、`node.disk_recovered` | 磁盘使用率越过阈值（默认 90%）；低于阈值五个百分点时视为恢复 |
| `node.memory_high`、`node.memory_recovered` | 内存同上 |
| `node.rejections_high` | 经由某个拦截出站的拒绝次数超过每小时速率（默认 100） |
| `node.limit_reached` | 节点的周期流量限制停用了它 |

阈值在 **Webhook** 页面上设置；设为 0 会关闭该告警。拒绝速率在一个滑动的一小时窗口内、根据面板自己观察到的数据测量，所以面板重启后第一次心跳报告的大量计数属于历史，而不是突发。事件会到达 Webhook、Telegram、电子邮件和插件；参见 [[how/events]]。

## 相关页面 {#related-pages}

- [[use/dashboard]]：一览整个节点群。
- [[use/nodes]]：节点的健康图表和在线状态条。
- [[how/accounting]]：流量和在线数如何计算。
