---
title: SQL 窗口函数学习记录
status: editing
publish: false
date: 2026-08-16
updated: 2026-08-18
summary: 用一个小练习理解窗口函数如何在保留行粒度的同时完成排名、累计和分组比较。
tags:
  - SQL
  - 学习记录
  - 数据处理
related:
  - from-question-to-action
---

窗口函数最有价值的地方，是它可以在不把明细行聚合掉的情况下，补充分组统计信息。

## 练习目标

对每个用户的订单按照时间排序，并计算：

- 用户内的订单序号；
- 用户累计金额；
- 当前订单与上一次订单的间隔。

```sql
SELECT
  user_id,
  order_date,
  amount,
  ROW_NUMBER() OVER (
    PARTITION BY user_id
    ORDER BY order_date
  ) AS order_rank,
  SUM(amount) OVER (
    PARTITION BY user_id
    ORDER BY order_date
    ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
  ) AS cumulative_amount,
  LAG(order_date) OVER (
    PARTITION BY user_id
    ORDER BY order_date
  ) AS previous_order_date
FROM orders;
```

## 我需要继续确认的细节

同一天多笔订单时，排序是否需要补充唯一键？金额为空时，累计值应该如何解释？这些边界决定了查询结果能不能被稳定复用。

下一步会把这个练习扩展成一份带有测试数据和结果检查的完整记录。
