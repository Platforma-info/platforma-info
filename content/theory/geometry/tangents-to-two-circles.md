---
title: "Common Tangents to Two Circles"
section: Elementary operations
order: 9
difficulty: intermediate
summary: "Find all lines touching two circles at once (up to four), or the tangents from a point to a circle, with a small algebraic derivation."
tags: [geometry, circles, tangent, lines]
prerequisites: [geometry/segment-to-line]
source:
  title: "Finding common tangents to two circles"
  url: https://cp-algorithms.com/geometry/tangents-to-two-circles.html
  license: CC BY-SA 4.0
---

Given two circles, find all lines that touch both: the *common tangents*. The number of common tangents is 4, 3, 2, 1, 0 or infinite depending on the arrangement:

| Arrangement | Common tangents |
|-------------|-----------------|
| disjoint, outside each other | 4 (two outer, two inner) |
| externally tangent | 3 (one is the shared tangent, counted twice) |
| overlapping in two points | 2 |
| internally tangent | 1 |
| one strictly inside the other | 0 |
| identical circles | infinitely many |

The algorithm below computes up to **four** candidate lines. In degenerate arrangements some candidates coincide (the same line is produced twice, possibly with opposite signs) or do not exist, so we deduplicate at the end; the infinite case (identical circles) must be handled separately. It also works if one or both radii are $0$: a circle of radius $0$ is a point, so this gives the two tangents from a point to a circle, or the single line through two points.

## Algebraic derivation

Translate so the first circle is centered at the origin. Let $r_1, r_2$ be the radii and $v = (v_x, v_y) \ne 0$ the center of the second circle. We look for lines $ax + by + c = 0$ with $a^2 + b^2 = 1$ (normalized, so that $ax + by + c$ is the signed distance to the line) at distance $r_1$ from the origin and distance $r_2$ from $v$:

$$
a^2 + b^2 = 1,\qquad |c| = r_1,\qquad |a v_x + b v_y + c| = r_2
$$

Opening the absolute values gives sign choices: $c = d_1 = \pm r_1$, $a v_x + b v_y + c = d_2 = \pm r_2$. It is a quadratic system whose solutions are

$$
a = \frac{(d_2 - d_1)v_x \pm v_y\sqrt{v_x^2 + v_y^2 - (d_2-d_1)^2}}{v_x^2 + v_y^2},\quad
b = \frac{(d_2 - d_1)v_y \mp v_x\sqrt{v_x^2 + v_y^2 - (d_2-d_1)^2}}{v_x^2 + v_y^2},\quad
c = d_1
$$

Flipping the sign of $(a, b, c)$ describes the same line with the two circles on the other side, which is why only one of the two square-root signs is needed for each of the four $(d_1, d_2)$ combinations. Finally, if the first circle was at $(x_0, y_0)$, subtract $a x_0 + b y_0$ from $c$.

## Implementation

```python
import math

EPS = 1e-9

def tangent_candidates(c1, r1, c2, r2):
    """Up to four normalized lines (a, b, c), a*x + b*y + c = 0 with a^2 + b^2 = 1."""
    vx, vy = c2[0] - c1[0], c2[1] - c1[1]
    z = vx * vx + vy * vy
    lines = []
    for s1 in (-1, 1):
        for s2 in (-1, 1):
            d1, d2 = s1 * r1, s2 * r2
            r = d2 - d1
            d = z - r * r
            if d < -EPS:
                continue                       # no line for this choice of sides
            d = math.sqrt(abs(d))
            a = (vx * r + vy * d) / z
            b = (vy * r - vx * d) / z
            c = d1 - (a * c1[0] + b * c1[1])   # undo the translation of the first center
            lines.append((a, b, c))
    return lines

def dist_to_line(line, p):
    return abs(line[0] * p[0] + line[1] * p[1] + line[2])

# far apart: four different lines, each at distance r1 from the first center and r2 from the second
lines = tangent_candidates((0, 0), 1, (10, 0), 1)
assert len(lines) == 4
for l in lines:
    assert abs(l[0] ** 2 + l[1] ** 2 - 1) < 1e-9
    assert abs(dist_to_line(l, (0, 0)) - 1) < 1e-9 and abs(dist_to_line(l, (10, 0)) - 1) < 1e-9
```

The lines `(a, b, c)` and `(-a, -b, -c)` are the same line. To compare or count lines, put them in a canonical form (a fixed sign) and remove duplicates:

```python
def canonical(line):
    a, b, c = line
    if a < -EPS or (abs(a) <= EPS and b < 0):
        a, b, c = -a, -b, -c
    return (round(a, 7) + 0.0, round(b, 7) + 0.0, round(c, 7) + 0.0)

def common_tangents(c1, r1, c2, r2):
    """Distinct common tangents of two different circles (or points, if a radius is 0)."""
    return sorted({canonical(l) for l in tangent_candidates(c1, r1, c2, r2)})

def check(c1, r1, c2, r2, expected):
    lines = common_tangents(c1, r1, c2, r2)
    assert len(lines) == expected, (len(lines), expected)
    for l in lines:
        assert abs(dist_to_line(l, c1) - r1) < 1e-6 and abs(dist_to_line(l, c2) - r2) < 1e-6
    return lines

check((0, 0), 1, (10, 0), 1, 4)          # disjoint: 2 outer + 2 inner
check((0, 0), 2, (10, 3), 1, 4)
check((0, 0), 1, (2, 0), 1, 3)           # externally tangent: the two inner tangents coincide
check((0, 0), 3, (4, 0), 3, 2)           # overlapping: only the two outer tangents
check((0, 0), 3, (1, 0), 2, 1)           # internally tangent: a single tangent, at the touching point
check((0, 0), 5, (1, 0), 1, 0)           # one circle inside the other: none

```

### Tangents from a point

Set one radius to $0$. A point outside a circle has two tangent lines, on the circle the tangent is unique, and inside there are none:

```python
check((5, 0), 0, (0, 0), 3, 2)           # point (5, 0) outside the circle of radius 3
check((3, 0), 0, (0, 0), 3, 1)           # on the circle
check((1, 0), 0, (0, 0), 3, 0)           # inside the circle
check((0, 0), 0, (5, 5), 0, 1)           # two points: the line through them
```

The touching points are easy to get from the line: the foot of the perpendicular from the center, i.e. the center minus the signed distance times the normal.

```python
def touching_point(line, center):
    a, b, c = line
    s = a * center[0] + b * center[1] + c            # signed distance to the line
    return (center[0] - s * a, center[1] - s * b)

for l in common_tangents((0, 0), 2, (10, 3), 1):
    p, q = touching_point(l, (0, 0)), touching_point(l, (10, 3))
    assert abs(math.dist(p, (0, 0)) - 2) < 1e-6 and abs(math.dist(q, (10, 3)) - 1) < 1e-6
    assert dist_to_line(l, p) < 1e-6 and dist_to_line(l, q) < 1e-6
```

## Randomized check

Every returned line must be at exactly the right distance from both centers, and the number of distinct tangents must match the classification by the distance $d$ between the centers (for $d>0$):

| Condition | Tangents |
|-----------|----------|
| $d > r_1 + r_2$ | 4 |
| $d = r_1 + r_2$ | 3 |
| $\lvert r_1 - r_2\rvert < d < r_1 + r_2$ | 2 |
| $d = \lvert r_1 - r_2\rvert$ | 1 |
| $d < \lvert r_1 - r_2\rvert$ | 0 |

```python
import random

rnd = random.Random(8)
for _ in range(3000):
    c1 = (rnd.randint(-8, 8), rnd.randint(-8, 8))
    c2 = (rnd.randint(-8, 8), rnd.randint(-8, 8))
    r1, r2 = rnd.randint(1, 6), rnd.randint(1, 6)
    d2 = (c1[0] - c2[0]) ** 2 + (c1[1] - c2[1]) ** 2
    if d2 == 0:
        continue                                                # concentric circles: handled separately
    if d2 > (r1 + r2) ** 2:
        expected = 4
    elif d2 == (r1 + r2) ** 2:
        expected = 3
    elif d2 > (r1 - r2) ** 2:
        expected = 2
    elif d2 == (r1 - r2) ** 2:
        expected = 1
    else:
        expected = 0
    check(c1, r1, c2, r2, expected)
```
