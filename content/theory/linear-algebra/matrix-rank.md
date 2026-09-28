---
title: "Rank of a Matrix"
section: Matrices
order: 4
difficulty: intermediate
summary: "Find the rank of a matrix by elimination, exactly, modulo a prime and over GF(2) with an XOR basis."
tags: [rank, linear independence, xor basis, gauss]
prerequisites: [linear-algebra/gaussian-elimination]
source:
  title: "Rank of a matrix"
  url: https://cp-algorithms.com/linear_algebra/rank-matrix.html
  license: CC BY-SA 4.0
---

The **rank** of an $m \times n$ matrix is the maximum number of linearly independent rows (equivalently, columns). It equals the dimension of the space spanned by the rows, and is the number of pivots produced by Gaussian elimination. Facts worth remembering:

- $\operatorname{rank}(A) = \operatorname{rank}(A^T) \le \min(m, n)$;
- a square matrix is invertible iff its rank equals its size (iff $\det \ne 0$);
- $\operatorname{rank}(AB) \le \min(\operatorname{rank} A, \operatorname{rank} B)$;
- the linear system $Ax = b$ is consistent iff $\operatorname{rank}(A) = \operatorname{rank}(A \mid b)$, and then has $n - \operatorname{rank}(A)$ free variables.

## Algorithm

Run [Gaussian elimination](/theory/linear-algebra/gaussian-elimination) but only count the pivots: for each column find a row (not used yet) with a non-zero entry, use it to clear that column in the rows below, and increment the rank. Time $O(\min(m,n)\cdot mn)$.

### Exactly, with fractions

```python
from fractions import Fraction

def rank(matrix):
    a = [[Fraction(x) for x in row] for row in matrix]
    m = len(a)
    n = len(a[0]) if m else 0
    r = 0
    for col in range(n):
        if r == m:
            break
        pivot = next((i for i in range(r, m) if a[i][col] != 0), None)
        if pivot is None:
            continue
        a[r], a[pivot] = a[pivot], a[r]
        for i in range(r + 1, m):
            if a[i][col] != 0:
                factor = a[i][col] / a[r][col]
                a[i] = [x - factor * y for x, y in zip(a[i], a[r])]
        r += 1
    return r

assert rank([[1, 2, 3], [4, 5, 6], [7, 8, 9]]) == 2
assert rank([[1, 0], [0, 1]]) == 2
assert rank([[0, 0], [0, 0]]) == 0
assert rank([[1, 2, 3, 4]]) == 1 and rank([[1], [2], [3]]) == 1
assert rank([]) == 0
```

### Modulo a prime

Exact and fast, since all values stay below $p$. The rank over $\mathbb{Z}_p$ can be smaller than the rank over the rationals only when $p$ divides certain minors; a large random prime makes that very unlikely.

```python
def rank_mod(matrix, p):
    a = [[x % p for x in row] for row in matrix]
    m = len(a)
    n = len(a[0]) if m else 0
    r = 0
    for col in range(n):
        if r == m:
            break
        pivot = next((i for i in range(r, m) if a[i][col]), None)
        if pivot is None:
            continue
        a[r], a[pivot] = a[pivot], a[r]
        inv = pow(a[r][col], -1, p)
        for i in range(r + 1, m):
            if a[i][col]:
                factor = a[i][col] * inv % p
                a[i] = [(x - factor * y) % p for x, y in zip(a[i], a[r])]
        r += 1
    return r

P = 998244353
assert rank_mod([[1, 2, 3], [4, 5, 6], [7, 8, 9]], P) == 2
assert rank_mod([[1, 1], [1, 1 + P]], P) == 1               # equal modulo P
```

### With floating point

Use a tolerance and partial pivoting; the rank is the number of pivots larger than `eps`. A borderline matrix (numerically nearly singular) gives an unreliable rank: compute singular values in numerical software if that matters. For contest problems with integer data, prefer the exact versions.

## Testing

Low-rank matrices are easy to make: the product of an $m\times r$ and an $r \times n$ matrix has rank at most $r$, and with random entries almost surely exactly $r$. Also $\operatorname{rank}(A) = \operatorname{rank}(A^T)$:

```python
import random

def transpose(a):
    return [list(col) for col in zip(*a)]

def mat_mul(A, B):
    return [[sum(A[i][k] * B[k][j] for k in range(len(B))) for j in range(len(B[0]))] for i in range(len(A))]

random.seed(1)
for _ in range(200):
    m, n = random.randint(1, 7), random.randint(1, 7)
    r = random.randint(0, min(m, n))
    B = [[random.randint(-5, 5) for _ in range(r)] for _ in range(m)]
    C = [[random.randint(-5, 5) for _ in range(n)] for _ in range(r)]
    A = mat_mul(B, C) if r else [[0] * n for _ in range(m)]
    assert rank(A) <= r
    assert rank(A) == rank(transpose(A)) == rank_mod(A, P)
    if r and rank(B) == r and rank(C) == r:
        assert rank(A) >= 1
```

## Rank over GF(2): the XOR basis

When the vectors are bit strings and addition is XOR, a set of integers spans a **vector space over GF(2)**. Keep a *basis* indexed by the highest set bit: to insert a number, reduce it by the basis vector that shares its top bit, repeat; if something non-zero remains it becomes a new basis vector. The rank is the size of the basis, at most 64 for 64-bit numbers.

```python
class XorBasis:
    def __init__(self):
        self.basis = {}                      # highest bit -> vector

    def insert(self, x):
        """Add x; return True if it was linearly independent of the current basis."""
        while x:
            h = x.bit_length() - 1
            if h not in self.basis:
                self.basis[h] = x
                return True
            x ^= self.basis[h]
        return False

    def contains(self, x):
        """Is x an XOR of some subset of the inserted numbers?"""
        while x:
            h = x.bit_length() - 1
            if h not in self.basis:
                return False
            x ^= self.basis[h]
        return True

    def maximum_xor(self):
        result = 0
        for h in sorted(self.basis, reverse=True):
            if result ^ self.basis[h] > result:
                result ^= self.basis[h]
        return result

    def rank(self):
        return len(self.basis)

xb = XorBasis()
for v in (3, 5, 6):                          # 3 ^ 5 = 6: dependent
    xb.insert(v)
assert xb.rank() == 2 and xb.contains(6) and not xb.contains(1) and xb.maximum_xor() == 6

random.seed(2)
for _ in range(200):
    nums = [random.getrandbits(6) for _ in range(random.randint(0, 8))]
    xb = XorBasis()
    for x in nums:
        xb.insert(x)
    spans = {0}
    for x in nums:
        spans |= {s ^ x for s in spans}
    assert 2 ** xb.rank() == len(spans)              # the span has 2^rank elements
    assert all(xb.contains(v) == (v in spans) for v in range(64))
    assert xb.maximum_xor() == max(spans)
```

Applications: the maximum XOR of a subset, the number of distinct subset XORs ($2^{\text{rank}}$), deciding whether a value is reachable as a XOR of elements, and the size of a linearly independent subset in a graph problem where edges are XOR-ed (for instance, cycle spaces).

## Rank and the structure of solutions

For the system $Ax = b$ with $n$ unknowns, the solution set (if it exists) is an affine space of dimension $n - \operatorname{rank}(A)$. Over a finite field of size $q$ it has $q^{\,n - \operatorname{rank}(A)}$ elements. This is the tool for counting solutions of linear equations modulo a prime, or of XOR constraints (see the GF(2) solver in the elimination article).

## Practice problems

- [TIMUS1041 Nikifor](http://acm.timus.ru/problem.aspx?space=1&num=1041)
