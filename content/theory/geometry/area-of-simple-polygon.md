---
title: "Area of a Simple Polygon"
section: Polygons
order: 1
difficulty: beginner
summary: "The shoelace formula: add the signed trapezoids under every edge, or the signed triangles from any fixed point, in O(n)."
tags: [geometry, polygon, area, shoelace, orientation]
prerequisites: [geometry/oriented-triangle-area]
source:
  title: "Finding area of simple polygon in O(N)"
  url: https://cp-algorithms.com/geometry/area-of-simple-polygon.html
  license: CC BY-SA 4.0
---

Given the vertices of a **simple** polygon (its edges do not cross, but it need not be convex), compute its area in $O(n)$.

## Method 1: trapezoids under each edge

Walk along the boundary and, for each edge $(p, q)$, add the signed area of the trapezoid between the edge and the $x$-axis. Edges going one way add area and edges going back subtract the excess, leaving exactly the polygon:

$$
A = \left|\sum_{(p,q)\in \text{edges}} \frac{(p_x - q_x)(p_y + q_y)}{2}\right|
$$

```python
def area_trapezoids(poly):
    total = 0
    prev = poly[-1]
    for cur in poly:
        total += (prev[0] - cur[0]) * (prev[1] + cur[1])
        prev = cur
    return abs(total) / 2

assert area_trapezoids([(0, 0), (4, 0), (4, 3), (0, 3)]) == 12          # rectangle
assert area_trapezoids([(0, 0), (4, 0), (0, 3)]) == 6                    # triangle
assert area_trapezoids([(0, 0), (4, 0), (0, 3)][::-1]) == 6              # orientation does not matter
```

## Method 2: triangles from a fixed point

Pick any point $O$ and add the **oriented** areas of the triangles $(O, p_i, p_{i+1})$. Where the polygon is on the "wrong side" of $O$ the areas are negative and cancel the excess. Choosing $O$ as the origin gives the classic **shoelace formula**:

$$
2A = \left|\sum_i \big(x_i\,y_{i+1} - x_{i+1}\,y_i\big)\right|
$$

This one generalizes better: for example, to shapes whose sides are circular arcs, where each piece is a sector plus a triangle.

```python
def cross(a, b):
    return a[0] * b[1] - a[1] * b[0]

def area2_signed(poly):
    """Twice the signed area: positive if the vertices are in counter-clockwise order."""
    return sum(cross(poly[i], poly[(i + 1) % len(poly)]) for i in range(len(poly)))

def area(poly):
    return abs(area2_signed(poly)) / 2

def is_ccw(poly):
    return area2_signed(poly) > 0

square = [(0, 0), (4, 0), (4, 4), (0, 4)]
assert area2_signed(square) == 32 and area(square) == 16
assert is_ccw(square) and not is_ccw(square[::-1])
# a concave "L" shape: 3 x 3 square minus a 1 x 1 corner
L = [(0, 0), (3, 0), (3, 1), (1, 1), (1, 3), (0, 3)]
assert area(L) == 5 and area_trapezoids(L) == 5
# translating the polygon does not change the area
assert area([(x + 1000, y - 77) for x, y in L]) == 5
```

Both methods give the same answer, and for integer coordinates the doubled area is an integer, so a `//` or `/ 2` is only needed at the very end.

## Checking the formula by counting cells

For polygons with vertices on a grid we can verify the area by an independent method: sample points at the centres of unit cells and check with a ray-casting test how many fall inside.

```python
def inside(poly, px, py):
    """Even-odd rule ray casting (point not on the boundary)."""
    c = False
    n = len(poly)
    for i in range(n):
        (x1, y1), (x2, y2) = poly[i], poly[(i + 1) % n]
        if (y1 > py) != (y2 > py) and px < x1 + (py - y1) * (x2 - x1) / (y2 - y1):
            c = not c
    return c

import random
rnd = random.Random(3)
for _ in range(20):
    # a random "staircase" polygon (always simple): a histogram of column heights
    heights = [rnd.randint(1, 5) for _ in range(rnd.randint(1, 6))]
    poly = [(0, 0), (len(heights), 0)]
    for i in range(len(heights) - 1, -1, -1):
        poly += [(i + 1, heights[i]), (i, heights[i])]
    cells = sum(inside(poly, i + 0.5, j + 0.5) for i in range(len(heights)) for j in range(6))
    assert cells == sum(heights) == area(poly) == area_trapezoids(poly)
```

## Related

- The **sign** of the shoelace sum gives the orientation of the polygon (counter-clockwise is positive), which many algorithms require to be consistent.
- The area of a lattice polygon can also be found from boundary and interior lattice points with [Pick's theorem](/theory/geometry/picks-theorem).
- Testing whether a point is inside a polygon is a different problem; see [point in convex polygon](/theory/geometry/point-in-convex-polygon).
