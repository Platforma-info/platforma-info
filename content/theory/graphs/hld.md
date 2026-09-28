---
title: "Heavy-Light Decomposition"
section: Trees and LCA
order: 7
difficulty: advanced
summary: "Split a tree into heavy paths so that any root path crosses O(log n) of them, and answer path queries and updates with one segment tree over the flattened positions."
tags: [heavy-light decomposition, hld, path queries, segment tree, lca]
prerequisites: [graphs/lca, data-structures/segment-tree]
source:
  title: "Heavy-light decomposition"
  url: https://cp-algorithms.com/graph/hld.html
  license: CC BY-SA 4.0
---

**Heavy-light decomposition** (HLD) is a general technique for solving many problems that reduce to **queries on a tree**. It splits the tree into a few vertex-disjoint paths such that the path from any vertex to the root passes through at most $\log n$ of them. A query "compute something on the path from $a$ to $b$" then becomes $O(\log n)$ queries of the type "compute something on a segment of one of the paths".

## Construction

Root the tree and compute for every vertex $v$ the size $s(v)$ of its subtree. Call the edge from $v$ to its child $c$ **heavy** if $s(c) \ge s(v)/2$, and **light** otherwise. A vertex has at most one heavy child edge (two children with size $\ge s(v)/2$ would give $s(v) \ge 1 + s(v)$).

A convenient variant: the heavy child of $v$ is the child with the **largest subtree** (ties broken arbitrarily). Then every vertex except leaves has exactly one heavy child, and the tree decomposes into vertex-disjoint **heavy paths**, each of which continues downward as long as possible.

**Why $\log n$ paths suffice.** Moving down a light edge from $v$ to $c$ at least halves the subtree size: $s(c) < s(v)/2$ (with the largest-child definition, a light child is never larger than the heavy one, so $s(c) \le s(v)/2$). So a path from the root to any vertex contains at most $\log_2 n$ light edges, and therefore passes through at most $\log_2 n + 1$ heavy paths.

If we number the vertices by a DFS that visits the **heavy child first**, every heavy path occupies a contiguous range of positions `pos[]`, and the subtree of any vertex $v$ occupies `[pos[v], pos[v] + s(v) - 1]`. So one segment tree (or Fenwick tree) over positions serves all paths and all subtrees.

## Implementation of the decomposition

Iterative versions of the two passes (subtree sizes with a heavy child, then positions):

```python
class HLD:
    def __init__(self, adj, root=0):
        n = len(adj)
        self.parent = [-1] * n
        self.depth = [0] * n
        order = []                                        # the vertices in DFS pre-order
        stack = [root]
        while stack:
            v = stack.pop()
            order.append(v)
            for u in adj[v]:
                if u != self.parent[v]:
                    self.parent[u] = v
                    self.depth[u] = self.depth[v] + 1
                    stack.append(u)
        self.size = [1] * n
        self.heavy = [-1] * n
        for v in reversed(order):                         # children before parents
            p = self.parent[v]
            if p != -1:
                self.size[p] += self.size[v]
        for v in order:
            best = 0
            for u in adj[v]:
                if u != self.parent[v] and self.size[u] > best:
                    best, self.heavy[v] = self.size[u], u
        self.head = [0] * n                               # the top of the heavy path of each vertex
        self.pos = [0] * n                                # the position in the flattened order
        cur = 0
        stack = [(root, root)]
        while stack:
            v, h = stack.pop()
            while v != -1:                                # walk down the heavy path of v
                self.head[v], self.pos[v] = h, cur
                cur += 1
                for u in adj[v]:
                    if u != self.parent[v] and u != self.heavy[v]:
                        stack.append((u, u))              # light children start new paths
                v = self.heavy[v]

    def lca(self, a, b):
        while self.head[a] != self.head[b]:
            if self.depth[self.head[a]] > self.depth[self.head[b]]:
                a = self.parent[self.head[a]]
            else:
                b = self.parent[self.head[b]]
        return a if self.depth[a] < self.depth[b] else b

    def path_segments(self, a, b):
        """The position segments [l, r] (inclusive) covering the path a - b."""
        segments = []
        while self.head[a] != self.head[b]:
            if self.depth[self.head[a]] > self.depth[self.head[b]]:
                a, b = b, a
            segments.append((self.pos[self.head[b]], self.pos[b]))
            b = self.parent[self.head[b]]
        if self.depth[a] > self.depth[b]:
            a, b = b, a
        segments.append((self.pos[a], self.pos[b]))
        return segments

adj = [[1, 2], [0, 3, 4], [0, 5], [1], [1, 6], [2], [4]]
hld = HLD(adj)
assert hld.lca(3, 6) == 1 and hld.lca(3, 5) == 0 and hld.lca(6, 4) == 4
assert sorted(hld.pos) == list(range(7))                           # positions are a permutation
```

## Path maximum with point updates

Each vertex has a value; queries ask for the maximum on the path between $a$ and $b$, and updates change the value of one vertex. A segment tree over the positions answers each of the $O(\log n)$ segments in $O(\log n)$: $O(\log^2 n)$ per query (with prefix maxima per path it can be lowered to $O(\log n)$).

```python
class PathMax:
    def __init__(self, adj, values, root=0):
        self.hld = HLD(adj, root)
        n = len(adj)
        self.n = n
        self.tree = [float("-inf")] * (2 * n)
        for v in range(n):
            self.tree[n + self.hld.pos[v]] = values[v]
        for i in range(n - 1, 0, -1):
            self.tree[i] = max(self.tree[2 * i], self.tree[2 * i + 1])

    def update(self, v, value):
        i = self.n + self.hld.pos[v]
        self.tree[i] = value
        i >>= 1
        while i:
            self.tree[i] = max(self.tree[2 * i], self.tree[2 * i + 1])
            i >>= 1

    def _range_max(self, l, r):                       # positions [l, r]
        best = float("-inf")
        l += self.n
        r += self.n + 1
        while l < r:
            if l & 1:
                best = max(best, self.tree[l])
                l += 1
            if r & 1:
                r -= 1
                best = max(best, self.tree[r])
            l >>= 1
            r >>= 1
        return best

    def query(self, a, b):
        return max(self._range_max(l, r) for l, r in self.hld.path_segments(a, b))

values = [5, 1, 4, 9, 2, 3, 7]
pm = PathMax(adj, values)
assert pm.query(3, 6) == 9 and pm.query(5, 6) == 7 and pm.query(2, 2) == 4
pm.update(3, 0)
assert pm.query(3, 6) == 7 and pm.query(3, 5) == 5
```

## Testing

Compare path maxima with an explicit walk on random trees, with updates in between. Also the LCA from HLD, and subtree ranges:

```python
import random

rnd = random.Random(3)
for _ in range(150):
    n = rnd.randint(1, 60)
    par = [-1] + [rnd.randrange(v) if rnd.random() < 0.6 else v - 1 for v in range(1, n)]
    tree = [[] for _ in range(n)]
    for v in range(1, n):
        tree[v].append(par[v])
        tree[par[v]].append(v)
    depth = [0] * n
    for v in range(1, n):
        depth[v] = depth[par[v]] + 1
    vals = [rnd.randint(-50, 50) for _ in range(n)]
    pm = PathMax(tree, vals)

    def naive(a, b):
        best = float("-inf")
        while a != b:
            if depth[a] < depth[b]:
                a, b = b, a
            best = max(best, vals[a])
            a = par[a]
        return max(best, vals[a])

    for _ in range(40):
        if rnd.random() < 0.3:
            v = rnd.randrange(n)
            vals[v] = rnd.randint(-50, 50)
            pm.update(v, vals[v])
        else:
            a, b = rnd.randrange(n), rnd.randrange(n)
            assert pm.query(a, b) == naive(a, b)
    h = pm.hld
    for v in range(n):
        for u in range(n):
            x, y = u, v
            while depth[x] > depth[y]:
                x = par[x]
            while depth[y] > depth[x]:
                y = par[y]
            while x != y:
                x, y = par[x], par[y]
            assert h.lca(u, v) == x
```

The subtree of a vertex is a contiguous range of positions:

```python
def in_subtree(u, v, par):
    while u != -1:
        if u == v:
            return True
        u = par[u]
    return False

for _ in range(50):
    n = rnd.randint(1, 50)
    par = [-1] + [rnd.randrange(v) for v in range(1, n)]
    tree = [[] for _ in range(n)]
    for v in range(1, n):
        tree[v].append(par[v])
        tree[par[v]].append(v)
    h = HLD(tree)
    for v in range(n):
        inside = sorted(h.pos[u] for u in range(n) if in_subtree(u, v, par))
        assert inside == list(range(h.pos[v], h.pos[v] + h.size[v]))
```

## Other typical problems

- **Sum on a path** with vertex updates: HLD with a Fenwick tree. (Without updates, prefix sums along root paths and the LCA are simpler.)
- **Edge values**: store the value of an edge in its *lower* endpoint, and exclude the LCA itself from the last segment.
- **Repaint the path** $a \to b$ with a color, then count the edges of each color: HLD with a segment tree with lazy assignment; $O(\log^2 n)$ per update.
- **Subtree queries** come for free from the contiguous ranges of positions.

## Practice problems

- [SPOJ - QTREE - Query on a tree](https://www.spoj.com/problems/QTREE/)
- [CSES - Path Queries II](https://cses.fi/problemset/task/2134)
- [Codeforces - Subway Lines](https://codeforces.com/gym/101908/problem/L)
- [Codeforces - Tree Queries](https://codeforces.com/contest/1254/problem/D)
- [Codeforces - Tree or not Tree](https://codeforces.com/contest/117/problem/E)
- [Codeforces - The Tree](https://codeforces.com/contest/1017/problem/G)
- [Balkan OI 2018 - Min-max tree](https://oj.uz/problem/view/BOI18_minmaxtree)
