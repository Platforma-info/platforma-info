---
title: "Binary Search"
section: Search
order: 1
difficulty: intermediate
summary: "Halve the search space at every step: sorted arrays, any monotone predicate, searching on the answer, real numbers and galloping."
tags: [binary search, bisect, monotone, search on answer]
prerequisites: [python-contests/heaps-deques-and-bisect]
source:
  title: Binary search
  url: https://cp-algorithms.com/num_methods/binary_search.html
  license: CC BY-SA 4.0
---

**Binary search** finds a target in a sorted collection by repeatedly comparing with the middle element and discarding the half that can't contain it. That takes $O(\log n)$ steps: a million elements need about 20 comparisons.

The real power is much wider: it works on **any monotone yes/no question**. Whenever the answers look like `NO NO NO YES YES YES`, binary search finds the boundary.

## Sorted arrays: lower and upper bound

For a sorted array `a` and a value `x`:

- the **lower bound** is the first index `i` with `a[i] >= x`;
- the **upper bound** is the first index `i` with `a[i] > x`.

Python provides both as `bisect.bisect_left` and `bisect.bisect_right` (see [Heaps, Deques and Bisect](/theory/python-contests/heaps-deques-and-bisect)). Writing it by hand once helps to understand the invariants:

```python
def lower_bound(a, x):
    lo, hi = 0, len(a)                # the answer is in [lo, hi]
    while lo < hi:
        mid = (lo + hi) // 2
        if a[mid] < x:
            lo = mid + 1              # mid is too small: the answer is to the right
        else:
            hi = mid                  # mid could be the answer: keep it
    return lo

from bisect import bisect_left, bisect_right

a = [1, 3, 3, 3, 7, 9]
assert lower_bound(a, 3) == 1 == bisect_left(a, 3)
assert lower_bound(a, 4) == 4 and lower_bound(a, 100) == 6 and lower_bound(a, -5) == 0
assert bisect_right(a, 3) - bisect_left(a, 3) == 3            # the count of 3s
```

**Invariant:** all positions before `lo` are known to be too small, all positions from `hi` on are known to be acceptable. The loop shrinks `hi - lo` every iteration, so it terminates.

## A general template for monotone predicates

Suppose `ok(i)` is `False` for a while and then `True` from some point on. Find the first `True`:

```python
def first_true(lo, hi, ok):
    """Smallest x in [lo, hi) with ok(x) True, or hi if none. ok must be monotone (False..False True..True)."""
    while lo < hi:
        mid = (lo + hi) // 2
        if ok(mid):
            hi = mid
        else:
            lo = mid + 1
    return lo

assert first_true(0, 100, lambda x: x * x >= 50) == 8
assert first_true(0, 10, lambda x: False) == 10
assert first_true(0, 10, lambda x: True) == 0
```

For "last `True`" (a predicate `True..True False..False`), search the first `False` and subtract one.

> [!WARNING]
> Common bugs: using `lo = mid` (instead of `mid + 1`) which loops forever when `hi = lo + 1`; using `while lo <= hi` with the half-open convention; and forgetting that the predicate must be monotone.

## Binary search on the answer

Many optimization problems ("minimize the maximum", "maximize the minimum") are hard to solve directly but easy to *check*: "is it possible to achieve value $v$?". If feasibility is monotone in $v$ (achievable for large $v$ implies achievable for larger ones), binary search over $v$ finds the optimum.

### Example: split an array into $k$ parts minimizing the largest sum

Given positive numbers, cut the array into at most $k$ contiguous pieces so that the **largest piece sum** is as small as possible. Check a candidate limit $L$ greedily: fill pieces as much as possible, count how many are needed.

```python
def min_max_partition(a, k):
    def feasible(limit):
        pieces, current = 1, 0
        for x in a:
            if x > limit:
                return False
            if current + x > limit:
                pieces += 1
                current = 0
            current += x
        return pieces <= k

    return first_true(max(a), sum(a) + 1, feasible)

assert min_max_partition([7, 2, 5, 10, 8], 2) == 18          # [7,2,5] [10,8]
assert min_max_partition([1, 2, 3, 4, 5], 1) == 15
assert min_max_partition([1, 2, 3, 4, 5], 5) == 5

from itertools import combinations
import random

def partition_brute(a, k):
    n = len(a)
    best = sum(a)
    for cuts in range(k):
        for pos in combinations(range(1, n), cuts):
            bounds = [0, *pos, n]
            best = min(best, max(sum(a[bounds[i]:bounds[i + 1]]) for i in range(len(bounds) - 1)))
    return best

random.seed(1)
for _ in range(200):
    a = [random.randint(1, 9) for _ in range(random.randint(1, 8))]
    k = random.randint(1, len(a))
    assert min_max_partition(a, k) == partition_brute(a, k)
```

The search range has size $\sum a$, so about $\log_2(\sum a)$ checks of $O(n)$ each: $O(n \log \sum a)$.

### Example: maximize the minimum distance

Place $k$ cows in stalls at given positions so that the **smallest distance** between two cows is as large as possible. Feasibility of distance $d$: place greedily left to right, taking a stall whenever it's at least $d$ from the last cow.

```python
def max_min_distance(positions, k):
    stalls = sorted(positions)

    def feasible(d):
        placed, last = 1, stalls[0]
        for p in stalls[1:]:
            if p - last >= d:
                placed += 1
                last = p
        return placed >= k

    # largest d with feasible(d): the first d that is NOT feasible, minus one
    return first_true(1, stalls[-1] - stalls[0] + 2, lambda d: not feasible(d)) - 1

assert max_min_distance([1, 2, 8, 4, 9], 3) == 3
assert max_min_distance([1, 2, 3], 2) == 2
```

### Example: integer square root

The predicate `x * x > n` is monotone:

```python
def isqrt_binary(n):
    return first_true(0, n + 2, lambda x: x * x > n) - 1

from math import isqrt
assert all(isqrt_binary(n) == isqrt(n) for n in range(2000))
assert isqrt_binary(10 ** 30) == isqrt(10 ** 30)
```

## Continuous search

For real-valued answers, binary search on floating-point numbers. A fixed number of iterations is more robust than comparing `hi - lo` to an epsilon (for huge or tiny values `mid` may equal `lo` and the loop would never end):

```python
def sqrt_binary(x, iterations=100):
    lo, hi = 0.0, max(1.0, x)
    for _ in range(iterations):
        mid = (lo + hi) / 2
        if mid * mid < x:
            lo = mid
        else:
            hi = mid
    return (lo + hi) / 2

assert abs(sqrt_binary(2) - 2 ** 0.5) < 1e-12
assert abs(sqrt_binary(1e-6) - 1e-3) < 1e-12
assert abs(sqrt_binary(1e12) - 1e6) < 1e-6
```

Each iteration halves the interval, so 100 iterations shrink any double-precision range to the limit of representability. The answer's precision is bounded by floating point precision, not by the number of iterations.

Applications: the time at which two moving objects meet, the largest radius satisfying a constraint, solving $f(x) = 0$ for a monotone $f$.

## Search with unknown bounds: powers of two

If there is no natural upper bound (for example "the first $x$ with `ok(x)`" where $x$ may be huge), first **double** the step until the predicate turns true, then binary search within the last interval ("galloping"):

```python
def gallop_first_true(ok):
    hi = 1
    while not ok(hi):
        hi *= 2
    lo = hi // 2                       # ok(lo) is False (or lo == 0)
    return first_true(lo, hi + 1, ok)

assert gallop_first_true(lambda x: x * x >= 10 ** 12) == 10 ** 6
assert gallop_first_true(lambda x: x >= 1) == 1
```

This takes $O(\log x)$ steps where $x$ is the answer, no matter how large the maximum is.

## Parallel binary search

When you have many independent binary searches over the same kind of predicate (one per query), and each check is expensive, you can run them **simultaneously**: in each of $\log$ rounds, process all queries' current midpoints together with a single sweep over the data structure. This turns $Q$ separate $O(\log)$-time searches with $O(T)$ checks into $\log$ rounds of one $O(T + Q)$ sweep. It's an advanced technique for problems like "for each query, find the first moment when some condition holds".

## Summary of pitfalls

| Pitfall | Fix |
|---------|-----|
| infinite loop | use `lo = mid + 1` / `hi = mid` with `while lo < hi` |
| predicate not monotone | rethink; search may give any answer |
| wrong boundary at the ends | test `n = 0, 1, 2` and all-true / all-false predicates |
| float loop never ends | iterate a fixed number of times |

## Practice problems

- [LeetCode - Find First and Last Position of Element in Sorted Array](https://leetcode.com/problems/find-first-and-last-position-of-element-in-sorted-array/)
- [LeetCode - Search Insert Position](https://leetcode.com/problems/search-insert-position/)
- [LeetCode - First Bad Version](https://leetcode.com/problems/first-bad-version/)
- [LeetCode - Valid Perfect Square](https://leetcode.com/problems/valid-perfect-square/)
- [LeetCode - Find Peak Element](https://leetcode.com/problems/find-peak-element/)
- [LeetCode - Search in Rotated Sorted Array](https://leetcode.com/problems/search-in-rotated-sorted-array/)
- [LeetCode - Find Right Interval](https://leetcode.com/problems/find-right-interval/)
- [Codeforces - Interesting Drink](https://codeforces.com/problemset/problem/706/B/)
- [Codeforces - Magic Powder - 1](https://codeforces.com/problemset/problem/670/D1)
- [Codeforces - Another Problem on Strings](https://codeforces.com/problemset/problem/165/C)
- [Codeforces - Frodo and pillows](https://codeforces.com/problemset/problem/760/B)
- [Codeforces - GukiZ hates Boxes](https://codeforces.com/problemset/problem/551/C)
- [Codeforces - Enduring Exodus](https://codeforces.com/problemset/problem/645/C)
- [Codeforces - Chip 'n Dale Rescue Rangers](https://codeforces.com/problemset/problem/590/B)
- [Codeforces - Points on Line](https://codeforces.com/problemset/problem/251/A)
- [Szkopul - Meteors](https://szkopul.edu.pl/problemset/problem/7JrCYZ7LhEK4nBR5zbAXpcmM/site/?key=statement)
- [AtCoder - Stamp Rally](https://atcoder.jp/contests/agc002/tasks/agc002_d)
