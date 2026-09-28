---
title: "Circle-Circle Intersection"
section: Elementary operations
order: 8
difficulty: intermediate
summary: "Intersect two circles by subtracting their equations, which turns the problem into a circle-line intersection."
tags: [geometry, circles, intersection, radical line]
prerequisites: [geometry/circle-line-intersection]
source:
  title: "Circle-Circle Intersection"
  url: https://cp-algorithms.com/geometry/circle-circle-intersection.html
  license: CC BY-SA 4.0
---

Two circles are given by center and radius. Find their intersection: no points, one point (tangent), two points, or, if they coincide, infinitely many.

## Solution

Put the first circle's center at the origin (translate everything). Then the circles satisfy

$$
x^2 + y^2 = r_1^2,\qquad (x - x_2)^2 + (y - y_2)^2 = r_2^2
$$

Subtract the first equation from the second: the squares of the variables cancel, and we get the equation of a **line**, the *radical axis* of the two circles:

$$
-2x_2\,x - 2y_2\,y + (x_2^2 + y_2^2 + r_1^2 - r_2^2) = 0
$$

Its coefficients are $A = -2x_2$, $B = -2y_2$, $C = x_2^2 + y_2^2 + r_1^2 - r_2^2$. The intersection points of the circles are those of the first circle with this line, which we know how to find from [circle-line intersection](/theory/geometry/circle-line-intersection).

The only degenerate case is when the centers coincide: then $A = B = 0$ and the equation reduces to $r_1^2 = r_2^2$. If the radii are equal, the circles coincide (infinitely many points), otherwise they have no common point.

## Implementation

```python
import math

EPS = 1e-9

def circle_line(r, a, b, c):
    n = a * a + b * b
    x0, y0 = -a * c / n, -b * c / n
    lhs, rhs = c * c, r * r * n
    if lhs > rhs + EPS:
        return []
    if abs(lhs - rhs) <= EPS:
        return [(x0, y0)]
    m = math.sqrt((r * r - c * c / n) / n)
    return [(x0 + b * m, y0 - a * m), (x0 - b * m, y0 + a * m)]

def circle_circle(c1, r1, c2, r2):
    """Intersection of circles (center, radius). Returns 'same' if they coincide, else a list of 0-2 points."""
    dx, dy = c2[0] - c1[0], c2[1] - c1[1]
    if dx == 0 and dy == 0:
        return "same" if r1 == r2 else []
    a, b = -2 * dx, -2 * dy
    c = dx * dx + dy * dy + r1 * r1 - r2 * r2
    return [(x + c1[0], y + c1[1]) for x, y in circle_line(r1, a, b, c)]

assert circle_circle((0, 0), 1, (0, 0), 1) == "same"
assert circle_circle((0, 0), 1, (0, 0), 2) == []
assert circle_circle((0, 0), 1, (5, 0), 1) == []                       # far apart
assert circle_circle((0, 0), 3, (1, 0), 1) == []                        # the small circle lies inside the big one
internal = circle_circle((0, 0), 3, (1, 0), 2)                           # internally tangent at (3, 0)
assert len(internal) == 1 and abs(internal[0][0] - 3) < 1e-9 and abs(internal[0][1]) < 1e-9
tangent = circle_circle((0, 0), 1, (2, 0), 1)                            # externally tangent
assert len(tangent) == 1 and abs(tangent[0][0] - 1) < 1e-9 and abs(tangent[0][1]) < 1e-9
two = circle_circle((0, 0), 5, (6, 0), 5)                                # symmetric lens: x = 3, y = +-4
assert sorted((round(x, 9), round(y, 9)) for x, y in two) == [(3.0, -4.0), (3.0, 4.0)]
```

## Verifying the count

Two circles with center distance $d$ meet in

- 0 points if $d > r_1 + r_2$ (too far) or $d < |r_1 - r_2|$ (one inside the other),
- 1 point if $d = r_1 + r_2$ or $d = |r_1 - r_2|$ (tangent, outside or inside),
- 2 points otherwise.

Compare with exact integer arithmetic on squared distances (for integer input):

```python
import random

def expected_count(c1, r1, c2, r2):
    d2 = (c2[0] - c1[0]) ** 2 + (c2[1] - c1[1]) ** 2
    outer, inner = (r1 + r2) ** 2, (r1 - r2) ** 2
    if d2 > outer or d2 < inner:
        return 0
    return 1 if d2 in (outer, inner) else 2

rnd = random.Random(5)
for _ in range(5000):
    c1 = (rnd.randint(-6, 6), rnd.randint(-6, 6))
    c2 = (rnd.randint(-6, 6), rnd.randint(-6, 6))
    r1, r2 = rnd.randint(1, 8), rnd.randint(1, 8)
    res = circle_circle(c1, r1, c2, r2)
    if res == "same":
        assert c1 == c2 and r1 == r2
        continue
    assert len(res) == expected_count(c1, r1, c2, r2), (c1, r1, c2, r2)
    for x, y in res:
        assert abs(math.dist((x, y), c1) - r1) < 1e-6 and abs(math.dist((x, y), c2) - r2) < 1e-6
```

Note that the same radical-axis trick works in 3D for two spheres (their intersection is a circle in the plane given by the subtracted equation).

## Practice problems

- [RadarFinder](https://community.topcoder.com/stat?c=problem_statement&pm=7766)
- [Runaway to a shadow - Codeforces Round #357](http://codeforces.com/problemset/problem/681/E)
- [ASC 1 Problem F "Get out!"](http://codeforces.com/gym/100199/problem/F)
- [SPOJ: CIRCINT](http://www.spoj.com/problems/CIRCINT/)
- [UVA - 10301 - Rings and Glue](https://uva.onlinejudge.org/index.php?option=onlinejudge&page=show_problem&problem=1242)
- [Codeforces 933C A Colorful Prospect](https://codeforces.com/problemset/problem/933/C)
- [TIMUS 1429 Biscuits](https://acm.timus.ru/problem.aspx?space=1&num=1429)
