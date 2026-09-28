---
title: "Half-plane Intersection"
section: Advanced topics
order: 3
difficulty: advanced
summary: "Intersect N half-planes in O(N log N) by sorting them by angle and keeping a deque; applications to polygon kernels, polygon intersection and inscribed circles."
tags: [geometry, half-plane, convex polygon, deque, sorting by angle, linear programming]
prerequisites: [geometry/lines-intersection, geometry/convex-hull]
source:
  title: "Half-plane intersection"
  url: https://cp-algorithms.com/geometry/halfplane-intersection.html
  license: CC BY-SA 4.0
---

A **half-plane** is one of the two parts into which a line cuts the plane. The intersection of any number of half-planes is a convex region (a convex polygon, possibly unbounded or empty). We look at how to compute it in $O(N\log N)$ for $N$ half-planes, and at what it is good for.

## Representation

We represent a half-plane by a point $p$ on its line and a direction vector $d$, and the half-plane is the region **to the left** of the directed line. For example $y \ge 2x - 2$ is the point $(1, 0)$ with direction $(1, 2)$. The polar angle of the half-plane is the polar angle of $d$.

To keep the result bounded we always add four half-planes forming a huge bounding box. We also assume for the moment that there are no parallel half-planes (they are handled below).

## From brute force to the algorithm

- **Brute force, $O(N^3)$.** Intersect the lines of all pairs, keep the intersection points that are inside all half-planes, and take their convex hull.
- **Incremental, $O(N^2)$.** Start from the bounding box (a convex polygon) and cut it by each half-plane in turn, in $O(N)$ per cut.
- **Sort and incremental, $O(N\log N)$.** If the half-planes are processed **in order of their angle**, the new half-plane always makes a convex turn with the previous one, so the only half-planes that can become redundant are at the **back** or at the **front** of the current list. Keep the list in a deque and pop from both ends.

The last method:

1. Sort the half-planes by angle.
2. For each half-plane $H$: while the intersection point of the last two half-planes of the deque lies **outside** $H$, pop the back; while the intersection point of the first two lies outside $H$, pop the front. Then push $H$.
3. Finally clean up the ends against each other, and if fewer than 3 half-planes remain, the intersection is empty.
4. The polygon vertices are the intersection points of consecutive half-planes.

Special cases: several half-planes with the **same angle** (parallel, same direction): keep only the innermost. If after popping two **opposite** parallel half-planes are adjacent, the intersection is empty.

Every half-plane is pushed and popped at most once, so after sorting the algorithm is linear.

## Implementation

Sorting by angle without trigonometry: first split directions into the upper half ($y > 0$, or $y = 0$ and $x > 0$) and the lower half, and inside a half compare by the sign of the cross product. With integer input, intersection points are exact `Fraction`s and the test "is the point outside" is an exact sign test. For floating-point input, pass a small `eps` (and note that the direction vectors then should be well scaled).

```python
from collections import deque
from fractions import Fraction
from functools import cmp_to_key

def cross(u, v):
    return u[0] * v[1] - u[1] * v[0]

def dot(u, v):
    return u[0] * v[0] + u[1] * v[1]

def sub(a, b):
    return (a[0] - b[0], a[1] - b[1])

def divide(a, b):
    return Fraction(a, b) if isinstance(a, int) and isinstance(b, int) else a / b

class Halfplane:
    """The region to the LEFT of the directed line through p with direction d."""

    def __init__(self, p, d):
        self.p, self.d = p, d

    @classmethod
    def through(cls, a, b):
        return cls(a, sub(b, a))

    def out(self, r, eps=0):
        return cross(self.d, sub(r, self.p)) < -eps

def upper(d):
    return 0 if d[1] > 0 or (d[1] == 0 and d[0] > 0) else 1

def compare_angle(a, b):
    ua, ub = upper(a.d), upper(b.d)
    if ua != ub:
        return -1 if ua < ub else 1
    c = cross(a.d, b.d)
    return -1 if c > 0 else 1 if c < 0 else 0

def line_intersection(s, t):
    alpha = divide(cross(sub(t.p, s.p), t.d), cross(s.d, t.d))
    return (s.p[0] + s.d[0] * alpha, s.p[1] + s.d[1] * alpha)

def halfplane_intersection(planes, eps=0, big=10 ** 9):
    """Vertices (counter-clockwise) of the intersection of the half-planes; [] if it is empty.

    The region is clipped to the box [-big, big]^2, so unbounded regions become bounded.
    """
    H = list(planes)
    box = [(big, big), (-big, big), (-big, -big), (big, -big)]
    H += [Halfplane.through(box[i], box[(i + 1) % 4]) for i in range(4)]
    H.sort(key=cmp_to_key(compare_angle))
    dq = deque()
    for h in H:
        while len(dq) > 1 and h.out(line_intersection(dq[-1], dq[-2]), eps):
            dq.pop()
        while len(dq) > 1 and h.out(line_intersection(dq[0], dq[1]), eps):
            dq.popleft()
        if dq and abs(cross(h.d, dq[-1].d)) <= eps:               # parallel to the last one
            if dot(h.d, dq[-1].d) < 0:
                return []                                         # opposite directions meeting: empty
            if h.out(dq[-1].p, eps):                              # same direction: keep the innermost
                dq.pop()
            else:
                continue
        dq.append(h)
    while len(dq) > 2 and dq[0].out(line_intersection(dq[-1], dq[-2]), eps):
        dq.pop()
    while len(dq) > 2 and dq[-1].out(line_intersection(dq[0], dq[1]), eps):
        dq.popleft()
    if len(dq) < 3:
        return []
    n = len(dq)
    return [line_intersection(dq[i], dq[(i + 1) % n]) for i in range(n)]

def area2(poly):
    return sum(cross(poly[i], poly[(i + 1) % len(poly)]) for i in range(len(poly)))

# the unit square as four half-planes (counter-clockwise edges)
square = [Halfplane.through((0, 0), (1, 0)), Halfplane.through((1, 0), (1, 1)),
          Halfplane.through((1, 1), (0, 1)), Halfplane.through((0, 1), (0, 0))]
region = halfplane_intersection(square)
assert sorted(set(region)) == [(0, 0), (0, 1), (1, 0), (1, 1)] and area2(region) == 2

# adding a cut y <= 1/2 (the region to the left of the leftward line y = 1/2)
cut = square + [Halfplane((1, Fraction(1, 2)), (-1, 0))]
assert area2(halfplane_intersection(cut)) == 1                       # the lower half, area 1/2

# contradictory constraints: x >= 2 (left of the downward line) and x <= 1 (left of the upward line)
assert halfplane_intersection([Halfplane((2, 0), (0, -1)), Halfplane((1, 0), (0, 1))]) == []
```

An unbounded region is clipped by the bounding box. The half-plane $y \ge 0$ alone, inside the box $[-B, B]^2$, is a $2B \times B$ rectangle:

```python
B = 10 ** 9
assert area2(halfplane_intersection([Halfplane((0, 0), (1, 0))])) == 2 * (2 * B * B)
```

If several half-planes pass through the same vertex, the result may list that vertex more than once. This is harmless for emptiness tests and areas, and lets zero-area results (a point or a segment) be reported; remove duplicates with `dict.fromkeys(...)` if you don't want them.

## Testing against the $O(N^2)$ incremental cutting

Cut a big convex polygon with each half-plane in turn (Sutherland–Hodgman style), with exact fractions. Compare the areas and vertex sets on thousands of random inputs, including many empty and degenerate intersections:

```python
import random

def clip(poly, h):
    """Cut a convex polygon by a half-plane."""
    result = []
    n = len(poly)
    for i in range(n):
        a, b = poly[i], poly[(i + 1) % n]
        sa, sb = cross(h.d, sub(a, h.p)), cross(h.d, sub(b, h.p))
        if sa >= 0:
            result.append(a)
        if (sa > 0 and sb < 0) or (sa < 0 and sb > 0):
            t = Fraction(sa) / (sa - sb)
            result.append((a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t))
    return result

def slow_intersection(planes, big=10 ** 9):
    poly = [(big, big), (-big, big), (-big, -big), (big, -big)]
    for h in planes:
        poly = clip(poly, h)
        if not poly:
            return []
    return poly

rnd = random.Random(3)
outcomes = {"positive area": 0, "zero area": 0}
for _ in range(2000):
    planes = []
    for _ in range(rnd.randint(1, 7)):
        a = (rnd.randint(-5, 5), rnd.randint(-5, 5))
        b = (rnd.randint(-5, 5), rnd.randint(-5, 5))
        if a != b:
            planes.append(Halfplane.through(a, b))
    if not planes:
        continue
    fast, slow = halfplane_intersection(planes), slow_intersection(planes)
    fast_area = abs(area2(fast)) if fast else 0
    slow_area = abs(area2(slow)) if len(slow) >= 3 else 0
    assert fast_area == slow_area
    if fast_area > 0:
        assert set(fast) == set(slow)
        outcomes["positive area"] += 1
    else:
        outcomes["zero area"] += 1
assert outcomes["positive area"] > 500 and outcomes["zero area"] > 300
```

## Applications

### Intersection of convex polygons

A convex polygon is the intersection of the half-planes of its edges (taken counter-clockwise, so the interior is on the left). So the common region of several convex polygons is one half-plane intersection over all their edges: $O(S\log S)$ for $S$ total edges.

```python
def polygon_halfplanes(poly):
    return [Halfplane.through(poly[i], poly[(i + 1) % len(poly)]) for i in range(len(poly))]

A = [(0, 0), (4, 0), (4, 4), (0, 4)]
B = [(2, 2), (6, 2), (6, 6), (2, 6)]
common = halfplane_intersection(polygon_halfplanes(A) + polygon_halfplanes(B))
assert sorted(set(common)) == [(2, 2), (2, 4), (4, 2), (4, 4)] and area2(common) == 2 * 4
```

### Visibility: the kernel of a polygon

The **kernel** of a simple polygon is the set of points from which the whole boundary is visible. It is exactly the intersection of the half-planes defined by the polygon's edges (for a counter-clockwise polygon). The kernel is non-empty iff the polygon is star-shaped.

```python
L_shape = [(0, 0), (6, 0), (6, 2), (2, 2), (2, 6), (0, 6)]        # counter-clockwise, concave
kernel = halfplane_intersection(polygon_halfplanes(L_shape))
assert sorted(set(kernel)) == [(0, 0), (0, 2), (2, 0), (2, 2)]     # the corner square [0, 2]^2
assert area2(kernel) == 2 * 4

comb = [(0, 0), (9, 0), (9, 5), (7, 5), (7, 1), (5, 1), (5, 5), (3, 5), (3, 1), (2, 1), (2, 5), (0, 5)]
assert halfplane_intersection(polygon_halfplanes(comb)) == []       # no point sees every tooth of the comb
```

### Binary search on the answer: the largest inscribed circle

For a convex polygon, does a circle of radius $r$ fit? Equivalent: shrink the polygon inwards by $r$ (translate each edge's half-plane by $r$ along its inward normal); a circle fits iff the intersection is non-empty. Fitting is monotone in $r$, so binary search. This uses floats, so we pass an `eps`:

```python
import math

def largest_inscribed_radius(poly, iterations=60):
    n = len(poly)

    def fits(r):
        planes = []
        for i in range(n):
            a, b = poly[i], poly[(i + 1) % n]
            d = (b[0] - a[0], b[1] - a[1])
            length = math.hypot(*d)
            shifted = (a[0] - d[1] / length * r, a[1] + d[0] / length * r)     # move by r to the left of the edge
            planes.append(Halfplane(shifted, d))
        return bool(halfplane_intersection(planes, eps=1e-9))

    lo, hi = 0.0, 1e4
    for _ in range(iterations):
        mid = (lo + hi) / 2
        if fits(mid):
            lo = mid
        else:
            hi = mid
    return lo

assert abs(largest_inscribed_radius([(0, 0), (10, 0), (10, 10), (0, 10)]) - 5) < 1e-6
assert abs(largest_inscribed_radius([(0, 0), (4, 0), (0, 3)]) - 1) < 1e-6       # the 3-4-5 triangle: r = (3 + 4 - 5) / 2
assert abs(largest_inscribed_radius([(0, 0), (6, 0), (6, 2), (0, 2)]) - 1) < 1e-6
```

### Two-variable linear programming

Every linear constraint $ax + by + c \le 0$ is a half-plane, so feasibility of a system of constraints in two variables is "is the intersection non-empty?", and the optimum of a linear objective over the feasible region is attained at a vertex of the polygon. (There is also a simple randomized incremental algorithm that solves it in expected $O(N)$.)

## Practice problems

- [Codechef - Animesh decides to settle down](https://www.codechef.com/problems/CHN02)
- [POJ - How I mathematician Wonder What You Are!](http://poj.org/problem?id=3130)
- [POJ - Rotating Scoreboard](http://poj.org/problem?id=3335)
- [POJ - Video Surveillance](http://poj.org/problem?id=1474)
- [POJ - Art Gallery](http://poj.org/problem?id=1279)
- [POJ - Uyuw's Concert](http://poj.org/problem?id=2451)
- [POJ - Most Distant Point from the Sea - Medium](http://poj.org/problem?id=3525)
- [Baekjoon - Jeju's Island - Same as above but seemingly stronger test cases](https://www.acmicpc.net/problem/3903)
- [POJ - Feng Shui - Medium](http://poj.org/problem?id=3384)
- [POJ - Triathlon - Medium/hard](http://poj.org/problem?id=1755)
- [DMOJ - Arrow - Medium/hard](https://dmoj.ca/problem/ccoprep3p3)
- [POJ - Jungle Outpost - Hard](http://poj.org/problem?id=3968)
- [Codeforces - Jungle Outpost (alternative link, problem J) - Hard](https://codeforces.com/gym/101309/attachments?mobile=false) 
- [Yandex - Asymmetry Value (need virtual contest to see, problem F) - Very Hard](https://contest.yandex.com/contest/2540/enter/)
