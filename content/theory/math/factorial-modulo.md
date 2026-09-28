---
title: "Factorial Modulo a Prime"
section: Modular arithmetic
order: 5
difficulty: advanced
summary: "Compute n! mod p for a small prime p and huge n by Wilson's theorem, and find the exponent of p in n!."
tags: [factorial, wilson, modular arithmetic, legendre]
prerequisites: [math/modular-inverse, combinatorics/binomial-coefficients]
source:
  title: "Factorial modulo p"
  url: https://cp-algorithms.com/algebra/factorial-modulo.html
  license: CC BY-SA 4.0
---

For $n < p$ the factorial mod $p$ is a simple loop. For **huge $n$ and a small prime $p$** (say $n = 10^{18}$, $p = 10^6 + 3$) the loop is impossible, and moreover $n!$ contains the factor $p$ many times, so the value modulo $p$ is just $0$. The meaningful quantity is the factorial **with all factors of $p$ removed**:

$$
n!_p = \frac{n!}{p^{\nu_p(n!)}} \bmod p
$$

where $\nu_p(n!)$ is the exponent of $p$ in $n!$. Computing it in $O(p \log_p n)$ makes binomial coefficients modulo a small prime possible (see [Lucas' theorem](/theory/combinatorics/binomial-coefficients)) and answers many "trailing zeros" questions.

## The exponent of $p$ in $n!$ (Legendre's formula)

$$
\nu_p(n!) = \left\lfloor \frac{n}{p} \right\rfloor + \left\lfloor \frac{n}{p^2} \right\rfloor + \left\lfloor \frac{n}{p^3} \right\rfloor + \dots
$$

Multiples of $p$ contribute one factor, multiples of $p^2$ one extra, and so on.

```python
def legendre(n, p):
    e = 0
    while n:
        n //= p
        e += n
    return e

from math import factorial

assert legendre(100, 5) == 24                          # 100! ends with 24 zeros
def naive_exp(n, p):
    f, e = factorial(n), 0
    while f % p == 0:
        f //= p
        e += 1
    return e
assert all(legendre(n, p) == naive_exp(n, p) for n in range(0, 200) for p in (2, 3, 5, 7))
```

## The factorial without factors of $p$

Split the numbers $1, 2, \dots, n$ into multiples of $p$ and the rest.

**The non-multiples.** Every full block of $p$ consecutive numbers contains each non-zero residue once, so its non-multiples multiply to $(p-1)! \equiv -1 \pmod p$ by **Wilson's theorem**. There are $\lfloor n/p \rfloor$ full blocks and then a partial block of $n \bmod p$ numbers:

$$
\prod_{\substack{i \le n \\ p \nmid i}} i \equiv (-1)^{\lfloor n/p \rfloor} \cdot (n \bmod p)! \pmod p
$$

**The multiples.** They are $p, 2p, \dots, \lfloor n/p \rfloor p$; dropping the factor $p$ from each leaves $\lfloor n/p \rfloor !$, itself a factorial, so recurse:

$$
n!_p = (-1)^{\lfloor n/p \rfloor} \cdot (n \bmod p)! \cdot \left\lfloor \frac{n}{p} \right\rfloor!_p \pmod p
$$

The recursion depth is $\log_p n$, and each level needs $(n \bmod p)!$, obtained from a table of factorials up to $p-1$ (one $O(p)$ precomputation).

```python
def factorial_mod_p(n, p):
    """(n! with all factors of p removed) mod p, and the exponent of p in n!."""
    table = [1] * p
    for i in range(1, p):
        table[i] = table[i - 1] * i % p
    result = 1
    m = n
    sign_parity = 0
    while m > 0:
        result = result * table[m % p] % p
        m //= p
        sign_parity += m                       # accumulates floor(n/p^k): parity gives (-1)^total
    if sign_parity % 2 and p > 2:
        result = (p - result) % p
    return result, legendre(n, p)

def brute(n, p):
    f = factorial(n)
    e = 0
    while f % p == 0:
        f //= p
        e += 1
    return f % p, e

assert factorial_mod_p(10, 7) == brute(10, 7)
for p in (2, 3, 5, 7, 11, 13):
    for n in range(0, 200):
        assert factorial_mod_p(n, p) == brute(n, p), (n, p)
```

The sign: each level contributes $(-1)^{\lfloor n/p^k \rfloor}$, so the total sign is $(-1)^{\sum_k \lfloor n/p^k \rfloor}$, which is exactly `sign_parity`. For $p = 2$ the sign does not matter since $-1 \equiv 1$.

## Binomial coefficients modulo small $p$ for huge $n$

The formula lets us compute $\binom{n}{k} \bmod p$ even when the binomial coefficient is divisible by $p$ (in which case the exponent difference is positive and the answer is $0$):

```python
def binom_mod_p(n, k, p):
    if k < 0 or k > n:
        return 0
    fn, en = factorial_mod_p(n, p)
    fk, ek = factorial_mod_p(k, p)
    fnk, enk = factorial_mod_p(n - k, p)
    if en - ek - enk > 0:
        return 0
    return fn * pow(fk * fnk % p, -1, p) % p

from math import comb
for p in (5, 7, 13):
    for n in range(0, 80):
        for k in range(0, n + 1):
            assert binom_mod_p(n, k, p) == comb(n, k) % p
```

Note this recomputes the table for each call; in real use build `table` once and reuse it.

## Complexity

$O(p + \log_p n)$ for the table plus the recursion; when many queries share the same $p$, the table is built once and each query costs $O(\log_p n)$.
