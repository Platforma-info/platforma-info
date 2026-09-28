---
title: "Push-Relabel with Highest-Label Selection"
section: Flows and matchings
order: 9
difficulty: advanced
summary: "Always discharging a vertex of maximum height improves the push-relabel algorithm to O(V·E + V²√E), at most O(V³)."
tags: [maximum flow, push-relabel, highest label, cheriyan-maheshwari]
prerequisites: [graphs/push-relabel]
source:
  title: "Maximum flow - Push-relabel method improved"
  url: https://cp-algorithms.com/graph/push-relabel-faster.html
  license: CC BY-SA 4.0
---

The [push-relabel method](/theory/graphs/push-relabel) chooses the next vertex with excess arbitrarily (in the version there, the first in a queue). The modification of Cheriyan and Maheshwari (1989) is extremely simple: **always process a vertex with the greatest height** among those with excess. With this rule the complexity drops to

$$
O\!\left(VE + V^2\sqrt E\right)
$$

which in the worst case is $O(V^3)$.

## Implementation notes

No priority queue is needed. Keep the list of all excess vertices that currently have the greatest height. Apply push to each of them; if a vertex cannot push (all admissible edges are used up), relabel it. A relabel can create a vertex with greater height than the others, so after each relabel the list is recomputed from scratch. Once every vertex in the list has been discharged, the list is recomputed too (lower vertices become the maxima).

```python
INF = float("inf")

def push_relabel_highest(capacity, s, t):
    n = len(capacity)
    flow = [[0] * n for _ in range(n)]
    height = [0] * n
    excess = [0] * n

    def push(u, v):
        d = min(excess[u], capacity[u][v] - flow[u][v])
        flow[u][v] += d
        flow[v][u] -= d
        excess[u] -= d
        excess[v] += d

    def relabel(u):
        d = min((height[v] for v in range(n) if capacity[u][v] - flow[u][v] > 0), default=INF)
        if d < INF:
            height[u] = d + 1

    def highest_vertices():
        best, result = -1, []
        for i in range(n):
            if i != s and i != t and excess[i] > 0:
                if height[i] > best:
                    best, result = height[i], []
                if height[i] == best:
                    result.append(i)
        return result

    height[s] = n
    excess[s] = sum(capacity[s]) + 1
    for v in range(n):
        if v != s:
            push(s, v)
    current = highest_vertices()
    while current:
        for i in current:
            pushed = False
            for j in range(n):
                if excess[i] == 0:
                    break
                if capacity[i][j] - flow[i][j] > 0 and height[i] == height[j] + 1:
                    push(i, j)
                    pushed = True
            if not pushed:
                relabel(i)
                break                                   # heights changed: recompute the list of highest vertices
        current = highest_vertices()
    return excess[t]

cap = [[0] * 6 for _ in range(6)]
for u, v, c in [(0, 1, 16), (0, 2, 13), (1, 2, 10), (2, 1, 4), (1, 3, 12), (3, 2, 9), (2, 4, 14), (4, 3, 7), (3, 5, 20), (4, 5, 4)]:
    cap[u][v] = c
assert push_relabel_highest(cap, 0, 5) == 23
```

The result is the excess accumulated at the sink.

## Testing

Compare with Edmonds–Karp and with the plain push-relabel of the previous article on random networks:

```python
import random
from collections import deque

def edmonds_karp(capacity, s, t):
    n = len(capacity)
    cap = [row[:] for row in capacity]
    total = 0
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
            return total
        bottleneck, v = INF, t
        while v != s:
            bottleneck = min(bottleneck, cap[parent[v]][v])
            v = parent[v]
        v = t
        while v != s:
            cap[parent[v]][v] -= bottleneck
            cap[v][parent[v]] += bottleneck
            v = parent[v]
        total += bottleneck

rnd = random.Random(3)
for _ in range(500):
    n = rnd.randint(2, 10)
    capacity = [[0] * n for _ in range(n)]
    for _ in range(rnd.randint(0, 30)):
        u, v = rnd.randrange(n), rnd.randrange(n)
        if u != v:
            capacity[u][v] += rnd.randint(1, 9)
    assert push_relabel_highest(capacity, 0, n - 1) == edmonds_karp(capacity, 0, n - 1)
```

## Why highest label helps

Pushing from the highest vertex means that excess only ever moves into vertices that are *lower*, so flow tends to reach the sink in "waves" and each vertex is relabeled fewer times before the excess has drained; this is what limits the number of non-saturating pushes to $O(V^2\sqrt E)$ (instead of $O(V^2E)$).

In practice, two more heuristics give large speed-ups: the **gap heuristic** (if no vertex has height $k$ for some $k < n$, every vertex above $k$ can no longer reach the sink and can be lifted to $n + 1$) and **global relabeling** (periodically recompute exact heights by a BFS from $t$).
