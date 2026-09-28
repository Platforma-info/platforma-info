---
title: "Dijkstra's Algorithm"
section: Shortest paths
order: 1
difficulty: intermediate
summary: "Shortest paths from one source in a graph with non-negative weights, in O((n + m) log n) with a heap, plus path restoration."
tags: [dijkstra, shortest path, heap, weighted graphs]
prerequisites: [graphs/breadth-first-search, python-contests/heaps-deques-and-bisect]
source:
  title: Dijkstra Algorithm
  url: https://cp-algorithms.com/graph/dijkstra.html
  license: CC BY-SA 4.0
---

You are given a directed or undirected weighted graph with $n$ vertices and $m$ edges, **all weights non-negative**, and a source vertex $s$. **Dijkstra's algorithm** finds the length of the shortest path from $s$ to every other vertex (the *single-source shortest paths* problem), and the paths themselves. It was described by Edsger Dijkstra in 1959.

## Algorithm

Keep an array $d[v]$ with the length of the best path found so far from $s$ to $v$. Initially $d[s] = 0$ and $d[v] = \infty$ for the rest. Repeat:

1. Among the vertices not yet *finalized*, pick $v$ with the smallest $d[v]$ and finalize it.
2. **Relax** all edges $(v, u)$ with weight $w$: if $d[v] + w < d[u]$, set $d[u] = d[v] + w$.

The idea is that the closest unfinalized vertex can't be improved anymore: any other route to it would have to leave through some unfinalized vertex which is at least as far, and weights are non-negative.

### Proof sketch

Claim: when $v$ is finalized, $d[v]$ is the true shortest distance. Suppose a shorter path $P$ to $v$ existed. It must leave the set of finalized vertices at some edge $(q, p)$ with $q$ finalized and $p$ not. By induction $d[q]$ was exact, so after relaxing from $q$, $d[p] \le \text{len}(P \text{ up to } p) \le \text{len}(P) < d[v]$, contradicting the choice of $v$ as the minimum.

The proof uses non-negative weights in "$\text{len}(P \text{ up to } p) \le \text{len}(P)$". With negative edges the algorithm can return wrong answers: use [Bellman-Ford](/theory/graphs/bellman-ford).

## Implementation with a heap

Finding the minimum by scanning is $O(n)$ per step, giving $O(n^2)$ overall. With a **binary heap** (`heapq`) the minimum comes out in $O(\log n)$. Python's heap has no "decrease key", so we use **lazy deletion**: push a new `(distance, vertex)` entry each time we improve a distance, and skip stale entries when they are popped.

```python
import heapq

INF = float("inf")

def dijkstra(adj, s):
    """adj[v] = list of (neighbour, weight). Return (dist, parent)."""
    n = len(adj)
    dist = [INF] * n
    parent = [-1] * n
    dist[s] = 0
    heap = [(0, s)]
    while heap:
        d, v = heapq.heappop(heap)
        if d > dist[v]:                       # stale entry: a shorter path was found later
            continue
        for u, w in adj[v]:
            nd = d + w
            if nd < dist[u]:
                dist[u] = nd
                parent[u] = v
                heapq.heappush(heap, (nd, u))
    return dist, parent

adj = [
    [(1, 7), (2, 9), (5, 14)],       # 0
    [(0, 7), (2, 10), (3, 15)],      # 1
    [(0, 9), (1, 10), (3, 11), (5, 2)],
    [(1, 15), (2, 11), (4, 6)],
    [(3, 6), (5, 9)],
    [(0, 14), (2, 2), (4, 9)],
]
dist, parent = dijkstra(adj, 0)
assert dist == [0, 7, 9, 20, 20, 11]
```

**Complexity.** Each edge causes at most one push, so the heap holds $O(m)$ entries and the total is $O((n + m)\log n)$ (or $O(m \log n)$ for connected graphs). Memory $O(n + m)$.

### Restoring a shortest path

Like BFS, follow `parent` pointers back from the target:

```python
def restore_path(parent, t):
    path = []
    while t != -1:
        path.append(t)
        t = parent[t]
    return path[::-1]

assert restore_path(parent, 4) == [0, 2, 5, 4]
assert restore_path(parent, 0) == [0]
```

### Early exit

If you only need the distance to one target $t$, stop as soon as $t$ is popped: its distance is final.

## Checking it

Compare with a different algorithm (Bellman-Ford) on random graphs:

```python
import random

def bellman_ford_simple(n, edges, s):
    dist = [INF] * n
    dist[s] = 0
    for _ in range(n - 1):
        for u, v, w in edges:
            if dist[u] + w < dist[v]:
                dist[v] = dist[u] + w
    return dist

random.seed(7)
for _ in range(300):
    n = random.randint(1, 10)
    edges = [(random.randrange(n), random.randrange(n), random.randint(0, 9)) for _ in range(random.randint(0, 25))]
    g = [[] for _ in range(n)]
    for u, v, w in edges:
        g[u].append((v, w))
    s = random.randrange(n)
    assert dijkstra(g, s)[0] == bellman_ford_simple(n, edges, s)
```

## Dense graphs: $O(n^2)$ without a heap

For a dense graph ($m \approx n^2$), the heap does not help: pick the minimum by a linear scan and relax from an adjacency matrix. The cost is $O(n^2)$, which beats $O(m \log n)$ when $m \gg n^2/\log n$.

```python
def dijkstra_dense(matrix, s):
    """matrix[u][v] = weight or INF if there is no edge."""
    n = len(matrix)
    dist = [INF] * n
    dist[s] = 0
    done = [False] * n
    for _ in range(n):
        v = -1
        for u in range(n):
            if not done[u] and (v == -1 or dist[u] < dist[v]):
                v = u
        if dist[v] == INF:
            break
        done[v] = True
        row = matrix[v]
        for u in range(n):
            if dist[v] + row[u] < dist[u]:
                dist[u] = dist[v] + row[u]
    return dist

n = len(adj)
mat = [[INF] * n for _ in range(n)]
for v in range(n):
    for u, w in adj[v]:
        mat[v][u] = min(mat[v][u], w)
assert dijkstra_dense(mat, 0) == dist
```

## Pitfalls

- **Negative weights** break correctness. A zero-weight edge is fine.
- Use `float("inf")` (or a value larger than any possible path) as infinity. Adding to `inf` stays `inf`, so no special handling is needed in Python.
- The stale-entry check `if d > dist[v]: continue` is essential for the stated complexity: without it, a vertex may be expanded many times.
- Unreachable vertices keep `dist == INF`.
- If all weights are equal use [BFS](/theory/graphs/breadth-first-search); if they are only $0$ or $1$ use [0-1 BFS](/theory/graphs/zero-one-bfs).

## Practice problems

- [Timus - Ivan's Car](http://acm.timus.ru/problem.aspx?space=1&num=1930) [Difficulty:Medium]
- [Timus - Sightseeing Trip](http://acm.timus.ru/problem.aspx?space=1&num=1004)
- [SPOJ - SHPATH](http://www.spoj.com/problems/SHPATH/) [Difficulty:Easy]
- [Codeforces - Dijkstra?](http://codeforces.com/problemset/problem/20/C) [Difficulty:Easy]
- [Codeforces - Shortest Path](http://codeforces.com/problemset/problem/59/E)
- [Codeforces - Jzzhu and Cities](http://codeforces.com/problemset/problem/449/B)
- [Codeforces - The Classic Problem](http://codeforces.com/problemset/problem/464/E)
- [Codeforces - President and Roads](http://codeforces.com/problemset/problem/567/E)
- [Codeforces - Complete The Graph](http://codeforces.com/problemset/problem/715/B)
- [TopCoder - SkiResorts](https://community.topcoder.com/stat?c=problem_statement&pm=12468)
- [TopCoder - MaliciousPath](https://community.topcoder.com/stat?c=problem_statement&pm=13596)
- [SPOJ - Ada and Trip](http://www.spoj.com/problems/ADATRIP/)
- [LA - 3850 - Here We Go(relians) Again](https://vjudge.net/problem/UVALive-3850)
- [GYM - Destination Unknown (D)](http://codeforces.com/gym/100625)
- [UVA 12950 - Even Obsession](https://uva.onlinejudge.org/index.php?option=onlinejudge&page=show_problem&problem=4829)
- [GYM - Journey to Grece (A)](http://codeforces.com/gym/100753)
- [UVA 13030 - Brain Fry](https://uva.onlinejudge.org/index.php?option=com_onlinejudge&Itemid=8&category=866&page=show_problem&problem=4918)
- [UVA 1027 - Toll](https://uva.onlinejudge.org/index.php?option=onlinejudge&page=show_problem&problem=3468)
- [UVA 11377 - Airport Setup](https://uva.onlinejudge.org/index.php?option=onlinejudge&page=show_problem&problem=2372)
- [Codeforces - Dynamic Shortest Path](http://codeforces.com/problemset/problem/843/D)
- [UVA 11813 - Shopping](https://uva.onlinejudge.org/index.php?option=com_onlinejudge&Itemid=8&page=show_problem&problem=2913)
- [UVA 11833 - Route Change](https://uva.onlinejudge.org/index.php?option=com_onlinejudge&Itemid=8&category=226&page=show_problem&problem=2933)
- [SPOJ - Easy Dijkstra Problem](http://www.spoj.com/problems/EZDIJKST/en/)
- [LA - 2819 - Cave Raider](https://vjudge.net/problem/UVALive-2819)
- [UVA 12144 - Almost Shortest Path](https://uva.onlinejudge.org/index.php?option=onlinejudge&page=show_problem&problem=3296)
- [UVA 12047 - Highest Paid Toll](https://uva.onlinejudge.org/index.php?option=com_onlinejudge&Itemid=8&page=show_problem&problem=3198)
- [UVA 11514 - Batman](https://uva.onlinejudge.org/index.php?option=onlinejudge&page=show_problem&problem=2509)
- [Codeforces - Team Rocket Rises Again](http://codeforces.com/contest/757/problem/F)
- [UVA - 11338 - Minefield](https://uva.onlinejudge.org/index.php?option=com_onlinejudge&Itemid=8&page=show_problem&problem=2313)
- [UVA 11374 - Airport Express](https://uva.onlinejudge.org/index.php?option=com_onlinejudge&Itemid=8&page=show_problem&problem=2369)
- [UVA 11097 - Poor My Problem](https://uva.onlinejudge.org/index.php?option=com_onlinejudge&Itemid=8&page=show_problem&problem=2038)
- [UVA 13172 - The music teacher](https://uva.onlinejudge.org/index.php?option=onlinejudge&Itemid=8&page=show_problem&problem=5083)
- [Codeforces - Dirty Arkady's Kitchen](http://codeforces.com/contest/827/problem/F)
- [SPOJ - Delivery Route](http://www.spoj.com/problems/DELIVER/)
- [SPOJ - Costly Chess](http://www.spoj.com/problems/CCHESS/)
- [CSES - Shortest Routes 1](https://cses.fi/problemset/task/1671)
- [CSES - Flight Discount](https://cses.fi/problemset/task/1195)
- [CSES - Flight Routes](https://cses.fi/problemset/task/1196)
