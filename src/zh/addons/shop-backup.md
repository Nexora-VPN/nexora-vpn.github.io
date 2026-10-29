---
title: "Shop：备份"
description: "备份 Shop 自己的数据库，妥善保管密钥，把 Shop 迁移到新服务器，以及在面板还原后核对账户。"
order: 8
group: shop
tags: [addons, backup]
---

# Shop：备份

钱在 [[shop|Shop]] 的数据库中，账户在面板的数据库中，所以需要保管两个数据库。面板备份它自己的数据库（[[use/backup]]）；Shop 在其管理后台的 **备份** 下备份它自己的数据库。本页介绍这两方面：Shop 的归档，以及面板被还原后该做什么。

## 备份是什么 {#what-a-backup-is}

Shop 数据库的归档（在 Shop 运行期间获取的一致副本）加上卡对卡转账凭证，用只有你持有的密钥加密。

| 设置 | 默认值 | 作用 |
| --- | --- | --- |
| 每隔几小时备份一次 | `24` | `0` 关闭计划。 |
| 服务器上保留的归档数量 | `7` | 更早的归档会被删除。 |
| 向服务器外发送一份副本 | 开启 | 发送到面板的备份聊天，或通过 Shop 的机器人发送。 |

归档以 `shop-<date>-<time>.nxsb` 的名称写入 `data/backups/`，每个都可以在同一页面上下载。**立即备份** 会马上生成一个。

**服务器外的副本** 会通过面板自己的机器人，发送到你在面板上为备份选择的 Telegram 聊天（[[backup-destinations]]）；Shop 从不会看到该聊天。如果面板上关闭了这一项，副本会通过 Shop 的机器人发给每位与之配对的管理员。Telegram 接受最大 50 MB 的文件：更大的归档会留在服务器上，页面会说明这一点。面板和 Telegram 都无法读取归档。

使用 **PostgreSQL** 时，数据库由你负责，其备份也由你负责：像该服务器上的其他数据库一样使用 `pg_dump`。这时 Shop 的归档只包含凭证，并会注明这一点。

## 密钥 {#the-key}

**显示密钥** 会显示能打开所有归档的密钥（`nxsb-…`）。归档只能用它打开。密钥不会改变，所以用它生成的归档永远可以用它打开。

::: danger 把密钥保存在这台服务器之外
把密钥复制到安全的地方，远离 Shop 的服务器。服务器丢失时，它上面的密钥副本也会一起丢失，而没有密钥就无法还原任何归档。
:::

## 迁移到新服务器 {#moving-to-a-new-server}

1. 照常在新服务器上安装 Shop（[[shop#install]]），然后停止它：`systemctl stop nx-addon-shop` 或 `docker compose stop shop`。
2. 把一个归档复制过去，并用密钥还原：

   ```bash
   nx-shop restore -i shop-20261004-120000.nxsb -key nxsb-…
   ```

   使用 Docker 时，先把归档复制到 `data/backups/` 中，然后：

   ```bash
   docker compose run --rm shop restore -i /data/backups/shop-….nxsb -key nxsb-…
   ```

3. 重新启动 Shop。

还原在改动任何东西之前，会先检查密钥，并确认其中的数据库属于 Shop。被替换的内容会保留为 `shop.db.before-restore` 和 `receipts.before-restore`。密钥错误或归档损坏时，不会改变任何东西。

面板的注册信息不在归档中。如果新服务器沿用旧地址，请一并复制 `data/nx-credentials.json`。否则，请在面板的 **扩展** 页面上移除 Shop，然后重新注册（[[directory]]）。

`nx-shop backup` 可以用同一把密钥手动生成归档。

## 面板还原之后 {#after-a-panel-restore}

面板从备份还原后，它的账户回到备份时的状态，Shop 在此之后售出的内容可能已从面板上消失。面板会通知 Shop，Shop 会把自己售出的每个账户与面板逐一核对。

面板上已不存在的账户，或者日期、流量落后于 Shop 最后一笔订单所设状态的账户，会连同为其付款的订单列在 **备份 → 面板恢复之后** 下。概览页会显示有多少条未处理。

1. 打开每一条。
2. 手动处理：在面板上为账户续费，或为订单退款。
3. 标记为 **已处理**。

**立即检查** 可以随时执行同样的检查。同一列表还会显示网关在拒绝后又完成的退款，供你处理（[[shop-payments#refund]]）。
