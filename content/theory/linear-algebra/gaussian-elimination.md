---
title: "Gaussian Elimination: Solving Linear Systems"
section: Matrices
order: 1
difficulty: intermediate
summary: "Solve a system of linear equations in O(n³): pivoting, the degenerate cases (no solution, infinitely many), exact arithmetic with fractions, modular systems and GF(2) systems with bitmasks."
tags: [gauss, linear systems, elimination, modular, gf2]
prerequisites: [python-basics/lists-and-tuples, math/modular-inverse]
source:
  title: "Gauss method for solving system of linear equations"
  url: https://cp-algorithms.com/linear_algebra/linear-system-gauss.html
  license: CC BY-SA 4.0
---

A **system of linear equations** with $m$ equations and $n$ unknowns is

$$
\begin{cases}
a_{11}x_1 + a_{12}x_2 + \dots + a_{1n}x_n = b_1 \\
\quad\vdots \\
a_{m1}x_1 + a_{m2}x_2 + \dots + a_{mn}x_n = b_m
\end{cases}
\qquad\text{or}\qquad A x = b
$$

**Gaussian elimination** solves it (or shows that there is no solution, or reports that there are infinitely many) in $O(\min(m,n)\cdot mn)$, i.e. $O(n^3)$ for a square system.

## The method

Work with the **augmented matrix** $(A \mid b)$ and apply elementary row operations that do not change the solution set: swap two rows, multiply a row by a non-zero number, add a multiple of one row to another.

1. Go through the columns left to right. In column $c$, look for a **pivot**: a row (among the not yet used ones) with a non-zero entry in this column. If there is none, the variable $x_c$ is **free**; move on.
2. Swap the pivot row into position, then subtract suitable multiples of it from **all other rows** so that column $c$ becomes zero everywhere except at the pivot (this is the *Gauss-Jordan* variant, which leaves a matrix where each pivot column has a single non-zero entry).
3. After the last column, every row is either a pivot row $x_c = \text{(rhs)} - \sum_{\text{free}} \dots$ or a row of zeros. A zero row with a **non-zero right-hand side** means $0 = b \ne 0$: the system is **inconsistent**.

If every variable has a pivot, the solution is unique. Otherwise, each free variable can take any value and the pivot variables follow from them: **infinitely many** solutions.

### Choosing the pivot

With real (floating-point) numbers pick the row with the **largest absolute value** in the column (*partial pivoting*): dividing by a tiny number magnifies rounding errors. With exact arithmetic (fractions, modular) any non-zero entry works.

## Exact arithmetic with fractions

`fractions.Fraction` makes elimination exact, so we can test the algorithm precisely and report degenerate cases reliably. The function returns the status and one particular solution (free variables set to zero); the second result is the list of free variable indices.

```python
from fractions import Fraction

NO_SOLUTION, UNIQUE, INFINITE = 0, 1, 2

def gauss(matrix, rhs):
    """Solve A x = b exactly. Return (status, solution, free_variables)."""
    m, n = len(matrix), len(matrix[0])
    a = [[Fraction(x) for x in row] + [Fraction(rhs[i])] for i, row in enumerate(matrix)]
    where = [-1] * n                                   # row that holds the pivot of each column
    row = 0
    for col in range(n):
        if row == m:
            break
        pivot = next((r for r in range(row, m) if a[r][col] != 0), None)
        if pivot is None:
            continue
        a[row], a[pivot] = a[pivot], a[row]
        where[col] = row
        inv = 1 / a[row][col]
        a[row] = [x * inv for x in a[row]]                # make the pivot 1
        for r in range(m):
            if r != row and a[r][col] != 0:
                factor = a[r][col]
                a[r] = [x - factor * y for x, y in zip(a[r], a[row])]
        row += 1
    solution = [Fraction(0)] * n
    for col in range(n):
        if where[col] != -1:
            solution[col] = a[where[col]][n]
    for r in range(m):                                  # rows of zeros with a non-zero right-hand side
        if all(x == 0 for x in a[r][:n]) and a[r][n] != 0:
            return NO_SOLUTION, None, []
    free = [col for col in range(n) if where[col] == -1]
    return (INFINITE if free else UNIQUE), solution, free

status, x, free = gauss([[2, 1, -1], [-3, -1, 2], [-2, 1, 2]], [8, -11, -3])
assert status == UNIQUE and x == [2, 3, -1]                        # the classic example

status, x, free = gauss([[1, 1], [2, 2]], [2, 5])
assert status == NO_SOLUTION                                       # parallel lines

status, x, free = gauss([[1, 1], [2, 2]], [2, 4])
assert status == INFINITE and free == [1]                          # x0 = 2 - x1
assert x[0] + x[1] == 2
```

## Testing on random systems

Build systems with a *known* solution and check that the algorithm satisfies them; add a contradictory row to force "no solution".

```python
import random

def residual_zero(matrix, rhs, x):
    return all(sum(a * b for a, b in zip(row, x)) == r for row, r in zip(matrix, rhs))

random.seed(1)
for _ in range(400):
    m, n = random.randint(1, 6), random.randint(1, 6)
    A = [[random.randint(-3, 3) for _ in range(n)] for _ in range(m)]
    x0 = [random.randint(-5, 5) for _ in range(n)]
    b = [sum(a * v for a, v in zip(row, x0)) for row in A]
    status, x, free = gauss(A, b)
    assert status in (UNIQUE, INFINITE)
    assert residual_zero(A, b, x)                                   # the returned vector really solves it
    if status == UNIQUE:
        assert x == x0                                              # and is the only solution
    # a duplicated equation with a different right-hand side is inconsistent
    A2, b2 = A + [A[0]], b + [b[0] + 1]
    assert gauss(A2, b2)[0] == NO_SOLUTION
```

## Floating-point version

With real coefficients use a tolerance `EPS` to decide "is zero" and partial pivoting:

```python
EPS = 1e-9

def gauss_float(matrix, rhs):
    m, n = len(matrix), len(matrix[0])
    a = [list(map(float, row)) + [float(rhs[i])] for i, row in enumerate(matrix)]
    where = [-1] * n
    row = 0
    for col in range(n):
        if row == m:
            break
        pivot = max(range(row, m), key=lambda r: abs(a[r][col]))       # partial pivoting
        if abs(a[pivot][col]) < EPS:
            continue
        a[row], a[pivot] = a[pivot], a[row]
        where[col] = row
        for r in range(m):
            if r != row:
                factor = a[r][col] / a[row][col]
                if factor:
                    a[r] = [x - factor * y for x, y in zip(a[r], a[row])]
        row += 1
    x = [a[where[c]][n] / a[where[c]][c] if where[c] != -1 else 0.0 for c in range(n)]
    for r in range(m):
        if all(abs(v) < EPS for v in a[r][:n]) and abs(a[r][n]) > EPS:
            return NO_SOLUTION, None
    return (INFINITE if -1 in where else UNIQUE), x

status, x = gauss_float([[2, 1, -1], [-3, -1, 2], [-2, 1, 2]], [8, -11, -3])
assert status == UNIQUE and all(abs(a - b) < 1e-9 for a, b in zip(x, [2, 3, -1]))
```

> [!WARNING]
> Floating-point elimination on ill-conditioned systems loses digits. If the problem has integer or rational data and asks for an exact answer, use `Fraction` (slower but exact) or work modulo a prime.

## Systems modulo a prime

Over the field $\mathbb{Z}_p$ (with $p$ prime) the same algorithm works: replace division by multiplication with the [modular inverse](/theory/math/modular-inverse). Every arithmetic operation is exact, so there's no tolerance and no rounding:

```python
def gauss_mod(matrix, rhs, p):
    m, n = len(matrix), len(matrix[0])
    a = [[x % p for x in row] + [rhs[i] % p] for i, row in enumerate(matrix)]
    where = [-1] * n
    row = 0
    for col in range(n):
        if row == m:
            break
        pivot = next((r for r in range(row, m) if a[r][col]), None)
        if pivot is None:
            continue
        a[row], a[pivot] = a[pivot], a[row]
        where[col] = row
        inv = pow(a[row][col], -1, p)
        a[row] = [x * inv % p for x in a[row]]
        for r in range(m):
            if r != row and a[r][col]:
                factor = a[r][col]
                a[r] = [(x - factor * y) % p for x, y in zip(a[r], a[row])]
        row += 1
    for r in range(m):
        if not any(a[r][:n]) and a[r][n]:
            return NO_SOLUTION, None
    x = [a[where[c]][n] if where[c] != -1 else 0 for c in range(n)]
    return (INFINITE if -1 in where else UNIQUE), x

p = 1_000_000_007
status, x = gauss_mod([[2, 1], [1, 3]], [5, 10], p)
assert status == UNIQUE and (2 * x[0] + x[1]) % p == 5 and (x[0] + 3 * x[1]) % p == 10

random.seed(2)
for _ in range(200):
    m, n = random.randint(1, 5), random.randint(1, 5)
    A = [[random.randrange(p) for _ in range(n)] for _ in range(m)]
    x0 = [random.randrange(p) for _ in range(n)]
    b = [sum(a * v for a, v in zip(row, x0)) % p for row in A]
    status, x = gauss_mod(A, b, p)
    assert status in (UNIQUE, INFINITE)
    assert all(sum(a * v for a, v in zip(row, x)) % p == r for row, r in zip(A, b))
```

The number of solutions modulo $p$ of a consistent system is $p^{\text{(number of free variables)}}$.

## Systems over GF(2) with bitmasks

When the coefficients are $0$ or $1$ and the equations are XORs (parity conditions, lights-out puzzles, linear codes), each row is a bit vector. Store a row as a Python integer: row operations become a single `^`, and one elimination step processes 64 or more columns at once.

Here each equation is an integer whose bit $j$ is the coefficient of $x_j$, and bit $n$ holds the right-hand side.

```python
def gauss_gf2(rows, n):
    """rows: list of ints; bits 0..n-1 are the coefficients, bit n is the right-hand side.
    Return (status, solution_bits, number_of_free_variables)."""
    rows = rows[:]
    pivot_row_of = {}
    used = 0
    for col in range(n):
        pivot = next((r for r in range(used, len(rows)) if rows[r] >> col & 1), None)
        if pivot is None:
            continue
        rows[used], rows[pivot] = rows[pivot], rows[used]
        for r in range(len(rows)):
            if r != used and rows[r] >> col & 1:
                rows[r] ^= rows[used]
        pivot_row_of[col] = used
        used += 1
    for r in range(used, len(rows)):
        if rows[r] == 1 << n:                                # 0 = 1
            return NO_SOLUTION, None, 0
    solution = 0
    for col, r in pivot_row_of.items():
        if rows[r] >> n & 1:
            solution |= 1 << col
    free = n - len(pivot_row_of)
    return (INFINITE if free else UNIQUE), solution, free

def brute_gf2(rows, n):
    return sum(all(bin(row & ((1 << n) - 1) & x).count("1") % 2 == (row >> n & 1) for row in rows)
               for x in range(1 << n))

random.seed(3)
for _ in range(300):
    n = random.randint(1, 8)
    rows = [random.getrandbits(n + 1) for _ in range(random.randint(1, 8))]
    status, solution, free = gauss_gf2(rows, n)
    count = brute_gf2(rows, n)
    if status == NO_SOLUTION:
        assert count == 0
    else:
        assert count == 2 ** free                             # 2^(free variables) solutions
        assert all(bin(row & ((1 << n) - 1) & solution).count("1") % 2 == (row >> n & 1) for row in rows)
```

The classic application is the **Lights Out** puzzle: pressing a button toggles it and its neighbours; each light gives an equation mod 2.

## Complexity

$O(n^2 m)$ arithmetic operations for $m$ equations and $n$ unknowns ($O(n^3)$ for a square system). With bitmasks over GF(2) it is $O(n^2 m / w)$ for a machine word (or big-integer) width $w$. For exact rational arithmetic the numbers can grow, so the cost of each operation grows too; modular arithmetic avoids that.

## Improving accuracy and speed

- **Choose pivots wisely** in floating point (largest entry in the column; sometimes also scaling rows).
- **Iterative refinement**: compute the residual $r = b - Ax$ and solve $A\,\delta = r$, then add the correction.
- **Early exit**: for a square system, if some column has no pivot, the matrix is singular.

## Practice problems

- [Spoj - Xor Maximization](http://www.spoj.com/problems/XMAX/)
- [Codechef - Knight Moving](https://www.codechef.com/SEP12/problems/KNGHTMOV)
- [Lightoj - Graph Coloring](http://lightoj.com/volume_showproblem.php?problem=1279)
- [UVA 12910 - Snakes and Ladders](https://uva.onlinejudge.org/index.php?option=com_onlinejudge&Itemid=8&page=show_problem&problem=4775)
- [TIMUS1042 Central Heating](http://acm.timus.ru/problem.aspx?space=1&num=1042)
- [TIMUS1766 Humpty Dumpty](http://acm.timus.ru/problem.aspx?space=1&num=1766)
- [TIMUS1266 Kirchhoff's Law](http://acm.timus.ru/problem.aspx?space=1&num=1266)
- [Codeforces - No game no life](https://codeforces.com/problemset/problem/1411/G)
