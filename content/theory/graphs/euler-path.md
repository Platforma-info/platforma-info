---
title: "Eulerian Path and Circuit"
section: Ordering
order: 3
difficulty: advanced
summary: "Walk every edge exactly once — when it is possible and how to construct the walk with Hierholzer's algorithm in O(m)."
tags: [euler path, euler circuit, hierholzer, degrees]
prerequisites: [graphs/depth-first-search]
source:
  title: Finding the Eulerian path in O(M)
  url: https://cp-algorithms.com/graph/euler_path.html
  license: CC BY-SA 4.0
---

An **Eulerian path** is a path that uses **every edge of the graph exactly once**. An **Eulerian cycle** (or circuit) is an Eulerian path that starts and ends at the same vertex. The problem goes back to 1736: can you cross each of the seven bridges of Königsberg exactly once?

## When does it exist?

Let the graph have all its edges in one connected component (isolated vertices don't matter).

| Graph | Eulerian cycle | Eulerian path (not a cycle) |
|-------|----------------|-----------------------------|
| undirected | every vertex has **even** degree | exactly **two** vertices have odd degree (the path starts at one and ends at the other) |
| directed | in-degree = out-degree for every vertex | one vertex has out − in = 1 (start), one has in − out = 1 (end), all others balanced |

The degrees are necessary because each visit to a vertex uses one incoming and one outgoing edge; connectivity is necessary because the walk is one piece. These conditions are also sufficient.

## Hierholzer's algorithm

Do a DFS that walks along *unused* edges, and add a vertex to the answer when it has no unused edges left (post-order). Reversing the result gives the circuit. Intuitively, when we get stuck we have closed a loop; the vertices on the stack are then popped and any side loops are spliced in.

Iterative, with a pointer per vertex so every edge is examined once ($O(n + m)$):

```python
def euler_path_undirected(n, edges):
    """Return the vertex sequence of an Eulerian path/cycle, or None if none exists."""
    if not edges:
        return []
    adj = [[] for _ in range(n)]
    for idx, (u, v) in enumerate(edges):
        adj[u].append((v, idx))
        adj[v].append((u, idx))
    odd = [v for v in range(n) if len(adj[v]) % 2]
    if len(odd) not in (0, 2):
        return None
    start = odd[0] if odd else next(v for v in range(n) if adj[v])

    used = [False] * len(edges)
    ptr = [0] * n
    stack = [start]
    path = []
    while stack:
        v = stack[-1]
        while ptr[v] < len(adj[v]) and used[adj[v][ptr[v]][1]]:
            ptr[v] += 1                                # skip edges already walked
        if ptr[v] == len(adj[v]):
            path.append(stack.pop())                   # stuck: this vertex is final
        else:
            u, idx = adj[v][ptr[v]]
            used[idx] = True
            stack.append(u)
    if len(path) != len(edges) + 1:
        return None                                    # the edges are not all connected
    return path[::-1]

# a "house": square 0-1-2-3 with a roof 4 on top of 2 and 3
house = [(0, 1), (1, 2), (2, 3), (3, 0), (2, 4), (3, 4)]
p = euler_path_undirected(5, house)
assert p[0] in (2, 3) and p[-1] in (2, 3) and len(p) == 7 and p[0] != p[-1]
# every edge used exactly once
assert sorted(tuple(sorted(e)) for e in zip(p, p[1:])) == sorted(tuple(sorted(e)) for e in house)

triangle = [(0, 1), (1, 2), (2, 0)]
c = euler_path_undirected(3, triangle)
assert c[0] == c[-1] and len(c) == 4
assert euler_path_undirected(4, [(0, 1), (0, 2), (0, 3)]) is None          # four odd vertices
assert euler_path_undirected(4, [(0, 1), (2, 3)]) is None                  # two separate pieces
```

The connectivity test is the last check: if we did not manage to walk all $m$ edges, the graph was disconnected.

## Directed graphs

Same idea with directed edges and out-degree pointers. Start at the vertex with out − in = 1, or anywhere if all are balanced.

```python
def euler_path_directed(n, edges):
    if not edges:
        return []
    adj = [[] for _ in range(n)]
    balance = [0] * n
    for u, v in edges:
        adj[u].append(v)
        balance[u] += 1
        balance[v] -= 1
    starts = [v for v in range(n) if balance[v] == 1]
    ends = [v for v in range(n) if balance[v] == -1]
    if any(abs(b) > 1 for b in balance) or len(starts) != len(ends) or len(starts) > 1:
        return None
    start = starts[0] if starts else next(v for v in range(n) if adj[v])

    ptr = [0] * n
    stack = [start]
    path = []
    while stack:
        v = stack[-1]
        if ptr[v] < len(adj[v]):
            u = adj[v][ptr[v]]
            ptr[v] += 1
            stack.append(u)
        else:
            path.append(stack.pop())
    if len(path) != len(edges) + 1:
        return None
    return path[::-1]

de = [(0, 1), (1, 2), (2, 0), (0, 3), (3, 0)]
p = euler_path_directed(4, de)
assert p[0] == p[-1] and sorted(zip(p, p[1:])) == sorted(de)
assert euler_path_directed(3, [(0, 1), (1, 2)]) == [0, 1, 2]
assert euler_path_directed(3, [(0, 1), (0, 2)]) is None
```

## Testing

Compare existence with the degree conditions on random graphs, and check that reported walks use each edge exactly once:

```python
import random
from collections import Counter

def connected_edges(n, edges):
    parent = list(range(n))

    def find(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x

    for u, v in edges:
        parent[find(u)] = find(v)
    return len({find(u) for u, v in edges}) <= 1

random.seed(18)
found = 0
for _ in range(1000):
    n = random.randint(1, 6)
    es = [(random.randrange(n), random.randrange(n)) for _ in range(random.randint(0, 9))]
    es = [(u, v) for u, v in es if u != v]
    deg = Counter()
    for u, v in es:
        deg[u] += 1
        deg[v] += 1
    exists = connected_edges(n, es) and sum(d % 2 for d in deg.values()) in (0, 2)
    p = euler_path_undirected(n, es)
    assert (p is not None) == exists
    if p and es:
        found += 1
        assert Counter(tuple(sorted(e)) for e in zip(p, p[1:])) == Counter(tuple(sorted(e)) for e in es)
assert found > 50
```

## Application: reconstructing a sequence

**De Bruijn sequence**: a cyclic binary string of length $2^k$ containing every binary string of length $k$ exactly once as a substring. Build the graph whose vertices are all $(k-1)$-bit strings and whose edges are the $k$-bit strings; each vertex has in-degree = out-degree = 2, so an Eulerian circuit exists, and reading off the edge labels gives the sequence.

```python
def de_bruijn(k):
    n = 1 << (k - 1)
    edges = []
    for x in range(n):
        for bit in (0, 1):
            edges.append((x, ((x << 1) | bit) & (n - 1)))
    circuit = euler_path_directed(n, edges)
    return "".join(str(v & 1) for v in circuit[1:])            # the appended bit of each step

seq = de_bruijn(3)
assert len(seq) == 8
cyclic = seq + seq[:2]
assert len({cyclic[i : i + 3] for i in range(8)}) == 8
```

## Practice problems

- [CSES : Mail Delivery](https://cses.fi/problemset/task/1691)
- [CSES : Teleporters Path](https://cses.fi/problemset/task/1693)
- [Codeforces - Melody](https://codeforces.com/contest/2110/problem/E)
- [Codeforces - Tanya and Password](https://codeforces.com/contest/508/problem/D)
