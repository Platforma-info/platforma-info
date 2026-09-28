---
title: The Standard-Library Toolbox
section: Standard library toolbox
order: 1
difficulty: intermediate
summary: The built-ins and modules that replace pages of hand-written code: math, collections, itertools, functools, sorting.
tags: [stdlib, collections, itertools, math, functools]
prerequisites: [python-basics/comprehensions-and-functional-tools]
---

A big part of being fast in Python is *not writing code*: the standard library has tested, C-speed implementations of things you would otherwise code by hand.

## Built-in functions worth memorizing

```python
a = [3, 1, 4, 1, 5, 9, 2, 6]

assert sum(a) == 31 and min(a) == 1 and max(a) == 9
assert sorted(a) == [1, 1, 2, 3, 4, 5, 6, 9]
assert list(reversed(a))[0] == 6
assert abs(-5) == 5 and divmod(17, 5) == (3, 2) and pow(2, 10, 1000) == 24
assert min(a, key=lambda x: abs(x - 7)) == 6           # closest to 7
assert max("apple", "fig", key=len) == "apple"
assert list(enumerate("ab", 1)) == [(1, "a"), (2, "b")]
assert list(zip([1, 2], "xy")) == [(1, "x"), (2, "y")]
assert all([]) is True and any([]) is False
```

## `math`

```python
import math

assert math.gcd(84, 36) == 12
assert math.lcm(4, 6) == 12                     # Python 3.9+
assert math.isqrt(99) == 9                      # exact integer square root
assert math.comb(5, 2) == 10 and math.perm(5, 2) == 20
assert math.factorial(10) == 3628800
assert math.prod([1, 2, 3, 4]) == 24
assert math.floor(-2.5) == -3 and math.ceil(-2.5) == -2
assert math.isclose(0.1 + 0.2, 0.3)
assert math.inf > 10 ** 100
```

> [!TIP]
> Prefer `math.isqrt(n)` to `int(n ** 0.5)`: the float version can be off by one for large $n$.

```python
n = 10 ** 30
assert math.isqrt(n * n) == n
```

## `collections`

```python
from collections import Counter, defaultdict, deque, OrderedDict

# Counter: multiset / frequency table
c = Counter("abracadabra")
assert c["a"] == 5 and c["z"] == 0
assert c.most_common(2) == [("a", 5), ("b", 2)]
assert Counter("aab") - Counter("ab") == Counter("a")

# defaultdict: no KeyError, missing keys get a default
graph = defaultdict(list)
graph[1].append(2)
graph[2].append(1)
assert graph[3] == []

# deque: O(1) at both ends
q = deque([1, 2, 3])
q.appendleft(0); q.append(4)
assert q.popleft() == 0 and q.pop() == 4
q.rotate(1)
assert list(q) == [3, 1, 2]
```

More on `deque` and heaps in [Heaps, Deques and Bisect](/theory/python-contests/heaps-deques-and-bisect).

## `itertools`

```python
from itertools import (accumulate, chain, combinations, combinations_with_replacement,
                       permutations, product, groupby, islice, zip_longest)

assert list(accumulate([1, 2, 3, 4])) == [1, 3, 6, 10]                 # prefix sums
assert list(accumulate([3, 1, 4], max)) == [3, 3, 4]                   # running maximum
assert list(chain([1], [2, 3])) == [1, 2, 3]
assert len(list(combinations(range(5), 3))) == 10
assert list(permutations("ab")) == [("a", "b"), ("b", "a")]
assert list(product([0, 1], repeat=3))[5] == (1, 0, 1)                 # all bit patterns
assert [k for k, _ in groupby([1, 1, 2, 2, 2, 1])] == [1, 2, 1]        # consecutive runs
assert list(zip_longest([1, 2, 3], "ab", fillvalue="-")) == [(1, "a"), (2, "b"), (3, "-")]
```

`product`, `permutations` and `combinations` make brute-force and backtracking solutions short. They yield $n^k$, $n!$ and $\binom{n}{k}$ items, so mind the sizes.

## `functools`

```python
from functools import cache, lru_cache, reduce, cmp_to_key

@cache                                    # Python 3.9+: memoize without a size limit
def paths(r, c):
    if r == 0 or c == 0:
        return 1
    return paths(r - 1, c) + paths(r, c - 1)

assert paths(10, 10) == 184756

# custom ordering with a comparison function
def by_concat(a, b):                      # "largest number" ordering
    return -1 if a + b > b + a else 1

assert "".join(sorted(["3", "30", "34", "5", "9"], key=cmp_to_key(by_concat))) == "9534330"
```

## Sorting recipes

`sorted` is stable (equal keys keep their input order), runs in $O(n \log n)$ and takes a `key`.

```python
words = ["banana", "kiwi", "apple", "fig"]

assert sorted(words, key=lambda w: (len(w), w)) == ["fig", "kiwi", "apple", "banana"]
assert sorted(words, key=lambda w: (-len(w), w))[0] == "banana"

# sort indices instead of values
scores = [30, 10, 20]
order = sorted(range(len(scores)), key=scores.__getitem__)
assert order == [1, 2, 0]

# sort a list of pairs by second element, then first descending
pairs = [(1, 5), (2, 3), (3, 5)]
assert sorted(pairs, key=lambda p: (p[1], -p[0])) == [(2, 3), (3, 5), (1, 5)]
```

## Other handy modules

```python
from fractions import Fraction
from decimal import Decimal, getcontext
import random, string

assert Fraction(1, 3) + Fraction(1, 6) == Fraction(1, 2)          # exact rational arithmetic
getcontext().prec = 30
assert str(Decimal(1) / Decimal(7)).startswith("0.142857142857142857142857142")
assert random.Random(1).randint(1, 10) == random.Random(1).randint(1, 10)   # seeded: reproducible
assert string.ascii_lowercase[:3] == "abc"
```

## Exercises

1. Compute $\binom{50}{25} \bmod 10^9+7$ with `math.comb`.
2. Print the number of distinct anagrams of a word with `math.factorial` and `Counter`.
3. Group the words of a text by their sorted letters (anagram classes) using `defaultdict`.
4. Generate all subsets of a list using `product` or `combinations`.
