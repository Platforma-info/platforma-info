---
title: "Maximum Flow: Edmonds-Karp and Dinic"
section: Flows and matchings
order: 3
difficulty: advanced
summary: "Push as much \"stuff\" as possible through a capacitated network with augmenting paths, and see why max flow equals min cut."
tags: [max flow, min cut, edmonds-karp, dinic, network]
prerequisites: [graphs/breadth-first-search]
source:
  title: Maximum flow - Ford-Fulkerson and Edmonds-Karp
  url: https://cp-algorithms.com/graph/edmonds_karp.html
  license: CC BY-SA 4.0
---

A **flow network** is a directed graph in which every edge $(u, v)$ has a **capacity** $c(u, v) \ge 0$. There is a **source** $s$ and a **sink** $t$. A **flow** assigns each edge a value $f(u, v)$ with:

- **capacity constraint**: $0 \le f(u, v) \le c(u, v)$;
- **flow conservation**: for every vertex other than $s$ and $t$, the incoming flow equals the outgoing flow.

The **value** of a flow is the total amount leaving $s$. The **maximum flow** problem asks for a flow of the largest value: how much water can we pump from the source to the sink?

Applications: bandwidth in networks, transportation, project selection, and many combinatorial problems that reduce to it (bipartite matching, edge-disjoint paths, minimum cut).

## The residual network and augmenting paths

Given a flow $f$, the **residual capacity** of an edge is what can still be pushed: $c(u,v) - f(u,v)$. The trick is that we may also **cancel** flow: pushing back along a reverse edge $v \to u$ up to $f(u, v)$. The graph of all positive residual capacities is the **residual network**.

An **augmenting path** is a path from $s$ to $t$ in the residual network. Its **bottleneck** is the minimum residual capacity on it. Pushing that amount along the path increases the flow value.

**Ford-Fulkerson method:** while an augmenting path exists, push its bottleneck. When none exists the flow is maximum.

- With arbitrary path choices, the running time can be as bad as the max-flow value (with integer capacities).
- **Edmonds-Karp** always chooses the augmenting path with the **fewest edges** (found by [BFS](/theory/graphs/breadth-first-search)). This guarantees at most $O(nm)$ augmentations, hence $O(n m^2)$ overall.

## Implementation: Edmonds-Karp

Store the graph as arrays of edges where edge `i` and its reverse edge `i ^ 1` are neighbours in the array. Reverse edges start with capacity 0 and receive the pushed flow:

```python
from collections import deque

class FlowGraph:
    def __init__(self, n):
        self.n = n
        self.adj = [[] for _ in range(n)]     # edge indices per vertex
        self.to = []
        self.cap = []                          # residual capacity of each edge

    def add_edge(self, u, v, capacity):
        self.adj[u].append(len(self.to)); self.to.append(v); self.cap.append(capacity)
        self.adj[v].append(len(self.to)); self.to.append(u); self.cap.append(0)     # reverse edge

    def edmonds_karp(self, s, t):
        flow = 0
        while True:
            prev_edge = [-1] * self.n
            prev_edge[s] = -2
            q = deque([s])
            while q and prev_edge[t] == -1:
                v = q.popleft()
                for e in self.adj[v]:
                    if self.cap[e] > 0 and prev_edge[self.to[e]] == -1:
                        prev_edge[self.to[e]] = e
                        q.append(self.to[e])
            if prev_edge[t] == -1:
                return flow                    # no augmenting path left
            bottleneck = float("inf")
            v = t
            while v != s:
                e = prev_edge[v]
                bottleneck = min(bottleneck, self.cap[e])
                v = self.to[e ^ 1]
            v = t
            while v != s:
                e = prev_edge[v]
                self.cap[e] -= bottleneck
                self.cap[e ^ 1] += bottleneck
                v = self.to[e ^ 1]
            flow += bottleneck

def build(n, edges):
    g = FlowGraph(n)
    for u, v, c in edges:
        g.add_edge(u, v, c)
    return g

# the classic textbook network: max flow is 23
edges = [(0, 1, 16), (0, 2, 13), (1, 2, 10), (2, 1, 4), (1, 3, 12), (3, 2, 9), (2, 4, 14), (4, 3, 7), (3, 5, 20), (4, 5, 4)]
assert build(6, edges).edmonds_karp(0, 5) == 23
```

## Max-flow min-cut theorem

An **$s$-$t$ cut** is a partition of the vertices into $S \ni s$ and $T \ni t$. Its capacity is the sum of capacities of edges going from $S$ to $T$. Every flow is at most the capacity of any cut (all flow must cross it), and:

> **Max-flow min-cut theorem.** The value of a maximum flow equals the capacity of a minimum cut.

When Edmonds-Karp stops, the vertices reachable from $s$ in the residual network form the side $S$ of a minimum cut. This is how you *find* the cut edges:

```python
def min_cut_side(g, s):
    """After running max flow: vertices reachable from s in the residual graph."""
    seen = [False] * g.n
    seen[s] = True
    q = deque([s])
    while q:
        v = q.popleft()
        for e in g.adj[v]:
            if g.cap[e] > 0 and not seen[g.to[e]]:
                seen[g.to[e]] = True
                q.append(g.to[e])
    return seen

g = build(6, edges)
value = g.edmonds_karp(0, 5)
side = min_cut_side(g, 0)
cut_capacity = sum(c for u, v, c in edges if side[u] and not side[v])
assert cut_capacity == value == 23
```

## Testing against a brute-force min cut

Since max flow = min cut, enumerate every subset $S$ on small networks:

```python
import random
from itertools import product

def min_cut_brute(n, edges, s, t):
    best = float("inf")
    others = [v for v in range(n) if v not in (s, t)]
    for bits in product((0, 1), repeat=len(others)):
        in_s = {s} | {v for v, b in zip(others, bits) if b}
        best = min(best, sum(c for u, v, c in edges if u in in_s and v not in in_s))
    return best

random.seed(13)
for _ in range(200):
    n = random.randint(2, 7)
    es = [(random.randrange(n), random.randrange(n), random.randint(1, 9)) for _ in range(random.randint(0, 14))]
    es = [(u, v, c) for u, v, c in es if u != v]
    assert build(n, es).edmonds_karp(0, n - 1) == min_cut_brute(n, es, 0, n - 1)
```

## Dinic's algorithm

Edmonds-Karp finds one path per BFS. **Dinic's algorithm** does far more work per BFS:

1. BFS from $s$ in the residual graph to compute **levels** (distance from $s$).
2. Find a **blocking flow** in the level graph (edges going from level $i$ to level $i+1$) with a DFS that remembers, for each vertex, which edge it examined last (`ptr`) so that no edge is scanned twice per phase.
3. Repeat until $t$ is not reachable.

The complexity is $O(n^2 m)$ in general, $O(m \sqrt{n})$ for unit-capacity bipartite graphs (which makes it the tool for matching too). It's the standard practical choice.

```python
class Dinic(FlowGraph):
    def max_flow(self, s, t):
        flow = 0
        while True:
            level = [-1] * self.n
            level[s] = 0
            q = deque([s])
            while q:
                v = q.popleft()
                for e in self.adj[v]:
                    if self.cap[e] > 0 and level[self.to[e]] == -1:
                        level[self.to[e]] = level[v] + 1
                        q.append(self.to[e])
            if level[t] == -1:
                return flow
            ptr = [0] * self.n
            # iterative DFS: `path` is the stack of edges from s to the current vertex
            while True:
                path = []
                v = s
                while v != t:
                    advanced = False
                    while ptr[v] < len(self.adj[v]):
                        e = self.adj[v][ptr[v]]
                        u = self.to[e]
                        if self.cap[e] > 0 and level[u] == level[v] + 1:
                            path.append(e)
                            v = u
                            advanced = True
                            break
                        ptr[v] += 1
                    if not advanced:
                        if v == s:
                            break
                        level[v] = -1              # dead end: never come back here in this phase
                        e = path.pop()
                        v = self.to[e ^ 1]
                        ptr[v] += 1
                if v != t:
                    break                          # blocking flow found; start a new BFS
                bottleneck = min(self.cap[e] for e in path)
                for e in path:
                    self.cap[e] -= bottleneck
                    self.cap[e ^ 1] += bottleneck
                flow += bottleneck

def build_dinic(n, edges):
    g = Dinic(n)
    for u, v, c in edges:
        g.add_edge(u, v, c)
    return g

assert build_dinic(6, edges).max_flow(0, 5) == 23

random.seed(14)
for _ in range(300):
    n = random.randint(2, 8)
    es = [(random.randrange(n), random.randrange(n), random.randint(1, 9)) for _ in range(random.randint(0, 18))]
    es = [(u, v, c) for u, v, c in es if u != v]
    assert build_dinic(n, es).max_flow(0, n - 1) == build(n, es).edmonds_karp(0, n - 1)
```

## Bipartite matching as a flow

Put a source in front of the left side and a sink behind the right side, all capacities 1. The maximum flow equals the maximum matching:

```python
def matching_by_flow(n_left, n_right, adj):
    s, t = n_left + n_right, n_left + n_right + 1
    g = Dinic(n_left + n_right + 2)
    for v in range(n_left):
        g.add_edge(s, v, 1)
        for u in adj[v]:
            g.add_edge(v, n_left + u, 1)
    for u in range(n_right):
        g.add_edge(n_left + u, t, 1)
    return g.max_flow(s, t)

assert matching_by_flow(3, 3, [[0, 1], [0], [1, 2]]) == 3
assert matching_by_flow(2, 2, [[0], [0]]) == 1
```

For plain matching, [Kuhn's algorithm](/theory/graphs/kuhn-matching) is shorter; the flow formulation pays off when capacities are larger than 1 or extra constraints appear (each worker can take up to $k$ jobs, and so on).

## Practice problems

- [Codeforces - Array and Operations](https://codeforces.com/contest/498/problem/c)
- [Codeforces - Red-Blue Graph](https://codeforces.com/contest/1288/problem/f)
- [CSES - Download Speed](https://cses.fi/problemset/task/1694)
- [CSES - Police Chase](https://cses.fi/problemset/task/1695)
- [CSES - School Dance](https://cses.fi/problemset/task/1696)
- [CSES - Distinct Routes](https://cses.fi/problemset/task/1711)
