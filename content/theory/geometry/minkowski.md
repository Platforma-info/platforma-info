---
title: "Minkowski Sum of Convex Polygons"
section: Polygons
order: 5
difficulty: advanced
summary: "Merge the edges of two convex polygons by polar angle to build their Minkowski sum in linear time, and use it to get the distance between polygons."
tags: [geometry, minkowski sum, convex polygon, polar angle, distance]
prerequisites: [geometry/oriented-triangle-area, geometry/convex-hull]
source:
  title: "Minkowski sum of convex polygons"
  url: https://cp-algorithms.com/geometry/minkowski.html
  license: CC BY-SA 4.0
---

## Definition

The **Minkowski sum** of two sets of points $A$ and $B$ in the plane is

$$
A + B = \{\, a + b \mid a \in A,\ b \in B \,\}
$$

We consider $A$ and $B$ being convex polygons $P$ and $Q$ together with their interiors. The sum $P + Q$ is again a convex polygon and it has **at most $|P| + |Q|$ vertices**. Intuitively, it is the shape swept by $P$ when its reference point moves over all of $Q$.

## Algorithm

Both polygons are ordered counter-clockwise. Consider the sequences of edge vectors $\overrightarrow{P_iP_{i+1}}$ and $\overrightarrow{Q_jQ_{j+1}}$ sorted by polar angle. The edges of $P + Q$ are obtained by **merging** the two sequences by polar angle, adding together the co-directed edges. That is linear time, but rebuilding vertices from edge vectors accumulates rounding errors if coordinates are floats, so we merge the vertices directly:

1. Rotate each polygon so that its first vertex is the **lowest** one (smallest $y$, then smallest $x$). Now the edges of each polygon are already sorted by polar angle in $[0, 2\pi)$.
2. Keep two pointers $i, j$ starting at $0$. While there are unprocessed edges in $P$ or in $Q$:
   - append $P_i + Q_j$ to the result;
   - compare the polar angles of $\overrightarrow{P_iP_{i+1}}$ and $\overrightarrow{Q_jQ_{j+1}}$ by the sign of their cross product;
   - advance the pointer of the smaller angle, or both if the angles are equal.

With integer points no floating point arithmetic is needed: the comparison of angles is a cross-product sign.

## Implementation

```python
def cross(a, b):
    return a[0] * b[1] - a[1] * b[0]

def sub(a, b):
    return (a[0] - b[0], a[1] - b[1])

def add(a, b):
    return (a[0] + b[0], a[1] + b[1])

def reorder_polygon(poly):
    """Rotate so that the lowest (then leftmost) vertex comes first."""
    pos = min(range(len(poly)), key=lambda i: (poly[i][1], poly[i][0]))
    return poly[pos:] + poly[:pos]

def minkowski(P, Q):
    P, Q = reorder_polygon(P), reorder_polygon(Q)
    n, m = len(P), len(Q)
    P = P + [P[0], P[1]]                          # cyclic indexing
    Q = Q + [Q[0], Q[1]]
    result = []
    i = j = 0
    while i < n or j < m:
        result.append(add(P[i], Q[j]))
        c = cross(sub(P[i + 1], P[i]), sub(Q[j + 1], Q[j]))
        if c >= 0 and i < n:
            i += 1
        if c <= 0 and j < m:
            j += 1
    return result

square = [(0, 0), (1, 0), (1, 1), (0, 1)]
triangle = [(0, 0), (2, 0), (0, 2)]
assert minkowski(square, triangle) == [(0, 0), (3, 0), (3, 1), (1, 3), (0, 3)]
assert minkowski(square, square) == [(0, 0), (2, 0), (2, 2), (0, 2)]              # co-directed edges merge
```

## Verification against the definition

By definition, $P + Q$ is the convex hull of all sums of a vertex of $P$ with a vertex of $Q$ (since the sum of the polygons is convex and its vertices are sums of vertices). We compare with a straightforward $O(|P||Q|\log)$ hull of all sums:

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

rnd = random.Random(2)
tested = 0
for _ in range(1000):
    P = convex_hull([(rnd.randint(0, 9), rnd.randint(0, 9)) for _ in range(rnd.randint(3, 8))])
    Q = convex_hull([(rnd.randint(0, 9), rnd.randint(0, 9)) for _ in range(rnd.randint(3, 8))])
    if len(P) < 3 or len(Q) < 3:
        continue
    fast = minkowski(P, Q)
    slow = convex_hull([add(p, q) for p in P for q in Q])
    assert len(fast) <= len(P) + len(Q)
    assert sorted(fast) == sorted(slow)                     # same vertices ...
    assert fast == reorder_polygon(slow)                    # ... in the same order
    tested += 1
assert tested > 800
```

## Distance between two convex polygons

A common application: the distance $\min_{a\in P,\,b\in Q}\|a - b\|$ between two convex polygons (which is $0$ if they intersect).

Reflect $Q$ through the origin to get $-Q$. Then $a - b$ ranges over $P + (-Q)$, so the problem becomes: **the distance from the origin to the convex polygon $P + (-Q)$**. That is $0$ if the origin is inside or on the boundary, and otherwise the distance to the nearest edge. As the sum is built in $O(|P| + |Q|)$, the whole algorithm is linear, versus $O(|P||Q|)$ for checking all pairs.

This also gives a fast **intersection test**: the polygons intersect iff the origin belongs to $P + (-Q)$.

```python
import math

def point_segment_distance(p, a, b):
    dx, dy = b[0] - a[0], b[1] - a[1]
    t = max(0, min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy)))
    return math.dist(p, (a[0] + t * dx, a[1] + t * dy))

def inside_convex(poly, p):
    n = len(poly)
    return all(cross(sub(poly[(i + 1) % n], poly[i]), sub(p, poly[i])) >= 0 for i in range(n))

def polygon_distance(P, Q):
    D = minkowski(P, [(-x, -y) for x, y in Q])
    if inside_convex(D, (0, 0)):
        return 0.0
    return min(point_segment_distance((0, 0), D[i], D[(i + 1) % len(D)]) for i in range(len(D)))

unit = [(0, 0), (1, 0), (1, 1), (0, 1)]
far = [(4, 0), (5, 0), (5, 1), (4, 1)]
assert polygon_distance(unit, far) == 3.0
assert polygon_distance(unit, [(1, 0), (2, 0), (2, 1), (1, 1)]) == 0.0            # they touch along an edge
assert polygon_distance(unit, [(0, 0), (3, 0), (0, 3)]) == 0.0                     # overlap
assert abs(polygon_distance(unit, [(3, 3), (4, 3), (3, 4)]) - math.dist((1, 1), (3, 3))) < 1e-12

def brute_distance(P, Q):
    """Distance between two polygons that are known to be disjoint: vertex-to-edge minimum."""
    best = float("inf")
    for A, B in ((P, Q), (Q, P)):
        for p in A:
            for i in range(len(B)):
                best = min(best, point_segment_distance(p, B[i], B[(i + 1) % len(B)]))
    return best

checked = 0
for _ in range(1500):
    P = convex_hull([(rnd.randint(0, 9), rnd.randint(0, 9)) for _ in range(rnd.randint(3, 7))])
    Q = convex_hull([(rnd.randint(8, 20), rnd.randint(0, 20)) for _ in range(rnd.randint(3, 7))])
    if len(P) < 3 or len(Q) < 3:
        continue
    d = polygon_distance(P, Q)
    if d > 0:
        assert abs(d - brute_distance(P, Q)) < 1e-9
        checked += 1
assert checked > 500
```

## Practice problems

- [Codeforces 87E Mogohu-Rea Idol](https://codeforces.com/problemset/problem/87/E)
- [Codeforces 1195F Geometers Anonymous Club](https://codeforces.com/contest/1195/problem/F)
- [TIMUS 1894 Non-Flying Weather](https://acm.timus.ru/problem.aspx?space=1&num=1894)
