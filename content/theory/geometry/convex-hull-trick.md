---
title: "Convex Hull Trick and Li Chao Tree"
section: Convex hull
order: 2
difficulty: advanced
summary: "Speed up DPs of the form min over j of (k_j·x + b_j) with a convex hull of lines or a Li Chao tree, going from O(n²) to O(n log n)."
tags: [geometry, convex hull trick, li chao tree, dp optimization, lines]
prerequisites: [geometry/convex-hull, dynamic-programming/introduction-to-dp]
source:
  title: "Convex hull trick and Li Chao tree"
  url: https://cp-algorithms.com/geometry/convex_hull_trick.html
  license: CC BY-SA 4.0
---

Consider this problem. There are $n$ cities on a line at coordinates $x_1 < x_2 < \dots < x_n$. You drive from city $1$ to city $n$. A liter of gasoline costs $cost_k$ in city $k$ and you burn one liter per kilometer, starting with an empty tank. Entering city $k$ costs a toll $toll_k$. Minimize the total cost.

The DP is easy:

$$
dp_i = toll_i + \min_{j<i}\big(cost_j\,(x_i - x_j) + dp_j\big)
$$

which is $O(n^2)$. But look at the inner expression: for a fixed $j$, it is the **linear function** $cost_j\cdot x + (dp_j - cost_j x_j)$ evaluated at $x = x_i$. So the DP amounts to two operations on a set of lines:

1. **add** a line $y = kx + b$;
2. **query** the minimum value at a point $x$ over all lines added so far.

We show two ways to do it: the **convex hull trick** and the **Li Chao tree**.

```python
# the plain O(n^2) DP: the reference against which we test the fast versions
def cheapest_trip_slow(x, cost, toll):
    n = len(x)
    dp = [0] * n
    for i in range(1, n):
        dp[i] = toll[i] + min(cost[j] * (x[i] - x[j]) + dp[j] for j in range(i))
    return dp

assert cheapest_trip_slow([0, 1, 3], [5, 2, 0], [0, 0, 0]) == [0, 5, 9]
```

## Convex hull trick

Treat a line $y = kx + b$ as the **point** $(k, b)$. The value at $x$ is the dot product of $(k, b)$ with the query vector $(x, 1)$. Minimizing a dot product over a set of points is attained on the **lower convex hull** of the points, so we keep only that hull, together with the normals of its edges. For a query $(x, 1)$ we look for the edge normal that is closest to it in angle; an endpoint of that edge is the optimal line.

This works nicely when the lines are added in monotone order of slope $k$ (or offline: add everything, then answer). Suppose $k$ only **increases** and we look for **minimums**:

- **Add** $(k, b)$: the new point must turn counter-clockwise from the last edge. While the dot product of the last normal (which points into the hull) with the vector from the last hull point to the new point is negative, delete the last point and edge.
- **Query** $x$: find the first normal that is not counter-clockwise of $(x, 1)$ by binary search (normals are sorted by angle); the left endpoint of that edge is the answer.

```python
def dot(a, b):
    return a[0] * b[0] + a[1] * b[1]

def cross(a, b):
    return a[0] * b[1] - a[1] * b[0]

class MonotoneCHT:
    """Minimum of k*x + b over lines added with strictly increasing k."""

    def __init__(self):
        self.hull = []          # points (k, b)
        self.vecs = []          # inward normals of the hull edges

    def add_line(self, k, b):
        new = (k, b)
        while self.vecs and dot(self.vecs[-1], (new[0] - self.hull[-1][0], new[1] - self.hull[-1][1])) < 0:
            self.hull.pop()
            self.vecs.pop()
        if self.hull:
            d = (new[0] - self.hull[-1][0], new[1] - self.hull[-1][1])
            self.vecs.append((-d[1], d[0]))                  # rotate the edge by 90 degrees
        self.hull.append(new)

    def query(self, x):
        q = (x, 1)
        lo, hi = 0, len(self.vecs)
        while lo < hi:                                        # first normal with cross(normal, q) <= 0
            mid = (lo + hi) // 2
            if cross(self.vecs[mid], q) > 0:
                lo = mid + 1
            else:
                hi = mid
        return dot(q, self.hull[lo])

cht = MonotoneCHT()
for k, b in [(-3, 10), (-1, 4), (0, 2), (2, 1), (5, -6)]:
    cht.add_line(k, b)
assert cht.query(0) == min(b for k, b in [(-3, 10), (-1, 4), (0, 2), (2, 1), (5, -6)])
```

Let us check it against a brute-force minimum with random lines and queries:

```python
import random

rnd = random.Random(1)
for _ in range(500):
    slopes = sorted(rnd.sample(range(-30, 30), rnd.randint(1, 12)))
    lines = [(k, rnd.randint(-50, 50)) for k in slopes]
    cht = MonotoneCHT()
    for k, b in lines:
        cht.add_line(k, b)
    for x in range(-40, 41):
        assert cht.query(x) == min(k * x + b for k, b in lines), (lines, x)
```

Every point of the hull is added and deleted at most once, and queries are a binary search: $O(n \log n)$ in total. (If queries are also monotone, a moving pointer makes the whole thing $O(n)$.)

For the trip DP the slopes $cost_j$ are **not** monotone in general, so this version does not apply directly. That's where the Li Chao tree comes in.

**Note:** if lines arrive online in arbitrary order, maintaining the exact hull needs an ordered set. A simple alternative is *square-root decomposition*: rebuild the hull from scratch every $\sqrt n$ insertions and scan the few recent lines by brute force at query time.

## Li Chao tree

Assume every two functions intersect at most once (lines do). A **Li Chao tree** is a segment tree over the query coordinates $x$ where each vertex stores one function, such that for every leaf $x$, the best function at $x$ is stored *somewhere on the path from the root to the leaf*.

**Adding a function** $f_{new}$ at a vertex responsible for $[l, r)$ that currently holds $f_{old}$, with midpoint $m$:

- The function that is lower at the midpoint $m$ stays in the vertex.
- The other one can be better only on one side of $m$: compare the two functions at $l$ to decide which side. Pass it recursively down to that half.

Each insertion goes down one path: $O(\log C)$, where $C$ is the size of the $x$ range. **A query** at $x$ takes the minimum over the functions on the path from the root to $x$'s leaf.

```python
INF = float("inf")

class LiChaoTree:
    """Minimum of lines k*x + b over integer x in [lo, hi). Lines can be added in any order."""

    def __init__(self, lo, hi):
        self.lo, self.hi = lo, hi
        self.tree = {}                                    # vertex id -> (k, b); missing = no line yet

    @staticmethod
    def _f(line, x):
        return line[0] * x + line[1]

    def add_line(self, k, b):
        node, l, r = 1, self.lo, self.hi
        new = (k, b)
        while True:
            cur = self.tree.get(node)
            if cur is None:
                self.tree[node] = new
                return
            m = (l + r) // 2
            left_better = self._f(new, l) < self._f(cur, l)
            mid_better = self._f(new, m) < self._f(cur, m)
            if mid_better:
                self.tree[node], new = new, cur          # keep the line that is lower at the midpoint
            if r - l == 1:
                return
            if left_better != mid_better:                # the lines cross in the left half
                node, r = 2 * node, m
            else:
                node, l = 2 * node + 1, m

    def query(self, x):
        node, l, r = 1, self.lo, self.hi
        best = INF
        while True:
            cur = self.tree.get(node)
            if cur is None:                              # nothing was ever pushed below an empty vertex
                return best
            best = min(best, self._f(cur, x))
            if r - l == 1:
                return best
            m = (l + r) // 2
            if x < m:
                node, r = 2 * node, m
            else:
                node, l = 2 * node + 1, m

tree = LiChaoTree(-50, 51)
lines = [(2, 1), (-3, 10), (0, 2), (5, -6), (-1, 4)]        # in any order
for k, b in lines:
    tree.add_line(k, b)
for x in range(-50, 51):
    assert tree.query(x) == min(k * x + b for k, b in lines)
assert LiChaoTree(0, 10).query(3) == INF                       # no lines yet
```

Randomized test, with lines in arbitrary order and interleaved queries:

```python
rnd = random.Random(2)
for _ in range(300):
    tree = LiChaoTree(-30, 31)
    lines = []
    for _ in range(rnd.randint(1, 15)):
        line = (rnd.randint(-20, 20), rnd.randint(-100, 100))
        lines.append(line)
        tree.add_line(*line)
        x = rnd.randint(-30, 30)
        assert tree.query(x) == min(k * x + b for k, b in lines)
```

Only the *range* of $x$ is fixed in advance, not the lines. For a huge integer range of $x$ (say $10^{18}$) the dictionary-based vertices keep the tree sparse: memory is proportional to the number of lines, and the depth is $O(\log C)$.

### Solving the trip problem

Each city $j$ contributes the line $y = cost_j\cdot x + (dp_j - cost_j x_j)$; the query for city $i$ is at $x_i$. The queries $x_i$ are increasing but the slopes are arbitrary, so we use the Li Chao tree:

```python
def cheapest_trip_fast(x, cost, toll):
    n = len(x)
    tree = LiChaoTree(x[0], x[-1] + 1)
    dp = [0] * n
    tree.add_line(cost[0], dp[0] - cost[0] * x[0])
    for i in range(1, n):
        dp[i] = toll[i] + tree.query(x[i])
        tree.add_line(cost[i], dp[i] - cost[i] * x[i])
    return dp

assert cheapest_trip_fast([0, 1, 3], [5, 2, 0], [0, 0, 0]) == [0, 5, 9]

for _ in range(300):
    n = rnd.randint(2, 30)
    xs = sorted(rnd.sample(range(0, 200), n))
    cost = [rnd.randint(1, 50) for _ in range(n)]
    toll = [rnd.randint(0, 100) for _ in range(n)]
    assert cheapest_trip_fast(xs, cost, toll) == cheapest_trip_slow(xs, cost, toll)
```

With $n = 10^5$ cities the tree version finishes in a couple of seconds of pure Python, whereas the $O(n^2)$ DP would need about $5\cdot10^9$ inner steps (hours):

```python
import time

n = 100_000
xs = list(range(0, 10 * n, 10))
cost = [rnd.randint(1, 10 ** 6) for _ in range(n)]
toll = [rnd.randint(0, 10 ** 6) for _ in range(n)]
start = time.perf_counter()
dp = cheapest_trip_fast(xs, cost, toll)
assert time.perf_counter() - start < 20
assert dp[-1] > 0
```

## Comparison

| | Convex hull trick | Li Chao tree |
|--|-------------------|--------------|
| Lines added | in order of slope (or offline) | in any order |
| Queries | any order (binary search) or monotone (pointer) | any order |
| Time | $O(\log n)$ per query, $O(1)$ amortized per insert | $O(\log C)$ for both |
| Extras | needs hull geometry | also handles **segments** (add a segment on $[l, r]$ in $O(\log^2 C)$) and other functions that cross at most once |

## Practice

Use it whenever a DP has the form $dp_i = \min_j (\text{something}(j)\cdot \text{something}(i) + \text{something else}(j))$: the product of a term of $j$ and a term of $i$ is the giveaway.

## Practice problems

- [Codebreaker - TROUBLES](https://codeforces.com/gym/103536/problem/B) (simple application of Convex Hull Trick after a couple of observations)
- [CS Academy - Squared Ends](https://csacademy.com/contest/archive/task/squared-ends)
- [Codeforces - Escape Through Leaf](http://codeforces.com/contest/932/problem/F)
- [CodeChef - Polynomials](https://www.codechef.com/NOV17/problems/POLY)
- [Codeforces - Kalila and Dimna in the Logging Industry](https://codeforces.com/problemset/problem/319/C)
- [Codeforces - Product Sum](https://codeforces.com/problemset/problem/631/E)
- [Codeforces - Bear and Bowling 4](https://codeforces.com/problemset/problem/660/F)
- [APIO 2010 - Commando](https://dmoj.ca/problem/apio10p1)
