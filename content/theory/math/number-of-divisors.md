---
title: "Number and Sum of Divisors"
section: Number-theoretic functions
order: 2
difficulty: intermediate
summary: "Compute d(n) and σ(n) from the prime factorization, list all divisors in O(√n), and get them for every n up to N with a sieve."
tags: [divisors, multiplicative functions, number theory]
prerequisites: [math/integer-factorization]
source:
  title: Number of divisors / sum of divisors
  url: https://cp-algorithms.com/algebra/divisors.html
  license: CC BY-SA 4.0
---

Given $n = p_1^{e_1} p_2^{e_2} \cdots p_k^{e_k}$, we want the **number of divisors** $d(n)$ and the **sum of divisors** $\sigma(n)$. For $12 = 2^2 \cdot 3$: the divisors are $1, 2, 3, 4, 6, 12$, so $d(12) = 6$ and $\sigma(12) = 28$.

## Number of divisors

A divisor of $n$ picks an exponent $0 \le f_i \le e_i$ independently for each prime. The choices multiply:

$$
d(n) = (e_1 + 1)(e_2 + 1) \cdots (e_k + 1)
$$

## Sum of divisors

The sum over all choices factorizes the same way. For one prime power, $1 + p + p^2 + \dots + p^e = \dfrac{p^{e+1} - 1}{p - 1}$, so

$$
\sigma(n) = \prod_{i=1}^{k} \left(1 + p_i + \dots + p_i^{e_i}\right) = \prod_{i=1}^{k} \frac{p_i^{e_i + 1} - 1}{p_i - 1}
$$

```python
def factorize(n):
    factors = {}
    d = 2
    while d * d <= n:
        while n % d == 0:
            factors[d] = factors.get(d, 0) + 1
            n //= d
        d += 1 if d == 2 else 2
    if n > 1:
        factors[n] = factors.get(n, 0) + 1
    return factors

def num_divisors(n):
    result = 1
    for e in factorize(n).values():
        result *= e + 1
    return result

def sum_divisors(n):
    result = 1
    for p, e in factorize(n).items():
        result *= (p ** (e + 1) - 1) // (p - 1)
    return result

assert num_divisors(12) == 6 and sum_divisors(12) == 28
assert num_divisors(1) == 1 and sum_divisors(1) == 1
assert num_divisors(97) == 2 and sum_divisors(97) == 98

for n in range(1, 500):
    divs = [d for d in range(1, n + 1) if n % d == 0]
    assert num_divisors(n) == len(divs) and sum_divisors(n) == sum(divs)
```

The cost is that of the factorization (see [Integer Factorization](/theory/math/integer-factorization)). Exact division (`//`) is safe because $p - 1$ always divides $p^{e+1} - 1$.

## Listing all divisors in $O(\sqrt n)$

Divisors come in pairs $(d, n/d)$, and one of the two is at most $\sqrt n$:

```python
from math import isqrt

def divisors(n):
    small, large = [], []
    for d in range(1, isqrt(n) + 1):
        if n % d == 0:
            small.append(d)
            if d != n // d:
                large.append(n // d)
    return small + large[::-1]

assert divisors(36) == [1, 2, 3, 4, 6, 9, 12, 18, 36]
assert divisors(13) == [1, 13]
```

If you already have the factorization, generate the divisors by extending the list prime by prime:

```python
def divisors_from_factors(factors):
    divs = [1]
    for p, e in factors.items():
        divs = [d * p ** k for d in divs for k in range(e + 1)]
    return sorted(divs)

assert divisors_from_factors(factorize(360)) == divisors(360)
```

## Divisor counts for every number up to $N$

Instead of factorizing, count from the other side: every $d$ divides all its multiples. Adding 1 to each multiple of each $d$ takes $\sum_d N/d = O(N \log N)$ operations:

```python
def divisor_counts(N):
    cnt = [0] * (N + 1)
    for d in range(1, N + 1):
        for m in range(d, N + 1, d):
            cnt[m] += 1
    return cnt

cnt = divisor_counts(2000)
assert cnt[12] == 6 and cnt[1] == 1 and cnt[1024] == 11
assert all(cnt[n] == num_divisors(n) for n in range(1, 500))
```

The same loop with `sig[m] += d` produces all $\sigma(n)$.

## Multiplicative functions

A function $f$ is **multiplicative** if $f(ab) = f(a) f(b)$ whenever $\gcd(a, b) = 1$. Both $d(n)$, $\sigma(n)$ and Euler's $\varphi(n)$ are multiplicative. To compute such a function you only need its value at prime powers, then multiply over the factorization, exactly as above.

```python
for a, b in [(8, 9), (5, 12), (7, 20)]:                # coprime pairs
    assert num_divisors(a * b) == num_divisors(a) * num_divisors(b)
    assert sum_divisors(a * b) == sum_divisors(a) * sum_divisors(b)
assert num_divisors(4 * 6) != num_divisors(4) * num_divisors(6)     # not coprime
```

## Practice problems

- [SPOJ - COMDIV](https://www.spoj.com/problems/COMDIV/)
- [SPOJ - DIVSUM](https://www.spoj.com/problems/DIVSUM/)
- [SPOJ - DIVSUM2](https://www.spoj.com/problems/DIVSUM2/)
