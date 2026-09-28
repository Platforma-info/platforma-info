---
title: "Point Location in a Planar Subdivision"
section: Planar graphs
order: 2
difficulty: advanced
summary: "Answer many queries 'which face contains this point?' offline with a sweep line and an ordered set of non-crossing edges."
tags: [geometry, point location, sweep line, planar subdivision, offline queries]
prerequisites: [geometry/planar, geometry/intersecting-segments]
source:
  title: "Point location in O(log n)"
  url: https://cp-algorithms.com/geometry/point-location.html
  license: CC BY-SA 4.0
---

We are given a **planar subdivision**: a set of non-crossing segments (edges) that cut the plane into faces, with no vertices of degree 0 or 1, together with many query points. For each query point we must find the face containing it. This arises for points in a Voronoi diagram, in a simple polygon, or when [finding faces of a planar graph](/theory/geometry/planar) with nested components.

We answer all queries **offline** in $O(\log n)$ each, after sorting, with a sweep line.

## Algorithm

For each query $p = (x_0, y_0)$ find an edge such that: if $p$ lies on some edge, it is that edge; otherwise, it is the edge that crosses the vertical line $x = x_0$ at a point $(x_0, y)$ with $y < y_0$ and the largest such $y$, i.e. **the edge directly below $p$**.

Sweep a vertical line from left to right and maintain an **ordered list of the non-vertical edges crossing the sweep line**, ordered bottom to top. Since edges of a subdivision never cross, the order between two edges never changes while they coexist, and a binary search finds the edge below a query point.

The events at an $x$-coordinate:

1. answer queries with the state from the strip **left** of $x$ (edges that end at $x$ are still present);
2. remove the edges ending at $x$;
3. insert the edges starting at $x$;
4. answer queries again with the state to the **right** of $x$;

and each query keeps the higher of the two edges found. Two answers are needed for queries that lie exactly above a vertex: only then the edges to the left and to the right of $x$ differ. Vertical edges are stored per $x$ and checked separately by binary search.

**From an edge to a face.** For the edge found below $p$ and oriented left to right, the query is in the face **on the left of the edge** (the face above it). If there is no edge below, the point is in the outer face. If the edge passes through $p$, the answer is that edge (the face is not unique).

Edges are compared exactly: the order of two edges present at the same time is decided at $x_0 = \max$ of their left ends, comparing the $y$ values there, and by slope when they start in the same point.

## Implementation

The subdivision is given as a list of edges `(p, q, left_face, right_face)`: the segment from $p$ to $q$ with $p < q$ lexicographically (so it goes left to right, or upward if vertical), together with the ids of the face on its left (above) and on its right (below); the outer face has id $-1$.

```python
from bisect import bisect_right
from fractions import Fraction

def y_at(edge, x):
    (px, py), (qx, qy) = edge
    return py + Fraction((qy - py) * (x - px), qx - px)

def is_below(e, f):
    """Is the non-vertical edge e below f? They never cross, so any common x decides."""
    x0 = max(e[0][0], f[0][0])
    ye, yf = y_at(e, x0), y_at(f, x0)
    if ye != yf:
        return ye < yf
    slope_e = Fraction(e[1][1] - e[0][1], e[1][0] - e[0][0])     # they start at the same point: compare slopes
    slope_f = Fraction(f[1][1] - f[0][1], f[1][0] - f[0][0])
    return slope_e < slope_f

def locate_points(edges, queries):
    """For each query point: ('edge', i) if it lies on edge i, else ('face', f)."""
    segs = [(min(p, q), max(p, q)) for p, q, _, _ in edges]
    xs = {qx for qx, _ in queries}
    verticals, starts, ends = {}, {}, {}
    for i, (p, q) in enumerate(segs):
        xs.update((p[0], q[0]))
        if p[0] == q[0]:
            verticals.setdefault(p[0], []).append((p[1], q[1], i))
        else:
            starts.setdefault(p[0], []).append(i)
            ends.setdefault(q[0], []).append(i)
    for v in verticals.values():
        v.sort()
    queries_at = {}
    for k, (qx, _) in enumerate(queries):
        queries_at.setdefault(qx, []).append(k)

    active = []                                        # ids of the non-vertical edges crossing the sweep line

    def top_below(x, y):
        lo, hi = 0, len(active)
        while lo < hi:                                 # last edge whose y at x is <= y
            mid = (lo + hi) // 2
            if y_at(segs[active[mid]], x) <= y:
                lo = mid + 1
            else:
                hi = mid
        return active[lo - 1] if lo else None

    def position(i):
        lo, hi = 0, len(active)
        while lo < hi:
            mid = (lo + hi) // 2
            if is_below(segs[active[mid]], segs[i]):
                lo = mid + 1
            else:
                hi = mid
        return lo

    answer = [None] * len(queries)
    for x in sorted(xs):
        left = {k: top_below(x, queries[k][1]) for k in queries_at.get(x, [])}        # state left of x
        for i in ends.get(x, []):
            pos = position(i)
            active.pop(pos if pos < len(active) and active[pos] == i else active.index(i))
        for i in starts.get(x, []):
            active.insert(position(i), i)                                              # state right of x
        for k in queries_at.get(x, []):
            qy = queries[k][1]
            vs = verticals.get(x, [])
            idx = bisect_right(vs, (qy, float("inf"), 0)) - 1
            if idx >= 0 and vs[idx][1] >= qy:                                          # on a vertical edge
                answer[k] = ("edge", vs[idx][2])
                continue
            best = None
            for c in (left[k], top_below(x, qy)):
                if c is not None and (best is None or y_at(segs[c], x) > y_at(segs[best], x)):
                    best = c
            if best is None:
                answer[k] = ("face", -1)                                               # nothing below: outer face
            elif y_at(segs[best], x) == qy:
                answer[k] = ("edge", best)
            else:
                answer[k] = ("face", edges[best][2])                                   # the face above the edge
    return answer

# a 2 x 1 rectangle split into two unit squares by the vertical edge x = 1; faces 0 (left), 1 (right)
rect = [((0, 0), (1, 0), 0, -1), ((1, 0), (2, 0), 1, -1),      # bottom edges: face above is on the left
        ((0, 1), (1, 1), -1, 0), ((1, 1), (2, 1), -1, 1),      # top edges: face below is on the right
        ((0, 0), (0, 1), -1, 0), ((2, 0), (2, 1), 1, -1),      # vertical sides
        ((1, 0), (1, 1), 0, 1)]                                # the dividing edge
q = [(Fraction(1, 2), Fraction(1, 2)), (Fraction(3, 2), Fraction(1, 2)), (5, 5), (Fraction(1, 2), -1),
     (1, Fraction(1, 2)), (2, 1), (Fraction(3, 2), 0)]
a = locate_points(rect, q)
assert a[0] == ("face", 0) and a[1] == ("face", 1) and a[2] == ("face", -1) and a[3] == ("face", -1)
assert a[4] == ("edge", 6) and a[5][0] == "edge" and a[6] == ("edge", 1)
```

The order of the list maintained by the sweep stays consistent because edges do not cross; the same insertion and search strategy is used in [the search for intersecting segments](/theory/geometry/intersecting-segments). As there, the list insertion is a linear-time `memmove` but very fast in practice.

## Building a subdivision from faces

If the subdivision is given as a list of polygons (faces) with vertices in counter-clockwise order, every directed side has its polygon on the left. Matching each side with the reversed side of the neighbour polygon produces the edges:

```python
def subdivision_from_faces(faces):
    """faces: counter-clockwise vertex lists. Returns edges (p, q, left_face, right_face) with p < q."""
    left_of = {}
    for f, poly in enumerate(faces):
        for i in range(len(poly)):
            left_of[(poly[i], poly[(i + 1) % len(poly)])] = f
    edges = []
    for (u, v), f in left_of.items():
        if u < v:
            edges.append((u, v, f, left_of.get((v, u), -1)))
        elif (v, u) not in left_of:
            edges.append((v, u, -1, f))
    return edges

assert sorted(subdivision_from_faces([[(0, 0), (1, 0), (1, 1), (0, 1)]])) == sorted(
    [((0, 0), (1, 0), 0, -1), ((0, 1), (1, 1), -1, 0), ((0, 0), (0, 1), -1, 0), ((1, 0), (1, 1), 0, -1)])
```

## Testing

We triangulate a grid (each cell cut by a random diagonal), optionally shear it (so that the vertical edges become slanted), and locate every point of a half-integer lattice around it. The expected answers come from a brute-force test against every triangle (strictly inside) and every edge (on the segment):

```python
import random

def cross(o, a, b):
    return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])

def in_triangle(t, p):
    s = [cross(t[i], t[(i + 1) % 3], p) for i in range(3)]
    return all(v > 0 for v in s) or all(v < 0 for v in s)

def on_segment(e, p):
    a, b = e[0], e[1]
    return (cross(a, b, p) == 0 and min(a[0], b[0]) <= p[0] <= max(a[0], b[0])
            and min(a[1], b[1]) <= p[1] <= max(a[1], b[1]))

def triangulated_grid(w, h, rnd, shear):
    def place(x, y):
        return (2 * (x * shear + y), 2 * y) if shear else (2 * x, 2 * y)         # scaled by 2: half-integers become integers
    tris = []
    for y in range(h):
        for x in range(w):
            a, b, c, d = (x, y), (x + 1, y), (x + 1, y + 1), (x, y + 1)
            cells = [(a, b, c), (a, c, d)] if rnd.random() < 0.5 else [(a, b, d), (b, c, d)]
            tris += [[place(*v) for v in t] for t in cells]
    return tris

rnd = random.Random(1)
checked = 0
for _ in range(40):
    w, h, shear = rnd.randint(1, 4), rnd.randint(1, 4), rnd.choice([0, 0, 3, 5])
    tris = triangulated_grid(w, h, rnd, shear)
    edges = subdivision_from_faces(tris)
    xmax = 2 * (w * (shear or 1) + h)
    pts = [(X, Y) for X in range(-2, xmax + 3) for Y in range(-2, 2 * h + 3)]
    for p, result in zip(pts, locate_points(edges, pts)):
        touching = [i for i, e in enumerate(edges) if on_segment(e, p)]
        if touching:
            assert result[0] == "edge" and on_segment(edges[result[1]], p)
        else:
            inside = [i for i, t in enumerate(tris) if in_triangle(t, p)]
            assert result == ("face", inside[0] if inside else -1)
        checked += 1
assert checked > 5000
```

## Notes

- With **persistent** balanced trees the same sweep can answer queries online (each version of the tree corresponds to one strip).
- Complexity: $O((n + q)\log n)$ for $n$ edges and $q$ queries.
- Trapezoidal maps and Kirkpatrick's hierarchy give $O(\log n)$ online queries too, at the cost of a more complex implementation.

## Practice problems

- [TIMUS 1848 Fly Hunt](http://acm.timus.ru/problem.aspx?space=1&num=1848&locale=en)
- [UVA 12310 Point Location](https://onlinejudge.org/index.php?option=com_onlinejudge&Itemid=8&category=297&page=show_problem&problem=3732)
