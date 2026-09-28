---
title: Primality Tests
section: Prime numbers
order: 2
difficulty: intermediate
summary: Decide whether a single large number is prime: trial division, the Fermat test, and the deterministic Miller-Rabin test for 64-bit integers.
tags: [primes, miller-rabin, fermat, modular arithmetic]
prerequisites: [math/sieve-of-eratosthenes, math/binary-exponentiation]
problems: [numar-prim]
source:
  title: Primality tests
  url: https://cp-algorithms.com/algebra/primality_tests.html
  license: CC BY-SA 4.0
---

The [sieve](/theory/math/sieve-of-eratosthenes) tells you about *every* number up to $n$. When you have one (or a few) huge numbers, say up to $10^{18}$, you need a test that works on a single number.

## Trial division

Check every candidate divisor up to $\sqrt n$ (a composite always has a divisor that small):

```python
from math import isqrt

def is_prime_trial(n):
    if n < 2:
        return False
    if n % 2 == 0:
        return n == 2
    for d in range(3, isqrt(n) + 1, 2):
        if n % d == 0:
            return False
    return True

assert [p for p in range(30) if is_prime_trial(p)] == [2, 3, 5, 7, 11, 13, 17, 19, 23, 29]
assert is_prime_trial(10 ** 9 + 7) and not is_prime_trial(10 ** 9 + 9 * 7)
```

The complexity is $O(\sqrt n)$. Fine up to about $n \approx 10^{12}$ for a single query, hopeless for $n \approx 10^{18}$ ($10^9$ divisions).

## Fermat primality test

**Fermat's little theorem**: if $p$ is prime and $\gcd(a, p) = 1$, then

$$
a^{p-1} \equiv 1 \pmod p
$$

So if we find some base $a$ with $a^{n-1} \not\equiv 1 \pmod n$, then $n$ is definitely **composite**. If it holds, $n$ is *probably* prime. Thanks to [binary exponentiation](/theory/math/binary-exponentiation), each base costs $O(\log n)$:

```python
import random

def fermat_test(n, rounds=10):
    if n < 4:
        return n in (2, 3)
    for _ in range(rounds):
        a = random.randrange(2, n - 1)
        if pow(a, n - 1, n) != 1:
            return False
    return True

assert fermat_test(1_000_000_007)
assert not fermat_test(1_000_000_007 * 3)
```

The catch: **Carmichael numbers** such as $561 = 3 \cdot 11 \cdot 17$ satisfy $a^{n-1} \equiv 1$ for *every* base coprime to $n$, so Fermat is fooled except for bases sharing a factor with $n$.

```python
assert all(pow(a, 560, 561) == 1 for a in range(2, 561) if __import__("math").gcd(a, 561) == 1)
```

That is why Fermat is rarely used on its own.

## Miller-Rabin test

Miller-Rabin strengthens Fermat. Write $n - 1 = 2^s \cdot d$ with $d$ odd. If $n$ is prime, then for any base $a$ (not divisible by $n$), *one* of these holds:

$$
a^{d} \equiv 1 \pmod n \qquad\text{or}\qquad a^{2^r d} \equiv -1 \pmod n \ \text{ for some } 0 \le r < s
$$

The reason is that in the field $\mathbb{Z}_n$ the only square roots of $1$ are $\pm 1$, so the chain $a^d, a^{2d}, a^{4d}, \dots, a^{2^s d} = a^{n-1}$ can reach $1$ only from $1$ or from $-1$.

A base $a$ for which the condition **fails** is a *witness* that $n$ is composite. For composite $n$, at least $3/4$ of all bases are witnesses, so random bases give an error probability of at most $4^{-k}$ after $k$ rounds.

```python
def is_composite_witness(n, a, d, s):
    """True if base a proves that n is composite."""
    x = pow(a, d, n)
    if x == 1 or x == n - 1:
        return False
    for _ in range(s - 1):
        x = x * x % n
        if x == n - 1:
            return False
    return True

def is_probable_prime(n, rounds=20):
    if n < 2:
        return False
    for p in (2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37):
        if n % p == 0:
            return n == p
    d, s = n - 1, 0
    while d % 2 == 0:
        d //= 2
        s += 1
    return not any(
        is_composite_witness(n, random.randrange(2, n - 1), d, s) for _ in range(rounds)
    )
```

### Deterministic version for 64-bit numbers

Random bases are not even needed. It has been verified that testing the first twelve primes as bases gives a **correct answer for all $n < 3.3 \cdot 10^{24}$**, which covers every 64-bit integer:

$$
a \in \{2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37\}
$$

```python
BASES = (2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37)

def is_prime(n):
    """Deterministic primality test, correct for all n < 3.3e24."""
    if n < 2:
        return False
    for p in BASES:
        if n % p == 0:
            return n == p
    d, s = n - 1, 0
    while d % 2 == 0:
        d //= 2
        s += 1
    return not any(is_composite_witness(n, a, d, s) for a in BASES)

# agrees with the sieve on every number below 100000
from math import isqrt
sieve = bytearray([1]) * 100_001
sieve[0] = sieve[1] = 0
for i in range(2, isqrt(100_000) + 1):
    if sieve[i]:
        sieve[i * i :: i] = bytes(len(range(i * i, 100_001, i)))
assert all(is_prime(n) == bool(sieve[n]) for n in range(100_001))

# Carmichael numbers and strong pseudoprimes are rejected
assert not is_prime(561) and not is_prime(41041)
assert not is_prime(3_215_031_751)              # passes the bases 2, 3, 5, 7 but is composite
# large primes
assert is_prime(2 ** 61 - 1) and is_prime(10 ** 18 + 9) and is_prime(10 ** 9 + 7)
assert not is_prime((2 ** 31 - 1) * (2 ** 61 - 1))
```

Each base costs one modular exponentiation with $O(\log n)$ multiplications, so a test takes about $12 \cdot 64$ multiplications: microseconds to a fraction of a millisecond, and for numbers below $2^{64}$ you can even use just the seven bases $2, 325, 9375, 28178, 450775, 9780504, 1795265022$.

> [!PYTHON]
> `pow(a, d, n)` is the built-in three-argument modular power, running in C. There is no need to write your own `binpow` here, and Python's exact integers mean that `x * x % n` never overflows, unlike the `__int128` gymnastics required in C++ for 64-bit moduli.

## Which test should I use?

| Situation | Choice |
|-----------|--------|
| all primes up to $n \le 10^7$ | [sieve](/theory/math/sieve-of-eratosthenes) |
| one number $\le 10^{12}$ | trial division |
| any number up to $10^{18}$ and beyond | deterministic Miller-Rabin |
| a huge number where a tiny error probability is acceptable | Miller-Rabin with random bases |

## Practice problems

- [SPOJ - Prime or Not](https://www.spoj.com/problems/PON/)
- [Project euler - Investigating a Prime Pattern](https://projecteuler.net/problem=146)
