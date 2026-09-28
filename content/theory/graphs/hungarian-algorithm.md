---
title: "The Hungarian Algorithm for the Assignment Problem"
section: Flows and matchings
order: 14
difficulty: advanced
summary: "Solve the assignment problem in O(n²m) with potentials on rows and columns, maintained by growing an alternating tree; a 20-line implementation."
tags: [assignment problem, hungarian algorithm, potentials, bipartite matching, weighted matching]
prerequisites: [graphs/kuhn-matching, graphs/assignment-problem-min-flow]
source:
  title: "Hungarian algorithm for solving the assignment problem"
  url: https://cp-algorithms.com/graph/hungarian-algorithm.html
  license: CC BY-SA 4.0
---

## The assignment problem

There are several equivalent formulations:

- $n$ jobs and $n$ workers; each worker names a price for each job; assign one job to each worker minimizing the total price.
- Given an $n\times n$ matrix $A$, choose one number from each row and each column, with minimum sum.
- Find a permutation $p$ of length $n$ minimizing $\sum_i A[i][p[i]]$.
- Find a perfect matching of minimum total weight in a complete bipartite graph.

A "rectangular" version ($n \le m$: choose $n$ cells in different rows and columns) reduces to the square case by adding dummy rows or columns, and *maximizing* is the same as minimizing after multiplying all numbers by $-1$.

The **Hungarian algorithm** (Kuhn, 1955; based on Egerváry and, as was discovered later, on work of Jacobi from the 19th century; Edmonds–Karp and Tomizawa made it $O(n^3)$) solves it in $O(n^3)$, or $O(n^2m)$ for the rectangular case. The [min-cost-flow version](/theory/graphs/assignment-problem-min-flow) is easier to derive but slower.

## Potentials

A **potential** is a pair of arrays $u[1..n]$, $v[1..m]$ with

$$
u[i] + v[j] \le A[i][j]\quad\text{for all } i, j
$$

Its **value** is $f = \sum u[i] + \sum v[j]$.

**Lemma.** The cost of any solution is at least $f$. (A solution consists of $n$ cells in distinct rows and columns; summing $u[i]+v[j]\le A[i][j]$ over them gives $f$ on the left.)

So if we find a solution whose cost equals the value of some potential, it is **optimal**. The algorithm builds such a pair.

Call an edge $(i,j)$ **rigid** if $u[i]+v[j] = A[i][j]$. The algorithm keeps a maximum matching $M$ in the graph $H$ of rigid edges. When $M$ has $n$ edges, it is a solution of cost $f$.

## The $O(n^4)$ algorithm

1. Start with $u = v = 0$ and an empty matching.
2. Without changing the potential, try to enlarge $M$ by one edge with [Kuhn's algorithm](/theory/graphs/kuhn-matching) (an augmenting path in $H$).
3. If there is no augmenting path, let $Z_1, Z_2$ be the sets of left and right vertices visited by the last search, and let
$$
\Delta = \min_{i\in Z_1,\ j\notin Z_2}\big(A[i][j] - u[i] - v[j]\big) > 0
$$
Then set $u[i] \mathrel{+}= \Delta$ for $i \in Z_1$ and $v[j] \mathrel{-}= \Delta$ for $j\in Z_2$.

The new potential is still valid, all edges of $M$ remain rigid, and at least one new vertex becomes reachable (the edge that achieved the minimum becomes rigid). So at most $n$ recalculations happen before the matching can be enlarged, giving $O(n)$ enlargements $\times$ $O(n)$ recalculations $\times$ $O(n^2)$ each $= O(n^4)$.

## The $O(n^3)$ algorithm

Process the rows **one at a time**. For each new row, repeat until an augmenting path from it is found:

- pick the not-yet-visited column with the smallest reduced value `minv[j]` (the smallest of $A[i][j] - u[i] - v[j]$ over visited rows $i$) and recompute the potentials by that amount $\Delta$; this makes the edge to that column rigid;
- if that column is free, an augmenting path is found; otherwise, its matched row becomes visited, and `minv` is updated with that row.

The arrays `minv` (for each column) and `way` (the previous column on the path) let us do each iteration in $O(m)$; a row needs at most $O(n)$ iterations, so the whole algorithm is $O(n^2m)$.

## Implementation

This is the concise implementation of Andrey Lopatin. Arrays are 1-indexed with a dummy row $0$ and column $0$ to avoid special cases. `p[j]` is the row matched to column $j$ (`p[0]` is the current row).

```python
INF = float("inf")

def hungarian(a):
    """Minimum-cost assignment of every row of the n x m matrix a (n <= m) to a distinct column.

    Returns (minimum cost, list with the column chosen for every row)."""
    n, m = len(a), len(a[0])
    assert n <= m
    u = [0] * (n + 1)
    v = [0] * (m + 1)
    p = [0] * (m + 1)                    # p[j]: the row matched to column j (1-based); 0 if the column is free
    way = [0] * (m + 1)
    for i in range(1, n + 1):
        p[0] = i
        j0 = 0
        minv = [INF] * (m + 1)
        used = [False] * (m + 1)
        while True:
            used[j0] = True
            i0, delta, j1 = p[j0], INF, 0
            for j in range(1, m + 1):
                if not used[j]:
                    cur = a[i0 - 1][j - 1] - u[i0] - v[j]
                    if cur < minv[j]:
                        minv[j], way[j] = cur, j0
                    if minv[j] < delta:
                        delta, j1 = minv[j], j
            for j in range(m + 1):
                if used[j]:
                    u[p[j]] += delta
                    v[j] -= delta
                else:
                    minv[j] -= delta
            j0 = j1
            if p[j0] == 0:
                break
        while j0:                         # follow the augmenting path back and flip it
            j1 = way[j0]
            p[j0] = p[j1]
            j0 = j1
    answer = [0] * n
    for j in range(1, m + 1):
        if p[j]:
            answer[p[j] - 1] = j - 1
    return -v[0], answer

cost, cols = hungarian([[4, 1, 3], [2, 0, 5], [3, 2, 2]])
assert cost == 5 and sorted(cols) == [0, 1, 2]
cost, cols = hungarian([[1, 2, 3, 4], [4, 3, 2, 1]])              # rectangular: 2 rows, 4 columns
assert cost == 2 and cols == [0, 3]
```

The total cost is `-v[0]`: it accumulates the sum of all the $\Delta$ values, which is the total change in the potential value. Nothing in the algorithm requires the matrix to be non-negative.

## Testing

Against brute force over all injective assignments (square and rectangular matrices, negative numbers included), and against the min-cost-flow solution:

```python
import random
from itertools import permutations

rnd = random.Random(1)
for _ in range(500):
    n = rnd.randint(1, 5)
    m = rnd.randint(n, 7)
    a = [[rnd.randint(-10, 30) for _ in range(m)] for _ in range(n)]
    cost, cols = hungarian(a)
    best = min(sum(a[i][p[i]] for i in range(n)) for p in permutations(range(m), n))
    assert cost == best
    assert len(set(cols)) == n and sum(a[i][cols[i]] for i in range(n)) == cost

# a bigger matrix runs comfortably fast: O(n^3)
big = [[rnd.randint(0, 10 ** 6) for _ in range(150)] for _ in range(150)]
cost, cols = hungarian(big)
assert sorted(cols) == list(range(150)) and sum(big[i][cols[i]] for i in range(150)) == cost
```

For a maximum-weight assignment, pass the negated matrix. For a "forbidden pair", use a very large finite number instead of infinity so that the potentials stay finite.

## Related

- The [flow-based solution](/theory/graphs/assignment-problem-min-flow) is more flexible (constraints, partial assignments) but slower.
- If only the *existence* of a perfect matching matters, [Kuhn's algorithm](/theory/graphs/kuhn-matching) or [Dinic on a unit network](/theory/graphs/dinic) is enough.
- `scipy.optimize.linear_sum_assignment` implements this problem in C; use it when third-party libraries are allowed.

## Practice problems

- [UVA - Crime Wave - The Sequel](http://uva.onlinejudge.org/index.php?option=com_onlinejudge&Itemid=8&page=show_problem&problem=1687)
- [UVA - Warehouse](http://uva.onlinejudge.org/index.php?option=com_onlinejudge&Itemid=8&page=show_problem&problem=1829)
- [SGU - Beloved Sons](http://acm.sgu.ru/problem.php?contest=0&problem=210)
- [UVA - The Great Wall Game](http://livearchive.onlinejudge.org/index.php?option=com_onlinejudge&Itemid=8&page=show_problem&problem=1277)
- [UVA - Jogging Trails](http://uva.onlinejudge.org/index.php?option=com_onlinejudge&Itemid=8&page=show_problem&problem=1237)
