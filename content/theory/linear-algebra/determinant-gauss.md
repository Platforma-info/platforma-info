---
title: "Determinant by Gaussian Elimination"
section: Matrices
order: 2
difficulty: intermediate
summary: "Compute the determinant in O(n³) by triangularizing the matrix, exactly with fractions, modulo a prime, and with integers only using the Bareiss algorithm."
tags: [determinant, gauss, bareiss, matrices]
prerequisites: [linear-algebra/gaussian-elimination]
source:
  title: "Gauss & Determinant"
  url: https://cp-algorithms.com/linear_algebra/determinant-gauss.html
  license: CC BY-SA 4.0
---

The **determinant** of a square matrix $A$ is a single number that tells, among other things, whether $A$ is invertible ($\det A \ne 0$) and by how much the linear map scales volumes. The definition through permutations,

$$
\det A = \sum_{\sigma \in S_n} \operatorname{sgn}(\sigma) \prod_{i=1}^{n} a_{i,\sigma(i)}
$$

has $n!$ terms, and cofactor expansion is $O(n!)$ too. Gaussian elimination computes it in $O(n^3)$.

## Effect of row operations

- **Adding a multiple of one row to another** does not change the determinant.
- **Swapping two rows** multiplies the determinant by $-1$.
- **Multiplying a row by $c$** multiplies the determinant by $c$.
- The determinant of an **upper triangular** matrix is the product of its diagonal.

So reduce the matrix to upper triangular form using only row additions and swaps, keeping track of the sign changes; the determinant is then $\pm$ the product of the diagonal entries. If some column has no pivot, the matrix is singular and $\det = 0$.

## Exact computation with fractions

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
            if a[r][col] != 0:
                factor = a[r][col] / a[col][col]
                a[r] = [x - factor * y for x, y in zip(a[r], a[col])]
    return det

assert determinant([[1, 2], [3, 4]]) == -2
assert determinant([[2, 0, 0], [0, 3, 0], [0, 0, 4]]) == 24
assert determinant([[1, 2, 3], [4, 5, 6], [7, 8, 9]]) == 0                 # singular
assert determinant([[0, 1], [1, 0]]) == -1                                 # a row swap
assert determinant([[5]]) == 5 and determinant([]) == 1
```

## Verification with the definition

For small matrices compare with the permutation formula:

```python
import random
from itertools import permutations

def determinant_definition(matrix):
    n = len(matrix)
    total = 0
    for perm in permutations(range(n)):
        sign = 1
        seen = [False] * n
        for i in range(n):                          # sign of the permutation = (-1)^(n - number of cycles)
            if not seen[i]:
                j = i
                while not seen[j]:
                    seen[j] = True
                    j = perm[j]
                sign = -sign
        sign = sign if n % 2 == 0 else -sign
        term = sign
        for i in range(n):
            term *= matrix[i][perm[i]]
        total += term
    return total

random.seed(1)
for _ in range(300):
    n = random.randint(1, 6)
    a = [[random.randint(-4, 4) for _ in range(n)] for _ in range(n)]
    assert determinant(a) == determinant_definition(a)
```

## Modulo a prime

For counting problems (for example the number of spanning trees, by Kirchhoff's theorem) we need the determinant modulo $p$. Use modular inverses instead of division; everything stays in $[0, p)$:

```python
def determinant_mod(matrix, p):
    n = len(matrix)
    a = [[x % p for x in row] for row in matrix]
    det = 1
    for col in range(n):
        pivot = next((r for r in range(col, n) if a[r][col]), None)
        if pivot is None:
            return 0
        if pivot != col:
            a[col], a[pivot] = a[pivot], a[col]
            det = -det
        det = det * a[col][col] % p
        inv = pow(a[col][col], -1, p)
        for r in range(col + 1, n):
            if a[r][col]:
                factor = a[r][col] * inv % p
                a[r] = [(x - factor * y) % p for x, y in zip(a[r], a[col])]
    return det % p

P = 998244353
for _ in range(200):
    n = random.randint(1, 6)
    a = [[random.randint(-50, 50) for _ in range(n)] for _ in range(n)]
    assert determinant_mod(a, P) == determinant(a) % P
```

The result is exact modulo $p$, regardless of how large the true determinant is. Since $\det$ of an $n\times n$ integer matrix can have $O(n \log n)$ digits, computing it modulo a few primes and combining with the [Chinese Remainder Theorem](/theory/math/chinese-remainder-theorem) is a standard technique for the exact integer value.

## The Bareiss algorithm: integers only

Ordinary elimination introduces fractions even for an integer matrix. The **Bareiss** (fraction-free) algorithm keeps every intermediate entry an integer, and each entry is itself a determinant of a submatrix, so the numbers stay bounded by the size of the answer instead of exploding. It divides exactly by the previous pivot at each step:

$$
a_{ij}^{(k+1)} = \frac{a_{ij}^{(k)}\,a_{kk}^{(k)} - a_{ik}^{(k)}\,a_{kj}^{(k)}}{a_{k-1,k-1}^{(k-1)}}
$$

```python
def determinant_bareiss(matrix):
    n = len(matrix)
    if n == 0:
        return 1
    a = [list(row) for row in matrix]
    sign, prev = 1, 1
    for k in range(n - 1):
        if a[k][k] == 0:
            swap = next((r for r in range(k + 1, n) if a[r][k] != 0), None)
            if swap is None:
                return 0
            a[k], a[swap] = a[swap], a[k]
            sign = -sign
        for i in range(k + 1, n):
            for j in range(k + 1, n):
                a[i][j] = (a[i][j] * a[k][k] - a[i][k] * a[k][j]) // prev      # the division is exact
        prev = a[k][k]
    return sign * a[n - 1][n - 1]

assert determinant_bareiss([[1, 2], [3, 4]]) == -2
assert determinant_bareiss([[2, 3, 1], [4, 1, 2], [1, 5, 3]]) == -25          # 2(3-10) - 3(12-2) + 1(20-1)
for _ in range(300):
    n = random.randint(1, 7)
    a = [[random.randint(-9, 9) for _ in range(n)] for _ in range(n)]
    assert determinant_bareiss(a) == determinant(a)
big = [[(i * 7 + j * 13 + i * j) % 101 - 50 for j in range(12)] for i in range(12)]
assert determinant_bareiss(big) == determinant(big)
```

Because Python integers are unbounded, Bareiss gives the exact integer determinant of an integer matrix quickly, without the fraction overhead.

## Floating point

For real matrices use partial pivoting (largest entry in the column) and accept a small relative error; compare results with a tolerance, never with `==`. For ill-conditioned matrices the determinant can be a badly wrong number even when the algorithm is stable: prefer exact arithmetic when the data is exact.

## Applications

- **Number of spanning trees** of a graph (Kirchhoff's matrix-tree theorem): the determinant of the Laplacian with a row and column removed.
- **Cramer's rule**, area/volume of a parallelogram/parallelepiped, orientation tests in geometry.
- **Counting perfect matchings** in planar graphs and non-intersecting paths (Lindström-Gessel-Viennot).
- **Checking invertibility** and **polynomial identity testing** (Schwartz-Zippel with a random evaluation).

## Practice problems

- [Codeforces - Wizards and Bets](http://codeforces.com/contest/167/problem/E)
