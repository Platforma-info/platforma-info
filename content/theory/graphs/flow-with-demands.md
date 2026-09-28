---
title: "Flows with Demands (Lower Bounds)"
section: Flows and matchings
order: 10
difficulty: advanced
summary: "Find a flow in which every edge must carry at least its demand: reduce to an ordinary maximum flow with a super source and sink, and find the minimum such flow by binary search."
tags: [maximum flow, lower bounds, demands, circulation, min flow]
prerequisites: [graphs/dinic]
source:
  title: "Flows with demands"
  url: https://cp-algorithms.com/graph/flow_with_demands.html
  license: CC BY-SA 4.0
---

In an ordinary flow network the flow on an edge is limited by its capacity $c(e)$ from above and by $0$ from below. Here we additionally require each edge to carry at least a **demand** $d(e)$:

$$
d(e) \le f(e) \le c(e)
$$

Setting $d(e) = 0$ gives the ordinary problem. But now even finding *any valid flow* is not trivial (in the ordinary case the zero flow works). We solve two problems:

1. find an arbitrary flow that satisfies all the constraints;
2. find a **minimal** flow that satisfies all the constraints.

## Finding an arbitrary flow

Transform the network:

- add a new source $s'$ and a new sink $t'$;
- replace each edge $(u, v)$ with demand $d$ and capacity $c$ by an edge $(u, v)$ of capacity $c - d$; the mandatory $d$ units are simulated by giving $v$ extra supply of $d$ (an edge $s' \to v$) and giving $u$ an extra demand of $d$ (an edge $u \to t'$);
- add an edge $t \to s$ of infinite capacity, so the flow of the original network can return to the source.

Multiple edges between the same pair are merged (the capacities add up). It is convenient to sum, per vertex $v$, the incoming demands minus the outgoing demands, and to add either $s' \to v$ or $v \to t'$ with the net amount.

If the maximum flow in the new network **saturates** all edges leaving $s'$ (equivalently, all edges entering $t'$), the original network has a valid flow: the flow on an original edge is $d(e)$ plus the flow on its transformed edge. Otherwise no valid flow exists.

*Why it works.* A path $s \to \dots \to u \to v \to \dots \to t$ carrying the mandatory flow of edge $(u, v)$ becomes in the new network the path $s' \to v \to \dots \to t \to s \to \dots \to u \to t'$: the edge $t \to s$ closes it into a circulation.

## Minimal flow

The flow value of the original network is exactly the flow along the edge $(t, s)$. By limiting its capacity to $L$ we limit the flow value; if $L$ is too small, the demands cannot be satisfied and there is no saturating flow. Feasibility is monotone in $L$, so a **binary search** on the capacity of $(t, s)$ finds the smallest feasible value: the minimal flow.

## Implementation

We use a compact [Dinic](/theory/graphs/dinic) for the maximum flow.

```python
from collections import deque

class Dinic:
    def __init__(self, n):
        self.n = n
        self.adj = [[] for _ in range(n)]
        self.to, self.cap = [], []

    def add_edge(self, u, v, c):
        self.adj[u].append(len(self.to)); self.to.append(v); self.cap.append(c)
        self.adj[v].append(len(self.to)); self.to.append(u); self.cap.append(0)
        return len(self.to) - 2

    def max_flow(self, s, t):
        total = 0
        while True:
            level = [-1] * self.n
            level[s] = 0
            queue = deque([s])
            while queue:
                v = queue.popleft()
                for e in self.adj[v]:
                    if self.cap[e] > 0 and level[self.to[e]] < 0:
                        level[self.to[e]] = level[v] + 1
                        queue.append(self.to[e])
            if level[t] < 0:
                return total
            ptr = [0] * self.n

            def dfs(v, pushed):
                if v == t:
                    return pushed
                while ptr[v] < len(self.adj[v]):
                    e = self.adj[v][ptr[v]]
                    if self.cap[e] > 0 and level[self.to[e]] == level[v] + 1:
                        got = dfs(self.to[e], min(pushed, self.cap[e]))
                        if got:
                            self.cap[e] -= got
                            self.cap[e ^ 1] += got
                            return got
                    ptr[v] += 1
                return 0

            while True:
                pushed = dfs(s, 10 ** 18)
                if not pushed:
                    break
                total += pushed

def feasible_flow(n, edges, s, t, limit=None):
    """edges: (u, v, demand, capacity). Returns the list of flows on the edges, or None if none exists.

    `limit` bounds the total s-t flow value (default: unbounded)."""
    inf = sum(c for _, _, _, c in edges) + 1
    g = Dinic(n + 2)
    source, sink = n, n + 1
    balance = [0] * n                                        # incoming demand minus outgoing demand
    ids = []
    for u, v, d, c in edges:
        ids.append(g.add_edge(u, v, c - d))
        balance[v] += d
        balance[u] -= d
    for v in range(n):
        if balance[v] > 0:
            g.add_edge(source, v, balance[v])
        elif balance[v] < 0:
            g.add_edge(v, sink, -balance[v])
    ts = g.add_edge(t, s, inf if limit is None else limit)
    need = sum(b for b in balance if b > 0)
    if g.max_flow(source, sink) < need:
        return None
    return [edges[i][2] + g.cap[ids[i] ^ 1] for i in range(len(edges))], g.cap[ts ^ 1]

def min_flow(n, edges, s, t):
    """(minimal s-t flow value, flows on the edges), or None if the demands cannot be satisfied."""
    if feasible_flow(n, edges, s, t) is None:
        return None
    lo, hi = 0, sum(c for _, _, _, c in edges)
    while lo < hi:
        mid = (lo + hi) // 2
        if feasible_flow(n, edges, s, t, mid) is not None:
            hi = mid
        else:
            lo = mid + 1
    flows, value = feasible_flow(n, edges, s, t, lo)
    return value, flows

# s = 0, t = 3; the edge 0 -> 1 must carry at least 2 units, and 1 -> 3 at most 5
edges = [(0, 1, 2, 4), (1, 2, 0, 3), (1, 3, 0, 5), (2, 3, 1, 4)]
flows, _ = feasible_flow(4, edges, 0, 3)
assert all(d <= f <= c for f, (_, _, d, c) in zip(flows, edges))
value, flows = min_flow(4, edges, 0, 3)
assert value == 2 and all(d <= f <= c for f, (_, _, d, c) in zip(flows, edges))
# impossible: the edge 1 -> 2 must carry 3 units, but only 2 can arrive at vertex 1
assert feasible_flow(3, [(0, 1, 0, 2), (1, 2, 3, 5)], 0, 2) is None
```

## Testing against exhaustive search

For tiny networks, enumerate all integer flows within the bounds, keep those that satisfy conservation at every vertex except $s$ and $t$ and have a non-negative value (net flow out of $s$), and compare the existence and the minimum value with the algorithm:

```python
import random
from itertools import product

def brute_flows(n, edges, s, t):
    """All valid flows: returns the list of (value, flows)."""
    result = []
    for flows in product(*[range(d, c + 1) for _, _, d, c in edges]):
        balance = [0] * n
        for (u, v, _, _), f in zip(edges, flows):
            balance[u] -= f
            balance[v] += f
        if all(balance[v] == 0 for v in range(n) if v not in (s, t)) and balance[s] <= 0:   # a flow of value >= 0
            result.append((-balance[s], flows))
    return result

rnd = random.Random(1)
for _ in range(300):
    n = rnd.randint(2, 5)
    edges = []
    for _ in range(rnd.randint(1, 6)):
        u, v = rnd.randrange(n), rnd.randrange(n)
        if u != v:
            c = rnd.randint(0, 3)
            edges.append((u, v, rnd.randint(0, c), c))
    if not edges:
        continue
    everything = brute_flows(n, edges, 0, n - 1)
    answer = min_flow(n, edges, 0, n - 1)
    if not everything:
        assert answer is None
    else:
        assert answer is not None
        assert answer[0] == min(value for value, _ in everything)
        flows = answer[1]
        assert all(d <= f <= c for f, (_, _, d, c) in zip(flows, edges))
        balance = [0] * n
        for (u, v, _, _), f in zip(edges, flows):
            balance[u] -= f
            balance[v] += f
        assert all(balance[v] == 0 for v in range(1, n - 1))                # conservation
```

## Remarks

- The same reduction handles **circulations with lower bounds** (no source and sink): omit the edge $t \to s$.
- A *maximum* flow with demands: first find a feasible flow, then continue with ordinary augmentation from it in the original network (with capacities $c - f$ on forward and $f - d$ on reverse edges).
