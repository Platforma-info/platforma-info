---
title: "Convex Hull: Monotone Chain and Graham Scan"
section: Convex hull
order: 1
difficulty: intermediate
summary: "Build the smallest convex polygon containing a point set in O(n log n) with Andrew's monotone chain or Graham's scan, with or without collinear points."
tags: [geometry, convex hull, monotone chain, graham scan, sorting]
prerequisites: [geometry/oriented-triangle-area]
source:
  title: "Convex Hull construction"
  url: https://cp-algorithms.com/geometry/convex-hull.html
  license: CC BY-SA 4.0
---

The **convex hull** of a set of points is the smallest convex polygon that contains all of them: picture a rubber band stretched around nails hammered at the points. We look at two classic $O(n\log n)$ algorithms, Andrew's **monotone chain** and Graham's **scan**. Both are asymptotically optimal for the general problem.

Everything below uses the sign of the cross product (the [orientation](/theory/geometry/oriented-triangle-area) of three points), so with integer coordinates the results are exact.

```python
def cross(o, a, b):
    """> 0 if o -> a -> b turns counter-clockwise, < 0 if clockwise, 0 if collinear."""
    return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])
```

## Monotone chain

Sort the points by $x$ (then $y$). The leftmost point $A$ and the rightmost point $B$ are certainly on the hull. The line $AB$ splits the rest into an **upper** part and a **lower** part, and each is a chain that we build with a stack:

- go through the points in sorted order;
- before pushing a point onto the stack, pop the top while the last two stack points and the new point do **not** make a proper turn (for the lower hull: not a counter-clockwise turn).

Doing this once left to right gives the lower hull, and once right to left gives the upper hull. Concatenating them (dropping each chain's last point, which is the first point of the other) gives the hull in **counter-clockwise** order, starting from the leftmost-lowest point.

```python
def convex_hull(points, include_collinear=False):
    """Counter-clockwise hull of a set of points (Andrew's monotone chain), O(n log n).

    By default, points that lie on a hull edge are dropped; pass include_collinear=True to keep them.
    """
    pts = sorted(set(points))
    if len(pts) <= 2:
        return pts

    def chain(seq):
        h = []
        for p in seq:
            if include_collinear:
                while len(h) >= 2 and cross(h[-2], h[-1], p) < 0:
                    h.pop()
            else:
                while len(h) >= 2 and cross(h[-2], h[-1], p) <= 0:
                    h.pop()
            h.append(p)
        return h

    lower, upper = chain(pts), chain(pts[::-1])
    if include_collinear and all(cross(pts[0], pts[1], p) == 0 for p in pts):
        return pts                                # every point on one line: the "hull" is the whole line
    return lower[:-1] + upper[:-1]

square = [(0, 0), (4, 0), (4, 4), (0, 4)]
cloud = square + [(2, 2), (1, 3), (3, 1), (2, 0), (0, 2)]
assert convex_hull(cloud) == [(0, 0), (4, 0), (4, 4), (0, 4)]
assert convex_hull(cloud, include_collinear=True) == [(0, 0), (2, 0), (4, 0), (4, 4), (0, 4), (0, 2)]
assert convex_hull([(1, 1)]) == [(1, 1)]
assert convex_hull([(0, 0), (1, 1), (2, 2), (3, 3)]) == [(0, 0), (3, 3)]                    # collinear input
assert convex_hull([(0, 0), (1, 1), (2, 2), (3, 3)], include_collinear=True) == [(0, 0), (1, 1), (2, 2), (3, 3)]
assert convex_hull([(2, 3), (2, 3), (2, 3)]) == [(2, 3)]                                    # duplicates
```

Duplicates are removed by `set`. With `include_collinear=True` the degenerate case where all points are on one line would otherwise print the same points twice, so it returns the sorted line directly.

## Graham's scan

Graham's scan works around the **lowest point** $P_0$ (smallest $y$, then smallest $x$), which is on the hull:

1. Sort all other points by polar angle around $P_0$; among equal angles, closer points first.
2. Process the points in this order with a stack; pop the top while the top two and the new point don't make a counter-clockwise turn.

The stack ends up as the hull. Comparing polar angles is a cross-product sign, so no trigonometry is needed. Python's `sort` takes a key, not a comparison, so we wrap the comparison with `functools.cmp_to_key`.

```python
from functools import cmp_to_key

def graham_scan(points):
    pts = sorted(set(points), key=lambda p: (p[1], p[0]))
    if len(pts) <= 2:
        return pts
    p0 = pts[0]

    def compare(a, b):
        o = cross(p0, a, b)
        if o != 0:
            return -1 if o > 0 else 1                              # counter-clockwise first
        da = (a[0] - p0[0]) ** 2 + (a[1] - p0[1]) ** 2
        db = (b[0] - p0[0]) ** 2 + (b[1] - p0[1]) ** 2
        return -1 if da < db else 1 if da > db else 0

    rest = sorted(pts[1:], key=cmp_to_key(compare))
    stack = [p0]
    for p in rest:
        while len(stack) >= 2 and cross(stack[-2], stack[-1], p) <= 0:
            stack.pop()
        stack.append(p)
    return stack

def rotate_to_start(poly):
    i = min(range(len(poly)), key=lambda k: poly[k])
    return poly[i:] + poly[:i]

assert rotate_to_start(graham_scan(cloud)) == convex_hull(cloud)
assert graham_scan([(0, 0), (2, 2), (1, 1)]) == [(0, 0), (2, 2)]
```

Graham's version with collinear points kept has one subtlety (the points on the last ray must be reversed before scanning), which is why the monotone chain, which needs no special case, is the usual choice.

## Testing against gift wrapping

An independent algorithm, **Jarvis's march** (gift wrapping, $O(nh)$ for $h$ hull vertices), gives us a reference: starting from the leftmost point, repeatedly pick the point such that all others are to its left.

```python
import random

def gift_wrapping(points):
    pts = list(set(points))
    if len(pts) <= 2:
        return sorted(pts)
    start = min(pts)
    hull, cur = [], start
    while True:
        hull.append(cur)
        nxt = pts[0] if pts[0] != cur else pts[1]
        for p in pts:
            if p == cur:
                continue
            o = cross(cur, nxt, p)
            far = (p[0] - cur[0]) ** 2 + (p[1] - cur[1]) ** 2 > (nxt[0] - cur[0]) ** 2 + (nxt[1] - cur[1]) ** 2
            if o < 0 or (o == 0 and far):           # p is to the right of cur -> nxt (or farther on the same ray)
                nxt = p
        cur = nxt
        if cur == start:
            break
    return hull

rnd = random.Random(6)
for _ in range(1500):
    pts = [(rnd.randint(0, 9), rnd.randint(0, 9)) for _ in range(rnd.randint(1, 25))]
    expected = gift_wrapping(pts)
    assert convex_hull(pts) == expected, pts
    if len(expected) >= 3:
        assert rotate_to_start(graham_scan(pts)) == expected
        # every input point is inside the hull, and every vertex is a strict turn
        n = len(expected)
        assert all(cross(expected[i], expected[(i + 1) % n], p) >= 0 for i in range(n) for p in pts)
        assert all(cross(expected[i], expected[(i + 1) % n], expected[(i + 2) % n]) > 0 for i in range(n))
```

## Using the hull

Once you have the hull as a counter-clockwise polygon, many quantities are easy:

```python
import math

def hull_area2(h):                       # twice the area (shoelace formula)
    return sum(h[i][0] * h[(i + 1) % len(h)][1] - h[(i + 1) % len(h)][0] * h[i][1] for i in range(len(h)))

def hull_perimeter(h):
    return sum(math.dist(h[i], h[(i + 1) % len(h)]) for i in range(len(h)))

def diameter2(h):
    """Squared diameter of the point set: the farthest pair is always a pair of hull vertices."""
    return max((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 for a in h for b in h)

h = convex_hull(cloud)
assert hull_area2(h) == 32 and abs(hull_perimeter(h) - 16) < 1e-12 and diameter2(h) == 32

for _ in range(200):
    pts = [(rnd.randint(0, 30), rnd.randint(0, 30)) for _ in range(rnd.randint(3, 20))]
    hull = convex_hull(pts)
    assert diameter2(hull) == max((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 for a in pts for b in pts)
```

(The `diameter2` above is $O(h^2)$; with *rotating calipers* it takes $O(h)$.)

- Dynamic hull, hulls of moving points, and the hull in 3D are the next steps; the 2D static case above covers nearly all contest problems.
- To test whether a point is in the hull quickly use [point in convex polygon](/theory/geometry/point-in-convex-polygon).
- The [convex hull trick](/theory/geometry/convex-hull-trick) applies the same ideas to optimize DP.

## Practice problems

- [Kattis - Convex Hull](https://open.kattis.com/problems/convexhull)
- [Kattis - Keep the Parade Safe](https://open.kattis.com/problems/parade)
- [Codeforces - I. Birthday](https://codeforces.com/contest/2172/problem/I)
- [Latin American Regionals 2006 - Onion Layers](https://matcomgrader.com/problem/9413/onion-layers/)
- [Timus 1185: Wall](http://acm.timus.ru/problem.aspx?space=1&num=1185)
- [Usaco 2014 January Contest, Gold - Cow Curling](http://usaco.org/index.php?page=viewproblem2&cpid=382)
