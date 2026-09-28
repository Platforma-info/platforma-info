---
title: "Equation of a Line Through a Segment"
section: Elementary operations
order: 2
difficulty: beginner
summary: "Turn two endpoints into the line A·x + B·y + C = 0, keep the coefficients integer and canonical, and normalize them when working with floats."
tags: [geometry, line equation, normalization]
prerequisites: [geometry/basic-geometry, math/euclidean-algorithm]
source:
  title: "Finding the equation of a line for a segment"
  url: https://cp-algorithms.com/geometry/segment-to-line.html
  license: CC BY-SA 4.0
---

Given a non-degenerate segment $PQ$ (its ends differ), find the line through it as an equation

$$
A x + B y + C = 0.
$$

The triple $(A, B, C)$ is only defined up to a non-zero multiplier, so we just need one valid choice.

## The construction

$$
A = P_y - Q_y,\qquad B = Q_x - P_x,\qquad C = -A P_x - B P_y
$$

Substituting $P$ and $Q$ into the equation confirms it: both give $0$. Note that $(A, B)$ is the segment's direction rotated by $90^\circ$, i.e. a normal vector of the line.

```python
def line_through(p, q):
    a = p[1] - q[1]
    b = q[0] - p[0]
    c = -a * p[0] - b * p[1]
    return a, b, c

def on_line(line, pt):
    a, b, c = line
    return a * pt[0] + b * pt[1] + c == 0

line = line_through((1, 2), (4, 6))
assert on_line(line, (1, 2)) and on_line(line, (4, 6))
assert on_line(line, (-2, -2)) and not on_line(line, (0, 0))
```

## Integer case

An important benefit: if the endpoints have **integer** coordinates, so do $A$, $B$, $C$, and geometry can be done without floating point at all.

The drawback is that one line has many triples. To make the representation canonical:

1. divide $A, B, C$ by $\gcd(|A|, |B|, |C|)$ (`math.gcd` accepts several arguments);
2. fix the sign: if $A < 0$, or $A = 0$ and $B < 0$, multiply everything by $-1$.

Then equal lines give equal triples, so lines can be compared with `==` or stored in a `set`.

```python
from math import gcd

def canonical_line(p, q):
    a, b, c = line_through(p, q)
    g = gcd(a, b, c)
    a, b, c = a // g, b // g, c // g
    if a < 0 or (a == 0 and b < 0):
        a, b, c = -a, -b, -c
    return a, b, c

# the same line described by different segments
assert canonical_line((1, 2), (4, 6)) == canonical_line((4, 6), (7, 10)) == canonical_line((7, 10), (-2, -2))
assert canonical_line((0, 0), (0, 5)) == (1, 0, 0)          # the y-axis: x = 0
assert canonical_line((0, 3), (5, 3)) == (0, 1, -3)         # y = 3
assert canonical_line((0, 3), (5, 3)) == canonical_line((9, 3), (-4, 3))

# count distinct lines through pairs of points
from itertools import combinations
pts = [(0, 0), (1, 1), (2, 2), (0, 1), (1, 2)]
# the 10 pairs give 8 distinct lines: y = x holds three of the points, y = x + 1 two of them
assert len({canonical_line(p, q) for p, q in combinations(pts, 2)}) == 8
```

## Real case

With floating point, watch the magnitudes. $A$ and $B$ have the order of the coordinates and $C$ the order of their *square*. After a few operations (say when [intersecting lines](/theory/geometry/lines-intersection)) the numbers get big and rounding errors show up even for coordinates around $10^3$.

**Normalize** the coefficients to $A^2 + B^2 = 1$: divide by $Z = \sqrt{A^2 + B^2}$. Now $(A, B)$ is a unit normal, and $C$ is of the order of the input coordinates. As a bonus, $Ax + By + C$ is then the **signed distance** from $(x, y)$ to the line.

```python
import math

def normalized_line(p, q):
    a, b, c = line_through(p, q)
    z = math.hypot(a, b)
    return a / z, b / z, c / z

def signed_distance(line, pt):
    a, b, c = line
    return a * pt[0] + b * pt[1] + c

l = normalized_line((0, 0), (4, 0))          # the x-axis
assert abs(signed_distance(l, (7, 3)) + 3) < 1e-12 or abs(signed_distance(l, (7, 3)) - 3) < 1e-12
assert abs(abs(signed_distance(l, (7, 3))) - 3) < 1e-12
assert abs(signed_distance(l, (100, 0))) < 1e-12

l = normalized_line((0, 0), (3, 4))          # the line 4x - 3y = 0
assert abs(abs(signed_distance(l, (3, 0))) - 12 / 5) < 1e-12
assert abs(l[0] ** 2 + l[1] ** 2 - 1) < 1e-12
```

Two normalized triples describe the same line if they are equal up to a factor of $-1$. To make them unique, multiply by $-1$ when $A < -\varepsilon$, or when $|A| < \varepsilon$ and $B < -\varepsilon$.

## Three and more dimensions

In 3D there is no single simple equation for a line (it is the intersection of two planes, which is awkward). Use the **parametric form** instead, valid in any dimension:

$$
\mathbf p + \mathbf v\,t,\qquad t\in\mathbb R
$$

For a segment take one endpoint as $\mathbf p$ and the vector between the endpoints as $\mathbf v$.

```python
def parametric_line(p, q):
    return p, tuple(b - a for a, b in zip(p, q))

def point_at(line, t):
    p, v = line
    return tuple(x + t * y for x, y in zip(p, v))

line3 = parametric_line((1, 2, 3), (3, 6, 9))
assert point_at(line3, 0) == (1, 2, 3) and point_at(line3, 1) == (3, 6, 9)
assert point_at(line3, 0.5) == (2.0, 4.0, 6.0)
```
