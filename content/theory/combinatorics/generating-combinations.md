---
title: "Generating All k-Combinations"
section: Techniques
order: 4
difficulty: intermediate
summary: "List all k-subsets of {1..n} in lexicographic order with the next-combination step, and in a Gray-code order where neighbours differ by exchanging one element."
tags: [combinations, lexicographic order, gray code, generation, revolving door]
prerequisites: [math/gray-code, combinatorics/binomial-coefficients]
source:
  title: "Generating all K-combinations"
  url: https://cp-algorithms.com/combinatorics/generating_combinations.html
  license: CC BY-SA 4.0
---

A **$k$-combination** of $\{1, \dots, n\}$ is a subset with $k$ elements. There are $\binom{n}{k}$ of them; sometimes you need to visit all of them: brute-force search, testing, exhaustive verification of small cases.

> [!PYTHON]
> `itertools.combinations(range(1, n + 1), k)` already yields all $k$-combinations in lexicographic order, in C. Use it in solutions. The algorithms below show *how* to generate them and give control that `itertools` does not (a specific order, or stepping to the "next" combination from any given one).

## The next combination in lexicographic order

Represent a combination as a sorted list $a_1 < a_2 < \dots < a_k$. The lexicographically next one is obtained by increasing the **rightmost element that can still be increased** (element $a_i$ can grow if $a_i < n - k + i$, since the elements after it need room), and then resetting everything after it to the smallest possible values $a_i + 1, a_i + 2, \dots$

```python
def next_combination(a, n):
    """Next k-combination of {1..n} in lexicographic order, or None after the last one."""
    k = len(a)
    a = a[:]
    for i in range(k - 1, -1, -1):
        if a[i] < n - k + i + 1:
            a[i] += 1
            for j in range(i + 1, k):
                a[j] = a[j - 1] + 1
            return a
    return None

assert next_combination([1, 2, 3], 5) == [1, 2, 4]
assert next_combination([1, 2, 5], 5) == [1, 3, 4]
assert next_combination([3, 4, 5], 5) is None
assert next_combination([], 5) is None

def all_combinations(n, k):
    current = list(range(1, k + 1))
    result = []
    while current is not None:
        result.append(current)
        current = next_combination(current, n)
    return result

from itertools import combinations

for n in range(1, 9):
    for k in range(1, n + 1):
        assert all_combinations(n, k) == [list(c) for c in combinations(range(1, n + 1), k)]
```

Each step costs $O(k)$ in the worst case and the amortized cost per combination is $O(1)$ (the loop over the tail is short most of the time).

## Gray-code order: neighbours differ by one exchange

Sometimes it helps when consecutive combinations differ minimally, e.g. when a value maintained for the current subset can be updated in $O(1)$. A **Gray code for combinations** lists all $k$-subsets so that each one differs from the previous by removing one element and adding another (the *revolving door* order).

**Construction from the ordinary Gray code.** The binary [Gray code](/theory/math/gray-code) $G(i) = i \oplus (i \gg 1)$ visits all $n$-bit masks with neighbours differing in one bit. Keep only the masks with exactly $k$ set bits; the kept masks appear in an order in which consecutive ones differ in exactly two bits (one element out, one in).

```python
def gray_combinations(n, k):
    """All k-subsets of {0..n-1} as bitmasks, in revolving-door order."""
    masks = []
    for i in range(1 << n):
        g = i ^ (i >> 1)
        if bin(g).count("1") == k:
            masks.append(g)
    return masks

def to_set(mask):
    return {i for i in range(mask.bit_length()) if mask >> i & 1}

seq = gray_combinations(5, 2)
assert len(seq) == 10
assert all(bin(a ^ b).count("1") == 2 for a, b in zip(seq, seq[1:]))          # one element swapped each step
assert {frozenset(to_set(m)) for m in seq} == {frozenset(c) for c in combinations(range(5), 2)}
```

This costs $O(2^n)$ time regardless of $k$, which is wasteful when $k$ is small. A direct recursive definition avoids the filtering.

### Recursive definition (no wasted work)

Let $G(n, k)$ be the sequence of $k$-subsets of an $n$-set in revolving-door order. Then

$$
G(n, k) = G(n-1, k) \ \text{ followed by }\ \text{reverse}\big(G(n-1, k-1)\big) \text{ with the element } n \text{ added to each subset}
$$

(with $G(n, 0) = (\emptyset)$ and $G(n, n) = (\{1..n\})$). The reversal makes the last subset of the first block and the first of the second block differ by exactly one swap.

```python
def revolving_door(n, k):
    """k-subsets of {1..n} as tuples, consecutive ones differ by one exchange."""
    if k == 0:
        return [()]
    if k == n:
        return [tuple(range(1, n + 1))]
    first = revolving_door(n - 1, k)
    second = [s + (n,) for s in reversed(revolving_door(n - 1, k - 1))]
    return first + second

for n in range(1, 9):
    for k in range(0, n + 1):
        seq = revolving_door(n, k)
        assert len(seq) == len(set(seq)) == len(list(combinations(range(1, n + 1), k)))
        assert set(map(frozenset, seq)) == set(map(frozenset, combinations(range(1, n + 1), k)))
        for a, b in zip(seq, seq[1:]):
            assert len(set(a) - set(b)) == 1 and len(set(b) - set(a)) == 1      # exactly one element swapped
```

## Which order to use?

| Need | Use |
|------|-----|
| just iterate over subsets | `itertools.combinations` |
| the next subset after a given one, lexicographic | `next_combination` |
| cheap incremental updates between subsets | revolving door (Gray) order |
| $k$-subsets of a huge set, sampled uniformly | `random.sample`, not enumeration |

The same ideas generalize to **permutations** (next permutation in lexicographic order; Steinhaus-Johnson-Trotter for adjacent transpositions) and to **subsets** (binary counter or Gray code).

```python
def next_permutation(a):
    a = a[:]
    i = len(a) - 2
    while i >= 0 and a[i] >= a[i + 1]:
        i -= 1
    if i < 0:
        return None
    j = len(a) - 1
    while a[j] <= a[i]:
        j -= 1
    a[i], a[j] = a[j], a[i]
    a[i + 1:] = reversed(a[i + 1:])
    return a

perm, seen = [1, 2, 3, 4], []
while perm is not None:
    seen.append(tuple(perm))
    perm = next_permutation(perm)
from itertools import permutations
assert seen == list(permutations([1, 2, 3, 4]))
```
