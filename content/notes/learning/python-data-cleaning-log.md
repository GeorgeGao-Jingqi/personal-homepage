---
title: Python 数据清洗练习记录
status: published
date: 2026-08-12
updated: 2026-08-14
summary: 记录一次从字段检查、缺失值处理到结果复核的最小清洗流程。
tags:
  - Python
  - 学习记录
  - 数据处理
related:
  - sql-window-functions-log
---

我把清洗过程拆成三个阶段：先观察，再处理，最后复核。

```python
import pandas as pd

raw = pd.read_csv("orders.csv")
profile = raw.isna().sum().sort_values(ascending=False)
clean = raw.drop_duplicates().copy()
clean["amount"] = pd.to_numeric(clean["amount"], errors="coerce")
```

真正容易被忽略的是“处理后是否仍然符合业务语义”。例如把缺失金额直接填成 0，虽然方便计算，却可能把“未知”误读成“没有发生”。

我的复核清单目前包括：

- 行数变化是否可以解释；
- 主键是否仍然唯一；
- 日期和金额范围是否出现异常；
- 清洗规则是否可以被别人复现。
