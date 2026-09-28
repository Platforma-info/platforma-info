---
title: "The Assignment Problem via Min-Cost Flow"
section: Flows and matchings
order: 12
difficulty: advanced
summary: "Model the assignment problem as a minimum-cost flow on a bipartite network and solve it with successive shortest paths in O(N³) (with Dijkstra) or O(N⁴) (with Bellman-Ford)."
tags: [assignment problem, min cost flow, bipartite matching, weighted matching]
prerequisites: [graphs/min-cost-flow]
source:
  title: "Solving assignment problem using min-cost-flow"
  url: https://cp-algorithms.com/graph/Assignment-problem-min-flow.html
  license: CC BY-SA 4.0
---

The **assignment problem** has two equivalent statements:

- Given a square matrix $A[1..N][1..N]$, select $N$ elements such that exactly one element is selected in each row and in each column, and the sum of the selected elements is **minimum**.
- There are $N$ orders and $N$ machines; the cost of producing each order on each machine is known. A machine can do only one order. Assign all orders to machines so that the total cost is minimum.

This article solves it with a [minimum-cost flow](/theory/graphs/min-cost-flow). (The [Hungarian algorithm](/theory/graphs/hungarian-algorithm) is a specialised, shorter and faster solution in $O(N^3)$.)

## The network

Build a bipartite network:

- a source $S$ and a sink $T$;
- $N$ vertices on the left (rows / orders) and $N$ on the right (columns / machines);
- an edge $S \to i$ of capacity $1$ and cost $0$ for every left vertex $i$;
- an edge $j \to T$ of capacity $1$ and cost $0$ for every right vertex $j$;
- an edge $i \to j$ of capacity $1$ and cost $A_{ij}$ for every pair.

Find the **maximum flow of minimum cost**. Its value is $N$; and for each left vertex $i$ exactly one edge $(i, j)$ carries a unit of flow. This is a one-to-one correspondence between rows and columns, i.e., a valid assignment. Because the flow has minimum cost, the sum of the selected costs is the smallest possible.

**Complexity.** The flow has $N$ units, so there are $N$ augmentations. With Dijkstra (and potentials), each takes $O(N^2)$ on this dense graph: $O(N^3)$. With Bellman–Ford it is $O(N^3)$ per augmentation: $O(N^4)$.

## Implementation

Using the min-cost flow class from the previous article (SPFA for the shortest paths):

```python
from collections import deque

INF = float("inf")

class MinCostFlow:
    def __init__(self, n):
        self.n = n
        self.adj = [[] for _ in range(n)]
        self.to, self.cap, self.cost = [], [], []

    def add_edge(self, u, v, capacity, cost):
        self.adj[u].append(len(self.to)); self.to.append(v); self.cap.append(capacity); self.cost.append(cost)
        self.adj[v].append(len(self.to)); self.to.append(u); self.cap.append(0); self.cost.append(-cost)
        return len(self.to) - 2

    def min_cost_flow(self, s, t, k=INF):
        flow = total = 0
        while flow < k:
            dist = [INF] * self.n
            parent_edge = [-1] * self.n
            in_queue = [False] * self.n
            dist[s] = 0
            queue = deque([s])
            while queue:
                u = queue.popleft()
                in_queue[u] = False
                for e in self.adj[u]:
                    v = self.to[e]
                    if self.cap[e] > 0 and dist[u] + self.cost[e] < dist[v]:
                        dist[v] = dist[u] + self.cost[e]
                        parent_edge[v] = e
                        if not in_queue[v]:
                            in_queue[v] = True
                            queue.append(v)
            if dist[t] == INF:
                break
            amount, v = k - flow, t
            while v != s:
                amount = min(amount, self.cap[parent_edge[v]])
                v = self.to[parent_edge[v] ^ 1]
            v = t
            while v != s:
                e = parent_edge[v]
                self.cap[e] -= amount
                self.cap[e ^ 1] += amount
                v = self.to[e ^ 1]
            flow += amount
            total += amount * dist[t]
        return flow, total

def assignment(a):
    """Minimum-cost assignment for a square matrix a. Returns (total cost, column chosen for each row)."""
    n = len(a)
    source, sink = 2 * n, 2 * n + 1
    net = MinCostFlow(2 * n + 2)
    cell = {}
    for i in range(n):
        net.add_edge(source, i, 1, 0)
        net.add_edge(n + i, sink, 1, 0)
        for j in range(n):
            cell[i, j] = net.add_edge(i, n + j, 1, a[i][j])
    flow, cost = net.min_cost_flow(source, sink)
    assert flow == n
    answer = [next(j for j in range(n) if net.cap[cell[i, j] ^ 1] == 1) for i in range(n)]
    return cost, answer

cost, cols = assignment([[4, 1, 3], [2, 0, 5], [3, 2, 2]])
assert cost == 5 and sorted(cols) == [0, 1, 2]
assert sum([[4, 1, 3], [2, 0, 5], [3, 2, 2]][i][cols[i]] for i in range(3)) == 5
```

## Testing against all permutations

```python
import random
from itertools import permutations

rnd = random.Random(1)
for _ in range(300):
    n = rnd.randint(1, 6)
    a = [[rnd.randint(0, 20) for _ in range(n)] for _ in range(n)]
    cost, cols = assignment(a)
    best = min(sum(a[i][p[i]] for i in range(n)) for p in permutations(range(n)))
    assert cost == best
    assert sorted(cols) == list(range(n)) and sum(a[i][cols[i]] for i in range(n)) == cost
```

## Remarks

- For a **maximization** version, negate the costs (the algorithm handles negative costs).
- If only some assignments are allowed, add only those edges; then the flow may be smaller than $N$ (there is no perfect assignment).
- If costs depend on both sides and the number of workers and jobs differ, keep the network as it is with $N$ and $M$ vertices on the two sides, and send $\min(N, M)$ units of flow.
