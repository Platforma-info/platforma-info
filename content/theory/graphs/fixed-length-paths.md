---
title: "Paths of Fixed Length: Matrix Exponentiation"
section: Shortest paths
order: 7
difficulty: advanced
summary: "Count the walks of exactly k edges with the k-th power of the adjacency matrix, and find the shortest walks with exactly k edges with a (min, +) matrix power."
tags: [matrix exponentiation, adjacency matrix, walks, min-plus, tropical semiring]
prerequisites: [math/binary-exponentiation, graphs/graph-basics]
source:
  title: "Number of paths of fixed length / Shortest paths of fixed length"
  url: https://cp-algorithms.com/graph/fixed_length_paths.html
  license: CC BY-SA 4.0
---

Two problems with the same idea: turn the graph into a matrix, and compute a **matrix power** with binary exponentiation, either in the usual arithmetic or in a modified one.

## Number of walks of length $k$

Given a directed unweighted graph with $n$ vertices and an integer $k$, count for every pair $(i, j)$ the number of walks (paths in which vertices and edges may repeat) from $i$ to $j$ with exactly $k$ edges.

Let $G$ be the adjacency matrix: $G[i][j]$ is the number of edges from $i$ to $j$ (this handles multiple edges and loops too). For $k = 1$, the answer is $G$ itself. Suppose $C_k$ is the answer for $k$. A walk with $k+1$ edges is a walk with $k$ edges followed by one more edge:

$$
C_{k+1}[i][j] = \sum_{p} C_k[i][p]\cdot G[p][j]\quad\Longleftrightarrow\quad C_{k+1} = C_k\cdot G
$$

So $C_k = G^k$. With [binary exponentiation](/theory/math/binary-exponentiation), the matrix power takes $O(n^3\log k)$.

```python
def mat_mul(a, b, mod=None):
    n, m, p = len(a), len(b), len(b[0])
    result = [[0] * p for _ in range(n)]
    for i in range(n):
        row_a, row_r = a[i], result[i]
        for k in range(m):
            x = row_a[k]
            if x:
                row_b = b[k]
                for j in range(p):
                    row_r[j] += x * row_b[j]
        if mod:
            result[i] = [x % mod for x in row_r]
    return result

def identity(n):
    return [[int(i == j) for j in range(n)] for i in range(n)]

def mat_pow(g, k, mod=None):
    result, base = identity(len(g)), g
    while k:
        if k & 1:
            result = mat_mul(result, base, mod)
        base = mat_mul(base, base, mod)
        k >>= 1
    return result

# a triangle 0 -> 1 -> 2 -> 0: after k steps you are k mod 3 vertices ahead
tri = [[0, 1, 0], [0, 0, 1], [1, 0, 0]]
assert mat_pow(tri, 3) == identity(3) and mat_pow(tri, 4) == tri
# Fibonacci numbers count walks of length k in the "no two consecutive ones" graph
fib = [[1, 1], [1, 0]]
assert mat_pow(fib, 10)[0][1] == 55
```

The answers can be huge, so problems usually ask for them modulo a prime: pass `mod`. Python integers make the exact answers possible too, for moderate $k$.

### Checking with a DP

The same numbers come from a simple DP over the number of steps ($O(k\,n\,m)$, fine for small $k$), and for tiny graphs from explicit enumeration of all walks:

```python
import random
from itertools import product

def walks_dp(g, k):
    n = len(g)
    cur = identity(n)
    for _ in range(k):
        cur = [[sum(cur[i][p] * g[p][j] for p in range(n)) for j in range(n)] for i in range(n)]
    return cur

def walks_brute(g, k):
    n = len(g)
    count = [[0] * n for _ in range(n)]
    for path in product(range(n), repeat=k + 1):
        ways = 1
        for a, b in zip(path, path[1:]):
            ways *= g[a][b]
        count[path[0]][path[-1]] += ways
    return count

rnd = random.Random(1)
for _ in range(200):
    n = rnd.randint(1, 4)
    g = [[rnd.choice([0, 0, 1, 2]) for _ in range(n)] for _ in range(n)]      # multiple edges and loops allowed
    k = rnd.randint(1, 5)
    assert mat_pow(g, k) == walks_dp(g, k) == walks_brute(g, k)
assert mat_pow(fib, 90)[0][1] == 2880067194370816120                          # exact big numbers work too
```

## Shortest walks with exactly $k$ edges

Now the graph is weighted: $G[i][j]$ is the length of the edge $i \to j$ (or $\infty$ if there is none). For each pair, find the length of the shortest walk with exactly $k$ edges. The same reasoning gives

$$
L_{k+1}[i][j] = \min_{p}\big(L_k[i][p] + G[p][j]\big)
$$

It is a matrix product in which the inner operation is **addition** and the outer one is **minimum**, instead of multiplication and addition. This "$(\min,+)$" product $\odot$ is associative, so

$$
L_k = G^{\odot k}
$$

is computed with binary exponentiation in $O(n^3\log k)$ as well. (The set of numbers with $\min$ and $+$ is called the *tropical semiring*.)

```python
INF = float("inf")

def minplus_mul(a, b):
    n, m, p = len(a), len(b), len(b[0])
    result = [[INF] * p for _ in range(n)]
    for i in range(n):
        for k in range(m):
            x = a[i][k]
            if x != INF:
                for j in range(p):
                    y = x + b[k][j]
                    if y < result[i][j]:
                        result[i][j] = y
    return result

def minplus_identity(n):
    return [[0 if i == j else INF for j in range(n)] for i in range(n)]

def minplus_pow(g, k):
    result, base = minplus_identity(len(g)), g
    while k:
        if k & 1:
            result = minplus_mul(result, base)
        base = minplus_mul(base, base)
        k >>= 1
    return result

g = [[INF, 2, 9], [INF, INF, 3], [1, INF, INF]]
assert minplus_pow(g, 1) == g
assert minplus_pow(g, 2)[0][2] == 5                    # 0 -> 1 -> 2
assert minplus_pow(g, 3)[0][0] == 6                    # 0 -> 1 -> 2 -> 0
assert minplus_pow(g, 2)[0][0] == 10                 # 0 -> 2 -> 0
assert minplus_pow(g, 2)[0][1] == INF                  # no walk with exactly 2 edges from 0 to 1
```

Test against a DP over the number of steps and against brute-force enumeration:

```python
def shortest_walks_dp(g, k):
    n = len(g)
    cur = minplus_identity(n)
    for _ in range(k):
        cur = [[min(cur[i][p] + g[p][j] for p in range(n)) for j in range(n)] for i in range(n)]
    return cur

def shortest_walks_brute(g, k):
    n = len(g)
    best = [[INF] * n for _ in range(n)]
    for path in product(range(n), repeat=k + 1):
        total = sum(g[a][b] for a, b in zip(path, path[1:]))
        best[path[0]][path[-1]] = min(best[path[0]][path[-1]], total)
    return best

for _ in range(200):
    n = rnd.randint(1, 4)
    g = [[rnd.choice([INF, INF, rnd.randint(1, 9)]) for _ in range(n)] for _ in range(n)]
    k = rnd.randint(1, 5)
    assert minplus_pow(g, k) == shortest_walks_dp(g, k) == shortest_walks_brute(g, k)
```

## Walks with *at most* $k$ edges

For paths with **at most** $k$ edges, modify the graph: for each vertex $v$ add a twin $v'$, the edge $v \to v'$ and a loop $v' \to v'$ (of weight $0$ for the shortest-path version). A walk from $i$ to $j$ with $m \le k$ edges then corresponds to a walk from $i$ to $j'$ with exactly $k + 1$ edges: follow the original walk, step to $j'$ and stay there by using the loop.

```python
def count_at_most(g, k):
    n = len(g)
    big = [[0] * (2 * n) for _ in range(2 * n)]
    for i in range(n):
        for j in range(n):
            big[i][j] = g[i][j]
        big[i][n + i] = 1                               # v -> v'
        big[n + i][n + i] = 1                           # loop at v'
    powered = mat_pow(big, k + 1)
    return [[powered[i][n + j] for j in range(n)] for i in range(n)]

def shortest_at_most(g, k):
    n = len(g)
    big = [[INF] * (2 * n) for _ in range(2 * n)]
    for i in range(n):
        for j in range(n):
            big[i][j] = g[i][j]
        big[i][n + i] = 0
        big[n + i][n + i] = 0
    powered = minplus_pow(big, k + 1)
    return [[powered[i][n + j] for j in range(n)] for i in range(n)]

for _ in range(100):
    n = rnd.randint(1, 4)
    g = [[rnd.choice([0, 0, 1]) for _ in range(n)] for _ in range(n)]
    k = rnd.randint(1, 4)
    # walks with at most k edges: sum of the walks with 0, 1, ..., k edges
    total = [[sum(mat_pow(g, t)[i][j] for t in range(k + 1)) for j in range(n)] for i in range(n)]
    assert count_at_most(g, k) == total
    w = [[rnd.choice([INF, INF, rnd.randint(1, 9)]) for _ in range(n)] for _ in range(n)]
    best = [[min(minplus_pow(w, t)[i][j] for t in range(k + 1)) for j in range(n)] for i in range(n)]
    assert shortest_at_most(w, k) == best
```

(In the last check `minplus_pow(w, 0)` is the identity, giving the zero-length walk from a vertex to itself.)

## Remarks

- For sparse graphs with small $k$, a direct DP is cheaper: $O(k(n+m))$ for counting walks from a single source.
- The same $(\min,+)$ trick with `max` gives longest walks; with Boolean matrices ($\lor$, $\land$) it answers "is there a walk of length exactly $k$?".
- For large matrices use `numpy` (with `dtype=object` only when exact big integers are needed, and modular arithmetic otherwise).
