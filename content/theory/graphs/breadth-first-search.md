---
title: "Breadth-First Search"
section: Graph traversal
order: 2
difficulty: beginner
summary: "Visit vertices in order of distance from a source with a queue: shortest paths in unweighted graphs, grids and more."
tags: [bfs, shortest path, queue, traversal]
prerequisites: [graphs/graph-basics, python-contests/heaps-deques-and-bisect]
source:
  title: Breadth-first search
  url: https://cp-algorithms.com/graph/breadth-first-search.html
  license: CC BY-SA 4.0
---

**Breadth-first search** (BFS) explores a graph in layers: first the source $s$, then all vertices at distance 1, then distance 2, and so on. On an *unweighted* graph this gives the shortest path (fewest edges) from $s$ to every reachable vertex, in $O(n + m)$.

## Algorithm

Keep a **queue** of vertices to process, initially only $s$ with distance $0$. Repeatedly remove the vertex $v$ from the front, and for each neighbour $u$ that has not been visited, set `dist[u] = dist[v] + 1`, record `parent[u] = v`, and add $u$ to the back of the queue.

Because the queue is first-in-first-out, vertices leave it in non-decreasing order of distance, which is why the first time we reach a vertex is via a shortest path.

```python
from collections import deque

def bfs(adj, s):
    """Return (dist, parent) from source s; dist is -1 for unreachable vertices."""
    n = len(adj)
    dist = [-1] * n
    parent = [-1] * n
    dist[s] = 0
    q = deque([s])
    while q:
        v = q.popleft()
        for u in adj[v]:
            if dist[u] == -1:
                dist[u] = dist[v] + 1
                parent[u] = v
                q.append(u)
    return dist, parent

adj = [[1, 2], [0, 3], [0, 3], [1, 2, 4], [3], []]         # vertex 5 is isolated
dist, parent = bfs(adj, 0)
assert dist == [0, 1, 1, 2, 3, -1]
assert parent[4] == 3 and parent[3] in (1, 2)
```

Each vertex enters the queue at most once and each adjacency list is scanned once, so the time is $O(n + m)$.

> [!WARNING]
> Use `collections.deque`, not a list with `pop(0)`. `list.pop(0)` shifts every element and turns BFS quadratic (see [Heaps, Deques and Bisect](/theory/python-contests/heaps-deques-and-bisect)).

## Restoring a path

Walk back from the target through `parent` and reverse:

```python
def shortest_path(adj, s, t):
    dist, parent = bfs(adj, s)
    if dist[t] == -1:
        return None
    path = []
    while t != -1:
        path.append(t)
        t = parent[t]
    return path[::-1]

p = shortest_path(adj, 0, 4)
assert p[0] == 0 and p[-1] == 4 and len(p) == 4
assert shortest_path(adj, 0, 5) is None
```

## Applications

- **Shortest path in an unweighted graph** (above), or in a grid maze.
- **Connected components**: run BFS from every unvisited vertex.
- **Shortest cycle**, **bipartiteness check**, and **finding all edges on some shortest path** (compare distances from both endpoints).
- **Shortest path where the "vertices" are states**: a puzzle, a word ladder, a lock combination. BFS over the implicit state graph gives the minimum number of moves.
- **0-1 BFS** for edges of weight 0 or 1 ([see the article](/theory/graphs/zero-one-bfs)).

### BFS on a grid

```python
def grid_shortest(grid, start, goal):
    """Fewest steps in a grid of '.' (free) and '#' (wall); -1 if unreachable."""
    rows, cols = len(grid), len(grid[0])
    dist = [[-1] * cols for _ in range(rows)]
    dist[start[0]][start[1]] = 0
    q = deque([start])
    while q:
        r, c = q.popleft()
        if (r, c) == goal:
            return dist[r][c]
        for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nr, nc = r + dr, c + dc
            if 0 <= nr < rows and 0 <= nc < cols and grid[nr][nc] == "." and dist[nr][nc] == -1:
                dist[nr][nc] = dist[r][c] + 1
                q.append((nr, nc))
    return -1

maze = [
    "..#....",
    ".##.##.",
    "....#..",
    ".##...#",
    "...#...",
]
assert grid_shortest(maze, (0, 0), (4, 6)) == 10
assert grid_shortest(["..#", "###", "..."], (0, 0), (2, 2)) == -1
```

### Multi-source BFS

To find the distance from every vertex to its *nearest* source among several, start with **all sources in the queue at distance 0**. The rest of the algorithm is unchanged:

```python
def multi_source_bfs(adj, sources):
    dist = [-1] * len(adj)
    q = deque()
    for s in sources:
        dist[s] = 0
        q.append(s)
    while q:
        v = q.popleft()
        for u in adj[v]:
            if dist[u] == -1:
                dist[u] = dist[v] + 1
                q.append(u)
    return dist

path_graph = [[1], [0, 2], [1, 3], [2, 4], [3]]
assert multi_source_bfs(path_graph, [0, 4]) == [0, 1, 2, 1, 0]
```

### State-space BFS: the minimum number of moves

Vertices don't need to be numbers; anything hashable works. Example: transform `a` into `b` using the operations "+1" and "x2":

```python
def min_ops(a, b, limit=10 ** 4):
    dist = {a: 0}
    q = deque([a])
    while q:
        v = q.popleft()
        if v == b:
            return dist[v]
        for u in (v + 1, v * 2):
            if u <= limit and u not in dist:
                dist[u] = dist[v] + 1
                q.append(u)
    return -1

assert min_ops(2, 11) == 4              # 2 -> 4 -> 5 -> 10 -> 11
assert min_ops(5, 5) == 0
```

## Practice problems

BFS comes into play whenever a statement asks for "the minimum number of steps / moves / jumps".

- [SPOJ: AKBAR](http://spoj.com/problems/AKBAR)
- [SPOJ: NAKANJ](http://www.spoj.com/problems/NAKANJ/)
- [SPOJ: WATER](http://www.spoj.com/problems/WATER)
- [SPOJ: MICE AND MAZE](http://www.spoj.com/problems/MICEMAZE/)
- [Timus: Caravans](http://acm.timus.ru/problem.aspx?space=1&num=2034)
- [DevSkill - Holloween Party (archived)](http://web.archive.org/web/20200930162803/http://www.devskill.com/CodingProblems/ViewProblem/60)
- [DevSkill - Ohani And The Link Cut Tree (archived)](http://web.archive.org/web/20170216192002/http://devskill.com:80/CodingProblems/ViewProblem/150)
- [SPOJ - Spiky Mazes](http://www.spoj.com/problems/SPIKES/)
- [SPOJ - Four Chips (hard)](http://www.spoj.com/problems/ADV04F1/)
- [SPOJ - Inversion Sort](http://www.spoj.com/problems/INVESORT/)
- [Codeforces - Shortest Path](http://codeforces.com/contest/59/problem/E)
- [SPOJ - Yet Another Multiple Problem](http://www.spoj.com/problems/MULTII/)
- [UVA 11392 - Binary 3xType Multiple](https://uva.onlinejudge.org/index.php?option=com_onlinejudge&Itemid=8&page=show_problem&problem=2387)
- [UVA 10968 - KuPellaKeS](https://uva.onlinejudge.org/index.php?option=com_onlinejudge&Itemid=8&page=show_problem&problem=1909)
- [Codeforces - Police Stations](http://codeforces.com/contest/796/problem/D)
- [Codeforces - Okabe and City](http://codeforces.com/contest/821/problem/D)
- [SPOJ - Find the Treasure](http://www.spoj.com/problems/DIGOKEYS/)
- [Codeforces - Bear and Forgotten Tree 2](http://codeforces.com/contest/653/problem/E)
- [Codeforces - Cycle in Maze](http://codeforces.com/contest/769/problem/C)
- [UVA - 11312 - Flipping Frustration](https://uva.onlinejudge.org/index.php?option=com_onlinejudge&Itemid=8&page=show_problem&problem=2287)
- [SPOJ - Ada and Cycle](http://www.spoj.com/problems/ADACYCLE/)
- [CSES - Labyrinth](https://cses.fi/problemset/task/1193)
- [CSES - Message Route](https://cses.fi/problemset/task/1667/)
- [CSES - Monsters](https://cses.fi/problemset/task/1194)
- [UVA 704 - Colour Hash](https://onlinejudge.org/index.php?option=com_onlinejudge&Itemid=8&category=9&page=show_problem&problem=645) (bidirectional BFS)
