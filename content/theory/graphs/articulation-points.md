---
title: "Finding Articulation Points"
section: Connectivity
order: 3
difficulty: advanced
summary: "Find the vertices whose removal disconnects the graph, in O(n + m), using the same low-link values as for bridges."
tags: [articulation points, cut vertices, dfs, low-link]
prerequisites: [graphs/bridges]
source:
  title: Finding articulation points in a graph in O(N+M)
  url: https://cp-algorithms.com/graph/cutpoints.html
  license: CC BY-SA 4.0
---

An **articulation point** (or *cut vertex*) is a vertex whose removal, together with its edges, increases the number of connected components. The problem is the vertex twin of [finding bridges](/theory/graphs/bridges), and the algorithm is almost the same.

## Algorithm

Run a DFS computing $\text{tin}[v]$ and $\text{low}[v]$ (as for bridges). For a non-root vertex $v$:

> $v$ is an articulation point if it has a DFS child $c$ with $\text{low}[c] \ge \text{tin}[v]$.

The subtree of $c$ can reach nothing above $v$ without passing through $v$ itself, so removing $v$ cuts that subtree off. (For bridges the condition was strict, $>$, because the *edge* is removed, not the vertex.)

The **root** of the DFS tree is a special case: it is an articulation point if and only if it has **at least two** children in the DFS tree.

```python
def articulation_points(n, edges):
    adj = [[] for _ in range(n)]
    for idx, (u, v) in enumerate(edges):
        adj[u].append((v, idx))
        adj[v].append((u, idx))

    tin = [-1] * n
    low = [0] * n
    is_cut = [False] * n
    timer = 0
    for root in range(n):
        if tin[root] != -1:
            continue
        tin[root] = low[root] = timer; timer += 1
        root_children = 0
        stack = [(root, -1, 0)]
        while stack:
            v, parent_edge, i = stack.pop()
            if i < len(adj[v]):
                stack.append((v, parent_edge, i + 1))
                u, idx = adj[v][i]
                if idx == parent_edge:
                    continue
                if tin[u] == -1:
                    tin[u] = low[u] = timer; timer += 1
                    stack.append((u, idx, 0))
                    if v == root:
                        root_children += 1
                else:
                    low[v] = min(low[v], tin[u])
            elif stack:
                p = stack[-1][0]
                low[p] = min(low[p], low[v])
                if p != root and low[v] >= tin[p]:
                    is_cut[p] = True
        if root_children >= 2:
            is_cut[root] = True
    return [v for v in range(n) if is_cut[v]]

# triangle 0-1-2 with a tail 2-3-4: vertices 2 and 3 are articulation points
edges = [(0, 1), (1, 2), (2, 0), (2, 3), (3, 4)]
assert articulation_points(5, edges) == [2, 3]
assert articulation_points(3, [(0, 1), (1, 2)]) == [1]
assert articulation_points(3, [(0, 1), (1, 2), (2, 0)]) == []
assert articulation_points(1, []) == []
```

Time $O(n + m)$.

## Checking against the definition

Remove each vertex and see whether the number of components among the *other* vertices grows:

```python
import random

def components_without(n, edges, removed=None):
    parent = list(range(n))

    def find(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x

    for u, v in edges:
        if u != removed and v != removed:
            parent[find(u)] = find(v)
    return len({find(x) for x in range(n) if x != removed})

def cuts_brute(n, edges):
    base = components_without(n, edges)
    return [v for v in range(n) if components_without(n, edges, v) > base]

random.seed(4)
for _ in range(500):
    n = random.randint(1, 9)
    es = [(random.randrange(n), random.randrange(n)) for _ in range(random.randint(0, 12))]
    es = [(u, v) for u, v in es if u != v]
    assert articulation_points(n, es) == cuts_brute(n, es)
```

## Where it is used

- Finding the single points of failure in a network.
- Decomposing a graph into **biconnected components** (blocks): maximal subgraphs with no articulation point. The blocks and articulation points form a tree, the *block-cut tree*.

## Practice problems

- [UVA #10199 "Tourist Guide"](http://uva.onlinejudge.org/index.php?option=com_onlinejudge&Itemid=8&category=13&page=show_problem&problem=1140) [difficulty: low]
- [UVA #315 "Network"](http://uva.onlinejudge.org/index.php?option=com_onlinejudge&Itemid=8&category=5&page=show_problem&problem=251) [difficulty: low]
- [SPOJ - Submerging Islands](http://www.spoj.com/problems/SUBMERGE/)
- [Codeforces - Cutting Figure](https://codeforces.com/problemset/problem/193/A)
