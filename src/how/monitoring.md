---
title: "Monitoring and metrics"
description: "How the panel watches its nodes: the health history and uptime bar, live connections on demand, the Prometheus metrics endpoint, and alerts raised as events."
order: 12
tags: [monitoring]
---

# Monitoring and metrics

The [[~panel]] watches every [[~node]] on its own and keeps what it saw. This
page explains what it records, how the uptime bar decides what to paint, how
live connections are read, and what the metrics endpoint exports. Each rule
here follows one idea: **the panel shows what it knows, and says so when it
does not know**, rather than drawing a zero or an outage it cannot prove.

## What the heartbeat tells the panel

Every 15 seconds each node reports whether it is running what it was given,
its open connections in total and per inbound, how many times its core
restarted and its last start error, and the tally of connections its block
outbounds refused. The panel keeps these in memory while the node keeps
answering. A node that stops answering shows "not reported", never its last
figures.

## Health history

Every 5 minutes the panel asks each connected node for its host figures: disk,
memory and load. Each reading is shown on the node at once and
stored in the health history.

- **The last 7 days** keep every 5-minute reading.
- **Older readings** are folded into one per node per hour, the average of the
  readings that carried each figure.
- **The history is kept for 90 days** by default, up to two years. 0 stops
  recording and empties it.
- **A reading in which the node reported nothing is never stored.** A node
  that cannot report host figures has no history, rather than a history of
  zeros.

## The uptime bar

The bar on a node splits a time window into three states:

| State | Shown as | Means |
| --- | --- | --- |
| Up | **Up** | the panel has a reading from the node in that interval |
| Down | **Not reporting** | the panel was running for the whole interval, and the node gave no reading |
| Unknown | **Not watched** | the panel cannot say: it was off, the node did not exist yet, or the node has never produced a reading |

The bar **never paints an outage it cannot prove**. An interval counts as down
only when one run of the panel watched the whole of it and heard nothing. The
interval beside a panel restart is unknown, not down. A node that has never
reported host figures at all, because it is on a platform that cannot, may be
serving perfectly, so its bar stays unknown rather than red.

To tell "the panel was off" from "the node was down", the panel records each
of its own runs: when it started, when it was last alive, and whether it
stopped cleanly. The bar uses 5-minute intervals inside the last 7 days and
hourly ones beyond, matching the stored history.

## Live connections on demand

Nothing streams from nodes to the panel. A node keeps its list of live
connections in memory, and the panel asks when you look:

- **Counts** for a user come from every connected node at once, from totals each
  node keeps up to date, so asking is cheap.
- **Rows** (source, destination, rule, outbound, network, age, bytes) come from
  one node at a time, refreshed every 10 seconds while the dialog is open,
  newest first and capped at 500 rows. The counts stay complete even when the
  rows are cut.
- **A destination is live state, never a record.** The panel does not log where
  users connect.

**Closing** a user's connections works per inbound, per outbound, per node or
everywhere. It is not a ban: the app reconnects on its next packet unless the
user is also switched off.

## The metrics endpoint

The panel publishes its figures at `/metrics` in the Prometheus format, for a
Prometheus and Grafana of your own. Setting them up, a ready Grafana
dashboard and every metric name are [below](#prometheus-and-grafana).

- **It needs a token.** Use an [[~api-token|API token]] with only the
  `stats:read` scope. The document names every node and its address, so there
  is no open mode.
- **Everything is per node, per fixed category or fleet-wide.** Nothing is
  labelled per user: one label per account would be one series per account,
  kept for as long as your retention. Questions about one account are answered
  by the panel's reports API (`/api/reports/*`), over a period you choose.
- **Absent, not zero.** A figure a node did not report (disk, memory, load,
  connections, restarts, online users) has no series at all. A gap in a graph
  means the panel does not know, not that the number fell.
- **The one exception** is the count of event deliveries by status, which is
  always exported, so an alert on dead deliveries can fire.
- **Rejected connections** are exported per node and per block outbound.

Each scrape is computed from the database and the live figures at that
moment, so a 60-second scrape interval loses nothing.

## Prometheus and Grafana {#prometheus-and-grafana}

The panel's repository ships a Prometheus scrape configuration, a Grafana
dashboard and a compose overlay that runs both beside a Docker panel.

### With Docker

The overlay joins the panel's compose network and reaches the panel by service
name; the panel needs no extra published port.

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

Keep both `-f` files from then on, or a plain `docker compose up -d` removes
the two services again. To make that automatic:

```bash
echo 'COMPOSE_FILE=docker-compose.yml:monitoring/docker-compose.monitoring.yml' >> .env
```

Grafana listens on the server's loopback only. Reach it through SSH:

```bash
ssh -L 3000:localhost:3000 you@your-server
# then open http://localhost:3000 and sign in with GRAFANA_PASSWORD
```

The **Nexora fleet** dashboard is already there. Prometheus is not published
at all: it has no login of its own and holds your whole operational picture.

- **The panel serves HTTPS itself:** in `monitoring/prometheus/prometheus.yml`
  set `scheme: https` and `tls_config: { insecure_skip_verify: true }`. The
  panel's certificate names your public hostname, not the `panel` service name
  Prometheus dials.
- **The panel has a base path:** set `metrics_path: /your-base-path/metrics`.
- **The panel has a hostname set:** `/metrics` answers only on that name. Give
  the panel service that name as a network alias in your compose file
  (`networks: { default: { aliases: [panel.example.com] } }`) and scrape
  `panel.example.com:2095`.

### Without Docker

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

For Grafana, import `monitoring/grafana/dashboards/nexora-fleet.json` from the
[panel's repository](https://github.com/nexora-vpn/panel). It expects a
Prometheus datasource with the uid `nexora-prometheus`.

### The token

Make it on the [[use/tokens|API tokens]] page with the `stats:read` scope and
nothing else, and keep it in a file of its own rather than inside
`prometheus.yml`, which tends to get pasted into chats. Revoking the token
stops the scrape at once.

### What is exported

| Metric | Meaning |
| --- | --- |
| `nexora_panel_build_info` | 1, with the running version as a label |
| `nexora_panel_start_time_seconds` | when the panel process started; `time() - this` is its uptime |
| `nexora_license_valid` | 1 while the licence is valid, 0 otherwise |
| `nexora_license_expires_at_seconds` | the licence's expiry; absent when it does not expire |
| `nexora_license_limit{resource}`, `nexora_license_used{resource}` | the cap and the count for `user` and `node` (−1 = unlimited) |
| `nexora_users_total{status}` | accounts by status: active, disabled, expired, limited, pending |
| `nexora_users_online` | accounts with traffic inside the online window |
| `nexora_nodes_total` | nodes the panel knows |
| `nexora_node_up`, `nexora_node_enabled` | per node: answering, and switched on |
| `nexora_node_traffic_bytes_total{direction}` | traffic accounted to the node |
| `nexora_node_online_users` | accounts with traffic on that node in the online window |
| `nexora_node_connections`, `nexora_node_engine_restarts_total` | open connections; restarts since the node started |
| `nexora_node_rejected_connections_total{outbound}` | connections refused by a block outbound |
| `nexora_node_disk_bytes`, `nexora_node_disk_used_bytes`, `nexora_node_memory_bytes`, `nexora_node_memory_used_bytes`, `nexora_node_load1` | the node's host |
| `nexora_event_deliveries{status}`, `nexora_event_subscribers` | event deliveries by status (pending, delivered, dead) and enabled subscribers |

Every node metric carries the labels `node` (its name) and `id`.

### Alerts worth having

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

If you sell on a licence, add `nexora_license_expires_at_seconds - time() < 7 * 86400`.

## Alerts as events

The panel judges a few things itself and raises an [[~event]] when they
change, once per crossing and once more on recovery:

| Event | When |
| --- | --- |
| `node.disconnected`, `node.connected` | a node stops or starts answering |
| `node.disk_high`, `node.disk_recovered` | disk use crosses the threshold, 90% by default; recovered five points below it |
| `node.memory_high`, `node.memory_recovered` | the same for memory |
| `node.rejections_high` | refusals through one block outbound pass a rate per hour, 100 by default |
| `node.limit_reached` | a node's periodic traffic limit switched it off |

Thresholds are set on the **Webhooks** page; 0 switches an alert off. The
rejection rate is measured over a sliding hour from what the panel itself
observed, so a large tally reported on the panel's first heartbeat after a
restart is history, not a burst. Events reach webhooks, Telegram, email and
addons; see [[how/events]].

## Related pages

- [[use/dashboard]]: the fleet at a glance.
- [[use/nodes]]: a node's health chart and uptime bar.
- [[how/accounting]]: how traffic and online counts are computed.
