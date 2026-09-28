---
title: "Integer Factorization"
section: Prime numbers
order: 3
difficulty: advanced
summary: "Break a number into primes with trial division, a smallest-prime-factor sieve, Fermat's method and Pollard's rho for numbers up to 10^18 and beyond."
tags: [factorization, pollard rho, primes, number theory]
prerequisites: [math/primality-tests]
source:
  title: Integer factorization
  url: https://cp-algorithms.com/algebra/factorization.html
  license: CC BY-SA 4.0
---

Every integer $n \ge 2$ factors uniquely into primes (the *fundamental theorem of arithmetic*):

$$
n = p_1^{e_1} p_2^{e_2} \cdots p_k^{e_k}
$$

Factorization is the base of the totient and divisor functions, and of many counting problems. Which method to use depends on how large $n$ is and how many numbers you must factor.

| Situation | Method | Cost |
|-----------|--------|------|
| one $n \lesssim 10^{12}$ | trial division | $O(\sqrt n)$ |
| many numbers $\le N \approx 10^7$ | smallest-prime-factor sieve | $O(\log n)$ each after $O(N \log\log N)$ |
| one $n$ up to $10^{18}$ or more | Pollard's rho | about $O(n^{1/4})$ expected |

## Trial division

Divide by every candidate $d$ from $2$ up to $\sqrt n$. Each time $d$ divides $n$, count how many times and divide it out; what remains at the end (if greater than 1) is a prime.

```python
def factorize_trial(n):
    """Return {prime: exponent} for n >= 1."""
    factors = {}
    d = 2
    while d * d <= n:
        while n % d == 0:
            factors[d] = factors.get(d, 0) + 1
            n //= d
        d += 1 if d == 2 else 2          # 2, 3, 5, 7, 9, ...: skip even candidates
    if n > 1:
        factors[n] = factors.get(n, 0) + 1
    return factors

assert factorize_trial(360) == {2: 3, 3: 2, 5: 1}
assert factorize_trial(1) == {}
assert factorize_trial(97) == {97: 1}
assert factorize_trial(600851475143) == {71: 1, 839: 1, 1471: 1, 6857: 1}
```

The loop makes at most $\sqrt n$ steps. Since a composite number always has a factor $\le \sqrt n$, once the loop ends what is left is prime.

### Wheel factorization

Testing only $2$, then odd numbers, halves the work. Also skipping multiples of $3$ leaves candidates of the form $6k \pm 1$, which reduces it to a third:

```python
def factorize_wheel(n):
    factors = {}
    for p in (2, 3, 5):
        while n % p == 0:
            factors[p] = factors.get(p, 0) + 1
            n //= p
    d, step = 7, (4, 2, 4, 2, 4, 6, 2, 6)          # gaps of the 2·3·5 wheel
    i = 0
    while d * d <= n:
        while n % d == 0:
            factors[d] = factors.get(d, 0) + 1
            n //= d
        d += step[i]
        i = (i + 1) % 8
    if n > 1:
        factors[n] = factors.get(n, 0) + 1
    return factors

import random
for n in [random.randint(1, 10 ** 8) for _ in range(300)] + [2, 3, 4, 49, 121, 7919 * 7919]:
    assert factorize_wheel(n) == factorize_trial(n)
```

## Many queries: smallest-prime-factor sieve

If you must factor many numbers below $N$, precompute `spf[i]` (the smallest prime factor of $i$) with the [sieve](/theory/math/sieve-of-eratosthenes). Then each factorization is a chain of lookups:

```python
from math import isqrt

def build_spf(N):
    spf = list(range(N + 1))
    for i in range(2, isqrt(N) + 1):
        if spf[i] == i:
            for j in range(i * i, N + 1, i):
                if spf[j] == j:
                    spf[j] = i
    return spf

def factorize_spf(n, spf):
    factors = {}
    while n > 1:
        p = spf[n]
        factors[p] = factors.get(p, 0) + 1
        n //= p
    return factors

spf = build_spf(10 ** 5)
assert all(factorize_spf(n, spf) == factorize_trial(n) for n in range(1, 3000))
```

## Fermat's factorization

An odd $n$ can be written as a difference of squares $n = a^2 - b^2 = (a-b)(a+b)$. Search $a$ starting at $\lceil \sqrt n \rceil$ until $a^2 - n$ is a perfect square.

```python
def fermat_factor(n):
    """Find a non-trivial factor of an odd composite n."""
    a = isqrt(n)
    if a * a < n:
        a += 1
    b2 = a * a - n
    while isqrt(b2) ** 2 != b2:
        a += 1
        b2 = a * a - n
    return a - isqrt(b2)

f = fermat_factor(1000003 * 1000033)        # two close primes: found immediately
assert f in (1000003, 1000033)
assert fermat_factor(5959) == 59            # 5959 = 59 · 101
```

It is very fast when $n$ has two factors close to $\sqrt n$, and very slow otherwise (up to $O(n)$ steps). It is best used as a first attempt combined with other methods.

## Pollard's rho algorithm

For large $n$ (up to $10^{18}$, or bigger) we need a method whose cost depends on the size of the *smallest prime factor* $p$, not on $n$.

**Idea.** Take a pseudo-random sequence $x_{i+1} = (x_i^2 + c) \bmod n$. Modulo the unknown prime $p$ the sequence also lives in a set of only $p$ values, so by the birthday paradox it repeats after about $\sqrt p$ steps: $x_i \equiv x_j \pmod p$, while (very likely) $x_i \not\equiv x_j \pmod n$. Then $\gcd(|x_i - x_j|, n)$ is a non-trivial multiple of $p$. A cycle-detection technique finds such a pair without storing the sequence; that is why the picture looks like the Greek letter $\rho$.

The version below uses **Brent's cycle detection** and multiplies many differences together before taking a single gcd, which makes it much faster:

```python
from math import gcd

def pollard_brent(n):
    """Return a non-trivial divisor of a composite n."""
    if n % 2 == 0:
        return 2
    if n % 3 == 0:
        return 3
    while True:
        y, c, m = random.randrange(1, n), random.randrange(1, n), 128
        g = r = q = 1
        while g == 1:
            x = y
            for _ in range(r):
                y = (y * y + c) % n
            k = 0
            while k < r and g == 1:
                ys = y
                for _ in range(min(m, r - k)):
                    y = (y * y + c) % n
                    q = q * abs(x - y) % n
                g = gcd(q, n)
                k += m
            r *= 2
        if g == n:                       # the batch overshot: redo it step by step
            g = 1
            while g == 1:
                ys = (ys * ys + c) % n
                g = gcd(abs(x - ys), n)
        if g != n:
            return g                     # otherwise: bad c, try another
```

To use it we need a primality test to know when to stop splitting (Miller-Rabin from [Primality Tests](/theory/math/primality-tests)):

```python
BASES = (2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37)

def is_prime(n):
    if n < 2:
        return False
    for p in BASES:
        if n % p == 0:
            return n == p
    d, s = n - 1, 0
    while d % 2 == 0:
        d //= 2
        s += 1
    for a in BASES:
        x = pow(a, d, n)
        if x in (1, n - 1):
            continue
        for _ in range(s - 1):
            x = x * x % n
            if x == n - 1:
                break
        else:
            return False
    return True

def factorize(n):
    """Return {prime: exponent}; fast for any n that fits in 64 bits, and far beyond."""
    factors = {}

    def rec(m):
        if m == 1:
            return
        if is_prime(m):
            factors[m] = factors.get(m, 0) + 1
            return
        d = pollard_brent(m)
        rec(d)
        rec(m // d)

    for p in (2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37):    # cheap small primes first
        while n % p == 0:
            factors[p] = factors.get(p, 0) + 1
            n //= p
    rec(n)
    return factors

assert factorize(2 ** 64 + 1) == {274177: 1, 67280421310721: 1}
assert factorize(10 ** 18 + 9) == {10 ** 18 + 9: 1}
p, q = 1_000_000_007, 998_244_353
assert factorize(p * q) == {p: 1, q: 1}
assert factorize(2 ** 10 * 3 ** 5 * 1_000_003 ** 2) == {2: 10, 3: 5, 1_000_003: 2}

for _ in range(100):
    n = random.randint(2, 10 ** 15)
    f = factorize(n)
    product = 1
    for prime, e in f.items():
        assert is_prime(prime)
        product *= prime ** e
    assert product == n
```

**Complexity.** The expected number of steps is $O(\sqrt p)$ for the smallest prime factor $p$, i.e. $O(n^{1/4})$ in the worst case of a semiprime with balanced factors. That is about $3 \cdot 10^4$ iterations for $n \approx 10^{18}$ instead of $10^9$ for trial division. The algorithm is randomized (we retry with a fresh constant $c$ when it fails) and gives no guarantee, but in practice it is reliable.

> [!IMPORTANT]
> Always test with `is_prime` **before** calling Pollard's rho: on a prime input the loop never finds a factor. Also strip small primes first, since rho handles perfect squares of primes poorly.

## Summary

- Small or single query: trial division with a wheel.
- Many queries with a bound around $10^6$–$10^7$: an [SPF sieve](/theory/math/sieve-of-eratosthenes).
- Big numbers: Miller-Rabin plus Pollard's rho (Brent).
- Once you have the factorization, [Euler's totient](/theory/math/euler-totient-function) and the [divisor functions](/theory/math/number-of-divisors) follow directly.

## Practice problems

- [SPOJ - FACT0](https://www.spoj.com/problems/FACT0/)
- [SPOJ - FACT1](https://www.spoj.com/problems/FACT1/)
- [SPOJ - FACT2](https://www.spoj.com/problems/FACT2/)
- [GCPC 15 - Divisions](https://codeforces.com/gym/100753)
