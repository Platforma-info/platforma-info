---
title: Sqrt Decomposition and Mo's Algorithm
section: Trees
order: 4
difficulty: advanced
summary: Split an array into blocks of size about √n to balance updates and queries, and answer offline range queries by ordering them cleverly (Mo's algorithm).
tags: [sqrt decomposition, mo's algorithm, blocks, offline queries]
prerequisites: [data-structures/fenwick-tree]
source:
  title: Sqrt Decomposition
  url: https://cp-algorithms.com/data_structures/sqrt_decomposition.html
  license: CC BY-SA 4.0
---

**Square root decomposition** splits data into pieces of about $\sqrt n$ elements. An operation handles whole pieces using precomputed summaries and the partial pieces at the ends element by element, so its cost is about $O(\sqrt n)$. It is less efficient than a [segment tree](/theory/data-structures/segment-tree) but far more flexible: it applies to problems where a summary is hard to merge, and the code is easy to get right.

## Blocks for range sums

Divide the array `a` of length $n$ into blocks of size $B \approx \sqrt n$ and store the sum of every block.

- **Query** $[l, r)$: sum the partial elements at the two ends directly and add the stored sums of the blocks fully inside. At most $2B + n/B = O(\sqrt n)$ terms.
- **Point update**: change `a[i]` and its block sum, $O(1)$.

```python
from math import isqrt

class SqrtSum:
    def __init__(self, data):
        self.a = list(data)
        self.n = len(self.a)
        self.B = max(1, isqrt(self.n))
        self.blocks = [0] * ((self.n + self.B - 1) // self.B)
        for i, x in enumerate(self.a):
            self.blocks[i // self.B] += x

    def update(self, i, value):
        self.blocks[i // self.B] += value - self.a[i]
        self.a[i] = value

    def query(self, l, r):
        """Sum of a[l:r]."""
        B = self.B
        bl, br = l // B, r // B
        if bl == br:
            return sum(self.a[l:r])
        total = sum(self.a[l : (bl + 1) * B])            # partial block on the left
        total += sum(self.blocks[bl + 1 : br])             # whole blocks in between
        total += sum(self.a[br * B : r])                   # partial block on the right
        return total

import random

random.seed(6)
for _ in range(100):
    n = random.randint(1, 60)
    arr = [random.randint(-9, 9) for _ in range(n)]
    s = SqrtSum(arr)
    for _ in range(40):
        if random.random() < 0.4:
            i, v = random.randrange(n), random.randint(-9, 9)
            arr[i] = v
            s.update(i, v)
        else:
            l = random.randint(0, n)
            r = random.randint(l, n)
            assert s.query(l, r) == sum(arr[l:r])
```

### Range update with lazy blocks

The same idea supports "add $x$ to all of $[l, r)$": update partial blocks element by element and put a lazy `+x` tag on whole blocks.

```python
class SqrtRangeAdd:
    """Range add, range sum, both O(sqrt n)."""

    def __init__(self, data):
        self.a = list(data)                 # values without the block's pending lazy amount
        self.n = len(self.a)
        self.B = max(1, isqrt(self.n))
        nb = (self.n + self.B - 1) // self.B
        self.sums = [0] * nb                # true sum of each block, lazy included
        self.lazy = [0] * nb                # amount added to every element of the block
        for i, x in enumerate(self.a):
            self.sums[i // self.B] += x

    def _block_size(self, b):
        return min(self.B, self.n - b * self.B)

    def _add_partial(self, lo, hi, x):
        for i in range(lo, hi):
            self.a[i] += x
            self.sums[i // self.B] += x

    def add(self, l, r, x):
        """a[l:r] += x"""
        B = self.B
        bl, br = l // B, r // B
        if bl == br:
            self._add_partial(l, r, x)
            return
        self._add_partial(l, (bl + 1) * B, x)           # tail of the first block
        for b in range(bl + 1, br):                      # whole blocks: just tag them
            self.lazy[b] += x
            self.sums[b] += x * self._block_size(b)
        self._add_partial(br * B, r, x)                  # head of the last block

    def _partial_sum(self, lo, hi):
        if lo >= hi:
            return 0
        return sum(self.a[lo:hi]) + self.lazy[lo // self.B] * (hi - lo)

    def query(self, l, r):
        """Sum of a[l:r]."""
        B = self.B
        bl, br = l // B, r // B
        if bl == br:
            return self._partial_sum(l, r)
        return (
            self._partial_sum(l, (bl + 1) * B)
            + sum(self.sums[bl + 1 : br])
            + self._partial_sum(br * B, r)
        )
```

The pattern to remember: **partial blocks by hand, whole blocks by tag**. Checked against a plain list:

```python
random.seed(11)
n = 50
arr = [random.randint(0, 9) for _ in range(n)]
sr = SqrtRangeAdd(arr)
for _ in range(200):
    l = random.randint(0, n)
    r = random.randint(l, n)
    x = random.randint(-3, 3)
    for i in range(l, r):
        arr[i] += x
    sr.add(l, r, x)
    l2 = random.randint(0, n)
    r2 = random.randint(l2, n)
    assert sr.query(l2, r2) == sum(arr[l2:r2])
```

## Mo's algorithm

If the queries are known in advance (**offline**) and you can cheaply *extend or shrink* the current answer by one element at either end, **Mo's algorithm** answers all $q$ range queries in about $O((n + q)\sqrt n)$.

**Idea.** Maintain a window $[L, R)$ with its answer. To move to the next query, slide $L$ and $R$ one step at a time, adding or removing an element and updating the answer. The whole job is ordering the queries so that the total movement is small:

1. Split the indices into blocks of size $B \approx n/\sqrt q$ (commonly $\sqrt n$).
2. Sort the queries by (block of $l$, then $r$). For odd blocks sort $r$ descending; this "zig-zag" saves about half the movement.
3. Within a block $R$ only moves forward (at most $n$ steps per block, $n \cdot n/B$ overall), while $L$ moves at most $B$ per query ($q \cdot B$ overall).

With $B = n/\sqrt q$ the total is $O(n\sqrt q)$.

### Example: number of distinct values in each range

```python
def mo_distinct(a, queries):
    """queries: list of (l, r) half-open. Return the number of distinct values in each a[l:r]."""
    n = len(a)
    B = max(1, int(n / max(1, len(queries)) ** 0.5))
    order = sorted(
        range(len(queries)),
        key=lambda i: (queries[i][0] // B, queries[i][1] if (queries[i][0] // B) % 2 == 0 else -queries[i][1]),
    )
    count = {}
    distinct = 0
    L = R = 0                                         # current window a[L:R]
    answers = [0] * len(queries)
    for qi in order:
        l, r = queries[qi]
        while L > l:
            L -= 1
            count[a[L]] = count.get(a[L], 0) + 1
            distinct += count[a[L]] == 1
        while R < r:
            count[a[R]] = count.get(a[R], 0) + 1
            distinct += count[a[R]] == 1
            R += 1
        while L < l:
            count[a[L]] -= 1
            distinct -= count[a[L]] == 0
            L += 1
        while R > r:
            R -= 1
            count[a[R]] -= 1
            distinct -= count[a[R]] == 0
        answers[qi] = distinct
    return answers

arr = [1, 2, 1, 3, 2, 2, 4, 1]
qs = [(0, 4), (2, 8), (1, 3), (5, 6), (0, 8)]
assert mo_distinct(arr, qs) == [3, 4, 2, 1, 4]

random.seed(13)
for _ in range(50):
    n = random.randint(1, 40)
    arr = [random.randint(1, 6) for _ in range(n)]
    qs = []
    for _ in range(random.randint(1, 30)):
        l = random.randint(0, n - 1)
        qs.append((l, random.randint(l + 1, n)))
    assert mo_distinct(arr, qs) == [len(set(arr[l:r])) for l, r in qs]
```

The order of the four `while` loops matters: **extend before shrinking** (grow $L$ leftwards and $R$ rightwards first, then shrink), so the window never becomes "negative" and counters never go below zero.

### Tips

- Mo's algorithm needs an operation that is easy to add and remove (counts, sums, frequencies of frequencies). It cannot handle "maximum" directly without a rollback trick.
- In Python, use lists indexed by value instead of dictionaries when values are small or compressed; it is noticeably faster.
- Expect roughly $10^5$ queries on $10^5$ elements to be a stretch for CPython; it is meant for $n, q \lesssim 3 \cdot 10^4$–$5 \cdot 10^4$ with a 5-second limit.

## When to use what

| Situation | Choice |
|-----------|--------|
| point update, range sum | [Fenwick](/theory/data-structures/fenwick-tree) |
| range update/query with a mergeable summary | [segment tree](/theory/data-structures/segment-tree) |
| static array, min/max | [sparse table](/theory/data-structures/sparse-table) |
| the summary is not mergeable, or the queries are offline | **sqrt decomposition / Mo's** |

## Practice problems

- [Codeforces - Kuriyama Mirai's Stones](https://codeforces.com/problemset/problem/433/B)
- [Codeforces - Another Problem about Beautiful Pairs](https://codeforces.com/contest/2197/problem/D)
- [UVA - 12003 - Array Transformer](https://uva.onlinejudge.org/index.php?option=com_onlinejudge&Itemid=8&page=show_problem&problem=3154)
- [UVA - 11990 Dynamic Inversion](https://uva.onlinejudge.org/index.php?option=com_onlinejudge&Itemid=8&page=show_problem&problem=3141)
- [SPOJ - Give Away](http://www.spoj.com/problems/GIVEAWAY/)
- [Codeforces - Till I Collapse](http://codeforces.com/contest/786/problem/C)
- [Codeforces - Destiny](http://codeforces.com/contest/840/problem/D)
- [Codeforces - Holes](http://codeforces.com/contest/13/problem/E)
- [Codeforces - XOR and Favorite Number](https://codeforces.com/problemset/problem/617/E)
- [Codeforces - Powerful array](http://codeforces.com/problemset/problem/86/D)
- [SPOJ - DQUERY](https://www.spoj.com/problems/DQUERY)
- [Codeforces - Robin Hood Archery](https://codeforces.com/contest/2014/problem/H)
