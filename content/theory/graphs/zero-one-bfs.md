---
title: "0-1 BFS"
section: Shortest paths
order: 3
difficulty: intermediate
summary: "Shortest paths in a graph whose edges weigh 0 or 1 in O(n + m) with a deque, and Dial's algorithm for small integer weights."
tags: [0-1 bfs, deque, shortest path, dial]
prerequisites: [graphs/breadth-first-search, graphs/dijkstra]
source:
  title: 0-1 BFS
  url: https://cp-algorithms.com/graph/01_bfs.html
  license: CC BY-SA 4.0
---

When every edge has weight **0 or 1**, [Dijkstra](/theory/graphs/dijkstra) is overkill: the heap can be replaced by a **deque**, and the time drops from $O((n + m)\log n)$ to $O(n + m)$.

Typical situations: "how many walls must I break to leave the maze?" (moving through a free cell costs 0, through a wall costs 1), "the minimum number of edges to reverse so that a path exists" (following an edge costs 0, traversing it backwards costs 1).

## Algorithm

It's [BFS](/theory/graphs/breadth-first-search) with a small change. Keep the deque sorted by distance. When we relax an edge:

- of weight **0**: the new distance equals the current one, so push the neighbour to the **front** (it belongs with the vertices of the current distance);
- of weight **1**: push it to the **back**.

The deque always holds vertices whose distances differ by at most 1, so it stays sorted. A vertex may be pushed more than once, but only when its distance strictly improves, which happens at most twice.

```python
from collections import deque

INF = float("inf")

def zero_one_bfs(adj, s):
    """adj[v] = list of (u, w) with w in {0, 1}."""
    n = len(adj)
    dist = [INF] * n
    dist[s] = 0
    dq = deque([s])
    while dq:
        v = dq.popleft()
        for u, w in adj[v]:
            if dist[v] + w < dist[u]:
                dist[u] = dist[v] + w
                if w == 0:
                    dq.appendleft(u)
                else:
                    dq.append(u)
    return dist

adj = [[(1, 1), (2, 0)], [(3, 0)], [(3, 1)], []]
assert zero_one_bfs(adj, 0) == [0, 1, 0, 1]
```

Check against Dijkstra:

```python
import heapq, random

def dijkstra(adj, s):
    dist = [INF] * len(adj)
    dist[s] = 0
    heap = [(0, s)]
    while heap:
        d, v = heapq.heappop(heap)
        if d > dist[v]:
            continue
        for u, w in adj[v]:
            if d + w < dist[u]:
                dist[u] = d + w
                heapq.heappush(heap, (d + w, u))
    return dist

random.seed(3)
for _ in range(300):
    n = random.randint(1, 12)
    g = [[] for _ in range(n)]
    for _ in range(random.randint(0, 30)):
        g[random.randrange(n)].append((random.randrange(n), random.randint(0, 1)))
    s = random.randrange(n)
    assert zero_one_bfs(g, s) == dijkstra(g, s)
```

## Example: reach the corner by breaking the fewest walls

```python
def min_walls(grid):
    rows, cols = len(grid), len(grid[0])
    dist = [[INF] * cols for _ in range(rows)]
    dist[0][0] = 0
    dq = deque([(0, 0)])
    while dq:
        r, c = dq.popleft()
        for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nr, nc = r + dr, c + dc
            if 0 <= nr < rows and 0 <= nc < cols:
                w = 1 if grid[nr][nc] == "#" else 0          # entering a wall costs 1
                if dist[r][c] + w < dist[nr][nc]:
                    dist[nr][nc] = dist[r][c] + w
                    (dq.append if w else dq.appendleft)((nr, nc))
    return dist[-1][-1]

assert min_walls(["..#", "##.", "..."]) == 1
assert min_walls(["...", "...", "..."]) == 0
assert min_walls([".#.", "###", ".#."]) == 2
```

## Dial's algorithm

The same idea generalizes to **small integer weights** $0..W$: keep $W + 1$ (or, cyclically, $W + 1$) buckets, where bucket $i$ holds the vertices whose tentative distance is $i$. Process buckets in increasing order. The total time is $O(m + nW)$ (or $O(m + D)$ where $D$ is the largest distance).

```python
def dial(adj, s, max_weight):
    n = len(adj)
    dist = [INF] * n
    dist[s] = 0
    max_dist = max_weight * (n - 1)
    buckets = [[] for _ in range(max_dist + 1)]
    buckets[0].append(s)
    for d in range(max_dist + 1):
        bucket = buckets[d]
        i = 0
        while i < len(bucket):                     # the bucket may grow while we scan it (0 weights)
            v = bucket[i]
            i += 1
            if dist[v] != d:
                continue                            # stale entry
            for u, w in adj[v]:
                if d + w < dist[u]:
                    dist[u] = d + w
                    buckets[d + w].append(u)
    return dist

random.seed(8)
for _ in range(200):
    n = random.randint(1, 10)
    g = [[] for _ in range(n)]
    for _ in range(random.randint(0, 25)):
        g[random.randrange(n)].append((random.randrange(n), random.randint(0, 4)))
    s = random.randrange(n)
    assert dial(g, s, 4) == dijkstra(g, s)
```

Dial's algorithm is what makes "weights up to 10" or "distances up to $10^6$" problems linear.

## Practice problems

- [Labyrinth](https://codeforces.com/contest/1063/problem/B)
- [KATHTHI](http://www.spoj.com/problems/KATHTHI/)
- [DoNotTurn](https://community.topcoder.com/stat?c=problem_statement&pm=10337)
- [Ocean Currents](https://onlinejudge.org/index.php?option=onlinejudge&page=show_problem&problem=2620)
- [Olya and Energy Drinks](https://codeforces.com/problemset/problem/877/D)
- [Three States](https://codeforces.com/problemset/problem/590/C)
- [Colliding Traffic](https://onlinejudge.org/index.php?option=com_onlinejudge&Itemid=8&page=show_problem&problem=2621)
- [CHamber of Secrets](https://codeforces.com/problemset/problem/173/B)
- [Spiral Maximum](https://codeforces.com/problemset/problem/173/C)
- [Minimum Cost to Make at Least One Valid Path in a Grid](https://leetcode.com/problems/minimum-cost-to-make-at-least-one-valid-path-in-a-grid)
