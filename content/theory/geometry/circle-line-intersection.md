---
title: "Circle-Line Intersection"
section: Elementary operations
order: 7
difficulty: intermediate
summary: "Find the 0, 1 or 2 points where a line meets a circle, using the closest point to the center and a stable geometric construction."
tags: [geometry, circle, line, intersection, numerical stability]
prerequisites: [geometry/segment-to-line]
source:
  title: "Circle-Line Intersection"
  url: https://cp-algorithms.com/geometry/circle-line-intersection.html
  license: CC BY-SA 4.0
---

Given a circle (center and radius) and a line $Ax + By + C = 0$, find their intersection points.

Instead of substituting the line into the circle's equation and solving a quadratic, we use geometry. The result is more accurate numerically.

## Solution

Translate the picture so that the circle is centered at the origin (subtract the center from the line's reference: $C \leftarrow C + A c_x + B c_y$), so the circle has radius $r$ and center $(0, 0)$.

**Step 1: the closest point of the line to the origin.** Its distance is $d_0 = |C|/\sqrt{A^2+B^2}$, and it lies in the direction of the normal $(A, B)$:

$$
x_0 = -\frac{AC}{A^2 + B^2},\qquad y_0 = -\frac{BC}{A^2+B^2}
$$

**Step 2: count the intersections** by comparing $d_0$ with $r$, or without any square root, comparing $C^2$ with $r^2(A^2+B^2)$:

- $d_0 > r$: no points;
- $d_0 = r$: one point, the tangent point $(x_0, y_0)$;
- $d_0 < r$: two points.

**Step 3: the two points.** They are on the line, symmetric around $(x_0, y_0)$, at distance $d = \sqrt{r^2 - d_0^2}$ from it. The vector $(-B, A)$ is parallel to the line, so we move along it by $\pm m\,(-B, A)$ where $m = \sqrt{d^2/(A^2+B^2)}$:

$$
(a_x, a_y) = (x_0 + B m,\; y_0 - A m),\qquad (b_x, b_y) = (x_0 - B m,\; y_0 + A m)
$$

## Implementation

```python
import math

EPS = 1e-9

def circle_line(r, a, b, c):
    """Intersections of x^2 + y^2 = r^2 with a*x + b*y + c = 0. Returns a list of 0, 1 or 2 points."""
    n = a * a + b * b
    x0, y0 = -a * c / n, -b * c / n
    lhs = c * c
    rhs = r * r * n                       # compare C^2 with r^2 (A^2 + B^2): no square roots
    if lhs > rhs + EPS:
        return []
    if abs(lhs - rhs) <= EPS:
        return [(x0, y0)]
    m = math.sqrt((r * r - c * c / n) / n)
    return [(x0 + b * m, y0 - a * m), (x0 - b * m, y0 + a * m)]

# the line y = 0 through the unit circle: (1, 0) and (-1, 0)
pts = circle_line(1, 0, 1, 0)
assert sorted((round(x, 9), round(y, 9)) for x, y in pts) == [(-1.0, 0.0), (1.0, 0.0)]
# tangent: x = 2 touches the circle of radius 2
assert circle_line(2, 1, 0, -2) == [(2.0, 0.0)]
# no intersection
assert circle_line(1, 1, 1, -5) == []
# x + y = 1 and a circle of radius sqrt(2): the points satisfy both equations
pts = circle_line(math.sqrt(2), 1, 1, -1)
assert len(pts) == 2
for x, y in pts:
    assert abs(x * x + y * y - 2) < 1e-9 and abs(x + y - 1) < 1e-9
```

For a circle with center $(c_x, c_y)$, shift the line first and shift the points back:

```python
def circle_line_general(cx, cy, r, a, b, c):
    """Circle with center (cx, cy), line a*x + b*y + c = 0."""
    return [(x + cx, y + cy) for x, y in circle_line(r, a, b, c + a * cx + b * cy)]

for x, y in circle_line_general(3, -2, 5, 1, -1, 0):        # the line y = x through a circle at (3, -2)
    assert abs((x - 3) ** 2 + (y + 2) ** 2 - 25) < 1e-9 and abs(x - y) < 1e-9
assert len(circle_line_general(3, -2, 5, 1, -1, 0)) == 2
```

## Exactness

If the inputs are integers, the decision "0, 1 or 2 points" needs no floating point: compare `c*c` with `r*r*(a*a+b*b)` using integers. The two-point case involves $\sqrt{\cdot}$ in general, so the coordinates are irrational and floats are unavoidable, but the *classification* can be exact:

```python
def count_intersections(r, a, b, c):
    """Exact number of intersections for integer input."""
    lhs, rhs = c * c, r * r * (a * a + b * b)
    return 0 if lhs > rhs else 1 if lhs == rhs else 2

assert count_intersections(5, 3, 4, -25) == 1       # the line 3x + 4y = 25 touches the circle x^2 + y^2 = 25 at (3, 4)
assert count_intersections(5, 3, 4, -24) == 2
assert count_intersections(5, 3, 4, -26) == 0
assert circle_line(5, 3, 4, -25)[0] == (3.0, 4.0)
```

## Randomized check

The classification and the returned points can be checked against a direct discretized test: every returned point must satisfy both equations; the count must match the exact classification.

```python
import random

rnd = random.Random(1)
for _ in range(2000):
    r = rnd.randint(1, 10)
    a, b, c = rnd.randint(-6, 6), rnd.randint(-6, 6), rnd.randint(-40, 40)
    if a == 0 and b == 0:
        continue
    pts = circle_line(r, a, b, c)
    assert len(pts) == count_intersections(r, a, b, c)
    for x, y in pts:
        assert abs(x * x + y * y - r * r) < 1e-6 and abs(a * x + b * y + c) < 1e-6
```

## Practice problems

- [CODECHEF: ANDOOR](https://www.codechef.com/problems/ANDOOR)
