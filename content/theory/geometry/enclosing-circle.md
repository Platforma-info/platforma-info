---
title: "Minimum Enclosing Circle"
section: Advanced topics
order: 5
difficulty: advanced
summary: "Welzl's randomized algorithm finds the smallest circle containing n points in expected O(n) time; the point-in-circle test is done exactly in integers."
tags: [geometry, circle, randomized algorithms, welzl, exact arithmetic]
prerequisites: [geometry/basic-geometry, geometry/circle-line-intersection]
source:
  title: "Minimum Enclosing Circle"
  url: https://cp-algorithms.com/geometry/enclosing-circle.html
  license: CC BY-SA 4.0
---

The **minimum enclosing circle** (MEC) of a set of points is the circle of smallest radius that contains all of them, inside or on the boundary. For instance, it answers "what is the smallest radius of a radar that covers all towns?"

The solution is **unique**: if the intersection of all the circles of radius $r$ around the points had non-zero area, we could shrink $r$; so at the optimum this intersection is a single point, the center. The same argument shows that the smallest circle passing through one or two prescribed points is also unique.

The MEC is determined by **two or three points on its boundary**: two that are diametrically opposite, or three that form an acute (or right) triangle whose circumcircle it is.

## Welzl's algorithm

The algorithm looks cubic at first sight, yet runs in expected $O(n)$ time:

1. Shuffle the points randomly.
2. Start with $C = \operatorname{mec}(p_1, p_2)$.
3. For each $p_i$: if $p_i \in C$ continue. Otherwise $p_i$ must be **on the boundary** of the MEC of $\{p_1..p_i\}$, so set $C$ to the smallest circle through $p_i$ (start with $\operatorname{mec}(p_i, p_1)$) and rescan the earlier points $p_j$:
   - if $p_j \in C$ continue; otherwise $p_j$ is also on the boundary: set $C = \operatorname{mec}(p_i, p_j)$ and rescan $p_k$, $k < j$:
     - if $p_k \notin C$, then $C$ = the circle through $p_i, p_j, p_k$.

Each nested loop maintains an invariant (that $C$ is the smallest circle containing the points seen so far **and** passing through the 0, 1 or 2 fixed points), and it is equivalent to the invariant of the enclosing loop when the inner loop finishes, which gives correctness.

**Expected time.** The innermost loop takes $O(j)$. The loop over $j$ only starts the innermost loop when $p_j$ is one of the (at most 2) points of $\{p_1..p_j\}$ that determine the circle, which after the random shuffle happens with probability at most $2/j$. So the expected work is $\sum_{j\le i} \frac 2j\cdot O(j) = O(i)$, and the same argument works for the outer loop: $O(n)$ expected.

## The point-in-circle test, exactly

We represent a circle by the 2 or 3 points that define it and test membership directly with those points, using only integer arithmetic. Write points as complex numbers $x + yi$: multiplying two of them adds their polar angles and conjugating negates the angle.

**Two points $a, b$** (circle with diameter $ab$). A point $z$ is inside or on the circle iff the angle $\angle azb$ is not acute, i.e. iff

$$
I_0 = (b - z)\,\overline{(a - z)}
$$

has a real part $\le 0$. In coordinates, $\operatorname{Re} I_0$ is the dot product $(b-z)\cdot(a-z)$.

**Three points $a, b, c$.** For $z$ and $c$ on the same side of $ab$, the inscribed angles $\angle azb$ and $\angle acb$ are equal exactly when $z$ is on the circle; inside the circle the angle at $z$ is bigger, outside smaller. Encoding signed angles with the imaginary parts of complex products:

$$
I_1 = (b - z)\overline{(a - z)}\,(a - c)\overline{(b - c)} = I_0 I_2,\qquad I_2 = (a - c)\overline{(b - c)}
$$

Which sign means "inside" depends on the orientation of the triangle $abc$, which is the sign of $\operatorname{Im} I_2$. Normalizing for it, we compute the indicator

$$
\text{indicator} = \begin{cases} -\operatorname{Im} I_1 & \text{if } \operatorname{Im} I_2 < 0 \\ \operatorname{Im} I_1 & \text{otherwise}\end{cases}
$$

which is **negative inside, zero on the circle and positive outside**. Coefficients grow like $A^4$ where $A$ is the coordinate magnitude, which is no issue with Python integers.

## Implementation

```python
import random

def mul_conj(u, v):
    """u * conj(v) for 2D integer vectors, as (real, imag)."""
    return (u[0] * v[0] + u[1] * v[1], u[1] * v[0] - u[0] * v[1])

def sub(a, b):
    return (a[0] - b[0], a[1] - b[1])

def indicator(circle, z):
    """< 0 if z is strictly inside, 0 on the circumference, > 0 outside.
    `circle` is a tuple of 2 points (a diameter) or 3 points (a circumcircle)."""
    a, b = circle[0], circle[1]
    i0 = mul_conj(sub(b, z), sub(a, z))
    if len(circle) == 2:
        return i0[0]
    c = circle[2]
    i2 = mul_conj(sub(a, c), sub(b, c))
    im_i1 = i0[0] * i2[1] + i0[1] * i2[0]              # imaginary part of I0 * I2
    return -im_i1 if i2[1] < 0 else im_i1

def inside(circle, z):
    return indicator(circle, z) <= 0

def enclosing_circle(points, seed=0):
    """Welzl's algorithm; returns the 2 or 3 points that define the minimum enclosing circle."""
    p = list(dict.fromkeys(points))                    # remove duplicates, keep order
    if len(p) == 1:
        return (p[0], p[0])
    random.Random(seed).shuffle(p)
    c = (p[0], p[1])
    for i in range(len(p)):
        if not inside(c, p[i]):
            c = (p[i], p[0])
            for j in range(i):
                if not inside(c, p[j]):
                    c = (p[i], p[j])
                    for k in range(j):
                        if not inside(c, p[k]):
                            c = (p[i], p[j], p[k])
    return c

square = [(0, 0), (4, 0), (4, 4), (0, 4), (2, 2), (1, 3)]
c = enclosing_circle(square)
assert all(inside(c, p) for p in square)
assert sorted(p for p in square if indicator(c, p) == 0) == [(0, 0), (0, 4), (4, 0), (4, 4)]     # the four corners
assert enclosing_circle([(1, 1)]) == ((1, 1), (1, 1))
c = enclosing_circle([(0, 0), (6, 0)])
assert indicator(c, (3, 0)) < 0 and indicator(c, (0, 0)) == 0 and indicator(c, (3, 4)) > 0      # 3-4-5: (3,4) is outside
```

The answer to "does point $p_i$ lie on the circumference of the MEC?" is `indicator(c, p_i) == 0`.

## Verification against brute force

The radius of the true MEC can be found by brute force: it is the smallest circle among all circles through two points (as a diameter) or through three non-collinear points that contain all the points. We use exact rational arithmetic.

```python
from fractions import Fraction
from itertools import combinations

def circle_of(c):
    """Center (x, y) and squared radius, as exact fractions."""
    if len(c) == 2:
        (ax, ay), (bx, by) = c
        cx, cy = Fraction(ax + bx, 2), Fraction(ay + by, 2)
        return (cx, cy), (cx - ax) ** 2 + (cy - ay) ** 2
    (ax, ay), (bx, by), (cx, cy) = c
    d = 2 * (ax * (by - cy) + bx * (cy - ay) + cx * (ay - by))
    ux = Fraction((ax * ax + ay * ay) * (by - cy) + (bx * bx + by * by) * (cy - ay) + (cx * cx + cy * cy) * (ay - by), d)
    uy = Fraction((ax * ax + ay * ay) * (cx - bx) + (bx * bx + by * by) * (ax - cx) + (cx * cx + cy * cy) * (bx - ax), d)
    return (ux, uy), (ux - ax) ** 2 + (uy - ay) ** 2

def brute_radius2(points):
    pts = list(set(points))
    candidates = list(combinations(pts, 2)) + [
        t for t in combinations(pts, 3)
        if (t[1][0] - t[0][0]) * (t[2][1] - t[0][1]) - (t[1][1] - t[0][1]) * (t[2][0] - t[0][0]) != 0]
    best = None
    for cand in candidates:
        (cx, cy), r2 = circle_of(cand)
        if all((Fraction(x) - cx) ** 2 + (Fraction(y) - cy) ** 2 <= r2 for x, y in pts):
            if best is None or r2 < best:
                best = r2
    return best

rnd = random.Random(4)
for _ in range(1500):
    pts = [(rnd.randint(-6, 6), rnd.randint(-6, 6)) for _ in range(rnd.randint(2, 9))]
    if len(set(pts)) == 1:
        continue
    c = enclosing_circle(pts, seed=rnd.randint(0, 10 ** 6))
    (cx, cy), r2 = circle_of(c)
    assert r2 == brute_radius2(pts), pts
    assert all(inside(c, p) for p in pts)
    for p in pts:                                        # the integer indicator agrees with exact distances
        d = (Fraction(p[0]) - cx) ** 2 + (Fraction(p[1]) - cy) ** 2 - r2
        ind = indicator(c, p)
        assert (ind < 0) == (d < 0) and (ind == 0) == (d == 0)
```

The result does not depend on the random seed (the MEC is unique), only the running time does.

## Larger inputs

The expected linear time makes the algorithm practical for large inputs even in Python:

```python
import math
import time

pts = [(rnd.randint(-10 ** 6, 10 ** 6), rnd.randint(-10 ** 6, 10 ** 6)) for _ in range(50_000)]
start = time.perf_counter()
c = enclosing_circle(pts)
elapsed = time.perf_counter() - start
assert all(inside(c, p) for p in pts)
(cx, cy), r2 = circle_of(c)
assert float(r2) ** 0.5 <= math.hypot(2 * 10 ** 6, 2 * 10 ** 6) / 2 + 1e-6       # never larger than the bounding square's circle
assert elapsed < 20
```

## Practice problems

- [Library Checker - Minimum Enclosing Circle](https://judge.yosupo.jp/problem/minimum_enclosing_circle)
- [BOI 2002 - Aliens](https://www.spoj.com/problems/ALIENS)
