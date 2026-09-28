---
title: Connected Components
section: Connectivity
order: 1
difficulty: beginner
summary: Split an undirected graph into its connected pieces with a traversal (or a DSU) and count or label them.
tags: [connected components, dfs, bfs, dsu]
prerequisites: [graphs/breadth-first-search]
source:
  title: Search for connected components in a graph
  url: https://cp-algorithms.com/graph/search-for-connected-components.html
  license: CC BY-SA 4.0
---

In an undirected graph, a **connected component** is a maximal set of vertices in which every vertex can reach every other one. The components partition the vertices: each vertex lies in exactly one.

*Task*: find all components, e.g. label each vertex with the number of its component.

## Algorithm

Loop over the vertices. Whenever you meet one that is not yet visited, you have found a new component: start a traversal (BFS or DFS) from it, and give every vertex it reaches the same component id. The traversals together touch every vertex and edge once: $O(n + m)$.

```python
def connected_components(adj):
    """Return (comp, count) where comp[v] is the component id of v."""
    n = len(adj)
    comp = [-1] * n
    count = 0
    for s in range(n):
        if comp[s] != -1:
            continue
        comp[s] = count
        stack = [s]
        while stack:
            v = stack.pop()
            for u in adj[v]:
                if comp[u] == -1:
                    comp[u] = count
                    stack.append(u)
        count += 1
    return comp, count

adj = [[1], [0, 2], [1], [4], [3], []]
comp, count = connected_components(adj)
assert count == 3
assert comp == [0, 0, 0, 1, 1, 2]
```

The `stack` here is only "vertices to process", and the order does not matter for component labelling, so a plain list works as either a stack (DFS-like) or, with `deque.popleft`, a queue (BFS).

## Listing the vertices of each component

```python
def component_lists(adj):
    comp, count = connected_components(adj)
    groups = [[] for _ in range(count)]
    for v, c in enumerate(comp):
        groups[c].append(v)
    return groups

assert component_lists(adj) == [[0, 1, 2], [3, 4], [5]]
```

## With a DSU instead

If the edges arrive one by one, or you only need to know *whether* two vertices are connected, a [disjoint set union](/theory/data-structures/disjoint-set-union) is simpler and supports adding edges online:

```python
def components_dsu(n, edges):
    parent = list(range(n))

    def find(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x

    comps = n
    for u, v in edges:
        ru, rv = find(u), find(v)
        if ru != rv:
            parent[ru] = rv
            comps -= 1
    return comps

edges = [(0, 1), (1, 2), (3, 4)]
assert components_dsu(6, edges) == 3

import random
random.seed(1)
for _ in range(200):
    n = random.randint(1, 15)
    es = [(random.randrange(n), random.randrange(n)) for _ in range(random.randint(0, 20))]
    g = [[] for _ in range(n)]
    for u, v in es:
        g[u].append(v)
        g[v].append(u)
    assert connected_components(g)[1] == components_dsu(n, es)
```

## Variations

- **Components of a grid** ("count the islands"): treat cells as vertices, 4-neighbours as edges, and label with the same loop.
- **Directed graphs** have *strongly* connected components, which need a different algorithm: [Strongly connected components](/theory/graphs/strongly-connected-components).
- **Number of edges/vertices per component**, minimum or sum of vertex values per component: aggregate during the traversal.

```python
def count_islands(grid):
    rows, cols = len(grid), len(grid[0])
    seen = [[False] * cols for _ in range(rows)]
    islands = 0
    for r in range(rows):
        for c in range(cols):
            if grid[r][c] == "1" and not seen[r][c]:
                islands += 1
                seen[r][c] = True
                stack = [(r, c)]
                while stack:
                    x, y = stack.pop()
                    for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                        nx, ny = x + dx, y + dy
                        if 0 <= nx < rows and 0 <= ny < cols and grid[nx][ny] == "1" and not seen[nx][ny]:
                            seen[nx][ny] = True
                            stack.append((nx, ny))
    return islands

assert count_islands(["11000", "11000", "00100", "00011"]) == 3
```

## Practice problems

- [SPOJ: CT23E](http://www.spoj.com/problems/CT23E/)
- [CODECHEF: GERALD07](https://www.codechef.com/MARCH14/problems/GERALD07)
- [CSES : Building Roads](https://cses.fi/problemset/task/1666)
