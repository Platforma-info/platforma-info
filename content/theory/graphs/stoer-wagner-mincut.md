---
title: "Global Minimum Cut: Stoer-Wagner"
section: Flows and matchings
order: 13
difficulty: advanced
summary: "Find the minimum-weight cut of an undirected graph without any flow: run maximum-adjacency orderings and merge the last two vertices of each phase, in O(n³)."
tags: [minimum cut, stoer-wagner, global min cut, merging vertices]
prerequisites: [graphs/prim-mst, graphs/maximum-flow]
source:
  title: "Minimum cut - Stoer-Wagner algorithm"
  url: https://cp-algorithms.com/graph/stoer_wagner_mincut.html
  license: CC BY-SA 4.0
---

## Problem

Given an undirected weighted graph with $n$ vertices, a **cut** $C$ is a non-empty proper subset of the vertices (a partition of the vertices into two non-empty sets). Its **weight** is the sum of the weights of the edges with exactly one endpoint in $C$:

$$
w(C) = \sum_{\substack{(v,u)\in E\\ u\in C,\ v\notin C}} c(v,u)
$$

Find a cut of **minimum weight**. This is the **global minimum cut**, in contrast to the $s$-$t$ minimum cut (which needs a fixed source and sink). It equals the smallest $s$-$t$ cut over all pairs, so it could be solved with $O(n^2)$ maximum-flow computations; the algorithm of Stoer and Wagner (1994) is much simpler and faster. (It is also the algorithm for the [edge connectivity](/theory/graphs/edge-vertex-connectivity) of a graph.)

Loops do not influence the answer and parallel edges can be replaced by one edge with the combined weight, so assume none.

## Algorithm

**Basic idea.** Repeat: find the minimum cut between *some* pair of vertices $s$ and $t$, then **merge** $s$ and $t$ into a single vertex. After $n - 1$ merges one vertex remains; the answer is the smallest of the $n-1$ cuts found. Correct because for each pair $(s, t)$ either the min $s$-$t$ cut is the global minimum cut, or the global minimum cut doesn't separate $s$ and $t$, and then merging them loses nothing.

So we need the minimum cut between **some** pair $s,t$, and the trick is that we don't choose them freely:

1. Start with a set $A$ containing one arbitrary vertex.
2. Repeatedly add to $A$ the vertex **most strongly connected** to $A$, the vertex $v \notin A$ maximizing
$$
w(v, A) = \sum_{u\in A}c(v,u)
$$
(this resembles Prim's algorithm).
3. Let $s$ be the second-to-last and $t$ the last vertex added. **The Stoer–Wagner theorem:** a minimum $s$-$t$ cut consists of the single vertex $t$; its weight is $w(t, A\setminus t)$, the total weight of the edges at $t$.

Record that cut, merge $s$ and $t$, and start the next phase. The algorithm has $n - 1$ phases.

**Complexity.** Finding the strongest vertex by a linear scan gives $O(n)$ per step, $O(n^2)$ per phase, $O(n^3)$ total. With a Fibonacci heap it is $O(nm + n^2\log n)$.

## Proof of the theorem

Let $A_v$ be the set $A$ right before $v$ is added, and let $C$ be any $s$-$t$ cut. Call a vertex $v$ **active** if it and the previously added vertex are on different sides of $C$, and let $C_v$ be the part of $C$'s edges inside $A_v\cup\{v\}$. We claim that for every active vertex $v$

$$
w(v, A_v) \le w(C_v)
$$

For $t$ (it is active since $s$ was added right before it and $s,t$ are on opposite sides) this reads $w(\{t\}) \le w(C)$: the theorem.

*Induction.* For the first active vertex $v$, all of $A_v$ is on one side and $v$ on the other, so the inequality is an equality. Assume it for an active vertex $v$ and let $u$ be the next active vertex. Then
$$
w(u, A_u) = w(u, A_v) + w(u, A_u\setminus A_v)\le w(v, A_v) + w(u, A_u\setminus A_v) \le w(C_v) + w(u, A_u\setminus A_v)\le w(C_u)
$$
The first inequality holds because $v$ was chosen when the set was $A_v$, so it had the largest connectivity. The second is the induction hypothesis. The last: $u$ and all of $A_u\setminus A_v$ are on different sides of $C$, so $w(u, A_u\setminus A_v)$ counts edges of $C_u$ that were not yet in $C_v$.

## Implementation

With an adjacency matrix. The function copies the input, and returns the weight of the minimum cut and the vertices on one side of it.

```python
def stoer_wagner(weights):
    """weights: symmetric n x n matrix of non-negative edge weights (0 = no edge), n >= 2.
    Returns (weight of a minimum cut, the vertices on one side of it)."""
    n = len(weights)
    g = [row[:] for row in weights]
    groups = [[i] for i in range(n)]                    # the original vertices merged into each vertex
    exist = [True] * n
    best_cost, best_cut = float("inf"), []
    for phase in range(n - 1):
        in_a = [False] * n
        w = [0] * n
        prev = -1
        for step in range(n - phase):
            sel = -1
            for i in range(n):
                if exist[i] and not in_a[i] and (sel == -1 or w[i] > w[sel]):
                    sel = i
            if step == n - phase - 1:                   # the last vertex: cut of the phase
                if w[sel] < best_cost:
                    best_cost, best_cut = w[sel], groups[sel][:]
                groups[prev].extend(groups[sel])        # merge the last two vertices
                for i in range(n):
                    g[prev][i] += g[sel][i]
                    g[i][prev] = g[prev][i]
                exist[sel] = False
            else:
                in_a[sel] = True
                for i in range(n):
                    w[i] += g[sel][i]
                prev = sel
    return best_cost, best_cut

# two triangles (weights 3) joined by an edge of weight 1
W = [[0] * 6 for _ in range(6)]
for a, b, c in [(0, 1, 3), (1, 2, 3), (0, 2, 3), (3, 4, 3), (4, 5, 3), (3, 5, 3), (2, 3, 1)]:
    W[a][b] = W[b][a] = c
cost, cut = stoer_wagner(W)
assert cost == 1 and sorted(cut) in ([0, 1, 2], [3, 4, 5])
```

After merging, the diagonal entries `g[prev][prev]` accumulate garbage (the weight of the edge between the merged vertices), but they are never used: a vertex is not compared with itself since `in_a` marks it.

## Testing against all cuts

For small graphs, enumerate every non-empty proper subset of vertices:

```python
import random

def brute_min_cut(weights):
    n = len(weights)
    best = float("inf")
    for mask in range(1, (1 << n) - 1):
        cost = sum(weights[i][j] for i in range(n) for j in range(n) if mask >> i & 1 and not mask >> j & 1)
        best = min(best, cost)
    return best

rnd = random.Random(2)
for _ in range(300):
    n = rnd.randint(2, 8)
    W = [[0] * n for _ in range(n)]
    for i in range(n):
        for j in range(i + 1, n):
            if rnd.random() < 0.6:
                W[i][j] = W[j][i] = rnd.randint(1, 9)
    cost, cut = stoer_wagner(W)
    assert cost == brute_min_cut(W)
    side = set(cut)
    assert 0 < len(side) < n
    assert sum(W[i][j] for i in side for j in range(n) if j not in side) == cost      # the returned cut has that weight
```

## Literature

- M. Stoer, F. Wagner. *A Simple Min-Cut Algorithm.* Journal of the ACM 44(4), 1997.
- K. Mehlhorn, C. Uhrig. *The minimum cut algorithm of Stoer and Wagner.*
