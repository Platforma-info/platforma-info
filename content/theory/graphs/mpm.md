---
title: "Maximum Flow: the MPM Algorithm"
section: Flows and matchings
order: 7
difficulty: advanced
summary: "The Malhotra–Kumar–Maheshwari algorithm finds a blocking flow by repeatedly pushing the smallest vertex potential through the layered network, for O(V³) total time."
tags: [maximum flow, mpm, blocking flow, potential, layered network]
prerequisites: [graphs/dinic]
source:
  title: "Maximum flow - MPM algorithm"
  url: https://cp-algorithms.com/graph/mpm.html
  license: CC BY-SA 4.0
---

The MPM algorithm (Malhotra, Pramodh-Kumar and Maheshwari) computes a maximum flow in $O(V^3)$. It is close to [Dinic's algorithm](/theory/graphs/dinic): it works in phases, and in each phase it finds a **blocking flow in the layered network** of the residual network. The only difference is *how* the blocking flow is found.

## Potentials

Let $L$ be the layered network. For each vertex define its **inner potential** and **outer potential**, the total residual capacity entering and leaving it in $L$:

$$
p_{in}(v) = \sum_{(u, v)\in L}\big(c(u, v) - f(u, v)\big),\qquad
p_{out}(v) = \sum_{(v, u)\in L}\big(c(v, u) - f(v, u)\big)
$$

with $p_{in}(s) = p_{out}(t) = \infty$. The **potential** is $p(v) = \min(p_{in}(v), p_{out}(v))$: the largest amount of flow that can go through $v$.

A vertex $r$ with the minimum potential is a **reference node**.

**Claim.** The flow can be increased by $p(r)$ so that $p(r)$ becomes $0$. Indeed $L$ is acyclic: push $p(r)$ units out of $r$ along its outgoing edges; every vertex it reaches has at least as much outer potential as $p(r)$, so it can pass the flow on, until everything reaches $t$. In the same way we can pull $p(r)$ units from $s$ backwards along incoming edges.

## Algorithm for a phase

Repeat:

1. Choose a reference node $r$ (minimum potential among the remaining vertices).
2. If $p(r) = 0$, delete $r$ and all its edges; continue.
3. Otherwise push $p(r)$ units **forward** from $r$ to $t$ and **backward** from $r$ to $s$, level by level (a BFS in the layered network). Then $r$ has no potential left: delete it.

Saturated edges are deleted from $L$, and so are vertices with no incoming or outgoing edges. The phase ends when no vertices remain, and the flow is blocking.

There are at most $V$ iterations per phase (at least the reference node is deleted each time), and each iteration deletes every edge it passes through except at most $V$; so a phase costs $O(V^2)$. With fewer than $V$ phases (the proof is in the Dinic article), the total is $O(V^3)$.

The pushing is done level by level: within a layered network all edges go from a level to the next one, so a vertex is dequeued only after all its predecessors have pushed their excess into it.

## Implementation

```python
from collections import deque

INF = float("inf")

class MPM:
    def __init__(self, n):
        self.n = n
        self.to, self.cap = [], []
        self.adj = [[] for _ in range(n)]

    def add_edge(self, u, v, c):
        self.adj[u].append(len(self.to)); self.to.append(v); self.cap.append(c)
        self.adj[v].append(len(self.to)); self.to.append(u); self.cap.append(0)

    def _levels(self, s):
        level = [-1] * self.n
        level[s] = 0
        queue = deque([s])
        while queue:
            v = queue.popleft()
            for e in self.adj[v]:
                if self.cap[e] > 0 and level[self.to[e]] < 0:
                    level[self.to[e]] = level[v] + 1
                    queue.append(self.to[e])
        return level

    def max_flow(self, s, t):
        n, to, cap = self.n, self.to, self.cap
        total = 0
        while True:
            level = self._levels(s)
            if level[t] < 0:
                return total
            # the layered network: edges with residual capacity going one level forward
            out = [set() for _ in range(n)]
            inc = [set() for _ in range(n)]
            p_in, p_out = [0] * n, [0] * n
            for e in range(len(to)):
                u, v = to[e ^ 1], to[e]
                if cap[e] > 0 and level[u] + 1 == level[v] and (level[v] < level[t] or v == t):
                    out[u].add(e)
                    inc[v].add(e)
                    p_in[v] += cap[e]
                    p_out[u] += cap[e]
            p_in[s] = p_out[t] = INF
            alive = set(range(n))

            def remove_node(v):
                for e in inc[v]:
                    u = to[e ^ 1]
                    out[u].discard(e)
                    p_out[u] -= cap[e]
                for e in out[v]:
                    u = to[e]
                    inc[u].discard(e)
                    p_in[u] -= cap[e]
                alive.discard(v)

            def push(start, amount, forward):
                excess = {start: amount}
                queue = deque([start])
                while queue:
                    v = queue.popleft()
                    must = excess[v]
                    edges = out[v] if forward else inc[v]
                    for e in list(edges):
                        if must == 0:
                            break
                        u = to[e] if forward else to[e ^ 1]
                        pushed = min(must, cap[e])
                        cap[e] -= pushed
                        cap[e ^ 1] += pushed
                        if forward:
                            p_out[v] -= pushed
                            p_in[u] -= pushed
                        else:
                            p_in[v] -= pushed
                            p_out[u] -= pushed
                        if u not in excess:
                            excess[u] = 0
                            queue.append(u)
                        excess[u] += pushed
                        must -= pushed
                        if cap[e] == 0:
                            out[to[e ^ 1]].discard(e)
                            inc[to[e]].discard(e)

            while alive:
                r = min(alive, key=lambda v: min(p_in[v], p_out[v]))
                potential = min(p_in[r], p_out[r])
                if potential > 0:
                    total += potential
                    push(r, potential, False)             # pull the flow from s
                    push(r, potential, True)              # push the flow to t
                remove_node(r)

g = MPM(6)
for u, v, c in [(0, 1, 16), (0, 2, 13), (1, 2, 10), (2, 1, 4), (1, 3, 12), (3, 2, 9), (2, 4, 14), (4, 3, 7), (3, 5, 20), (4, 5, 4)]:
    g.add_edge(u, v, c)
assert g.max_flow(0, 5) == 23
```

The reference node is found by a linear scan (`min(alive, ...)`), which is exactly the $O(V)$ per iteration counted in the analysis.

## Testing

Against Edmonds–Karp on random networks, including networks where flow must be rerouted (with back edges) so that several phases are needed:

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
        bottleneck, v = INF, t
        while v != s:
            bottleneck = min(bottleneck, cap[parent[v]][v])
            v = parent[v]
        v = t
        while v != s:
            cap[parent[v]][v] -= bottleneck
            cap[v][parent[v]] += bottleneck
            v = parent[v]
        flow += bottleneck

rnd = random.Random(2)
for _ in range(500):
    n = rnd.randint(2, 9)
    edges = [(rnd.randrange(n), rnd.randrange(n), rnd.randint(0, 9)) for _ in range(rnd.randint(0, 25))]
    edges = [(u, v, c) for u, v, c in edges if u != v]
    g = MPM(n)
    for u, v, c in edges:
        g.add_edge(u, v, c)
    assert g.max_flow(0, n - 1) == edmonds_karp(n, edges, 0, n - 1), edges
```

## Comparison

| Algorithm | Time |
|-----------|------|
| Edmonds–Karp | $O(VE^2)$ |
| Dinic | $O(V^2E)$; $O(E\sqrt V)$ on unit networks |
| MPM | $O(V^3)$ |
| Push-relabel (highest label) | $O(V^2\sqrt E)$ |

MPM has the best guarantee for dense graphs ($E \approx V^2$), where $V^3$ beats $V^2E = V^4$; on sparse graphs Dinic is usually faster and simpler.
