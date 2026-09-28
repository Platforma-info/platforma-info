---
title: "Maximum Flow: Dinic's Algorithm"
section: Flows and matchings
order: 6
difficulty: advanced
summary: "Dinic's algorithm finds a maximum flow in O(V²E) by repeatedly building a layered network and saturating it with a blocking flow; on unit networks it runs in O(E√V)."
tags: [maximum flow, dinic, blocking flow, layered network, unit network]
prerequisites: [graphs/maximum-flow, graphs/breadth-first-search]
source:
  title: "Maximum flow - Dinic's algorithm"
  url: https://cp-algorithms.com/graph/dinic.html
  license: CC BY-SA 4.0
---

Dinic's algorithm (Yefim Dinitz, 1970) solves the maximum flow problem in $O(V^2E)$. The problem itself is described in the [maximum flow article](/theory/graphs/maximum-flow), which also introduces a short version of Dinic; here we go through the definitions, the proofs and a robust implementation.

## Definitions

The **residual network** $G^R$ of a network $G$ has, for each edge $(v, u)$, two edges: $(v, u)$ with capacity $c_{vu}^R = c_{vu} - f_{vu}$ and $(u, v)$ with capacity $c_{uv}^R = f_{vu}$.

A **blocking flow** in a network is a flow such that every path from $s$ to $t$ contains at least one saturated edge. A blocking flow is not necessarily a maximum flow (a later path can use residual back edges).

The **layered network** of $G$: compute the level $\text{level}[v]$ of each vertex, the length of the shortest path from $s$ using only edges with positive residual capacity; keep only the edges $(v, u)$ with $\text{level}[v] + 1 = \text{level}[u]$. This network is acyclic.

## Algorithm

The algorithm works in **phases**. In each phase:

1. Build the layered network of the current residual network (a BFS from $s$). If $t$ is not reachable, stop: the flow is maximum.
2. Find a blocking flow in the layered network and add it to the current flow.

## Correctness

If the algorithm stops, the BFS found no path from $s$ to $t$ in the residual network, so there is no augmenting path and the flow is maximum.

## Number of phases

There are fewer than $V$ phases. Two lemmas prove it.

**Lemma 1.** Distances from $s$ never decrease from one phase to the next: $\text{level}_{i+1}[v] \ge \text{level}_i[v]$. *Proof sketch:* the residual network of phase $i+1$ contains only edges of phase $i$'s residual network, and back edges of them. A shortest path with a back edge $(u, w)$ would need $\text{level}[u] = \text{level}[w] + 1$ in the old layering, since the reversed edge was used by the flow, so following it goes *down* a level, and the total length cannot become shorter.

**Lemma 2.** $\text{level}_{i+1}[t] > \text{level}_i[t]$. Otherwise there would be a shortest $s$-$t$ path that survived in the old layered network, which contradicts that the blocking flow saturated an edge of every such path.

Since $\text{level}[t]$ grows strictly in every phase and cannot exceed $V-1$, there are fewer than $V$ phases.

## Finding a blocking flow

Repeatedly push flow along paths found by a DFS from $s$ to $t$ in the layered network. To make it fast, keep a **pointer** `ptr[v]` to the next edge of $v$ that may still be used; when an edge is saturated, or leads to a dead end, the pointer moves past it forever (within the phase). One DFS run costs $O(k + V)$ where $k$ is the number of pointer advances; pointer advances total at most $E$ per phase, and there are at most $E$ runs since each saturates an edge. So a blocking flow costs $O(VE)$, and the whole algorithm $O(V^2E)$.

## Implementation

The DFS is iterative (a stack of edges) to avoid Python's recursion limit. After pushing a path's bottleneck, we backtrack only to the first saturated edge of the path.

```python
from collections import deque

class Dinic:
    def __init__(self, n):
        self.n = n
        self.adj = [[] for _ in range(n)]
        self.to, self.cap = [], []

    def add_edge(self, u, v, c):
        """Adds the edge u -> v with capacity c and its residual twin; returns the id of the edge."""
        self.adj[u].append(len(self.to)); self.to.append(v); self.cap.append(c)
        self.adj[v].append(len(self.to)); self.to.append(u); self.cap.append(0)
        return len(self.to) - 2

    def _levels(self, s, t):
        level = [-1] * self.n
        level[s] = 0
        queue = deque([s])
        while queue:
            v = queue.popleft()
            for e in self.adj[v]:
                if self.cap[e] > 0 and level[self.to[e]] < 0:
                    level[self.to[e]] = level[v] + 1
                    queue.append(self.to[e])
        return level if level[t] >= 0 else None

    def _blocking_flow(self, s, t, level):
        to, cap, adj = self.to, self.cap, self.adj
        ptr = [0] * self.n
        total = 0
        path = []                                       # edges from s to the current vertex
        v = s
        while True:
            if v == t:
                bottleneck = min(cap[e] for e in path)
                for e in path:
                    cap[e] -= bottleneck
                    cap[e ^ 1] += bottleneck
                total += bottleneck
                for i, e in enumerate(path):            # backtrack to the tail of the first saturated edge
                    if cap[e] == 0:
                        v = to[e ^ 1]
                        del path[i:]
                        break
                continue
            while ptr[v] < len(adj[v]):
                e = adj[v][ptr[v]]
                if cap[e] > 0 and level[to[e]] == level[v] + 1:
                    path.append(e)
                    v = to[e]
                    break
                ptr[v] += 1
            else:                                       # dead end: retreat and skip the edge we came by
                if v == s:
                    return total
                e = path.pop()
                v = to[e ^ 1]
                ptr[v] += 1

    def max_flow(self, s, t):
        flow = 0
        while True:
            level = self._levels(s, t)
            if level is None:
                return flow
            flow += self._blocking_flow(s, t, level)

g = Dinic(6)
for u, v, c in [(0, 1, 16), (0, 2, 13), (1, 2, 10), (2, 1, 4), (1, 3, 12), (3, 2, 9), (2, 4, 14), (4, 3, 7), (3, 5, 20), (4, 5, 4)]:
    g.add_edge(u, v, c)
assert g.max_flow(0, 5) == 23                            # the classic textbook network
```

## Testing

Against a simple Edmonds–Karp on a capacity matrix, on random networks (parallel edges included):

```python
import random

def edmonds_karp(n, edges, s, t):
    cap = [[0] * n for _ in range(n)]
    for u, v, c in edges:
        cap[u][v] += c
    flow = 0
    while True:
        parent = [-1] * n
        parent[s] = s
        queue = deque([s])
        while queue and parent[t] < 0:
            u = queue.popleft()
            for v in range(n):
                if parent[v] < 0 and cap[u][v] > 0:
                    parent[v] = u
                    queue.append(v)
        if parent[t] < 0:
            return flow
        bottleneck, v = float("inf"), t
        while v != s:
            bottleneck = min(bottleneck, cap[parent[v]][v])
            v = parent[v]
        v = t
        while v != s:
            cap[parent[v]][v] -= bottleneck
            cap[v][parent[v]] += bottleneck
            v = parent[v]
        flow += bottleneck

rnd = random.Random(1)
for _ in range(400):
    n = rnd.randint(2, 9)
    edges = [(rnd.randrange(n), rnd.randrange(n), rnd.randint(0, 9)) for _ in range(rnd.randint(0, 25))]
    edges = [(u, v, c) for u, v, c in edges if u != v]
    g = Dinic(n)
    for u, v, c in edges:
        g.add_edge(u, v, c)
    assert g.max_flow(0, n - 1) == edmonds_karp(n, edges, 0, n - 1)
```

The flow through an individual edge is the capacity of its residual twin, `g.cap[id ^ 1]`; the cut is the set of vertices reachable from $s$ in the final residual network.

## Unit networks: $O(E\sqrt V)$

A **unit network** is a network where every vertex other than $s$ and $t$ has either a single incoming edge or a single outgoing edge, and all capacities are $1$. The network built for **bipartite matching** is of this type. On unit networks Dinic runs in $O(E\sqrt V)$ (this is the Hopcroft–Karp algorithm):

- Each phase costs $O(E)$, since each edge is examined at most once.
- After $\sqrt V$ phases all augmenting paths of length $\le \sqrt V$ are gone. The difference between the maximum flow and the current flow decomposes into vertex-disjoint paths, each longer than $\sqrt V$, so there are at most $\sqrt V$ of them, and $\sqrt V$ more phases suffice.

If all capacities are 1 but degrees are unbounded, the paths are only edge-disjoint and the bound becomes $O(E\sqrt E)$ (and also $O(EV^{2/3})$).

```python
def max_matching(n_left, n_right, pairs):
    g = Dinic(n_left + n_right + 2)
    s, t = n_left + n_right, n_left + n_right + 1
    for u in range(n_left):
        g.add_edge(s, u, 1)
    for v in range(n_right):
        g.add_edge(n_left + v, t, 1)
    for u, v in pairs:
        g.add_edge(u, n_left + v, 1)
    return g.max_flow(s, t)

def matching_kuhn(n_left, adj):
    match = {}

    def try_kuhn(u, seen):
        for v in adj[u]:
            if v not in seen:
                seen.add(v)
                if v not in match or try_kuhn(match[v], seen):
                    match[v] = u
                    return True
        return False

    return sum(try_kuhn(u, set()) for u in range(n_left))

for _ in range(100):
    nl, nr = rnd.randint(1, 12), rnd.randint(1, 12)
    pairs = list({(rnd.randrange(nl), rnd.randrange(nr)) for _ in range(rnd.randint(0, 40))})
    adj = [[v for u2, v in pairs if u2 == u] for u in range(nl)]
    assert max_matching(nl, nr, pairs) == matching_kuhn(nl, adj)

import time
n = 20_000
pairs = list({(rnd.randrange(n), rnd.randrange(n)) for _ in range(60_000)})
start = time.perf_counter()
size = max_matching(n, n, pairs)
assert 0 < size <= n and time.perf_counter() - start < 30
```

## Practice problems

- [SPOJ: FASTFLOW](https://www.spoj.com/problems/FASTFLOW/)
