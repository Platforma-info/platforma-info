---
title: "Delaunay Triangulation and Voronoi Diagram"
section: Advanced topics
order: 2
difficulty: advanced
summary: "Build the Delaunay triangulation of a point set in O(n log n) with the Guibas–Stolfi divide and conquer on the quad-edge structure, and get the Voronoi diagram by duality."
tags: [geometry, delaunay, voronoi, quad-edge, divide and conquer, in-circle test]
prerequisites: [geometry/convex-hull, geometry/planar]
source:
  title: "Delaunay triangulation and Voronoi diagram"
  url: https://cp-algorithms.com/geometry/delaunay.html
  license: CC BY-SA 4.0
---

Consider a set of points $\{p_i\}$ in the plane.

- The **Voronoi diagram** partitions the plane into regions $V_i$: the region $V_i$ consists of the points that are nearest to $p_i$ (among all the $p_k$). The regions are convex polygons, possibly unbounded.
- A **Delaunay triangulation** is a triangulation of the points in which every point lies outside or on the boundary of the **circumcircle** of every triangle ("empty circle" property).

If all points are collinear, the Voronoi diagram is not connected and no Delaunay triangulation exists; this case is handled separately.

## Properties

- The Delaunay triangulation **maximizes the minimum angle** among all triangulations of the point set: it avoids long thin triangles. This makes it the standard mesh for interpolation and terrain modelling.
- The Euclidean **minimum spanning tree** of the points is a subset of the Delaunay edges. So instead of the $\Theta(n^2)$ complete graph, MST needs only $O(n)$ edges.

## Duality

If the points are not collinear and no four of them lie on a common circle, the Voronoi diagram and the Delaunay triangulation are **dual**: given one, the other can be obtained in $O(n)$.

- The **vertices** of the Voronoi diagram are the circumcenters of the Delaunay triangles.
- Two Voronoi cells share an edge exactly when their points are joined by a Delaunay edge; the Voronoi edge is the perpendicular bisector piece connecting the circumcenters of the two triangles adjacent to that Delaunay edge.

When four or more points are cocircular, the duality holds for the triangulation $D'$ obtained by removing edges between triangles that share a circumcircle.

So it is enough to compute one of them. We build the Delaunay triangulation with the Guibas–Stolfi divide-and-conquer algorithm in $O(n\log n)$.

## Quad-edge data structure

The triangulation is stored in the **quad-edge** structure, which represents a planar subdivision together with its dual. Each undirected edge is stored as four directed "sub-edges": the edge itself, its reverse, and the two dual edges (crossing it from the right to the left and from the left to the right). Every directed edge has:

- `origin`: the point it starts at (dual edges have no point);
- `rot`: the same edge rotated by $90^\circ$, i.e. the dual edge;
- `onext`: the next edge counter-clockwise around the origin.

Derived operations: `rev = rot.rot`, `dest = rev.origin`, `lnext` (the next edge around the face on the left) and `oprev` (the previous edge around the origin).

The four operations of the algorithm:

1. `make_edge(a, b)`: an isolated edge from `a` to `b`, with its reverse and both dual edges.
2. `splice(a, b)`: the key primitive; it swaps `a.onext` with `b.onext` and the same for their duals (joins or splits the rings of edges around a vertex and around a face).
3. `delete_edge(e)`: `splice(e, e.oprev)` and `splice(e.rev, e.rev.oprev)`.
4. `connect(a, b)`: creates an edge from `a.dest` to `b.origin` so that `a`, `b` and the new edge share the same left face.

## Algorithm

Sort the points by $x$ (then $y$). Solve recursively on a range $[l, r]$ of points; the function returns two edges: the counter-clockwise convex hull edge leaving the leftmost point and the clockwise hull edge leaving the rightmost.

- With **2 points**: a single edge.
- With **3 points**: two edges $p_l p_{l+1}$ and $p_{l+1}p_r$; if the points are collinear stop, otherwise close the triangle with `connect`.
- With **at least 4 points**: solve the left half $L$ and the right half $R$, then **merge** them by adding "cross" edges from $L$ to $R$ and deleting some edges of $L$ and $R$.

**Merging.** All cross edges cross the vertical line between the halves, so they can be ordered from bottom to top. Consecutive cross edges share an endpoint, and their third triangle side lies in $L$ or in $R$.

1. Find the lowest common tangent of the two hulls; its edge is the first `base` cross edge.
2. Repeat: look at the circle through the endpoints of `base` and grow it "upwards" until it meets a point of $L$ or of $R$. The first candidate in $L$ is `lcand`, the first in $R$ is `rcand`. While the next point in a candidate list lies inside the circumcircle of `base` and the candidate, that candidate edge is deleted, as it breaks the Delaunay property.
3. Choose the candidate that is encountered first (using the in-circle test), and add a new `base` edge from it. Stop when there are no more valid candidates (`base` is the upper tangent).

## The in-circle test

The only geometric predicate besides orientation: is point $d$ strictly inside the circle through $a, b, c$ (counter-clockwise)? It is the sign of a $3\times3$ determinant:

$$
\begin{vmatrix}
a_x - d_x & a_y - d_y & (a_x-d_x)^2 + (a_y-d_y)^2 \\
b_x - d_x & b_y - d_y & (b_x-d_x)^2 + (b_y-d_y)^2 \\
c_x - d_x & c_y - d_y & (c_x-d_x)^2 + (c_y-d_y)^2
\end{vmatrix} > 0
$$

With Python integers this is **exact** for any coordinates (in C++ the determinant needs 128-bit integers to avoid overflow).

## Implementation

```python
import sys

sys.setrecursionlimit(10_000)
INF_PT = (10 ** 18, 10 ** 18)

def cross(o, a, b):
    return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])

class QuadEdge:
    __slots__ = ("origin", "rot", "onext", "used")

    def __init__(self, origin):
        self.origin, self.rot, self.onext, self.used = origin, None, None, False

    def rev(self):
        return self.rot.rot

    def lnext(self):
        return self.rot.rev().onext.rot

    def oprev(self):
        return self.rot.onext.rot

    def dest(self):
        return self.rev().origin

def make_edge(a, b):
    e1, e2, e3, e4 = QuadEdge(a), QuadEdge(b), QuadEdge(INF_PT), QuadEdge(INF_PT)
    e1.rot, e2.rot, e3.rot, e4.rot = e3, e4, e2, e1
    e1.onext, e2.onext, e3.onext, e4.onext = e1, e2, e4, e3
    return e1

def splice(a, b):
    x, y = a.onext.rot, b.onext.rot
    x.onext, y.onext = y.onext, x.onext
    a.onext, b.onext = b.onext, a.onext

def delete_edge(e):
    splice(e, e.oprev())
    splice(e.rev(), e.rev().oprev())

def connect(a, b):
    e = make_edge(a.dest(), b.origin)
    splice(e, a.lnext())
    splice(e.rev(), b)
    return e

def left_of(p, e):
    return cross(p, e.origin, e.dest()) > 0

def right_of(p, e):
    return cross(p, e.origin, e.dest()) < 0

def in_circle(a, b, c, d):
    """Is d strictly inside the circle through a, b, c (counter-clockwise)? Exact for integers."""
    rows = []
    for p in (a, b, c):
        dx, dy = p[0] - d[0], p[1] - d[1]
        rows.append((dx, dy, dx * dx + dy * dy))
    (a1, a2, a3), (b1, b2, b3), (c1, c2, c3) = rows
    det = a1 * (b2 * c3 - c2 * b3) - a2 * (b1 * c3 - c1 * b3) + a3 * (b1 * c2 - c1 * b2)
    return det > 0

def build(l, r, p):
    if r - l + 1 == 2:
        res = make_edge(p[l], p[r])
        return res, res.rev()
    if r - l + 1 == 3:
        a, b = make_edge(p[l], p[l + 1]), make_edge(p[l + 1], p[r])
        splice(a.rev(), b)
        s = cross(p[l], p[l + 1], p[r])
        if s == 0:
            return a, b.rev()
        c = connect(b, a)
        return (a, b.rev()) if s > 0 else (c.rev(), c)
    mid = (l + r) // 2
    ldo, ldi = build(l, mid, p)
    rdi, rdo = build(mid + 1, r, p)
    while True:                                          # find the lower common tangent
        if left_of(rdi.origin, ldi):
            ldi = ldi.lnext()
        elif right_of(ldi.origin, rdi):
            rdi = rdi.rev().onext
        else:
            break
    basel = connect(rdi.rev(), ldi)
    valid = lambda e: right_of(e.dest(), basel)
    if ldi.origin == ldo.origin:
        ldo = basel.rev()
    if rdi.origin == rdo.origin:
        rdo = basel
    while True:
        lcand = basel.rev().onext
        if valid(lcand):
            while in_circle(basel.dest(), basel.origin, lcand.dest(), lcand.onext.dest()):
                nxt = lcand.onext
                delete_edge(lcand)
                lcand = nxt
        rcand = basel.oprev()
        if valid(rcand):
            while in_circle(basel.dest(), basel.origin, rcand.dest(), rcand.oprev().dest()):
                nxt = rcand.oprev()
                delete_edge(rcand)
                rcand = nxt
        if not valid(lcand) and not valid(rcand):
            break
        if not valid(lcand) or (valid(rcand) and in_circle(lcand.dest(), lcand.origin, rcand.origin, rcand.dest())):
            basel = connect(rcand, basel.rev())
        else:
            basel = connect(basel.rev(), lcand.rev())
    return ldo, rdo

def delaunay(points):
    """Triangles (as triples of points) of the Delaunay triangulation; [] if the points are collinear."""
    p = sorted(set(points))
    if len(p) < 3 or all(cross(p[0], p[1], q) == 0 for q in p[2:]):
        return []
    e = build(0, len(p) - 1, p)[0]
    edges = [e]
    while cross(e.onext.dest(), e.dest(), e.origin) < 0:
        e = e.onext

    def walk(start):                                     # traverse the face on the left of `start`
        face, cur = [], start
        while True:
            cur.used = True
            face.append(cur.origin)
            edges.append(cur.rev())
            cur = cur.lnext()
            if cur is start:
                return face

    walk(e)                                              # the first face is the outer one: discard it
    triangles, k = [], 0
    while k < len(edges):
        e = edges[k]
        k += 1
        if not e.used:
            triangles.append(tuple(walk(e)))
    return triangles

tris = delaunay([(0, 0), (4, 0), (4, 4), (0, 4), (2, 1)])
assert len(tris) == 4                                     # a square with an interior point: 4 triangles
assert delaunay([(0, 0), (1, 1), (2, 2)]) == [] and delaunay([(0, 0), (5, 5)]) == []
assert len(delaunay([(0, 0), (1, 0), (0, 1)])) == 1
```

The final loop collects the faces by walking around them; each undirected edge is reachable from both sides, and the `used` flag ensures each face is visited once. The very first face reached is the unbounded one, which is discarded.

## Verification

For a random set of points we check three independent facts about the result:

1. **Delaunay property**: no point of the set is strictly inside the circumcircle of any triangle (exact test).
2. **Coverage**: the triangle areas add up to the area of the convex hull of the points, so the triangles tile the hull without gaps or overlaps.
3. **Count**: a triangulation of a set of $n$ points with $b$ of them on the boundary of the hull (collinear ones included) has exactly $2n - b - 2$ triangles.

```python
import random

def hull_boundary(points):
    """(number of points on the boundary of the convex hull, doubled hull area)."""
    pts = sorted(set(points))

    def half(seq, strict):
        h = []
        for q in seq:
            while len(h) >= 2 and (cross(h[-2], h[-1], q) <= 0 if strict else cross(h[-2], h[-1], q) < 0):
                h.pop()
            h.append(q)
        return h

    boundary = len(set(half(pts, False) + half(pts[::-1], False)))
    corners = half(pts, True)[:-1] + half(pts[::-1], True)[:-1]
    area2 = abs(sum(corners[i][0] * corners[(i + 1) % len(corners)][1]
                    - corners[(i + 1) % len(corners)][0] * corners[i][1] for i in range(len(corners))))
    return boundary, area2

rnd = random.Random(5)
built = 0
for _ in range(1500):
    n, r = rnd.randint(1, 25), rnd.choice([3, 6, 30, 1000])
    pts = [(rnd.randint(0, r), rnd.randint(0, r)) for _ in range(n)]
    tris = delaunay(pts)
    distinct = sorted(set(pts))
    if not tris:
        assert len(distinct) < 3 or all(cross(distinct[0], distinct[1], q) == 0 for q in distinct[2:])
        continue
    built += 1
    for t in tris:
        a, b, c = t if cross(*t) > 0 else (t[0], t[2], t[1])
        assert cross(a, b, c) != 0
        assert not any(in_circle(a, b, c, q) for q in distinct), (t, pts)               # empty circumcircle
    boundary, hull_area2 = hull_boundary(distinct)
    assert sum(abs(cross(*t)) for t in tris) == hull_area2                                # tiles the hull
    assert len(tris) == 2 * len(distinct) - boundary - 2                                  # triangle count
assert built > 1000
```

Cocircular points (like the corners of a grid) admit several valid Delaunay triangulations; the checks above accept any of them.

## Application 1: the Euclidean MST

Since the MST is a subgraph of the Delaunay triangulation, the MST of $n$ points can be found from just $O(n)$ edges with Kruskal's algorithm: $O(n\log n)$ instead of $O(n^2)$. Verification against Prim on the complete graph:

```python
def delaunay_edges(points):
    edges = set()
    for a, b, c in delaunay(points):
        for u, v in ((a, b), (b, c), (c, a)):
            edges.add((min(u, v), max(u, v)))
    return edges

def kruskal_total(points, edges):
    parent = {p: p for p in points}

    def find(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x

    total = 0
    for w, u, v in sorted((((u[0] - v[0]) ** 2 + (u[1] - v[1]) ** 2) ** 0.5, u, v) for u, v in edges):
        ru, rv = find(u), find(v)
        if ru != rv:
            parent[ru] = rv
            total += w
    return total

def prim_total(points):
    n = len(points)
    best = [float("inf")] * n
    used = [False] * n
    best[0] = 0.0
    total = 0.0
    for _ in range(n):
        u = min((i for i in range(n) if not used[i]), key=lambda i: best[i])
        used[u] = True
        total += best[u]
        for v in range(n):
            if not used[v]:
                best[v] = min(best[v], ((points[u][0] - points[v][0]) ** 2 + (points[u][1] - points[v][1]) ** 2) ** 0.5)
    return total

for _ in range(200):
    pts = sorted({(rnd.randint(0, 40), rnd.randint(0, 40)) for _ in range(rnd.randint(4, 30))})
    if len(delaunay(pts)) == 0:
        continue
    assert abs(kruskal_total(pts, delaunay_edges(pts)) - prim_total(pts)) < 1e-9
```

## Application 2: Voronoi vertices

The vertices of the Voronoi diagram are the circumcenters of the Delaunay triangles. Each is equidistant from the three points and no other point is closer, which we can verify exactly using rational arithmetic:

```python
from fractions import Fraction

def circumcenter(a, b, c):
    d = 2 * (a[0] * (b[1] - c[1]) + b[0] * (c[1] - a[1]) + c[0] * (a[1] - b[1]))
    ux = Fraction((a[0] ** 2 + a[1] ** 2) * (b[1] - c[1]) + (b[0] ** 2 + b[1] ** 2) * (c[1] - a[1])
                  + (c[0] ** 2 + c[1] ** 2) * (a[1] - b[1]), d)
    uy = Fraction((a[0] ** 2 + a[1] ** 2) * (c[0] - b[0]) + (b[0] ** 2 + b[1] ** 2) * (a[0] - c[0])
                  + (c[0] ** 2 + c[1] ** 2) * (b[0] - a[0]), d)
    return ux, uy

def voronoi_vertices(points):
    return [circumcenter(*t) for t in delaunay(points)]

def dist2(p, q):
    return (p[0] - q[0]) ** 2 + (p[1] - q[1]) ** 2

pts = sorted({(rnd.randint(0, 50), rnd.randint(0, 50)) for _ in range(40)})
for tri, center in zip(delaunay(pts), voronoi_vertices(pts)):
    radius2 = dist2(center, tri[0])
    assert all(dist2(center, q) == radius2 for q in tri)                     # equidistant from the 3 sites
    assert all(dist2(center, q) >= radius2 for q in pts)                     # no site is closer
```

## Speed

The algorithm runs in $O(n\log n)$. In pure Python, 5,000 random points take well under a second and 20,000 points a few seconds on an ordinary machine:

```python
import time

cloud = [(rnd.randint(0, 10 ** 6), rnd.randint(0, 10 ** 6)) for _ in range(5000)]
start = time.perf_counter()
triangles = delaunay(cloud)
elapsed = time.perf_counter() - start
assert len(triangles) > 5000 and elapsed < 60
```

For much larger inputs, use `scipy.spatial.Delaunay` (Qhull) if third-party libraries are allowed.

## Practice problems

- [TIMUS 1504 Good Manners](http://acm.timus.ru/problem.aspx?space=1&num=1504)
- [TIMUS 1520 Empire Strikes Back](http://acm.timus.ru/problem.aspx?space=1&num=1520)
- [SGU 383 Caravans](https://codeforces.com/problemsets/acmsguru/problem/99999/383)
