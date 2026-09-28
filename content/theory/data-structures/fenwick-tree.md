---
title: "Fenwick Tree (Binary Indexed Tree)"
section: Trees
order: 2
difficulty: intermediate
summary: "Prefix sums with point updates in O(log n) using a tiny array, plus range updates and finding the k-th element."
tags: [fenwick, bit, prefix sums, range queries]
prerequisites: [math/bit-manipulation]
source:
  title: Fenwick Tree
  url: https://cp-algorithms.com/data_structures/fenwick.html
  license: CC BY-SA 4.0
---

A prefix-sum array answers "sum of the first $i$ elements" in $O(1)$ but needs $O(n)$ to update one element. A **Fenwick tree** (or *binary indexed tree*, BIT) balances the two: both prefix queries and point updates cost $O(\log n)$, using just one array of size $n$ and about ten lines of code.

## How it works

Use **1-indexed** positions. Let $\text{lowbit}(i) = i \,\&\, (-i)$ be the value of the lowest set bit of $i$. Cell `t[i]` stores the sum of the $\text{lowbit}(i)$ elements that end at $i$:

$$
t_i = a_{i - \text{lowbit}(i) + 1} + \dots + a_i
$$

| $i$ | binary | lowbit | `t[i]` covers |
|-----|--------|--------|---------------|
| 1 | 0001 | 1 | $a_1$ |
| 2 | 0010 | 2 | $a_1..a_2$ |
| 3 | 0011 | 1 | $a_3$ |
| 4 | 0100 | 4 | $a_1..a_4$ |
| 6 | 0110 | 2 | $a_5..a_6$ |
| 8 | 1000 | 8 | $a_1..a_8$ |

- **Prefix sum** up to $i$: add `t[i]`, then jump to $i - \text{lowbit}(i)$ (removing the lowest set bit), repeat until $0$. At most $\log n$ jumps, one per set bit.
- **Point update** at $i$: add to `t[i]`, then jump to $i + \text{lowbit}(i)$, repeat while $\le n$. These are exactly the cells whose range contains $i$.

## Implementation

```python
class Fenwick:
    """Sum queries and point updates on an array of n elements (0-indexed API)."""

    def __init__(self, n_or_values):
        if isinstance(n_or_values, int):
            self.n = n_or_values
            self.t = [0] * (self.n + 1)
        else:                                          # build in O(n)
            values = n_or_values
            self.n = len(values)
            self.t = [0] + list(values)
            for i in range(1, self.n + 1):
                j = i + (i & -i)
                if j <= self.n:
                    self.t[j] += self.t[i]

    def add(self, i, delta):
        """a[i] += delta"""
        i += 1
        while i <= self.n:
            self.t[i] += delta
            i += i & -i

    def prefix(self, i):
        """Sum of a[0:i] (first i elements)."""
        total = 0
        while i > 0:
            total += self.t[i]
            i -= i & -i
        return total

    def range_sum(self, l, r):
        """Sum of a[l:r]."""
        return self.prefix(r) - self.prefix(l)

a = [5, 3, 7, 9, 6, 4, 1, 2]
f = Fenwick(a)
assert f.prefix(4) == 5 + 3 + 7 + 9
assert f.range_sum(2, 6) == 7 + 9 + 6 + 4
f.add(3, 10)
a[3] += 10
assert f.range_sum(0, 8) == sum(a)
```

The linear construction propagates each cell to its parent `i + lowbit(i)` once, instead of doing $n$ separate updates.

Randomized check against a plain list:

```python
import random

random.seed(3)
for _ in range(200):
    n = random.randint(1, 40)
    arr = [random.randint(-9, 9) for _ in range(n)]
    f = Fenwick(arr)
    for _ in range(30):
        if random.random() < 0.5:
            i, d = random.randrange(n), random.randint(-5, 5)
            arr[i] += d
            f.add(i, d)
        else:
            l = random.randint(0, n)
            r = random.randint(l, n)
            assert f.range_sum(l, r) == sum(arr[l:r])
```

## Range operations

### 1. Point update, range query

The class above.

### 2. Range update, point query

To add $x$ to every element of $[l, r)$ and ask for single elements, store the **difference array** $d_i = a_i - a_{i-1}$ in the Fenwick tree. A range update touches two cells; the value of $a_i$ is the prefix sum of $d$:

```python
class RangeAddPointQuery:
    def __init__(self, n):
        self.f = Fenwick(n + 1)

    def range_add(self, l, r, x):          # a[l:r] += x
        self.f.add(l, x)
        self.f.add(r, -x)

    def get(self, i):
        return self.f.prefix(i + 1)

ra = RangeAddPointQuery(8)
ra.range_add(2, 6, 5)
ra.range_add(4, 8, 1)
assert [ra.get(i) for i in range(8)] == [0, 0, 5, 5, 6, 6, 1, 1]
```

### 3. Range update, range query

Combine two Fenwick trees $B_1, B_2$ so that the prefix sum of the array up to $i$ (1-indexed) equals $B_1(i)\cdot i - B_2(i)$. To add $x$ on $[l, r]$ (1-indexed inclusive):

$$
B_1{:}\ +x \text{ at } l,\ -x \text{ at } r+1 \qquad B_2{:}\ +x(l-1) \text{ at } l,\ -x\,r \text{ at } r+1
$$

```python
class RangeUpdateRangeQuery:
    def __init__(self, n):
        self.n = n
        self.b1 = Fenwick(n + 2)
        self.b2 = Fenwick(n + 2)

    def _add(self, tree, i, x):
        tree.add(i, x)

    def range_add(self, l, r, x):          # a[l:r] += x  (0-indexed, half-open)
        l += 1                              # convert to 1-indexed inclusive [l, r]
        self.b1.add(l, x)
        self.b1.add(r + 1, -x)
        self.b2.add(l, x * (l - 1))
        self.b2.add(r + 1, -x * r)

    def prefix(self, i):                    # sum of a[0:i]
        return self.b1.prefix(i + 1) * i - self.b2.prefix(i + 1)

    def range_sum(self, l, r):
        return self.prefix(r) - self.prefix(l)

n = 12
rr = RangeUpdateRangeQuery(n)
arr = [0] * n
random.seed(5)
for _ in range(300):
    l = random.randint(0, n - 1)
    r = random.randint(l + 1, n)
    x = random.randint(-4, 4)
    for i in range(l, r):
        arr[i] += x
    rr.range_add(l, r, x)
    l2 = random.randint(0, n)
    r2 = random.randint(l2, n)
    assert rr.range_sum(l2, r2) == sum(arr[l2:r2])
```

## Finding the $k$-th element (binary descent)

If all values are non-negative (for example counts of occurrences), the prefix sums are monotone and you can find the smallest index whose prefix sum is at least $k$ by walking down the implicit tree, in $O(\log n)$:

```python
def lower_bound(f, k):
    """Smallest 0-indexed position p with a[0..p] summing to >= k (values >= 0), or n if none."""
    pos = 0
    step = 1 << f.n.bit_length()
    while step:
        nxt = pos + step
        if nxt <= f.n and f.t[nxt] < k:
            pos = nxt
            k -= f.t[nxt]
        step >>= 1
    return pos                              # 0-indexed answer (pos is the count before it)

counts = Fenwick([0, 2, 0, 3, 1])           # value 1 twice, value 3 three times, value 4 once
# multiset: [1, 1, 3, 3, 3, 4]
assert [lower_bound(counts, k) for k in range(1, 7)] == [1, 1, 3, 3, 3, 4]
```

This turns a Fenwick tree into an **order-statistic multiset** over small integer values.

## Application: counting inversions

An *inversion* is a pair $i < j$ with $a_i > a_j$. Sweep from left to right; for each element count how many already-seen values are greater. That is a prefix query on a Fenwick tree indexed by value:

```python
def count_inversions(a):
    ranks = {v: i + 1 for i, v in enumerate(sorted(set(a)))}      # compress values to 1..m
    f = Fenwick(len(ranks))
    inversions = 0
    for seen, v in enumerate(a):
        r = ranks[v] - 1
        inversions += seen - f.prefix(r + 1)       # seen values that are > v
        f.add(r, 1)
    return inversions

def brute(a):
    return sum(a[i] > a[j] for i in range(len(a)) for j in range(i + 1, len(a)))

assert count_inversions([2, 4, 1, 3, 5]) == 3
random.seed(9)
for _ in range(100):
    arr = [random.randint(0, 9) for _ in range(random.randint(0, 25))]
    assert count_inversions(arr) == brute(arr)
```

## Fenwick or segment tree?

A Fenwick tree is shorter and faster (small constant), but only handles operations that can be "subtracted" (sums, XOR, counts). For minimum/maximum queries with updates, or complex range operations, use a [segment tree](/theory/data-structures/segment-tree).

## Practice problems

- [UVA 12086 - Potentiometers](https://uva.onlinejudge.org/index.php?option=com_onlinejudge&Itemid=8&category=24&page=show_problem&problem=3238)
- [LOJ 1112 - Curious Robin Hood](http://www.lightoj.com/volume_showproblem.php?problem=1112)
- [LOJ 1266 - Points in Rectangle](http://www.lightoj.com/volume_showproblem.php?problem=1266 "2D Fenwick Tree")
- [Codechef - SPREAD](http://www.codechef.com/problems/SPREAD)
- [SPOJ - CTRICK](http://www.spoj.com/problems/CTRICK/)
- [SPOJ - MATSUM](http://www.spoj.com/problems/MATSUM/)
- [SPOJ - DQUERY](http://www.spoj.com/problems/DQUERY/)
- [SPOJ - NKTEAM](http://www.spoj.com/problems/NKTEAM/)
- [SPOJ - YODANESS](http://www.spoj.com/problems/YODANESS/)
- [SRM 310 - FloatingMedian](https://community.topcoder.com/stat?c=problem_statement&pm=6551&rd=9990)
- [SPOJ - Ada and Behives](http://www.spoj.com/problems/ADABEHIVE/)
- [Hackerearth - Counting in Byteland](https://www.hackerearth.com/practice/data-structures/advanced-data-structures/fenwick-binary-indexed-trees/practice-problems/algorithm/counting-in-byteland/)
- [DevSkill - Shan and String (archived)](http://web.archive.org/web/20210322010617/https://devskill.com/CodingProblems/ViewProblem/300)
- [Codeforces - Little Artem and Time Machine](http://codeforces.com/contest/669/problem/E)
- [Codeforces - Hanoi Factory](http://codeforces.com/contest/777/problem/E)
- [SPOJ - Tulip and Numbers](http://www.spoj.com/problems/TULIPNUM/)
- [SPOJ - SUMSUM](http://www.spoj.com/problems/SUMSUM/)
- [SPOJ - Sabir and Gifts](http://www.spoj.com/problems/SGIFT/)
- [SPOJ - The Permutation Game Again](http://www.spoj.com/problems/TPGA/)
- [SPOJ - Zig when you Zag](http://www.spoj.com/problems/ZIGZAG2/)
- [SPOJ - Cryon](http://www.spoj.com/problems/CRAYON/)
- [SPOJ - Weird Points](http://www.spoj.com/problems/DCEPC705/)
- [SPOJ - Its a Murder](http://www.spoj.com/problems/DCEPC206/)
- [SPOJ - Bored of Suffixes and Prefixes](http://www.spoj.com/problems/KOPC12G/)
- [SPOJ - Mega Inversions](http://www.spoj.com/problems/TRIPINV/)
- [Codeforces - Subsequences](http://codeforces.com/contest/597/problem/C)
- [Codeforces - Ball](http://codeforces.com/contest/12/problem/D)
- [GYM - The Kamphaeng Phet's Chedis](http://codeforces.com/gym/101047/problem/J)
- [Codeforces - Garlands](http://codeforces.com/contest/707/problem/E)
- [Codeforces - Inversions after Shuffle](http://codeforces.com/contest/749/problem/E)
- [GYM - Cairo Market](http://codeforces.com/problemset/gymProblem/101055/D)
- [Codeforces - Goodbye Souvenir](http://codeforces.com/contest/849/problem/E)
- [SPOJ - Ada and Species](http://www.spoj.com/problems/ADACABAA/)
- [Codeforces - Thor](https://codeforces.com/problemset/problem/704/A)
- [CSES - Forest Queries II](https://cses.fi/problemset/task/1739/)
- [Latin American Regionals 2017 - Fundraising](http://matcomgrader.com/problem/9346/fundraising/)
