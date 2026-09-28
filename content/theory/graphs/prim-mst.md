---
title: "Minimum Spanning Tree: Prim's Algorithm"
section: Spanning trees
order: 2
difficulty: intermediate
summary: Grow the spanning tree from one vertex by always adding the cheapest edge leaving it, in O(m log n) with a heap or O(n²) for dense graphs.
tags: [mst, prim, heap, greedy]
prerequisites: [graphs/kruskal-mst, graphs/dijkstra]
source:
  title: Minimum spanning tree - Prim's algorithm
  url: https://cp-algorithms.com/graph/mst_prim.html
  license: CC BY-SA 4.0
---

**Prim's algorithm** builds a minimum spanning tree by *growing* a single tree. Where [Kruskal](/theory/graphs/kruskal-mst) merges a forest of components by scanning edges globally, Prim starts at an arbitrary vertex and repeatedly attaches the nearest vertex outside the tree.

## Algorithm

1. Start with the tree containing one arbitrary vertex.
2. Among all edges that connect a tree vertex to a non-tree vertex, choose the one with the **smallest weight** and add it (together with its new endpoint) to the tree.
3. Repeat until all vertices are in the tree.

**Why it works.** The tree vertices and the rest form a cut, and by the *cut property* the lightest edge crossing a cut belongs to some MST. Every step picks such an edge, so the final tree is minimum.

It looks very much like [Dijkstra](/theory/graphs/dijkstra); the difference is the priority: Dijkstra orders vertices by the *distance from the source*, Prim by the weight of the *single connecting edge*.

## Sparse graphs: $O(m \log n)$ with a heap

Keep a heap of candidate edges `(weight, vertex)` leaving the tree. Pop the lightest; if its vertex is already in the tree, skip it (lazy deletion); otherwise add the vertex and push its edges to non-tree vertices.

```python
import heapq

def prim(adj, start=0):
    """adj[v] = list of (u, w). Return (total_weight, edges) of the MST of start's component."""
    n = len(adj)
    in_tree = [False] * n
    heap = [(0, start, -1)]                   # (weight, vertex, vertex it attaches to)
    total = 0
    chosen = []
    while heap:
        w, v, p = heapq.heappop(heap)
        if in_tree[v]:
            continue
        in_tree[v] = True
        total += w
        if p != -1:
            chosen.append((p, v, w))
        for u, wu in adj[v]:
            if not in_tree[u]:
                heapq.heappush(heap, (wu, u, v))
    return total, chosen

edges = [(7, 0, 1), (5, 0, 3), (8, 1, 2), (9, 1, 3), (7, 1, 4), (5, 2, 4), (15, 3, 4), (6, 3, 5), (8, 4, 5), (9, 4, 6), (11, 5, 6)]
adj = [[] for _ in range(7)]
for w, u, v in edges:
    adj[u].append((v, w))
    adj[v].append((u, w))

total, chosen = prim(adj)
assert total == 39 and len(chosen) == 6
```

Each edge is pushed at most twice, so the time is $O(m \log m) = O(m \log n)$.

## Dense graphs: $O(n^2)$ without a heap

Maintain `best[v]`: the cheapest edge connecting $v$ to the current tree. Each step picks the non-tree vertex with the smallest `best` by a linear scan, then updates `best` for its neighbours. This is optimal for dense graphs ($m \approx n^2$), where a heap would only add overhead.

```python
INF = float("inf")

def prim_dense(matrix):
    """matrix[u][v] = weight or INF. Return the total MST weight (graph assumed connected)."""
    n = len(matrix)
    best = [INF] * n
    best[0] = 0
    used = [False] * n
    total = 0
    for _ in range(n):
        v = -1
        for u in range(n):
            if not used[u] and (v == -1 or best[u] < best[v]):
                v = u
        used[v] = True
        total += best[v]
        row = matrix[v]
        for u in range(n):
            if not used[u] and row[u] < best[u]:
                best[u] = row[u]
    return total

mat = [[INF] * 7 for _ in range(7)]
for w, u, v in edges:
    mat[u][v] = mat[v][u] = min(mat[u][v], w)
assert prim_dense(mat) == 39
```

## Testing

Compare Prim, dense Prim and Kruskal on random connected graphs:

```python
import random

def kruskal_weight(n, es):
    parent = list(range(n))

    def find(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x

    total = 0
    for w, u, v in sorted(es):
        ru, rv = find(u), find(v)
        if ru != rv:
            parent[ru] = rv
            total += w
    return total

random.seed(12)
for _ in range(300):
    n = random.randint(2, 10)
    perm = list(range(n))
    random.shuffle(perm)
    es = [(random.randint(1, 20), perm[i], perm[i + 1]) for i in range(n - 1)]
    es += [(random.randint(1, 20), random.randrange(n), random.randrange(n)) for _ in range(random.randint(0, 15))]
    es = [(w, u, v) for w, u, v in es if u != v]
    g = [[] for _ in range(n)]
    m = [[INF] * n for _ in range(n)]
    for w, u, v in es:
        g[u].append((v, w)); g[v].append((u, w))
        m[u][v] = m[v][u] = min(m[u][v], w)
    assert prim(g)[0] == prim_dense(m) == kruskal_weight(n, es)
```

## Prim or Kruskal?

| | Kruskal | Prim (heap) | Prim (dense) |
|---|---|---|---|
| input | edge list | adjacency list | matrix |
| time | $O(m \log m)$ | $O(m \log n)$ | $O(n^2)$ |
| best for | sparse graphs, edge lists | general | very dense graphs |
| gives a forest for disconnected graphs | yes | only the start's component | no |

For sparse graphs in Python, Kruskal is usually a little faster, thanks to the C-level `sorted`. For points in the plane with Euclidean distances (complete graph, $n \le 3000$), use dense Prim: it needs no edge list at all.
