---
title: "Finding a Negative Cycle"
section: Shortest paths
order: 8
difficulty: intermediate
summary: "Detect and extract a negative-weight cycle with Bellman-Ford started from all vertices at once, and find every pair of vertices with arbitrarily short paths with Floyd-Warshall."
tags: [negative cycle, bellman-ford, floyd-warshall, shortest paths, arbitrage]
prerequisites: [graphs/bellman-ford, graphs/floyd-warshall]
source:
  title: "Finding a negative cycle in the graph"
  url: https://cp-algorithms.com/graph/finding-negative-cycle-in-graph.html
  license: CC BY-SA 4.0
---

Given a directed weighted graph with $N$ vertices and $M$ edges, find **any cycle of negative total weight**, if there is one. A second formulation asks for all pairs of vertices $(i, j)$ between which there are paths of **arbitrarily small weight**, which is when no shortest path exists. Different algorithms fit the two versions.

Negative cycles matter in practice: a currency exchange cycle that gains money (arbitrage) is a negative cycle for edge weights $-\log(\text{rate})$.

## With Bellman–Ford: find one cycle

The usual [Bellman–Ford](/theory/graphs/bellman-ford) looks for negative cycles reachable from a chosen source. To find a negative cycle **anywhere** in the graph, start with $d[i] = 0$ for **all** vertices, as if there was a source connected to every vertex with weight $0$. This does not change the validity of the detection.

Run $N$ rounds of relaxing all edges, remembering the predecessor `p` of every vertex whose distance decreased and the last vertex `x` that was relaxed in the last round.

- If no relaxation happened in round $N$, there is no negative cycle.
- Otherwise `x` is either on a negative cycle or reachable from one. Go back $N$ steps via `p` starting from `x`: we surely land on the cycle. Then walk along `p` until returning to the same vertex, collecting the cycle.

```python
def find_negative_cycle(n, edges):
    """edges: (u, v, cost). Return a list of vertices forming a negative cycle (in path order), or None."""
    d = [0] * n
    p = [-1] * n
    x = -1
    for _ in range(n):
        x = -1
        for u, v, cost in edges:
            if d[u] + cost < d[v]:
                d[v] = d[u] + cost
                p[v] = u
                x = v
    if x == -1:
        return None
    for _ in range(n):                    # go back n steps to be sure to be on the cycle
        x = p[x]
    cycle = [x]
    v = p[x]
    while v != x:
        cycle.append(v)
        v = p[v]
    cycle.reverse()
    return cycle

def cycle_weight(cycle, edges):
    best = {}
    for u, v, c in edges:
        best[(u, v)] = min(c, best.get((u, v), c))
    return sum(best[(cycle[i], cycle[(i + 1) % len(cycle)])] for i in range(len(cycle)))

edges = [(0, 1, 1), (1, 2, -3), (2, 0, 1), (2, 3, 4)]
cycle = find_negative_cycle(4, edges)
assert sorted(cycle) == [0, 1, 2] and cycle_weight(cycle, edges) == -1
assert find_negative_cycle(3, [(0, 1, 1), (1, 2, -3), (2, 0, 3)]) is None          # the cycle has weight exactly 0
assert find_negative_cycle(2, [(0, 0, -1)]) == [0]                                 # a negative self-loop
```

The complexity is $O(NM)$. (In C++ with large weights one clamps `d` at $-\infty$ to avoid overflow; Python integers do not overflow.)

### Testing

Whether a negative cycle exists is checked independently with Floyd–Warshall (`d[v][v] < 0` for some `v`), and any returned cycle must be a real cycle whose edges exist and whose total weight is negative:

```python
import random

INF = float("inf")

def floyd(n, edges):
    d = [[0 if i == j else INF for j in range(n)] for i in range(n)]
    for u, v, c in edges:
        d[u][v] = min(d[u][v], c)
    for k in range(n):
        for i in range(n):
            for j in range(n):
                if d[i][k] + d[k][j] < d[i][j]:
                    d[i][j] = d[i][k] + d[k][j]
    return d

rnd = random.Random(1)
for _ in range(1000):
    n = rnd.randint(1, 6)
    edges = [(rnd.randrange(n), rnd.randrange(n), rnd.randint(-4, 6)) for _ in range(rnd.randint(0, 12))]
    d = floyd(n, edges)
    has_negative = any(d[v][v] < 0 for v in range(n))
    cycle = find_negative_cycle(n, edges)
    assert (cycle is not None) == has_negative
    if cycle is not None:
        assert len(set(cycle)) == len(cycle)                                    # a simple cycle
        pairs = {(u, v) for u, v, _ in edges}
        assert all((cycle[i], cycle[(i + 1) % len(cycle)]) in pairs for i in range(len(cycle)))
        assert cycle_weight(cycle, edges) < 0
```

## With Floyd–Warshall: all pairs without a shortest path

Run [Floyd–Warshall](/theory/graphs/floyd-warshall). Afterwards `d[v][v] < 0` iff $v$ lies on a negative cycle. A pair $(i, j)$ has paths of arbitrarily small weight iff some vertex $t$ with `d[t][t] < 0` is reachable from $i$ and can reach $j$: go around the cycle as often as you want. We mark such pairs with $-\infty$.

```python
def floyd_with_minus_inf(n, edges):
    d = floyd(n, edges)
    result = [row[:] for row in d]
    for i in range(n):
        for j in range(n):
            for t in range(n):
                if d[i][t] < INF and d[t][t] < 0 and d[t][j] < INF:
                    result[i][j] = -INF
    return result

edges = [(0, 1, 1), (1, 2, -3), (2, 1, 1), (2, 3, 1)]            # the cycle 1 <-> 2 has weight -2
r = floyd_with_minus_inf(4, edges)
assert r[0][3] == -INF          # 0 -> 1, then loop 1 <-> 2 forever, then 2 -> 3
assert r[1][2] == -INF and r[2][1] == -INF
assert r[3][0] == INF           # 3 cannot reach anything
assert r[0][0] == 0             # 0 is not on a negative cycle and nothing leads back to it
```

### Testing the pairs

Independent check: run Bellman–Ford from each source for $n$ rounds, then $n$ more; a vertex whose distance still improves in the second half has an unbounded negative path.

```python
def unbounded_from(n, edges, s):
    d = [INF] * n
    d[s] = 0
    for _ in range(n):
        for u, v, c in edges:
            if d[u] + c < d[v]:
                d[v] = d[u] + c
    bad = [False] * n
    for _ in range(n):
        for u, v, c in edges:
            if d[u] + c < d[v]:
                d[v] = d[u] + c
                bad[v] = True
            if bad[u]:
                bad[v] = True
    return bad

for _ in range(500):
    n = rnd.randint(1, 6)
    edges = [(rnd.randrange(n), rnd.randrange(n), rnd.randint(-4, 6)) for _ in range(rnd.randint(0, 12))]
    r = floyd_with_minus_inf(n, edges)
    for s in range(n):
        bad = unbounded_from(n, edges, s)
        for j in range(n):
            assert (r[s][j] == -INF) == bad[j], (edges, s, j)
```

## Choosing the algorithm

| Question | Algorithm | Time |
|----------|-----------|------|
| Is there a negative cycle? Give me one | Bellman–Ford from a virtual source | $O(NM)$ |
| Which pairs have unbounded negative paths? | Floyd–Warshall | $O(N^3)$ |
| Distances with negative edges and no negative cycle | Bellman–Ford / SPFA / Johnson | see the shortest-path articles |

## Practice problems

- [UVA: Wormholes](https://uva.onlinejudge.org/index.php?option=com_onlinejudge&Itemid=8&page=show_problem&problem=499)
- [SPOJ: Alice in Amsterdam, I mean Wonderland](http://www.spoj.com/problems/UCV2013B/)
- [SPOJ: Johnsons Algorithm](http://www.spoj.com/problems/JHNSN/)
