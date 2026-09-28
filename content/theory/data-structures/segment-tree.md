---
title: Segment Tree
section: Trees
order: 3
difficulty: advanced
summary: Answer range queries (sum, min, max, gcd, ...) and point updates in O(log n), then add lazy propagation for range updates.
tags: [segment tree, range queries, lazy propagation, monoid]
prerequisites: [data-structures/fenwick-tree]
source:
  title: Segment Tree
  url: https://cp-algorithms.com/data_structures/segment_tree.html
  license: CC BY-SA 4.0
---

A **segment tree** stores information about array segments in a binary tree so that

- any *range query* (sum, minimum, maximum, gcd, ...) on $[l, r)$ takes $O(\log n)$,
- a *point update* takes $O(\log n)$,
- with **lazy propagation**, a *range update* also takes $O(\log n)$.

It is the most versatile data structure in this section. A [Fenwick tree](/theory/data-structures/fenwick-tree) is shorter but only handles invertible operations like sums.

## The structure

The root represents the whole array $[0, n)$. Each node covering $[l, r)$ with more than one element has two children covering the left and right halves; leaves are single elements. Every node stores the combined value of its segment (for sum: the sum). A node's value is computed from its two children, so building takes $O(n)$ and the tree has about $2n$ nodes.

Any query segment $[l, r)$ splits into $O(\log n)$ disjoint node segments; combining their values gives the answer.

## Iterative bottom-up implementation

A recursive tree is elegant but slow in Python (function calls are expensive). The following array-based version stores the leaves at positions $n .. 2n-1$ and the parent of node $i$ at $i/2$. It has no recursion, works for **any** $n$ (not only powers of two), and for any associative operation, even a non-commutative one.

```python
class SegmentTree:
    """Point update, range query over an associative operation `op` with identity `e`."""

    def __init__(self, data, op, e):
        self.n = len(data)
        self.op, self.e = op, e
        self.t = [e] * self.n + list(data)
        for i in range(self.n - 1, 0, -1):
            self.t[i] = op(self.t[2 * i], self.t[2 * i + 1])

    def update(self, i, value):
        """a[i] = value"""
        i += self.n
        self.t[i] = value
        i >>= 1
        while i:
            self.t[i] = self.op(self.t[2 * i], self.t[2 * i + 1])
            i >>= 1

    def query(self, l, r):
        """Combine a[l:r] (half-open)."""
        op, t = self.op, self.t
        left = right = self.e
        l += self.n
        r += self.n
        while l < r:
            if l & 1:
                left = op(left, t[l])
                l += 1
            if r & 1:
                r -= 1
                right = op(t[r], right)
            l >>= 1
            r >>= 1
        return op(left, right)

from math import gcd

a = [5, 3, 7, 9, 6, 4, 1, 2]
sum_tree = SegmentTree(a, lambda x, y: x + y, 0)
min_tree = SegmentTree(a, min, float("inf"))
gcd_tree = SegmentTree([12, 18, 30, 8, 20], gcd, 0)

assert sum_tree.query(2, 6) == 7 + 9 + 6 + 4
assert min_tree.query(0, 8) == 1 and min_tree.query(0, 4) == 3
assert gcd_tree.query(0, 3) == 6 and gcd_tree.query(2, 5) == 2

sum_tree.update(3, 100)
assert sum_tree.query(0, 8) == sum(a) - 9 + 100
```

The accumulators `left` and `right` keep the order of operands correct, so the tree also works for non-commutative operations such as string concatenation or matrix multiplication:

```python
import random

random.seed(2)
for _ in range(200):
    n = random.randint(1, 20)
    words = [random.choice("abc") for _ in range(n)]
    tree = SegmentTree(words, lambda x, y: x + y, "")           # concatenation is not commutative
    for _ in range(20):
        l = random.randint(0, n)
        r = random.randint(l, n)
        assert tree.query(l, r) == "".join(words[l:r])
    i = random.randrange(n)
    words[i] = "z"
    tree.update(i, "z")
    assert tree.query(0, n) == "".join(words)
```

### What can `op` be?

Anything associative with an identity element (a *monoid*):

| Query | `op` | `e` |
|-------|------|-----|
| sum | `+` | `0` |
| minimum | `min` | `+inf` |
| maximum | `max` | `-inf` |
| gcd | `math.gcd` | `0` |
| xor | `^` | `0` |
| number of zeros | `+` on `1 if x == 0 else 0` | `0` |
| min with position | `min` on `(value, index)` tuples | `(inf, -1)` |
| max subarray sum | a merge of `(total, best, prefix, suffix)` | see below |

### A richer node: maximum subarray sum

Each node stores four numbers: total sum, best prefix, best suffix and best subarray. Combining two nodes is a constant-time rule:

```python
def merge(a, b):
    total_a, pref_a, suf_a, best_a = a
    total_b, pref_b, suf_b, best_b = b
    return (
        total_a + total_b,
        max(pref_a, total_a + pref_b),
        max(suf_b, total_b + suf_a),
        max(best_a, best_b, suf_a + pref_b),
    )

NEG = float("-inf")
EMPTY = (0, NEG, NEG, NEG)

def leaf(x):
    return (x, x, x, x)

def max_subarray_naive(a):
    return max(sum(a[i:j]) for i in range(len(a)) for j in range(i + 1, len(a) + 1))

values = [2, -5, 3, 4, -1, 2, -8, 6]
tree = SegmentTree([leaf(x) for x in values], merge, EMPTY)
assert tree.query(0, 8)[3] == 8                       # 3 + 4 - 1 + 2
assert tree.query(0, 3)[3] == 3
for l in range(8):
    for r in range(l + 1, 9):
        assert tree.query(l, r)[3] == max_subarray_naive(values[l:r])
```

## Descending the tree: searching by prefix sum

To find the first position where the running total reaches $k$ (for non-negative values), or the $k$-th one in a 0/1 array, walk down from the root. Padding $n$ to a power of two makes the tree perfect, and the descent is a simple loop:

```python
class SumTreeWithSearch:
    def __init__(self, data):
        self.size = 1
        while self.size < len(data):
            self.size *= 2
        self.t = [0] * (2 * self.size)
        self.t[self.size : self.size + len(data)] = data
        for i in range(self.size - 1, 0, -1):
            self.t[i] = self.t[2 * i] + self.t[2 * i + 1]

    def update(self, i, value):
        i += self.size
        self.t[i] = value
        while i > 1:
            i >>= 1
            self.t[i] = self.t[2 * i] + self.t[2 * i + 1]

    def first_prefix_at_least(self, k):
        """Smallest index p with a[0] + ... + a[p] >= k, or -1 if the total is less than k."""
        if self.t[1] < k:
            return -1
        node = 1
        while node < self.size:
            node *= 2
            if self.t[node] < k:          # not enough in the left child: go right
                k -= self.t[node]
                node += 1
        return node - self.size

flags = SumTreeWithSearch([1, 0, 1, 1, 0, 1])
assert [flags.first_prefix_at_least(k) for k in (1, 2, 3, 4)] == [0, 2, 3, 5]      # k-th one
flags.update(0, 0)
assert flags.first_prefix_at_least(1) == 2
assert flags.first_prefix_at_least(5) == -1
```

## Lazy propagation: range updates

To support "add $x$ to every element of $[l, r)$" together with range sum queries, tag a node with a *pending* update instead of pushing it to all its descendants. The tag is pushed down only when a later operation needs to descend through that node.

```python
class LazySegmentTree:
    """Range add, range sum."""

    def __init__(self, data):
        self.n = len(data)
        self.sum = [0] * (4 * self.n)
        self.lazy = [0] * (4 * self.n)
        self._build(1, 0, self.n, data)

    def _build(self, node, lo, hi, data):
        if hi - lo == 1:
            self.sum[node] = data[lo]
            return
        mid = (lo + hi) // 2
        self._build(2 * node, lo, mid, data)
        self._build(2 * node + 1, mid, hi, data)
        self.sum[node] = self.sum[2 * node] + self.sum[2 * node + 1]

    def _apply(self, node, lo, hi, x):
        self.sum[node] += x * (hi - lo)
        self.lazy[node] += x

    def _push(self, node, lo, hi):
        if self.lazy[node]:
            mid = (lo + hi) // 2
            self._apply(2 * node, lo, mid, self.lazy[node])
            self._apply(2 * node + 1, mid, hi, self.lazy[node])
            self.lazy[node] = 0

    def add(self, l, r, x, node=1, lo=0, hi=None):
        """a[l:r] += x"""
        if hi is None:
            hi = self.n
        if r <= lo or hi <= l:
            return
        if l <= lo and hi <= r:
            self._apply(node, lo, hi, x)
            return
        self._push(node, lo, hi)
        mid = (lo + hi) // 2
        self.add(l, r, x, 2 * node, lo, mid)
        self.add(l, r, x, 2 * node + 1, mid, hi)
        self.sum[node] = self.sum[2 * node] + self.sum[2 * node + 1]

    def query(self, l, r, node=1, lo=0, hi=None):
        """Sum of a[l:r]"""
        if hi is None:
            hi = self.n
        if r <= lo or hi <= l:
            return 0
        if l <= lo and hi <= r:
            return self.sum[node]
        self._push(node, lo, hi)
        mid = (lo + hi) // 2
        return self.query(l, r, 2 * node, lo, mid) + self.query(l, r, 2 * node + 1, mid, hi)

random.seed(4)
for _ in range(100):
    n = random.randint(1, 30)
    arr = [random.randint(-5, 5) for _ in range(n)]
    tree = LazySegmentTree(arr)
    for _ in range(40):
        l = random.randint(0, n - 1)
        r = random.randint(l + 1, n)
        if random.random() < 0.5:
            x = random.randint(-3, 3)
            for i in range(l, r):
                arr[i] += x
            tree.add(l, r, x)
        else:
            assert tree.query(l, r) == sum(arr[l:r])
```

The same skeleton supports assignment on segments, add + maximum, and other combinations: define the *tag*, how a tag transforms a node value, and how two tags compose.

> [!NOTE]
> The recursive lazy tree is fine for $q \lesssim 10^5$ operations in Python. If a problem is heavier, consider a Fenwick tree with two arrays (range add / range sum), offline processing, or square-root decomposition.

## Other variations (from the original article)

- **Merge sort tree**: store a sorted list in every node to answer "count/smallest element $\ge x$ in a range".
- **2D segment trees** for rectangle queries.
- **Persistent segment tree**: keep every version (for example, the $k$-th smallest in a range).
- **Dynamic (sparse) segment tree**: create nodes only when needed, to handle coordinates up to $10^9$.

## Complexity

| Operation | Time |
|-----------|------|
| build | $O(n)$ |
| point update | $O(\log n)$ |
| range query | $O(\log n)$ |
| range update (lazy) | $O(\log n)$ |
| memory | $O(n)$ |

## Practice problems

- [SPOJ - KQUERY](http://www.spoj.com/problems/KQUERY/) [Persistent segment tree / Merge sort tree]
- [Codeforces - Xenia and Bit Operations](https://codeforces.com/problemset/problem/339/D)
- [UVA 11402 - Ahoy, Pirates!](https://uva.onlinejudge.org/index.php?option=com_onlinejudge&Itemid=8&page=show_problem&problem=2397)
- [SPOJ - GSS3](http://www.spoj.com/problems/GSS3/)
- [Codeforces - Sereja And Brackets](https://codeforces.com/contest/380/problem/C)
- [Codeforces - Distinct Characters Queries](https://codeforces.com/problemset/problem/1234/D)
- [Codeforces - Knight Tournament](https://codeforces.com/contest/356/problem/A) [For beginners]
- [Codeforces - Ant colony](https://codeforces.com/contest/474/problem/F)
- [Codeforces - Drazil and Park](https://codeforces.com/contest/515/problem/E)
- [Codeforces - Circular RMQ](https://codeforces.com/problemset/problem/52/C)
- [Codeforces - Lucky Array](https://codeforces.com/contest/121/problem/E)
- [Codeforces - The Child and Sequence](https://codeforces.com/contest/438/problem/D)
- [Codeforces - DZY Loves Fibonacci Numbers](https://codeforces.com/contest/446/problem/C) [Lazy propagation]
- [Codeforces - Alphabet Permutations](https://codeforces.com/problemset/problem/610/E)
- [Codeforces - Eyes Closed](https://codeforces.com/problemset/problem/895/E)
- [Codeforces - Kefa and Watch](https://codeforces.com/problemset/problem/580/E)
- [Codeforces - A Simple Task](https://codeforces.com/problemset/problem/558/E)
- [Codeforces - SUM and REPLACE](https://codeforces.com/problemset/problem/920/F)
- [Codeforces - XOR on Segment](https://codeforces.com/problemset/problem/242/E) [Lazy propagation]
- [Codeforces - Please, another Queries on Array?](https://codeforces.com/problemset/problem/1114/F) [Lazy propagation]
- [COCI - Deda](https://oj.uz/problem/view/COCI17_deda) [Last element smaller or equal to x / Binary search]
- [Codeforces - The Untended Antiquity](https://codeforces.com/problemset/problem/869/E) [2D]
- [CSES - Hotel Queries](https://cses.fi/problemset/task/1143)
- [CSES - Polynomial Queries](https://cses.fi/problemset/task/1736)
- [CSES - Range Updates and Sums](https://cses.fi/problemset/task/1735)
