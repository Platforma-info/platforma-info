---
title: "D'Esopo-Pape Algorithm"
section: Shortest paths
order: 6
difficulty: intermediate
summary: "A deque-based single-source shortest path algorithm that is often faster than Dijkstra and Bellman-Ford and works with negative edges, but has an exponential worst case."
tags: [shortest paths, d'esopo-pape, deque, negative edges, levit]
prerequisites: [graphs/dijkstra, graphs/bellman-ford]
source:
  title: "D´Esopo-Pape algorithm"
  url: https://cp-algorithms.com/graph/desopo_pape.html
  license: CC BY-SA 4.0
---

Given a weighted graph and a source $v_0$, find the shortest paths to all other vertices. The D'Esopo–Pape algorithm (also known as Levit's algorithm) is usually faster than [Dijkstra](/theory/graphs/dijkstra) and [Bellman–Ford](/theory/graphs/bellman-ford), and it handles **negative edges**, though not negative cycles. Its weakness: there are graphs on which it takes exponential time, so it is not safe in the worst case.

## Description

Let $d_i$ be the current shortest distance to vertex $i$ and $p_i$ its predecessor. Every vertex is in one of three sets:

- $M_2$: the distance has **not yet been computed**;
- $M_1$: the distance is being computed; these vertices are in a **deque**;
- $M_0$: the distance has been computed already (though not necessarily final).

Take a vertex $u$ from the **front** of the deque and move it to $M_0$. For every edge $(u, v)$ of weight $w$ with $d_v > d_u + w$:

- update $d_v = d_u + w$ and $p_v = u$;
- if $v \in M_2$: put it at the **back** of the deque (it is a new vertex);
- if $v \in M_0$: put it at the **front** of the deque (it was already processed, and needs to propagate its improvement soon);
- if $v \in M_1$: it is already in the deque; only the distance changes.

Repeat until the deque is empty.

## Implementation

```python
from collections import deque

INF = float("inf")

def desopo_pape(adj, s):
    """adj[u] = list of (v, weight). Returns (dist, parent, number of vertex extractions)."""
    n = len(adj)
    dist = [INF] * n
    parent = [-1] * n
    state = [2] * n                        # 2: not seen, 1: in the deque, 0: processed
    dist[s] = 0
    q = deque([s])
    state[s] = 1
    extractions = 0
    while q:
        u = q.popleft()
        state[u] = 0
        extractions += 1
        for v, w in adj[u]:
            if dist[v] > dist[u] + w:
                dist[v] = dist[u] + w
                parent[v] = u
                if state[v] == 2:
                    state[v] = 1
                    q.append(v)
                elif state[v] == 0:
                    state[v] = 1
                    q.appendleft(v)
    return dist, parent, extractions

adj = [[(1, 4), (2, 1)], [(3, 1)], [(1, -2), (3, 5)], []]          # includes a negative edge
dist, parent, _ = desopo_pape(adj, 0)
assert dist == [0, -1, 1, 0] and parent[1] == 2
```

## Testing

The result must agree with Bellman–Ford on graphs with negative edges but no negative cycle, and with Dijkstra on non-negative graphs:

```python
import heapq
import random

def bellman_ford(n, edges, s):
    dist = [INF] * n
    dist[s] = 0
    for _ in range(n):
        changed = False
        for u, v, w in edges:
            if dist[u] + w < dist[v]:
                dist[v] = dist[u] + w
                changed = True
        if not changed:
            break
    return dist

def dijkstra(adj, s):
    dist = [INF] * len(adj)
    dist[s] = 0
    pq = [(0, s)]
    while pq:
        d, v = heapq.heappop(pq)
        if d != dist[v]:
            continue
        for to, w in adj[v]:
            if d + w < dist[to]:
                dist[to] = d + w
                heapq.heappush(pq, (d + w, to))
    return dist

rnd = random.Random(2)
for _ in range(500):
    n = rnd.randint(1, 9)
    # a graph with negative edges but no negative cycle: weights are w(u, v) = base + potential[u] - potential[v]
    potential = [rnd.randint(-8, 8) for _ in range(n)]
    edges = []
    for _ in range(rnd.randint(0, 25)):
        u, v = rnd.randrange(n), rnd.randrange(n)
        edges.append((u, v, rnd.randint(0, 6) + potential[v] - potential[u]))   # >= potential[v] - potential[u]
    adj = [[] for _ in range(n)]
    for u, v, w in edges:
        adj[u].append((v, w))
    assert desopo_pape(adj, 0)[0] == bellman_ford(n, edges, 0)
    if all(w >= 0 for _, _, w in edges):
        assert desopo_pape(adj, 0)[0] == dijkstra(adj, 0)
```

The weights `w = base + potential[u] - potential[v]` (with `base >= 0`) telescope along cycles, so all cycles have non-negative total weight even though individual edges may be negative. That is the standard way to generate random negative-edge graphs without negative cycles.

## Complexity

On most graphs it is very fast (roughly linear on many road-like networks), often beating Dijkstra. But there are graphs, built specifically against it, for which the running time is exponential in $n$; see the discussions on [Stack Overflow](https://stackoverflow.com/a/67642821) and [Codeforces](https://codeforces.com/blog/entry/3793). For that reason, use Dijkstra (non-negative weights) or Bellman–Ford/SPFA with a proper time bound when adversarial tests are possible; D'Esopo–Pape is a good pick when the graphs are random or well-behaved.

```python
def random_sparse(n, m):
    adj = [[] for _ in range(n)]
    for _ in range(m):
        adj[rnd.randrange(n)].append((rnd.randrange(n), rnd.randint(1, 100)))
    return adj

g = random_sparse(20_000, 80_000)
d1, _, extractions = desopo_pape(g, 0)
assert d1 == dijkstra(g, 0)
assert extractions < 20 * len(g)                # on random graphs the number of extractions stays small
```
