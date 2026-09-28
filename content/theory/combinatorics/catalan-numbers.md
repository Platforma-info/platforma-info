---
title: "Catalan Numbers"
section: Fundamentals
order: 2
difficulty: intermediate
summary: "The sequence 1, 1, 2, 5, 14, 42, … that counts balanced brackets, binary trees, paths under a diagonal and many more objects."
tags: [catalan, brackets, binary trees, combinatorics]
prerequisites: [combinatorics/binomial-coefficients]
source:
  title: Catalan Numbers
  url: https://cp-algorithms.com/combinatorics/catalan-numbers.html
  license: CC BY-SA 4.0
---

The **Catalan numbers** $C_0, C_1, C_2, \dots = 1, 1, 2, 5, 14, 42, 132, 429, \dots$ count an astonishing number of different structures. If a counting problem's small answers look like $1, 2, 5, 14$, think "Catalan".

## What they count

$C_n$ is the number of

- **balanced bracket sequences** with $n$ pairs, like `(())` and `()()` for $n = 2$;
- **binary trees** with $n$ vertices (or full binary trees with $n+1$ leaves);
- **monotone lattice paths** from $(0, 0)$ to $(n, n)$ that never go above the diagonal;
- **ways to triangulate** a convex polygon with $n + 2$ sides;
- **ways to fully parenthesize** a product of $n + 1$ factors;
- **non-crossing** ways to pair up $2n$ points on a circle;
- **stack-sortable permutations** of $n$ elements.

## Formulas

**Recurrence.** Look at the first opening bracket in a balanced sequence: it is closed at some point, with a balanced sequence of $i$ pairs inside and a balanced sequence of $n - 1 - i$ pairs after it. So

$$
C_0 = 1, \qquad C_{n} = \sum_{i=0}^{n-1} C_i\, C_{n-1-i}
$$

**Closed form.**

$$
C_n = \frac{1}{n+1}\binom{2n}{n} = \binom{2n}{n} - \binom{2n}{n+1}
$$

```python
from math import comb

def catalan_rec(limit):
    c = [1]
    for n in range(1, limit + 1):
        c.append(sum(c[i] * c[n - 1 - i] for i in range(n)))
    return c

def catalan(n):
    return comb(2 * n, n) // (n + 1)

seq = catalan_rec(12)
assert seq[:8] == [1, 1, 2, 5, 14, 42, 132, 429]
assert seq == [catalan(n) for n in range(13)]
assert all(catalan(n) == comb(2 * n, n) - comb(2 * n, n + 1) for n in range(20))
assert catalan(30) == 3814986502092304
```

The recurrence takes $O(n^2)$ to produce all values. Each value from the closed form takes a few multiplications, or, in a single pass, use $C_{n+1} = C_n \cdot \frac{2(2n+1)}{n+2}$:

```python
def catalan_upto(limit):
    c = [1]
    for n in range(limit):
        c.append(c[-1] * 2 * (2 * n + 1) // (n + 2))
    return c

assert catalan_upto(30) == [catalan(n) for n in range(31)]
```

**Modulo a prime** use the binomial formula with precomputed factorials and the inverse of $n + 1$ (see [Binomial coefficients](/theory/combinatorics/binomial-coefficients)).

## Checking the claims by brute force

Balanced bracket sequences with $n$ pairs:

```python
from itertools import product

def balanced_count(n):
    count = 0
    for seq in product("()", repeat=2 * n):
        depth = 0
        for ch in seq:
            depth += 1 if ch == "(" else -1
            if depth < 0:
                break
        else:
            count += depth == 0
    return count

assert [balanced_count(n) for n in range(7)] == catalan_rec(6)
```

Lattice paths that stay on or below the diagonal:

```python
def paths_below_diagonal(n):
    ways = [[0] * (n + 1) for _ in range(n + 1)]       # ways[x][y]: paths to (x, y) with y <= x
    ways[0][0] = 1
    for x in range(n + 1):
        for y in range(min(x, n) + 1):
            if x == 0 and y == 0:
                continue
            ways[x][y] = (ways[x - 1][y] if x else 0) + (ways[x][y - 1] if y else 0)
    return ways[n][n]

assert [paths_below_diagonal(n) for n in range(9)] == catalan_rec(8)
```

Triangulations of a convex polygon with $n + 2$ vertices, by DP over the polygon's edges:

```python
def triangulations(sides):
    """Number of triangulations of a convex polygon with `sides` sides."""
    m = sides
    t = [[0] * m for _ in range(m)]                    # t[i][j]: polygon formed by vertices i..j
    for i in range(m - 1):
        t[i][i + 1] = 1
    for length in range(2, m):
        for i in range(m - length):
            j = i + length
            t[i][j] = sum(t[i][k] * t[k][j] for k in range(i + 1, j))
    return t[0][m - 1]

assert [triangulations(n + 2) for n in range(8)] == catalan_rec(7)
```

## Counting bracket sequences with a prefix already fixed

A frequent contest variation: some prefix is given, count the ways to complete it to a balanced sequence. Use the **reflection principle**: every path that touches the forbidden level $-1$ can be reflected (from its first touch onward), which gives a bijection between the bad paths and *all* paths from the mirrored starting point.

```python
def completions(prefix, total_pairs):
    """Number of balanced bracket sequences of length 2*total_pairs starting with `prefix`."""
    depth = 0
    for ch in prefix:
        depth += 1 if ch == "(" else -1
        if depth < 0:
            return 0
    r = 2 * total_pairs - len(prefix)                # steps left
    if r < depth or (r + depth) % 2:
        return 0
    closes = (r + depth) // 2                        # we must come down `depth` more than we go up
    # all arrangements, minus those touching -1: reflect the start across -1 (start at -depth-2)
    return comb(r, closes) - comb(r, closes + 1)

assert completions("", 3) == 5
assert completions("(", 3) == 5
assert completions("((", 3) == 3
assert completions(")", 3) == 0

def completions_brute(prefix, total_pairs):
    count = 0
    for tail in product("()", repeat=2 * total_pairs - len(prefix)):
        depth = 0
        ok = True
        for ch in prefix + "".join(tail):
            depth += 1 if ch == "(" else -1
            if depth < 0:
                ok = False
                break
        count += ok and depth == 0
    return count

for prefix in ["", "(", "()", "((", "(()", "()(", ")(", "(((", "(()("]:
    assert completions(prefix, 4) == completions_brute(prefix, 4)
```

## Practice problems

- [Codechef - PANSTACK](https://www.codechef.com/APRIL12/problems/PANSTACK/)
- [Spoj - Skyline](http://www.spoj.com/problems/SKYLINE/)
- [UVA - Safe Salutations](https://uva.onlinejudge.org/index.php?option=com_onlinejudge&Itemid=8&page=show_problem&problem=932)
- [Codeforces - How many trees?](http://codeforces.com/problemset/problem/9/D)
- [SPOJ - FUNPROB](http://www.spoj.com/problems/FUNPROB/)
- [LOJ - 1170 - Counting Perfect BST](http://lightoj.com/volume_showproblem.php?problem=1170)
- [UVA - 12887 - The Soldier's Dilemma](https://uva.onlinejudge.org/index.php?option=com_onlinejudge&Itemid=8&page=show_problem&problem=4752)
