---
title: Finding a Cycle in a Graph
section: Ordering
order: 2
difficulty: intermediate
summary: Detect a cycle and recover its vertices in O(n + m), in directed graphs with DFS colours and in undirected graphs by tracking the parent edge.
tags: [cycle detection, dfs, directed, undirected]
prerequisites: [graphs/depth-first-search]
source:
  title: Checking a graph for acyclicity and finding a cycle in O(M)
  url: https://cp-algorithms.com/graph/finding-cycle.html
  license: CC BY-SA 4.0
---

Given a graph, decide whether it contains a **cycle**, and if so, output one. A graph without cycles is *acyclic*: an undirected acyclic graph is a forest, a directed one is a DAG (see [topological sorting](/theory/graphs/topological-sort)).

## Directed graphs: DFS with three colours

Run [DFS](/theory/graphs/depth-first-search) and give each vertex a state:

- **white** (0): not visited yet;
- **grey** (1): visited and *still on the stack*, i.e. its DFS is in progress;
- **black** (2): completely processed.

If DFS, standing at $v$, finds an edge to a **grey** vertex $u$, then $u$ is an ancestor of $v$ on the current stack, and the stack from $u$ to $v$ plus the edge $v \to u$ is a cycle. Edges to black vertices are harmless.

To print the cycle, keep a `parent` array; when we detect the back edge $v \to u$, walk from $v$ up to $u$.

```python
def find_cycle_directed(adj):
    """Return a list of vertices v0 -> v1 -> ... -> v0 forming a cycle, or None."""
    n = len(adj)
    color = [0] * n
    parent = [-1] * n
    for s in range(n):
        if color[s]:
            continue
        color[s] = 1
        stack = [(s, 0)]
        while stack:
            v, i = stack.pop()
            if i < len(adj[v]):
                stack.append((v, i + 1))
                u = adj[v][i]
                if color[u] == 0:
                    color[u] = 1
                    parent[u] = v
                    stack.append((u, 0))
                elif color[u] == 1:                # back edge v -> u
                    cycle = [v]
                    while cycle[-1] != u:
                        cycle.append(parent[cycle[-1]])
                    return cycle[::-1]
            else:
                color[v] = 2
    return None

g = [[1], [2], [3], [1, 4], []]                 # cycle 1 -> 2 -> 3 -> 1
cyc = find_cycle_directed(g)
assert sorted(cyc) == [1, 2, 3]
assert find_cycle_directed([[1], [2], []]) is None
assert find_cycle_directed([[0]]) == [0]        # a self-loop is a cycle of length 1
```

Time $O(n + m)$.

## Undirected graphs: look at the parent edge

In an undirected graph every edge is seen from both ends, so the edge to the DFS parent must not count as a back edge. Skip it **by edge id** (not by vertex; otherwise two parallel edges between the same vertices, which form a 2-cycle, would be missed).

An edge to any other already-visited vertex closes a cycle.

```python
def find_cycle_undirected(n, edges):
    """edges: list of (u, v). Return a cycle as a list of vertices, or None."""
    adj = [[] for _ in range(n)]
    for idx, (u, v) in enumerate(edges):
        adj[u].append((v, idx))
        adj[v].append((u, idx))
    visited = [False] * n
    parent = [-1] * n
    for s in range(n):
        if visited[s]:
            continue
        visited[s] = True
        stack = [(s, -1, 0)]                          # (vertex, edge used to enter, next neighbour)
        while stack:
            v, pe, i = stack.pop()
            if i < len(adj[v]):
                stack.append((v, pe, i + 1))
                u, idx = adj[v][i]
                if idx == pe:
                    continue
                if not visited[u]:
                    visited[u] = True
                    parent[u] = v
                    stack.append((u, idx, 0))
                else:                                 # u was seen before: closes a cycle (u is an ancestor)
                    cycle = [v]
                    while cycle[-1] != u:
                        cycle.append(parent[cycle[-1]])
                    return cycle[::-1]
    return None

assert sorted(find_cycle_undirected(4, [(0, 1), (1, 2), (2, 0), (2, 3)])) == [0, 1, 2]
assert find_cycle_undirected(4, [(0, 1), (1, 2), (2, 3)]) is None
assert sorted(find_cycle_undirected(2, [(0, 1), (0, 1)])) == [0, 1]       # parallel edges
```

> [!NOTE]
> A forest with $c$ components has exactly $n - c$ edges, so an undirected graph with **more than $n - c$ edges must contain a cycle**. That gives a quick check after counting components with a [DSU](/theory/data-structures/disjoint-set-union): the edge that joins two vertices already connected is the one that closes a cycle.

## Testing

```python
import random

def acyclic_directed_brute(adj):
    n = len(adj)
    indeg = [0] * n
    for v in range(n):
        for u in adj[v]:
            indeg[u] += 1
    stack = [v for v in range(n) if indeg[v] == 0]
    removed = 0
    while stack:
        v = stack.pop()
        removed += 1
        for u in adj[v]:
            indeg[u] -= 1
            if indeg[u] == 0:
                stack.append(u)
    return removed == n

random.seed(15)
for _ in range(500):
    n = random.randint(1, 8)
    g = [[] for _ in range(n)]
    for _ in range(random.randint(0, 10)):
        g[random.randrange(n)].append(random.randrange(n))
    cyc = find_cycle_directed(g)
    assert (cyc is None) == acyclic_directed_brute(g)
    if cyc:
        assert all(cyc[(i + 1) % len(cyc)] in g[cyc[i]] for i in range(len(cyc)))

for _ in range(500):
    n = random.randint(1, 8)
    es = [(random.randrange(n), random.randrange(n)) for _ in range(random.randint(0, 9))]
    es = [(u, v) for u, v in es if u != v]
    parent = list(range(n))

    def find(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x

    has_cycle = False
    for u, v in es:
        ru, rv = find(u), find(v)
        if ru == rv:
            has_cycle = True
        parent[ru] = rv
    assert (find_cycle_undirected(n, es) is not None) == has_cycle
```

## Negative cycles

A cycle whose total *weight* is negative is a different problem, solved with [Bellman-Ford](/theory/graphs/bellman-ford).

## Practice problems

- [AtCoder : Reachability in Functional Graph](https://atcoder.jp/contests/abc357/tasks/abc357_e)
- [CSES : Round Trip](https://cses.fi/problemset/task/1669)
- [CSES : Round Trip II](https://cses.fi/problemset/task/1678/)
