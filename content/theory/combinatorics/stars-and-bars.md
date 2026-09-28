---
title: "Stars and Bars"
section: Techniques
order: 2
difficulty: intermediate
summary: "Count the ways to distribute identical items into distinct boxes, with lower and upper bounds."
tags: [stars and bars, compositions, counting, binomial]
prerequisites: [combinatorics/binomial-coefficients]
source:
  title: Stars and bars
  url: https://cp-algorithms.com/combinatorics/stars_and_bars.html
  license: CC BY-SA 4.0
---

**Stars and bars** counts the ways to split $n$ identical items (stars) into $k$ distinct boxes. It answers:

> How many integer solutions does $x_1 + x_2 + \dots + x_k = n$ have, if the $x_i$ must be non-negative?

## The theorem

Draw the $n$ items as stars in a row and separate the boxes with $k - 1$ bars. For example, with $n = 5$ and $k = 3$:

```text
★★|★★★|      ->  x = (2, 3, 0)
|★|★★★★      ->  x = (0, 1, 4)
```

Every arrangement of $n$ stars and $k - 1$ bars in a row of $n + k - 1$ positions corresponds to exactly one solution, and we choose which positions hold the bars:

$$
\binom{n + k - 1}{k - 1} = \binom{n + k - 1}{n}
$$

```python
from math import comb
from itertools import product

def count_nonneg(n, k):
    """Solutions of x1 + ... + xk = n with xi >= 0."""
    return comb(n + k - 1, k - 1)

def brute_nonneg(n, k):
    return sum(sum(x) == n for x in product(range(n + 1), repeat=k))

assert count_nonneg(5, 3) == 21
assert all(count_nonneg(n, k) == brute_nonneg(n, k) for n in range(8) for k in range(1, 5))
```

## Positive integers

If every $x_i \ge 1$, first give one item to each box: substitute $y_i = x_i - 1 \ge 0$. Then $\sum y_i = n - k$, and

$$
\binom{n - 1}{k - 1}
$$

(each of the $n - 1$ gaps between the $n$ stars may hold a bar; choose $k-1$ of them). These are the **compositions** of $n$ into $k$ parts.

```python
def count_positive(n, k):
    return comb(n - 1, k - 1) if n >= k else 0

def brute_positive(n, k):
    return sum(sum(x) == n for x in product(range(1, n + 1), repeat=k))

assert count_positive(5, 3) == 6                        # 1+1+3, 1+3+1, 3+1+1, 1+2+2, 2+1+2, 2+2+1
assert all(count_positive(n, k) == brute_positive(n, k) for n in range(1, 9) for k in range(1, 5))
```

## Lower bounds

If $x_i \ge l_i$, substitute $y_i = x_i - l_i \ge 0$. The new total is $n - \sum l_i$:

```python
def count_lower(n, lower):
    rest = n - sum(lower)
    return count_nonneg(rest, len(lower)) if rest >= 0 else 0

assert count_lower(10, [1, 2, 3]) == count_nonneg(4, 3)
assert count_lower(5, [3, 3]) == 0
```

## Upper bounds: inclusion-exclusion

For $x_i \le b_i$ count all non-negative solutions and remove those violating some bound. Violating bound $i$ means $x_i \ge b_i + 1$, which reduces to lower-bound counting; do this for each subset of violated variables with the [inclusion-exclusion principle](/theory/combinatorics/inclusion-exclusion):

$$
\#\{x : x_i \le b_i\} = \sum_{S \subseteq \{1..k\}} (-1)^{|S|} \binom{n - \sum_{i \in S}(b_i + 1) + k - 1}{k - 1}
$$

(terms with a negative top part are 0).

```python
def count_bounded(n, bounds):
    k = len(bounds)
    total = 0
    for mask in range(1 << k):
        removed = sum(b + 1 for i, b in enumerate(bounds) if mask >> i & 1)
        rest = n - removed
        if rest >= 0:
            total += (-1) ** bin(mask).count("1") * comb(rest + k - 1, k - 1)
    return total

def brute_bounded(n, bounds):
    return sum(sum(x) == n for x in product(*[range(b + 1) for b in bounds]))

assert count_bounded(6, [2, 3, 4]) == brute_bounded(6, [2, 3, 4])
import random
random.seed(2)
for _ in range(100):
    bounds = [random.randint(0, 5) for _ in range(random.randint(1, 4))]
    n = random.randint(0, 12)
    assert count_bounded(n, bounds) == brute_bounded(n, bounds)
```

A classic instance: the number of ways to roll $k$ dice with $d$ faces to get sum $s$ is `count_bounded(s - k, [d - 1] * k)`.

```python
assert count_bounded(7 - 2, [5, 5]) == 6                 # two 6-sided dice summing to 7
assert count_bounded(12 - 3, [5, 5, 5]) == 25            # three dice summing to 12
```

## Multisets

Choosing a multiset of size $r$ from $n$ kinds (repetition allowed, order irrelevant) is the same as $x_1 + \dots + x_n = r$ with $x_i \ge 0$:

$$
\left(\!\!\binom{n}{r}\!\!\right) = \binom{n + r - 1}{r}
$$

```python
from itertools import combinations_with_replacement

assert count_nonneg(4, 3) == len(list(combinations_with_replacement(range(3), 4)))
```

## Practice problems

- [Codeforces - Array](https://codeforces.com/contest/57/problem/C)
- [Codeforces - Kyoya and Coloured Balls](https://codeforces.com/problemset/problem/553/A)
- [Codeforces - Colorful Bricks](https://codeforces.com/contest/1081/problem/C)
- [Codeforces - Two Arrays](https://codeforces.com/problemset/problem/1288/C)
- [Codeforces - One-Dimensional Puzzle](https://codeforces.com/contest/1931/problem/G)
