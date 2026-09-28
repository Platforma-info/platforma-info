---
title: "Second Best Minimum Spanning Tree"
section: Spanning trees
order: 4
difficulty: advanced
summary: "The second best spanning tree differs from the MST by one edge swap; find the cheapest swap by trying every non-tree edge and taking the maximum edge on its tree path with binary lifting."
tags: [minimum spanning tree, second best mst, binary lifting, lca, kruskal]
prerequisites: [graphs/kruskal-mst, graphs/lca-binary-lifting]
source:
  title: "Second Best Minimum Spanning Tree"
  url: https://cp-algorithms.com/graph/second_best_mst.html
  license: CC BY-SA 4.0
---

A **minimum spanning tree** $T$ of a graph spans all vertices with minimum total weight. A **second best MST** is a spanning tree with the second smallest total weight.

## Observation

The second best MST differs from $T$ by **exactly one edge replacement**: there is an edge $e_{new} \notin T$ and an edge $e_{old} \in T$ such that

$$
T' = (T \cup \{e_{new}\}) \setminus \{e_{old}\}
$$

is the second best tree. (A proof is the classic exercise 23-1 of CLRS.) So we look for the swap with the smallest increase $w(e_{new}) - w(e_{old})$.

## Approach 1: recompute the MST without each tree edge

Build the MST with Kruskal. For every edge of the MST (there are $V-1$), forbid it and run Kruskal again on the edges that are left (already sorted, no need to sort again), then take the best of these trees. Time $O(VE)$.

## Approach 2: try to add each non-tree edge

Do the opposite: for each edge $e$ not in $T$, adding it to $T$ creates a cycle through the LCA of its endpoints. To keep a spanning tree we must delete another edge of that cycle; the best choice is the **heaviest edge $k$ of the cycle, other than $e$ itself**. The weight increase is $w(e) - w(k)$; the answer is the smallest increase over all non-tree edges.

To find the heaviest edge on the tree path between $u$ and $v$ quickly, root the MST and use [binary lifting](/theory/graphs/lca-binary-lifting) storing, for every jump $2^i$, the maximum edge weight on it. This gives $O(E\log V)$ in total.

### Ties

If the non-tree edge $e$ has the same weight as the heaviest edge on its path, swapping them yields another tree with the **same** total weight (which is again an MST). To find a tree that is strictly heavier than the MST, use the **second distinct maximum** on the path in that case. So each jump stores the two largest *distinct* weights.

## Implementation

```python
INF = float("inf")

def top_two(values):
    """The largest and second largest distinct values of an iterable (-1 for missing values)."""
    first = second = -1
    for x in values:
        if x > first:
            first, second = x, first
        elif first > x > second:
            second = x
    return first, second

def second_best_mst(n, edges, strict=True):
    """Weight of the second best spanning tree of a connected graph, or INF if there is none.

    strict=True: the smallest weight strictly greater than the MST weight.
    strict=False: the best tree different from the MST that Kruskal builds (may have the same weight).
    edges: list of (u, v, w) with w >= 0.
    """
    parent = list(range(n))

    def find(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x

    order = sorted(range(len(edges)), key=lambda i: edges[i][2])
    in_tree = [False] * len(edges)
    total = 0
    adj = [[] for _ in range(n)]
    for i in order:
        u, v, w = edges[i]
        ru, rv = find(u), find(v)
        if ru != rv:
            parent[ru] = rv
            in_tree[i] = True
            total += w
            adj[u].append((v, w))
            adj[v].append((u, w))

    LOG = max(1, n.bit_length())
    up = [[0] * n for _ in range(LOG)]
    best = [[(-1, -1)] * n for _ in range(LOG)]          # (largest, second largest) weight on the 2^i jump
    depth = [0] * n
    seen = [False] * n
    stack = [0]
    seen[0] = True
    while stack:                                          # root the MST at 0
        u = stack.pop()
        for v, w in adj[u]:
            if not seen[v]:
                seen[v] = True
                depth[v] = depth[u] + 1
                up[0][v] = u
                best[0][v] = (w, -1)
                stack.append(v)
    for i in range(1, LOG):
        for v in range(n):
            mid = up[i - 1][v]
            up[i][v] = up[i - 1][mid]
            a, b = best[i - 1][v], best[i - 1][mid]
            best[i][v] = top_two([a[0], a[1], b[0], b[1]])

    def max_on_path(u, v):
        result = (-1, -1)
        if depth[u] < depth[v]:
            u, v = v, u
        diff = depth[u] - depth[v]
        for i in range(LOG):
            if diff >> i & 1:
                result = top_two([result[0], result[1], best[i][u][0], best[i][u][1]])
                u = up[i][u]
        if u == v:
            return result
        for i in reversed(range(LOG)):
            if up[i][u] != up[i][v]:
                result = top_two([result[0], result[1], best[i][u][0], best[i][u][1],
                                  best[i][v][0], best[i][v][1]])
                u, v = up[i][u], up[i][v]
        return top_two([result[0], result[1], best[0][u][0], best[0][v][0]])

    answer = INF
    for i, (u, v, w) in enumerate(edges):
        if in_tree[i] or u == v:
            continue
        first, second = max_on_path(u, v)
        if first != w:
            answer = min(answer, total + w - first)       # the path maximum is smaller than w
        elif not strict:
            answer = min(answer, total)                   # an equally heavy swap
        elif second != -1:
            answer = min(answer, total + w - second)
    return answer

# a triangle with weights 1, 2, 3: the MST has weight 3; swapping 2 for 3 gives 4
assert second_best_mst(3, [(0, 1, 1), (1, 2, 2), (0, 2, 3)]) == 4
# a path graph has only one spanning tree
assert second_best_mst(3, [(0, 1, 1), (1, 2, 2)]) == INF
# all weights equal: every spanning tree weighs the same
assert second_best_mst(3, [(0, 1, 1), (1, 2, 1), (0, 2, 1)]) == INF
assert second_best_mst(3, [(0, 1, 1), (1, 2, 1), (0, 2, 1)], strict=False) == 2
```

## Testing against all spanning trees

For small graphs we enumerate every spanning tree. The strict answer is the smallest weight larger than the minimum. The non-strict answer is the best weight among all trees other than the specific MST that Kruskal's algorithm builds.

```python
import random
from itertools import combinations

def all_spanning_trees(n, edges):
    for subset in combinations(range(len(edges)), n - 1):
        parent = list(range(n))

        def find(x):
            while parent[x] != x:
                parent[x] = parent[parent[x]]
                x = parent[x]
            return x

        ok = True
        for i in subset:
            a, b = find(edges[i][0]), find(edges[i][1])
            if a == b:
                ok = False
                break
            parent[a] = b
        if ok:
            yield subset

def kruskal_tree(n, edges):
    parent = list(range(n))

    def find(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x

    chosen = set()
    for i in sorted(range(len(edges)), key=lambda i: edges[i][2]):
        a, b = find(edges[i][0]), find(edges[i][1])
        if a != b:
            parent[a] = b
            chosen.add(i)
    return chosen

def is_connected(n, edges):
    parent = list(range(n))

    def find(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x

    for u, v, _ in edges:
        parent[find(u)] = find(v)
    return len({find(x) for x in range(n)}) == 1

rnd = random.Random(6)
tested = 0
while tested < 400:
    n = rnd.randint(2, 6)
    edges = [(rnd.randrange(n), rnd.randrange(n), rnd.randint(1, 5)) for _ in range(rnd.randint(n - 1, 10))]
    edges = [e for e in edges if e[0] != e[1]]
    if not is_connected(n, edges):
        continue
    tested += 1
    trees = list(all_spanning_trees(n, edges))
    weights = sorted(sum(edges[i][2] for i in t) for t in trees)
    strict_expected = next((w for w in weights if w > weights[0]), INF)
    assert second_best_mst(n, edges) == strict_expected, (n, edges)
    mst = kruskal_tree(n, edges)
    others = [sum(edges[i][2] for i in t) for t in trees if set(t) != mst]
    assert second_best_mst(n, edges, strict=False) == (min(others) if others else INF), (n, edges)
```

## Complexity

Sorting the edges: $O(E\log E)$. The binary-lifting tables: $O(V\log V)$. Each non-tree edge is handled in $O(\log V)$. In total $O(E\log V)$.

## Practice problems

- [Codeforces - Minimum spanning tree for each edge](https://codeforces.com/problemset/problem/609/E)
