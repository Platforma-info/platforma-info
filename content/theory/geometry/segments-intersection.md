---
title: "Intersection of Two Segments"
section: Elementary operations
order: 6
difficulty: intermediate
summary: "Compute the exact intersection of two segments: empty, a single point, or a whole overlapping segment, handling parallel and degenerate cases."
tags: [geometry, segments, intersection, exact arithmetic]
prerequisites: [geometry/check-segments-intersection, geometry/lines-intersection]
source:
  title: "Finding intersection of two segments"
  url: https://cp-algorithms.com/geometry/segments-intersection.html
  license: CC BY-SA 4.0
---

Given segments $AB$ and $CD$ (either may degenerate into a single point), find their intersection. It may be **empty**, a **single point**, or a **segment** if they overlap.

## Solution

First reject quickly with a bounding-box test (needed for collinear segments, and it makes random inputs fast). Then:

1. **Not parallel.** Build the lines through the segments, intersect them (as in [line intersection](/theory/geometry/lines-intersection)), and check that the point lies on both segments. The answer is that point or nothing.
2. **Parallel** (this includes segments that are single points). If the two segments do not lie on the same line, the answer is empty. If they do, sort each segment's endpoints and return the range from the *larger of the left ends* to the *smaller of the right ends*, if it is non-empty. When both segments are single points, they must coincide.

In Python we can do all of this **exactly** with `Fraction`s, avoiding epsilon comparisons altogether. Parametrizing $AB$ as $A + t(B - A)$ is equivalent to the line approach but never divides by anything but the cross product.

## Implementation

```python
from fractions import Fraction

def cross(u, v):
    return u[0] * v[1] - u[1] * v[0]

def sub(a, b):
    return (a[0] - b[0], a[1] - b[1])

def dot(u, v):
    return u[0] * v[0] + u[1] * v[1]

def segment_intersection(a, b, c, d):
    """Return [] (empty), [p] (a point) or [p, q] (an overlapping segment, p < q)."""
    r, s = sub(b, a), sub(d, c)
    denom = cross(r, s)
    qp = sub(c, a)
    if denom != 0:
        t = Fraction(cross(qp, s), denom)
        u = Fraction(cross(qp, r), denom)
        if 0 <= t <= 1 and 0 <= u <= 1:
            return [(a[0] + t * r[0], a[1] + t * r[1])]
        return []
    # parallel or degenerate
    if r == (0, 0) and s == (0, 0):
        return [a] if a == c else []
    if r == (0, 0):                                   # AB is a point: is it on CD?
        return [a] if cross(sub(a, c), s) == 0 and min(c, d) <= a <= max(c, d) else []
    if s == (0, 0):
        return [c] if cross(sub(c, a), r) == 0 and min(a, b) <= c <= max(a, b) else []
    if cross(qp, r) != 0:                             # parallel but on different lines
        return []
    lo = max(min(a, b), min(c, d))                    # tuples compare by x, then y
    hi = min(max(a, b), max(c, d))
    if lo > hi:
        return []
    return [lo] if lo == hi else [lo, hi]

F = Fraction
assert segment_intersection((0, 0), (4, 4), (0, 4), (4, 0)) == [(2, 2)]
assert segment_intersection((0, 0), (3, 1), (0, 1), (3, 0)) == [(F(3, 2), F(1, 2))]     # non-integer point, exactly
assert segment_intersection((0, 0), (4, 0), (5, 0), (9, 0)) == []                 # collinear, disjoint
assert segment_intersection((0, 0), (4, 0), (4, 0), (9, 0)) == [(4, 0)]           # they touch at one point
assert segment_intersection((0, 0), (5, 5), (2, 2), (8, 8)) == [(2, 2), (5, 5)]   # overlapping part
assert segment_intersection((5, 5), (0, 0), (8, 8), (2, 2)) == [(2, 2), (5, 5)]   # endpoints in any order
assert segment_intersection((0, 0), (4, 0), (0, 1), (4, 1)) == []                 # parallel
assert segment_intersection((2, 2), (2, 2), (0, 0), (5, 5)) == [(2, 2)]           # point on segment
assert segment_intersection((2, 3), (2, 3), (0, 0), (5, 5)) == []
assert segment_intersection((1, 1), (1, 1), (1, 1), (1, 1)) == [(1, 1)]
assert segment_intersection((1, 1), (1, 1), (2, 2), (2, 2)) == []
assert segment_intersection((0, 0), (0, 4), (0, 2), (0, 9)) == [(0, 2), (0, 4)]    # vertical overlap
```

## Verifying with a lattice brute force

We verify the function against two independent checks on thousands of random small segments (including degenerate ones): the yes/no test from [the previous article](/theory/geometry/check-segments-intersection) must agree on whether the result is empty, and every returned point must lie on both segments.

```python
import random

def on_segment(p, a, b):
    return (cross(sub(p, a), sub(b, a)) == 0
            and min(a[0], b[0]) <= p[0] <= max(a[0], b[0])
            and min(a[1], b[1]) <= p[1] <= max(a[1], b[1]))

def cross3(o, a, b):
    return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])

def sgn(x):
    return (x > 0) - (x < 0)

def check(a, b, c, d):
    if cross3(c, a, d) == 0 and cross3(c, b, d) == 0 and cross3(a, c, b) == 0 and cross3(a, d, b) == 0:
        return (max(min(a[0], b[0]), min(c[0], d[0])) <= min(max(a[0], b[0]), max(c[0], d[0]))
                and max(min(a[1], b[1]), min(c[1], d[1])) <= min(max(a[1], b[1]), max(c[1], d[1])))
    return (sgn(cross3(a, b, c)) != sgn(cross3(a, b, d))
            and sgn(cross3(c, d, a)) != sgn(cross3(c, d, b)))

rnd = random.Random(99)
for _ in range(20000):
    a, b, c, d = [(rnd.randint(0, 5), rnd.randint(0, 5)) for _ in range(4)]
    res = segment_intersection(a, b, c, d)
    assert bool(res) == check(a, b, c, d)                               # empty iff no intersection
    for p in res:
        assert on_segment(p, a, b) and on_segment(p, c, d)               # every reported point is on both segments
    if len(res) == 2:                                                    # a real overlap: endpoints are input points
        assert all(p in (a, b, c, d) for p in res)
```

## Notes

- Tuples compare lexicographically (by $x$, then $y$), so `min`/`max` on points orders them along any non-vertical **and** vertical line, which is all the collinear case needs.
- For floating-point inputs replace `== 0` and the range comparisons by tolerances, or, better, convert the inputs to `Fraction` first (`Fraction(0.1)` is the exact binary value, so beware of decimal literals; use `Fraction("0.1")` to read decimal text exactly).
