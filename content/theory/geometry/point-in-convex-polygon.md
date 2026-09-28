---
title: "Point in a Convex Polygon in O(log n)"
section: Polygons
order: 4
difficulty: advanced
summary: "Answer many point-in-polygon queries against a convex polygon by binary searching the fan of triangles around its lowest-leftmost vertex."
tags: [geometry, convex polygon, binary search, point location, cross product]
prerequisites: [geometry/oriented-triangle-area, searching/binary-search]
source:
  title: "Check if point belongs to the convex polygon in O(log N)"
  url: https://cp-algorithms.com/geometry/point-in-convex-polygon.html
  license: CC BY-SA 4.0
---

Given a convex polygon with integer vertices and many queries, each a point, decide for each whether it lies inside or on the boundary. After an $O(n)$ preparation each query is answered online in $O(\log n)$.

(For a single query, or for a non-convex polygon, a plain $O(n)$ test is enough; see the last section.)

## Algorithm

Let the polygon be ordered counter-clockwise, and let $p_0$ be its vertex with the smallest $x$ (the smallest $y$ among ties). Seen from $p_0$, the other vertices $p_1, \dots, p_n$ are sorted by polar angle, and the polygon is the union of the **fan of triangles** $(p_0, p_i, p_{i+1})$.

For a query point $p$:

1. If $p$ is outside the wedge between the rays $p_0p_1$ and $p_0p_n$, it is outside the polygon. Two cross products decide this.
2. If $p$ is on the ray $p_0p_1$, it is inside exactly when it is not farther from $p_0$ than $p_1$.
3. Otherwise binary search for the last vertex $p_i$ for which $(p_i - p_0)\times(p - p_0) \ge 0$, meaning $p$ is on the left of (or on) the ray $p_0p_i$. Then $p$ is in the polygon iff it is in the triangle $(p_0, p_i, p_{i+1})$.

The triangle test compares areas: $p$ is in the triangle iff the areas of the three triangles that $p$ forms with the sides add up to the triangle's own area. With absolute values of cross products, everything stays in integers.

## Implementation

```python
def cross(a, b):
    return a[0] * b[1] - a[1] * b[0]

def sub(a, b):
    return (a[0] - b[0], a[1] - b[1])

def sgn(x):
    return (x > 0) - (x < 0)

class ConvexPolygon:
    """A counter-clockwise, strictly convex polygon prepared for O(log n) membership queries."""

    def __init__(self, points):
        start = min(range(len(points)), key=lambda i: points[i])        # lexicographically smallest vertex
        points = points[start:] + points[:start]
        self.origin = points[0]
        self.seq = [sub(p, self.origin) for p in points[1:]]            # vectors p_i - p_0
        self.n = len(self.seq)

    def contains(self, point):
        seq, n = self.seq, self.n
        q = sub(point, self.origin)
        first, last = cross(seq[0], q), cross(seq[n - 1], q)
        if first != 0 and sgn(first) != sgn(cross(seq[0], seq[n - 1])):
            return False                                                 # outside the wedge
        if last != 0 and sgn(last) != sgn(cross(seq[n - 1], seq[0])):
            return False
        if first == 0:                                                   # on the ray p_0 -> p_1
            return seq[0][0] ** 2 + seq[0][1] ** 2 >= q[0] ** 2 + q[1] ** 2
        lo, hi = 0, n - 1
        while hi - lo > 1:                                               # binary search for the triangle
            mid = (lo + hi) // 2
            if cross(seq[mid], q) >= 0:
                lo = mid
            else:
                hi = mid
        a, b = seq[lo], seq[lo + 1]
        whole = abs(cross(a, b))                                         # area of (p_0, a, b), doubled
        parts = abs(cross(q, a)) + abs(cross(sub(a, q), sub(b, q))) + abs(cross(b, q))
        return whole == parts

square = ConvexPolygon([(0, 0), (4, 0), (4, 4), (0, 4)])
assert square.contains((2, 2)) and square.contains((0, 0)) and square.contains((4, 4))
assert square.contains((2, 0)) and square.contains((4, 3)) and square.contains((0, 3))    # the boundary counts as inside
assert not square.contains((5, 2)) and not square.contains((-1, 2))
assert not square.contains((2, 5)) and not square.contains((2, -1))

hexagon = ConvexPolygon([(2, 0), (5, 1), (6, 4), (4, 6), (1, 5), (0, 2)])
assert hexagon.contains((3, 3)) and hexagon.contains((2, 0)) and not hexagon.contains((1, 0))
```

The input must be a **strictly convex** polygon in counter-clockwise order (no three consecutive collinear vertices). Rotating the list so that the smallest point comes first takes $O(n)$, once.

## Testing against an $O(n)$ check

A point is inside a convex counter-clockwise polygon iff it is on the left of (or on) every edge. We can test all the points of a grid around many random polygons. The polygons come from a convex hull routine (monotone chain, see the [convex hull article](/theory/geometry/convex-hull)):

```python
import random

def convex_hull(points):
    pts = sorted(set(points))
    if len(pts) < 3:
        return pts
    def half(seq):
        h = []
        for p in seq:
            while len(h) >= 2 and cross(sub(h[-1], h[-2]), sub(p, h[-2])) <= 0:
                h.pop()
            h.append(p)
        return h[:-1]
    return half(pts) + half(pts[::-1])

def contains_slow(poly, q):
    n = len(poly)
    return all(cross(sub(poly[(i + 1) % n], poly[i]), sub(q, poly[i])) >= 0 for i in range(n))

rnd = random.Random(1)
polygons = queries = 0
for _ in range(400):
    hull = convex_hull([(rnd.randint(0, 8), rnd.randint(0, 8)) for _ in range(rnd.randint(3, 9))])
    if len(hull) < 3:
        continue
    fast = ConvexPolygon(hull)
    polygons += 1
    for x in range(-2, 11):
        for y in range(-2, 11):
            queries += 1
            assert fast.contains((x, y)) == contains_slow(hull, (x, y)), (hull, (x, y))
assert polygons > 300 and queries > 40000
```

## Other polygons: the ray casting test

For arbitrary (possibly non-convex) polygons, count how many edges a horizontal ray from the query point crosses; an odd number means inside. It takes $O(n)$ per query, and needs separate handling for points on the boundary.

```python
def inside_or_on_boundary(poly, p):
    n = len(poly)
    inside = False
    for i in range(n):
        a, b = poly[i], poly[(i + 1) % n]
        if cross(sub(b, a), sub(p, a)) == 0 and min(a[0], b[0]) <= p[0] <= max(a[0], b[0]) \
                and min(a[1], b[1]) <= p[1] <= max(a[1], b[1]):
            return True                                          # on an edge
        if (a[1] > p[1]) != (b[1] > p[1]):
            # x-coordinate of the crossing compared to p.x, kept in integers
            if (cross(sub(b, a), sub(p, a)) > 0) == (b[1] > a[1]):
                inside = not inside
    return inside

L = [(0, 0), (6, 0), (6, 2), (2, 2), (2, 6), (0, 6)]              # a concave polygon
assert inside_or_on_boundary(L, (1, 5)) and inside_or_on_boundary(L, (5, 1))
assert not inside_or_on_boundary(L, (4, 4)) and inside_or_on_boundary(L, (2, 4))

# the fast and the general test agree on convex polygons
for _ in range(100):
    hull = convex_hull([(rnd.randint(0, 8), rnd.randint(0, 8)) for _ in range(6)])
    if len(hull) >= 3:
        for x in range(-1, 10):
            for y in range(-1, 10):
                assert inside_or_on_boundary(hull, (x, y)) == contains_slow(hull, (x, y))
```

## Practice problems

- [SGU253 Theodore Roosevelt](https://codeforces.com/problemsets/acmsguru/problem/99999/253)
- [Codeforces 55E Very simple problem](https://codeforces.com/contest/55/problem/E)
- [Codeforces 166B Polygons](https://codeforces.com/problemset/problem/166/B)
