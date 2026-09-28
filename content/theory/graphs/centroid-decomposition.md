---
title: "Centroid Decomposition"
section: Trees and LCA
order: 8
difficulty: advanced
summary: "Recursively split a tree at its centroid to get a centroid tree of depth O(log n); count paths of a given length and answer nearest-marked-vertex queries."
tags: [centroid decomposition, divide and conquer, trees, path counting, centroid tree]
prerequisites: [graphs/depth-first-search, graphs/lca]
source:
  title: "Centroid Decomposition"
  url: https://cp-algorithms.com/graph/centroid_decomposition.html
  license: CC BY-SA 4.0
---

**Centroid decomposition** is a divide-and-conquer technique on trees. It solves problems about **paths** in a tree: counting paths with some property, distances, queries on tree paths. The idea is to recursively remove the *centroid* of the tree, a vertex that splits it into pieces that are at most half as large, which guarantees a logarithmic recursion depth.

## Centroids

A **centroid** of a tree with $N$ vertices is a vertex whose removal leaves no component with more than $N/2$ vertices.

**Theorem.** Every tree has at least one centroid and at most two; if there are two, they are adjacent.

*Existence.* Start at any vertex and, while some component after removing the current vertex has more than $N/2$ vertices, move into that component (to the neighbour in it). The process cannot go back where it came from, since that side had at most $N/2$ vertices, so it stops, and the stopping vertex is a centroid.

*At most two, adjacent.* If $u$ and $v$ are both centroids, then each lies in a component of size at most $N/2$ after removing the other. That is possible only if they are adjacent (otherwise the path between them gives a larger component), and the two components have exactly $N/2$ vertices.

### Finding a centroid

Compute the subtree sizes with a DFS, start at a vertex, and repeatedly move to a child whose subtree has more than $N/2$ vertices. When there is none, the current vertex is a centroid. $O(N)$.

## The decomposition

1. Find the centroid $c$ of the current tree (component).
2. Do the work of the problem: process all paths that pass through $c$.
3. Remove $c$ (mark it as used).
4. Recursively decompose every component that remains.

The centroids form the **centroid tree**: the parent of a centroid is the centroid found in the larger component that contained it. Two facts make everything work:

- **Depth $O(\log N)$.** Each time a vertex ends up in a smaller component, the size at least halves. So a vertex is in at most $\log_2 N + 1$ components.
- **Path coverage.** Every path of the original tree passes through the centroid of some component: take the first (highest) centroid in the centroid tree that lies on the path. Before it, the whole path was in one component.

So if the work at a component of size $s$ is $O(s)$, the total is $O(N\log N)$: each vertex takes part in $O(\log N)$ components.

## Implementation

Iterative: an explicit stack of components instead of recursion. For every component we run a BFS to get its vertices, parents and subtree sizes, then walk to the centroid. We also record, for each vertex, the list of its centroid ancestors together with the distances to them (this is what most applications need).

```python
from collections import deque

def centroid_decomposition(adj):
    """Returns (centroid_parent, ancestors) where ancestors[v] = [(centroid, distance to it), ...]
    for all centroids whose component contains v, from the top of the centroid tree downward."""
    n = len(adj)
    removed = [False] * n
    centroid_parent = [-1] * n
    ancestors = [[] for _ in range(n)]
    stack = [(0, -1)]                                       # (a vertex of the component, parent centroid)
    while stack:
        start, cparent = stack.pop()
        order, par = [start], {start: -1}
        for v in order:                                     # BFS over the component
            for u in adj[v]:
                if not removed[u] and u not in par:
                    par[u] = v
                    order.append(u)
        size = {v: 1 for v in order}
        for v in reversed(order):
            if par[v] != -1:
                size[par[v]] += size[v]
        total = len(order)
        c = start
        while True:                                         # walk towards the heavy child
            heavy = next((u for u in adj[c] if not removed[u] and par.get(u) == c and size[u] * 2 > total), None)
            if heavy is None:
                break
            c = heavy
        centroid_parent[c] = cparent
        dist = {c: 0}                                       # distances from the centroid inside the component
        queue = deque([c])
        while queue:
            v = queue.popleft()
            ancestors[v].append((c, dist[v]))
            for u in adj[v]:
                if not removed[u] and u not in dist:
                    dist[u] = dist[v] + 1
                    queue.append(u)
        removed[c] = True
        for u in adj[c]:
            if not removed[u]:
                stack.append((u, c))
    return centroid_parent, ancestors

# a path 0 - 1 - 2 - 3 - 4: the centroid tree has the middle vertex as its root
path = [[1], [0, 2], [1, 3], [2, 4], [3]]
cparent, anc = centroid_decomposition(path)
assert cparent[2] == -1 and set(cparent[v] for v in (0, 1, 3, 4)) <= {2, 1, 3}
assert anc[0][0] == (2, 2)                                   # vertex 0 is at distance 2 from the top centroid
```

### Checking the properties

On random trees: the depth of the centroid tree is at most $\log_2 N + 1$, and for every pair of vertices the path between them contains their lowest common ancestor in the centroid tree (the "path coverage" property):

```python
import random

def random_tree(n, rnd):
    adj = [[] for _ in range(n)]
    for v in range(1, n):
        p = rnd.randrange(v) if rnd.random() < 0.6 else v - 1
        adj[p].append(v)
        adj[v].append(p)
    return adj

def all_distances(adj):
    n = len(adj)
    result = []
    for s in range(n):
        dist = [-1] * n
        dist[s] = 0
        queue = deque([s])
        while queue:
            v = queue.popleft()
            for u in adj[v]:
                if dist[u] < 0:
                    dist[u] = dist[v] + 1
                    queue.append(u)
        result.append(dist)
    return result

rnd = random.Random(1)
for _ in range(100):
    n = rnd.randint(1, 50)
    adj = random_tree(n, rnd)
    cparent, anc = centroid_decomposition(adj)
    dist = all_distances(adj)
    assert max(len(a) for a in anc) <= n.bit_length() + 1                  # depth O(log N)
    for u in range(n):
        for v in range(n):
            common = [c for (c, _), (c2, _) in zip(anc[u], anc[v]) if c == c2]
            centroid = common[-1]                                           # the lowest common centroid ancestor
            d_u = dict(anc[u])[centroid]
            d_v = dict(anc[v])[centroid]
            assert d_u + d_v == dist[u][v]                                  # some shortest path goes through it
```

## Application 1: counting paths with exactly $K$ edges

For each centroid $c$, count the pairs of vertices in **different** subtrees of $c$ (or one of them being $c$) whose distances to $c$ add up to $K$. Process the subtrees one at a time: keep a counter `seen[d]` of the vertices at distance $d$ in the previous subtrees (initially `seen[0] = 1` for $c$ itself); for a vertex at distance $d$ in the current subtree add `seen[K - d]`; afterwards add the subtree's distances to `seen`.

```python
from collections import Counter

def count_paths_of_length(adj, K):
    n = len(adj)
    removed = [False] * n
    answer = 0
    stack = [0]
    while stack:
        start = stack.pop()
        order, par = [start], {start: -1}
        for v in order:
            for u in adj[v]:
                if not removed[u] and u not in par:
                    par[u] = v
                    order.append(u)
        size = {v: 1 for v in order}
        for v in reversed(order):
            if par[v] != -1:
                size[par[v]] += size[v]
        c = start
        while True:
            heavy = next((u for u in adj[c] if not removed[u] and par.get(u) == c and size[u] * 2 > len(order)), None)
            if heavy is None:
                break
            c = heavy
        seen = Counter({0: 1})
        for first in adj[c]:
            if removed[first]:
                continue
            distances = []
            frontier = [(first, c, 1)]
            while frontier:
                v, p, d = frontier.pop()
                if d > K:
                    continue
                distances.append(d)
                for u in adj[v]:
                    if u != p and not removed[u]:
                        frontier.append((u, v, d + 1))
            for d in distances:
                answer += seen[K - d]
            for d in distances:
                seen[d] += 1
        removed[c] = True
        stack.extend(u for u in adj[c] if not removed[u])
    return answer

for _ in range(100):
    n = rnd.randint(1, 40)
    adj = random_tree(n, rnd)
    dist = all_distances(adj)
    for K in range(1, 6):
        expected = sum(1 for u in range(n) for v in range(u + 1, n) if dist[u][v] == K)
        assert count_paths_of_length(adj, K) == expected
```

Time $O(N\log N)$: each component costs time linear in its size, and the depth is logarithmic.

## Application 2: nearest marked vertex

Mark vertices one by one (all start unmarked), and answer "how far is the nearest marked vertex from $v$?" Using the centroid ancestors of a vertex: the nearest marked vertex $w$ to $v$ lies in the component of some centroid ancestor $c$ that the path $v \to w$ goes through, so its distance is $d(v, c) + d(c, w)$. For each centroid $c$ keep `best[c]`, the smallest distance from $c$ to a marked vertex in its component.

- **mark $v$:** for each `(c, d)` in `ancestors[v]`, `best[c] = min(best[c], d)`;
- **query $v$:** `min(best[c] + d for (c, d) in ancestors[v])`.

Both take $O(\log N)$.

```python
class NearestMarked:
    def __init__(self, adj):
        _, self.anc = centroid_decomposition(adj)
        self.best = {}

    def mark(self, v):
        for c, d in self.anc[v]:
            if d < self.best.get(c, float("inf")):
                self.best[c] = d

    def query(self, v):
        return min((self.best.get(c, float("inf")) + d for c, d in self.anc[v]), default=float("inf"))

for _ in range(100):
    n = rnd.randint(1, 40)
    adj = random_tree(n, rnd)
    dist = all_distances(adj)
    nm, marked = NearestMarked(adj), []
    assert nm.query(0) == float("inf")
    for _ in range(30):
        if rnd.random() < 0.4:
            v = rnd.randrange(n)
            nm.mark(v)
            marked.append(v)
        else:
            v = rnd.randrange(n)
            expected = min((dist[v][m] for m in marked), default=float("inf"))
            assert nm.query(v) == expected
```

## Related

- [Heavy-light decomposition](/theory/graphs/hld) is the other big technique for path queries; centroid decomposition shines for *distance*-based problems (counting, nearest, sums of distances), while HLD is better for queries on the path's values with updates.
- The centroid tree also gives an $O(\log n)$-depth structure on which tree **distance queries** can be answered by combining distances to the top centroids.

## Practice problems

- [CSES - Finding a Centroid](https://cses.fi/problemset/task/2079) [difficulty: easy]
- [CSES - Fixed-Length Paths II](https://cses.fi/problemset/task/2081) [difficulty: easy]
- [Codeforces - Xenia and Tree](http://codeforces.com/problemset/problem/342/E) [difficulty: medium]
- [Codeforces - Digit Tree](http://codeforces.com/contest/716/problem/E) [difficulty: medium]
- [OJ - Race](https://oj.uz/problem/view/IOI11_race) [difficulty: medium]
- [SPOJ - QTREE5](http://www.spoj.com/problems/QTREE5/) [difficulty: hard]
