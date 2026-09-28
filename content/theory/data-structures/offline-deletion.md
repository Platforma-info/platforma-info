---
title: "Deleting from a Data Structure Offline"
section: Advanced
order: 1
difficulty: advanced
summary: "Support deletions in a structure that only supports insertions by putting a segment tree over time and rolling changes back during a DFS; the classic dynamic connectivity trick."
tags: [offline, segment tree, rollback, dynamic connectivity, dsu]
prerequisites: [data-structures/disjoint-set-union, data-structures/segment-tree]
source:
  title: "Deleting from a data structure in O(T(n) log n)"
  url: https://cp-algorithms.com/data_structures/deleting_in_log_n.html
  license: CC BY-SA 4.0
---

Suppose a data structure supports **adding** an element in time $O(T(n))$, and *undoing* the most recent addition in the same time (by keeping a stack of changes), but **not deleting** arbitrary elements. If we know all the operations in advance (**offline**), we can still support deletions, at the price of an extra $\log$ factor: $O(T(n)\log n)$.

## The idea

Every element is alive during some time intervals $[l, r)$, from the moment it is added until the moment it is deleted. Build a **segment tree over time** (the leaves are the moments $0, 1, \dots, T-1$ at which queries are asked). Each interval $[l, r)$ splits into $O(\log T)$ tree nodes; store the element in each of these nodes.

Now walk the tree with a DFS:

1. When entering a node, **add** all the elements stored in it to the data structure.
2. If the node is a leaf, answer the query for that moment.
3. Otherwise recurse into both children.
4. When leaving the node, **undo** the additions made in step 1.

When the DFS is at leaf $t$, exactly the elements alive at time $t$ have been added (each ancestor node contributed the elements whose interval covers its whole range). Every element is added $O(\log T)$ times, giving $O(T(n) \log T)$ per element.

> [!WARNING]
> Rollback breaks **amortized** guarantees: a structure that is fast only on average (like a DSU with path compression) can be made slow by repeated undo. The structure must be fast in the *worst case* per operation. For the DSU this means: union by size, **no path compression**, $O(\log n)$ per operation.

## Example: dynamic connectivity

Maintain an undirected graph on which edges are added and removed over time; after every event report the **number of connected components**.

First a DSU that can undo its last union. It must not use path compression, and remembers what to restore:

```python
class RollbackDSU:
    def __init__(self, n):
        self.parent = list(range(n))
        self.size = [1] * n
        self.components = n
        self.history = []

    def find(self, v):
        while self.parent[v] != v:
            v = self.parent[v]
        return v

    def union(self, u, v):
        u, v = self.find(u), self.find(v)
        if u == v:
            self.history.append(None)             # nothing changed, but keep the stack aligned
            return False
        if self.size[u] < self.size[v]:
            u, v = v, u
        self.parent[v] = u
        self.size[u] += self.size[v]
        self.components -= 1
        self.history.append(v)
        return True

    def rollback(self):
        v = self.history.pop()
        if v is None:
            return
        u = self.parent[v]
        self.size[u] -= self.size[v]
        self.parent[v] = v
        self.components += 1
```

The segment tree over time: `add_interval(l, r, edge)` stores an edge in the $O(\log T)$ nodes covering $[l, r)$; `solve()` performs the DFS.

```python
def offline_connectivity(n, T, edges):
    """
    edges: list of (u, v, l, r): the edge exists during the moments l <= t < r (0 <= l < r <= T).
    Return the number of connected components at each moment t = 0 .. T-1.
    """
    tree = [[] for _ in range(4 * T)]

    def add(node, lo, hi, l, r, edge):                 # node covers [lo, hi)
        if r <= lo or hi <= l:
            return
        if l <= lo and hi <= r:
            tree[node].append(edge)
            return
        mid = (lo + hi) // 2
        add(2 * node, lo, mid, l, r, edge)
        add(2 * node + 1, mid, hi, l, r, edge)

    for u, v, l, r in edges:
        add(1, 0, T, l, r, (u, v))

    dsu = RollbackDSU(n)
    answers = [0] * T

    def dfs(node, lo, hi):
        for u, v in tree[node]:
            dsu.union(u, v)
        if hi - lo == 1:
            answers[lo] = dsu.components
        else:
            mid = (lo + hi) // 2
            dfs(2 * node, lo, mid)
            dfs(2 * node + 1, mid, hi)
        for _ in tree[node]:
            dsu.rollback()

    dfs(1, 0, T)
    return answers

# edge 0-1 lives during t in [0, 3), edge 1-2 during [0, 4), edge 2-3 during [2, 6); vertex 4 is isolated
events = [(0, 1, 0, 3), (1, 2, 0, 4), (2, 3, 2, 6)]
assert offline_connectivity(5, 6, events) == [3, 3, 2, 3, 4, 4]
```

At most $O(\log T)$ unions are done per edge, each costing $O(\log n)$: $O(m \log T \log n)$ in total, and the number of components is available at every moment.

## Testing against a brute force

Recompute the components from scratch at each moment:

```python
import random

def brute_components(n, T, edges):
    out = []
    for t in range(T):
        parent = list(range(n))

        def find(x):
            while parent[x] != x:
                parent[x] = parent[parent[x]]
                x = parent[x]
            return x

        for u, v, l, r in edges:
            if l <= t < r:
                parent[find(u)] = find(v)
        out.append(len({find(x) for x in range(n)}))
    return out

random.seed(1)
for _ in range(300):
    n = random.randint(1, 8)
    T = random.randint(1, 12)
    evs = []
    for _ in range(random.randint(0, 12)):
        l = random.randrange(T)
        r = random.randint(l + 1, T)
        evs.append((random.randrange(n), random.randrange(n), l, r))
    assert offline_connectivity(n, T, evs) == brute_components(n, T, evs)
```

## Other structures work too

Anything that supports insertion with a cheap undo fits: a stack of changes for a DSU, a persistent copy for an immutable value, a counter... In Python, structures made of **immutable** values give free rollback, because you can just pass the previous version down the recursion.

*Example*: a multiset of numbers where each number is available during a time interval; for each moment, decide whether a target sum can be formed as a subset sum. The state is a bitmask integer (bit $s$ set = sum $s$ reachable), and "adding an item" is `mask | mask << x`. Rollback is free: the parent's mask is simply not modified.

```python
def offline_subset_sum(T, items, target):
    """items: (value, l, r) available during l <= t < r. Return, for each t, whether `target` is reachable."""
    tree = [[] for _ in range(4 * T)]

    def add(node, lo, hi, l, r, value):
        if r <= lo or hi <= l:
            return
        if l <= lo and hi <= r:
            tree[node].append(value)
            return
        mid = (lo + hi) // 2
        add(2 * node, lo, mid, l, r, value)
        add(2 * node + 1, mid, hi, l, r, value)

    for value, l, r in items:
        add(1, 0, T, l, r, value)

    answers = [False] * T
    limit = (1 << (target + 1)) - 1

    def dfs(node, lo, hi, mask):
        for value in tree[node]:
            mask |= (mask << value) & limit
        if hi - lo == 1:
            answers[lo] = bool(mask >> target & 1)
        else:
            mid = (lo + hi) // 2
            dfs(2 * node, lo, mid, mask)              # `mask` is a fresh value: no undo needed
            dfs(2 * node + 1, mid, hi, mask)

    dfs(1, 0, T, 1)
    return answers

def brute_subset(T, items, target):
    out = []
    for t in range(T):
        reach = {0}
        for value, l, r in items:
            if l <= t < r:
                reach |= {s + value for s in reach}
        out.append(target in reach)
    return out

random.seed(2)
for _ in range(200):
    T = random.randint(1, 10)
    its = []
    for _ in range(random.randint(0, 8)):
        l = random.randrange(T)
        its.append((random.randint(1, 9), l, random.randint(l + 1, T)))
    target = random.randint(0, 25)
    assert offline_subset_sum(T, its, target) == brute_subset(T, its, target)
```

## Summary

- Time: $O(T(n)\,\log T)$ per element, with a worst-case-fast structure and rollback.
- Requires that all operations are known up front.
- The same "segment tree over the time of existence" idea works for problems that are not about data structures, for example counting properties of a set of segments alive at each moment.

## Practice problems

- [Codeforces - Connect and Disconnect](https://codeforces.com/gym/100551/problem/A)
- [Codeforces - Addition on Segments](https://codeforces.com/contest/981/problem/E)
- [Codeforces - Extending Set of Points](https://codeforces.com/contest/1140/problem/F)
