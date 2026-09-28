---
title: "Linear Diophantine Equations"
section: Fundamentals
order: 5
difficulty: intermediate
summary: "Solve ax + by = c in integers: existence, one solution, all solutions, solutions in a range, and the solution with the smallest x + y."
tags: [diophantine, gcd, number theory, extended euclid]
prerequisites: [math/extended-euclidean-algorithm]
source:
  title: "Linear Diophantine Equations"
  url: https://cp-algorithms.com/algebra/linear-diophantine-equation.html
  license: CC BY-SA 4.0
---

A **linear Diophantine equation in two variables** has the form

$$
a x + b y = c
$$

where $a, b, c$ are given integers and we look for **integer** $x, y$. The [extended Euclidean algorithm](/theory/math/extended-euclidean-algorithm) gave the basic result; here we finish the job: degenerate cases, all solutions, solutions in a range, and optimization.

## Degenerate cases

- $a = b = 0$: the equation is $0 = c$. Every pair $(x, y)$ is a solution when $c = 0$, and there is none otherwise.
- $a = 0$, $b \ne 0$: $y = c / b$ must be an integer; $x$ is arbitrary.
- $b = 0$, $a \ne 0$: symmetric.

From now on $a$ and $b$ are non-zero.

## One solution

Let $g = \gcd(a, b)$. The left side is always a multiple of $g$, so a solution exists **if and only if $g \mid c$**. Extended Euclid gives $a x' + b y' = g$; multiply by $c/g$:

$$
x_0 = x' \cdot \frac{c}{g}, \qquad y_0 = y' \cdot \frac{c}{g}
$$

```python
from math import gcd

def extended_gcd(a, b):
    if b == 0:
        return a, 1, 0
    g, x1, y1 = extended_gcd(b, a % b)
    return g, y1, x1 - (a // b) * y1

def find_any_solution(a, b, c):
    """Return (x, y, g) with a*x + b*y == c, or None if there is no integer solution."""
    if a == 0 and b == 0:
        return (0, 0, 0) if c == 0 else None
    g, x, y = extended_gcd(abs(a), abs(b))
    if c % g:
        return None
    x *= c // g
    y *= c // g
    if a < 0:
        x = -x
    if b < 0:
        y = -y
    return x, y, g

for a, b, c in [(6, 9, 21), (6, 9, 4), (-6, 9, 3), (6, -9, 3), (-6, -9, -3), (0, 5, 10), (5, 0, 7)]:
    sol = find_any_solution(a, b, c)
    if sol is None:
        assert c % gcd(a, b) != 0 if (a or b) else c != 0
    else:
        x, y, g = sol
        assert a * x + b * y == c
```

## All solutions

Once you have one solution $(x_0, y_0)$, every other one is obtained by adding $b/g$ to $x$ and subtracting $a/g$ from $y$, any number $k$ of times:

$$
x = x_0 + k\,\frac{b}{g}, \qquad y = y_0 - k\,\frac{a}{g}, \qquad k \in \mathbb{Z}
$$

This is all of them: if $(x, y)$ and $(x_0, y_0)$ are solutions then $a(x - x_0) = -b(y - y_0)$, so $\frac{a}{g}(x - x_0) = -\frac{b}{g}(y - y_0)$ with coprime $\frac{a}{g}, \frac{b}{g}$, forcing $\frac{b}{g} \mid (x - x_0)$.

## Solutions with $x$ and $y$ in given ranges

Count (or list) the solutions with $x_{\min} \le x \le x_{\max}$ and $y_{\min} \le y \le y_{\max}$. Each condition bounds $k$ to an interval; the answer is the intersection.

```python
def floor_div(a, b):
    return a // b                                 # Python floors toward -inf already

def ceil_div(a, b):
    return -((-a) // b)

def k_range(x0, step, lo, hi):
    """All k with lo <= x0 + k*step <= hi, as (klo, khi)."""
    if step > 0:
        return ceil_div(lo - x0, step), floor_div(hi - x0, step)
    return ceil_div(hi - x0, step), floor_div(lo - x0, step)       # step < 0 reverses the order

def count_solutions(a, b, c, xlo, xhi, ylo, yhi):
    if a == 0 and b == 0:
        return (xhi - xlo + 1) * (yhi - ylo + 1) if c == 0 else 0
    if a == 0:
        return (xhi - xlo + 1) if c % b == 0 and ylo <= c // b <= yhi else 0
    if b == 0:
        return (yhi - ylo + 1) if c % a == 0 and xlo <= c // a <= xhi else 0
    sol = find_any_solution(a, b, c)
    if sol is None:
        return 0
    x0, y0, g = sol
    dx, dy = b // g, -(a // g)                    # x + k*dx, y + k*dy
    k1lo, k1hi = k_range(x0, dx, xlo, xhi)
    k2lo, k2hi = k_range(y0, dy, ylo, yhi)
    return max(0, min(k1hi, k2hi) - max(k1lo, k2lo) + 1)

def brute(a, b, c, xlo, xhi, ylo, yhi):
    return sum(a * x + b * y == c for x in range(xlo, xhi + 1) for y in range(ylo, yhi + 1))

import random
random.seed(1)
for _ in range(1500):
    a, b = random.randint(-9, 9), random.randint(-9, 9)
    c = random.randint(-30, 30)
    xlo = random.randint(-12, 5); xhi = xlo + random.randint(0, 15)
    ylo = random.randint(-12, 5); yhi = ylo + random.randint(0, 15)
    assert count_solutions(a, b, c, xlo, xhi, ylo, yhi) == brute(a, b, c, xlo, xhi, ylo, yhi), (a, b, c)
```

## The solution with minimal $x + y$

Along the family, $x + y$ changes by $\frac{b - a}{g}$ per unit of $k$, so it is monotone in $k$. The minimum over a range of valid $k$ is at one of its ends (or you can shift until the sum stops decreasing, then adjust):

```python
def min_sum_solution(a, b, c, xlo, xhi, ylo, yhi):
    """Solution with x, y in the ranges minimizing x + y, or None."""
    sol = find_any_solution(a, b, c)
    if sol is None or a == 0 or b == 0:
        return None
    x0, y0, g = sol
    dx, dy = b // g, -(a // g)
    k1lo, k1hi = k_range(x0, dx, xlo, xhi)
    k2lo, k2hi = k_range(y0, dy, ylo, yhi)
    klo, khi = max(k1lo, k2lo), min(k1hi, k2hi)
    if klo > khi:
        return None
    best = None
    for k in (klo, khi):
        cand = (x0 + k * dx, y0 + k * dy)
        if best is None or sum(cand) < sum(best):
            best = cand
    return best

random.seed(2)
for _ in range(800):
    a, b = random.randint(1, 9), random.randint(1, 9)
    c = random.randint(0, 40)
    xlo, ylo = random.randint(0, 3), random.randint(0, 3)
    xhi, yhi = xlo + random.randint(0, 20), ylo + random.randint(0, 20)
    sols = [(x, y) for x in range(xlo, xhi + 1) for y in range(ylo, yhi + 1) if a * x + b * y == c]
    got = min_sum_solution(a, b, c, xlo, xhi, ylo, yhi)
    if sols:
        assert got is not None and got[0] + got[1] == min(x + y for x, y in sols)
    else:
        assert got is None
```

## Example: paying an exact amount

You have coins of 7 and 11 units. In how many ways can you pay exactly 100 with non-negative numbers of coins? That is `count_solutions(7, 11, 100, 0, 100, 0, 100)`:

```python
ways = count_solutions(7, 11, 100, 0, 100, 0, 100)
assert ways == sum(1 for x in range(15) if (100 - 7 * x) >= 0 and (100 - 7 * x) % 11 == 0) == 1
x, y = min_sum_solution(7, 11, 100, 0, 100, 0, 100)
assert (x, y) == (8, 4) and 7 * x + 11 * y == 100
```

For more than two variables, reduce step by step with $\gcd$ or use a [DP over residues](/theory/dynamic-programming/knapsack).

## Frobenius (coin) number

With coprime $a, b$, the largest amount that **cannot** be paid with non-negative counts of coins $a$ and $b$ is $ab - a - b$:

```python
def frobenius(a, b):
    return a * b - a - b

def payable(a, b, n):
    return any((n - a * i) % b == 0 for i in range(n // a + 1))

assert frobenius(7, 11) == 59
assert not payable(7, 11, 59) and all(payable(7, 11, n) for n in range(60, 400))
```

## Practice problems

- [Spoj - Crucial Equation](http://www.spoj.com/problems/CEQU/)
- [SGU 106](http://codeforces.com/problemsets/acmsguru/problem/99999/106)
- [Codeforces - Ebony and Ivory](http://codeforces.com/contest/633/problem/A)
- [Codechef - Get AC in one go](https://www.codechef.com/problems/COPR16G)
- [LightOj - Solutions to an equation](http://www.lightoj.com/volume_showproblem.php?problem=1306)
- [Atcoder - F - S = 1](https://atcoder.jp/contests/abc340/tasks/abc340_f)
