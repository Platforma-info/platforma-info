---
title: "Power of a Divisor in a Factorial"
section: Fundamentals
order: 3
difficulty: intermediate
summary: "Find the largest x such that k^x divides n!, using Legendre's formula for primes and the prime factorization of k for composites."
tags: [factorial, legendre, divisibility, trailing zeros]
prerequisites: [math/integer-factorization]
source:
  title: "Finding Power of Factorial Divisor"
  url: https://cp-algorithms.com/algebra/factorial-divisors.html
  license: CC BY-SA 4.0
---

Given $n$ and $k$, find the largest $x$ such that $k^x$ divides $n!$. This is the question behind "how many trailing zeros does $n!$ have?" ($k = 10$) and many divisibility problems around binomial coefficients.

## Prime $k$: Legendre's formula

Among $1, \dots, n$ exactly $\lfloor n/p \rfloor$ numbers are multiples of $p$, each contributing at least one factor $p$; $\lfloor n/p^2 \rfloor$ of them contribute a second one, and so on. So the exponent of the prime $p$ in $n!$ is

$$
\nu_p(n!) = \left\lfloor \frac{n}{p} \right\rfloor + \left\lfloor \frac{n}{p^2} \right\rfloor + \left\lfloor \frac{n}{p^3} \right\rfloor + \cdots
$$

which needs only $\log_p n$ terms. Equivalently $\nu_p(n!) = \dfrac{n - s_p(n)}{p - 1}$ where $s_p(n)$ is the sum of the base-$p$ digits of $n$.

```python
from math import factorial

def legendre(n, p):
    """Exponent of the prime p in n!."""
    total = 0
    while n:
        n //= p
        total += n
    return total

def digit_sum(n, base):
    s = 0
    while n:
        n, r = divmod(n, base)
        s += r
    return s

assert legendre(100, 5) == 24                                 # 100! has 24 trailing zeros (from the 5s)
assert legendre(10, 2) == 8 and legendre(10, 3) == 4
assert all(legendre(n, p) == (n - digit_sum(n, p)) // (p - 1) for n in range(0, 500) for p in (2, 3, 5, 7))
assert legendre(10 ** 18, 2) > 0                              # instant for huge n
```

## Composite $k$

Factor $k = p_1^{e_1} p_2^{e_2} \cdots p_r^{e_r}$. For $k^x$ to divide $n!$ we need $x \cdot e_i \le \nu_{p_i}(n!)$ for every prime factor, i.e. $x \le \lfloor \nu_{p_i}(n!) / e_i \rfloor$. The answer is the smallest of these bounds:

$$
x = \min_i \left\lfloor \frac{\nu_{p_i}(n!)}{e_i} \right\rfloor
$$

```python
def prime_factorization(k):
    factors, d = {}, 2
    while d * d <= k:
        while k % d == 0:
            factors[d] = factors.get(d, 0) + 1
            k //= d
        d += 1
    if k > 1:
        factors[k] = factors.get(k, 0) + 1
    return factors

def factorial_divisor_power(n, k):
    """Largest x with k^x | n!  (k >= 2)."""
    return min(legendre(n, p) // e for p, e in prime_factorization(k).items())

assert factorial_divisor_power(100, 10) == 24                 # trailing zeros of 100!
assert factorial_divisor_power(10, 12) == 4                   # 12 = 2^2 * 3: min(8 // 2, 4 // 1)
assert factorial_divisor_power(5, 7) == 0

def brute(n, k):
    f, x = factorial(n), 0
    while f % k == 0:
        f //= k
        x += 1
    return x

for n in range(0, 120, 3):
    for k in range(2, 60):
        assert factorial_divisor_power(n, k) == brute(n, k), (n, k)
```

The complexity is that of factoring $k$ (trial division up to $\sqrt{k}$), plus $O(\log n)$ per prime factor.

## Applications

- **Trailing zeros of $n!$** in base $b$: `factorial_divisor_power(n, b)`.
- **Is a binomial coefficient divisible by $p$?** $\nu_p\binom{n}{k} = \nu_p(n!) - \nu_p(k!) - \nu_p((n-k)!)$; by Kummer's theorem it equals the number of carries when adding $k$ and $n-k$ in base $p$.
- **Largest power of $p$ dividing a product** of many numbers: sum the exponents of the factors.

```python
from math import comb

def binomial_valuation(n, k, p):
    return legendre(n, p) - legendre(k, p) - legendre(n - k, p)

def carries(a, b, base):
    count, carry = 0, 0
    while a or b or carry:
        s = a % base + b % base + carry
        carry = 1 if s >= base else 0
        count += carry
        a //= base
        b //= base
    return count

for n in range(0, 60):
    for k in range(0, n + 1):
        for p in (2, 3, 5):
            v, c = 0, comb(n, k)
            while c % p == 0:
                c //= p
                v += 1
            assert binomial_valuation(n, k, p) == v == carries(k, n - k, p)
```
