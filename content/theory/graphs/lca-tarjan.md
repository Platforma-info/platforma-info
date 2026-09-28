---
title: "LCA: Tarjan's Offline Algorithm"
section: Trees and LCA
order: 5
difficulty: advanced
summary: "Answer all LCA queries in one DFS with a disjoint set union, in O(n + m) total time, when the queries are known in advance."
tags: [lca, tarjan, offline queries, dsu, dfs]
prerequisites: [graphs/lca, data-structures/disjoint-set-union]
source:
  title: "Lowest Common Ancestor - Tarjan's off-line algorithm"
  url: https://cp-algorithms.com/graph/lca_tarjan.html
  license: CC BY-SA 4.0
---

We have a tree with $n$ vertices and $m$ queries $(u, v)$; for each we want the lowest common ancestor. We solve the problem **offline**: all queries are known in advance, so we may answer them in any order. Tarjan's algorithm (1979) answers all $m$ queries in $O(n + m)$ total, with one DFS and a [disjoint set union](/theory/data-structures/disjoint-set-union).

## Algorithm

A query $(u, v)$ is answered while the DFS is at vertex $v$, when $u$ has **already been visited** (or the other way around: whichever of the two is visited second).

Suppose the DFS is at $v$, has already processed its children's subtrees, and $u$ was visited earlier. The LCA of $u$ and $v$ is $v$ or one of its ancestors. In fact it is the lowest ancestor of $v$ (including $v$) whose subtree contains $u$.

At this moment the visited vertices split into disjoint sets: every ancestor $p$ of $v$ (including $v$) has a set consisting of $p$ itself and all fully processed subtrees of the children of $p$ that are not on the path to $v$. The set containing $u$ tells the answer: **the LCA is the ancestor $p$ whose set contains $u$.**

To maintain these sets we use a DSU. Each set stores its "real" representative $p$ (the vertex on the path from $v$ to the root) in an array `ancestor`, because the DSU's own representative may be a different vertex.

The DFS at vertex $v$:

1. Put $v$ in a new set: `ancestor[v] = v`.
2. For each child $c$: run DFS on $c$, then union the set of $c$ into the set of $v$ and set `ancestor[find(v)] = v`.
3. Then for each query $(v, u)$ with $u$ already visited, the answer is `ancestor[find(u)]`.

Each query is answered exactly once, at the second of its two endpoints. The total cost is $O(n)$ for the DFS and unions and $O(m)$ for the `find` calls (times the inverse Ackermann function).

## Implementation

An iterative DFS with an explicit stack; the DSU has path compression and union by size. A query is answered when the DFS **leaves** a vertex, and only if the other endpoint has been visited already. (If the other endpoint is an open ancestor, or the vertex itself, the answer is that vertex, as the set-representative rule gives; a query with both endpoints in different finished parts is answered once when the second one finishes, and a query between an ancestor and a descendant may be answered a second time with the same result, so we simply keep the first answer.)

```python
def tarjan_lca(adj, queries, root=0):
    """adj: adjacency lists of a tree. queries: list of (u, v). Returns the LCA of every query."""
    n = len(adj)
    parent = list(range(n))                               # the DSU
    size = [1] * n
    ancestor = list(range(n))                             # the real representative of each set
    visited = [False] * n
    query_at = [[] for _ in range(n)]
    for idx, (u, v) in enumerate(queries):
        query_at[u].append((v, idx))
        query_at[v].append((u, idx))
    answers = [None] * len(queries)

    def find(x):
        top = x
        while parent[top] != top:
            top = parent[top]
        while parent[x] != top:
            parent[x], x = top, parent[x]
        return top

    def union(a, b):
        a, b = find(a), find(b)
        if a != b:
            if size[a] < size[b]:
                a, b = b, a
            parent[b] = a
            size[a] += size[b]

    visited[root] = True
    stack = [(root, -1, 0)]                               # (vertex, its parent in the tree, next neighbour to try)
    while stack:
        v, p, i = stack.pop()
        if i < len(adj[v]):
            stack.append((v, p, i + 1))
            u = adj[v][i]
            if u != p:
                visited[u] = True
                stack.append((u, v, 0))
        else:                                             # v is finished: all its children are merged into its set
            for other, idx in query_at[v]:
                if visited[other] and answers[idx] is None:
                    answers[idx] = ancestor[find(other)]
            if p != -1:
                union(p, v)
                ancestor[find(p)] = p
    return answers

# the tree 0-1, 0-2, 0-3, 1-4, 1-5, 3-6
adj = [[1, 2, 3], [0, 4, 5], [0], [0, 6], [1], [1], [3]]
assert tarjan_lca(adj, [(5, 3), (4, 5), (4, 1), (6, 6), (2, 6)]) == [0, 1, 1, 6, 0]
```

## Testing

Against the definition (climbing parents), on random trees and many random queries, including queries with equal endpoints and ancestor-descendant pairs:

```python
import random

rnd = random.Random(2)
for _ in range(200):
    n = rnd.randint(1, 40)
    adj = [[] for _ in range(n)]
    par = [-1] * n
    for v in range(1, n):
        par[v] = rnd.randrange(v) if rnd.random() < 0.6 else v - 1
        adj[par[v]].append(v)
        adj[v].append(par[v])
    depth = [0] * n
    for v in range(1, n):
        depth[v] = depth[par[v]] + 1
    queries = [(rnd.randrange(n), rnd.randrange(n)) for _ in range(rnd.randint(0, 30))]
    result = tarjan_lca(adj, queries)
    for (u, v), got in zip(queries, result):
        a, b = u, v
        while depth[a] > depth[b]:
            a = par[a]
        while depth[b] > depth[a]:
            b = par[b]
        while a != b:
            a, b = par[a], par[b]
        assert got == a
```

## Online or offline?

Tarjan's algorithm needs all queries in advance but uses only $O(n)$ memory and no tables. For online queries use [binary lifting](/theory/graphs/lca-binary-lifting) or the [Euler tour with a sparse table](/theory/graphs/lca). The idea of "answer the query at the moment both endpoints have been seen, using DSU sets that mirror the DFS stack" is a general offline technique and reappears in many tree problems.
