---
title: "Lowest Common Ancestor: Binary Lifting"
section: Trees and LCA
order: 1
difficulty: advanced
summary: "Answer \"lowest common ancestor of u and v\" and k-th-ancestor queries on a rooted tree in O(log n) after O(n log n) preprocessing."
tags: [lca, binary lifting, trees, ancestors]
prerequisites: [graphs/depth-first-search, math/binary-exponentiation]
source:
  title: Lowest Common Ancestor - Binary Lifting
  url: https://cp-algorithms.com/graph/lca_binary_lifting.html
  license: CC BY-SA 4.0
---

In a rooted tree, the **lowest common ancestor** (LCA) of two vertices $u$ and $v$ is the deepest vertex that is an ancestor of both (a vertex counts as its own ancestor). LCA queries are the building block of many tree algorithms: distance between two vertices, path queries, and checking whether a vertex lies on a path.

## Idea: jump by powers of two

For every vertex $v$ and every $j$ store $\text{up}[j][v]$, the $2^j$-th ancestor of $v$ (or the root, or a sentinel, if it doesn't exist). The table is computed from the previous level:

$$
\text{up}[j][v] = \text{up}[j-1]\big[\,\text{up}[j-1][v]\,\big]
$$

because the $2^j$-th ancestor is the $2^{j-1}$-th ancestor of the $2^{j-1}$-th ancestor. There are $\lceil \log_2 n \rceil + 1$ levels, so preprocessing takes $O(n \log n)$.

To answer an LCA query:

1. If $u$ is an ancestor of $v$ (or vice versa), that vertex is the answer. Ancestor tests use DFS entry/exit times: $\text{tin}[u] \le \text{tin}[v]$ and $\text{tout}[v] \le \text{tout}[u]$.
2. Otherwise lift $u$ upwards while the jump does **not** yet reach an ancestor of $v$: for $j$ from the highest level down to $0$, if $\text{up}[j][u]$ is *not* an ancestor of $v$, set $u = \text{up}[j][u]$.
3. Now the parent of $u$ is the LCA.

Because we try the biggest jumps first, this is exactly binary search on the number of steps, so a query takes $O(\log n)$.

## Implementation

Iterative DFS for the times (recursion would overflow on a path-shaped tree):

```python
class LCA:
    def __init__(self, adj, root=0):
        n = len(adj)
        self.LOG = max(1, (n - 1).bit_length())
        self.tin = [0] * n
        self.tout = [0] * n
        self.depth = [0] * n
        parent = [root] * n                        # the root is its own parent (a convenient sentinel)
        visited = [False] * n
        visited[root] = True
        timer = 1                                  # tin[root] = 0
        stack = [(root, 0)]
        while stack:                               # iterative DFS: (vertex, next neighbour index)
            v, i = stack.pop()
            if i < len(adj[v]):
                stack.append((v, i + 1))
                u = adj[v][i]
                if not visited[u]:
                    visited[u] = True
                    parent[u] = v
                    self.depth[u] = self.depth[v] + 1
                    self.tin[u] = timer
                    timer += 1
                    stack.append((u, 0))
            else:
                self.tout[v] = timer
                timer += 1
        self.up = [parent]                         # up[j][v] = 2^j-th ancestor of v
        for j in range(1, self.LOG + 1):
            prev = self.up[-1]
            self.up.append([prev[prev[v]] for v in range(n)])

    def is_ancestor(self, u, v):
        return self.tin[u] <= self.tin[v] and self.tout[v] <= self.tout[u]

    def lca(self, u, v):
        if self.is_ancestor(u, v):
            return u
        if self.is_ancestor(v, u):
            return v
        for j in range(self.LOG, -1, -1):
            if not self.is_ancestor(self.up[j][u], v):
                u = self.up[j][u]
        return self.up[0][u]

    def kth_ancestor(self, v, k):
        """The k-th ancestor of v, or the root if k exceeds the depth."""
        j = 0
        while k and j <= self.LOG:
            if k & 1:
                v = self.up[j][v]
            k >>= 1
            j += 1
        return v

    def distance(self, u, v):
        return self.depth[u] + self.depth[v] - 2 * self.depth[self.lca(u, v)]

#            0
#          / | \
#         1  2  3
#        / \    |
#       4   5   6
#               |
#               7
edges = [(0, 1), (0, 2), (0, 3), (1, 4), (1, 5), (3, 6), (6, 7)]
adj = [[] for _ in range(8)]
for a, b in edges:
    adj[a].append(b)
    adj[b].append(a)

t = LCA(adj)
assert t.lca(4, 5) == 1 and t.lca(4, 7) == 0 and t.lca(6, 7) == 6 and t.lca(2, 2) == 2
assert t.kth_ancestor(7, 2) == 3 and t.kth_ancestor(7, 3) == 0 and t.kth_ancestor(7, 10) == 0
assert t.distance(4, 7) == 5 and t.distance(4, 5) == 2
```

## Testing against the naive method

Climb from the deeper vertex until the depths are equal, then move both up together:

```python
import random

def naive_lca(parent, depth, u, v):
    while depth[u] > depth[v]:
        u = parent[u]
    while depth[v] > depth[u]:
        v = parent[v]
    while u != v:
        u, v = parent[u], parent[v]
    return u

random.seed(31)
for _ in range(200):
    n = random.randint(1, 40)
    par = [0] + [random.randrange(i) for i in range(1, n)]          # a random tree: parent has a smaller index
    g = [[] for _ in range(n)]
    for v in range(1, n):
        g[v].append(par[v]); g[par[v]].append(v)
    depth = [0] * n
    for v in range(1, n):
        depth[v] = depth[par[v]] + 1
    tree = LCA(g)
    for _ in range(40):
        a, b = random.randrange(n), random.randrange(n)
        assert tree.lca(a, b) == naive_lca(par, depth, a, b)
        assert tree.distance(a, b) == depth[a] + depth[b] - 2 * depth[naive_lca(par, depth, a, b)]

# a long path: no recursion issues
n = 50_000
path = [[] for _ in range(n)]
for v in range(1, n):
    path[v].append(v - 1); path[v - 1].append(v)
big = LCA(path)
assert big.lca(n - 1, n // 2) == n // 2 and big.kth_ancestor(n - 1, 1000) == n - 1001
```

## Other LCA methods

| Method | Preprocessing | Query | Notes |
|--------|---------------|-------|-------|
| naive climbing | $O(n)$ | $O(n)$ | fine for small trees |
| **binary lifting** | $O(n \log n)$ | $O(\log n)$ | simple, also gives $k$-th ancestors |
| Euler tour + [sparse table](/theory/data-structures/sparse-table) | $O(n \log n)$ | $O(1)$ | best for many queries |
| Tarjan's offline (with [DSU](/theory/data-structures/disjoint-set-union)) | $O(n + q\,\alpha)$ | offline | queries known in advance |

Binary lifting also extends to **weighted paths**: store next to `up[j][v]` the maximum edge on the $2^j$-step jump, and you can answer "maximum edge on the path between $u$ and $v$" in $O(\log n)$. That is what the second-best MST needs.

## Practice problems

- [LeetCode -  Kth Ancestor of a Tree Node](https://leetcode.com/problems/kth-ancestor-of-a-tree-node)
- [Codechef - Longest Good Segment](https://www.codechef.com/problems/LGSEG)
- [HackerEarth - Optimal Connectivity](https://www.hackerearth.com/practice/algorithms/graphs/graph-representation/practice-problems/algorithm/optimal-connectivity-c6ae79ca/)
