---
title: "Floyd-Warshall Algorithm"
section: Shortest paths
order: 4
difficulty: intermediate
summary: "All-pairs shortest paths in O(n³) with three nested loops, path reconstruction, negative cycles, and a much faster Python formulation."
tags: [floyd-warshall, all pairs, shortest path, dp]
prerequisites: [graphs/graph-basics]
source:
  title: Floyd-Warshall - finding all shortest paths
  url: https://cp-algorithms.com/graph/all-pair-shortest-path-floyd-warshall.html
  license: CC BY-SA 4.0
---

Given a weighted graph with $n$ vertices (weights may be negative, but there must be no negative cycle), the **Floyd-Warshall algorithm** finds the shortest distance between **every pair** of vertices in $O(n^3)$ time and $O(n^2)$ memory. It is only a few lines long.

## Algorithm

It's dynamic programming over the set of *allowed intermediate vertices*. Let $d_k[i][j]$ be the shortest path from $i$ to $j$ using only vertices $0, \dots, k-1$ as intermediates. A shortest path either avoids vertex $k$ or goes through it once:

$$
d_{k+1}[i][j] = \min\big(d_k[i][j],\ d_k[i][k] + d_k[k][j]\big)
$$

It is safe to update a single matrix **in place**, because row $k$ and column $k$ do not change during iteration $k$ (when there are no negative cycles).

```python
INF = float("inf")

def floyd_warshall(n, edges):
    d = [[0 if i == j else INF for j in range(n)] for i in range(n)]
    for u, v, w in edges:
        if w < d[u][v]:
            d[u][v] = w                        # keep the smallest of parallel edges
    for k in range(n):
        row_k = d[k]
        for row_i in d:
            d_ik = row_i[k]
            if d_ik == INF:
                continue                       # i cannot reach k: nothing to improve
            for j in range(n):
                through_k = d_ik + row_k[j]
                if through_k < row_i[j]:
                    row_i[j] = through_k
    return d

edges = [(0, 1, 3), (1, 2, 1), (0, 2, 7), (2, 3, 2), (3, 0, 4)]
d = floyd_warshall(4, edges)
assert d[0] == [0, 3, 4, 6]
assert d[3] == [4, 7, 8, 0]
assert d[2][1] == 2 + 4 + 3                    # 2 -> 3 -> 0 -> 1
```

**The order of the loops matters:** `k` must be the **outermost** loop.

## How fast is it in Python?

The algorithm does $n^3$ steps of the innermost loop. We measured this implementation on random complete graphs:

| $n$ | time |
|-----|------|
| 200 | 0.33 s |
| 300 | 1.2 s |
| 400 | 3.0 s |

So $n \lesssim 300$ is comfortable and $n = 400$ is about the limit for a 5-second judge. Hoisting `row_k` and `row_i` out of the inner loop (as above) is worth 10-20%; nothing else in pure Python helps much.

> [!WARNING]
> It is tempting to "vectorize" the inner loop with a list comprehension, `row_i[:] = [min(x, d_ik + y) for x, y in zip(row_i, row_k)]`. It looks faster but was **2-4x slower** in our measurements: calling `min()` once per element costs more than the plain `if`. Always benchmark before you "optimize".

If `numpy` is available the update is a single vectorized line and handles $n \approx 1000$: `d = np.minimum(d, d[:, k, None] + d[None, k, :])`. Many judges (including this platform's sandbox) provide only the standard library, so treat this as a note for your own projects.

If only some sources matter, or the graph is sparse, running [Dijkstra](/theory/graphs/dijkstra) from each source ($O(nm\log n)$) can beat Floyd-Warshall by far.

## Restoring paths

Keep, for each pair, the *next* vertex on a shortest path from $i$ to $j$, and update it together with the distance:

```python
def floyd_with_paths(n, edges):
    d = [[0 if i == j else INF for j in range(n)] for i in range(n)]
    nxt = [[None] * n for _ in range(n)]
    for u, v, w in edges:
        if w < d[u][v]:
            d[u][v] = w
            nxt[u][v] = v
    for i in range(n):
        nxt[i][i] = i
    for k in range(n):
        for i in range(n):
            for j in range(n):
                if d[i][k] + d[k][j] < d[i][j]:
                    d[i][j] = d[i][k] + d[k][j]
                    nxt[i][j] = nxt[i][k]
    return d, nxt

def path(nxt, i, j):
    if nxt[i][j] is None:
        return None
    out = [i]
    while i != j:
        i = nxt[i][j]
        out.append(i)
    return out

dist, nxt = floyd_with_paths(4, edges)
assert path(nxt, 2, 1) == [2, 3, 0, 1]
assert path(nxt, 0, 3) == [0, 1, 2, 3]
```

## Negative cycles

If the graph has a negative cycle, some `d[v][v]` becomes negative. Vertices $i$, $j$ have a "shortest path" of $-\infty$ when there is a vertex $t$ with `d[t][t] < 0` that is reachable from $i$ and can reach $j$:

```python
def has_negative_cycle(d):
    return any(d[v][v] < 0 for v in range(len(d)))

bad = floyd_warshall(3, [(0, 1, 1), (1, 2, -3), (2, 0, 1)])       # cycle weight -1
assert has_negative_cycle(bad)
assert not has_negative_cycle(d)
```

> [!NOTE]
> With negative cycles, values can grow astronomically in magnitude within the algorithm, which is harmless in Python (big integers) but could overflow in fixed-width languages.

## Testing

Compare with Dijkstra from every source on random non-negative graphs:

```python
import heapq, random

def dijkstra_all(n, edges):
    adj = [[] for _ in range(n)]
    for u, v, w in edges:
        adj[u].append((v, w))
    result = []
    for s in range(n):
        dist = [INF] * n
        dist[s] = 0
        heap = [(0, s)]
        while heap:
            dd, v = heapq.heappop(heap)
            if dd > dist[v]:
                continue
            for u, w in adj[v]:
                if dd + w < dist[u]:
                    dist[u] = dd + w
                    heapq.heappush(heap, (dd + w, u))
        result.append(dist)
    return result

random.seed(9)
for _ in range(200):
    n = random.randint(1, 9)
    es = [(random.randrange(n), random.randrange(n), random.randint(0, 9)) for _ in range(random.randint(0, 25))]
    expected = dijkstra_all(n, es)
    assert floyd_warshall(n, es) == expected
```

## Other uses

- **Transitive closure** (which vertices can reach which): replace `min`/`+` by `or`/`and`.
- **Graph diameter**, **radius** and centres.
- **Minimum cycle through a vertex** and shortest cycles in small graphs.
- **Reachability with big bitsets**: in Python, encode each row as an integer and use `|`, which reaches $n = 2000$ easily:

```python
def transitive_closure(n, edges):
    reach = [1 << i for i in range(n)]                # bitmask of vertices reachable from i
    for u, v in edges:
        reach[u] |= 1 << v
    for k in range(n):
        bit = 1 << k
        for i in range(n):
            if reach[i] & bit:
                reach[i] |= reach[k]
    return reach

r = transitive_closure(4, [(0, 1), (1, 2), (3, 0)])
assert [bin(x).count("1") for x in r] == [3, 2, 1, 4]
assert (r[3] >> 2) & 1
```

## Practice problems

- [UVA: Page Hopping](https://uva.onlinejudge.org/index.php?option=onlinejudge&page=show_problem&problem=762)
- [SPOJ: Possible Friends](http://www.spoj.com/problems/SOCIALNE/)
- [CODEFORCES: Greg and Graph](http://codeforces.com/problemset/problem/295/B)
- [SPOJ: CHICAGO - 106 miles to Chicago](http://www.spoj.com/problems/CHICAGO/)
- [UVA 10724 - Road Construction](https://uva.onlinejudge.org/index.php?option=onlinejudge&page=show_problem&problem=1665)
- [UVA  117 - The Postal Worker Rings Once](https://uva.onlinejudge.org/index.php?option=onlinejudge&page=show_problem&problem=53)
- [Codeforces - Traveling Graph](http://codeforces.com/problemset/problem/21/D)
- [UVA - 1198 - The Geodetic Set Problem](https://uva.onlinejudge.org/index.php?option=onlinejudge&page=show_problem&problem=3639)
- [UVA - 10048 - Audiophobia](https://uva.onlinejudge.org/index.php?option=com_onlinejudge&Itemid=8&page=show_problem&problem=989)
- [UVA - 125 - Numbering Paths](https://uva.onlinejudge.org/index.php?option=onlinejudge&page=show_problem&problem=61)
- [LOJ - Travel Company](http://lightoj.com/volume_showproblem.php?problem=1221)
- [UVA 423 - MPI Maelstrom](https://uva.onlinejudge.org/index.php?option=com_onlinejudge&Itemid=8&page=show_problem&problem=364)
- [UVA 1416 - Warfare And Logistics](https://uva.onlinejudge.org/index.php?option=com_onlinejudge&Itemid=8&page=show_problem&problem=4162)
- [UVA 1233 - USHER](https://uva.onlinejudge.org/index.php?option=com_onlinejudge&Itemid=8&page=show_problem&problem=3674)
- [UVA 10793 - The Orc Attack](https://uva.onlinejudge.org/index.php?option=com_onlinejudge&Itemid=8&page=show_problem&problem=1734)
- [UVA 10099 The Tourist Guide](https://uva.onlinejudge.org/index.php?option=com_onlinejudge&Itemid=8&page=show_problem&problem=1040)
- [UVA 869 - Airline Comparison](https://uva.onlinejudge.org/index.php?option=com_onlinejudge&Itemid=8&page=show_problem&problem=810)
- [UVA 13211 - Geonosis](https://uva.onlinejudge.org/index.php?option=com_onlinejudge&Itemid=8&page=show_problem&problem=5134)
- [SPOJ - Defend the Rohan](http://www.spoj.com/problems/ROHAAN/)
- [Codeforces - Roads in Berland](http://codeforces.com/contest/25/problem/C)
- [Codeforces - String Problem](http://codeforces.com/contest/33/problem/B)
- [GYM - Manic Moving (C)](http://codeforces.com/gym/101223)
- [SPOJ - Arbitrage](http://www.spoj.com/problems/ARBITRAG/)
- [UVA - 12179 - Randomly-priced Tickets](https://uva.onlinejudge.org/index.php?option=com_onlinejudge&Itemid=8&page=show_problem&problem=3331)
- [LOJ - 1086 - Jogging Trails](http://lightoj.com/volume_showproblem.php?problem=1086)
- [SPOJ - Ingredients](http://www.spoj.com/problems/INGRED/)
- [CSES - Shortest Routes II](https://cses.fi/problemset/task/1672)
