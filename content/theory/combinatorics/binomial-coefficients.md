---
title: "Binomial Coefficients"
section: Fundamentals
order: 1
difficulty: intermediate
summary: "Count subsets with C(n, k): Pascal's triangle, exact big-integer formulas, and O(1) queries modulo a prime with precomputed factorials."
tags: [binomial, combinations, pascal, modular arithmetic]
prerequisites: [math/modular-inverse]
source:
  title: Binomial Coefficients
  url: https://cp-algorithms.com/combinatorics/binomial-coefficients.html
  license: CC BY-SA 4.0
---

The **binomial coefficient** $\binom{n}{k}$ is the number of ways to choose $k$ elements out of $n$ when the order doesn't matter. It also is the coefficient of $x^k$ in $(1 + x)^n$, hence the name.

$$
\binom{n}{k} = \frac{n!}{k!\,(n-k)!}
$$

with $\binom{n}{k} = 0$ for $k < 0$ or $k > n$.

## Properties

- **Symmetry**: $\binom{n}{k} = \binom{n}{n-k}$ (choosing the elements to take is the same as choosing those to leave).
- **Pascal's rule**: $\binom{n}{k} = \binom{n-1}{k-1} + \binom{n-1}{k}$ (the first element is either taken or not).
- **Row sum**: $\sum_k \binom{n}{k} = 2^n$ (the number of subsets).
- **Hockey stick**: $\sum_{i=k}^{n} \binom{i}{k} = \binom{n+1}{k+1}$.
- **Vandermonde**: $\sum_k \binom{m}{k}\binom{n}{r-k} = \binom{m+n}{r}$.
- $\binom{n}{k} = \frac{n}{k}\binom{n-1}{k-1}$.

```python
from math import comb, factorial

assert comb(5, 2) == 10 == factorial(5) // (factorial(2) * factorial(3))
assert comb(10, 3) == comb(10, 7)
assert comb(10, 4) == comb(9, 3) + comb(9, 4)
assert sum(comb(8, k) for k in range(9)) == 2 ** 8
assert sum(comb(i, 3) for i in range(3, 10)) == comb(10, 4)
assert sum(comb(4, k) * comb(5, 6 - k) for k in range(7)) == comb(9, 6)
assert comb(5, 7) == 0
```

## Calculation

### Exact values

Python's `math.comb(n, k)` (Python 3.8+) returns the exact value, however large. For your own implementation, multiply and divide alternately and keep the integer exact at every step:

```python
def binom(n, k):
    if k < 0 or k > n:
        return 0
    k = min(k, n - k)                     # use symmetry: fewer steps
    result = 1
    for i in range(1, k + 1):
        result = result * (n - k + i) // i        # the result after step i is C(n-k+i, i): always an integer
    return result

assert binom(5, 2) == 10 and binom(0, 0) == 1 and binom(52, 5) == 2_598_960
assert all(binom(n, k) == (comb(n, k) if 0 <= k <= n else 0) for n in range(30) for k in range(-1, n + 2))
```

Because the partial products $\binom{n-k+i}{i}$ are integers, the divisions are exact. This takes $O(k)$.

### Pascal's triangle

To get **all** values up to $n$ (for small $n$), build the triangle row by row using Pascal's rule, in $O(n^2)$:

```python
def pascal(n):
    rows = [[1]]
    for i in range(1, n + 1):
        prev = rows[-1]
        rows.append([1] + [prev[j] + prev[j + 1] for j in range(i - 1)] + [1])
    return rows

tri = pascal(6)
assert tri[4] == [1, 4, 6, 4, 1]
assert tri[6] == [1, 6, 15, 20, 15, 6, 1]
assert all(tri[n][k] == comb(n, k) for n in range(7) for k in range(n + 1))
```

## Modulo a prime in $O(1)$ per query

Counting problems ask for the answer modulo a prime $p$ (often $10^9 + 7$ or $998244353$). Precompute the factorials $n!$ and the **inverse factorials** $(n!)^{-1}$ once, using the [modular inverse](/theory/math/modular-inverse); then each $\binom{n}{k} = n!\cdot (k!)^{-1}\cdot ((n-k)!)^{-1} \bmod p$ costs two multiplications.

```python
MOD = 1_000_000_007

class Binomial:
    def __init__(self, limit, mod=MOD):
        self.mod = mod
        self.fact = [1] * (limit + 1)
        for i in range(1, limit + 1):
            self.fact[i] = self.fact[i - 1] * i % mod
        self.inv_fact = [1] * (limit + 1)
        self.inv_fact[limit] = pow(self.fact[limit], mod - 2, mod)
        for i in range(limit, 0, -1):                       # (i-1)!^-1 = i * i!^-1
            self.inv_fact[i - 1] = self.inv_fact[i] * i % mod

    def C(self, n, k):
        if k < 0 or k > n:
            return 0
        return self.fact[n] * self.inv_fact[k] % self.mod * self.inv_fact[n - k] % self.mod

B = Binomial(100_000)
assert B.C(5, 2) == 10
assert B.C(100_000, 50_000) == comb(100_000, 50_000) % MOD
assert B.C(10, 11) == 0
```

Only **one** modular exponentiation is needed (for the top factorial); the inverse factorials for smaller arguments follow by multiplying up.

This requires $n < p$; otherwise $n!$ is divisible by $p$ and has no inverse.

### Lucas' theorem: large $n$, small prime

When $p$ is a small prime but $n$ and $k$ can be huge, write both in base $p$: $n = \sum n_i p^i$, $k = \sum k_i p^i$. Then

$$
\binom{n}{k} \equiv \prod_i \binom{n_i}{k_i} \pmod p
$$

(and if any $k_i > n_i$ the coefficient is $0$ modulo $p$).

```python
def lucas(n, k, p):
    """C(n, k) mod a small prime p, for arbitrarily large n and k."""
    small = [1] * p
    for i in range(1, p):
        small[i] = small[i - 1] * i % p
    inv = [pow(f, p - 2, p) for f in small]
    result = 1
    while n or k:
        ni, ki = n % p, k % p
        if ki > ni:
            return 0
        result = result * small[ni] * inv[ki] * inv[ni - ki] % p
        n //= p
        k //= p
    return result

assert lucas(10, 3, 7) == comb(10, 3) % 7
assert all(lucas(n, k, 5) == comb(n, k) % 5 for n in range(60) for k in range(n + 1))
assert lucas(1000, 300, 13) == comb(1000, 300) % 13          # checked against the exact value
assert lucas(10 ** 18, 10 ** 9, 13) in range(13)              # astronomically large n: still instant
```

## Modulo a composite number

If the modulus is composite: factor it into prime powers and combine the residues with the [Chinese Remainder Theorem](/theory/math/chinese-remainder-theorem). For a prime power $p^e$ one needs a generalization of Lucas (Granville's theorem). In Python it's often simpler to compute the exact `math.comb(n, k) % m` when $n$ is up to a few tens of thousands.

## Which method?

| Situation | Use |
|-----------|-----|
| one value, exact | `math.comb(n, k)` |
| many values, $n \le 10^6$, modulo a big prime | factorials + inverse factorials |
| $n \le 5000$, all values | Pascal's triangle (works for any modulus) |
| huge $n$, small prime modulus | Lucas' theorem |

## Practice problems

- [Codechef - Number of ways](https://www.codechef.com/LTIME24/problems/NWAYS/)
- [Codeforces - Curious Array](http://codeforces.com/problemset/problem/407/C)
- [LightOj - Necklaces](http://www.lightoj.com/volume_showproblem.php?problem=1419)
- [HACKEREARTH: Binomial Coefficient](https://www.hackerearth.com/problem/algorithm/binomial-coefficient-1/description/)
- [SPOJ - Ada and Teams](http://www.spoj.com/problems/ADATEAMS/)
- [SPOJ - Greedy Walking](http://www.spoj.com/problems/UCV2013E/)
- [UVa 13214 - The Robot's Grid](https://uva.onlinejudge.org/index.php?option=com_onlinejudge&Itemid=8&page=show_problem&problem=5137)
- [SPOJ - Good Predictions](http://www.spoj.com/problems/GOODB/)
- [SPOJ - Card Game](http://www.spoj.com/problems/HC12/)
- [SPOJ - Topper Rama Rao](http://www.spoj.com/problems/HLP_RAMS/)
- [UVa 13184 - Counting Edges and Graphs](https://uva.onlinejudge.org/index.php?option=onlinejudge&page=show_problem&problem=5095)
- [Codeforces - Anton and School 2](http://codeforces.com/contest/785/problem/D)
- [Codeforces - Bacterial Melee](http://codeforces.com/contest/760/problem/F)
- [Codeforces - Points, Lines and Ready-made Titles](http://codeforces.com/contest/872/problem/E)
- [SPOJ - The Ultimate Riddle](https://www.spoj.com/problems/DCEPC13D/)
- [CodeChef - Long Sandwich](https://www.codechef.com/MAY17/problems/SANDWICH/)
- [Codeforces - Placing Jinas](https://codeforces.com/problemset/problem/1696/E)
