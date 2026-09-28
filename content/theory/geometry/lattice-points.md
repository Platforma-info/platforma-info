---
title: "Counting Lattice Points Under a Line"
section: Polygons
order: 3
difficulty: advanced
summary: "Count the integer points under a line segment, and hence inside a polygon with arbitrary vertices, in O(log n) with a Euclid-like recursion."
tags: [geometry, lattice points, floor sum, euclid-like recursion, polygon]
prerequisites: [geometry/picks-theorem]
source:
  title: "Lattice points inside non-lattice polygon"
  url: https://cp-algorithms.com/geometry/lattice-points.html
  license: CC BY-SA 4.0
---

For polygons whose vertices are lattice points, [Pick's formula](/theory/geometry/picks-theorem) counts the interior lattice points. What if the vertices are arbitrary (rational) points?

The idea is the same as for computing an area with trapezoids: process the polygon's edges one by one and add up the number of lattice points **under** each edge, with a sign depending on the direction of the edge. So the core task is to count the lattice points under one line segment.

## The core problem

Each edge is a linear function $y = kx + b$ ($k = \frac{y_2 - y_1}{x_2 - x_1}$). After shifting the origin and possibly reflecting, we can assume $k \ge 0$, $b \ge 0$, and we need

$$
\sum_{x=0}^{n-1} \left\lfloor kx + b \right\rfloor
$$

which counts the integer points $(x, y)$ with $0 \le x < n$ and $0 < y \le kx + b$. It is a "floor sum", and it can be reduced by a recursion that resembles the Euclidean algorithm.

### Case 1: $k \ge 1$ or $b \ge 1$

Count separately the points under the line $y = \lfloor k\rfloor x + \lfloor b\rfloor$:

$$
\sum_{x=0}^{n-1} \big(\lfloor k \rfloor x + \lfloor b \rfloor\big) = \frac{\big(\lfloor k \rfloor (n-1) + 2\lfloor b \rfloor\big)\,n}{2}
$$

The points still missing satisfy $\lfloor k\rfloor x + \lfloor b\rfloor < y \le kx + b$, which is the same as $0 < y \le (k - \lfloor k\rfloor)x + (b - \lfloor b\rfloor)$. So we have reduced the problem to slope and intercept less than 1.

### Case 2: $k < 1$ and $b < 1$

Let $t = kn + b$. If $\lfloor t\rfloor = 0$ there are no points. Otherwise swap the roles of the axes: look at the set of points from the other side (reflect the picture through the point $(n, \lfloor t\rfloor)$ and exchange $x$ and $y$). In the new coordinates the line has slope $1/k$ and intercept $(t - \lfloor t\rfloor)/k$, and there are $\lfloor t \rfloor$ columns. This is Case 1 again, with a bigger slope.

Each two steps behave like a step of the Euclidean algorithm (slope $k \to 1/k$ after removing the integer part), so the recursion depth is $O(\log n)$.

## Implementation

With exact rational arithmetic (`Fraction`) there are no precision problems at all:

```python
from fractions import Fraction
from math import floor

def count_lattices(k, b, n):
    """Number of integer points (x, y) with 0 <= x < n and 0 < y <= floor(k*x + b), for k, b >= 0."""
    fk, fb = floor(k), floor(b)
    cnt = 0
    if k >= 1 or b >= 1:
        cnt += (fk * (n - 1) + 2 * fb) * n // 2
        k -= fk
        b -= fb
    t = k * n + b
    ft = floor(t)
    if ft >= 1:
        cnt += count_lattices(1 / k, (t - ft) / k, ft)
    return cnt

def brute(k, b, n):
    return sum(floor(k * x + b) for x in range(n))

assert count_lattices(Fraction(1, 2), Fraction(0), 10) == brute(Fraction(1, 2), Fraction(0), 10) == 20
assert count_lattices(Fraction(3), Fraction(1), 5) == brute(Fraction(3), Fraction(1), 5) == 35
```

A randomized test against the direct sum:

```python
import random

rnd = random.Random(11)
for _ in range(3000):
    k = Fraction(rnd.randint(0, 40), rnd.randint(1, 12))
    b = Fraction(rnd.randint(0, 40), rnd.randint(1, 12))
    n = rnd.randint(0, 60)
    assert count_lattices(k, b, n) == brute(k, b, n), (k, b, n)
```

### Floats vs fractions

The denominators and numerators of $k$ and $b$ stay small (at most about $C^2$ if they started at most $C$ and you reduce fractions), so `Fraction` is fast here. With `float`s you can also use the routine if you treat numbers as integers when they are within $\varepsilon^2$ of an integer, but exact arithmetic is simpler and safer in Python.

### The integer version: `floor_sum`

For the common special case $k = a/m$ and $b = c/m$ with integers, the same recursion works on integers only and is much faster than `Fraction`. It computes $\sum_{i=0}^{n-1}\lfloor (a i + b)/m\rfloor$:

```python
def floor_sum(n, m, a, b):
    """sum_{i=0}^{n-1} floor((a*i + b) / m), for m > 0 and a, b >= 0."""
    total = 0
    while True:
        if a >= m:
            total += (n - 1) * n // 2 * (a // m)
            a %= m
        if b >= m:
            total += n * (b // m)
            b %= m
        y_max = a * n + b
        if y_max < m:
            break
        n, b = divmod(y_max, m)          # swap the roles of x and y
        m, a = a, m
    return total

for _ in range(3000):
    n, m = rnd.randint(0, 50), rnd.randint(1, 20)
    a, b = rnd.randint(0, 60), rnd.randint(0, 60)
    assert floor_sum(n, m, a, b) == sum((a * i + b) // m for i in range(n))
assert floor_sum(10 ** 9, 10 ** 9 + 7, 123456789, 987654321) > 0             # instant for huge n
assert floor_sum(10 ** 18, 10 ** 18 + 9, 10 ** 17 + 3, 7) > 0                    # 10^18 terms, still instant
```

The recursion takes $O(\log m)$ steps, so even $n = 10^{18}$ is immediate.

## An application: lattice points in a triangle

Take the right triangle with vertices $(0, 0)$, $(n, 0)$, $(n, m)$. The hypotenuse is $y = \frac mn x$, so the number of lattice points in the closed triangle is $\sum_{x=0}^{n}(\lfloor mx/n\rfloor + 1)$. Pick's theorem (a completely different route) gives the same total: $I + B$ with $B = n + m + \gcd(n, m)$ and $S = nm/2$:

```python
from math import gcd

def triangle_points_floor(n, m):
    return floor_sum(n + 1, n, m, 0) + (n + 1)

def triangle_points_pick(n, m):
    boundary = n + m + gcd(n, m)
    twice_area = n * m
    interior = (twice_area - boundary + 2) // 2
    return interior + boundary

for n in range(1, 25):
    for m in range(1, 25):
        assert triangle_points_floor(n, m) == triangle_points_pick(n, m)
```

## General polygons

For a polygon with rational vertices, sum `count_lattices` over the edges, each with a sign (positive for edges traversed one way, negative for the other), handling the points that lie exactly on vertical lines and on edges consistently, and add the points on the $x$-axis and at the ends manually. Bookkeeping there is fiddly; the floor-sum routine above is the part that has to be fast.
