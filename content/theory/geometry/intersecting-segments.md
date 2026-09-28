---
title: "Finding a Pair of Intersecting Segments"
section: Sweep line
order: 1
difficulty: advanced
summary: "The Shamos–Hoey sweep line: detect whether any two of n segments intersect in O(n log n) by comparing only neighbours in the sweep order."
tags: [geometry, sweep line, segments, intersection, ordered set]
prerequisites: [geometry/check-segments-intersection, searching/binary-search]
source:
  title: "Search for a pair of intersecting segments"
  url: https://cp-algorithms.com/geometry/intersecting_segments.html
  license: CC BY-SA 4.0
---

Given $n$ segments in the plane, check whether **at least two of them intersect**, and if so report such a pair. Testing all pairs with the [segment intersection check](/theory/geometry/check-segments-intersection) costs $O(n^2)$. A **sweep line** algorithm (Shamos and Hoey, 1976) does it in $O(n \log n)$.

## Idea

Imagine a vertical line moving from $x = -\infty$ to $+\infty$. At any moment it crosses some segments, each in exactly one point. Keep the segments currently crossed by the line in a list **ordered by their $y$ coordinate on the line**.

Why is this order useful? Two segments that intersect must have equal $y$ at the intersection abscissa, so *just before* that moment they are **adjacent** in the order (or become adjacent, when something between them ends or starts). The facts that make the algorithm work:

- Two segments that do not intersect never change their relative order.
- Therefore, to find an intersection it is enough to check pairs of segments that are *at some moment neighbours* in the order.
- Only the **events** matter: the moments when the sweep line meets an endpoint of a segment. Between events the order does not change (until the first intersection, which is exactly what we look for).
- When a segment **starts**, insert it at its place and check it against its upper and lower neighbours.
- When a segment **ends**, remove it and check its former upper and lower neighbours against each other (they become adjacent).
- At the same $x$, process **all insertions first, then all removals**, so that segments touching at an endpoint are detected.
- Vertical segments need no special treatment: they open and close at the same $x$, and, being inserted before any removal at that $x$, they are compared with the segments open at that moment. Any $y$ of the vertical segment can serve as its key; we use the lower end.

The algorithm performs at most $2n$ intersection checks and $O(n)$ operations on the ordered list, hence $O(n\log n)$ (with a balanced tree; see the remark on Python below).

## Comparing segments

To insert a segment we compare it with those in the list at the sweep position $x = \max(\text{left end of } a,\ \text{left end of } b)$, which is the first moment when both are present. The $y$ coordinate of a segment at abscissa $x$ is

$$
y(x) = p_y + (q_y - p_y)\,\frac{x - p_x}{q_x - p_x}
$$

We compute it with `Fraction`, so ties are decided exactly (no epsilon is needed).

## Implementation

```python
from fractions import Fraction

def cross(o, a, b):
    return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])

def sgn(x):
    return (x > 0) - (x < 0)

def overlap_1d(a, b, c, d):
    if a > b:
        a, b = b, a
    if c > d:
        c, d = d, c
    return max(a, c) <= min(b, d)

def segments_intersect(s, t):
    a, b = s
    c, d = t
    return (overlap_1d(a[0], b[0], c[0], d[0]) and overlap_1d(a[1], b[1], c[1], d[1])
            and sgn(cross(a, b, c)) * sgn(cross(a, b, d)) <= 0
            and sgn(cross(c, d, a)) * sgn(cross(c, d, b)) <= 0)

def y_at(seg, x):
    (px, py), (qx, qy) = seg
    if px == qx:                                   # vertical segment: use its lower end
        return Fraction(py)
    return py + Fraction((qy - py) * (x - px), qx - px)

def find_intersecting_pair(segments):
    """Return indices (i, j) of two intersecting segments, or None. Each segment is ((x1, y1), (x2, y2))."""
    segs = [tuple(sorted(s)) for s in segments]    # left endpoint first (lowest first for vertical ones)

    def below(i, j):                               # is segment i strictly below segment j?
        x = max(segs[i][0][0], segs[j][0][0])
        return y_at(segs[i], x) < y_at(segs[j], x)

    events = []
    for i, (p, q) in enumerate(segs):
        events.append((p[0], 0, i))                # 0: the segment starts (processed first at equal x)
        events.append((q[0], 1, i))                # 1: the segment ends
    events.sort()

    order = []                                     # segment ids, from bottom to top along the sweep line
    for x, kind, i in events:
        if kind == 0:
            lo, hi = 0, len(order)
            while lo < hi:                         # binary search for the insertion position
                mid = (lo + hi) // 2
                if below(order[mid], i):
                    lo = mid + 1
                else:
                    hi = mid
            if lo < len(order) and segments_intersect(segs[order[lo]], segs[i]):
                return order[lo], i
            if lo > 0 and segments_intersect(segs[order[lo - 1]], segs[i]):
                return order[lo - 1], i
            order.insert(lo, i)
        else:
            pos = order.index(i)
            if 0 < pos < len(order) - 1 and segments_intersect(segs[order[pos - 1]], segs[order[pos + 1]]):
                return order[pos - 1], order[pos + 1]
            order.pop(pos)
    return None

# an X: the two diagonals cross
assert find_intersecting_pair([((0, 0), (4, 4)), ((0, 4), (4, 0))]) is not None
# parallel horizontal segments: no intersection
assert find_intersecting_pair([((0, 0), (5, 0)), ((0, 1), (5, 1)), ((0, 2), (5, 2))]) is None
# the crossing pair is the outer one, hidden by a segment in between
scene = [((0, 0), (10, 10)), ((0, 5), (10, 5)), ((0, 10), (10, 0)), ((20, 20), (21, 21))]
found = find_intersecting_pair(scene)
assert found is not None
i, j = found
assert segments_intersect(tuple(sorted(scene[i])), tuple(sorted(scene[j])))
assert find_intersecting_pair([((0, 0), (2, 2)), ((2, 2), (4, 0))]) is not None            # they share an endpoint
assert find_intersecting_pair([((0, 0), (0, 5)), ((1, 0), (1, 5))]) is None                # vertical, parallel
assert find_intersecting_pair([((0, 0), (0, 5)), ((-1, 3), (1, 3))]) is not None           # vertical crossing horizontal
assert find_intersecting_pair([((0, 0), (1, 1))]) is None
```

## Testing

Against the $O(n^2)$ all-pairs check, on thousands of random inputs, small enough to include many degenerate configurations (points, vertical, overlapping segments):

```python
import random

def brute(segments):
    for i in range(len(segments)):
        for j in range(i + 1, len(segments)):
            if segments_intersect(tuple(sorted(segments[i])), tuple(sorted(segments[j]))):
                return (i, j)
    return None

rnd = random.Random(1)
for _ in range(5000):
    n, r = rnd.randint(1, 7), rnd.choice([3, 5, 8])
    segs = [((rnd.randint(0, r), rnd.randint(0, r)), (rnd.randint(0, r), rnd.randint(0, r))) for _ in range(n)]
    got, expected = find_intersecting_pair(segs), brute(segs)
    assert (got is None) == (expected is None), segs
    if got is not None:
        i, j = got
        assert segments_intersect(tuple(sorted(segs[i])), tuple(sorted(segs[j])))
```

Random segments almost always intersect, so also test many **non-intersecting** sets (built greedily) with one more segment added:

```python
answers = {True: 0, False: 0}
for _ in range(1000):
    r = rnd.choice([10, 20, 40])
    chosen = []
    for _ in range(200):
        s = ((rnd.randint(0, r), rnd.randint(0, r)), (rnd.randint(0, r), rnd.randint(0, r)))
        if all(not segments_intersect(tuple(sorted(s)), tuple(sorted(c))) for c in chosen):
            chosen.append(s)
        if len(chosen) >= 12:
            break
    rnd.shuffle(chosen)
    assert find_intersecting_pair(chosen) is None                     # a set without intersections
    extra = ((rnd.randint(0, r), rnd.randint(0, r)), (rnd.randint(0, r), rnd.randint(0, r)))
    got, expected = find_intersecting_pair(chosen + [extra]), brute(chosen + [extra])
    assert (got is None) == (expected is None)
    answers[expected is None] += 1
assert answers[True] > 50 and answers[False] > 50                     # both outcomes were exercised
```

## Python notes

Python has no built-in balanced tree, and the algorithm needs an **ordered sequence with insertion and deletion**. The version above uses a plain `list` with binary search for the position: comparisons are $O(\log n)$ and the insertion or deletion itself is an $O(n)$ `memmove`, which is very fast in practice (for $n$ up to about $10^5$ segments it is negligible next to the comparisons). If you need a strict $O(\log n)$ worst case, use a balanced tree or a skip list (or the `sortedcontainers` package, when third-party libraries are allowed).

The check for the segments' order at insertion assumes the list is currently consistent, which holds up to the first intersection. This is why the algorithm can stop at the first pair found, but cannot be used as is to report *all* intersections (that needs the Bentley–Ottmann variant, which also swaps neighbours at intersection points).

## Practice problems

- [TIMUS 1469 No Smoking!](https://acm.timus.ru/problem.aspx?space=1&num=1469)
