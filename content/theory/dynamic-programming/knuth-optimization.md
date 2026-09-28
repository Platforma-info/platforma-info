---
title: "Knuth's Optimization"
section: Optimizations
order: 2
difficulty: advanced
summary: "Speed up range DPs of the form dp[i][j] = min over k of dp[i][k] + dp[k][j] + C(i, j) from O(n³) to O(n²) by restricting the split point."
tags: [dp optimization, knuth, interval dp, quadrangle inequality, optimal bst]
prerequisites: [dynamic-programming/divide-and-conquer-dp]
source:
  title: "Knuth's Optimization"
  url: https://cp-algorithms.com/dynamic_programming/knuth-optimization.html
  license: CC BY-SA 4.0
---

**Knuth's optimization** (the Knuth-Yao speedup) applies to *interval DPs*, where the answer for a range is built from a split point:

$$
dp(i, j) = \min_{i \le k < j} \Big[ dp(i, k) + dp(k+1, j) + C(i, j) \Big]
$$

The straightforward evaluation costs $O(n^3)$: $O(n^2)$ ranges and $O(n)$ split points each. With Knuth's optimization it drops to $O(n^2)$.

## Conditions

Let $\text{opt}(i, j)$ be the (largest) split point achieving the minimum. If

$$
\text{opt}(i, j-1) \le \text{opt}(i, j) \le \text{opt}(i+1, j)
$$

then, to compute $dp(i, j)$, we only need to try $k$ between $\text{opt}(i, j-1)$ and $\text{opt}(i+1, j)$. The inequality holds when the cost $C$ satisfies, for all $a \le b \le c \le d$:

1. **Monotonicity on ranges:** $C(b, c) \le C(a, d)$ (a sub-range is not more expensive than the range containing it);
2. **Quadrangle inequality:** $C(a, c) + C(b, d) \le C(a, d) + C(b, c)$.

Typical costs that satisfy both: the sum of the elements in the range (`prefix[j] - prefix[i]`), the length of the range, and (with non-negative weights) the weight of the range in the optimal binary search tree problem.

## Why it is $O(n^2)$

Processing ranges by increasing length, the work for all ranges of length $L$ is

$$
\sum_{i} \big(\text{opt}(i+1, i+L) - \text{opt}(i, i+L-1) + 1\big)
$$

which **telescopes** to $O(n)$. Summing over the $n$ lengths gives $O(n^2)$.

## Implementation

The structure is exactly that of an ordinary range DP; only the loop over $k$ changes. Here the recurrence is written with half-open ranges: `dp[i][j]` for the block of items $i..j-1$, splitting at $k \in (i, j)$.

```python
INF = float("inf")

def knuth_dp(n, cost, base=lambda i: 0):
    """
    dp[i][j] (0 <= i < j <= n) = min over i < k < j of dp[i][k] + dp[k][j] + cost(i, j),
    with dp[i][i+1] = base(i). Returns dp[0][n].
    """
    dp = [[0] * (n + 1) for _ in range(n + 1)]
    opt = [[0] * (n + 1) for _ in range(n + 1)]
    for i in range(n):
        dp[i][i + 1] = base(i)
        opt[i][i + 1] = i
    for length in range(2, n + 1):
        for i in range(0, n - length + 1):
            j = i + length
            best, best_k = INF, -1
            for k in range(opt[i][j - 1], opt[i + 1][j] + 1):
                if i < k < j:
                    value = dp[i][k] + dp[k][j] + cost(i, j)
                    if value < best:
                        best, best_k = value, k
            dp[i][j] = best
            opt[i][j] = best_k
    return dp[0][n]

def cubic_dp(n, cost, base=lambda i: 0):
    dp = [[0] * (n + 1) for _ in range(n + 1)]
    for i in range(n):
        dp[i][i + 1] = base(i)
    for length in range(2, n + 1):
        for i in range(0, n - length + 1):
            j = i + length
            dp[i][j] = min(dp[i][k] + dp[k][j] + cost(i, j) for k in range(i + 1, j))
    return dp[0][n]
```

## Example: merging adjacent piles

There are $n$ piles of stones in a row. In one move, merge two adjacent piles; the cost is the total size of the new pile. What is the minimum total cost of merging everything into one pile? This is exactly the recurrence above with $C(i, j) = $ the sum of the piles $i..j-1$ (which is both range-monotone and quadrangle-inequality compliant for non-negative sizes).

```python
import random

def merge_cost(piles):
    prefix = [0]
    for x in piles:
        prefix.append(prefix[-1] + x)
    return lambda i, j: prefix[j] - prefix[i]

piles = [4, 1, 1, 4]
cost = merge_cost(piles)
# optimal order: merge the two 1s (cost 2), then 4 + 2 (cost 6), then 6 + 4 (cost 10): 2 + 6 + 10 = 18
assert cubic_dp(4, cost) == 18
assert knuth_dp(4, cost) == 18

random.seed(1)
for _ in range(500):
    n = random.randint(1, 18)
    piles = [random.randint(0, 30) for _ in range(n)]
    cost = merge_cost(piles)
    assert knuth_dp(n, cost) == cubic_dp(n, cost)
```

The optimized DP agrees with the cubic definition on random inputs.

## Example: optimal binary search tree

Given search frequencies $f_1 \le \dots$ for keys in sorted order, build the BST minimizing the expected search cost. If the root of the subtree over keys $i..j-1$ is key $k$, the two sides are optimal trees over $i..k-1$ and $k+1..j-1$ and every key moves one level deeper, adding the total frequency of the range:

```python
def optimal_bst(freq):
    n = len(freq)
    prefix = [0]
    for f in freq:
        prefix.append(prefix[-1] + f)
    # e[i][j]: minimal cost of a BST over keys i..j-1 (0 for the empty range)
    e = [[0] * (n + 1) for _ in range(n + 1)]
    root = [[0] * (n + 1) for _ in range(n + 1)]
    for i in range(n):
        e[i][i + 1] = freq[i]
        root[i][i + 1] = i
    for length in range(2, n + 1):
        for i in range(n - length + 1):
            j = i + length
            best, best_r = INF, -1
            lo, hi = root[i][j - 1], root[i + 1][j]           # Knuth: r between the neighbours' roots
            for r in range(lo, hi + 1):
                left = e[i][r]
                right = e[r + 1][j]
                value = left + right + prefix[j] - prefix[i]
                if value < best:
                    best, best_r = value, r
            e[i][j] = best
            root[i][j] = best_r
    return e[0][n]

def optimal_bst_cubic(freq):
    n = len(freq)
    prefix = [0]
    for f in freq:
        prefix.append(prefix[-1] + f)
    e = [[0] * (n + 1) for _ in range(n + 1)]
    for length in range(1, n + 1):
        for i in range(n - length + 1):
            j = i + length
            e[i][j] = min(e[i][r] + e[r + 1][j] for r in range(i, j)) + prefix[j] - prefix[i]
    return e[0][n]

assert optimal_bst([34, 8, 50]) == optimal_bst_cubic([34, 8, 50]) == 142
for _ in range(300):
    freq = [random.randint(1, 50) for _ in range(random.randint(1, 20))]
    assert optimal_bst(freq) == optimal_bst_cubic(freq)
```

## Using it safely

- The proof of the bounds requires the two conditions on $C$; if you are not sure, **test it against the cubic DP** on random data as above.
- Iterate ranges so that $dp(i, j-1)$ and $dp(i+1, j)$ are computed before $dp(i, j)$ (increasing length, or $i$ downwards and $j$ upwards).
- Take care of ties: use a consistent tie-breaking rule (always the first or always the last minimum), or the monotonicity of $\text{opt}$ can fail.
- The same idea also speeds up problems where the DP is over prefixes and pieces with an additional layer, the *Knuth-Yao* form of [divide and conquer optimization](/theory/dynamic-programming/divide-and-conquer-dp).

## Practice problems

- [UVA - Cutting Sticks](https://onlinejudge.org/external/100/10003.pdf)
- [UVA - Prefix Codes](https://onlinejudge.org/external/120/12057.pdf)
- [SPOJ - Breaking String](https://www.spoj.com/problems/BRKSTRNG/)
- [UVA - Optimal Binary Search Tree](https://onlinejudge.org/external/103/10304.pdf)
