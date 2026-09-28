---
title: "Edge and Vertex Connectivity"
section: Connectivity
order: 7
difficulty: advanced
summary: "How many edges or vertices must be removed to disconnect a graph? Whitney's inequalities and the max-flow computation of both connectivities."
tags: [connectivity, max flow, menger, whitney, min cut]
prerequisites: [graphs/maximum-flow, graphs/bridges]
source:
  title: "Edge connectivity / Vertex connectivity"
  url: https://cp-algorithms.com/graph/edge_vertex_connectivity.html
  license: CC BY-SA 4.0
---

## Definitions

Let $G$ be an undirected graph with $n$ vertices and $m$ edges.

- The **edge connectivity** $\lambda$ is the minimum number of edges whose removal disconnects the graph. A graph that is already disconnected has $\lambda = 0$; a connected graph with a bridge has $\lambda = 1$; a bridgeless connected graph has $\lambda \ge 2$.
- The **vertex connectivity** $\kappa$ is the minimum number of vertices whose removal disconnects the graph. A disconnected graph has $\kappa = 0$; a connected graph with an articulation point has $\kappa = 1$. By convention the complete graph has $\kappa = n - 1$ (any other graph has two non-adjacent vertices, and removing the other $n - 2$ vertices separates them, so $\kappa \le n - 2$).

A set of edges (or vertices) **separates** $s$ and $t$ if, after removing it, $s$ and $t$ are in different components. The connectivity is the smallest size of a separating set over all pairs $(s, t)$.

## Properties

**Whitney's inequalities** (1932): with $\delta$ the minimum degree of a vertex,

$$
\kappa \le \lambda \le \delta
$$

Removing all edges around a minimum-degree vertex disconnects the graph, so $\lambda \le \delta$. Picking one endpoint of each edge of a minimal edge cut gives a vertex cut of at most the same size, so $\kappa \le \lambda$. The inequalities cannot be improved: any triple of numbers satisfying them is realized by some graph.

**Menger / Ford–Fulkerson.** The largest number of edge-disjoint paths between $s$ and $t$ equals the smallest number of edges separating them. Likewise, for non-adjacent $s$ and $t$, the largest number of internally **vertex-disjoint** paths equals the smallest number of vertices separating them.

## Computing the edge connectivity with max flow

For a pair $(s, t)$, the maximum number of edge-disjoint paths is the maximum flow from $s$ to $t$ when every edge has capacity $1$ (an undirected edge is a pair of opposite arcs of capacity $1$). Then $\lambda$ is the minimum over pairs.

It is enough to fix $s$ and try all $t$: the minimum cut separates some vertex from vertex $s = 0$, so $\lambda = \min_{t \ne 0} \text{maxflow}(0, t)$. That needs only $n - 1$ flow computations.

Here is a small Dinic implementation, followed by both connectivities:

```python
from collections import deque

class Dinic:
    def __init__(self, n):
        self.n = n
        self.graph = [[] for _ in range(n)]
        self.to, self.cap = [], []

    def add_edge(self, u, v, c, back=0):
        self.graph[u].append(len(self.to)); self.to.append(v); self.cap.append(c)
        self.graph[v].append(len(self.to)); self.to.append(u); self.cap.append(back)

    def max_flow(self, s, t):
        flow = 0
        while True:
            level = [-1] * self.n
            level[s] = 0
            q = deque([s])
            while q:
                u = q.popleft()
                for e in self.graph[u]:
                    if self.cap[e] > 0 and level[self.to[e]] < 0:
                        level[self.to[e]] = level[u] + 1
                        q.append(self.to[e])
            if level[t] < 0:
                return flow
            it = [0] * self.n

            def dfs(u, pushed):
                if u == t:
                    return pushed
                while it[u] < len(self.graph[u]):
                    e = self.graph[u][it[u]]
                    v = self.to[e]
                    if self.cap[e] > 0 and level[v] == level[u] + 1:
                        got = dfs(v, min(pushed, self.cap[e]))
                        if got:
                            self.cap[e] -= got
                            self.cap[e ^ 1] += got
                            return got
                    it[u] += 1
                return 0

            while True:
                pushed = dfs(s, 10 ** 9)
                if not pushed:
                    break
                flow += pushed

def edge_connectivity(n, edges):
    best = float("inf")
    for t in range(1, n):
        g = Dinic(n)
        for u, v in edges:
            g.add_edge(u, v, 1, 1)                        # an undirected edge of capacity 1
        best = min(best, g.max_flow(0, t))
    return best if n > 1 else 0

assert edge_connectivity(4, [(0, 1), (1, 2), (2, 3)]) == 1                       # a path
assert edge_connectivity(4, [(0, 1), (1, 2), (2, 3), (3, 0)]) == 2               # a cycle
assert edge_connectivity(4, [(i, j) for i in range(4) for j in range(i + 1, 4)]) == 3       # K4
assert edge_connectivity(4, [(0, 1), (2, 3)]) == 0                               # disconnected
```

## Computing the vertex connectivity

For non-adjacent $s$ and $t$, split every vertex $x$ (except $s$ and $t$) into $x_{in}$ and $x_{out}$ connected by an arc $x_{in}\to x_{out}$ of capacity $1$, and replace each edge $(u, v)$ by arcs $u_{out}\to v_{in}$ and $v_{out}\to u_{in}$. The maximum flow from $s$ to $t$ is then the minimum number of vertices separating them, since each vertex can carry only one unit of flow. The vertex connectivity is the minimum over all non-adjacent pairs, or $n - 1$ if the graph is complete.

```python
def vertex_connectivity(n, edges):
    adjacent = {(min(u, v), max(u, v)) for u, v in edges}
    best = n - 1
    for s in range(n):
        for t in range(s + 1, n):
            if (s, t) in adjacent:
                continue                                    # adjacent vertices cannot be separated
            g = Dinic(2 * n)
            for x in range(n):
                g.add_edge(2 * x, 2 * x + 1, 10 ** 9 if x in (s, t) else 1)   # x_in -> x_out
            for u, v in edges:
                g.add_edge(2 * u + 1, 2 * v, 1)
                g.add_edge(2 * v + 1, 2 * u, 1)
            best = min(best, g.max_flow(2 * s, 2 * t + 1))
    return best

assert vertex_connectivity(4, [(0, 1), (1, 2), (2, 3)]) == 1
assert vertex_connectivity(4, [(0, 1), (1, 2), (2, 3), (3, 0)]) == 2
assert vertex_connectivity(4, [(i, j) for i in range(4) for j in range(i + 1, 4)]) == 3   # K4: n - 1
assert vertex_connectivity(4, [(0, 1), (2, 3)]) == 0
# two triangles sharing a vertex: the shared vertex is an articulation point
assert vertex_connectivity(5, [(0, 1), (1, 2), (2, 0), (2, 3), (3, 4), (4, 2)]) == 1
```

The complexity of the plain approach with Edmonds–Karp is roughly $O(V^2 \cdot VE^2)$, though in practice flow algorithms run much faster than their worst case, especially on random graphs. For the edge connectivity there are special algorithms for the **global minimum cut**; see [Stoer–Wagner](/theory/graphs/stoer-wagner-mincut).

## Testing against the definitions

For small graphs we can check the definitions directly: try every set of edges (or vertices) of increasing size and see whether removing it disconnects the graph. We also verify Whitney's inequalities.

```python
import random
from itertools import combinations

def is_connected(vertices, edges):
    vertices = set(vertices)
    if len(vertices) <= 1:
        return True
    adj = {v: [] for v in vertices}
    for u, v in edges:
        if u in vertices and v in vertices:
            adj[u].append(v)
            adj[v].append(u)
    start = next(iter(vertices))
    seen, stack = {start}, [start]
    while stack:
        for w in adj[stack.pop()]:
            if w not in seen:
                seen.add(w)
                stack.append(w)
    return len(seen) == len(vertices)

def edge_connectivity_brute(n, edges):
    for k in range(len(edges) + 1):
        for removed in combinations(range(len(edges)), k):
            rest = [e for i, e in enumerate(edges) if i not in removed]
            if not is_connected(range(n), rest):
                return k

def vertex_connectivity_brute(n, edges):
    for k in range(n - 1):
        for removed in combinations(range(n), k):
            remaining = [v for v in range(n) if v not in removed]
            if len(remaining) >= 2 and not is_connected(remaining, edges):
                return k
    return n - 1

rnd = random.Random(2)
for _ in range(200):
    n = rnd.randint(2, 7)
    pairs = [(u, v) for u in range(n) for v in range(u + 1, n)]
    edges = [p for p in pairs if rnd.random() < rnd.choice([0.3, 0.6, 0.9])]
    lam, kap = edge_connectivity(n, edges), vertex_connectivity(n, edges)
    assert lam == edge_connectivity_brute(n, edges)
    assert kap == vertex_connectivity_brute(n, edges)
    degree = [sum(v in e for e in edges) for v in range(n)]
    assert kap <= lam <= min(degree)                                      # Whitney's inequalities
```
