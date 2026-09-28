---
title: "Enumerating Submasks of a Bitmask"
section: Bits
order: 2
difficulty: advanced
summary: "Visit all submasks of every mask in total 3ⁿ steps, and compute sums over subsets or supersets in O(n·2ⁿ)."
tags: [bitmask, submasks, sos dp, dp on subsets]
prerequisites: [math/bit-manipulation, dynamic-programming/introduction-to-dp]
source:
  title: "Enumerating submasks of a bitmask"
  url: https://cp-algorithms.com/algebra/all-submasks.html
  license: CC BY-SA 4.0
---

A subset of $\{0, \dots, n-1\}$ is stored as an $n$-bit **mask**. A *submask* $s$ of $m$ is a mask whose set bits are all set in $m$ (written $s \subseteq m$). DP over subsets often needs, for each mask $m$, to combine values of its submasks.

## Enumerating the submasks of one mask

Subtracting 1 from a submask flips its lowest set bit and sets all lower bits; AND-ing with $m$ throws away the bits that are not in $m$. Together, `(s - 1) & m` is the **next smaller submask**:

```python
def submasks(m):
    """All submasks of m in decreasing order, ending with 0."""
    s = m
    while True:
        yield s
        if s == 0:
            break
        s = (s - 1) & m

assert list(submasks(0b1011)) == [0b1011, 0b1010, 0b1001, 0b1000, 0b0011, 0b0010, 0b0001, 0b0000]
assert list(submasks(0)) == [0]
for m in range(256):
    subs = list(submasks(m))
    assert len(subs) == 2 ** bin(m).count("1") == len(set(subs))
    assert all(s & m == s for s in subs)
```

To visit the submasks in **increasing** order, iterate with `s = (s - m) & m` starting from 0 (adding "$-m$" walks upwards through the bits of $m$):

```python
def submasks_increasing(m):
    s = 0
    while True:
        yield s
        s = (s - m) & m
        if s == 0:
            break

assert list(submasks_increasing(0b1011)) == sorted(submasks(0b1011))
```

## Total cost: $3^n$

Iterating over the submasks of **every** mask of $n$ bits costs

$$
\sum_{m} 2^{|m|} = \sum_{k=0}^{n} \binom{n}{k} 2^k = 3^n
$$

by the binomial theorem (equivalently: each element is in neither, only $m$, or both $m$ and the submask: three choices). For $n = 15$ that's $1.4 \cdot 10^7$, the practical limit in Python.

```python
n = 8
total = sum(sum(1 for _ in submasks(m)) for m in range(1 << n))
assert total == 3 ** n
```

## Example: partitioning into groups

Given costs `cost[mask]` for serving a group, find the cheapest way to split all $n$ items into groups: `best[m] = min over submask s containing the lowest set bit of m: cost[s] + best[m ^ s]`. Fixing the lowest bit avoids counting each partition several times.

```python
import random

def min_partition_cost(n, cost):
    INF = float("inf")
    best = [INF] * (1 << n)
    best[0] = 0
    for m in range(1, 1 << n):
        low = m & -m
        for s in submasks(m):
            if s & low:
                best[m] = min(best[m], cost[s] + best[m ^ s])
    return best[(1 << n) - 1]

def brute(n, cost):
    # enumerate set partitions recursively
    def go(remaining):
        if remaining == 0:
            return 0
        low = remaining & -remaining
        return min(cost[s] + go(remaining ^ s) for s in submasks(remaining) if s & low)
    return go((1 << n) - 1)

random.seed(1)
for n in range(1, 8):
    cost = [0] + [random.randint(1, 20) for _ in range((1 << n) - 1)]
    assert min_partition_cost(n, cost) == brute(n, cost)
```

## Sum over subsets (SOS DP) in $O(n\,2^n)$

Sometimes you want, for every mask $m$, the sum of `f[s]` over **all** submasks $s \subseteq m$. Iterating submasks gives $3^n$; the "sum over subsets" DP does it in $n 2^n$: process one bit at a time; after handling bit $b$, `F[m]` is the sum over submasks that differ from $m$ only in bits $\le b$.

```python
def sum_over_subsets(f, n):
    F = list(f)
    for b in range(n):
        for m in range(1 << n):
            if m >> b & 1:
                F[m] += F[m ^ (1 << b)]
    return F

def sum_over_supersets(f, n):
    F = list(f)
    for b in range(n):
        for m in range(1 << n):
            if not m >> b & 1:
                F[m] += F[m | (1 << b)]
    return F

n = 6
f = [random.randint(0, 9) for _ in range(1 << n)]
F = sum_over_subsets(f, n)
G = sum_over_supersets(f, n)
for m in range(1 << n):
    assert F[m] == sum(f[s] for s in submasks(m))
    assert G[m] == sum(f[t] for t in range(1 << n) if t & m == m)
```

Replacing the `+=` by subtraction (in the opposite order of bits) inverts the transform (the Möbius transform on subsets), and combining the two gives fast **subset convolution** and inclusion-exclusion counts.

## Enumerating supermasks

The supermasks of $m$ are the submasks of the complement, flipped: `s = full ^ t` where `t` is a submask of `full ^ m`:

```python
def supermasks(m, n):
    full = (1 << n) - 1
    return [full ^ t for t in submasks(full ^ m)]

assert sorted(supermasks(0b0101, 4)) == [0b0101, 0b0111, 0b1101, 0b1111]
```

## Practice problems

- [Atcoder - Close Group](https://atcoder.jp/contests/abc187/tasks/abc187_f)
- [Codeforces - Nuclear Fusion](http://codeforces.com/problemset/problem/71/E)
- [Codeforces - Sandy and Nuts](http://codeforces.com/problemset/problem/599/E)
- [Uva 1439 - Exclusive Access 2](https://uva.onlinejudge.org/index.php?option=com_onlinejudge&Itemid=8&page=show_problem&problem=4185)
- [UVa 11825 - Hackers' Crackdown](https://uva.onlinejudge.org/index.php?option=com_onlinejudge&Itemid=8&page=show_problem&problem=2925)
