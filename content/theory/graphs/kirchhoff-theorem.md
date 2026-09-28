---
title: "Kirchhoff's Theorem: Counting Spanning Trees"
section: Spanning trees
order: 5
difficulty: advanced
summary: "The number of spanning trees of a graph equals any cofactor of its Laplacian matrix, computed with a determinant; connections to Cayley's formula and electrical resistance."
tags: [spanning trees, laplacian matrix, determinant, matrix tree theorem, kirchhoff]
prerequisites: [linear-algebra/determinant-gauss, graphs/graph-basics]
source:
  title: "Kirchhoff's theorem. Finding the number of spanning trees"
  url: https://cp-algorithms.com/graph/kirchhoff-theorem.html
  license: CC BY-SA 4.0
---

**Problem.** Given a connected undirected graph (possibly with multiple edges), find the number of its different spanning trees. Kirchhoff proved in 1847 that this is a determinant.

## The matrix tree theorem

Let $A$ be the adjacency matrix: $A_{u,v}$ is the number of edges between $u$ and $v$. Let $D$ be the diagonal degree matrix, $D_{u,u} = \deg(u)$. The **Laplacian matrix** is

$$
L = D - A
$$

**Kirchhoff's theorem:** all cofactors of $L$ are equal, and each equals the number of spanning trees of the graph. The $(i,j)$ cofactor is $(-1)^{i+j}$ times the determinant of $L$ with row $i$ and column $j$ removed. So it is enough to delete the last row and last column and compute the determinant of the remaining $(n-1)\times(n-1)$ matrix. The determinant costs $O(n^3)$ with [Gaussian elimination](/theory/linear-algebra/determinant-gauss).

(Self-loops never belong to a spanning tree and cancel out in $D - A$, so they can simply be ignored. Parallel edges are counted separately: two trees using different copies of a parallel edge are different.)

## Implementation

Fractions make the elimination exact; for a large modulus-based answer, do the same elimination modulo a prime with modular inverses.

```python
from fractions import Fraction

def determinant(matrix):
    n = len(matrix)
    a = [[Fraction(x) for x in row] for row in matrix]
    det = Fraction(1)
    for col in range(n):
        pivot = next((r for r in range(col, n) if a[r][col] != 0), None)
        if pivot is None:
            return Fraction(0)
        if pivot != col:
            a[col], a[pivot] = a[pivot], a[col]
            det = -det
        det *= a[col][col]
        for r in range(col + 1, n):
            factor = a[r][col] / a[col][col]
            if factor:
                for c in range(col, n):
                    a[r][c] -= factor * a[col][c]
    return det

def laplacian(n, edges):
    lap = [[0] * n for _ in range(n)]
    for u, v in edges:
        if u != v:
            lap[u][u] += 1
            lap[v][v] += 1
            lap[u][v] -= 1
            lap[v][u] -= 1
    return lap

def count_spanning_trees(n, edges):
    if n == 1:
        return 1
    lap = laplacian(n, edges)
    minor = [row[:-1] for row in lap[:-1]]              # delete the last row and column
    return int(determinant(minor))

triangle = [(0, 1), (1, 2), (2, 0)]
assert count_spanning_trees(3, triangle) == 3
assert count_spanning_trees(4, [(0, 1), (1, 2), (2, 3), (3, 0)]) == 4          # a 4-cycle: remove one of 4 edges
assert count_spanning_trees(2, [(0, 1), (0, 1), (0, 1)]) == 3                  # three parallel edges
assert count_spanning_trees(4, [(0, 1), (2, 3)]) == 0                          # disconnected graph
```

## Cayley's formula as a special case

The complete graph $K_n$ has $n^{n-2}$ spanning trees (Cayley's formula; it also follows from the [Prüfer code](/theory/graphs/pruefer-code)).

```python
def complete_graph(n):
    return [(i, j) for i in range(n) for j in range(i + 1, n)]

for n in range(2, 9):
    assert count_spanning_trees(n, complete_graph(n)) == n ** (n - 2)
```

The theorem works for any deletion of a row and column, not just the last:

```python
lap = laplacian(4, complete_graph(4) + [(0, 1)])                                   # K4 plus a parallel edge 0-1
counts = set()
for i in range(4):
    for j in range(4):
        minor = [[lap[r][c] for c in range(4) if c != j] for r in range(4) if r != i]
        counts.add((-1) ** (i + j) * int(determinant(minor)))
assert len(counts) == 1 and counts.pop() == 24                                     # all cofactors are equal
```

## Testing by enumeration

For small multigraphs, count the spanning trees directly by trying every subset of $n-1$ edges:

```python
import random
from itertools import combinations

def brute_count(n, edges):
    edges = [(u, v) for u, v in edges if u != v]
    total = 0
    for subset in combinations(edges, n - 1):
        parent = list(range(n))

        def find(x):
            while parent[x] != x:
                parent[x] = parent[parent[x]]
                x = parent[x]
            return x

        ok = True
        for u, v in subset:
            a, b = find(u), find(v)
            if a == b:
                ok = False
                break
            parent[a] = b
        total += ok
    return total

rnd = random.Random(1)
for _ in range(400):
    n = rnd.randint(2, 6)
    edges = [(rnd.randrange(n), rnd.randrange(n)) for _ in range(rnd.randint(0, 10))]
    assert count_spanning_trees(n, edges) == brute_count(n, edges), (n, edges)
```

## Relation to electrical circuits

Kirchhoff's matrix tree theorem is closely related to his laws for electrical circuits. If $A_{i,j}$ is the **conductance** (inverse resistance) of the wire between $i$ and $j$ and $L = D - A$, then the resistance between two points $i$ and $j$ is

$$
R_{ij} = \frac{\left|L^{(i,j)}\right|}{\left|L^{j}\right|}
$$

where $L^j$ is $L$ with row and column $j$ deleted, and $L^{(i,j)}$ has both rows and columns $i$ and $j$ deleted. The theorem gives this formula a geometric meaning: the numerator counts spanning forests with two trees (separating $i$ and $j$), the denominator counts spanning trees.

```python
def effective_resistance(n, conductance, i, j):
    """conductance[u][v]: conductance of the wire u-v. Returns the resistance between i and j."""
    lap = [[-conductance[u][v] if u != v else 0 for v in range(n)] for u in range(n)]
    for u in range(n):
        lap[u][u] = sum(conductance[u][v] for v in range(n) if v != u)
    minor_j = [[lap[r][c] for c in range(n) if c != j] for r in range(n) if r != j]
    both = [[lap[r][c] for c in range(n) if c not in (i, j)] for r in range(n) if r not in (i, j)]
    numerator = determinant(both) if both else Fraction(1)
    return numerator / determinant(minor_j)

# three unit resistors forming a triangle: between two corners 1 in parallel with 2 gives 2/3
tri = [[0, 1, 1], [1, 0, 1], [1, 1, 0]]
assert effective_resistance(3, tri, 0, 1) == Fraction(2, 3)
# a path of two resistors of 1 and 2 ohm in series has resistance 3 (conductances 1 and 1/2)
path = [[0, 1, 0], [1, 0, Fraction(1, 2)], [0, Fraction(1, 2), 0]]
assert effective_resistance(3, path, 0, 2) == 3
```

## Practice problems

- [CODECHEF: Roads in Stars](https://www.codechef.com/problems/STARROAD)
- [SPOJ: Maze](http://www.spoj.com/problems/KPMAZE/)
- [CODECHEF: Complement Spanning Trees](https://www.codechef.com/problems/CSTREE)
