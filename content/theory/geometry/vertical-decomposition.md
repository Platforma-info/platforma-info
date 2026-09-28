---
title: "Vertical Decomposition"
section: Planar graphs
order: 3
difficulty: advanced
summary: "Cut the plane into vertical stripes where shapes become simple trapezoids: the area of a union of triangles in O(n² log n), and convex polygon intersection."
tags: [geometry, vertical decomposition, trapezoids, union of triangles, sweep line]
prerequisites: [geometry/segments-intersection, geometry/area-of-simple-polygon]
source:
  title: "Vertical decomposition"
  url: https://cp-algorithms.com/geometry/vertical_decomposition.html
  license: CC BY-SA 4.0
---

## Overview

**Vertical decomposition** cuts the plane into vertical stripes with good properties, and solves the problem in each stripe independently. The stripes are bounded by vertical lines through all "interesting" $x$-coordinates: vertices and intersection points. Inside a stripe, no two segments cross, so complicated shapes turn into simple pieces (trapezoids).

## Area of the union of triangles

Given $n$ triangles, find the area of their union. If they didn't intersect, we'd just add up their areas. Cut the plane by vertical lines through all vertices and all intersection points of sides of different triangles: $O(n^2)$ lines, hence $O(n^2)$ stripes. Inside a stripe, every non-vertical side either crosses the stripe completely or not at all, and no two sides cross strictly inside it. The part of the union in a stripe is therefore a set of disjoint **trapezoids** with bases on the stripe's boundary.

The **length of the union's cross-section is a linear function of $x$** inside a stripe, so the area of the union in a stripe equals its width times the cross-section length at the *middle* of the stripe. That gives a simple, exact algorithm.

```python
from fractions import Fraction

def cross(u, v):
    return u[0] * v[1] - u[1] * v[0]

def sub(a, b):
    return (a[0] - b[0], a[1] - b[1])

def segment_intersection(a, b, c, d):
    """[] / [point] / [start, end]: the exact intersection of segments ab and cd."""
    r, s = sub(b, a), sub(d, c)
    denom = cross(r, s)
    qp = sub(c, a)
    if denom != 0:
        t, u = Fraction(cross(qp, s), denom), Fraction(cross(qp, r), denom)
        if 0 <= t <= 1 and 0 <= u <= 1:
            return [(a[0] + t * r[0], a[1] + t * r[1])]
        return []
    if cross(qp, r) != 0:
        return []
    lo, hi = max(min(a, b), min(c, d)), min(max(a, b), max(c, d))
    if lo > hi:
        return []
    return [lo] if lo == hi else [lo, hi]

def union_area_stripes(triangles):
    """Exact area of the union of triangles: sum of (stripe width * cross-section length at the middle)."""
    sides = [(a, b) for t in triangles for a, b in ((t[0], t[1]), (t[1], t[2]), (t[2], t[0]))]
    xs = {p[0] for a, b in sides for p in (a, b)}
    for i in range(len(sides)):
        for j in range(i + 1, len(sides)):
            xs.update(p[0] for p in segment_intersection(*sides[i], *sides[j]))
    xs = sorted(xs)

    def section(t, x):
        """The interval [low, high] of y where the vertical line at x meets triangle t (or None)."""
        ys = []
        for a, b in ((t[0], t[1]), (t[1], t[2]), (t[2], t[0])):
            if a[0] != b[0] and min(a[0], b[0]) < x < max(a[0], b[0]):
                ys.append(a[1] + Fraction((b[1] - a[1]) * (x - a[0]), b[0] - a[0]))
        return (min(ys), max(ys)) if len(ys) == 2 else None

    total = Fraction(0)
    for x0, x1 in zip(xs, xs[1:]):
        mid = Fraction(x0 + x1, 2)
        intervals = sorted(iv for iv in (section(t, mid) for t in triangles) if iv)
        length, top = Fraction(0), None
        for lo, hi in intervals:                      # union of intervals on a line
            if top is None or lo > top:
                length += hi - lo
                top = hi
            elif hi > top:
                length += hi - top
                top = hi
        total += (x1 - x0) * length
    return total

# a single triangle, two triangles forming a square, duplicates, nested and disjoint triangles
assert union_area_stripes([((0, 0), (2, 0), (0, 2))]) == 2
assert union_area_stripes([((0, 0), (1, 0), (0, 1)), ((1, 1), (1, 0), (0, 1))]) == 1
assert union_area_stripes([((0, 0), (2, 0), (0, 2)), ((0, 0), (2, 0), (0, 2))]) == 2                  # duplicated triangle
assert union_area_stripes([((0, 0), (4, 0), (0, 4)), ((1, 1), (2, 1), (1, 2))]) == 8                  # nested
assert union_area_stripes([((0, 0), (2, 0), (0, 2)), ((5, 5), (7, 5), (5, 7))]) == 4                  # disjoint
```

That takes $O(n^2)$ stripes times $O(n\log n)$ per stripe: $O(n^3\log n)$ time and $O(n^2)$ memory. It is a perfectly good reference implementation. Now let us make it much faster.

## Optimization 1: one side at a time, $O(n^2\log n)$

Instead of generating all stripes, fix a side $s$ of some triangle and find the set of stripes in which $s$ is a boundary of a trapezoid of the union.

Call a side **lower** if its triangle lies above it, and **upper** if the triangle lies below it. Take a lower side $s$ (upper sides are symmetric, looking above instead of below). The region just below $s$ is covered by another triangle exactly when the sides of other triangles *below* $s$ (on the same vertical line) contain more lower sides than upper sides: each lower side below $s$ starts a triangle that is still open at $s$, and each upper side below $s$ closes a triangle that started earlier. So, treating the sides as brackets, $s$ is on the boundary of the union at a given $x$ precisely when the **balance is zero**.

So, for a fixed $s$, we run a *horizontal* sweep over the $x$-range of $s$ and add events that change the bracket balance:

For every other non-vertical side $t$, let $[x_1, x_2]$ be the intersection of the $x$-ranges of $s$ and $t$. If it is empty or a single point, $t$ is irrelevant. Otherwise, look at the intersection $I$ of the segments $s$ and $t$:

1. $I = \varnothing$: $t$ is above or below $s$ over $[x_1, x_2]$. If it is below, add $\pm1$ to the balance on $[x_1, x_2]$ (by the type of $t$). If it is above, ignore.
2. $I$ is a single point $p$: split $[x_1, x_2]$ at $p_x$ and treat each piece as case 1.
3. $I$ is a segment: the sides coincide there. If $t$ is of the other type, $s$ is *not* a side of the union there. If they have the same type, both could be considered, so break the tie by index: only the side with the smaller index counts (for the other, add a balance of $-2$ over the overlap).

The stripes where the balance is $0$ contribute the trapezoid under $s$ (subtracted for lower sides, added for upper sides): $\int_{x}^{x'} (kx + b)\,dx = \frac{(x'-x)(k(x'+x)+2b)}{2}$.

Sorting the events of each side gives $O(n\log n)$ per side, $O(n^2\log n)$ in total, and only $O(n)$ memory. The implementation below uses `Fraction`s so all the case distinctions are exact:

```python
def union_area(triangles):
    """Area of the union of triangles in O(n^2 log n) (exact arithmetic)."""
    segments, kinds = [], []
    for a, b, c in triangles:
        for p, q, other in ((a, b, c), (b, c, a), (c, a, b)):
            p, q = min(p, q), max(p, q)                       # left endpoint first
            segments.append((p, q))
            if p[0] == q[0]:
                kinds.append(0)                               # vertical side: contributes no area
            else:
                kinds.append(1 if cross(sub(q, p), sub(other, p)) > 0 else -1)   # 1: the triangle is above the side
    slope, intercept = {}, {}
    for i, ((p, q), kind) in enumerate(zip(segments, kinds)):
        if kind:
            slope[i] = Fraction(q[1] - p[1], q[0] - p[0])
            intercept[i] = p[1] - slope[i] * p[0]

    total = Fraction(0)
    for i, (p, q) in enumerate(segments):
        if not kinds[i]:
            continue
        left, right = p[0], q[0]
        y_i = lambda x, i=i: slope[i] * x + intercept[i]
        events = []
        for j, (p1, q1) in enumerate(segments):
            if not kinds[j] or i == j:
                continue
            if p1[0] >= right or left >= q1[0]:
                continue                                       # the x-ranges share at most one point
            common_l, common_r = max(left, p1[0]), min(right, q1[0])
            y_j = lambda x, j=j: slope[j] * x + intercept[j]
            touch = segment_intersection(p, q, p1, q1)
            event = -kinds[i] * kinds[j]
            if not touch:
                if (y_j(common_l) < y_i(common_l)) == (kinds[i] == 1):
                    events += [(common_l, event), (common_r, -event)]
            elif len(touch) == 1:
                if (y_j(common_l) < y_i(common_l)) == (kinds[i] == 1):
                    events += [(common_l, event), (touch[0][0], -event)]
                if (y_j(common_r) < y_i(common_r)) == (kinds[i] == 1):
                    events += [(touch[0][0], event), (common_r, -event)]
            elif kinds[j] != kinds[i] or j > i:
                events += [(common_l, -2), (common_r, 2)]     # the sides coincide: s is not a boundary
        events.append((left, 0))
        events.sort()
        balance, idx = 0, 0
        while idx < len(events):
            x = events[idx][0]
            nxt = idx
            while nxt < len(events) and events[nxt][0] == x:
                balance += events[nxt][1]
                nxt += 1
            if balance == 0 and x != right:
                x_next = right if nxt == len(events) else events[nxt][0]
                total -= kinds[i] * (slope[i] * (x_next + x) + 2 * intercept[i]) * (x_next - x)
            idx = nxt
    return total / 2

assert union_area([((0, 0), (2, 0), (0, 2))]) == 2
assert union_area([((0, 0), (1, 0), (0, 1)), ((1, 1), (1, 0), (0, 1))]) == 1
assert union_area([((0, 0), (4, 0), (0, 4)), ((1, 1), (2, 1), (1, 2))]) == 8
```

### Testing with inclusion-exclusion

Both algorithms are checked against a third, completely different method: the **inclusion-exclusion** formula $|\bigcup T_i| = \sum_{S\ne\varnothing}(-1)^{|S|+1}\,|\bigcap_{i\in S} T_i|$, where every intersection of triangles is a convex polygon obtained by clipping. Small coordinates produce many degenerate situations (shared sides, collinear overlaps, coinciding triangles):

```python
import random
from itertools import combinations

def counter_clockwise(t):
    a, b, c = t
    return [a, b, c] if cross(sub(b, a), sub(c, a)) > 0 else [a, c, b]

def clip(poly, a, b):
    """Keep the part of a convex polygon that is on the left of the directed line a -> b."""
    out = []
    for i in range(len(poly)):
        p, q = poly[i], poly[(i + 1) % len(poly)]
        sp, sq = cross(sub(b, a), sub(p, a)), cross(sub(b, a), sub(q, a))
        if sp >= 0:
            out.append(p)
        if (sp > 0 and sq < 0) or (sp < 0 and sq > 0):
            t = Fraction(sp) / (sp - sq)
            out.append((p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t))
    return out

def polygon_area(poly):
    if len(poly) < 3:
        return Fraction(0)
    return Fraction(abs(sum(cross(poly[i], poly[(i + 1) % len(poly)]) for i in range(len(poly)))), 2)

def union_area_inclusion_exclusion(triangles):
    tris = [counter_clockwise(t) for t in triangles]
    total = Fraction(0)
    for k in range(1, len(tris) + 1):
        for chosen in combinations(tris, k):
            poly = list(chosen[0])
            for t in chosen[1:]:
                for i in range(3):
                    poly = clip(poly, t[i], t[(i + 1) % 3]) if poly else poly
            total += (-1) ** (k + 1) * polygon_area(poly)
    return total

rnd = random.Random(1)
for _ in range(600):
    triangles = []
    while len(triangles) < rnd.randint(1, 5):
        t = tuple((rnd.randint(0, 5), rnd.randint(0, 5)) for _ in range(3))
        if cross(sub(t[1], t[0]), sub(t[2], t[0])) != 0:
            triangles.append(t)
    expected = union_area_inclusion_exclusion(triangles)
    assert union_area(triangles) == expected, triangles
    assert union_area_stripes(triangles) == expected, triangles
```

### Optimization 2

Because the events are generated on the fly and the stripes are never stored, the memory drops to $O(n)$ (only the events of one side are alive at a time).

## Intersection of convex polygons

Another use of the vertical decomposition: the intersection of two convex polygons in **linear time**. Cut the plane by vertical lines through every vertex of both polygons. In each stripe, each polygon is a trapezoid (or triangle, or a point), and the intersection of two such trapezoids is easy. Merging the pieces from left to right yields the intersection polygon. (The [half-plane intersection](/theory/geometry/halfplane-intersection) article gives an $O(n\log n)$ alternative that is simpler to code.)

## Practice problems

- [Codeforces 62C Inquisition](https://codeforces.com/contest/62/problem/C)
- [Codeforces 107E Darts](https://codeforces.com/contest/107/problem/E)
