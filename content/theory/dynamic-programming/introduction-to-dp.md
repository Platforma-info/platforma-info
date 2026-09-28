---
title: "Introduction to Dynamic Programming"
section: Introduction
order: 1
difficulty: intermediate
summary: "Avoid repeated work by remembering subproblem results: memoization, bottom-up tables, and the recipe for designing a DP solution."
tags: [dp, memoization, tabulation, recursion]
prerequisites: [python-basics/recursion]
source:
  title: Introduction to Dynamic Programming
  url: https://cp-algorithms.com/dynamic_programming/intro-to-dp.html
  license: CC BY-SA 4.0
---

The essence of **dynamic programming** (DP) is to avoid repeated calculation. Many DP problems are naturally solved by recursion. When the same subproblem appears again and again, we save its answer in a lookup table the first time and reuse it afterwards.

## Starting point: Fibonacci

$f(n) = f(n-1) + f(n-2)$, with $f(0) = 0$ and $f(1) = 1$. The direct recursion:

```python
calls = 0

def fib(n):
    global calls
    calls += 1
    if n < 2:
        return n
    return fib(n - 1) + fib(n - 2)

assert fib(29) == 514229
assert calls == 1_664_079            # over 1.6 million calls for n = 29
```

Each call spawns two calls of almost the same size, so the running time is exponential, about $O(1.6^n)$. The waste is obvious: `fib(n-2)` is computed once directly and again inside `fib(n-1)`.

## Top-down: memoization

There are only $n + 1$ different subproblems: `fib(0)`, ..., `fib(n)`. Store each result in a table the first time; later calls return it in $O(1)$. The total time drops to $O(n)$.

```python
from functools import lru_cache

calls = 0

@lru_cache(maxsize=None)
def fib_memo(n):
    global calls
    calls += 1
    return n if n < 2 else fib_memo(n - 1) + fib_memo(n - 2)

assert fib_memo(29) == 514229
assert calls == 30                    # each of the 30 states computed exactly once
```

The decorator `functools.lru_cache` (or `functools.cache` in 3.9+) turns any function of hashable arguments into a memoized one. Writing the cache by hand is equally simple, and works when the state is something you build yourself:

```python
def fib_dict(n, memo={0: 0, 1: 1}):     # the mutable default is deliberate: it is the shared cache
    if n not in memo:
        memo[n] = fib_dict(n - 1) + fib_dict(n - 2)
    return memo[n]

assert fib_dict(50) == 12586269025
```

> [!WARNING]
> Top-down recursion in Python is limited by the recursion depth (about 1000 by default). `fib_memo(5000)` raises `RecursionError`. For a deep state graph, prefer the bottom-up style below.

## Bottom-up: tabulation

Bottom-up is the opposite direction. Start from the base cases and fill the table in an order where every value's dependencies are already known.

```python
def fib_table(n):
    f = [0] * (n + 2)
    f[1] = 1
    for i in range(2, n + 1):
        f[i] = f[i - 1] + f[i - 2]
    return f[n]

assert fib_table(50) == 12586269025
```

Only the last two values are ever needed, so the memory can drop from $O(n)$ to $O(1)$. This "rolling" optimization is common in DP:

```python
def fib_rolling(n):
    a, b = 0, 1
    for _ in range(n):
        a, b = b, a + b
    return a

assert fib_rolling(50) == 12586269025 == fib_table(50)
```

In Python bottom-up is usually **faster and safer** than recursion: no function-call overhead and no depth limit.

## The recipe

1. **State.** What parameters completely describe a subproblem? (`n`; a prefix length `i`; a pair `(i, j)`; a position and a remaining capacity.) The number of states times the cost per state gives the running time.
2. **Transition.** How does a state's answer follow from the answers of smaller states?
3. **Base cases.** The smallest states whose answer is known directly.
4. **Order.** An iteration order in which dependencies come first (or let recursion handle it).
5. **Answer.** Which state holds the final result?

## Classic examples

### Counting paths in a grid

Count the paths from the top-left to the bottom-right corner moving only right or down, avoiding blocked cells.

- state: `paths[i][j]` = number of ways to reach cell $(i, j)$;
- transition: `paths[i][j] = paths[i-1][j] + paths[i][j-1]` (0 if blocked).

```python
def grid_paths(grid):
    rows, cols = len(grid), len(grid[0])
    paths = [[0] * cols for _ in range(rows)]
    paths[0][0] = 1 if grid[0][0] == "." else 0
    for i in range(rows):
        for j in range(cols):
            if grid[i][j] == "#" or (i, j) == (0, 0):
                continue
            paths[i][j] = (paths[i - 1][j] if i else 0) + (paths[i][j - 1] if j else 0)
    return paths[-1][-1]

assert grid_paths(["...", "...", "..."]) == 6            # C(4, 2)
assert grid_paths(["...", ".#.", "..."]) == 2
assert grid_paths(["..#", "##.", "..."]) == 0
```

### Coin change

The minimum number of coins for an amount $x$: `best[x] = 1 + min(best[x - c] for c in coins)`.

```python
def min_coins(coins, amount):
    INF = float("inf")
    best = [0] + [INF] * amount
    for x in range(1, amount + 1):
        for c in coins:
            if c <= x and best[x - c] + 1 < best[x]:
                best[x] = best[x - c] + 1
    return best[amount] if best[amount] < INF else -1

def count_ways(coins, amount):
    ways = [1] + [0] * amount                            # ways[0] = 1: the empty set of coins
    for c in coins:                                      # outer loop over coins: order does not matter
        for x in range(c, amount + 1):
            ways[x] += ways[x - c]
    return ways[amount]

assert min_coins([1, 5, 10, 25], 63) == 6                # 25+25+10+1+1+1
assert min_coins([2], 3) == -1
assert min_coins([1, 3, 4], 6) == 2                      # 3+3 beats greedy 4+1+1
assert count_ways([1, 2, 5], 5) == 4                     # 5, 2+2+1, 2+1+1+1, 1+1+1+1+1
```

### Longest common subsequence (LCS)

`lcs[i][j]` is the length of the LCS of the first $i$ characters of $s$ and the first $j$ of $t$. If the last characters match they extend the LCS of the shorter prefixes; otherwise drop one character from either string.

$$
\text{lcs}[i][j] = \begin{cases}
\text{lcs}[i-1][j-1] + 1 & s_i = t_j \\
\max(\text{lcs}[i-1][j],\ \text{lcs}[i][j-1]) & \text{otherwise}
\end{cases}
$$

```python
def lcs(s, t):
    dp = [[0] * (len(t) + 1) for _ in range(len(s) + 1)]
    for i in range(1, len(s) + 1):
        for j in range(1, len(t) + 1):
            if s[i - 1] == t[j - 1]:
                dp[i][j] = dp[i - 1][j - 1] + 1
            else:
                dp[i][j] = max(dp[i - 1][j], dp[i][j - 1])
    # reconstruct one optimal subsequence
    i, j, out = len(s), len(t), []
    while i and j:
        if s[i - 1] == t[j - 1]:
            out.append(s[i - 1]); i -= 1; j -= 1
        elif dp[i - 1][j] >= dp[i][j - 1]:
            i -= 1
        else:
            j -= 1
    return dp[-1][-1], "".join(reversed(out))

assert lcs("AGGTAB", "GXTXAYB") == (4, "GTAB")
assert lcs("", "abc") == (0, "")
```

### Edit distance

The minimum number of insertions, deletions and replacements to turn $s$ into $t$:

```python
def edit_distance(s, t):
    prev = list(range(len(t) + 1))                        # row for the empty prefix of s
    for i in range(1, len(s) + 1):
        cur = [i] + [0] * len(t)
        for j in range(1, len(t) + 1):
            cost = 0 if s[i - 1] == t[j - 1] else 1
            cur[j] = min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost)
        prev = cur                                        # rolling rows: O(len(t)) memory
    return prev[-1]

assert edit_distance("kitten", "sitting") == 3
assert edit_distance("", "abc") == 3 and edit_distance("abc", "abc") == 0
```

Only the previous row is needed, so two lists are enough.

### Verifying against brute force

A DP is easy to get subtly wrong, so compare it to an exhaustive search on tiny inputs:

```python
from itertools import combinations
import random

def lcs_brute(s, t):
    for k in range(min(len(s), len(t)), -1, -1):
        subsequences = {"".join(c) for c in combinations(s, k)}
        if any(x in subsequences for x in {"".join(c) for c in combinations(t, k)}):
            return k

random.seed(0)
for _ in range(200):
    s = "".join(random.choice("ab") for _ in range(random.randint(0, 7)))
    t = "".join(random.choice("ab") for _ in range(random.randint(0, 7)))
    assert lcs(s, t)[0] == lcs_brute(s, t)
```

## More classic problems

The other well-known DP problems are: [0-1 knapsack](/theory/dynamic-programming/knapsack), subset sum, [longest increasing subsequence](/theory/dynamic-programming/longest-increasing-subsequence), longest path in a DAG, longest palindromic subsequence, rod cutting. Related techniques: bitmask DP, digit DP, and DP on trees.

The most important trick is to practice: solve many problems and notice the states.

## Practice problems

- [LeetCode - 1137. N-th Tribonacci Number](https://leetcode.com/problems/n-th-tribonacci-number/description/)
- [LeetCode - 118. Pascal's Triangle](https://leetcode.com/problems/pascals-triangle/description/)
- [LeetCode - 1025. Divisor Game](https://leetcode.com/problems/divisor-game/description/)
- [Codeforces - Vacations](https://codeforces.com/problemset/problem/699/C)
- [Codeforces - Hard problem](https://codeforces.com/problemset/problem/706/C)
- [Codeforces - Zuma](https://codeforces.com/problemset/problem/607/b)
- [LeetCode - 221. Maximal Square](https://leetcode.com/problems/maximal-square/description/)
- [LeetCode - 1039. Minimum Score Triangulation of Polygon](https://leetcode.com/problems/minimum-score-triangulation-of-polygon/description/)

## DP contests

- [AtCoder - Educational DP Contest](https://atcoder.jp/contests/dp/tasks)
- [CSES - Dynamic Programming](https://cses.fi/problemset/list/)
