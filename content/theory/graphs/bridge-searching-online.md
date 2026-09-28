---
title: "Finding Bridges Online"
section: Connectivity
order: 5
difficulty: advanced
summary: "Maintain the number of bridges while edges are added one by one, using a forest of 2-edge-connected components, two DSUs and re-rooting of the smaller tree."
tags: [bridges, online algorithms, dsu, 2-edge-connected components, dynamic graphs]
prerequisites: [graphs/bridges, data-structures/disjoint-set-union]
source:
  title: "Finding Bridges Online"
  url: https://cp-algorithms.com/graph/bridge-searching-online.html
  license: CC BY-SA 4.0
---

A **bridge** is an edge whose removal disconnects (part of) the graph. The [classic DFS algorithm](/theory/graphs/bridges) finds all bridges of a fixed graph in $O(n + m)$. Here the graph is **dynamic**: it starts with $n$ isolated vertices and edges $(a, b)$ arrive one at a time; after each edge we must report the current number of bridges. Recomputing from scratch after every edge would be $O(m(n+m))$; this algorithm needs only $O(n\log n + m\log n)$ in total (or $O(n\log n + m)$ with union by rank).

## The idea

Removing all bridges splits the graph into **2-edge-connected components**: parts that stay connected after removing any single edge. If each component is contracted to one vertex, the bridges are the only remaining edges, and they form a **forest**. The algorithm maintains this forest explicitly.

When the edge $(a, b)$ is added, one of three things happens:

1. $a$ and $b$ are in the **same 2-edge-connected component**: the edge is not a bridge and changes nothing.
2. $a$ and $b$ are in **different trees** (different connected components): the new edge is a bridge, and the two trees are joined. The number of bridges grows by one.
3. $a$ and $b$ are in the **same tree but different 2-edge-connected components**: the new edge closes a cycle with the tree path between them. All bridges on that path stop being bridges, and the whole cycle is compressed into one 2-edge-connected component. The number of bridges drops by the length of the path.

## Data structures

- Two [DSUs](/theory/data-structures/disjoint-set-union): `dsu_2ecc` for the 2-edge-connected components and `dsu_cc` for the connected components (each connected component has a tree; the representative is its root). Also the size of every tree.
- `par[v]`: the parent of a component in its tree of the forest (`-1` for roots).

The operations:

- **Join two trees.** Re-root one of them at the endpoint of the new edge and hang it below the other endpoint. Re-rooting a tree walks along the path to its root and reverses the `par` pointers, costing $O(\text{height})$. To keep the total cost small, always **re-root the smaller tree**: each vertex is then re-rooted only when its tree at least doubles, so the total cost is $O(n\log n)$.
- **Find the cycle.** Walk up from $a$ and from $b$ in parallel, marking visited vertices with a unique timestamp, until a vertex is met twice. It is the LCA, and the walk costs only the length of the cycle, which is paid for anyway by the compression.
- **Compress the cycle.** Attach all the vertices of the cycle to the LCA in `dsu_2ecc`. The LCA is the topmost vertex of the cycle, so its `par` stays valid.

## Implementation

```python
class OnlineBridges:
    def __init__(self, n):
        self.par = [-1] * n
        self.dsu_2ecc = list(range(n))
        self.dsu_cc = list(range(n))
        self.cc_size = [1] * n
        self.last_visit = [0] * n
        self.lca_iteration = 0
        self.bridges = 0

    def find_2ecc(self, v):
        if v == -1:
            return -1
        root = v
        while self.dsu_2ecc[root] != root:
            root = self.dsu_2ecc[root]
        while self.dsu_2ecc[v] != root:                 # path compression
            self.dsu_2ecc[v], v = root, self.dsu_2ecc[v]
        return root

    def find_cc(self, v):
        v = self.find_2ecc(v)
        path = []
        while self.dsu_cc[v] != v:
            path.append(v)
            v = self.find_2ecc(self.dsu_cc[v])
        for u in path:
            self.dsu_cc[u] = v
        return v

    def make_root(self, v):
        root, child = v, -1
        while v != -1:
            p = self.find_2ecc(self.par[v])
            self.par[v] = child
            self.dsu_cc[v] = root
            child, v = v, p
        self.cc_size[root] = self.cc_size[child]

    def merge_path(self, a, b):
        self.lca_iteration += 1
        path_a, path_b = [], []
        lca = -1
        while lca == -1:
            if a != -1:
                a = self.find_2ecc(a)
                path_a.append(a)
                if self.last_visit[a] == self.lca_iteration:
                    lca = a
                    break
                self.last_visit[a] = self.lca_iteration
                a = self.par[a]
            if b != -1:
                b = self.find_2ecc(b)
                path_b.append(b)
                if self.last_visit[b] == self.lca_iteration:
                    lca = b
                    break
                self.last_visit[b] = self.lca_iteration
                b = self.par[b]
        for path in (path_a, path_b):
            for v in path:
                self.dsu_2ecc[v] = lca
                if v == lca:
                    break
                self.bridges -= 1                      # every edge passed on the cycle was a bridge

    def add_edge(self, a, b):
        a, b = self.find_2ecc(a), self.find_2ecc(b)
        if a == b:
            return
        ca, cb = self.find_cc(a), self.find_cc(b)
        if ca != cb:                                   # different trees: the new edge is a bridge
            self.bridges += 1
            if self.cc_size[ca] > self.cc_size[cb]:
                a, b, ca, cb = b, a, cb, ca
            self.make_root(a)
            self.par[a] = self.dsu_cc[a] = b
            self.cc_size[cb] += self.cc_size[a]
        else:                                          # same tree: a cycle is formed
            self.merge_path(a, b)

g = OnlineBridges(5)
counts = []
for a, b in [(0, 1), (1, 2), (2, 3), (3, 4), (0, 2), (0, 4)]:
    g.add_edge(a, b)
    counts.append(g.bridges)
assert counts == [1, 2, 3, 4, 2, 0]                   # a path grows, then (0,2) and (0,4) close cycles
```

Only the *number* of bridges is stored here, as in the original; keeping a set of bridge edges, or the list of 2-edge-connected components (the classes of `find_2ecc`), is a straightforward extension.

`dsu_2ecc` is written without union by rank, hence the $O(\log n)$ amortized cost per operation; giving the cycle-compression a union by rank makes it $O(1)$ amortized per edge, with an extra $\alpha(n)$ factor for the path compression.

## Testing against the offline algorithm

After every insertion, the bridge count must equal the one obtained by removing each edge of the current graph and counting the connected components (multigraph edges are distinguished by index, and self-loops are allowed):

```python
import random

def component_count(n, edges, skip=None):
    parent = list(range(n))

    def find(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x

    for i, (u, v) in enumerate(edges):
        if i != skip:
            parent[find(u)] = find(v)
    return len({find(x) for x in range(n)})

def bridge_count_brute(n, edges):
    base = component_count(n, edges)
    return sum(component_count(n, edges, skip=i) > base for i in range(len(edges)))

rnd = random.Random(1)
for _ in range(400):
    n = rnd.randint(1, 10)
    online = OnlineBridges(n)
    edges = []
    for _ in range(rnd.randint(0, 14)):
        a, b = rnd.randrange(n), rnd.randrange(n)
        edges.append((a, b))
        online.add_edge(a, b)
        assert online.bridges == bridge_count_brute(n, edges), edges
```

A larger run shows the speed; a long path is added edge by edge, then closed into one giant cycle with a single edge:

```python
n = 100_000
big = OnlineBridges(n)
for v in range(n - 1):
    big.add_edge(v, v + 1)
assert big.bridges == n - 1
big.add_edge(0, n - 1)
assert big.bridges == 0
```
