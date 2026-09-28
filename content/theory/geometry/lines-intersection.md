---
title: "Intersection Point of Two Lines"
section: Elementary operations
order: 3
difficulty: beginner
summary: "Solve two line equations with Cramer's rule, and tell apart the three cases: one point, parallel, or the same line."
tags: [geometry, lines, cramer's rule, intersection]
prerequisites: [geometry/segment-to-line]
source:
  title: "Intersection Point of Lines"
  url: https://cp-algorithms.com/geometry/lines-intersection.html
  license: CC BY-SA 4.0
---

Two lines are given by $a_1x + b_1y + c_1 = 0$ and $a_2x + b_2y + c_2 = 0$. Find their intersection point, or decide that they are parallel.

## Solution

Two lines that are not parallel meet in exactly one point, the solution of the linear system

$$
\begin{cases} a_1 x + b_1 y + c_1 = 0 \\ a_2 x + b_2 y + c_2 = 0 \end{cases}
$$

**Cramer's rule** gives it immediately:

$$
x = -\frac{c_1b_2 - c_2b_1}{a_1b_2 - a_2b_1},\qquad
y = -\frac{a_1c_2 - a_2c_1}{a_1b_2 - a_2b_1}
$$

If the denominator $D = a_1b_2 - a_2b_1$ is $0$, the system has either no solution (parallel, distinct lines) or infinitely many (the lines coincide). To tell them apart, check whether the $c$ coefficients are in the same proportion as the others, i.e. whether the determinants $a_1c_2 - a_2c_1$ and $b_1c_2 - b_2c_1$ both vanish.

## Implementation

With integer coefficients everything can be exact by using `Fraction`. For float lines, replace the `== 0` tests with `abs(...) < EPS`.

```python
from fractions import Fraction

def det(a, b, c, d):
    return a * d - b * c

def intersect(m, n):
    """Intersection point of lines m = (a, b, c) and n, or None if they are parallel."""
    zn = det(m[0], m[1], n[0], n[1])
    if zn == 0:
        return None
    return (Fraction(-det(m[2], m[1], n[2], n[1]), zn),
            Fraction(-det(m[0], m[2], n[0], n[2]), zn))

def parallel(m, n):
    return det(m[0], m[1], n[0], n[1]) == 0

def equivalent(m, n):
    return (det(m[0], m[1], n[0], n[1]) == 0
            and det(m[0], m[2], n[0], n[2]) == 0
            and det(m[1], m[2], n[1], n[2]) == 0)

# x + y - 4 = 0 and x - y = 0 meet at (2, 2)
assert intersect((1, 1, -4), (1, -1, 0)) == (2, 2)
# 2x + 3y - 7 = 0 and 4x - y - 1 = 0
p = intersect((2, 3, -7), (4, -1, -1))
assert p == (Fraction(5, 7), Fraction(13, 7))
assert 2 * p[0] + 3 * p[1] - 7 == 0 and 4 * p[0] - p[1] - 1 == 0

assert parallel((1, 1, 0), (2, 2, 5)) and not equivalent((1, 1, 0), (2, 2, 5))
assert equivalent((1, 1, 0), (-3, -3, 0)) and equivalent((1, -2, 3), (2, -4, 6))
assert intersect((1, 1, 0), (2, 2, 5)) is None
```

## Testing against brute force

A line has infinitely many points, but on a small grid we can check by brute force: compute all integer points that satisfy both equations and compare with the formula when the intersection is an integer point.

```python
import random

rnd = random.Random(7)
for _ in range(500):
    m = (rnd.randint(-5, 5), rnd.randint(-5, 5), rnd.randint(-9, 9))
    n = (rnd.randint(-5, 5), rnd.randint(-5, 5), rnd.randint(-9, 9))
    if m[:2] == (0, 0) or n[:2] == (0, 0):
        continue                                                  # not a line
    grid = [(x, y) for x in range(-30, 31) for y in range(-30, 31)
            if m[0] * x + m[1] * y + m[2] == 0 and n[0] * x + n[1] * y + n[2] == 0]
    p = intersect(m, n)
    if p is None:
        assert equivalent(m, n) or not grid                        # parallel: coincide or share nothing
    else:
        assert len(grid) <= 1
        if p[0].denominator == 1 and p[1].denominator == 1 and abs(p[0]) <= 30 and abs(p[1]) <= 30:
            assert grid == [(int(p[0]), int(p[1]))]
        else:
            assert grid == []
```

## The same problem with points and directions

The [basic geometry article](/theory/geometry/basic-geometry) solves this with cross products, starting from lines given as a point and a direction. Which form is better depends on the input: use `(a, b, c)` when lines are given by equations or need comparing, and point-direction when they come from segments.
