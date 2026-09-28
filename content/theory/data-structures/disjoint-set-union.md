---
title: Disjoint Set Union (Union-Find)
section: Trees
order: 1
difficulty: intermediate
summary: Maintain a partition of elements into sets with near-constant-time merge and find, using path compression and union by size.
tags: [dsu, union-find, connectivity, graphs]
prerequisites: [python-basics/classes-and-objects]
source:
  title: Disjoint Set Union
  url: https://cp-algorithms.com/data_structures/disjoint_set_union.html
  license: CC BY-SA 4.0
---

A **disjoint set union** (DSU, also *union-find*) keeps track of a collection of non-overlapping sets, initially each element alone in its own set. It supports two operations:

- `find(x)`: return the *representative* (leader) of the set containing `x`; two elements are in the same set exactly when their leaders are equal;
- `union(x, y)`: merge the sets containing `x` and `y`.

With two small optimizations each operation takes $O(\alpha(n))$ amortized, where $\alpha$ is the inverse Ackermann function, below 5 for any input that fits in the universe. In practice: constant time.

## Building the structure

Every set is stored as a rooted tree in an array `parent`. A root is its own parent and is the leader.

### Naive version

```python
class NaiveDSU:
    def __init__(self, n):
        self.parent = list(range(n))

    def find(self, v):
        while self.parent[v] != v:
            v = self.parent[v]
        return v

    def union(self, a, b):
        a, b = self.find(a), self.find(b)
        if a != b:
            self.parent[b] = a
```

A chain such as `union(0,1), union(1,2), ...` builds a tree of depth $n$, so `find` can cost $O(n)$. Two optimizations fix that.

### Path compression

During `find`, point every visited vertex directly at the root, so the next lookup is one step. A common iterative form is *path halving*, which needs no recursion (important in Python):

```python
def find(parent, v):
    while parent[v] != v:
        parent[v] = parent[parent[v]]      # shortcut: skip one level
        v = parent[v]
    return v
```

### Union by size

When merging, attach the **smaller** tree below the **larger** one so depth stays $O(\log n)$. We keep `size[root]`:

```python
class DSU:
    def __init__(self, n):
        self.parent = list(range(n))
        self.size = [1] * n
        self.components = n

    def find(self, v):
        parent = self.parent
        while parent[v] != v:
            parent[v] = parent[parent[v]]
            v = parent[v]
        return v

    def union(self, a, b):
        """Merge the sets of a and b; return True if they were different."""
        a, b = self.find(a), self.find(b)
        if a == b:
            return False
        if self.size[a] < self.size[b]:
            a, b = b, a
        self.parent[b] = a
        self.size[a] += self.size[b]
        self.components -= 1
        return True

    def same(self, a, b):
        return self.find(a) == self.find(b)

    def set_size(self, v):
        return self.size[self.find(v)]

d = DSU(6)
assert d.components == 6
assert d.union(0, 1) and d.union(1, 2) and not d.union(0, 2)
assert d.same(0, 2) and not d.same(0, 3)
assert d.set_size(2) == 3 and d.components == 4
```

### Complexity

Either optimization alone gives $O(\log n)$ amortized. Together they give $O(\alpha(n))$ amortized per operation (Tarjan). Path compression alone is already fast in practice; union by size makes the guarantee hold.

Randomized check against a naive labelling:

```python
import random

random.seed(1)
for _ in range(200):
    n = random.randint(1, 30)
    d = DSU(n)
    label = list(range(n))                       # naive: relabel a whole set on each union
    for _ in range(random.randint(0, 40)):
        a, b = random.randrange(n), random.randrange(n)
        d.union(a, b)
        la, lb = label[a], label[b]
        label = [la if x == lb else x for x in label]
        i, j = random.randrange(n), random.randrange(n)
        assert d.same(i, j) == (label[i] == label[j])
    assert d.components == len(set(label))
```

## Applications

### Connected components of a graph

Feed every edge to `union`; the number of components is `d.components`. Adding edges online (one at a time) is exactly what a DSU is good at, while [DFS or BFS](/theory/graphs/connected-components) need the whole graph.

```python
edges = [(0, 1), (2, 3), (1, 4), (5, 6), (4, 0)]
d = DSU(8)
for u, v in edges:
    d.union(u, v)
assert d.components == 4                          # {0,1,4} {2,3} {5,6} {7}
```

This is also the core of [Kruskal's minimum spanning tree](/theory/graphs/kruskal-mst).

### Storing extra information per set

Keep any aggregate at the root and combine it on `union`: size (above), minimum, sum, count of edges, and so on.

```python
class DSUWithMin(DSU):
    def __init__(self, values):
        super().__init__(len(values))
        self.min = list(values)

    def union(self, a, b):
        ra, rb = self.find(a), self.find(b)
        merged = super().union(a, b)
        if merged:
            root = self.find(a)
            self.min[root] = min(self.min[ra], self.min[rb])
        return merged

    def set_min(self, v):
        return self.min[self.find(v)]

m = DSUWithMin([5, 3, 8, 1, 9])
m.union(0, 1); m.union(2, 4)
assert m.set_min(0) == 3 and m.set_min(4) == 8
m.union(1, 2)
assert m.set_min(4) == 3
```

### Painting a segment: "next unpainted cell" pointers

We paint cells $0..n-1$ with queries $(l, r, c)$ in order, and later queries overwrite earlier ones. Process the queries **backwards**: a cell is final the first time it is painted. A DSU where each cell points to the next unpainted cell lets every cell be painted once, in $O((n + q)\,\alpha)$ total:

```python
def paint(n, queries):
    color = [0] * n
    nxt = list(range(n + 1))                     # nxt[i]: first unpainted cell >= i

    def find(x):
        while nxt[x] != x:
            nxt[x] = nxt[nxt[x]]
            x = nxt[x]
        return x

    for l, r, c in reversed(queries):
        i = find(l)
        while i <= r:
            color[i] = c
            nxt[i] = i + 1                       # cell i is now done: skip it
            i = find(i + 1)
    return color

def paint_brute(n, queries):
    color = [0] * n
    for l, r, c in queries:
        for i in range(l, r + 1):
            color[i] = c
    return color

qs = [(0, 4, 1), (2, 6, 2), (1, 3, 3)]
assert paint(8, qs) == paint_brute(8, qs) == [1, 3, 3, 3, 2, 2, 2, 0]
```

### Parity DSU: checking bipartiteness online

Store for each vertex the parity of its path length to the leader. Adding an edge $(u, v)$ is consistent if $u$ and $v$ are in different sets, or in the same set with *different* parities; otherwise an odd cycle appeared and the graph is not bipartite.

```python
class ParityDSU:
    def __init__(self, n):
        self.parent = list(range(n))
        self.parity = [0] * n              # parity of the path to parent
        self.size = [1] * n

    def find(self, v):
        """Return (root, parity of v relative to root)."""
        path = []
        while self.parent[v] != v:
            path.append(v)
            v = self.parent[v]
        root = v
        # compress: walk back from the root so each node's parity is relative to the root
        acc = 0
        for u in reversed(path):
            acc ^= self.parity[u]
            self.parity[u] = acc
            self.parent[u] = root
        return root

    def parity_of(self, v):
        self.find(v)
        return self.parity[v] if self.parent[v] != v else 0

    def add_edge(self, u, v):
        """Return False if the edge closes an odd cycle."""
        ru, rv = self.find(u), self.find(v)
        pu, pv = self.parity_of(u), self.parity_of(v)
        if ru == rv:
            return pu != pv
        if self.size[ru] < self.size[rv]:
            ru, rv, pu, pv = rv, ru, pv, pu
        self.parent[rv] = ru
        self.parity[rv] = pu ^ pv ^ 1      # make u and v end up with different parities
        self.size[ru] += self.size[rv]
        return True

p = ParityDSU(4)
assert p.add_edge(0, 1) and p.add_edge(1, 2)
assert p.add_edge(2, 3) and p.add_edge(3, 0)          # even cycle: still bipartite
q = ParityDSU(3)
assert q.add_edge(0, 1) and q.add_edge(1, 2) and not q.add_edge(2, 0)   # triangle: odd cycle
```

### More

The original article also covers offline RMQ (Arpa's trick), offline LCA (Tarjan), DSU with explicit set lists, and online bridge finding. The ideas: each is "process operations in a clever order and let a DSU answer connectivity questions".

> [!TIP]
> In Python, avoid recursive `find` (deep chains can hit the recursion limit) and avoid a per-element object. The list-based versions above are both faster and safe.

## Practice problems

- [TIMUS - Anansi's Cobweb](http://acm.timus.ru/problem.aspx?space=1&num=1671)
- [Codeforces - Roads not only in Berland](http://codeforces.com/contest/25/problem/D)
- [TIMUS - Parity](http://acm.timus.ru/problem.aspx?space=1&num=1003)
- [SPOJ - Strange Food Chain](http://www.spoj.com/problems/CHAIN/)
- [SPOJ - COLORFUL ARRAY](https://www.spoj.com/problems/CLFLARR/)
- [SPOJ - Consecutive Letters](https://www.spoj.com/problems/CONSEC/)
- [Toph - Unbelievable Array](https://toph.co/p/unbelievable-array)
- [HackerEarth - Lexicographically minimal string](https://www.hackerearth.com/practice/data-structures/disjoint-data-strutures/basics-of-disjoint-data-structures/practice-problems/algorithm/lexicographically-minimal-string-6edc1406/description/)
- [HackerEarth - Fight in Ninja World](https://www.hackerearth.com/practice/algorithms/graphs/breadth-first-search/practice-problems/algorithm/containers-of-choclates-1/)
