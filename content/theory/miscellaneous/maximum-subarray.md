---
title: "Maximum Subarray Sum and Related Problems"
section: Sequences
order: 4
difficulty: intermediate
summary: "Find the contiguous block with the largest sum by prefix-minimum or Kadane's algorithm in O(n), then extend it: length constraints, the maximum submatrix, and the maximum average by binary search."
tags: [maximum subarray, kadane, prefix sums, binary search on answer, submatrix]
prerequisites: [python-basics/loops]
source:
  title: "Search the subarray with the maximum/minimum sum"
  url: https://cp-algorithms.com/others/maximum_average_segment.html
  license: CC BY-SA 4.0
---

Given an array $a[1..n]$ of numbers (of both signs), find a **subarray** $a[l..r]$ with the maximum sum:

$$
\max_{1\le l\le r\le n}\ \sum_{i=l}^{r} a[i]
$$

If all numbers were non-negative, the whole array would be the answer; the problem is interesting because there are negative numbers too. The *minimum* subarray is the same problem after negating all numbers.

## Algorithm 1: prefix sums and a running minimum

Let $s[i] = a[1] + \dots + a[i]$ with $s[0] = 0$. The sum of $a[l..r]$ is $s[r] - s[l-1]$. For a fixed $r$, the best $l$ is the one with the **smallest $s[l-1]$** among $l - 1 \in [0, r-1]$. So scan $r$ from left to right, keeping the minimum prefix sum seen so far. Time $O(n)$, and we don't even need to store $s$.

```python
def max_subarray_prefix(a):
    """Returns (best sum, l, r) with 0-based inclusive boundaries; the subarray is non-empty."""
    best, best_l, best_r = a[0], 0, 0
    total, min_prefix, min_pos = 0, 0, -1               # min_prefix = min of s[0..r-1], reached before index min_pos + 1
    for r, x in enumerate(a):
        total += x
        if total - min_prefix > best:
            best, best_l, best_r = total - min_prefix, min_pos + 1, r
        if total < min_prefix:
            min_prefix, min_pos = total, r
    return best, best_l, best_r

assert max_subarray_prefix([-2, 1, -3, 4, -1, 2, 1, -5, 4]) == (6, 3, 6)
assert max_subarray_prefix([-3, -1, -2]) == (-1, 1, 1)             # all negative: the least negative element
assert max_subarray_prefix([5]) == (5, 0, 0)
```

## Algorithm 2: Kadane's algorithm

J. Kadane (1984) proposed a shorter method. Keep the running sum $s$ of the subarray ending at the current position; **if $s$ becomes negative, reset it to zero**. The maximum of all values that $s$ takes is the answer.

*Why it works.* Consider the first moment when $s$ becomes negative: the prefix so far has a negative sum, and so does every suffix of it that is a prefix of the running sum, so this whole part can never help a longer subarray and is dropped. Every optimal subarray can be assumed to start right after such a reset: if it started at $l$ with the last reset position $p < l-1$, then $a[p+1..l-1]$ has a non-negative sum, so moving the left end to $p + 1$ does not decrease the sum.

```python
def kadane(a):
    best, best_l, best_r = a[0], 0, 0
    current, start = 0, 0
    for r, x in enumerate(a):
        if current < 0:
            current, start = 0, r                        # start a new subarray here
        current += x
        if current > best:
            best, best_l, best_r = current, start, r
    return best, best_l, best_r

assert kadane([-2, 1, -3, 4, -1, 2, 1, -5, 4]) == (6, 3, 6)
assert kadane([-3, -1, -2]) == (-1, 1, 1) and kadane([5]) == (5, 0, 0)
```

### Testing

Both against the $O(n^2)$ brute force, verifying that the reported boundaries really give the reported sum:

```python
import random

def brute(a):
    return max(sum(a[l:r + 1]) for l in range(len(a)) for r in range(l, len(a)))

rnd = random.Random(1)
for _ in range(1000):
    a = [rnd.randint(-9, 9) for _ in range(rnd.randint(1, 15))]
    for method in (max_subarray_prefix, kadane):
        best, l, r = method(a)
        assert best == brute(a) and sum(a[l:r + 1]) == best and 0 <= l <= r < len(a)
```

## Subarrays with length constraints

If the segment length must be at least $L$ (or within given limits), the same idea works: for a right end $r$ we want the smallest $s[l-1]$ with $l - 1 \le r - L$. As $r$ grows, the allowed set only grows, so a running minimum over the allowed prefix sums still works; for an upper limit on the length use a [monotonic deque](/theory/data-structures/minimum-stack-queue) (sliding-window minimum).

```python
def max_subarray_min_length(a, min_len):
    prefix = [0]
    for x in a:
        prefix.append(prefix[-1] + x)
    best, smallest = float("-inf"), float("inf")
    for r in range(min_len, len(a) + 1):                 # the segment a[l..r-1] with l <= r - min_len
        smallest = min(smallest, prefix[r - min_len])
        best = max(best, prefix[r] - smallest)
    return best

for _ in range(500):
    a = [rnd.randint(-9, 9) for _ in range(rnd.randint(1, 12))]
    L = rnd.randint(1, len(a))
    expected = max(sum(a[l:r + 1]) for l in range(len(a)) for r in range(l + L - 1, len(a)))
    assert max_subarray_min_length(a, L) == expected
```

## Two dimensions: the maximum submatrix

Find the rectangle with the largest sum in a matrix. Iterate over all pairs of rows $(l_1, r_1)$, sum each column between them to get a one-dimensional array, and apply the 1D algorithm: $O(n^3)$ for an $n\times n$ matrix (with the running sums updated incrementally as $r_1$ grows).

```python
def max_submatrix(matrix):
    rows, cols = len(matrix), len(matrix[0])
    best = float("-inf")
    for top in range(rows):
        column_sums = [0] * cols
        for bottom in range(top, rows):
            for c in range(cols):
                column_sums[c] += matrix[bottom][c]
            best = max(best, kadane(column_sums)[0])
    return best

def max_submatrix_brute(matrix):
    rows, cols = len(matrix), len(matrix[0])
    return max(sum(matrix[i][j] for i in range(a, b + 1) for j in range(c, d + 1))
               for a in range(rows) for b in range(a, rows) for c in range(cols) for d in range(c, cols))

for _ in range(200):
    r, c = rnd.randint(1, 5), rnd.randint(1, 5)
    m = [[rnd.randint(-9, 9) for _ in range(c)] for _ in range(r)]
    assert max_submatrix(m) == max_submatrix_brute(m)
```

Slightly faster algorithms exist (using fast min-plus matrix multiplication, they achieve $O\big(n^3 \tfrac{\log^3\log n}{\log^2 n}\big)$), but they are impractical.

## Maximum average

Find the subarray of length **at least $L$** with the maximum *average*. (Without a constraint the answer is just a single maximum element.) The standard technique for averages is a **binary search on the answer** $x$: does a subarray with average $\ge x$ exist? Subtract $x$ from each element: the question becomes whether there is a subarray with non-negative sum, which we can decide in $O(n)$ with prefix sums. This gives $O(n\log W)$ for precision $W$.

```python
def max_average(a, min_len, iterations=60):
    def exists(x):                                       # is there a segment of length >= min_len with average >= x?
        prefix = [0.0]
        for value in a:
            prefix.append(prefix[-1] + value - x)
        smallest = float("inf")
        for r in range(min_len, len(a) + 1):
            smallest = min(smallest, prefix[r - min_len])
            if prefix[r] - smallest >= 0:
                return True
        return False

    lo, hi = min(a), max(a)
    for _ in range(iterations):
        mid = (lo + hi) / 2
        if exists(mid):
            lo = mid
        else:
            hi = mid
    return lo

from fractions import Fraction

def max_average_brute(a, min_len):
    return max(Fraction(sum(a[l:r + 1]), r - l + 1) for l in range(len(a)) for r in range(l + min_len - 1, len(a)))

for _ in range(300):
    a = [rnd.randint(-9, 9) for _ in range(rnd.randint(1, 10))]
    L = rnd.randint(1, len(a))
    assert abs(max_average(a, L) - float(max_average_brute(a, L))) < 1e-9
```

## An online version

The problem where queries $(l, r)$ ask for the best-average subarray of length $\ge L$ *inside* a segment, online, has a much more complex solution (described on the Russian e-maxx forum by KADR); it is beyond the scope of this article.
