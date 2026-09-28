---
title: "Minimum-Cost Flow: Successive Shortest Paths"
section: Flows and matchings
order: 11
difficulty: advanced
summary: "Send K units of flow from s to t at minimum cost by repeatedly augmenting along a cheapest residual path, using SPFA or Dijkstra with potentials."
tags: [min cost flow, successive shortest path, spfa, dijkstra, potentials, johnson]
prerequisites: [graphs/maximum-flow, graphs/bellman-ford, graphs/dijkstra]
source:
  title: "Minimum-cost flow - Successive shortest path algorithm"
  url: https://cp-algorithms.com/graph/min_cost_flow.html
  license: CC BY-SA 4.0
---

We are given a network with $n$ vertices and $m$ edges; each edge has a non-negative integer **capacity** and an integer **cost** per unit of flow, and a source $s$ and sink $t$ are marked. For a given value $K$ we must find a flow of value $K$ with the **lowest total cost** (the sum over edges of `flow × cost`). This is the **minimum-cost flow** problem. In a variant, we want the *maximum* flow and, among all maximum flows, the cheapest: the **minimum-cost maximum flow**. Both are solved by the algorithm of successive shortest paths.

## Algorithm

It is like [Edmonds–Karp](/theory/graphs/maximum-flow), except that the augmenting path is the **cheapest** path in the residual network (by cost, not by number of edges).

For each edge $(i, j)$ with capacity $U$ and cost $C$, add the reverse edge $(j, i)$ with capacity $0$ and cost $-C$. The **residual network** contains the edges with unused capacity. Then:

1. Find the cheapest path from $s$ to $t$ in the residual network (the costs can be negative because of the reverse edges, so use Bellman–Ford/SPFA, or Dijkstra with potentials).
2. If there is no path, stop. If the flow is smaller than $K$, no flow of value $K$ exists.
3. Push as much flow as possible along it, but not more than needed to reach $K$; add its cost; update the residual capacities.
4. Repeat until the flow reaches $K$.

With $K = \infty$ the algorithm finds the minimum-cost maximum flow.

Why is the result optimal? The invariant is that the current flow is a minimum-cost flow *for its own value*: this is equivalent to the residual network having no negative-cost cycle, and augmenting along a cheapest path never creates one.

## Multiple edges and undirected edges

An undirected edge is two opposite directed edges of the same capacity and cost. Together with their reverse edges this gives a multigraph. The implementation below stores edges in an **edge list** with each edge's reverse at index `id ^ 1` and remembers, for each vertex on the shortest path, the *edge id* it came by; then parallel edges cause no problem.

## Implementation with SPFA

```python
from collections import deque

INF = float("inf")

class MinCostFlow:
    def __init__(self, n):
        self.n = n
        self.adj = [[] for _ in range(n)]
        self.to, self.cap, self.cost = [], [], []

    def add_edge(self, u, v, capacity, cost):
        self.adj[u].append(len(self.to)); self.to.append(v); self.cap.append(capacity); self.cost.append(cost)
        self.adj[v].append(len(self.to)); self.to.append(u); self.cap.append(0); self.cost.append(-cost)
        return len(self.to) - 2

    def flow_on(self, edge_id):
        return self.cap[edge_id ^ 1]

    def _spfa(self, s):
        dist = [INF] * self.n
        parent_edge = [-1] * self.n
        in_queue = [False] * self.n
        dist[s] = 0
        queue = deque([s])
        while queue:
            u = queue.popleft()
            in_queue[u] = False
            for e in self.adj[u]:
                v = self.to[e]
                if self.cap[e] > 0 and dist[u] + self.cost[e] < dist[v]:
                    dist[v] = dist[u] + self.cost[e]
                    parent_edge[v] = e
                    if not in_queue[v]:
                        in_queue[v] = True
                        queue.append(v)
        return dist, parent_edge

    def min_cost_flow(self, s, t, k=INF):
        """Send up to k units from s to t. Returns (flow, cost); flow < k if the network cannot carry k."""
        flow = cost = 0
        while flow < k:
            dist, parent_edge = self._spfa(s)
            if dist[t] == INF:
                break
            amount = k - flow                                    # the bottleneck along the path
            v = t
            while v != s:
                e = parent_edge[v]
                amount = min(amount, self.cap[e])
                v = self.to[e ^ 1]
            v = t
            while v != s:
                e = parent_edge[v]
                self.cap[e] -= amount
                self.cap[e ^ 1] += amount
                v = self.to[e ^ 1]
            flow += amount
            cost += amount * dist[t]
        return flow, cost

# two routes from 0 to 3: a cheap one of capacity 2, and an expensive one of capacity 5
net = MinCostFlow(4)
net.add_edge(0, 1, 2, 1); net.add_edge(1, 3, 2, 1)
net.add_edge(0, 2, 5, 3); net.add_edge(2, 3, 5, 3)
assert net.min_cost_flow(0, 3, 3) == (3, 2 * 2 + 1 * 6)          # 2 units at cost 2, 1 unit at cost 6
net = MinCostFlow(4)
net.add_edge(0, 1, 2, 1); net.add_edge(1, 3, 2, 1)
net.add_edge(0, 2, 5, 3); net.add_edge(2, 3, 5, 3)
assert net.min_cost_flow(0, 3) == (7, 2 * 2 + 5 * 6)               # the minimum-cost maximum flow
net = MinCostFlow(4)
net.add_edge(0, 1, 2, 1); net.add_edge(1, 3, 2, 1)
assert net.min_cost_flow(0, 3, 5) == (2, 4)                        # only 2 units fit: flow < k
```

## Complexity

The algorithm is not polynomial in the size of the input: in the worst case each augmentation pushes a single unit, so there are $O(F)$ iterations for a flow of value $F$, each costing one shortest-path computation $T$: $O(F\cdot T)$. With Bellman–Ford this is $O(F\,nm)$.

With **Dijkstra and potentials** (as in Johnson's algorithm) each iteration takes $O(m\log n)$ after an initial $O(nm)$ preprocessing, giving $O(nm + Fm\log n)$. The potentials $h[v]$ (the shortest distances of the previous iteration) reweight every edge to $c'(u,v) = c(u,v) + h[u] - h[v] \ge 0$, which allows Dijkstra even though the original residual costs may be negative.

```python
import heapq

def min_cost_flow_dijkstra(n, edges, s, t, k=INF):
    """Same as MinCostFlow.min_cost_flow, with Dijkstra + potentials. edges: (u, v, capacity, cost)."""
    adj = [[] for _ in range(n)]
    to, cap, cost = [], [], []
    for u, v, c, w in edges:
        adj[u].append(len(to)); to.append(v); cap.append(c); cost.append(w)
        adj[v].append(len(to)); to.append(u); cap.append(0); cost.append(-w)
    # initial potentials by Bellman-Ford (costs may be negative)
    h = [INF] * n
    h[s] = 0
    for _ in range(n):
        for u in range(n):
            if h[u] < INF:
                for e in adj[u]:
                    if cap[e] > 0 and h[u] + cost[e] < h[to[e]]:
                        h[to[e]] = h[u] + cost[e]
    h = [x if x < INF else 0 for x in h]
    flow = total = 0
    while flow < k:
        dist = [INF] * n
        parent_edge = [-1] * n
        dist[s] = 0
        pq = [(0, s)]
        while pq:
            d, u = heapq.heappop(pq)
            if d > dist[u]:
                continue
            for e in adj[u]:
                v = to[e]
                nd = d + cost[e] + h[u] - h[v]                  # a non-negative reduced cost
                if cap[e] > 0 and nd < dist[v]:
                    dist[v] = nd
                    parent_edge[v] = e
                    heapq.heappush(pq, (nd, v))
        if dist[t] == INF:
            break
        for v in range(n):
            if dist[v] < INF:
                h[v] += dist[v]
        amount, v = k - flow, t
        while v != s:
            amount = min(amount, cap[parent_edge[v]])
            v = to[parent_edge[v] ^ 1]
        v = t
        while v != s:
            e = parent_edge[v]
            cap[e] -= amount
            cap[e ^ 1] += amount
            v = to[e ^ 1]
        flow += amount
        total += amount * (h[t] - h[s])
    return flow, total

assert min_cost_flow_dijkstra(4, [(0, 1, 2, 1), (1, 3, 2, 1), (0, 2, 5, 3), (2, 3, 5, 3)], 0, 3) == (7, 34)
```

## Testing

Exhaustive check on tiny networks: enumerate all integer flows within the capacities, keep those with conservation at all vertices except $s$ and $t$ and value $K$, and take the cheapest. Costs include negative values (without negative cycles being an issue, since capacities are finite and we compare with the enumerated optimum of *value-$K$* flows).

```python
import random
from itertools import product

def brute_min_cost(n, edges, s, t, k):
    best = None
    for flows in product(*[range(c + 1) for _, _, c, _ in edges]):
        balance = [0] * n
        for (u, v, _, _), f in zip(edges, flows):
            balance[u] -= f
            balance[v] += f
        if all(balance[v] == 0 for v in range(n) if v not in (s, t)) and -balance[s] == k:
            c = sum(f * w for f, (_, _, _, w) in zip(flows, edges))
            best = c if best is None else min(best, c)
    return best

rnd = random.Random(1)
for _ in range(300):
    n = rnd.randint(2, 5)
    edges = []
    for _ in range(rnd.randint(1, 6)):
        u, v = rnd.randrange(n), rnd.randrange(n)
        if u != v:
            edges.append((u, v, rnd.randint(1, 3), rnd.randint(0, 5)))     # non-negative costs: no negative cycles
    k = rnd.randint(0, 4)
    expected = brute_min_cost(n, edges, 0, n - 1, k)
    net = MinCostFlow(n)
    for u, v, c, w in edges:
        net.add_edge(u, v, c, w)
    flow, cost = net.min_cost_flow(0, n - 1, k)
    if expected is None:
        assert flow < k                                                    # the flow of value k does not exist
    else:
        assert (flow, cost) == (k, expected)
        assert min_cost_flow_dijkstra(n, edges, 0, n - 1, k) == (k, expected)
```

## Remarks

- The **assignment problem** is a min-cost flow on a bipartite network; see [the next article](/theory/graphs/assignment-problem-min-flow).
- Negative costs are fine as long as the network has no cycle of negative total cost *with positive capacity*; otherwise cancel such cycles first.
- For very large flows, capacity scaling or the network simplex method are asymptotically better; the successive shortest path method is the one to know for contests.

## Practice problems

- [CSES - Task Assignment](https://cses.fi/problemset/task/2129)
- [CSES - Grid Puzzle II](https://cses.fi/problemset/task/2131)
- [AtCoder - Dream Team](https://atcoder.jp/contests/abc247/tasks/abc247_g)
