---
title: Longest Increasing Subsequence
section: Classic problems
order: 2
difficulty: intermediate
summary: Find the longest strictly increasing subsequence in O(n²) with DP and in O(n log n) with binary search, and restore the subsequence itself.
tags: [lis, dp, binary search, bisect]
prerequisites: [dynamic-programming/introduction-to-dp, python-contests/heaps-deques-and-bisect]
source:
  title: Longest increasing subsequence
  url: https://cp-algorithms.com/dynamic_programming/longest_increasing_subsequence.html
  license: CC BY-SA 4.0
---

Given an array $a$ of $n$ numbers, find a **subsequence** (elements in their original order, not necessarily adjacent) that is *strictly increasing* and as long as possible. For $[8, 3, 4, 6, 5, 2, 0, 7, 9, 1]$ one longest increasing subsequence is $3, 4, 6, 7, 9$ (length 5).

## $O(n^2)$ dynamic programming

Let `d[i]` be the length of the LIS **ending exactly at index** `i`. The previous element of such a subsequence is some `j < i` with `a[j] < a[i]`:

$$
d[i] = 1 + \max\{\, d[j] : j < i,\ a[j] < a[i] \,\} \qquad (\max \emptyset = 0)
$$

The answer is $\max_i d[i]$. To restore the sequence we also store the predecessor of each index:

```python
def lis_quadratic(a):
    n = len(a)
    if n == 0:
        return []
    d = [1] * n
    prev = [-1] * n
    for i in range(n):
        for j in range(i):
            if a[j] < a[i] and d[j] + 1 > d[i]:
                d[i] = d[j] + 1
                prev[i] = j
    best = max(range(n), key=d.__getitem__)
    seq = []
    while best != -1:
        seq.append(a[best])
        best = prev[best]
    return seq[::-1]

a = [8, 3, 4, 6, 5, 2, 0, 7, 9, 1]
assert len(lis_quadratic(a)) == 5
assert lis_quadratic([5, 4, 3]) in ([5], [4], [3])
assert lis_quadratic([]) == []
```

This is fine for $n \le 5000$ in Python, but too slow beyond.

## $O(n \log n)$ with binary search

Keep an array `tails` where `tails[k]` is the **smallest possible last element** of an increasing subsequence of length $k + 1$. This array is always sorted, so each new element $x$ either extends the longest subsequence (append) or improves one entry, found by binary search:

- find the first position `p` with `tails[p] >= x` (`bisect_left`, because the subsequence must be *strictly* increasing);
- if there is none, append $x$; otherwise set `tails[p] = x`.

The length of `tails` is the LIS length.

```python
from bisect import bisect_left

def lis_length(a):
    tails = []
    for x in a:
        p = bisect_left(tails, x)
        if p == len(tails):
            tails.append(x)
        else:
            tails[p] = x
    return len(tails)

assert lis_length([8, 3, 4, 6, 5, 2, 0, 7, 9, 1]) == 5
assert lis_length([]) == 0 and lis_length([1, 1, 1]) == 1
```

> [!NOTE]
> `tails` is **not** itself an increasing subsequence of the array; it only records the best endings. Restoring an actual subsequence needs extra bookkeeping.

### Restoring the subsequence

For each length we remember the index of the element currently at that position, and for every element the index of its predecessor (the last element of the length one shorter):

```python
def lis(a):
    """Return one longest strictly increasing subsequence in O(n log n)."""
    tails = []                 # tails[k] = smallest last value for length k + 1
    tail_idx = []              # index in `a` of that value
    prev = [-1] * len(a)
    for i, x in enumerate(a):
        p = bisect_left(tails, x)
        if p == len(tails):
            tails.append(x)
            tail_idx.append(i)
        else:
            tails[p] = x
            tail_idx[p] = i
        prev[i] = tail_idx[p - 1] if p else -1
    seq = []
    i = tail_idx[-1] if tail_idx else -1
    while i != -1:
        seq.append(a[i])
        i = prev[i]
    return seq[::-1]

result = lis([8, 3, 4, 6, 5, 2, 0, 7, 9, 1])
assert len(result) == 5 and result == sorted(set(result))
```

### Testing against the quadratic solution and brute force

```python
import random
from itertools import combinations

def is_subsequence(sub, a):
    it = iter(a)
    return all(x in it for x in sub)

def brute_length(a):
    for k in range(len(a), 0, -1):
        for c in combinations(a, k):
            if all(c[i] < c[i + 1] for i in range(k - 1)):
                return k
    return 0

random.seed(5)
for _ in range(300):
    a = [random.randint(0, 9) for _ in range(random.randint(0, 9))]
    r = lis(a)
    assert len(r) == lis_length(a) == len(lis_quadratic(a)) == brute_length(a)
    assert all(r[i] < r[i + 1] for i in range(len(r) - 1)) and is_subsequence(r, a)

big = [random.randint(0, 10 ** 9) for _ in range(200_000)]
assert lis_length(big) == len(lis(big))                     # handles 2·10^5 elements quickly
```

## Variations

**Non-decreasing subsequence** (equal elements allowed): use `bisect_right` instead of `bisect_left`, so that an equal element extends rather than replaces.

```python
from bisect import bisect_right

def longest_non_decreasing(a):
    tails = []
    for x in a:
        p = bisect_right(tails, x)
        if p == len(tails):
            tails.append(x)
        else:
            tails[p] = x
    return len(tails)

assert longest_non_decreasing([1, 1, 1]) == 3
assert longest_non_decreasing([3, 1, 2, 2, 5, 4]) == 4        # 1, 2, 2, 5 or 1, 2, 2, 4
```

**Longest decreasing subsequence**: negate the values (or reverse the array) and use the increasing version.

**Covering by non-increasing subsequences.** The smallest number of non-increasing subsequences needed to cover the whole array equals the length of the longest strictly increasing subsequence (Dilworth's theorem); symmetrically, covering by strictly decreasing subsequences needs as many as the longest non-decreasing one. This is why LIS appears in scheduling and "stack sorting" problems.

**Number of longest increasing subsequences**: extend the $O(n^2)$ DP with a counter `cnt[i]`, or use a Fenwick tree over values with pairs `(length, count)`.

```python
def count_lis(a):
    n = len(a)
    if n == 0:
        return 0
    d, cnt = [1] * n, [1] * n
    for i in range(n):
        for j in range(i):
            if a[j] < a[i]:
                if d[j] + 1 > d[i]:
                    d[i], cnt[i] = d[j] + 1, cnt[j]
                elif d[j] + 1 == d[i]:
                    cnt[i] += cnt[j]
    longest = max(d)
    return sum(c for length, c in zip(d, cnt) if length == longest)

assert count_lis([1, 3, 5, 4, 7]) == 2                        # 1,3,5,7 and 1,3,4,7
assert count_lis([2, 2, 2]) == 3
```

## Practice problems

- [ACMSGURU - "North-East"](http://codeforces.com/problemsets/acmsguru/problem/99999/521)
- [Codeforces - LCIS](http://codeforces.com/problemset/problem/10/D)
- [Codeforces - Tourist](http://codeforces.com/contest/76/problem/F)
- [SPOJ - DOSA](https://www.spoj.com/problems/DOSA/)
- [SPOJ - HMLIS](https://www.spoj.com/problems/HMLIS/)
- [SPOJ - ONEXLIS](https://www.spoj.com/problems/ONEXLIS/)
- [SPOJ - SUPPER](http://www.spoj.com/problems/SUPPER/)
- [Topcoder - AutoMarket](https://community.topcoder.com/stat?c=problem_statement&pm=3937&rd=6532)
- [Topcoder - BridgeArrangement](https://community.topcoder.com/stat?c=problem_statement&pm=2967&rd=5881)
- [Topcoder - IntegerSequence](https://community.topcoder.com/stat?c=problem_statement&pm=5922&rd=8075)
- [UVA - Back To Edit Distance](https://onlinejudge.org/external/127/12747.pdf)
- [UVA - Happy Birthday](https://onlinejudge.org/external/120/12002.pdf)
- [UVA - Tiling Up Blocks](https://onlinejudge.org/external/11/1196.pdf)
