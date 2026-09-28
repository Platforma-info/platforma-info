---
title: "LU Decomposition and the Kraut Method"
section: Matrices
order: 3
difficulty: intermediate
summary: "Factor a matrix as A = L·U, read the determinant off the diagonal of U, and reuse the factors to solve many right-hand sides."
tags: [lu decomposition, determinant, kraut, doolittle, matrices]
prerequisites: [linear-algebra/determinant-gauss]
source:
  title: "Kraut & Determinant"
  url: https://cp-algorithms.com/linear_algebra/determinant-kraut.html
  license: CC BY-SA 4.0
---

The **Kraut method** (a variant of the Doolittle/Crout schemes) decomposes a matrix $A$ into a product

$$
A = L\,U
$$

where $L$ is **lower triangular** with ones on its diagonal and $U$ is **upper triangular**. Given the factors:

- $\det A = \prod_i U_{ii}$, since $\det L = 1$ and the determinant of a triangular matrix is the product of its diagonal;
- solving $A x = b$ costs only two triangular solves, $O(n^2)$: $L y = b$ by forward substitution, then $U x = y$ by back substitution.

So one $O(n^3)$ factorization serves any number of right-hand sides.

A matrix has such an LU decomposition **without row swaps** if and only if all its leading principal minors are non-zero. Otherwise use *partial pivoting* (below), which gives $PA = LU$ for a permutation matrix $P$.

## The formulas

Process the columns $j = 1, \dots, n$ in turn. For each column:

$$
U_{ij} = A_{ij} - \sum_{k=1}^{i-1} L_{ik} U_{kj} \quad (i = 1, \dots, j)
$$

$$
L_{ij} = \frac{1}{U_{jj}} \left( A_{ij} - \sum_{k=1}^{j-1} L_{ik} U_{kj} \right) \quad (i = j+1, \dots, n)
$$

The sums only reference entries already computed (rows above and columns to the left), which is why the order works. The total cost is $\approx \tfrac{2}{3}n^3$ operations.

```python
from fractions import Fraction

def lu_decompose(matrix):
    """Return (L, U) with A = L U and L unit lower triangular, using exact fractions.
    Raises ZeroDivisionError if a pivot is zero (a leading principal minor vanishes)."""
    n = len(matrix)
    A = [[Fraction(x) for x in row] for row in matrix]
    L = [[Fraction(int(i == j)) for j in range(n)] for i in range(n)]
    U = [[Fraction(0)] * n for _ in range(n)]
    for j in range(n):
        for i in range(j + 1):
            U[i][j] = A[i][j] - sum(L[i][k] * U[k][j] for k in range(i))
        for i in range(j + 1, n):
            L[i][j] = (A[i][j] - sum(L[i][k] * U[k][j] for k in range(j))) / U[j][j]
    return L, U

def mat_mul(A, B):
    return [[sum(A[i][k] * B[k][j] for k in range(len(B))) for j in range(len(B[0]))] for i in range(len(A))]

A = [[2, 3, 1], [4, 7, 5], [6, 18, 22]]
L, U = lu_decompose(A)
assert mat_mul(L, U) == [[Fraction(x) for x in row] for row in A]
assert all(L[i][i] == 1 for i in range(3)) and all(L[i][j] == 0 for i in range(3) for j in range(i + 1, 3))
assert all(U[i][j] == 0 for i in range(3) for j in range(i))

def determinant_lu(matrix):
    _, U = lu_decompose(matrix)
    det = Fraction(1)
    for i in range(len(U)):
        det *= U[i][i]
    return det

```

For this matrix $U$ has the diagonal $(2, 1, -8)$, so $\det A = 2\cdot 1\cdot(-8) = -16$:

```python
assert [U[i][i] for i in range(3)] == [2, 1, -8]
assert determinant_lu(A) == -16
```

## Partial pivoting: $PA = LU$

If a pivot is zero, or tiny in floating point, swap rows. Keeping the permutation gives $PA = LU$ and $\det A = \pm \prod U_{ii}$ with the sign of the permutation.

```python
def lu_pivot(matrix):
    """Return (perm, L, U, sign) with A[perm] = L U, using exact fractions and nonzero pivots."""
    n = len(matrix)
    a = [[Fraction(x) for x in row] for row in matrix]
    perm = list(range(n))
    sign = 1
    for k in range(n):
        pivot = next((r for r in range(k, n) if a[r][k] != 0), None)
        if pivot is None:
            raise ValueError("singular matrix")
        if pivot != k:
            a[k], a[pivot] = a[pivot], a[k]
            perm[k], perm[pivot] = perm[pivot], perm[k]
            sign = -sign
        for i in range(k + 1, n):
            a[i][k] /= a[k][k]                              # the multiplier is stored in place of L
            for j in range(k + 1, n):
                a[i][j] -= a[i][k] * a[k][j]
    L = [[a[i][j] if j < i else Fraction(int(i == j)) for j in range(n)] for i in range(n)]
    U = [[a[i][j] if j >= i else Fraction(0) for j in range(n)] for i in range(n)]
    return perm, L, U, sign

perm, L, U, sign = lu_pivot([[0, 1], [2, 3]])                # needs a swap
assert perm == [1, 0] and sign == -1
assert mat_mul(L, U) == [[2, 3], [0, 1]]
```

## Testing

Random matrices: the factors multiply back, and the determinant agrees with the definition-based computation.

```python
import random
from itertools import permutations

def determinant_definition(matrix):
    n = len(matrix)
    total = 0
    for perm_ in permutations(range(n)):
        inversions = sum(1 for i in range(n) for j in range(i + 1, n) if perm_[i] > perm_[j])
        term = -1 if inversions % 2 else 1
        for i in range(n):
            term *= matrix[i][perm_[i]]
        total += term
    return total

random.seed(1)
for _ in range(300):
    n = random.randint(1, 5)
    M = [[random.randint(-5, 5) for _ in range(n)] for _ in range(n)]
    if determinant_definition(M) == 0:
        continue
    perm, L, U, sign = lu_pivot(M)
    assert mat_mul(L, U) == [[Fraction(M[perm[i]][j]) for j in range(n)] for i in range(n)]
    det = Fraction(sign)
    for i in range(n):
        det *= U[i][i]
    assert det == determinant_definition(M)
```

## Solving systems with the factors

```python
def lu_solve(perm, L, U, b):
    n = len(b)
    pb = [Fraction(b[perm[i]]) for i in range(n)]
    y = [Fraction(0)] * n
    for i in range(n):                                       # forward substitution: L y = P b
        y[i] = pb[i] - sum(L[i][k] * y[k] for k in range(i))
    x = [Fraction(0)] * n
    for i in range(n - 1, -1, -1):                           # back substitution: U x = y
        x[i] = (y[i] - sum(U[i][k] * x[k] for k in range(i + 1, n))) / U[i][i]
    return x

M = [[2, 1, -1], [-3, -1, 2], [-2, 1, 2]]
perm, L, U, _ = lu_pivot(M)
assert lu_solve(perm, L, U, [8, -11, -3]) == [2, 3, -1]
assert lu_solve(perm, L, U, [1, 0, 0]) != lu_solve(perm, L, U, [0, 1, 0])     # a second right-hand side, no refactoring
```

## Matrix inverse

The inverse is obtained by solving $A x = e_j$ for each unit vector $e_j$; each solve is $O(n^2)$, so the inverse costs $O(n^3)$ in total (the same as one multiplication). In practice you almost never need the inverse: solve the system directly.

## Comparison

| | Gauss-Jordan | LU (Kraut) |
|---|---|---|
| one system | $O(n^3)$ | $O(n^3)$ |
| many right-hand sides | $O(n^3)$ each | $O(n^3)$ once, then $O(n^2)$ each |
| determinant | product of pivots | product of $U$'s diagonal |
| numerical stability | with partial pivoting | with partial pivoting |

The original article's Java code uses scaling (dividing each row by its largest entry) and pivoting for numerical safety; with exact `Fraction` arithmetic neither is needed.
