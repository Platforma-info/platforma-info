---
title: "Range Minimum Query: Choosing a Structure"
section: Sequences
order: 1
difficulty: intermediate
summary: "A tour of the ways to answer 'minimum of A[L..R]': sqrt-decomposition, segment tree, Fenwick tree, sparse table, an offline DSU trick and the Cartesian tree, with Python code and trade-offs."
tags: [rmq, sparse table, segment tree, fenwick tree, offline queries, dsu]
prerequisites: [data-structures/sparse-table, data-structures/segment-tree]
source:
  title: "Range Minimum Query"
  url: https://cp-algorithms.com/sequences/rmq.html
  license: CC BY-SA 4.0
---

You are given an array $A[1..N]$ and must answer queries $(L, R)$: the minimum element of $A$ between positions $L$ and $R$ inclusive. **RMQ** appears directly in problems and as a building block, for example in the [lowest common ancestor](/theory/graphs/lca) problem.

There are many solutions; which to use depends on whether the array **changes** between queries and whether the queries are known in advance (**offline**).

## Comparison

| Structure | Preprocessing | Query | Updates | Notes |
|-----------|---------------|-------|---------|-------|
| [Sqrt-decomposition](/theory/data-structures/sqrt-decomposition) | $O(N)$ | $O(\sqrt N)$ | yes | very simple |
| [Segment tree](/theory/data-structures/segment-tree) | $O(N)$ | $O(\log N)$ | yes | the most flexible |
| [Fenwick tree](/theory/data-structures/fenwick-tree) | $O(N\log N)$ | $O(\log N)$ | yes* | shortest code; *only prefix queries or values that only decrease |
| [Sparse table](/theory/data-structures/sparse-table) | $O(N\log N)$ | $O(1)$ | no | simple, excellent |
| [Sqrt tree](/theory/data-structures/sqrt-tree) | $O(N\log\log N)$ | $O(1)$ | no | complicated |
| DSU / Arpa's trick | $O(N\alpha)$ | $O(1)$ amortized | no | queries must be known in advance |
| [Cartesian tree + Farach-Colton–Bender](/theory/graphs/rmq-linear) | $O(N)$ | $O(1)$ | no | optimal; a lot of code |

Below is compact Python code for the most useful ones, all checked against `min(a[l:r+1])`.

## Sparse table (static array)

Store the minimum of every window of length $2^j$; a query covers `[l, r]` with two overlapping windows.

```python
class SparseTable:
    def __init__(self, a):
        self.table = [list(a)]
        j = 1
        while (1 << j) <= len(a):
            prev, half = self.table[-1], 1 << (j - 1)
            self.table.append([min(prev[i], prev[i + half]) for i in range(len(a) - (1 << j) + 1)])
            j += 1

    def query(self, l, r):                      # inclusive
        j = (r - l + 1).bit_length() - 1
        return min(self.table[j][l], self.table[j][r - (1 << j) + 1])

st = SparseTable([5, 2, 4, 7, 6, 3, 1, 8])
assert st.query(0, 3) == 2 and st.query(3, 5) == 3 and st.query(6, 6) == 1 and st.query(0, 7) == 1
```

## Segment tree (with point updates)

An iterative bottom-up tree: `tree[i + n]` holds the leaves, and `tree[i]` the minimum of its two children.

```python
class SegmentTreeMin:
    def __init__(self, a):
        self.n = len(a)
        self.tree = [float("inf")] * self.n + list(a)
        for i in range(self.n - 1, 0, -1):
            self.tree[i] = min(self.tree[2 * i], self.tree[2 * i + 1])

    def update(self, i, value):
        i += self.n
        self.tree[i] = value
        while i > 1:
            i >>= 1
            self.tree[i] = min(self.tree[2 * i], self.tree[2 * i + 1])

    def query(self, l, r):                      # inclusive
        best = float("inf")
        l += self.n
        r += self.n + 1
        while l < r:
            if l & 1:
                best = min(best, self.tree[l])
                l += 1
            if r & 1:
                r -= 1
                best = min(best, self.tree[r])
            l >>= 1
            r >>= 1
        return best

seg = SegmentTreeMin([5, 2, 4, 7, 6, 3, 1, 8])
assert seg.query(0, 3) == 2
seg.update(1, 9)
assert seg.query(0, 3) == 4
```

## Fenwick tree (prefix minima)

A Fenwick tree for `min` supports the query "minimum of `A[0..r]`" and updates that only *decrease* a value. Arbitrary ranges are not possible, since minimum has no inverse operation.

```python
class FenwickMin:
    def __init__(self, n):
        self.n = n
        self.tree = [float("inf")] * (n + 1)

    def update(self, i, value):                 # A[i] = min(A[i], value)
        i += 1
        while i <= self.n:
            self.tree[i] = min(self.tree[i], value)
            i += i & -i

    def prefix_min(self, r):                    # min of A[0..r]
        i, best = r + 1, float("inf")
        while i > 0:
            best = min(best, self.tree[i])
            i -= i & -i
        return best

fw = FenwickMin(8)
for i, x in enumerate([5, 2, 4, 7, 6, 3, 1, 8]):
    fw.update(i, x)
assert fw.prefix_min(3) == 2 and fw.prefix_min(0) == 5 and fw.prefix_min(7) == 1
```

## Sqrt-decomposition

Blocks of size about $\sqrt N$ with their minima: a query scans at most two partial blocks and jumps over the full blocks between them. It also supports updates (recompute one block).

```python
class SqrtMin:
    def __init__(self, a):
        self.a = list(a)
        self.size = max(1, int(len(a) ** 0.5))
        self.blocks = [min(self.a[i:i + self.size]) for i in range(0, len(a), self.size)]

    def update(self, i, value):
        self.a[i] = value
        b = i // self.size
        self.blocks[b] = min(self.a[b * self.size:(b + 1) * self.size])

    def query(self, l, r):
        bl, br = l // self.size, r // self.size
        if bl == br:
            return min(self.a[l:r + 1])
        return min(min(self.a[l:(bl + 1) * self.size]), min(self.blocks[bl + 1:br], default=float("inf")),
                   min(self.a[br * self.size:r + 1]))

sq = SqrtMin([5, 2, 4, 7, 6, 3, 1, 8])
assert sq.query(0, 3) == 2 and sq.query(2, 7) == 1 and sq.query(3, 4) == 6
```

## Offline: Arpa's trick with a DSU

If all queries are known in advance, process the array left to right while maintaining a **monotonic stack** of the current suffix minima; a DSU points every position to the stack element that is the minimum of the range starting there. When we reach position `r`, each query `(l, r)` is answered by `find(l)`. Total near-linear time, and very short code:

```python
def offline_rmq(a, queries):
    """queries: list of (l, r), inclusive. Returns the minimum of a[l..r] for each query."""
    n = len(a)
    by_right = [[] for _ in range(n)]
    for idx, (l, r) in enumerate(queries):
        by_right[r].append((l, idx))
    parent = list(range(n))                      # every position points at the position of its range minimum

    def find(x):
        root = x
        while parent[root] != root:
            root = parent[root]
        while parent[x] != root:
            parent[x], x = root, parent[x]
        return root

    stack, answers = [], [None] * len(queries)
    for r in range(n):
        while stack and a[stack[-1]] >= a[r]:    # r is a smaller (or equal) minimum for these positions
            parent[stack.pop()] = r
        stack.append(r)
        for l, idx in by_right[r]:
            answers[idx] = a[find(l)]
    return answers

assert offline_rmq([5, 2, 4, 7, 6, 3, 1, 8], [(0, 3), (3, 5), (6, 6), (0, 7), (4, 5)]) == [2, 3, 1, 1, 3]
```

At the moment we are at `r`, the stack holds the positions `s_1 < s_2 < ... < s_k = r` such that `a[s_i]` are the strict suffix minima; the minimum of `[l, r]` is `a[s_i]` for the first `s_i >= l`. The DSU links each removed position to the element that dominated it, so `find(l)` reaches that `s_i`.

## Testing

```python
import random

rnd = random.Random(1)
for _ in range(300):
    n = rnd.randint(1, 40)
    a = [rnd.randint(-20, 20) for _ in range(n)]
    queries = []
    for _ in range(30):
        l = rnd.randrange(n)
        queries.append((l, rnd.randrange(l, n)))
    st, seg, sq = SparseTable(a), SegmentTreeMin(a), SqrtMin(a)
    fw = FenwickMin(n)
    for i, x in enumerate(a):
        fw.update(i, x)
    expected = [min(a[l:r + 1]) for l, r in queries]
    assert [st.query(l, r) for l, r in queries] == expected
    assert [seg.query(l, r) for l, r in queries] == expected
    assert [sq.query(l, r) for l, r in queries] == expected
    assert offline_rmq(a, queries) == expected
    assert all(fw.prefix_min(r) == min(a[:r + 1]) for r in range(n))
    # updates: the segment tree and the sqrt-decomposition follow the array
    for _ in range(10):
        i, x = rnd.randrange(n), rnd.randint(-20, 20)
        a[i] = x
        seg.update(i, x)
        sq.update(i, x)
        l = rnd.randrange(n)
        r = rnd.randrange(l, n)
        assert seg.query(l, r) == sq.query(l, r) == min(a[l:r + 1])
```

## Which to pick in practice

- **Static array, online queries:** the sparse table (`O(1)` queries; memory $N\log N$).
- **Updates:** the segment tree; the Fenwick tree only if updates only ever decrease the values.
- **Offline, tight memory:** the DSU trick.
- **Range minimum with the *position* of the minimum** (argmin): store `(value, index)` tuples in the same structures.
- In Python, for arrays of millions of elements with many queries, vectorize with `numpy`: building a sparse table with `np.minimum` on shifted arrays takes milliseconds.

## Practice problems

- [SPOJ: Range Minimum Query](http://www.spoj.com/problems/RMQSQ/)
- [CODECHEF: Chef And Array](https://www.codechef.com/problems/FRMQ)
- [Codeforces:  Array Partition](https://codeforces.com/contest/1454/problem/F)
