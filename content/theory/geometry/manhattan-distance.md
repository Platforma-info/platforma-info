---
title: "Manhattan Distance: Farthest Pair, Rotation and MST"
section: Advanced topics
order: 4
difficulty: advanced
summary: "Tricks for the taxicab metric: the farthest pair by trying sign patterns, the 45° rotation to Chebyshev distance, and a Manhattan minimum spanning tree in O(n log n)."
tags: [geometry, manhattan distance, chebyshev, mst, sweep line]
prerequisites: [geometry/basic-geometry, graphs/kruskal-mst]
source:
  title: "Manhattan Distance"
  url: https://cp-algorithms.com/geometry/manhattan-distance.html
  license: CC BY-SA 4.0
---

## Definition

For points $p$ and $q$ in the plane, the **Manhattan (taxicab) distance** is

$$
d(p, q) = |x_p - x_q| + |y_p - y_q|
$$

It is the length of the shortest path in a city where you can only travel along horizontal and vertical streets. Many problems with this distance have neat tricks, collected here.

```python
def manhattan(p, q):
    return abs(p[0] - q[0]) + abs(p[1] - q[1])

assert manhattan((1, 2), (4, -2)) == 7
```

## Farthest pair of points

Given $n$ points, find the pair with the maximum Manhattan distance.

The key observation is that $|a| = \max(a, -a)$: if we guess the sign of each absolute value, wrong guesses only produce smaller values, so they never beat the true answer. In one dimension, $|x_p - x_q| = \max(x_p - x_q,\ x_q - x_p)$; fixing the sign pattern makes $p$ and $q$ *independent*:

$$
\max_{p, q}\big[(x_p + y_p) + (-x_q - y_q)\big] = \max_p (x_p + y_p) + \max_q(-x_q - y_q)
$$

So for each of the $2^d$ sign patterns in $d$ dimensions, compute the value $\sum \pm p_j$ for every point and take **max minus min**; the answer is the best over all patterns. Time: $O(n\cdot 2^d\cdot d)$.

```python
def farthest_pair_distance(points):
    d = len(points[0])
    best = 0
    for mask in range(1 << d):
        values = [sum(p[j] if mask >> j & 1 else -p[j] for j in range(d)) for p in points]
        best = max(best, max(values) - min(values))
    return best

import random

rnd = random.Random(1)
for d in (1, 2, 3, 4):
    for _ in range(200):
        pts = [tuple(rnd.randint(-20, 20) for _ in range(d)) for _ in range(rnd.randint(2, 12))]
        brute = max(sum(abs(a - b) for a, b in zip(p, q)) for p in pts for q in pts)
        assert farthest_pair_distance(pts) == brute
```

## Rotation to the Chebyshev distance

For all real $m, n$: $|m| + |n| = \max(|m + n|,\ |m - n|)$ (check the signs of $m$ and $n$). Applying it with $m = x_1 - x_2$, $n = y_1 - y_2$:

$$
d\big((x_1, y_1), (x_2, y_2)\big) = \max\big(\,|(x_1 + y_1) - (x_2 + y_2)|,\ |(y_1 - x_1) - (y_2 - x_2)|\,\big)
$$

The right side is the **Chebyshev distance** $\max(|\Delta x|, |\Delta y|)$ of the transformed points

$$
\alpha : (x, y) \mapsto (x + y,\ y - x)
$$

$\alpha$ is a rotation by $45^\circ$ with a dilation by $\sqrt2$. So a problem on Manhattan distances (diamonds as circles) can be converted into one on Chebyshev distances (squares as circles), which are usually simpler: the Manhattan "ball" around a point becomes an axis-aligned square.

```python
def chebyshev(p, q):
    return max(abs(p[0] - q[0]), abs(p[1] - q[1]))

def rotate45(p):
    return (p[0] + p[1], p[1] - p[0])

for _ in range(1000):
    p = (rnd.randint(-50, 50), rnd.randint(-50, 50))
    q = (rnd.randint(-50, 50), rnd.randint(-50, 50))
    assert manhattan(p, q) == chebyshev(rotate45(p), rotate45(q))
```

Example use: "count the points within Manhattan distance $r$ of a query" becomes a **rectangle query** on the rotated points.

```python
points = [(rnd.randint(-30, 30), rnd.randint(-30, 30)) for _ in range(300)]
rotated = [rotate45(p) for p in points]
center, r = (3, -4), 12
cx, cy = rotate45(center)
in_square = sum(1 for (x, y) in rotated if abs(x - cx) <= r and abs(y - cy) <= r)
assert in_square == sum(1 for p in points if manhattan(p, center) <= r)
```

## Manhattan minimum spanning tree

Given $n$ points (distinct), connect them with a minimum total edge weight, where the weight of an edge is the Manhattan distance. The complete graph has $O(n^2)$ edges, but we can restrict to $O(n)$ **candidate edges**.

**Claim.** For a point $s$ and any two other points $p, q$ in the same *octant* around $s$ (one of the 8 regions between the lines through $s$ with slopes $0$, $\infty$, $1$ and $-1$), we have $d(p, q) < \max(d(s, p), d(s, q))$. Hence, in a minimum spanning tree $s$ never needs to be connected to both, since replacing the longer edge by $(p,q)$ shortens the tree. So it suffices to consider, for every point, **its nearest neighbor in each of the 8 octants**: $8n$ candidate edges (and by symmetry, only 4 of the octants need to be searched, since an edge found from one end serves both).

### Nearest neighbor in one octant, by sweep

Consider the octant "north-north-east" of each point $s$: points $p$ with $x_p \ge x_s$ and $x_p - y_p < x_s - y_s$ (that is, $p$ is up and to the right of $s$, but closer to the vertical line through $s$ than to the diagonal). For such $p$ the distance is simply $(x_p + y_p) - (x_s + y_s)$.

Process the points by **non-decreasing $x + y$**. Maintain an *active set* of points that have not yet found their neighbor. When a new point $p$ arrives, every active $s$ with $p$ in its octant gets $p$ as its nearest neighbor in it: any later point has a bigger $x + y$, hence is farther. Those $s$ are removed from the active set, and $p$ is inserted.

The active set is ordered by $x$; its elements have increasing $x - y$ as well, so the points $s$ that need $p$ are **consecutive**: start at the one with the largest $x_s \le x_p$ and walk down while $x_p - y_p \le x_s - y_s$. Each point is removed once, so the sweep is $O(n\log n)$ in total. Rotating the input by $90^\circ$ (swap `x`, `y`; then negate `x`; ...) four times covers all the octants.

```python
from bisect import bisect_right

def manhattan_mst_edges(points):
    """Candidate edges (weight, u, v) that contain a Manhattan minimum spanning tree."""
    ps = [list(p) for p in points]
    ids = list(range(len(ps)))
    edges = []
    for rot in range(4):
        ids.sort(key=lambda i: ps[i][0] + ps[i][1])
        keys = []                                      # x-coordinates of the active points, sorted
        active = {}                                    # x -> point id
        for i in ids:
            xi, yi = ps[i]
            pos = bisect_right(keys, xi) - 1           # the largest active x <= x_i
            while pos >= 0:
                j = active[keys[pos]]
                if xi - yi > ps[j][0] - ps[j][1]:
                    break
                edges.append(((xi - ps[j][0]) + (yi - ps[j][1]), i, j))
                del active[keys[pos]]
                del keys[pos]
                pos -= 1
            if xi not in active:
                keys.insert(bisect_right(keys, xi), xi)
            active[xi] = i
        for p in ps:                                   # rotate the picture
            if rot & 1:
                p[0] = -p[0]
            else:
                p[0], p[1] = p[1], p[0]
    return edges
```

The list of candidate edges is fed to Kruskal's algorithm with a [disjoint set union](/theory/data-structures/disjoint-set-union):

```python
def kruskal(n, edges):
    parent = list(range(n))

    def find(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x

    total = 0
    for w, u, v in sorted(edges):
        ru, rv = find(u), find(v)
        if ru != rv:
            parent[ru] = rv
            total += w
    return total

def manhattan_mst(points):
    return kruskal(len(points), manhattan_mst_edges(points))

def prim_complete(points):
    """O(n^2) reference: Prim on the complete graph."""
    n = len(points)
    best = [float("inf")] * n
    used = [False] * n
    best[0] = 0
    total = 0
    for _ in range(n):
        u = min((i for i in range(n) if not used[i]), key=lambda i: best[i])
        used[u] = True
        total += best[u]
        for v in range(n):
            if not used[v]:
                best[v] = min(best[v], manhattan(points[u], points[v]))
    return total

assert manhattan_mst([(0, 0), (1, 0), (5, 0)]) == 5
assert manhattan_mst([(0, 0), (2, 2), (4, 0), (2, -2)]) == 12         # a diamond: 3 of its 4 sides of length 4

for _ in range(500):
    n = rnd.randint(1, 30)
    pts = list({(rnd.randint(0, 25), rnd.randint(0, 25)) for _ in range(n)})
    assert manhattan_mst(pts) == prim_complete(pts), pts
    assert len(manhattan_mst_edges(pts)) <= 4 * len(pts)
```

The number of candidate edges is at most $4n$ (each point contributes at most one edge per direction of the four sweeps), so Kruskal's sort dominates with $O(n\log n)$. The `pts` used above are deduplicated; the algorithm assumes distinct points (equal points can be merged first).

The algorithm follows Zhou, Shenoy and Nicholls (2002); Stolfi's divide-and-conquer finds the same nearest neighbors with the same complexity.

## Practice problems

- [AtCoder Beginner Contest 178E - Dist Max](https://atcoder.jp/contests/abc178/tasks/abc178_e)
- [CodeForces 1093G - Multidimensional Queries](https://codeforces.com/contest/1093/problem/G)
- [CodeForces 944F - Game with Tokens](https://codeforces.com/contest/944/problem/F)
- [AtCoder Code Festival 2017D - Four Coloring](https://atcoder.jp/contests/code-festival-2017-quala/tasks/code_festival_2017_quala_d)
- [The 2023 ICPC Asia EC Regionals Online Contest (I) - J. Minimum Manhattan Distance](https://codeforces.com/gym/104639/problem/J)
- [Petrozavodsk Winter Training Camp 2016 Contest 4 - B. Airports](https://codeforces.com/group/eqgxxTNwgd/contest/100959/attachments)
