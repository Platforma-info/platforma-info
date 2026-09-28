---
title: "Oriented Area of a Triangle"
section: Elementary operations
order: 4
difficulty: beginner
summary: "The signed area of a triangle, computed with one cross product, tells you the area and whether three points turn left, right, or lie on a line."
tags: [geometry, orientation, cross product, triangle, ccw]
prerequisites: [geometry/basic-geometry]
source:
  title: "Oriented area of a triangle"
  url: https://cp-algorithms.com/geometry/oriented-triangle-area.html
  license: CC BY-SA 4.0
---

Given three points $p_1, p_2, p_3$, the **oriented (signed) area** of the triangle they form is positive if going $p_1 \to p_2 \to p_3$ turns **counter-clockwise** (left), negative if it turns clockwise (right), and zero if the points are collinear. Its absolute value is the ordinary area.

This one number both measures area and answers "which side is $p_3$ on?", which is exactly what [convex hull](/theory/geometry/convex-hull) algorithms and segment tests need.

## Calculation

The determinant of a $2\times2$ matrix is the signed area of the parallelogram spanned by its column vectors, which is the 2D cross product from [basic geometry](/theory/geometry/basic-geometry). Halving it gives the triangle. Using the vectors $\overrightarrow{p_1p_2}$ and $\overrightarrow{p_2p_3}$:

$$
2S = (x_2 - x_1)(y_3 - y_2) - (x_3 - x_2)(y_2 - y_1)
$$

We keep $2S$, the signed area of the parallelogram: for integer points it is an **integer**, so orientation tests are exact.

## Implementation

```python
def cross(a, b):
    return a[0] * b[1] - a[1] * b[0]

def sub(a, b):
    return (a[0] - b[0], a[1] - b[1])

def signed_area2(p1, p2, p3):
    """Twice the signed area of triangle p1 p2 p3."""
    return cross(sub(p2, p1), sub(p3, p2))

def triangle_area(p1, p2, p3):
    return abs(signed_area2(p1, p2, p3)) / 2

def clockwise(p1, p2, p3):
    return signed_area2(p1, p2, p3) < 0

def counter_clockwise(p1, p2, p3):
    return signed_area2(p1, p2, p3) > 0

assert signed_area2((0, 0), (4, 0), (0, 3)) == 12 and triangle_area((0, 0), (4, 0), (0, 3)) == 6
assert counter_clockwise((0, 0), (4, 0), (0, 3))
assert clockwise((0, 0), (0, 3), (4, 0))
assert signed_area2((0, 0), (1, 1), (5, 5)) == 0             # collinear
assert triangle_area((0, 0), (0, 0), (3, 7)) == 0            # degenerate
```

The value does not depend on which vertex we call first, only on the cyclic order:

```python
p, q, r = (1, 2), (7, 3), (4, 9)
assert signed_area2(p, q, r) == signed_area2(q, r, p) == signed_area2(r, p, q)
assert signed_area2(p, r, q) == -signed_area2(p, q, r)
# same as Heron's formula
import math
a, b, c = math.dist(p, q), math.dist(q, r), math.dist(r, p)
s = (a + b + c) / 2
assert abs(triangle_area(p, q, r) - math.sqrt(s * (s - a) * (s - b) * (s - c))) < 1e-9
```

## Which side of a line?

`signed_area2(a, b, p)` is positive if $p$ lies to the **left** of the directed line from $a$ to $b$, negative if to the right, and zero if on the line. Its absolute value equals $|ab|$ times the distance from $p$ to the line.

```python
def side(a, b, p):
    v = signed_area2(a, b, p)
    return (v > 0) - (v < 0)                     # +1 left, -1 right, 0 on the line

assert side((0, 0), (10, 0), (5, 3)) == 1        # above the x-axis, looking east: on the left
assert side((0, 0), (10, 0), (5, -3)) == -1
assert side((0, 0), (10, 0), (25, 0)) == 0
assert side((10, 0), (0, 0), (5, 3)) == -1       # reversing the direction flips the sides

d = math.dist((0, 0), (10, 0))
assert abs(abs(signed_area2((0, 0), (10, 0), (5, 3))) / d - 3) < 1e-12        # distance to the line
```

## Practice problems

- [Codechef - Chef and Polygons](https://www.codechef.com/problems/CHEFPOLY)
