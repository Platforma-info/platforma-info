---
title: "Checking Whether Two Segments Intersect"
section: Elementary operations
order: 5
difficulty: intermediate
summary: "An exact integer test using only cross products: the endpoints of each segment must lie on opposite sides of the other, with a special case for collinear segments."
tags: [geometry, segments, intersection, cross product, orientation]
prerequisites: [geometry/oriented-triangle-area]
source:
  title: "Check if two segments intersect"
  url: https://cp-algorithms.com/geometry/check-segments-intersection.html
  license: CC BY-SA 4.0
---

Given segments $(a, b)$ and $(c, d)$, decide whether they have a common point. We could compute the intersection and see whether it exists, but for integer coordinates the intersection point is generally not an integer. The test below uses only **cross products**, so it stays exact in integers.

## Algorithm

**Collinear case.** If all four points lie on one line, the segments intersect exactly when their projections onto both axes overlap. To be correct when one segment is a single point, test collinearity with all four cross products (both $c, d$ against line $ab$ **and** both $a, b$ against line $cd$): a degenerate segment $cd$ with $c = d$ makes the first two vanish for *any* $a$ and $b$.

**General case.** Otherwise the segments intersect if and only if

- $a$ and $b$ are **not strictly on the same side** of line $cd$, and
- $c$ and $d$ are **not strictly on the same side** of line $ab$.

The side of a point is the sign of a cross product (see [oriented area](/theory/geometry/oriented-triangle-area)). Touching counts as an intersection: if an endpoint lies on the other segment, the sign is $0$ and differs from the sign on the other side.

## Implementation

```python
def cross(o, a, b):
    """Cross product of (a - o) and (b - o)."""
    return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])

def sgn(x):
    return (x > 0) - (x < 0)

def overlap_1d(a, b, c, d):
    if a > b:
        a, b = b, a
    if c > d:
        c, d = d, c
    return max(a, c) <= min(b, d)

def segments_intersect(a, b, c, d):
    if (cross(c, a, d) == 0 and cross(c, b, d) == 0                 # everything on one line
            and cross(a, c, b) == 0 and cross(a, d, b) == 0):
        return overlap_1d(a[0], b[0], c[0], d[0]) and overlap_1d(a[1], b[1], c[1], d[1])
    return (sgn(cross(a, b, c)) != sgn(cross(a, b, d))
            and sgn(cross(c, d, a)) != sgn(cross(c, d, b)))

assert segments_intersect((0, 0), (4, 4), (0, 4), (4, 0))               # a cross
assert not segments_intersect((0, 0), (1, 1), (2, 2), (3, 3))            # collinear, disjoint
assert segments_intersect((0, 0), (2, 2), (1, 1), (3, 3))               # collinear, overlapping
assert segments_intersect((0, 0), (2, 0), (2, 0), (5, 5))               # touch at an endpoint
assert segments_intersect((0, 0), (4, 0), (2, 0), (2, 5))               # T-junction
assert not segments_intersect((0, 0), (4, 0), (0, 1), (4, 1))            # parallel
assert not segments_intersect((0, 0), (4, 0), (5, -1), (5, 1))           # the lines cross, the segments do not
assert segments_intersect((3, 3), (3, 3), (0, 0), (5, 5))               # a degenerate (point) segment
assert not segments_intersect((3, 4), (3, 4), (0, 0), (5, 5))
assert not segments_intersect((0, 4), (3, 0), (2, 3), (2, 3))              # a point near, but not on, the segment
```

The stricter test where merely touching does **not** count is obtained by requiring both sign products to be strictly negative.

## Verification against exact enumeration

To be sure, compare with an independent brute-force method: two segments with integer endpoints intersect iff they share a point. Scaling all coordinates by $2$ ensures that any intersection at a half-integer point (like the centre of a cross) becomes a lattice point, so we can just enumerate the points of the segments that have integer coordinates at scale $2$.

```python
import random
from fractions import Fraction

def brute(a, b, c, d):
    """Exact test: solve for the parameters with Fractions."""
    r = (b[0] - a[0], b[1] - a[1])
    s = (d[0] - c[0], d[1] - c[1])
    denom = r[0] * s[1] - r[1] * s[0]
    qp = (c[0] - a[0], c[1] - a[1])
    if denom != 0:
        t = Fraction(qp[0] * s[1] - qp[1] * s[0], denom)
        u = Fraction(qp[0] * r[1] - qp[1] * r[0], denom)
        return 0 <= t <= 1 and 0 <= u <= 1
    # parallel (or degenerate): collinear iff qp is parallel to r and to s
    if r == (0, 0) and s == (0, 0):
        return a == c
    if r == (0, 0):
        a, b, c, d = c, d, a, b
        r, s = s, r
        qp = (c[0] - a[0], c[1] - a[1])
    if r[0] * qp[1] - r[1] * qp[0] != 0:
        return False
    rr = r[0] * r[0] + r[1] * r[1]
    t0 = Fraction(qp[0] * r[0] + qp[1] * r[1], rr)
    t1 = t0 + Fraction(s[0] * r[0] + s[1] * r[1], rr)
    lo, hi = min(t0, t1), max(t0, t1)
    return hi >= 0 and lo <= 1

rnd = random.Random(2024)
for _ in range(20000):
    pts = [(rnd.randint(0, 4), rnd.randint(0, 4)) for _ in range(4)]
    assert segments_intersect(*pts) == brute(*pts), pts
```

The brute-force uses `Fraction` and a different derivation (solving for the parameters), so agreement on 20,000 random small cases, which include many collinear and degenerate ones, is strong evidence.

## Finding the actual intersection

If you need the intersection *point(s)*, see [segment intersection](/theory/geometry/segments-intersection); this test is the cheap first filter that avoids it when the segments do not meet. To test many segments against each other efficiently, use a [sweep line](/theory/geometry/intersecting-segments).

## Practice problems

- [CSES - Line Segment Intersection](https://cses.fi/problemset/task/2190)
