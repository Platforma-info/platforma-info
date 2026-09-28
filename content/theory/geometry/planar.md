---
title: "Faces of a Planar Graph"
section: Planar graphs
order: 1
difficulty: advanced
summary: "Enumerate the faces of a straight-line planar graph by walking around them along angularly sorted edges, and build such a graph from intersecting segments."
tags: [geometry, planar graph, faces, euler formula, polar angle]
prerequisites: [geometry/segments-intersection, graphs/graph-basics]
source:
  title: "Finding faces of a planar graph"
  url: https://cp-algorithms.com/geometry/planar.html
  license: CC BY-SA 4.0
---

A graph is **planar** if it can be drawn in the plane so that edges intersect only at common endpoints. Given such a graph together with a straight-line embedding (each vertex is a point, each edge a segment, no crossings), the edges cut the plane into regions called **faces**. Exactly one face is unbounded: the **outer** face; the others are **inner** faces.

We assume the graph is **connected**. (For disconnected graphs, components can be nested inside faces of other components, forming faces with holes; identifying that needs [point location](/theory/geometry/point-location).)

## Facts about planar graphs

- **Euler's formula.** For a connected planar graph with $n$ vertices, $m$ edges and $f$ faces (the outer one included), $n - m + f = 2$. With $k$ connected components: $n - m + f = 1 + k$.
- **Few edges.** If $n \ge 3$ then $m \le 3n - 6$, with equality when every face is a triangle. So $m = O(n)$.
- **Few faces.** If $n \ge 3$ then $f \le 2n - 4$.
- **Low degree vertex.** Every planar graph has a vertex of degree at most 5.

## The algorithm

Sort the neighbours of every vertex by polar angle. Now walk: suppose we arrive at $u$ along the edge $(v, u)$, and $(u, w)$ is the edge that follows $(v, u)$ in the sorted adjacency list of $u$; then go on to $w$. Starting from a directed edge and repeating this rule, we go around exactly **one face** and return to the starting directed edge.

So: for each directed edge that has not been used yet, start a walk; every face is found exactly once, and each edge is used twice (once in each direction, by the two faces on its sides).

With this "next edge" rule the walk goes around inner faces **clockwise** and the outer face **counter-clockwise**, so the outer face is the one whose signed area has the opposite sign.

**Complexity.** Sorting costs $O(m\log m) = O(n\log n)$; with the positions of the neighbours stored in a hash map, the walk is linear.

## Implementation

Sorting by angle uses exact integer cross products (a point's "half" first, then the sign of the cross product) through `functools.cmp_to_key`. Instead of binary search, we store for every vertex `position[u][v]`, the index of the edge $(u, v)$ in the sorted list, so that the next edge is found in $O(1)$.

```python
from functools import cmp_to_key

def sub(a, b):
    return (a[0] - b[0], a[1] - b[1])

def cross(u, v):
    return u[0] * v[1] - u[1] * v[0]

def half(v):
    return 1 if v[1] < 0 or (v[1] == 0 and v[0] < 0) else 0

def find_faces(vertices, adj):
    """Faces of a connected straight-line planar graph.

    `vertices` are points, `adj[i]` lists the neighbours of vertex i.
    Returns a list of faces (each a list of vertex indices); the outer face comes first.
    """
    n = len(vertices)
    adj = [list(a) for a in adj]
    for i in range(n):
        def compare(l, r, i=i):
            pl, pr = sub(vertices[l], vertices[i]), sub(vertices[r], vertices[i])
            if half(pl) != half(pr):
                return half(pl) - half(pr)
            c = cross(pl, pr)
            return -1 if c > 0 else 1 if c < 0 else 0
        adj[i].sort(key=cmp_to_key(compare))
    position = [{v: k for k, v in enumerate(adj[i])} for i in range(n)]

    used = [[False] * len(adj[i]) for i in range(n)]
    faces = []
    for i in range(n):
        for edge_id in range(len(adj[i])):
            if used[i][edge_id]:
                continue
            face, v, e = [], i, edge_id
            while not used[v][e]:
                used[v][e] = True
                face.append(v)
                u = adj[v][e]
                e1 = position[u][v] + 1                   # the edge after (u, v) in counter-clockwise order
                if e1 == len(adj[u]):
                    e1 = 0
                v, e = u, e1
            face.reverse()
            p1 = vertices[face[0]]
            twice_area = sum(cross(sub(vertices[face[j]], p1), sub(vertices[face[(j + 1) % len(face)]], p1))
                             for j in range(len(face)))
            if twice_area <= 0:
                faces.insert(0, face)                     # the outer face (the only one with non-positive area)
            else:
                faces.append(face)
    return faces
```

Inner faces are returned counter-clockwise (after the final reversal) and the outer face clockwise.

### Checks

A 2×2 grid of unit squares: 9 vertices, 12 edges, so by Euler's formula $f = 2 - 9 + 12 = 5$: four unit squares and the outer face.

```python
def grid_graph(w, h, removed=()):
    """A w x h grid of lattice points, with some edges removed."""
    verts = [(x, y) for y in range(h) for x in range(w)]
    idx = {p: i for i, p in enumerate(verts)}
    adj = [[] for _ in verts]
    for (x, y), i in idx.items():
        for dx, dy in ((1, 0), (0, 1)):
            q = (x + dx, y + dy)
            if q in idx and frozenset((i, idx[q])) not in removed:
                adj[i].append(idx[q])
                adj[idx[q]].append(i)
    return verts, adj

def signed_area2(vertices, face):
    return sum(cross(vertices[face[j]], vertices[face[(j + 1) % len(face)]]) for j in range(len(face)))

verts, adj = grid_graph(3, 3)
faces = find_faces(verts, adj)
assert len(faces) == 5
assert signed_area2(verts, faces[0]) == -2 * 4                          # the outer face: clockwise, area 2 x 2
assert sorted(signed_area2(verts, f) for f in faces[1:]) == [2, 2, 2, 2]  # four unit squares, counter-clockwise
assert all(len(f) == 4 for f in faces[1:])
```

Now random connected planar graphs: take a grid and remove random edges while keeping the graph connected. For each result, Euler's formula must hold, every directed edge must be used exactly once, and the areas of the inner faces must add up to the area enclosed by the outer face:

```python
import random

def connected(n, adj):
    seen, stack = {0}, [0]
    while stack:
        for w in adj[stack.pop()]:
            if w not in seen:
                seen.add(w)
                stack.append(w)
    return len(seen) == n

rnd = random.Random(7)
for _ in range(300):
    w, h = rnd.randint(2, 5), rnd.randint(2, 5)
    verts, adj = grid_graph(w, h)
    edges = [(i, j) for i in range(len(verts)) for j in adj[i] if i < j]
    rnd.shuffle(edges)
    removed = set()
    for i, j in edges[: rnd.randint(0, len(edges))]:
        trial = removed | {frozenset((i, j))}
        _, adj2 = grid_graph(w, h, trial)
        if connected(len(verts), adj2):
            removed = trial
    verts, adj = grid_graph(w, h, removed)
    faces = find_faces(verts, adj)
    m = sum(len(a) for a in adj) // 2
    assert len(verts) - m + len(faces) == 2                              # Euler's formula
    assert sum(len(f) for f in faces) == 2 * m                           # each directed edge in exactly one face
    outer, inner = faces[0], faces[1:]
    assert signed_area2(verts, outer) == -sum(signed_area2(verts, f) for f in inner)
    assert all(signed_area2(verts, f) > 0 for f in inner)
```

(A tree, e.g. a grid graph with many edges removed, has a single face: its outer one, walked around the whole tree.)

## Building the graph from line segments

Often the graph is not given explicitly: you get a set of segments in the plane, and the graph is formed by their intersections. To build it, take each segment in turn, intersect it with all others, add the intersection points and the segment's endpoints as vertices, sort them along the segment (lexicographically), and connect consecutive ones. Equal points must map to the same vertex. This takes $O(n^2\log n)$.

With floating point one has to merge points that differ by less than some $\varepsilon$. In Python we can be exact: compute intersection points as `Fraction`s (see the [segment intersection](/theory/geometry/segments-intersection) article), and use the exact coordinates as dictionary keys.

```python
from fractions import Fraction

def segment_intersection(a, b, c, d):
    """[] / [point] / [start, end] of the intersection of segments ab and cd (exact)."""
    r, s = sub(b, a), sub(d, c)
    denom = cross(r, s)
    qp = sub(c, a)
    if denom != 0:
        t, u = Fraction(cross(qp, s), denom), Fraction(cross(qp, r), denom)
        if 0 <= t <= 1 and 0 <= u <= 1:
            return [(a[0] + t * r[0], a[1] + t * r[1])]
        return []
    if r == (0, 0) and s == (0, 0):
        return [a] if a == c else []
    if r == (0, 0):
        return [a] if cross(sub(a, c), s) == 0 and min(c, d) <= a <= max(c, d) else []
    if s == (0, 0):
        return [c] if cross(sub(c, a), r) == 0 and min(a, b) <= c <= max(a, b) else []
    if cross(qp, r) != 0:
        return []
    lo, hi = max(min(a, b), min(c, d)), min(max(a, b), max(c, d))
    if lo > hi:
        return []
    return [lo] if lo == hi else [lo, hi]

def build_graph(segments):
    """Planar graph formed by the segments: returns (vertices, adjacency lists)."""
    ids, points, adj = {}, [], []

    def vertex(p):
        p = (Fraction(p[0]), Fraction(p[1]))
        if p not in ids:
            ids[p] = len(points)
            points.append(p)
            adj.append(set())
        return ids[p]

    for i, (a, b) in enumerate(segments):
        on_segment = {vertex(a), vertex(b)}
        for j, (c, d) in enumerate(segments):
            if i != j:
                on_segment.update(vertex(p) for p in segment_intersection(a, b, c, d))
        chain = sorted(on_segment, key=lambda v: points[v])
        for u, v in zip(chain, chain[1:]):
            adj[u].add(v)
            adj[v].add(u)
    return points, [sorted(a) for a in adj]

# a "#": two horizontal and two vertical segments enclose a central square
hash_sign = [((0, 1), (3, 1)), ((0, 2), (3, 2)), ((1, 0), (1, 3)), ((2, 0), (2, 3))]
pts, adj = build_graph(hash_sign)
assert len(pts) == 12 and sum(len(a) for a in adj) // 2 == 12
faces = find_faces(pts, adj)
assert len(faces) == 2                                                    # n - m + f = 2  ->  f = 2
assert signed_area2(pts, faces[1]) == 2 * 1                              # the central unit square
assert len(faces[1]) == 4

# an X: no inner face at all
pts, adj = build_graph([((0, 0), (2, 2)), ((0, 2), (2, 0))])
assert len(pts) == 5 and len(find_faces(pts, adj)) == 1

# crossing segments create a triangle: three lines in general position
pts, adj = build_graph([((0, 0), (6, 0)), ((0, 0), (3, 6)), ((6, 0), (3, 6))])
faces = find_faces(pts, adj)
assert len(faces) == 2 and signed_area2(pts, faces[1]) == 2 * 18
```

## Practice problems

- [TIMUS 1664 Pipeline Transportation](https://acm.timus.ru/problem.aspx?space=1&num=1664)
- [TIMUS 1681 Brother Bear's Garden](https://acm.timus.ru/problem.aspx?space=1&num=1681)
