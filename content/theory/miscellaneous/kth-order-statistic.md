---
title: "K-th Order Statistic in O(N): Quickselect"
section: Sequences
order: 2
difficulty: intermediate
summary: "Find the k-th smallest element without sorting: partition around a random pivot and keep only the side that contains the answer, in expected O(N); with the deterministic median-of-medians variant."
tags: [quickselect, order statistic, median, partition, randomized algorithms]
prerequisites: [python-basics/lists-and-tuples]
source:
  title: "K-th order statistic in O(N)"
  url: https://cp-algorithms.com/sequences/k-th.html
  license: CC BY-SA 4.0
---

Given an array $A$ of $N$ numbers and an index $K$, find the **$K$-th order statistic**: the element that would be at position $K$ if the array were sorted. (The $K$-th *largest* is the $(N-K+1)$-th smallest.) Sorting solves it in $O(N\log N)$; **quickselect** does it in expected $O(N)$.

## Idea

Take the idea of quicksort. Choose a pivot, partition the array into elements smaller than, equal to, and larger than the pivot. If the $K$-th position falls in the "equal" part, the pivot is the answer; otherwise recurse only into the side that contains position $K$ (an iteration, in fact: we simply narrow the range). Unlike quicksort, we never touch the other side, so the expected total work is $N + N/2 + N/4 + \dots = O(N)$. (The proof of the average bound is harder than quicksort's; the worst case is $O(N^2)$ with unlucky pivots.)

A **three-way partition** (less than / equal / greater than the pivot) makes arrays with many equal elements safe: all elements equal to the pivot are settled at once.

## Implementation

```python
import random

def kth_smallest(a, k, rnd=random):
    """The element at index k (0-based) of the sorted array; expected O(N). Does not modify `a`."""
    a = list(a)
    lo, hi = 0, len(a) - 1
    while True:
        if lo == hi:
            return a[lo]
        pivot = a[rnd.randint(lo, hi)]
        lt, i, gt = lo, lo, hi                     # a[lo:lt] < pivot,  a[lt:i] == pivot,  a[gt+1:hi+1] > pivot
        while i <= gt:
            x = a[i]
            if x < pivot:
                a[lt], a[i] = a[i], a[lt]
                lt += 1
                i += 1
            elif x > pivot:
                a[i], a[gt] = a[gt], a[i]
                gt -= 1
            else:
                i += 1
        if k < lt:
            hi = lt - 1
        elif k > gt:
            lo = gt + 1
        else:
            return pivot

def kth_largest(a, k):
    return kth_smallest(a, len(a) - k)              # k = 1 is the maximum

assert kth_smallest([7, 1, 5, 3, 9, 2], 0) == 1
assert kth_smallest([7, 1, 5, 3, 9, 2], 2) == 3
assert kth_largest([7, 1, 5, 3, 9, 2], 1) == 9 and kth_largest([7, 1, 5, 3, 9, 2], 2) == 7
assert kth_smallest([4, 4, 4, 4], 2) == 4
```

The random pivot is what makes the running time robust against adversarial or already-sorted input; without it, a fixed pivot choice (the first element, say) degrades to quadratic time on sorted arrays.

## Testing

```python
rnd = random.Random(1)
for _ in range(500):
    n = rnd.randint(1, 60)
    a = [rnd.randint(-5, 5) for _ in range(n)]      # many duplicates
    original = a[:]
    for k in range(n):
        assert kth_smallest(a, k, rnd) == sorted(a)[k]
    assert a == original                             # the input is not modified
```

## How fast is it in Python?

`sorted` is implemented in C, so it has a huge constant-factor advantage over pure-Python code; still, the linear algorithm is competitive:

```python
import time

big = [rnd.randint(0, 10 ** 9) for _ in range(1_000_000)]
start = time.perf_counter()
median = kth_smallest(big, len(big) // 2, rnd)
quick_time = time.perf_counter() - start
start = time.perf_counter()
expected = sorted(big)[len(big) // 2]
sort_time = time.perf_counter() - start
assert median == expected
```

On a typical machine, for $10^6$ random integers quickselect takes about 0.25 s and `sorted` about 0.4 s: the linear algorithm is already a bit faster, and the gap widens with $N$. For $10^5$ elements they are about equal. In practice: use `sorted` for convenience when $N$ is small, `heapq.nsmallest`/`nlargest` when $K$ is small (they take $O(N\log K)$), and quickselect (or `numpy.partition`, which implements introselect in C) for large $N$.

## Deterministic linear time: median of medians

To guarantee $O(N)$ in the worst case, choose the pivot as the *median of medians*: split the array into groups of 5, take each group's median, and use the median of these medians (found recursively) as the pivot. Then at least about 30% of the elements are on each side of the pivot, so the recursion shrinks by a constant factor. The constant is large, and the randomized version is faster in practice, but it is the classic theoretical result (Blum, Floyd, Pratt, Rivest, Tarjan, 1973).

```python
def select_deterministic(a, k):
    """k-th smallest (0-based) in worst-case O(N) time."""
    a = list(a)
    if len(a) <= 5:
        return sorted(a)[k]
    medians = [sorted(a[i:i + 5])[len(a[i:i + 5]) // 2] for i in range(0, len(a), 5)]
    pivot = select_deterministic(medians, len(medians) // 2)
    less = [x for x in a if x < pivot]
    equal_count = sum(1 for x in a if x == pivot)
    if k < len(less):
        return select_deterministic(less, k)
    if k < len(less) + equal_count:
        return pivot
    greater = [x for x in a if x > pivot]
    return select_deterministic(greater, k - len(less) - equal_count)

for _ in range(300):
    n = rnd.randint(1, 80)
    a = [rnd.randint(-10, 10) for _ in range(n)]
    k = rnd.randrange(n)
    assert select_deterministic(a, k) == sorted(a)[k]
```

## Notes

- The $K$ smallest elements are exactly those smaller than the $K$-th, so finding all of them costs a linear extra pass.
- C++'s `std::nth_element` solves the same problem; the GCC implementation has an $O(N\log N)$ worst case.
- The **median** is the special case $K = \lfloor N/2\rfloor$; the "weighted median" and "median of a data stream" (two heaps) are related problems.

## Practice problems

- [Leetcode: Kth Largest Element in an Array](https://leetcode.com/problems/kth-largest-element-in-an-array/description/)
- [CODECHEF: Median](https://www.codechef.com/problems/CD1IT1)
