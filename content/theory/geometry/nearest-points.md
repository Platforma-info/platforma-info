---
title: "Closest Pair of Points"
section: Advanced topics
order: 1
difficulty: advanced
summary: "Find the two nearest points among n in O(n log n) by divide and conquer, and in expected O(n) with randomized grid algorithms."
tags: [geometry, closest pair, divide and conquer, randomized algorithms, grid hashing]
prerequisites: [geometry/basic-geometry, python-contests/heaps-deques-and-bisect]
source:
  title: "Finding the nearest pair of points"
  url: https://cp-algorithms.com/geometry/nearest_points.html
  license: CC BY-SA 4.0
---

Given $n$ points in the plane, find the two whose Euclidean distance is smallest. Checking all pairs takes $O(n^2)$; the algorithm of Shamos and Hoey (1975) does it in $O(n\log n)$, which is optimal in the decision-tree model. There are also simple randomized algorithms with expected linear time.

Throughout, we work with **squared distances** in integers to avoid square roots and rounding errors.

```python
def dist2(a, b):
    return (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2

def closest_pair_bruteforce(points):
    """O(n^2) reference: (squared distance, i, j)."""
    best = None
    for i in range(len(points)):
        for j in range(i + 1, len(points)):
            d = dist2(points[i], points[j])
            if best is None or d < best[0]:
                best = (d, i, j)
    return best
```

## Divide and conquer

Sort the points by $x$ (ties by $y$). Split the sorted list in the middle into $A_1$ and $A_2$, solve each half recursively and let $h = \min(h_1, h_2)$ be the better of the two answers. The only pairs we might still miss are those with one point in each half; both such points must be within distance $h$ of the dividing vertical line.

For this **strip** $B = \{p : |x_p - x_m| < h\}$, sort the points by $y$ and compare every point only with the previous points whose $y$ differs by less than $h$. Surprisingly, there are only $O(1)$ such points for each point:

**Why at most 7 comparisons.** The candidate points for $p_i$ lie in a $2h\times h$ rectangle. Split it into the two $h\times h$ squares belonging to the two halves. Inside each half any two points are at least $h$ apart, so each $h\times h$ square holds at most 4 points (dividing it into four $h/2$-squares, each with diagonal $h/\sqrt2 < h$, at most one point per sub-square). So at most $8$ points, one of which is $p_i$ itself.

To keep the merge step linear, the recursion returns its points **sorted by $y$**, like merge sort; the strip is then extracted in $y$ order without sorting again.

```python
def closest_pair(points):
    """Divide and conquer, O(n log n). Returns (squared distance, point a, point b)."""
    pts = sorted(points)                              # by x, then y
    best = [float("inf"), None, None]

    def update(a, b):
        d = dist2(a, b)
        if d < best[0]:
            best[0], best[1], best[2] = d, a, b

    def rec(lo, hi):                                  # solves pts[lo:hi] and leaves it sorted by y
        if hi - lo <= 3:
            for i in range(lo, hi):
                for j in range(i + 1, hi):
                    update(pts[i], pts[j])
            pts[lo:hi] = sorted(pts[lo:hi], key=lambda p: p[1])
            return
        mid = (lo + hi) // 2
        mid_x = pts[mid][0]
        rec(lo, mid)
        rec(mid, hi)
        pts[lo:hi] = sorted(pts[lo:hi], key=lambda p: p[1])      # merging two sorted runs: linear for Timsort
        strip = []
        for i in range(lo, hi):
            p = pts[i]
            if (p[0] - mid_x) ** 2 < best[0]:
                for q in reversed(strip):
                    if (p[1] - q[1]) ** 2 >= best[0]:
                        break
                    update(p, q)
                strip.append(p)

    rec(0, len(pts))
    return tuple(best)

assert closest_pair([(0, 0), (10, 10), (3, 4), (11, 12), (0, 5)])[0] == 5          # the closest pair is (10, 10)-(11, 12)
assert closest_pair([(0, 0), (3, 4)])[0] == 25
assert closest_pair([(1, 1), (5, 5), (1, 1)])[0] == 0                                # duplicates
```

Python's `sorted` (Timsort) detects that the slice consists of two already sorted runs and merges them in linear time, so the recursion has the intended $T(n) = 2T(n/2) + O(n)$ cost.

## Randomized algorithms with a grid

### Rabin / Lipton: sample, then use a grid

Cut the plane into squares of side $d$. If $d$ is at least the true minimum distance, then any pair of points at distance at most $d$ lies in the same or in *adjacent* squares, so it is enough to compare points in the same and neighbouring squares. The cost is $\Theta(\sum n_i^2)$ where $n_i$ are the numbers of points in the non-empty squares.

To choose $d$: sample $n$ random pairs and let $d$ be the smallest distance found. It can be shown that then $\mathbb E\big[\sum n_i^2\big] \le 16n$, so the whole algorithm is expected linear. Duplicated points must be handled first (with a hash set), because a grid with $d = 0$ is meaningless.

```python
import math
import random
from collections import defaultdict

def closest_pair_grid(points, seed=1):
    """Expected O(n): sample a distance, bucket the points in a grid, compare neighbouring cells."""
    n = len(points)
    assert n >= 2
    seen = {}
    for i, p in enumerate(points):
        if p in seen:
            return 0, points[seen[p]], p                 # a duplicate is a pair at distance 0
        seen[p] = i

    rnd = random.Random(seed)
    best = [dist2(points[0], points[1]), points[0], points[1]]

    def consider(a, b):
        d = dist2(a, b)
        if d < best[0]:
            best[0], best[1], best[2] = d, a, b

    for _ in range(n):
        i, j = rnd.sample(range(n), 2)
        consider(points[i], points[j])

    d = math.isqrt(best[0]) + 1                          # a cell side that is >= the sampled distance
    grid = defaultdict(list)
    for p in points:
        grid[(p[0] // d, p[1] // d)].append(p)
    for (cx, cy), cell in grid.items():
        for i in range(len(cell)):
            for j in range(i + 1, len(cell)):
                consider(cell[i], cell[j])
        for dx, dy in ((1, -1), (1, 0), (1, 1), (0, 1)):     # each pair of neighbouring cells once
            other = grid.get((cx + dx, cy + dy))
            if other:
                for p in cell:
                    for q in other:
                        consider(p, q)
    return tuple(best)
```

### Incremental with a shrinking grid

A different algorithm is easier to analyze. Shuffle the points; let $\delta$ be the distance of the first two. Keep the points seen so far in a grid of side about $\delta/2$. Insert points one at a time: look at the $5\times5$ block of cells around the new point (any point closer than $\delta$ must be within two cells). If a closer point is found, $\delta$ decreases and we **rebuild** the grid from the first $i$ points; otherwise just insert the point.

The rebuild happens at step $i$ only if $p_i$ belongs to the closest pair of the first $i$ points, which for a random order has probability at most $2/i$; a rebuild costs $O(i)$, so the total expected cost is $\sum_i i\cdot\frac 2i = O(n)$.

```python
def closest_pair_incremental(points, seed=1):
    """Expected O(n) by inserting points in random order into a grid that is rebuilt when the minimum improves."""
    pts = list(points)
    random.Random(seed).shuffle(pts)
    best = [dist2(pts[0], pts[1]), pts[0], pts[1]]

    def cell_size():
        r = math.isqrt(best[0])
        if r * r < best[0]:
            r += 1                                       # r = ceil(sqrt(best))
        return max(1, (r + 1) // 2)                      # >= delta / 2, so neighbours are within 2 cells

    def build(count):
        size = cell_size()
        grid = defaultdict(list)
        for p in pts[:count]:
            grid[(p[0] // size, p[1] // size)].append(p)
        return size, grid

    size, grid = build(2)
    for i in range(2, len(pts)):
        p = pts[i]
        if best[0] == 0:
            break
        cx, cy = p[0] // size, p[1] // size
        found = None
        for gx in range(cx - 2, cx + 3):
            for gy in range(cy - 2, cy + 3):
                for q in grid.get((gx, gy), ()):
                    d = dist2(p, q)
                    if d < best[0] and (found is None or d < found[0]):
                        found = (d, p, q)
        if found:
            best[:] = found
            size, grid = build(i + 1)                    # the minimum shrank: rebuild with the points so far
        else:
            grid[(cx, cy)].append(p)
    return tuple(best)
```

## Testing

All three algorithms must report the same squared distance as the brute force, and the returned points must be at that distance:

```python
rnd = random.Random(5)
for _ in range(1500):
    n = rnd.randint(2, 40)
    r = rnd.choice([5, 20, 1000])
    pts = [(rnd.randint(-r, r), rnd.randint(-r, r)) for _ in range(n)]
    expected = closest_pair_bruteforce(pts)[0]
    for solver in (closest_pair, closest_pair_grid, closest_pair_incremental):
        d, a, b = solver(pts)
        assert d == expected == dist2(a, b), (solver.__name__, pts)
        assert a in pts and b in pts
```

On a larger input only the fast algorithms are practical (the quadratic reference would need 200 million distance computations); the three independent algorithms must agree:

```python
import time

big = [(rnd.randint(0, 10 ** 7), rnd.randint(0, 10 ** 7)) for _ in range(20_000)]
start = time.perf_counter()
d, a, b = closest_pair(big)
elapsed = time.perf_counter() - start
assert d == closest_pair_grid(big)[0] == closest_pair_incremental(big)[0]
assert elapsed < 10
```

## Generalization: the triangle with minimum perimeter

The same divide-and-conquer applies to finding three points with the smallest sum of pairwise distances. After solving both halves, let $minper$ be the best perimeter found; in a triangle of perimeter at most $minper$ the longest side is at most $minper/2$, so take the strip of width $minper/2$ and check the triangles inside it that can improve the answer.

## Practice problems

- [UVA 10245 "The Closest Pair Problem" [difficulty: low]](https://uva.onlinejudge.org/index.php?option=onlinejudge&page=show_problem&problem=1186)
- [SPOJ #8725 CLOPPAIR "Closest Point Pair" [difficulty: low]](https://www.spoj.com/problems/CLOPPAIR/)
- [CODEFORCES Team Olympiad Saratov - 2011 "Minimum amount" [difficulty: medium]](http://codeforces.com/contest/120/problem/J)
- [Google CodeJam 2009 Final "Min Perimeter" [difficulty: medium]](https://github.com/google/coding-competitions-archive/blob/main/codejam/2009/world_finals/min_perimeter/statement.pdf)
- [SPOJ #7029 CLOSEST "Closest Triple" [difficulty: medium]](https://www.spoj.com/problems/CLOSEST/)
- [TIMUS 1514 National Park [difficulty: medium]](https://acm.timus.ru/problem.aspx?space=1&num=1514)
