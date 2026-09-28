---
title: "LCA in O(1) with Linear Preprocessing: Farach-Colton and Bender"
section: Trees and LCA
order: 3
difficulty: advanced
summary: "Split the Euler-tour height array into small blocks: a sparse table over block minima, and precomputed answers for all ±1 block shapes, gives LCA queries in O(1) after O(n) preprocessing."
tags: [lca, rmq, farach-colton, bender, sparse table, bitmask]
prerequisites: [graphs/lca, data-structures/sparse-table]
source:
  title: "Lowest Common Ancestor - Farach-Colton and Bender Algorithm"
  url: https://cp-algorithms.com/graph/lca_farachcoltonbender.html
  license: CC BY-SA 4.0
---

We use the [reduction of LCA to RMQ](/theory/graphs/lca) over the Euler tour, and want to answer the range minimum queries in $O(1)$ with only $O(n)$ preprocessing (a [sparse table](/theory/data-structures/sparse-table) takes $O(n\log n)$). The Farach-Colton and Bender algorithm does exactly that and is asymptotically optimal.

The key property of our RMQ instance: adjacent elements of the array of heights differ by **exactly $\pm1$** (we either go down to a child, height $+1$, or back up to the parent, height $-1$).

## Algorithm

Let $A$ be the array (of size $N$) and $K = \tfrac12\log_2 N$.

1. **Split $A$ into blocks of size $K$** and compute the minimum of each block. Build a sparse table over the $N/K$ block minima. Its size is
$$
\frac NK\log\frac NK = O\!\left(\frac{N}{\log N}\cdot\log N\right) = O(N)
$$
2. **Queries inside a block.** A query $[l, r]$ with both ends in different blocks is the minimum of three parts: the suffix of the first block from $l$, the prefix of the last block up to $r$, and the whole blocks in between (a sparse-table query). For the suffix, prefix or an in-block query we need RMQ *inside* one block.
3. Because neighbours differ by $\pm 1$, a block is determined (up to adding a constant) by the sequence of its $K - 1$ steps $\pm1$, i.e. by a **bitmask of length $K - 1$**. There are only $2^{K-1} = \tfrac12\sqrt N$ different blocks! For every block *shape* that occurs, precompute the answers for all $K^2$ pairs $(l, r)$: total $O(\sqrt N\log^2 N) = O(N)$ time.

A query then uses at most four precomputed values: the minimum inside the left block, inside the right block, and two overlapping sparse-table entries for the blocks between them.

## Implementation

Below, `PlusMinusOneRMQ` answers "the index of a minimum in $a[l..r]$" for an array with $\pm1$ steps; the LCA class wraps the Euler tour.

```python
class PlusMinusOneRMQ:
    """Argmin queries on an array in which neighbouring values differ by exactly 1."""

    def __init__(self, a):
        self.a = a
        n = len(a)
        self.log = [0] * (n + 2)
        for i in range(2, n + 2):
            self.log[i] = self.log[i // 2] + 1
        self.k = k = max(1, self.log[n] // 2)                 # block size
        self.nblocks = (n + k - 1) // k
        # the minimum of each block, and a sparse table over these minima
        block_min = []
        for b in range(self.nblocks):
            lo, hi = b * k, min(n, (b + 1) * k)
            block_min.append(min(range(lo, hi), key=a.__getitem__))
        self.st = [block_min]
        j = 1
        while (1 << j) <= self.nblocks:
            prev, half = self.st[-1], 1 << (j - 1)
            self.st.append([self._better(prev[i], prev[i + half]) for i in range(self.nblocks - (1 << j) + 1)])
            j += 1
        # the shape (mask) of each block: bit j-1 is set if the step j-1 -> j goes up
        self.mask = []
        for b in range(self.nblocks):
            m = 0
            for j in range(1, k):
                i = b * k + j
                if i < n and a[i] > a[i - 1]:
                    m |= 1 << (j - 1)
            self.mask.append(m)
        # answers inside blocks, for each different shape
        self.inner = {}
        for m in set(self.mask):
            heights = [0]
            for j in range(k - 1):
                heights.append(heights[-1] + (1 if m >> j & 1 else -1))
            table = [[0] * k for _ in range(k)]
            for l in range(k):
                best = l
                for r in range(l, k):
                    if heights[r] < heights[best]:
                        best = r
                    table[l][r] = best
            self.inner[m] = table

    def _better(self, i, j):
        return i if self.a[i] <= self.a[j] else j

    def _in_block(self, b, l, r):
        return b * self.k + self.inner[self.mask[b]][l][r]

    def argmin(self, l, r):
        k = self.k
        bl, br = l // k, r // k
        if bl == br:
            return self._in_block(bl, l % k, r % k)
        best = self._better(self._in_block(bl, l % k, k - 1), self._in_block(br, 0, r % k))
        if bl + 1 < br:
            j = self.log[br - bl - 1]
            best = self._better(best, self._better(self.st[j][bl + 1], self.st[j][br - (1 << j)]))
        return best

class LCA:
    def __init__(self, adj, root=0):
        n = len(adj)
        self.euler, self.first, self.height = [], [-1] * n, [0] * n
        seen = [False] * n
        seen[root] = True
        self.first[root] = 0
        self.euler.append(root)
        stack = [(root, 0)]
        while stack:
            v, i = stack.pop()
            if i < len(adj[v]):
                stack.append((v, i + 1))
                u = adj[v][i]
                if not seen[u]:
                    seen[u] = True
                    self.height[u] = self.height[v] + 1
                    self.first[u] = len(self.euler)
                    self.euler.append(u)
                    stack.append((u, 0))
            elif stack:
                self.euler.append(stack[-1][0])
        self.rmq = PlusMinusOneRMQ([self.height[v] for v in self.euler])

    def query(self, u, v):
        l, r = self.first[u], self.first[v]
        if l > r:
            l, r = r, l
        return self.euler[self.rmq.argmin(l, r)]

adj = [[1, 2, 3], [0, 4, 5], [0], [0, 6], [1], [1], [3]]
lca = LCA(adj)
assert lca.query(5, 3) == 0 and lca.query(4, 5) == 1 and lca.query(6, 6) == 6 and lca.query(2, 6) == 0
```

## Testing

First the RMQ itself, on random $\pm1$ arrays of many lengths (every pair $(l, r)$ is tested, so blocks of all shapes and the tail block are exercised), then the LCA against the definition on random trees:

```python
import random

rnd = random.Random(3)
for _ in range(300):
    n = rnd.randint(1, 150)
    a = [rnd.randint(0, 5)]
    for _ in range(n - 1):
        a.append(a[-1] + rnd.choice((-1, 1)))
    rmq = PlusMinusOneRMQ(a)
    for l in range(n):
        for r in range(l, n):
            assert a[rmq.argmin(l, r)] == min(a[l:r + 1])

def random_tree(n):
    adj = [[] for _ in range(n)]
    parent = [-1] * n
    for v in range(1, n):
        p = rnd.randrange(v) if rnd.random() < 0.6 else v - 1
        parent[v] = p
        adj[p].append(v)
        adj[v].append(p)
    return adj, parent

for _ in range(100):
    n = rnd.randint(1, 60)
    adj, parent = random_tree(n)
    depth = [0] * n
    for v in range(1, n):
        depth[v] = depth[parent[v]] + 1
    fast = LCA(adj)
    for u in range(n):
        for v in range(n):
            a, b = u, v
            while depth[a] > depth[b]:
                a = parent[a]
            while depth[b] > depth[a]:
                b = parent[b]
            while a != b:
                a, b = parent[a], parent[b]
            assert fast.query(u, v) == a
```

## Remarks

- In practice the sparse table with $O(n\log n)$ memory is much simpler and hard to beat; the block algorithm pays off only for very large inputs or when memory is tight. In Python neither has an advantage from the constant $O(1)$; the value here is understanding the technique.
- The same block idea (small blocks handled by precomputed tables over a "shape" key) is the basis of many *four Russians* speed-ups.
- The [next article](/theory/graphs/rmq-linear) uses the algorithm in the opposite direction: it solves general RMQ by reducing it to LCA.
