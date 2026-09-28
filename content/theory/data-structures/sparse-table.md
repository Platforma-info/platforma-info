---
title: "Sparse Table"
section: Fundamentals
order: 2
difficulty: intermediate
summary: "Answer range-minimum (and other idempotent) queries in O(1) after O(n log n) preprocessing, for arrays that never change."
tags: [sparse table, rmq, range queries, static array]
prerequisites: [math/bit-manipulation]
source:
  title: Sparse Table
  url: https://cp-algorithms.com/data_structures/sparse-table.html
  license: CC BY-SA 4.0
---

A **sparse table** answers range queries on a *static* array (no updates). For an *idempotent* operation (one where applying it twice to the same element changes nothing: `min`, `max`, `gcd`, `and`, `or`) each query is answered in $O(1)$, after $O(n \log n)$ preprocessing time and memory.

## Idea

Precompute the answer for every segment whose length is a **power of two**. Let `table[k][i]` be the result for the segment $[i,\ i + 2^k)$. Level $k$ is built from level $k-1$ by combining two halves:

$$
\text{table}[k][i] = \text{op}\big(\text{table}[k-1][i],\ \text{table}[k-1][i + 2^{k-1}]\big)
$$

Level 0 is the array itself. There are $\lfloor\log_2 n\rfloor + 1$ levels.

## Range minimum queries in $O(1)$

For a query $[l, r)$ of length $L = r - l$, let $k = \lfloor \log_2 L \rfloor$. Two segments of length $2^k$ — one starting at $l$, one ending at $r$ — **cover** the query, possibly overlapping. Because `min` is idempotent, counting the overlap twice does not matter:

$$
\min(a[l..r)) = \min\big(\text{table}[k][l],\ \text{table}[k][r - 2^k]\big)
$$

```python
class SparseTable:
    def __init__(self, data, op=min):
        self.op = op
        n = len(data)
        self.table = [list(data)]
        k = 1
        while (1 << k) <= n:
            prev = self.table[-1]
            half = 1 << (k - 1)
            self.table.append(
                [op(prev[i], prev[i + half]) for i in range(n - (1 << k) + 1)]
            )
            k += 1

    def query(self, l, r):
        """op over a[l:r] (half-open, requires l < r)."""
        k = (r - l).bit_length() - 1
        row = self.table[k]
        return self.op(row[l], row[r - (1 << k)])

from math import gcd
import random

a = [7, 2, 3, 0, 5, 10, 3, 12, 18]
st = SparseTable(a)
assert st.query(0, 9) == 0
assert st.query(4, 8) == 3
assert st.query(5, 6) == 10

random.seed(1)
for _ in range(300):
    n = random.randint(1, 40)
    arr = [random.randint(-50, 50) for _ in range(n)]
    for op, name in ((min, "min"), (max, "max")):
        table = SparseTable(arr, op)
        for _ in range(20):
            l = random.randint(0, n - 1)
            r = random.randint(l + 1, n)
            assert table.query(l, r) == op(arr[l:r])

g = SparseTable([12, 18, 30, 8, 20], gcd)
assert g.query(0, 3) == 6 and g.query(3, 5) == 4
```

`(r - l).bit_length() - 1` is $\lfloor \log_2(r - l) \rfloor$ computed in $O(1)$.

## Range sum queries (not idempotent)

For sums the overlap would be counted twice, so decompose the segment into non-overlapping power-of-two pieces, one per set bit of its length. That costs $O(\log n)$ per query:

```python
def build_sum_table(data):
    table = [list(data)]
    k = 1
    while (1 << k) <= len(data):
        prev, half = table[-1], 1 << (k - 1)
        table.append([prev[i] + prev[i + half] for i in range(len(data) - (1 << k) + 1)])
        k += 1
    return table

def range_sum(table, l, r):
    total = 0
    for k in range(len(table) - 1, -1, -1):
        if (r - l) >> k & 1:
            total += table[k][l]
            l += 1 << k
    return total

arr = [3, 1, 4, 1, 5, 9, 2, 6]
t = build_sum_table(arr)
assert all(range_sum(t, l, r) == sum(arr[l:r]) for l in range(8) for r in range(l, 9))
```

Prefix sums do the same job in $O(1)$ with $O(n)$ memory, so the sparse table is only the right tool for idempotent operations.

## Comparison

| Structure | Build | Query | Update |
|-----------|-------|-------|--------|
| prefix sums | $O(n)$ | $O(1)$ (sum only) | $O(n)$ |
| **sparse table** | $O(n \log n)$ | $O(1)$ (idempotent) | rebuild |
| [segment tree](/theory/data-structures/segment-tree) | $O(n)$ | $O(\log n)$ | $O(\log n)$ |
| [Fenwick tree](/theory/data-structures/fenwick-tree) | $O(n)$ | $O(\log n)$ | $O(\log n)$ |

> [!TIP]
> A sparse table gives the fastest RMQ in Python when the array is static: after building, each query is a couple of list lookups. It is also the basis for the $O(1)$ [lowest common ancestor](/theory/graphs/lca-binary-lifting) queries via the Euler tour.

## Practice problems

- [SPOJ - RMQSQ](http://www.spoj.com/problems/RMQSQ/)
- [SPOJ - THRBL](http://www.spoj.com/problems/THRBL/)
- [Codechef - MSTICK](https://www.codechef.com/problems/MSTICK)
- [Codechef - SEAD](https://www.codechef.com/problems/SEAD)
- [Codeforces - CGCDSSQ](http://codeforces.com/contest/475/problem/D)
- [Codeforces - R2D2 and Droid Army](http://codeforces.com/problemset/problem/514/D)
- [Codeforces - Maximum of Maximums of Minimums](http://codeforces.com/problemset/problem/872/B)
- [SPOJ - Miraculous](http://www.spoj.com/problems/TNVFC1M/)
- [DevSkill - Multiplication Interval (archived)](http://web.archive.org/web/20200922003506/https://devskill.com/CodingProblems/ViewProblem/19)
- [Codeforces - Animals and Puzzles](http://codeforces.com/contest/713/problem/D)
- [Codeforces - Trains and Statistics](http://codeforces.com/contest/675/problem/E)
- [SPOJ - Postering](http://www.spoj.com/problems/POSTERIN/)
- [SPOJ - Negative Score](http://www.spoj.com/problems/RPLN/)
- [SPOJ - A Famous City](http://www.spoj.com/problems/CITY2/)
- [SPOJ - Diferencija](http://www.spoj.com/problems/DIFERENC/)
- [Codeforces - Turn off the TV](http://codeforces.com/contest/863/problem/E)
- [Codeforces - Map](http://codeforces.com/contest/15/problem/D)
- [Codeforces - Awards for Contestants](http://codeforces.com/contest/873/problem/E)
- [Codeforces - Longest Regular Bracket Sequence](http://codeforces.com/contest/5/problem/C)
- [CSES - Static Range Minimum Queries](https://cses.fi/problemset/task/1647)
- [Codeforces - Array Stabilization (GCD version)](http://codeforces.com/problemset/problem/1547/F)
