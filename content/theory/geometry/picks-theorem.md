---
title: "Pick's Theorem"
section: Polygons
order: 2
difficulty: intermediate
summary: "The area of a lattice polygon from its interior and boundary lattice points: S = I + B/2 − 1, with a proof outline and a brute-force verification."
tags: [geometry, lattice, polygon, area, pick]
prerequisites: [geometry/area-of-simple-polygon, math/euclidean-algorithm]
source:
  title: "Pick's Theorem"
  url: https://cp-algorithms.com/geometry/picks-theorem.html
  license: CC BY-SA 4.0
---

A polygon without self-intersections is a **lattice polygon** if all its vertices have integer coordinates. Pick's theorem connects its area to the number of lattice points inside it and on its boundary.

## The formula

For a lattice polygon of positive area, let $S$ be its area, $I$ the number of lattice points **strictly inside** and $B$ the number of lattice points **on the boundary**. Then

$$
S = I + \frac{B}{2} - 1
$$

So if $I$ and $B$ are known, the area follows in $O(1)$ without the vertices; conversely, the *number of interior lattice points* can be computed from the area (which is easy to get) and $B$:

$$
I = S - \frac{B}{2} + 1
$$

The theorem was published by Georg Alexander Pick in 1899.

## Computing $B$

On the segment between lattice points $(x_1, y_1)$ and $(x_2, y_2)$ there are $\gcd(|x_2 - x_1|, |y_2 - y_1|) + 1$ lattice points including the endpoints. Summing over edges, counting each vertex once, gives

$$
B = \sum_{\text{edges}} \gcd(|\Delta x|, |\Delta y|)
$$

```python
from math import gcd

def boundary_points(poly):
    n = len(poly)
    return sum(gcd(abs(poly[i][0] - poly[(i + 1) % n][0]), abs(poly[i][1] - poly[(i + 1) % n][1]))
               for i in range(n))

def area2(poly):
    """Twice the area (an integer for a lattice polygon)."""
    n = len(poly)
    return abs(sum(poly[i][0] * poly[(i + 1) % n][1] - poly[(i + 1) % n][0] * poly[i][1] for i in range(n)))

def interior_points(poly):
    # Pick: 2S = 2I + B - 2   =>   I = (2S - B + 2) / 2
    return (area2(poly) - boundary_points(poly) + 2) // 2

assert boundary_points([(0, 0), (4, 0), (4, 3), (0, 3)]) == 14
assert interior_points([(0, 0), (4, 0), (4, 3), (0, 3)]) == 6                # 3 x 2 interior lattice points
assert boundary_points([(0, 0), (6, 4), (0, 4)]) == 2 + 6 + 4        # gcd(6,4) = 2, then 6 and 4
```

## Verifying against brute force

Enumerate all lattice points near a random lattice triangle or polygon and classify each as inside, on the boundary or outside, using exact integer arithmetic:

```python
import random

def on_segment(p, a, b):
    return ((b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]) == 0
            and min(a[0], b[0]) <= p[0] <= max(a[0], b[0])
            and min(a[1], b[1]) <= p[1] <= max(a[1], b[1]))

def strictly_inside(poly, p):
    """Ray casting with exact integer arithmetic; p must not be on the boundary."""
    inside = False
    n = len(poly)
    for i in range(n):
        (x1, y1), (x2, y2) = poly[i], poly[(i + 1) % n]
        if (y1 > p[1]) != (y2 > p[1]):
            # is the crossing to the right of p?  x_cross > p.x  <=>  compare with cross product sign
            cross = (x2 - x1) * (p[1] - y1) - (p[0] - x1) * (y2 - y1)
            if (cross > 0) == (y2 > y1):
                inside = not inside
    return inside

def brute_counts(poly):
    xs, ys = [p[0] for p in poly], [p[1] for p in poly]
    inner = boundary = 0
    for x in range(min(xs), max(xs) + 1):
        for y in range(min(ys), max(ys) + 1):
            p = (x, y)
            if any(on_segment(p, poly[i], poly[(i + 1) % len(poly)]) for i in range(len(poly))):
                boundary += 1
            elif strictly_inside(poly, p):
                inner += 1
    return inner, boundary

# the theorem on a few random triangles
rnd = random.Random(12)
checked = 0
while checked < 200:
    tri = [(rnd.randint(0, 12), rnd.randint(0, 12)) for _ in range(3)]
    if area2(tri) == 0:
        continue
    inner, boundary = brute_counts(tri)
    assert boundary == boundary_points(tri)
    assert inner == interior_points(tri)
    assert 2 * inner + boundary - 2 == area2(tri)                  # Pick's formula, doubled to stay in integers
    checked += 1

# and on a non-convex polygon
L = [(0, 0), (6, 0), (6, 2), (2, 2), (2, 6), (0, 6)]
inner, boundary = brute_counts(L)
assert (inner, boundary) == (interior_points(L), boundary_points(L))
assert 2 * inner + boundary - 2 == area2(L) == 2 * 20
```

## Why it is true (proof outline)

The proof goes from simple shapes to arbitrary ones:

1. **Unit square**: $S = 1$, $I = 0$, $B = 4$, and $0 + 2 - 1 = 1$.
2. **Axis-parallel rectangle** $a \times b$: $S = ab$, $I = (a-1)(b-1)$, $B = 2(a+b)$; substituting gives $ab$.
3. **Right triangle with legs parallel to the axes**: half of a rectangle cut by a diagonal; the lattice points on the diagonal do not matter.
4. **Any triangle**: complete it into a rectangle with at most 3 such right triangles.
5. **Any polygon**: triangulate it. Pick's formula is additive when two polygons are glued along a common edge, so it holds for the whole polygon.

## Higher dimensions

The formula does *not* generalize to 3D in a simple way. **Reeve's tetrahedron** with vertices $(0,0,0)$, $(1,0,0)$, $(0,1,0)$ and $(1,1,k)$ has no lattice points other than its four vertices for every $k$, yet its volume $k/6$ grows with $k$. The correct higher-dimensional statement uses **Ehrhart polynomials**.

```python
from fractions import Fraction

def tetra_volume(a, b, c, d):
    u = [b[i] - a[i] for i in range(3)]
    v = [c[i] - a[i] for i in range(3)]
    w = [d[i] - a[i] for i in range(3)]
    det = (u[0] * (v[1] * w[2] - v[2] * w[1]) - u[1] * (v[0] * w[2] - v[2] * w[0]) + u[2] * (v[0] * w[1] - v[1] * w[0]))
    return Fraction(abs(det), 6)

def lattice_points_in_tetra(a, b, c, d, box):
    """Count integer points in the closed tetrahedron using barycentric coordinates (exact)."""
    def det3(p, q, r):
        return (p[0] * (q[1] * r[2] - q[2] * r[1]) - p[1] * (q[0] * r[2] - q[2] * r[0]) + p[2] * (q[0] * r[1] - q[1] * r[0]))
    sub = lambda p, q: tuple(p[i] - q[i] for i in range(3))
    u, v, w = sub(b, a), sub(c, a), sub(d, a)
    total = det3(u, v, w)
    count = 0
    for x in range(box[0]):
        for y in range(box[1]):
            for z in range(box[2]):
                p = sub((x, y, z), a)
                s = [Fraction(det3(p, v, w), total), Fraction(det3(u, p, w), total), Fraction(det3(u, v, p), total)]
                if all(t >= 0 for t in s) and sum(s) <= 1:
                    count += 1
    return count

for k in range(1, 8):
    A, B, C, D = (0, 0, 0), (1, 0, 0), (0, 1, 0), (1, 1, k)
    assert tetra_volume(A, B, C, D) == Fraction(k, 6)
    assert lattice_points_in_tetra(A, B, C, D, (2, 2, k + 1)) == 4        # only the four vertices
```
