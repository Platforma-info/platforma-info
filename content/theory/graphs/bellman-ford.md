---
title: "Bellman-Ford Algorithm"
section: Shortest paths
order: 2
difficulty: intermediate
summary: "Shortest paths with negative edge weights, detecting and extracting negative cycles, and the queue-based SPFA optimization."
tags: [bellman-ford, negative cycle, shortest path, spfa]
prerequisites: [graphs/dijkstra]
source:
  title: Bellman-Ford Algorithm
  url: https://cp-algorithms.com/graph/bellman_ford.html
  license: CC BY-SA 4.0
---

[Dijkstra](/theory/graphs/dijkstra) needs non-negative weights. **Bellman-Ford** handles *negative* edge weights, and reports when a **negative cycle** (a cycle with a negative total weight, which allows the path length to shrink forever) is reachable. Its price is speed: $O(nm)$.

## Algorithm

A shortest path without cycles uses at most $n - 1$ edges. So relax **all edges** $n - 1$ times: after round $k$, $d[v]$ is at most the length of the best path from $s$ to $v$ that uses at most $k$ edges. After $n - 1$ rounds every distance is final.

**Relaxation** of edge $(u, v, w)$: if $d[u] + w < d[v]$ then $d[v] = d[u] + w$.

```python
INF = float("inf")

def bellman_ford(n, edges, s):
    """edges: list of (u, v, w). Return (dist, parent, negative_cycle_vertex or None)."""
    dist = [INF] * n
    parent = [-1] * n
    dist[s] = 0
    changed_vertex = None
    for round_ in range(n):
        changed_vertex = None
        for u, v, w in edges:
            if dist[u] < INF and dist[u] + w < dist[v]:
                dist[v] = dist[u] + w
                parent[v] = u
                changed_vertex = v
        if changed_vertex is None:            # nothing changed: the distances are final
            break
    # if the n-th round still relaxed something, a negative cycle is reachable from s
    return dist, parent, changed_vertex

edges = [(0, 1, 4), (0, 2, 5), (1, 2, -3), (2, 3, 4), (1, 3, 6)]
dist, parent, cycle_vertex = bellman_ford(4, edges, 0)
assert dist == [0, 4, 1, 5] and cycle_vertex is None
```

Two details:

- The check `dist[u] < INF` skips edges that start at a vertex not yet reached. With Python's `float("inf")` the arithmetic would still be harmless (`inf + w` is `inf`), but the check states the intent and avoids useless work.
- The **early exit**: if a full round changes nothing, later rounds change nothing either. On typical inputs this makes the algorithm much faster than $n$ rounds.

## Negative cycles

If in round number $n$ (the $n$-th round) some relaxation still succeeds, there is a negative cycle reachable from $s$. To *extract* the cycle:

1. Take the vertex $x$ that was relaxed in the last round. It is either on the cycle or reachable from it.
2. Walk back $n$ steps along `parent` from $x$. This guarantees we land on the cycle itself.
3. Then follow `parent` until we return to that vertex, collecting the cycle.

```python
def find_negative_cycle(n, edges, s=None):
    """Return a list of vertices forming a negative cycle, or None. Searches the whole graph if s is None."""
    dist = [0] * n if s is None else [INF] * n       # start all at 0: finds cycles anywhere
    if s is not None:
        dist[s] = 0
    parent = [-1] * n
    x = None
    for _ in range(n):
        x = None
        for u, v, w in edges:
            if dist[u] + w < dist[v]:
                dist[v] = dist[u] + w
                parent[v] = u
                x = v
        if x is None:
            return None
    for _ in range(n):                                 # move into the cycle
        x = parent[x]
    cycle = [x]
    v = parent[x]
    while v != x:
        cycle.append(v)
        v = parent[v]
    return cycle[::-1]

# a cycle 1 -> 2 -> 3 -> 1 of total weight -1
neg = [(0, 1, 2), (1, 2, 1), (2, 3, -3), (3, 1, 1)]
cyc = find_negative_cycle(4, neg)
assert sorted(cyc) == [1, 2, 3]
weight = {(u, v): w for u, v, w in neg}
assert sum(weight[(cyc[i], cyc[(i + 1) % len(cyc)])] for i in range(len(cyc))) < 0
assert find_negative_cycle(4, edges) is None
```

Initializing every distance to $0$ (instead of only the source) makes the algorithm find a negative cycle **anywhere** in the graph, not only those reachable from one source.

Vertices whose distance is $-\infty$ (reachable from a negative cycle) can be found by running BFS from the cycle vertices; the problem statements usually ask for exactly that.

## Testing

Compare with Floyd-Warshall on random graphs with negative edges but *no* negative cycles, and check that graphs with a negative cycle are reported:

```python
import random

def floyd(n, edges):
    d = [[0 if i == j else INF for j in range(n)] for i in range(n)]
    for u, v, w in edges:
        d[u][v] = min(d[u][v], w)
    for k in range(n):
        for i in range(n):
            for j in range(n):
                if d[i][k] + d[k][j] < d[i][j]:
                    d[i][j] = d[i][k] + d[k][j]
    return d

random.seed(5)
checked = 0
for _ in range(500):
    n = random.randint(1, 7)
    es = [(random.randrange(n), random.randrange(n), random.randint(-3, 9)) for _ in range(random.randint(0, 14))]
    fw = floyd(n, es)
    has_neg_cycle = any(fw[v][v] < 0 for v in range(n))
    assert (find_negative_cycle(n, es) is not None) == has_neg_cycle
    if not has_neg_cycle:
        s = random.randrange(n)
        assert bellman_ford(n, es, s)[0] == fw[s]
        checked += 1
assert checked > 50
```

## SPFA: Shortest Path Faster Algorithm

Most rounds of Bellman-Ford relax only a few edges. **SPFA** keeps a queue of vertices whose distance changed, and relaxes only their outgoing edges:

```python
from collections import deque

def spfa(adj, s):
    """adj[v] = list of (u, w). Return dist, or None if a negative cycle is reachable."""
    n = len(adj)
    dist = [INF] * n
    in_queue = [False] * n
    count = [0] * n                            # how many times a vertex entered the queue
    dist[s] = 0
    q = deque([s])
    in_queue[s] = True
    while q:
        v = q.popleft()
        in_queue[v] = False
        for u, w in adj[v]:
            if dist[v] + w < dist[u]:
                dist[u] = dist[v] + w
                if not in_queue[u]:
                    in_queue[u] = True
                    q.append(u)
                    count[u] += 1
                    if count[u] > n:           # entered the queue too often: negative cycle
                        return None
    return dist

g = [[] for _ in range(4)]
for u, v, w in edges:
    g[u].append((v, w))
assert spfa(g, 0) == [0, 4, 1, 5]

random.seed(6)
for _ in range(300):
    n = random.randint(1, 7)
    es = [(random.randrange(n), random.randrange(n), random.randint(-3, 9)) for _ in range(random.randint(0, 14))]
    fw = floyd(n, es)
    if any(fw[v][v] < 0 for v in range(n)):
        continue
    g = [[] for _ in range(n)]
    for u, v, w in es:
        g[u].append((v, w))
    s = random.randrange(n)
    assert spfa(g, s) == fw[s]
```

SPFA is often fast in practice, but its worst case is still $O(nm)$, and adversarial tests exist. On judges with anti-SPFA tests, prefer plain Bellman-Ford with the early exit or Dijkstra with potentials.

## When to use which

| Situation | Algorithm |
|-----------|-----------|
| unweighted | [BFS](/theory/graphs/breadth-first-search) |
| weights 0/1 | [0-1 BFS](/theory/graphs/zero-one-bfs) |
| non-negative weights | [Dijkstra](/theory/graphs/dijkstra) |
| negative weights or negative-cycle detection | Bellman-Ford |
| all pairs, $n \lesssim 400$ | [Floyd-Warshall](/theory/graphs/floyd-warshall) |

## Practice problems

- [E-OLYMP #1453 "Ford-Bellman" [difficulty: low]](https://www.e-olymp.com/en/problems/1453)
- [UVA #423 "MPI Maelstrom" [difficulty: low]](http://uva.onlinejudge.org/index.php?option=com_onlinejudge&Itemid=8&page=show_problem&problem=364)
- [UVA #534 "Frogger" [difficulty: medium]](http://uva.onlinejudge.org/index.php?option=com_onlinejudge&Itemid=8&category=7&page=show_problem&problem=475)
- [UVA #10099 "The Tourist Guide" [difficulty: medium]](http://uva.onlinejudge.org/index.php?option=com_onlinejudge&Itemid=8&category=12&page=show_problem&problem=1040)
- [UVA #515 "King" [difficulty: medium]](http://uva.onlinejudge.org/index.php?option=onlinejudge&page=show_problem&problem=456)
- [UVA 12519 - The Farnsworth Parabox](https://uva.onlinejudge.org/index.php?option=com_onlinejudge&Itemid=8&page=show_problem&problem=3964)
- [CSES - High Score](https://cses.fi/problemset/task/1673)
- [CSES - Cycle Finding](https://cses.fi/problemset/task/1197)
