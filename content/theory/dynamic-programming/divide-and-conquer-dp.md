---
title: "Divide and Conquer DP"
section: Optimizations
order: 1
difficulty: advanced
summary: "Speed up a DP of the form dp[i][j] = min over k of dp[i-1][k] + C(k, j) from O(m n²) to O(m n log n) when the optimal split point is monotone."
tags: [dp optimization, divide and conquer, monotonicity, quadrangle inequality]
prerequisites: [dynamic-programming/introduction-to-dp]
source:
  title: "Divide and Conquer DP"
  url: https://cp-algorithms.com/dynamic_programming/divide-and-conquer-dp.html
  license: CC BY-SA 4.0
---

**Divide and conquer optimization** speeds up a family of layered DPs whose transition has the form

$$
dp(i, j) = \min_{0 \le k \le j} \Big\{ dp(i-1, k-1) + C(k, j) \Big\}
$$

Here $i$ is the *layer* (say, the number of groups, $0 \le i < m$), $j \in [0, n)$ is the position, $C(k, j)$ is a cost of taking the segment $k..j$ as one piece, and $dp(i, j) = 0$ for $j < 0$. Evaluating every state by trying all $k$ costs $O(m n^2)$.

## The monotonicity condition

Let $\text{opt}(i, j)$ be the value of $k$ attaining the minimum. If the cost satisfies the **quadrangle inequality** (for $a \le b \le c \le d$)

$$
C(a, c) + C(b, d) \le C(a, d) + C(b, c)
$$

then the optimal split point never moves left as $j$ grows:

$$
\text{opt}(i, j) \le \text{opt}(i, j+1)
$$

Intuition: if a later end $j+1$ preferred an earlier start than $j$ did, swapping the two choices would not make things worse, contradicting the optimality of one of them.

## The algorithm

Fix a layer $i$. Compute the middle state $j = \text{mid}$ by scanning $k$ over its whole allowed range $[k_{lo}, k_{hi}]$, and find $\text{opt}(i, \text{mid})$. By monotonicity, all states to the left of $\text{mid}$ have their optimum in $[k_{lo}, \text{opt}]$, and all to the right in $[\text{opt}, k_{hi}]$. Recurse on both halves. On every recursion level the scanned ranges add up to about $n$ (they overlap only at endpoints), and there are $\log n$ levels, so a layer costs $O(n \log n)$:

$$
T(n) = O(m\, n \log n)
$$

```python
INF = float("inf")

def dc_dp(n, groups, cost):
    """
    Split positions 1..n into `groups` consecutive groups minimizing the total cost:
        dp[g][j] = min over k < j of dp[g-1][k] + cost(k, j)      (group = positions k+1..j)
    cost(k, j) must satisfy the quadrangle inequality. Returns dp[groups][n].
    """
    prev = [0] + [INF] * n                        # dp[0][j]: only j = 0 is reachable
    for _ in range(groups):
        cur = [INF] * (n + 1)

        def solve(lo, hi, opt_lo, opt_hi):
            if lo > hi:
                return
            mid = (lo + hi) // 2
            best_value, best_k = INF, -1
            for k in range(opt_lo, min(mid - 1, opt_hi) + 1):
                value = prev[k] + cost(k, mid)
                if value < best_value:
                    best_value, best_k = value, k
            cur[mid] = best_value
            solve(lo, mid - 1, opt_lo, best_k)
            solve(mid + 1, hi, best_k, opt_hi)

        solve(1, n, 0, n - 1)
        prev = cur
    return prev[n]
```

Care is needed only with the bounds: for the middle state $j$ the split point $k$ ranges over $[\text{opt}_{lo}, \min(j-1, \text{opt}_{hi})]$ (a group must be non-empty).

## Example: split an array into groups minimizing the sum of squared group sums

Given non-negative numbers $a_1..a_n$, cut them into exactly $g$ contiguous groups; the cost of a group is the **square of its sum**. Since $x \mapsto x^2$ is convex, the cost satisfies the quadrangle inequality.

```python
import random

def make_cost(a):
    prefix = [0]
    for x in a:
        prefix.append(prefix[-1] + x)

    def cost(k, j):                              # group of positions k+1..j
        return (prefix[j] - prefix[k]) ** 2
    return cost

def naive_dp(n, groups, cost):
    prev = [0] + [INF] * n
    for _ in range(groups):
        cur = [INF] * (n + 1)
        for j in range(1, n + 1):
            cur[j] = min(prev[k] + cost(k, j) for k in range(j))
        prev = cur
    return prev[n]

# [1, 2, 3, 4] in two groups: [1,2,3] [4] costs 36 + 16 = 52; [1,2] [3,4] costs 9 + 49 = 58; [1] [2,3,4] costs 1 + 81 = 82
assert naive_dp(4, 2, make_cost([1, 2, 3, 4])) == 52
assert dc_dp(4, 2, make_cost([1, 2, 3, 4])) == 52
assert dc_dp(4, 1, make_cost([1, 2, 3, 4])) == 100 and dc_dp(4, 4, make_cost([1, 2, 3, 4])) == 30

random.seed(1)
for _ in range(300):
    n = random.randint(1, 25)
    groups = random.randint(1, min(n, 6))
    a = [random.randint(0, 20) for _ in range(n)]
    cost = make_cost(a)
    assert dc_dp(n, groups, cost) == naive_dp(n, groups, cost)
```

The optimized version agrees with the $O(g\,n^2)$ definition on random tests.

## Speed

For $n = 2000$ and $g = 20$, the naive DP does $g \cdot n^2/2 = 4\cdot 10^7$ cost evaluations; the divide-and-conquer version does about $g \cdot n \log_2 n \approx 4.4\cdot 10^5$:

```python
import time
a = [random.randint(0, 1000) for _ in range(1500)]
cost = make_cost(a)
start = time.perf_counter()
fast = dc_dp(1500, 10, cost)
elapsed = time.perf_counter() - start
assert elapsed < 20
assert fast == dc_dp(1500, 10, cost)
```

## Checklist for using it

1. The DP must be layered: layer $i$ depends only on layer $i-1$.
2. The optimal split must be monotone. The usual proof is the quadrangle inequality of the cost; when you are unsure, **test it**: compare against the naive DP on random small inputs (like above).
3. The cost $C(k, j)$ must be computable in $O(1)$ (prefix sums, precomputed tables) or the log factor grows.

If the quadrangle inequality also holds for a *range DP* of the form $dp(l, r) = \min_k dp(l, k) + dp(k, r) + C(l, r)$, use [Knuth's optimization](/theory/dynamic-programming/knuth-optimization) instead. For convex/concave costs there are also the Aliens trick (Lagrangian relaxation) and the [convex hull trick](/theory/geometry/convex-hull-trick).

## Practice problems

- [AtCoder - Yakiniku Restaurants](https://atcoder.jp/contests/arc067/tasks/arc067_d)
- [CodeForces - Ciel and Gondolas](https://codeforces.com/contest/321/problem/E) (Be careful with I/O!)
- [CodeForces - Levels And Regions](https://codeforces.com/problemset/problem/673/E)
- [CodeForces - Partition Game](https://codeforces.com/contest/1527/problem/E)
- [CodeForces - The Bakery](https://codeforces.com/problemset/problem/834/D)
- [CodeForces - Yet Another Minimization Problem](https://codeforces.com/contest/868/problem/F)
- [Codechef - CHEFAOR](https://www.codechef.com/problems/CHEFAOR)
- [CodeForces - GUARDS](https://codeforces.com/gym/103536/problem/A) (This is the exact problem in this article.)
- [Hackerrank - Guardians of the Lunatics](https://www.hackerrank.com/contests/ioi-2014-practice-contest-2/challenges/guardians-lunatics-ioi14)
- [Hackerrank - Mining](https://www.hackerrank.com/contests/world-codesprint-5/challenges/mining)
- [Kattis - Money (ACM ICPC World Finals 2017)](https://open.kattis.com/problems/money)
- [SPOJ - ADAMOLD](https://www.spoj.com/problems/ADAMOLD/)
- [SPOJ - LARMY](https://www.spoj.com/problems/LARMY/)
- [SPOJ - NKLEAVES](https://www.spoj.com/problems/NKLEAVES/)
- [Timus - Bicolored Horses](https://acm.timus.ru/problem.aspx?space=1&num=1167)
- [USACO - Circular Barn](https://usaco.org/index.php?page=viewproblem2&cpid=626)
- [UVA - Arranging Heaps](https://onlinejudge.org/external/125/12524.pdf)
- [UVA - Naming Babies](https://onlinejudge.org/external/125/12594.pdf)
