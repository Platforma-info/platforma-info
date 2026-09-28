---
title: Topological Sorting
section: Ordering
order: 1
difficulty: intermediate
summary: Order the vertices of a DAG so that every edge goes forward, with Kahn's algorithm or DFS, and use it for dependency and DP problems.
tags: [topological sort, dag, kahn, dependencies]
prerequisites: [graphs/depth-first-search]
source:
  title: Topological Sorting
  url: https://cp-algorithms.com/graph/topological-sort.html
  license: CC BY-SA 4.0
---

You have $n$ tasks and $m$ constraints of the form "task $a$ must be done before task $b$". A **topological order** lists all tasks so that every constraint is respected: for each edge $a \to b$, vertex $a$ comes before $b$. Such an order exists exactly when the directed graph has **no cycle** (it is a *DAG*).

Uses: build systems and package managers, course prerequisites, spreadsheets' cell dependencies, and dynamic programming over DAGs.

## Kahn's algorithm (BFS with in-degrees)

1. Compute the **in-degree** (number of incoming edges) of every vertex.
2. Put all vertices with in-degree 0 in a queue: nothing has to happen before them.
3. Repeatedly take a vertex out, append it to the order, and "delete" it: decrease the in-degree of each successor; those reaching 0 join the queue.

If we end with fewer than $n$ vertices, the leftover ones lie on or behind a cycle: **there is a cycle**.

```python
from collections import deque

def topological_order(adj):
    """Return a topological order, or None if the graph has a cycle."""
    n = len(adj)
    indeg = [0] * n
    for v in range(n):
        for u in adj[v]:
            indeg[u] += 1
    queue = deque(v for v in range(n) if indeg[v] == 0)
    order = []
    while queue:
        v = queue.popleft()
        order.append(v)
        for u in adj[v]:
            indeg[u] -= 1
            if indeg[u] == 0:
                queue.append(u)
    return order if len(order) == n else None

adj = [[1, 2], [3], [3], [4], []]
order = topological_order(adj)
assert order == [0, 1, 2, 3, 4]
assert topological_order([[1], [2], [0]]) is None             # a cycle
assert topological_order([]) == []
```

Time $O(n + m)$.

### Lexicographically smallest order

If several orders are valid and the problem wants the lexicographically smallest, replace the queue by a min-heap:

```python
import heapq

def smallest_topological_order(adj):
    n = len(adj)
    indeg = [0] * n
    for v in range(n):
        for u in adj[v]:
            indeg[u] += 1
    heap = [v for v in range(n) if indeg[v] == 0]
    heapq.heapify(heap)
    order = []
    while heap:
        v = heapq.heappop(heap)
        order.append(v)
        for u in adj[v]:
            indeg[u] -= 1
            if indeg[u] == 0:
                heapq.heappush(heap, u)
    return order if len(order) == n else None

assert smallest_topological_order([[], [0], [0]]) == [1, 2, 0]
assert smallest_topological_order([[2], [2], []]) == [0, 1, 2]
```

## DFS-based algorithm

Run [DFS](/theory/graphs/depth-first-search) and append each vertex to a list when it **finishes** (post-order). Reversing that list gives a topological order: a vertex finishes only after every vertex reachable from it has finished.

```python
def topological_order_dfs(adj):
    n = len(adj)
    state = [0] * n                 # 0 = new, 1 = on the stack, 2 = finished
    order = []
    for s in range(n):
        if state[s]:
            continue
        state[s] = 1
        stack = [(s, 0)]
        while stack:
            v, i = stack.pop()
            if i < len(adj[v]):
                stack.append((v, i + 1))
                u = adj[v][i]
                if state[u] == 1:
                    return None      # back edge: a cycle
                if state[u] == 0:
                    state[u] = 1
                    stack.append((u, 0))
            else:
                state[v] = 2
                order.append(v)
    return order[::-1]

assert topological_order_dfs(adj) is not None
assert topological_order_dfs([[1], [2], [0]]) is None
```

## Checking the definition

```python
import random

def valid_order(adj, order):
    if order is None or sorted(order) != list(range(len(adj))):
        return False
    pos = {v: i for i, v in enumerate(order)}
    return all(pos[v] < pos[u] for v in range(len(adj)) for u in adj[v])

def has_cycle_brute(adj):
    n = len(adj)
    reach = [set() for _ in range(n)]
    for s in range(n):
        stack = list(adj[s])
        while stack:
            v = stack.pop()
            if v not in reach[s]:
                reach[s].add(v)
                stack.extend(adj[v])
    return any(v in reach[v] for v in range(n))

random.seed(6)
for _ in range(500):
    n = random.randint(1, 8)
    g = [[] for _ in range(n)]
    for _ in range(random.randint(0, 12)):
        g[random.randrange(n)].append(random.randrange(n))
    cyc = has_cycle_brute(g)
    for algo in (topological_order, topological_order_dfs, smallest_topological_order):
        result = algo(g)
        assert (result is None) == cyc
        if not cyc:
            assert valid_order(g, result)
```

## Applications

**Longest path in a DAG** (critical path): process vertices in topological order and relax edges. The same loop with `min` gives shortest paths on a DAG (works with negative weights, in $O(n + m)$).

```python
def longest_path_dag(adj, weights):
    """adj[v] = list of successors; weights[v] = time needed by task v. Return the earliest finish times."""
    order = topological_order(adj)
    finish = weights[:]
    for v in order:
        for u in adj[v]:
            finish[u] = max(finish[u], finish[v] + weights[u])
    return finish

# tasks: 0(3) -> 1(2) -> 3(4), 0 -> 2(6) -> 3
adj2 = [[1, 2], [3], [3], []]
assert longest_path_dag(adj2, [3, 2, 6, 4]) == [3, 5, 9, 13]
```

**Counting paths** in a DAG: the same order, adding counts. **Detecting impossible schedules**: the order does not exist.

**Dependency resolution.** "Install package X" means installing its dependencies first, i.e., the reverse of the dependency edges is a topological order of the install steps.

## Practice problems

- [SPOJ TOPOSORT - Topological Sorting [difficulty: easy]](http://www.spoj.com/problems/TOPOSORT/)
- [UVA 10305 - Ordering Tasks [difficulty: easy]](https://onlinejudge.org/index.php?option=com_onlinejudge&Itemid=8&page=show_problem&problem=1246)
- [UVA 124 - Following Orders [difficulty: easy]](https://onlinejudge.org/index.php?option=onlinejudge&page=show_problem&problem=60)
- [UVA 200 - Rare Order [difficulty: easy]](https://onlinejudge.org/index.php?option=onlinejudge&page=show_problem&problem=136)
- [Codeforces 510C - Fox and Names [difficulty: easy]](http://codeforces.com/problemset/problem/510/C)
- [SPOJ RPLA - Answer the boss!](https://www.spoj.com/problems/RPLA/)
- [CSES - Course Schedule](https://cses.fi/problemset/task/1679)
- [CSES - Longest Flight Route](https://cses.fi/problemset/task/1680)
- [CSES - Game Routes](https://cses.fi/problemset/task/1681)
