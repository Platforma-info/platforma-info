---
title: "Checking Whether a Graph Is Bipartite"
section: Flows and matchings
order: 1
difficulty: beginner
summary: "Two-colour a graph with BFS so that every edge joins different colours, or find an odd cycle that proves it impossible."
tags: [bipartite, coloring, bfs, odd cycle]
prerequisites: [graphs/breadth-first-search]
source:
  title: Check whether a graph is bipartite
  url: https://cp-algorithms.com/graph/bipartite-check.html
  license: CC BY-SA 4.0
---

A graph is **bipartite** if its vertices can be split into two groups (left and right) so that every edge joins a vertex of one group to a vertex of the other, none inside a group. Equivalently, you can **colour the vertices with two colours** such that adjacent vertices always have different colours.

Bipartite graphs model natural two-sided situations: students and courses, workers and jobs, boys and girls in a dance. They are the domain of [matching algorithms](/theory/graphs/kuhn-matching).

## Criterion

> A graph is bipartite if and only if it contains **no cycle of odd length**.

Walking along a cycle the colours must alternate, so an odd cycle would force a vertex to have two different colours.

## Algorithm

Colour a start vertex 0. Run a BFS: every newly discovered neighbour gets the colour opposite to the vertex it was discovered from. If we ever meet an edge whose endpoints have the **same** colour, the graph is not bipartite. Repeat from every uncoloured vertex so all components are handled.

```python
from collections import deque

def bipartite_coloring(adj):
    """Return a list of colours (0/1) if the graph is bipartite, otherwise None."""
    n = len(adj)
    color = [-1] * n
    for s in range(n):
        if color[s] != -1:
            continue
        color[s] = 0
        q = deque([s])
        while q:
            v = q.popleft()
            for u in adj[v]:
                if color[u] == -1:
                    color[u] = color[v] ^ 1
                    q.append(u)
                elif color[u] == color[v]:
                    return None
    return color

square = [[1, 3], [0, 2], [1, 3], [2, 0]]                    # 4-cycle: even, bipartite
triangle = [[1, 2], [0, 2], [0, 1]]                          # 3-cycle: odd
assert bipartite_coloring(square) == [0, 1, 0, 1]
assert bipartite_coloring(triangle) is None
assert bipartite_coloring([[], []]) == [0, 0]                # no edges: trivially bipartite
assert bipartite_coloring([[0]]) is None                     # a self-loop is an odd cycle of length 1
```

Time $O(n + m)$.

A [DFS](/theory/graphs/depth-first-search) works equally well; BFS just avoids recursion.

## Testing

Compare with the definition by trying all $2^n$ colourings on small graphs:

```python
import random
from itertools import product

def bipartite_brute(n, edges):
    return any(all(c[u] != c[v] for u, v in edges) for c in product((0, 1), repeat=n))

random.seed(1)
for _ in range(500):
    n = random.randint(1, 8)
    edges = [(random.randrange(n), random.randrange(n)) for _ in range(random.randint(0, 10))]
    adj = [[] for _ in range(n)]
    for u, v in edges:
        adj[u].append(v)
        adj[v].append(u)
    col = bipartite_coloring(adj)
    assert (col is not None) == bipartite_brute(n, edges)
    if col is not None:
        assert all(col[u] != col[v] for u, v in edges)
```

## Extracting the two sides

```python
def bipartition(adj):
    col = bipartite_coloring(adj)
    if col is None:
        return None
    left = [v for v, c in enumerate(col) if c == 0]
    right = [v for v, c in enumerate(col) if c == 1]
    return left, right

assert bipartition(square) == ([0, 2], [1, 3])
```

## Related

- **Trees and grids** are always bipartite (colour by parity of depth, or of `row + col`).
- **Online version**: use a DSU that tracks parity ([parity DSU](/theory/data-structures/disjoint-set-union)).
- **Maximum matching** in a bipartite graph: [Kuhn's algorithm](/theory/graphs/kuhn-matching).

## Practice problems

- [SPOJ - BUGLIFE](http://www.spoj.com/problems/BUGLIFE/)
- [Codeforces - Graph Without Long Directed Paths](https://codeforces.com/contest/1144/problem/F)
- [Codeforces - String Coloring (easy version)](https://codeforces.com/contest/1296/problem/E1)
- [CSES : Building Teams](https://cses.fi/problemset/task/1668)
- [Codeforces - Alternating Path](https://codeforces.com/contest/2204/problem/D)
