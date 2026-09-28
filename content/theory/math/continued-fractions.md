---
title: "Continued Fractions"
section: Number systems
order: 3
difficulty: advanced
summary: "Write a number as a ladder of integers a₀ + 1/(a₁ + 1/(a₂ + …)), compute convergents and best rational approximations, and connect them to the Stern-Brocot tree and floor sums."
tags: [continued fractions, convergents, best approximation, stern-brocot, floor sum]
prerequisites: [math/euclidean-algorithm]
source:
  title: "Continued fractions"
  url: https://cp-algorithms.com/algebra/continued-fractions.html
  license: CC BY-SA 4.0
---

A **continued fraction** writes a real number $r$ as

$$
r = a_0 + \cfrac{1}{a_1 + \cfrac{1}{a_2 + \cfrac{1}{\ddots}}} = [a_0;\ a_1,\ a_2,\ \dots]
$$

where $a_0$ is an integer and all other **partial quotients** $a_i$ are positive integers. Truncating the ladder after $k$ steps gives a rational number, the **convergent** $r_k = p_k/q_k$, and these are the best rational approximations of $r$ you can get. Familiar examples: $\pi \approx 22/7 \approx 355/113$; $\sqrt 2 = [1; 2, 2, 2, \dots]$.

## Continued fraction of a rational number

For $r = p/q$ the algorithm is the [Euclidean algorithm](/theory/math/euclidean-algorithm): $a_0 = \lfloor p/q \rfloor$, then continue with the reciprocal of the fractional part $q/(p \bmod q)$. The quotients of the Euclidean algorithm *are* the partial quotients.

```python
from fractions import Fraction
from math import gcd

def cf_of_fraction(p, q):
    """[a0; a1, ..., ak] of p/q (q > 0), canonical form (last term > 1 unless there is one term)."""
    a = []
    while q:
        a.append(p // q)
        p, q = q, p % q
    if len(a) > 1 and a[-1] == 1:                       # [.., x, 1] = [.., x + 1]
        a.pop()
        a[-1] += 1
    return a

assert cf_of_fraction(415, 93) == [4, 2, 6, 7]
assert cf_of_fraction(3, 1) == [3]
assert cf_of_fraction(-7, 2) == [-4, 2]                 # -3.5 = -4 + 1/2
assert cf_of_fraction(1, 2) == [0, 2]

def from_cf(a):
    value = Fraction(a[-1])
    for x in reversed(a[:-1]):
        value = x + 1 / value
    return value

assert from_cf([4, 2, 6, 7]) == Fraction(415, 93)
```

Each rational has exactly two continued fractions, $[\dots, a_k]$ and $[\dots, a_k - 1, 1]$; the canonical form has last term greater than 1.

## Continued fraction of a quadratic irrational

For $\sqrt n$ (non-square) the expansion is **periodic**, and can be computed with integers only, without floating point:

```python
from math import isqrt

def cf_sqrt(n, terms):
    """First `terms` partial quotients of sqrt(n), n not a perfect square."""
    a0 = isqrt(n)
    m, d, a = 0, 1, a0
    out = [a0]
    while len(out) < terms:
        m = d * a - m
        d = (n - m * m) // d
        a = (a0 + m) // d
        out.append(a)
    return out

assert cf_sqrt(2, 6) == [1, 2, 2, 2, 2, 2]
assert cf_sqrt(7, 9) == [2, 1, 1, 1, 4, 1, 1, 1, 4]
assert cf_sqrt(23, 5) == [4, 1, 3, 1, 8]
```

## Convergents

The $k$-th convergent $p_k/q_k$ satisfies a two-term recurrence

$$
p_k = a_k\,p_{k-1} + p_{k-2}, \qquad q_k = a_k\,q_{k-1} + q_{k-2}
$$

with $p_{-1}/q_{-1} = 1/0$ and $p_{-2}/q_{-2} = 0/1$. (Equivalently, the matrix product $\prod_i \begin{pmatrix} a_i & 1 \\ 1 & 0 \end{pmatrix}$.)

```python
def convergents(a):
    """Lists p, q of the numerators and denominators of all convergents."""
    p, q = [], []
    pm2, qm2, pm1, qm1 = 0, 1, 1, 0
    for x in a:
        pk, qk = x * pm1 + pm2, x * qm1 + qm2
        p.append(pk)
        q.append(qk)
        pm2, qm2, pm1, qm1 = pm1, qm1, pk, qk
    return p, q

p, q = convergents(cf_of_fraction(415, 93))
assert list(zip(p, q)) == [(4, 1), (9, 2), (58, 13), (415, 93)]
assert Fraction(p[-1], q[-1]) == Fraction(415, 93)

# pi = [3; 7, 15, 1, 292, ...]: 3, 22/7, 333/106, 355/113, ...
p, q = convergents([3, 7, 15, 1, 292])
assert list(zip(p, q))[:4] == [(3, 1), (22, 7), (333, 106), (355, 113)]
```

### Key facts

- **Determinant:** $p_k\,q_{k-1} - p_{k-1}\,q_k = (-1)^{k-1}$, so consecutive convergents are in lowest terms, and $\gcd(p_k, q_k) = 1$.
- **Alternation:** even-indexed convergents are below $r$, odd-indexed ones above.
- **Accuracy:** $\left| r - \dfrac{p_k}{q_k} \right| \le \dfrac{1}{q_k\,q_{k+1}} < \dfrac{1}{q_k^2}$ (with equality only when $r = p_{k+1}/q_{k+1}$ is rational and $k+1$ is its last step).
- **Growth:** $q_k$ grows at least like the Fibonacci numbers, so a real number needs only about $\log_\varphi(\text{denominator})$ terms.

```python
import random
random.seed(1)
for _ in range(200):
    P, Q = random.randint(1, 10 ** 6), random.randint(1, 10 ** 6)
    a = cf_of_fraction(P, Q)
    p, q = convergents(a)
    r = Fraction(P, Q)
    for k in range(len(a)):
        assert Fraction(p[k], q[k]) == from_cf(a[:k + 1])
        if k:
            assert p[k] * q[k - 1] - p[k - 1] * q[k] == (-1) ** (k - 1)
        if k + 1 < len(a):
            assert abs(r - Fraction(p[k], q[k])) <= Fraction(1, q[k] * q[k + 1])     # equality at the last step
        if k < len(a) - 1:
            assert (Fraction(p[k], q[k]) < r) == (k % 2 == 0)
```

## Best rational approximations

Which fraction $p/q$ with $q \le N$ is closest to $r$? It is always a convergent or a **semiconvergent**, one of the intermediate fractions $\dfrac{t\,p_k + p_{k-1}}{t\,q_k + q_{k-1}}$ with $0 \le t \le a_{k+1}$ between two convergents.

To answer a query with denominator bound $N$: take the last convergent with $q_k \le N$, form the largest semiconvergent that still fits, and pick the closer of the two.

```python
def best_approximation(r, N):
    """Fraction p/q with q <= N closest to the Fraction r (ties: smallest q)."""
    a = cf_of_fraction(r.numerator, r.denominator)
    p, q = convergents(a)
    k = max(i for i in range(len(q)) if q[i] <= N)
    candidates = [Fraction(p[k], q[k])]
    if k + 1 < len(a):
        qm1 = q[k - 1] if k else 0
        pm1 = p[k - 1] if k else 1
        t = (N - qm1) // q[k]                            # semiconvergent (t*p_k + p_{k-1}) / (t*q_k + q_{k-1})
        if t >= 1:
            candidates.append(Fraction(t * p[k] + pm1, t * q[k] + qm1))
    return min(candidates, key=lambda f: (abs(f - r), f.denominator))

def best_approximation_brute(r, N):
    best = None
    for q in range(1, N + 1):
        for p in (int(r * q) - 1, int(r * q), int(r * q) + 1, int(r * q) + 2):
            f = Fraction(p, q)
            key = (abs(f - r), f.denominator)
            if best is None or key < best[0]:
                best = (key, f)
    return best[1]

assert best_approximation(Fraction(3141592653589793, 10 ** 15), 100) == Fraction(311, 99)
assert best_approximation(Fraction(3141592653589793, 10 ** 15), 10) == Fraction(22, 7)
assert best_approximation(Fraction(3141592653589793, 10 ** 15), 1000) == Fraction(355, 113)
random.seed(3)
for _ in range(400):
    r = Fraction(random.randint(-500, 500), random.randint(1, 500)) + Fraction(random.randint(0, 1000), 997)
    N = random.randint(1, 60)
    assert best_approximation(r, N) == best_approximation_brute(r, N), (r, N)
```

## Trees of fractions

### Stern-Brocot tree

Start with the "fractions" $0/1$ and $1/0$; the tree of all positive rationals is built by taking **mediants** $\frac{a + c}{b + d}$ of neighbours. Going to the left child means moving toward $0/1$, to the right toward $1/0$. Every positive fraction appears exactly once. The path to $p/q$ is given by its continued fraction: $R^{a_0} L^{a_1} R^{a_2} \cdots$ with the last exponent reduced by one.

```python
def stern_brocot_path(p, q):
    a = cf_of_fraction(p, q)
    path = []
    for i, x in enumerate(a):
        count = x - 1 if i == len(a) - 1 else x
        path.append(("R" if i % 2 == 0 else "L") * count)
    return "".join(path)

def follow_path(path):
    lo, hi = (0, 1), (1, 0)
    mid = (1, 1)
    for step in path:
        if step == "L":
            hi = mid
        else:
            lo = mid
        mid = (lo[0] + hi[0], lo[1] + hi[1])
    return mid

assert stern_brocot_path(1, 1) == ""
assert stern_brocot_path(3, 2) == "RL"
assert stern_brocot_path(5, 3) == "RLR"          # 1/1 -> 2/1 -> 3/2 -> 5/3
for p_ in range(1, 25):
    for q_ in range(1, 25):
        if gcd(p_, q_) == 1:
            assert follow_path(stern_brocot_path(p_, q_)) == (p_, q_)
```

This gives a compact address for every fraction, a way to compare two fractions, and a binary search over rationals (the tree is the search space; use exponential search along runs).

### Calkin-Wilf tree

Each fraction $\frac{a}{b}$ has two children, $\frac{a}{a+b}$ and $\frac{a+b}{b}$. A breadth-first traversal lists every positive rational exactly once, in lowest terms: $\frac11, \frac12, \frac21, \frac13, \frac32, \frac23, \frac31, \dots$ The numerators form Stern's diatomic sequence.

```python
def calkin_wilf(count):
    out, queue = [], [(1, 1)]
    i = 0
    while len(out) < count:
        a, b = queue[i]
        i += 1
        out.append((a, b))
        queue.append((a, a + b))
        queue.append((a + b, b))
    return out

def fusc(n):
    a, b = 1, 0
    while n:
        if n & 1:
            b += a
        else:
            a += b
        n >>= 1
    return b

cw = calkin_wilf(15)
assert cw[:7] == [(1, 1), (1, 2), (2, 1), (1, 3), (3, 2), (2, 3), (3, 1)]
assert all(cw[n - 1] == (fusc(n), fusc(n + 1)) for n in range(1, 16))
```

## Application: sums of floors

Sums like $\sum_{i=0}^{n-1} \lfloor (a i + b)/m \rfloor$ count lattice points under a line. They have a Euclid-like recursion, the same structure as the continued fraction of $a/m$, and give an $O(\log m)$ algorithm (often called `floor_sum`):

```python
def floor_sum(n, m, a, b):
    """sum_{i=0}^{n-1} floor((a*i + b) / m), for n >= 0, m >= 1, any integers a, b."""
    total = 0
    if a < 0 or a >= m:
        total += (n - 1) * n // 2 * (a // m)
        a %= m
    if b < 0 or b >= m:
        total += n * (b // m)
        b %= m
    y_max = a * n + b
    if y_max < m:
        return total
    n2, b2 = y_max // m, y_max % m
    return total + floor_sum(n2, a, m, b2)            # swap the roles of a and m: Euclid

def floor_sum_brute(n, m, a, b):
    return sum((a * i + b) // m for i in range(n))

for _ in range(1500):
    n, m = random.randint(0, 30), random.randint(1, 30)
    a, b = random.randint(-40, 40), random.randint(-40, 40)
    assert floor_sum(n, m, a, b) == floor_sum_brute(n, m, a, b), (n, m, a, b)
assert floor_sum(10 ** 12, 10 ** 9 + 7, 123456789, 987654321) > 0            # instant for huge n
```

Typical uses: counting lattice points in a triangle, sums such as $\sum \lfloor \sqrt 2\, i \rfloor$ (through rational approximations of the slope), and modular sums $\sum (a i \bmod m) = a\,n(n-1)/2 - m \cdot \text{floor\_sum}$.

## Beyond

Continued fractions of *irrational* numbers give the best rational approximations (and, e.g., the "most irrational" number is the golden ratio $[1; 1, 1, 1, \dots]$ because its convergents, the ratios of Fibonacci numbers, approach it slowest). They also drive **linear fractional transformations** (Möbius maps $x \mapsto \frac{ax + b}{cx + d}$ applied to expansions), Gosper's arithmetic on continued fractions, and geometry of lattice points under a line (the *lattice hull* of a slope is built from semiconvergents).

## Practice problems

- [UVa OJ - Continued Fractions](https://onlinejudge.org/index.php?option=com_onlinejudge&Itemid=8&page=show_problem&problem=775)
- [ProjectEuler+ #64: Odd period square roots](https://www.hackerrank.com/contests/projecteuler/challenges/euler064/problem)
- [Codeforces Round #184 (Div. 2) - Continued Fractions](https://codeforces.com/contest/305/problem/B)
- [Codeforces Round #201 (Div. 1) - Doodle Jump](https://codeforces.com/contest/346/problem/E)
- [Codeforces Round #325 (Div. 1) - Alice, Bob, Oranges and Apples](https://codeforces.com/contest/585/problem/C)
- [POJ Founder Monthly Contest 2008.03.16 - A Modular Arithmetic Challenge](http://poj.org/problem?id=3530)
- [2019 Multi-University Training Contest 5 - fraction](http://acm.hdu.edu.cn/showproblem.php?pid=6624)
- [SnackDown 2019 Elimination Round - Election Bait](https://www.codechef.com/SNCKEL19/problems/EBAIT)
- [Code Jam 2019 round 2 - Continued Fraction](https://github.com/google/coding-competitions-archive/blob/main/codejam/2019/round_2/new_elements_part_2/statement.pdf)
