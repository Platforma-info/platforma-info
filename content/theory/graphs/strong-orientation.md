---
title: "Strong Orientation"
section: Connectivity
order: 6
difficulty: advanced
summary: "Direct the edges of an undirected graph to make it strongly connected (Robbins' theorem) with one DFS, or to minimize the number of strongly connected components."
tags: [strong orientation, bridges, dfs, robbins theorem, scc]
prerequisites: [graphs/bridges, graphs/strongly-connected-components]
source:
  title: "Strong Orientation"
  url: https://cp-algorithms.com/graph/strong-orientation.html
  license: CC BY-SA 4.0
---

A **strong orientation** of an undirected graph is an assignment of a direction to every edge such that the resulting directed graph is [strongly connected](/theory/graphs/strongly-connected-components): from any vertex we can reach any other by following edges in their directions.

## When does it exist?

Not for every graph. A **bridge** can be crossed in only one direction once oriented, so the two sides of the bridge could never reach each other in both directions. So a graph with a bridge has no strong orientation.

The converse is true too, and it is **Robbins' theorem**: a connected graph has a strong orientation if and only if it is *bridgeless* (2-edge-connected).

**Construction.** Run a [DFS](/theory/graphs/depth-first-search) on the connected bridgeless graph. Orient the **tree edges away from the root** (from parent to child) and every **other edge from the descendant to the ancestor** (back edges point upward).

Why it works: from the root we reach every vertex along tree edges. And from any vertex we can go up to the root: since there are no bridges, for every tree edge $(p, c)$ the subtree of $c$ contains a back edge to $p$ or above it; following it we climb strictly higher again and again until we reach the root.

## The extended problem: minimize the number of SCCs

For an arbitrary graph, we want an orientation with as **few strongly connected components** as possible.

Handle every connected component separately, and remove its bridges for the moment: what remains are *bridgeless components*, each of which can be strongly oriented. The bridges can be oriented in an arbitrary way (each still connects two different SCCs whatever its direction). So the minimum number of SCCs is

$$
\#\text{connected components} + \#\text{bridges}
$$

The construction is the same for every connected component: the DFS orientation above, applied to a graph with bridges, gives the optimal orientation.

## Implementation

The DFS below orients each edge in the direction in which it is **first traversed**, and counts bridges with the usual low-link test. It is iterative to avoid Python's recursion limit. A tree edge is first traversed from parent to child. A non-tree edge is first traversed from the descendant, because when the DFS is at the ancestor, the descendant has already scanned all its incident edges.

```python
def strong_orientation(n, edges):
    """Return (minimum number of SCCs, orientation string).

    orientation[i] is '>' if edge i is oriented from edges[i][0] to edges[i][1], and '<' otherwise.
    """
    adj = [[] for _ in range(n)]
    for i, (a, b) in enumerate(edges):
        adj[a].append((b, i))
        adj[b].append((a, i))
    tin = [-1] * n
    low = [0] * n
    used = [False] * len(edges)
    orient = ["?"] * len(edges)
    bridge_count = component_count = timer = 0
    for root in range(n):
        if tin[root] != -1:
            continue
        component_count += 1
        tin[root] = low[root] = timer
        timer += 1
        stack = [(root, -1, 0)]                          # (vertex, parent, index of next edge to scan)
        while stack:
            v, parent, i = stack.pop()
            if i < len(adj[v]):
                stack.append((v, parent, i + 1))
                to, idx = adj[v][i]
                if used[idx]:
                    continue
                used[idx] = True
                orient[idx] = ">" if v == edges[idx][0] else "<"
                if tin[to] == -1:
                    tin[to] = low[to] = timer
                    timer += 1
                    stack.append((to, v, 0))
                else:
                    low[v] = min(low[v], tin[to])
            elif parent != -1:                           # v is finished
                low[parent] = min(low[parent], low[v])
                if low[v] > tin[parent]:
                    bridge_count += 1
    return component_count + bridge_count, "".join(orient)

sccs, o = strong_orientation(4, [(0, 1), (1, 2), (2, 0), (2, 3)])
assert sccs == 2                                      # the triangle is one SCC, the bridge leads to vertex 3
assert strong_orientation(3, [(0, 1), (1, 2), (2, 0)])[0] == 1
assert strong_orientation(3, [])[0] == 3
```

## Testing

We check the orientation with a brute-force count of strongly connected components of the resulting directed graph, and then compare with the best result over **all** $2^m$ orientations of small graphs:

```python
import random
from itertools import product

def scc_count(n, arcs):
    """Number of strongly connected components by pairwise reachability (small n only)."""
    reach = [[i == j for j in range(n)] for i in range(n)]
    for u, v in arcs:
        reach[u][v] = True
    for k in range(n):
        for i in range(n):
            if reach[i][k]:
                for j in range(n):
                    if reach[k][j]:
                        reach[i][j] = True
    seen, count = set(), 0
    for v in range(n):
        if v not in seen:
            count += 1
            seen.update(u for u in range(n) if reach[v][u] and reach[u][v])
    return count

def arcs_from(edges, orient):
    return [(a, b) if o == ">" else (b, a) for (a, b), o in zip(edges, orient)]

rnd = random.Random(3)
for _ in range(300):
    n = rnd.randint(1, 7)
    edges = [(rnd.randrange(n), rnd.randrange(n)) for _ in range(rnd.randint(0, 9))]
    edges = [(a, b) for a, b in edges if a != b]
    count, orient = strong_orientation(n, edges)
    assert scc_count(n, arcs_from(edges, orient)) == count              # the produced orientation achieves it
    best = min(scc_count(n, arcs_from(edges, o)) for o in product("<>", repeat=len(edges)))
    assert count == best                                                # and nothing can do better
```

## Applications

- In a road network, making all streets one-way while keeping every place reachable from every other place is possible exactly when there are no bridges; the DFS orientation gives an assignment.
- The minimal number of SCCs problem also appears as a subroutine in problems on the *bridge tree* of a graph.

## Practice problems

- [26th Polish OI - Osiedla](https://szkopul.edu.pl/problemset/problem/nldsb4EW1YuZykBlf4lcZL1Y/site/)
