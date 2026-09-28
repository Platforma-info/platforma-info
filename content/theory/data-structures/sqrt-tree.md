---
title: "Sqrt Tree"
section: Trees
order: 7
difficulty: advanced
summary: "Answer range queries for any associative operation in O(1) after O(n log log n) preprocessing, by applying sqrt decomposition recursively."
tags: [sqrt tree, range queries, static, associative operation]
prerequisites: [data-structures/sqrt-decomposition, data-structures/sparse-table, math/bit-manipulation]
source:
  title: "Sqrt Tree"
  url: https://cp-algorithms.com/data_structures/sqrt-tree.html
  license: CC BY-SA 4.0
---

We have an array $a$ of $n$ elements and an **associative** operation $\circ$ (sum, minimum, gcd, xor, string concatenation, matrix product, ...). A query $q(l, r)$ asks for $a_l \circ a_{l+1} \circ \dots \circ a_r$.

| Structure | Build | Query | Works for |
|-----------|-------|-------|-----------|
| [Sparse table](/theory/data-structures/sparse-table) | $O(n \log n)$ | $O(1)$ | idempotent operations only |
| [Segment tree](/theory/data-structures/segment-tree) | $O(n)$ | $O(\log n)$ | any associative operation |
| **Sqrt tree** | $O(n \log\log n)$ | $O(1)$ | any associative operation |

The sqrt tree is the only one that gives $O(1)$ queries for operations such as sum, gcd or matrix product without needing an inverse or idempotency.

## One level: sqrt decomposition

Split the array into blocks of size about $\sqrt n$. For every block compute

1. `prefix[i]`: the combination from the start of $i$'s block up to $i$;
2. `suffix[i]`: the combination from $i$ to the end of its block;
3. `between[bi][bj]` for blocks $bi \le bj$: the combination of all elements of the blocks $bi..bj$. There are $\sqrt n$ blocks, so this table has $O(n)$ entries.

A query $[l, r]$ that touches at least two different blocks splits into three pieces: a suffix of $l$'s block, a run of complete blocks in between, and a prefix of $r$'s block. Combine `suffix[l]`, `between[...]` and `prefix[r]`: $O(1)$.

The only queries we cannot answer are those entirely **inside one block**.

## Making a tree

For the queries that fit into one block, build the *same* structure recursively inside every block. A segment of size $k$ becomes blocks of size $\sqrt k$, then $\sqrt[4]{k}$, and so on until the blocks have 1 or 2 elements. Since $\log k$ halves at every level, the tree has only $O(\log\log n)$ levels, and every element lies in exactly one node per level, so the memory and build time are $O(n \log\log n)$.

## $O(1)$ queries with bit tricks

Following the tree down to find the right level costs $O(\log\log n)$. To jump straight to the right level, make the sizes powers of two: pad the array to $N = 2^{\lg}$ elements and use blocks of size $2^b$ where a node of size $2^k$ has $b = \lceil k/2 \rceil$.

Two indices $l$ and $r$ lie in the same aligned block of size $2^b$ **iff** they agree on all bits above bit $b - 1$, i.e. $(l \oplus r) < 2^b$. So the highest set bit $h$ of $l \oplus r$ tells us the level: the node in which $l$ and $r$ first fall into *different* blocks is the one whose block size satisfies $b \le h < k$. A table `layer[h]` precomputed once gives the level directly.

```python
class SqrtTree:
    """Static range queries for an associative operation in O(1)."""

    def __init__(self, data, op):
        assert len(data) >= 1
        self.op = op
        self.n = len(data)
        self.lg = max(1, (self.n - 1).bit_length())
        self.N = 1 << self.lg
        self.a = list(data) + [data[-1]] * (self.N - self.n)      # padding is never queried
        self.levels = []                                          # (k, b): node size 2^k, block size 2^b
        k = self.lg
        while k > 1:
            b = (k + 1) // 2
            self.levels.append((k, b))
            k = b
        self.layer = [None] * self.lg                             # layer[h] for h >= 1
        for j, (k, b) in enumerate(self.levels):
            for h in range(b, k):
                self.layer[h] = j
        self._build()

    def _build(self):
        op, a, N = self.op, self.a, self.N
        self.prefix, self.suffix, self.between = [], [], []
        for k, b in self.levels:
            bs, nb = 1 << b, 1 << (k - b)
            pre, suf = [None] * N, [None] * N
            between = [None] * ((N >> k) * nb * nb)
            for s in range(0, N, 1 << k):
                totals = []
                for bi in range(nb):
                    start = s + bi * bs
                    end = start + bs
                    acc = a[start]
                    pre[start] = acc
                    for i in range(start + 1, end):
                        acc = op(acc, a[i])
                        pre[i] = acc
                    totals.append(acc)
                    acc = a[end - 1]
                    suf[end - 1] = acc
                    for i in range(end - 2, start - 1, -1):
                        acc = op(a[i], acc)
                        suf[i] = acc
                base = (s >> k) * nb * nb
                for bi in range(nb):
                    acc = totals[bi]
                    between[base + bi * nb + bi] = acc
                    for bj in range(bi + 1, nb):
                        acc = op(acc, totals[bj])
                        between[base + bi * nb + bj] = acc
            self.prefix.append(pre)
            self.suffix.append(suf)
            self.between.append(between)

    def query(self, l, r):
        """Combine a[l..r] (inclusive)."""
        if l == r:
            return self.a[l]
        h = (l ^ r).bit_length() - 1
        if h == 0:                                  # an aligned pair of neighbours
            return self.op(self.a[l], self.a[r])
        j = self.layer[h]
        k, b = self.levels[j]
        nb = 1 << (k - b)
        mask = nb - 1
        bl, br = (l >> b) & mask, (r >> b) & mask
        result = self.suffix[j][l]
        if br - bl > 1:
            base = (l >> k) * nb * nb
            result = self.op(result, self.between[j][base + (bl + 1) * nb + (br - 1)])
        return self.op(result, self.prefix[j][r])

    def update(self, i, value):
        """Point assignment; this simple version rebuilds in O(n log log n)."""
        self.a[i] = value
        self._build()

t = SqrtTree(list(range(1, 10)), lambda x, y: x + y)
assert t.query(0, 8) == 45 and t.query(3, 6) == 4 + 5 + 6 + 7 and t.query(2, 2) == 3
```

## Testing against brute force

Every pair $(l, r)$ for many sizes, with a commutative operation (sum, min, gcd) and a non-commutative one (string concatenation):

```python
import random
from functools import reduce
from math import gcd

random.seed(1)
for n in range(1, 70):
    values = [random.randint(1, 50) for _ in range(n)]
    tree_sum = SqrtTree(values, lambda x, y: x + y)
    tree_min = SqrtTree(values, min)
    tree_gcd = SqrtTree([v * 6 for v in values], gcd)
    letters = [random.choice("abc") for _ in range(n)]
    tree_str = SqrtTree(letters, lambda x, y: x + y)
    for l in range(n):
        for r in range(l, n):
            assert tree_sum.query(l, r) == sum(values[l:r + 1])
            assert tree_min.query(l, r) == min(values[l:r + 1])
            assert tree_gcd.query(l, r) == reduce(gcd, [v * 6 for v in values[l:r + 1]])
            assert tree_str.query(l, r) == "".join(letters[l:r + 1])

tree = SqrtTree(values, lambda x, y: x + y)
tree.update(3, 1000)
values[3] = 1000
assert tree.query(0, len(values) - 1) == sum(values)
```

## Updates

- **Point update** in $O(\sqrt n)$: only $O(\sqrt{k})$ prefix/suffix entries of the changed element's block change on each level, but the `between` table of the root would need $O(n)$ work. The trick is to replace the root's `between` table by another (unindexed) sqrt tree over the $\sqrt n$ block totals, called `index`. Its size is $\sqrt n$, and one updated block means an $O(\sqrt n)$ rebuild of `index`.
- **Range assignment** or addition can be supported with lazy propagation at the cost of $O(\sqrt n)$ per update.

The simple `update` above rebuilds everything; it is fine when queries vastly outnumber updates.

## When is it useful?

Almost never in Python, honestly: the constant factors of the precomputation make it slower than a [sparse table](/theory/data-structures/sparse-table) or even a [segment tree](/theory/data-structures/segment-tree) unless you have tens of millions of queries. Its value is conceptual: a beautiful example of *recursing on the square root*, and the fact that $O(1)$ queries for a non-idempotent operation are possible in nearly linear space.
