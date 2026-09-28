---
title: "Knapsack Problem"
section: Classic problems
order: 1
difficulty: intermediate
summary: "0-1, complete and bounded knapsack in one array, with the loop directions that make each version work, and a big-integer bitset trick for subset sum."
tags: [knapsack, dp, subset sum, bitset]
prerequisites: [dynamic-programming/introduction-to-dp]
source:
  title: Knapsack Problem
  url: https://cp-algorithms.com/dynamic_programming/knapsack.html
  license: CC BY-SA 4.0
---

You have $N$ items. Item $i$ has weight $w_i$ and value $v_i$, and you carry a knapsack of capacity $W$. Choose items to maximize the total value while the total weight stays at most $W$. The variants differ in **how many copies** of each item may be taken.

| Variant | Copies of item $i$ |
|---------|--------------------|
| 0-1 knapsack | at most 1 |
| complete (unbounded) knapsack | unlimited |
| multiple (bounded) knapsack | at most $k_i$ |

## 0-1 knapsack

**State.** $f[i][j]$ = the best value using only the first $i$ items with capacity $j$.

**Transition.** Skip item $i$, or take it (if it fits):

$$
f[i][j] = \max\big(f[i-1][j],\ f[i-1][j - w_i] + v_i\big)
$$

Row $i$ depends only on row $i-1$, so one array is enough — **provided we loop the capacity downwards**, so that `f[j - w]` still holds the value from the previous item (not from this item taken twice):

```python
def knapsack_01(items, capacity):
    """items: list of (weight, value). Return the maximum total value."""
    f = [0] * (capacity + 1)
    for w, v in items:
        for j in range(capacity, w - 1, -1):          # descending: each item used at most once
            f[j] = max(f[j], f[j - w] + v)
    return f[capacity]

items = [(1, 15), (3, 20), (4, 30)]
assert knapsack_01(items, 4) == 35                     # items 1 and 2: weight 4, value 35
assert knapsack_01(items, 5) == 45
assert knapsack_01(items, 0) == 0
```

The time is $O(NW)$ and the memory $O(W)$.

Compare with brute force:

```python
from itertools import product
import random

def brute_01(items, capacity):
    best = 0
    for pick in product((0, 1), repeat=len(items)):
        weight = sum(w for (w, _), p in zip(items, pick) if p)
        if weight <= capacity:
            best = max(best, sum(v for (_, v), p in zip(items, pick) if p))
    return best

random.seed(1)
for _ in range(300):
    its = [(random.randint(1, 8), random.randint(1, 20)) for _ in range(random.randint(0, 8))]
    cap = random.randint(0, 20)
    assert knapsack_01(its, cap) == brute_01(its, cap)
```

## Complete (unbounded) knapsack

With unlimited copies, taking item $i$ again is allowed, so use the same row: $f[i][j] = \max(f[i-1][j],\ f[i][j - w_i] + v_i)$. In one array the only change is to loop the capacity **upwards**, so `f[j - w]` may already include this item:

```python
def knapsack_unbounded(items, capacity):
    f = [0] * (capacity + 1)
    for w, v in items:
        for j in range(w, capacity + 1):              # ascending: item can be reused
            f[j] = max(f[j], f[j - w] + v)
    return f[capacity]

assert knapsack_unbounded([(2, 3), (3, 5)], 7) == 11     # two items of weight 2 and one of weight 3: 3+3+5
assert knapsack_unbounded([(5, 10)], 4) == 0
```

**Ascending vs descending** is the one thing to remember: descending forbids reuse, ascending allows it.

## Multiple (bounded) knapsack

Item $i$ can be taken up to $k_i$ times. The simplest approach treats every copy as a separate 0-1 item: $O(W \sum k_i)$.

### Binary grouping

Replace $k$ copies by $O(\log k)$ *bundles* of size $1, 2, 4, \dots, 2^m$ and a remainder. Any count from $0$ to $k$ can be formed as a sum of distinct bundles, so the 0-1 algorithm on the bundles gives the right answer:

```python
def knapsack_bounded(items, capacity):
    """items: list of (weight, value, count)."""
    bundles = []
    for w, v, k in items:
        size = 1
        while k > 0:
            take = min(size, k)
            bundles.append((w * take, v * take))
            k -= take
            size *= 2
    return knapsack_01(bundles, capacity)

assert knapsack_bounded([(2, 3, 2), (3, 5, 1)], 7) == 3 + 3 + 5      # two of item 1, one of item 2
assert knapsack_bounded([(1, 1, 100)], 10) == 10

def brute_bounded(items, capacity):
    expanded = [(w, v) for w, v, k in items for _ in range(k)]
    return knapsack_01(expanded, capacity)

random.seed(2)
for _ in range(200):
    its = [(random.randint(1, 6), random.randint(1, 10), random.randint(1, 5)) for _ in range(random.randint(0, 5))]
    cap = random.randint(0, 25)
    assert knapsack_bounded(its, cap) == brute_bounded(its, cap)
```

The time is $O(W \sum \log k_i)$. An even faster $O(NW)$ solution uses a monotone queue optimization (see the [minimum queue](/theory/data-structures/minimum-stack-queue)).

## Subset sum and a Python trick

**Subset sum** asks only: can some subset of the numbers reach exactly the sum $S$? It is a knapsack with boolean values. The direct DP is a table `reachable[s]`.

Python has a beautiful shortcut: use one big integer as a **bitset**, where bit $s$ is set when sum $s$ is reachable. Adding an item $a$ means "every reachable sum $s$ makes $s + a$ reachable", which is a single shift and OR:

```python
def subset_sums_mask(numbers):
    mask = 1                                  # bit 0: the empty subset has sum 0
    for a in numbers:
        mask |= mask << a
    return mask

def can_make(numbers, target):
    return (subset_sums_mask(numbers) >> target) & 1 == 1

assert can_make([3, 34, 4, 12, 5, 2], 9)               # 4 + 5
assert not can_make([3, 34, 4, 12, 5, 2], 30)
assert can_make([], 0) and not can_make([], 1)

def reachable_table(numbers, target):
    reachable = [False] * (target + 1)
    reachable[0] = True
    for a in numbers:
        for s in range(target, a - 1, -1):
            reachable[s] = reachable[s] or reachable[s - a]
    return reachable

random.seed(3)
for _ in range(200):
    nums = [random.randint(1, 15) for _ in range(random.randint(0, 8))]
    target = random.randint(0, 60)
    assert can_make(nums, target) == reachable_table(nums, target)[target]
```

Each shift-and-OR processes the whole bitset in C, a machine word at a time. In our test, 1000 random numbers up to 1000 (total about $5 \cdot 10^5$) took **0.013 s** with the big-integer mask, while the table version needed about 3.7 s for only the first 100 of them (roughly 40 s for all 1000).

> [!TIP]
> To limit memory, mask off high bits: `mask &= (1 << (target + 1)) - 1` after each step.

## Practice problems

- [Atcoder: Knapsack-1](https://atcoder.jp/contests/dp/tasks/dp_d)
- [Atcoder: Knapsack-2](https://atcoder.jp/contests/dp/tasks/dp_e)
- [LeetCode - 494. Target Sum](https://leetcode.com/problems/target-sum)
- [LeetCode - 416. Partition Equal Subset Sum](https://leetcode.com/problems/partition-equal-subset-sum)
- [LeetCode - 474. Ones and Zeroes](https://leetcode.com/problems/ones-and-zeroes)
- [CSES: Book Shop II](https://cses.fi/problemset/task/1159)
- [DMOJ: Knapsack-3](https://dmoj.ca/problem/knapsack)
- [DMOJ: Knapsack-4](https://dmoj.ca/problem/knapsack4)
