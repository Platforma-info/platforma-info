---
title: "Dijkstra on Sparse Graphs: Priority Queue Variants"
section: Shortest paths
order: 5
difficulty: intermediate
summary: "Why the O(n²) Dijkstra is wasteful on sparse graphs, and how heap variants (lazy deletion, decrease-key, packed integers) compare in Python."
tags: [dijkstra, heap, priority queue, sparse graphs, performance]
prerequisites: [graphs/dijkstra, python-contests/heaps-deques-and-bisect]
source:
  title: "Dijkstra on sparse graphs"
  url: https://cp-algorithms.com/graph/dijkstra_sparse.html
  license: CC BY-SA 4.0
---

The statement and the proof of [Dijkstra's algorithm](/theory/graphs/dijkstra) are in its own article. Here we look at the cost of the two operations it needs and at the data structures that make it fast on **sparse graphs**.

## Where the time goes

Dijkstra's algorithm does two kinds of operations:

1. find the unvisited vertex with the smallest distance $d[v]$, $O(n)$ times;
2. relax edges (change some $d[to]$), $O(m)$ times.

With a plain array, (1) costs $O(n)$ and (2) costs $O(1)$, so the total is $O(n^2 + m)$. That is optimal for **dense** graphs ($m \approx n^2$) but wasteful for sparse ones, where the $n^2$ term dominates although there are only $O(n)$ edges.

With a better structure for (1):

| Structure | Extract min | Decrease key | Total |
|-----------|-------------|--------------|-------|
| array | $O(n)$ | $O(1)$ | $O(n^2 + m)$ |
| binary heap / balanced tree | $O(\log n)$ | $O(\log n)$ | $O(m \log n)$ |
| Fibonacci heap | $O(\log n)$ amortized | $O(1)$ amortized | $O(n \log n + m)$ |

A structure with $O(1)$ for both operations cannot exist, since it would sort in linear time. (There is Thorup's $O(m)$ algorithm, but only for integer weights, and by a completely different idea.) The Fibonacci heap is theoretically optimal but complicated and with a large constant; in practice the binary heap is the compromise.

## Variant 1: lazy deletion (`heapq`)

Python's `heapq` cannot remove or change an element. The standard workaround is to **not remove** the outdated entries: on every successful relaxation push a new pair `(new distance, vertex)`; a vertex may then appear several times in the heap. When popping, skip the entry if its distance is not the current `dist[v]` (it is stale). That check matters: without it the complexity degrades to $O(nm)$.

The heap can hold up to $m$ entries, so an operation costs $O(\log m) = O(\log n)$ anyway.

```python
import heapq

INF = float("inf")

def dijkstra_lazy(adj, s):
    n = len(adj)
    dist = [INF] * n
    dist[s] = 0
    pq = [(0, s)]
    while pq:
        d, v = heapq.heappop(pq)
        if d != dist[v]:
            continue                                  # a stale entry
        for to, w in adj[v]:
            nd = d + w
            if nd < dist[to]:
                dist[to] = nd
                heapq.heappush(pq, (nd, to))
    return dist

adj = [[(1, 4), (2, 1)], [(3, 1)], [(1, 2), (3, 5)], []]
assert dijkstra_lazy(adj, 0) == [0, 3, 1, 4]
```

## Variant 2: packing (distance, vertex) into one integer

Comparing tuples is slower than comparing integers. If the distances are integers, store `d * n + v` as a single Python `int`; the order is the same (distance first, then vertex), and `divmod` recovers both parts. This "trick" makes the heap noticeably faster.

```python
def dijkstra_packed(adj, s):
    n = len(adj)
    dist = [INF] * n
    dist[s] = 0
    pq = [s]                                          # 0 * n + s
    while pq:
        d, v = divmod(heapq.heappop(pq), n)
        if d != dist[v]:
            continue
        for to, w in adj[v]:
            nd = d + w
            if nd < dist[to]:
                dist[to] = nd
                heapq.heappush(pq, nd * n + to)
    return dist

assert dijkstra_packed(adj, 0) == [0, 3, 1, 4]
```

## Variant 3: a real decrease-key (indexed heap)

The other option is to keep exactly one entry per vertex and to change its key in place, which needs a heap that knows where each vertex is. We keep the array `pos[v]`, the position of `v` in the heap, and sift up on decrease:

```python
class IndexedHeap:
    """A binary min-heap of vertices keyed by key[v], with O(log n) decrease-key."""

    def __init__(self, n):
        self.heap, self.pos, self.key = [], [-1] * n, [INF] * n

    def __bool__(self):
        return bool(self.heap)

    def _swap(self, i, j):
        h = self.heap
        h[i], h[j] = h[j], h[i]
        self.pos[h[i]], self.pos[h[j]] = i, j

    def _up(self, i):
        h, key = self.heap, self.key
        while i > 0 and key[h[i]] < key[h[(i - 1) // 2]]:
            self._swap(i, (i - 1) // 2)
            i = (i - 1) // 2

    def _down(self, i):
        h, key, n = self.heap, self.key, len(self.heap)
        while True:
            smallest = i
            for c in (2 * i + 1, 2 * i + 2):
                if c < n and key[h[c]] < key[h[smallest]]:
                    smallest = c
            if smallest == i:
                return
            self._swap(i, smallest)
            i = smallest

    def push_or_decrease(self, v, key):
        self.key[v] = key
        if self.pos[v] == -1:
            self.heap.append(v)
            self.pos[v] = len(self.heap) - 1
        self._up(self.pos[v])

    def pop(self):
        h = self.heap
        v = h[0]
        last = h.pop()
        self.pos[v] = -1
        if h:
            h[0] = last
            self.pos[last] = 0
            self._down(0)
        return v

def dijkstra_decrease_key(adj, s):
    n = len(adj)
    dist = [INF] * n
    dist[s] = 0
    q = IndexedHeap(n)
    q.push_or_decrease(s, 0)
    while q:
        v = q.pop()
        for to, w in adj[v]:
            nd = dist[v] + w
            if nd < dist[to]:
                dist[to] = nd
                q.push_or_decrease(to, nd)
    return dist

assert dijkstra_decrease_key(adj, 0) == [0, 3, 1, 4]
```

## Variant 4: the dense $O(n^2)$ version

For dense graphs the array version is best, and it does not need a heap at all:

```python
def dijkstra_dense(matrix, s):
    """matrix[u][v] is the weight of the edge u -> v, or None."""
    n = len(matrix)
    dist = [INF] * n
    dist[s] = 0
    used = [False] * n
    for _ in range(n):
        v = -1
        for i in range(n):
            if not used[i] and (v == -1 or dist[i] < dist[v]):
                v = i
        if dist[v] == INF:
            break
        used[v] = True
        for to in range(n):
            if matrix[v][to] is not None and dist[v] + matrix[v][to] < dist[to]:
                dist[to] = dist[v] + matrix[v][to]
    return dist

matrix = [[None, 4, 1, None], [None, None, None, 1], [None, 2, None, 5], [None] * 4]
assert dijkstra_dense(matrix, 0) == [0, 3, 1, 4]
```

## Checking all four, and measuring

```python
import random
import time

rnd = random.Random(1)

def random_graph(n, m, max_w):
    adj = [[] for _ in range(n)]
    for _ in range(m):
        adj[rnd.randrange(n)].append((rnd.randrange(n), rnd.randint(1, max_w)))
    return adj

for _ in range(500):
    n = rnd.randint(1, 8)
    g = random_graph(n, rnd.randint(0, 20), 20)
    mat = [[None] * n for _ in range(n)]
    for u in range(n):
        for v, w in g[u]:
            if mat[u][v] is None or w < mat[u][v]:
                mat[u][v] = w
    expected = dijkstra_dense(mat, 0)
    assert dijkstra_lazy(g, 0) == dijkstra_packed(g, 0) == dijkstra_decrease_key(g, 0) == expected

big = random_graph(100_000, 400_000, 10 ** 6)
timings = {}
results = []
for f in (dijkstra_lazy, dijkstra_packed, dijkstra_decrease_key):
    start = time.perf_counter()
    results.append(f(big, 0))
    timings[f.__name__] = time.perf_counter() - start
assert results[0] == results[1] == results[2]
```

On a random graph with $10^5$ vertices and $4\cdot10^5$ edges, a typical machine gives roughly: lazy heap about 0.6 s, packed integers about 0.5 s, and the indexed heap with decrease-key about 1.5 s. The indexed heap does *fewer* heap operations than the lazy version, yet it is 2–3 times slower, because its sift-up and sift-down are written in Python while `heapq` is implemented in C. This agrees with the finding of a [2007 technical report](https://www3.cs.stonybrook.edu/~rezaul/papers/TR-07-54.pdf) that the variant without decrease-key is faster in practice, especially on sparse graphs.

**Practical rule for Python:** use the lazy heap, with packed integers if the distances are integers and you need the last bit of speed. Use the $O(n^2)$ array version only for dense graphs (e.g., $n \le 2000$ with a complete graph).
