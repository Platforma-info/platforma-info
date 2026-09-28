---
title: "Painting Edges of a Tree (Euler Tour + Fenwick Tree)"
section: Trees and LCA
order: 6
difficulty: advanced
summary: "Paint or unpaint edges and count the painted edges on any tree path in O(log n): list every edge twice in the Euler tour and take a difference of two prefix sums."
tags: [tree queries, euler tour, fenwick tree, lca, path queries]
prerequisites: [graphs/lca, data-structures/fenwick-tree]
source:
  title: "Paint the edges of the tree"
  url: https://cp-algorithms.com/graph/tree_painting.html
  license: CC BY-SA 4.0
---

A tree with $N$ vertices receives two kinds of queries:

1. **paint** an edge (or remove its paint);
2. report the **number of painted edges** on the path between two vertices.

Each query is answered in $O(\log N)$ after $O(N)$ preprocessing, using the Euler tour of the tree and a segment tree; below we use a [Fenwick tree](/theory/data-structures/fenwick-tree), which is shorter and faster for sums.

## Algorithm

First find the [LCA](/theory/graphs/lca) $l$ of the query vertices $i$ and $j$; the answer is the sum of the answers for $(l, i)$ and $(l, j)$. Both are of a special kind: the first vertex is an **ancestor** of the second one.

**Preprocessing.** Do a DFS and record the Euler tour of vertices (`dfs_list`) and, between consecutive entries, the edge that was traversed (`edges_list`). Every edge appears twice in `edges_list`: once going down (forward), once coming back up (backward). Keep two arrays over `edges_list`: `T1` holds 1 at the *forward* occurrence of every painted edge, `T2` holds 1 at the *backward* occurrence. Build a Fenwick tree over each.

**Query** $(i, j)$ with $i$ an ancestor of $j$: let $p$ and $q$ be the first positions of $i$ and $j$ in `dfs_list`. The answer is

$$
\sum_{p \le t < q} T_1[t] \;-\; \sum_{p \le t < q} T_2[t]
$$

*Why:* the segment of the tour from $p$ to $q$ contains the edges of the path $i \to j$ and also complete excursions into subtrees hanging off that path. An edge inside an excursion appears in the segment **twice** (down and up), so it contributes equally to both sums and cancels. The edges of the path appear only in the forward direction (we never return along them before reaching $j$), so they remain in $T_1$ only. We stop at $q-1$ so as not to include the edge leaving $j$.

**Update** (paint or unpaint an edge): change one position in each Fenwick tree, in $O(\log N)$.

## Implementation

```python
class Fenwick:
    def __init__(self, n):
        self.n, self.tree = n, [0] * (n + 1)

    def add(self, i, delta):
        i += 1
        while i <= self.n:
            self.tree[i] += delta
            i += i & -i

    def prefix(self, i):                         # sum of positions [0, i)
        total = 0
        while i > 0:
            total += self.tree[i]
            i -= i & -i
        return total

    def range_sum(self, l, r):                   # sum of positions [l, r)
        return self.prefix(r) - self.prefix(l)

class PaintedTree:
    def __init__(self, n, edges):
        """edges: list of (u, v); the edge with index k can be painted with paint(k)."""
        adj = [[] for _ in range(n)]
        for k, (u, v) in enumerate(edges):
            adj[u].append((v, k))
            adj[v].append((u, k))
        self.first = [-1] * n
        self.depth = [0] * n
        dfs_list, edges_list = [0], []
        self.first[0] = 0
        self.forward, self.backward = [-1] * len(edges), [-1] * len(edges)
        stack = [(0, -1, 0)]                      # (vertex, id of the edge to the parent, next neighbour)
        visited = [False] * n
        visited[0] = True
        while stack:
            v, pe, i = stack.pop()
            if i < len(adj[v]):
                stack.append((v, pe, i + 1))
                u, k = adj[v][i]
                if not visited[u]:
                    visited[u] = True
                    self.depth[u] = self.depth[v] + 1
                    self.forward[k] = len(edges_list)
                    edges_list.append(k)
                    self.first[u] = len(dfs_list)
                    dfs_list.append(u)
                    stack.append((u, k, 0))
            elif stack:                           # v finished: walk back over the edge to the parent
                self.backward[pe] = len(edges_list)
                edges_list.append(pe)
                dfs_list.append(stack[-1][0])
        self.t1, self.t2 = Fenwick(len(edges_list)), Fenwick(len(edges_list))
        self.painted = [False] * len(edges)
        # an LCA structure: the Euler tour with a sparse table over (depth, vertex)
        base = [(self.depth[v], v) for v in dfs_list]
        self.table = [base]
        j = 1
        while (1 << j) <= len(base):
            prev, half = self.table[-1], 1 << (j - 1)
            self.table.append([min(prev[i], prev[i + half]) for i in range(len(base) - (1 << j) + 1)])
            j += 1

    def lca(self, u, v):
        l, r = self.first[u], self.first[v]
        if l > r:
            l, r = r, l
        j = (r - l + 1).bit_length() - 1
        return min(self.table[j][l], self.table[j][r - (1 << j) + 1])[1]

    def set_painted(self, k, painted):
        if self.painted[k] != painted:
            delta = 1 if painted else -1
            self.painted[k] = painted
            self.t1.add(self.forward[k], delta)
            self.t2.add(self.backward[k], delta)

    def _down(self, ancestor, v):
        """Painted edges on the path from an ancestor down to v."""
        p, q = self.first[ancestor], self.first[v]
        return self.t1.range_sum(p, q) - self.t2.range_sum(p, q)

    def count(self, u, v):
        l = self.lca(u, v)
        return self._down(l, u) + self._down(l, v)

# the path 0 - 1 - 2 - 3 plus a branch 1 - 4
tree = PaintedTree(5, [(0, 1), (1, 2), (2, 3), (1, 4)])
tree.set_painted(1, True)                         # edge (1, 2)
tree.set_painted(3, True)                         # edge (1, 4)
assert tree.count(0, 3) == 1 and tree.count(3, 4) == 2 and tree.count(0, 1) == 0
tree.set_painted(1, False)
assert tree.count(3, 4) == 1 and tree.count(2, 2) == 0
```

## Testing against explicit path walks

We compare with a direct climb along parent pointers on random trees, with random painting, unpainting and queries mixed:

```python
import random

rnd = random.Random(2)
for _ in range(100):
    n = rnd.randint(2, 30)
    parent = [-1] + [rnd.randrange(v) if rnd.random() < 0.6 else v - 1 for v in range(1, n)]
    edges = [(parent[v], v) for v in range(1, n)]              # edge k connects parent[k + 1] and k + 1
    tree = PaintedTree(n, edges)
    painted = set()
    depth = [0] * n
    for v in range(1, n):
        depth[v] = depth[parent[v]] + 1

    def path_edges(u, v):
        result = []
        while u != v:
            if depth[u] < depth[v]:
                u, v = v, u
            result.append(u - 1)                               # the edge from u up to its parent
            u = parent[u]
        return result

    for _ in range(60):
        if rnd.random() < 0.4:
            k = rnd.randrange(n - 1)
            on = rnd.random() < 0.6
            tree.set_painted(k, on)
            (painted.add if on else painted.discard)(k)
        else:
            u, v = rnd.randrange(n), rnd.randrange(n)
            assert tree.count(u, v) == sum(k in painted for k in path_edges(u, v))
```

## Remarks

- The "forward minus backward" trick is a common way to turn *path* queries into *range* queries on an Euler tour. The same idea handles **vertex** values ($+x$ when entering, $-x$ when leaving gives the sum from the root to a vertex as a prefix sum).
- With arbitrary path updates (not just point updates) use [heavy-light decomposition](/theory/graphs/hld) with a segment tree.
