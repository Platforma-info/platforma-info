---
title: "Finding Bridges"
section: Connectivity
order: 2
difficulty: advanced
summary: "Find the edges whose removal disconnects the graph in O(n + m) using DFS entry times and low-link values."
tags: [bridges, dfs, low-link, tarjan]
prerequisites: [graphs/depth-first-search]
source:
  title: Finding bridges in a graph in O(N+M)
  url: https://cp-algorithms.com/graph/bridge-searching.html
  license: CC BY-SA 4.0
---

A **bridge** is an edge of an undirected graph whose removal increases the number of connected components (typically: disconnects the graph). Bridges model critical links: the single cable whose failure splits a network.

## Algorithm

Run a DFS and compute for each vertex $v$:

- $\text{tin}[v]$: the time when DFS enters $v$;
- $\text{low}[v]$: the smallest entry time reachable from the subtree of $v$ by going down tree edges and then using **at most one back edge**:

$$
\text{low}[v] = \min\begin{cases}
\text{tin}[v] \\
\text{tin}[u] & \text{for every back edge } (v, u) \\
\text{low}[c] & \text{for every DFS child } c \text{ of } v
\end{cases}
$$

A tree edge $(v, c)$ (with $c$ a child of $v$) is a **bridge** exactly when

$$
\text{low}[c] > \text{tin}[v]
$$

meaning that the subtree of $c$ cannot reach $v$ or anything above it except through this edge.

The edge to the *parent* must not count as a back edge. To handle **parallel edges** correctly, skip the parent by **edge id**, not by vertex: two parallel edges between $v$ and its parent mean neither is a bridge.

## Implementation

Iterative, so it works for deep graphs:

```python
def find_bridges(n, edges):
    """edges: list of (u, v). Return the list of indices of bridge edges."""
    adj = [[] for _ in range(n)]
    for idx, (u, v) in enumerate(edges):
        adj[u].append((v, idx))
        adj[v].append((u, idx))

    tin = [-1] * n
    low = [0] * n
    bridges = []
    timer = 0
    for root in range(n):
        if tin[root] != -1:
            continue
        tin[root] = low[root] = timer; timer += 1
        # stack items: (vertex, id of the edge used to enter it, next neighbour position)
        stack = [(root, -1, 0)]
        while stack:
            v, parent_edge, i = stack.pop()
            if i < len(adj[v]):
                stack.append((v, parent_edge, i + 1))
                u, idx = adj[v][i]
                if idx == parent_edge:
                    continue
                if tin[u] == -1:                       # tree edge: go down
                    tin[u] = low[u] = timer; timer += 1
                    stack.append((u, idx, 0))
                else:                                  # back edge
                    low[v] = min(low[v], tin[u])
            elif stack:                                # v finished: update its parent
                p = stack[-1][0]
                low[p] = min(low[p], low[v])
                if low[v] > tin[p]:
                    bridges.append(parent_edge)
    return sorted(bridges)

edges = [(0, 1), (1, 2), (2, 0), (2, 3), (3, 4), (4, 5), (5, 3), (5, 6)]
assert find_bridges(7, edges) == [3, 7]                 # edges (2,3) and (5,6)
assert find_bridges(3, [(0, 1), (0, 1), (1, 2)]) == [2]   # the parallel pair is not a bridge
assert find_bridges(2, []) == []
```

Time $O(n + m)$.

## Checking against the definition

Remove each edge, count the components, and compare with the count of the original graph:

```python
import random

def component_count(n, edges, skip=None):
    parent = list(range(n))

    def find(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x

    for i, (u, v) in enumerate(edges):
        if i != skip:
            parent[find(u)] = find(v)
    return len({find(x) for x in range(n)})

def bridges_brute(n, edges):
    base = component_count(n, edges)
    return [i for i in range(len(edges)) if component_count(n, edges, skip=i) > base]

random.seed(11)
for _ in range(400):
    n = random.randint(1, 9)
    es = [(random.randrange(n), random.randrange(n)) for _ in range(random.randint(0, 12))]
    es = [(u, v) for u, v in es if u != v]                    # no self-loops
    assert find_bridges(n, es) == bridges_brute(n, es)
```

## Applications

- **Robust networks**: which links are critical?
- **2-edge-connected components**: remove all bridges; the remaining components are the 2-edge-connected components. Contracting them turns the graph into a tree (the *bridge tree*), on which many queries become easy.

```python
def two_edge_connected_components(n, edges):
    bridge_set = set(find_bridges(n, edges))
    kept = [e for i, e in enumerate(edges) if i not in bridge_set]
    adj = [[] for _ in range(n)]
    for u, v in kept:
        adj[u].append(v)
        adj[v].append(u)
    comp = [-1] * n
    count = 0
    for s in range(n):
        if comp[s] == -1:
            comp[s] = count
            stack = [s]
            while stack:
                x = stack.pop()
                for y in adj[x]:
                    if comp[y] == -1:
                        comp[y] = count
                        stack.append(y)
            count += 1
    return comp, count

comp, count = two_edge_connected_components(7, edges)
assert count == 3 and comp[0] == comp[1] == comp[2] and comp[3] == comp[4] == comp[5] != comp[6]
```

See also [articulation points](/theory/graphs/articulation-points), the vertex version of the same idea.

## Practice problems

- [UVA #796 "Critical Links"](http://uva.onlinejudge.org/index.php?option=com_onlinejudge&Itemid=8&page=show_problem&problem=737) [difficulty: low]
- [UVA #610 "Street Directions"](http://uva.onlinejudge.org/index.php?option=onlinejudge&page=show_problem&problem=551) [difficulty: medium]
- [Case of the Computer Network (Codeforces Round #310 Div. 1 E)](http://codeforces.com/problemset/problem/555/E) [difficulty: hard]
- [UVA 12363 - Hedge Mazes](https://uva.onlinejudge.org/index.php?option=onlinejudge&page=show_problem&problem=3785)
- [UVA 315 - Network](https://uva.onlinejudge.org/index.php?option=com_onlinejudge&Itemid=8&page=show_problem&problem=251)
- [GYM - Computer Network (J)](http://codeforces.com/gym/100114)
- [SPOJ - King Graffs Defense](http://www.spoj.com/problems/GRAFFDEF/)
- [SPOJ - Critical Edges](http://www.spoj.com/problems/EC_P/)
- [Codeforces - Break Up](http://codeforces.com/contest/700/problem/C)
- [Codeforces - Tourist Reform](http://codeforces.com/contest/732/problem/F)
- [Codeforces - Non-academic problem](https://codeforces.com/contest/1986/problem/F)
