---
title: "Maximum Flow: the Push-Relabel Algorithm"
section: Flows and matchings
order: 8
difficulty: advanced
summary: "Instead of augmenting paths, push excess flow downhill along a height function, relabeling stuck vertices, until the preflow becomes a maximum flow in O(V²E)."
tags: [maximum flow, push-relabel, preflow, height function, goldberg-tarjan]
prerequisites: [graphs/maximum-flow]
source:
  title: "Maximum flow - Push-relabel algorithm"
  url: https://cp-algorithms.com/graph/push-relabel.html
  license: CC BY-SA 4.0
---

The **push-relabel** (or preflow-push) algorithm of Goldberg and Tarjan (1985) computes a maximum flow in $O(V^2E)$. Instead of finding augmenting paths from $s$ to $t$ like Ford–Fulkerson, it works locally: it pushes flow from a vertex to a neighbour, and adjusts "heights" when a vertex is stuck. The problem itself is defined in the [maximum flow article](/theory/graphs/maximum-flow).

## Preflow and height

A **preflow** is like a flow, but a vertex may receive more than it sends out:

$$
0 \le f(e) \le c(e),\qquad \sum_{(v,u)\in E} f(v,u) \ge \sum_{(u,v)\in E} f(u,v)
$$

The difference is the **excess** $x(u)$. A preflow with no excess in vertices other than $s$ and $t$ is a valid flow.

A **height function** (labeling) $h$ assigns an integer to each vertex. It is **valid** if $h(s) = |V|$, $h(t) = 0$ and $h(u) \le h(v) + 1$ for every residual edge $(u, v)$ (an edge that can still carry flow): flow can go "down", or level, but a residual edge can never drop by more than one step.

**Key fact:** if a valid labeling exists, there is no augmenting path from $s$ to $t$ in the residual graph. A simple path has at most $|V| - 1$ edges and each edge lowers the height by at most one, but it would have to go from height $|V|$ down to $0$.

So the strategy is the dual of Ford–Fulkerson. Ford–Fulkerson keeps a valid flow and searches for augmenting paths. Push-relabel keeps a state with **no** augmenting path (valid labeling) and repairs the flow, until the preflow is a real flow, and then it must be maximum.

## Algorithm

**Initialization.** Saturate all edges out of $s$: $f(s, u) = c(s, u)$, and set $h(s) = |V|$, $h(u) = 0$ for all other vertices. (The empty preflow cannot be used: it has augmenting paths, so no valid labeling would exist.)

Two operations, applied to a vertex $u \neq s, t$ with positive excess:

- **push**$(u, v)$: allowed if $(u, v)$ is residual and $h(u) = h(v) + 1$. Send $\min(x(u), c(u,v) - f(u,v))$. "Excess flows downhill, but not too steeply."
- **relabel**$(u)$: if $u$ has excess but cannot push to any neighbour, raise its height to $1 + \min\{h(v) : (u,v)\text{ residual}\}$: as much as possible while keeping the labeling valid.

Repeat pushes and relabels while some vertex other than $s$, $t$ has excess. At the end there is a valid flow and a valid labeling, hence a maximum flow.

## Complexity

The height of a vertex never exceeds $2|V| - 1$ (at that point all remaining excess flows back to the source), so there are $O(V^2)$ relabels. There are $O(VE)$ saturating pushes and $O(V^2E)$ non-saturating pushes. If the next vertex with excess is found in $O(1)$ (a queue) and the neighbour scan uses a **current-arc** pointer per vertex, the total time is $O(V^2E)$.

## Implementation

The classic version on a capacity matrix. `seen[u]` is the current-arc pointer; a queue holds the vertices with excess.

```python
from collections import deque

INF = float("inf")

def push_relabel_max_flow(capacity, s, t):
    n = len(capacity)
    flow = [[0] * n for _ in range(n)]
    height = [0] * n
    excess = [0] * n
    seen = [0] * n
    queue = deque()

    def push(u, v):
        d = min(excess[u], capacity[u][v] - flow[u][v])
        flow[u][v] += d
        flow[v][u] -= d
        excess[u] -= d
        excess[v] += d
        if d and excess[v] == d:
            queue.append(v)

    def relabel(u):
        d = min((height[v] for v in range(n) if capacity[u][v] - flow[u][v] > 0), default=INF)
        if d < INF:
            height[u] = d + 1

    def discharge(u):
        while excess[u] > 0:
            if seen[u] < n:
                v = seen[u]
                if capacity[u][v] - flow[u][v] > 0 and height[u] > height[v]:
                    push(u, v)
                else:
                    seen[u] += 1
            else:
                relabel(u)
                seen[u] = 0

    height[s] = n
    excess[s] = sum(capacity[s]) + 1                  # more than everything that can leave the source
    for v in range(n):
        if v != s:
            push(s, v)
    while queue:
        u = queue.popleft()
        if u != s and u != t:
            discharge(u)
    return sum(flow[v][t] for v in range(n))

cap = [[0] * 6 for _ in range(6)]
for u, v, c in [(0, 1, 16), (0, 2, 13), (1, 2, 10), (2, 1, 4), (1, 3, 12), (3, 2, 9), (2, 4, 14), (4, 3, 7), (3, 5, 20), (4, 5, 4)]:
    cap[u][v] = c
assert push_relabel_max_flow(cap, 0, 5) == 23
```

In `discharge`, the pointer `seen[u]` scans the neighbours in circular order and is reset only after a relabel; between two relabels a vertex therefore advances its pointer at most $n$ times, which keeps the cost of scanning within the cost of the relabel itself.

## Testing

Against Edmonds–Karp on random networks, and with a check of the flow conservation on the resulting flow matrix:

```python
import random

def edmonds_karp(capacity, s, t):
    n = len(capacity)
    cap = [row[:] for row in capacity]
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

rnd = random.Random(1)
for _ in range(500):
    n = rnd.randint(2, 10)
    capacity = [[0] * n for _ in range(n)]
    for _ in range(rnd.randint(0, 30)):
        u, v = rnd.randrange(n), rnd.randrange(n)
        if u != v:
            capacity[u][v] += rnd.randint(1, 9)
    assert push_relabel_max_flow(capacity, 0, n - 1) == edmonds_karp(capacity, 0, n - 1)
```

## When to prefer it

Push-relabel with the improvements (highest-label selection, the *gap heuristic* and *global relabeling*) is the fastest max-flow algorithm on many large practical networks. The [highest-label version](/theory/graphs/push-relabel-faster) improves the worst case to $O(V^2\sqrt E)$. In Python the matrix implementation is fine for graphs of a few hundred vertices; for large sparse networks prefer [Dinic](/theory/graphs/dinic).
