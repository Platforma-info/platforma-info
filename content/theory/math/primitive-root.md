---
title: "Primitive Roots"
section: Modular arithmetic
order: 7
difficulty: advanced
summary: "Find a generator of the multiplicative group modulo n: when it exists, how to test a candidate, and how many there are."
tags: [primitive root, order, group, modular arithmetic]
prerequisites: [math/euler-totient-function, math/integer-factorization]
source:
  title: "Primitive Root"
  url: https://cp-algorithms.com/algebra/primitive-root.html
  license: CC BY-SA 4.0
---

The **multiplicative order** of $a$ modulo $n$ (with $\gcd(a, n) = 1$) is the smallest $k > 0$ with $a^k \equiv 1 \pmod n$. By Euler's theorem the order divides $\varphi(n)$.

A **primitive root** modulo $n$ is a number $g$ whose order is exactly $\varphi(n)$. Then the powers $g^0, g^1, \dots, g^{\varphi(n)-1}$ are *all* the residues coprime to $n$, each exactly once: $g$ generates the whole group. Primitive roots turn multiplication into addition of exponents, which is what makes [discrete roots](/theory/math/discrete-root) tractable.

## Existence (Gauss)

A primitive root exists if and only if $n$ is one of

$$
1,\ 2,\ 4,\ p^k,\ 2p^k \qquad (p \text{ an odd prime},\ k \ge 1)
$$

For example $n = 8$ and $n = 12$ have none.

## Testing a candidate

$g$ is a primitive root modulo $n$ exactly when for every prime divisor $q$ of $\varphi(n)$

$$
g^{\varphi(n)/q} \not\equiv 1 \pmod n
$$

Reason: the order of $g$ divides $\varphi(n)$, and if it were a proper divisor it would divide $\varphi(n)/q$ for some prime $q \mid \varphi(n)$, giving $g^{\varphi(n)/q} \equiv 1$.

## Finding one

Primitive roots are plentiful: there are $\varphi(\varphi(n))$ of them, and the smallest one is usually tiny (for primes $p$ up to $10^{18}$, it is at most a few hundred in practice; a proven bound is $O(p^{1/4+\varepsilon})$). So just try $g = 2, 3, 4, \dots$ and test.

```python
from math import gcd

def prime_factors(n):
    ps, d = [], 2
    while d * d <= n:
        if n % d == 0:
            ps.append(d)
            while n % d == 0:
                n //= d
        d += 1
    if n > 1:
        ps.append(n)
    return ps

def phi(n):
    result = n
    for p in prime_factors(n):
        result -= result // p
    return result

def has_primitive_root(n):
    if n in (1, 2, 4):
        return True
    if n % 2 == 0:
        n //= 2                       # 2 p^k -> p^k
    ps = prime_factors(n)
    return len(ps) == 1 and ps[0] != 2

def primitive_root(n):
    """Smallest primitive root modulo n, or None if none exists."""
    if not has_primitive_root(n):
        return None
    if n == 1:
        return 0
    order = phi(n)
    factors = prime_factors(order)
    for g in range(1, n):
        if gcd(g, n) == 1 and all(pow(g, order // q, n) != 1 for q in factors):
            return g
    return None

assert primitive_root(7) == 3 and primitive_root(11) == 2 and primitive_root(998244353) == 3
assert primitive_root(8) is None and primitive_root(12) is None
assert primitive_root(9) == 2 and primitive_root(18) == 5
assert primitive_root(10 ** 9 + 7) == 5
```

## Checking against the definition

Compute the multiplicative order of every unit by brute force and check both the existence criterion and the count $\varphi(\varphi(n))$:

```python
def order(g, n):
    k, x = 1, g % n
    while x != 1 % n:
        x = x * g % n
        k += 1
    return k

for n in range(2, 300):
    units = [g for g in range(1, n) if gcd(g, n) == 1]
    roots = [g for g in units if order(g, n) == len(units)]
    assert bool(roots) == has_primitive_root(n), n
    if roots:
        assert roots[0] == primitive_root(n)
        assert len(roots) == phi(phi(n)) or n in (2,), n      # exactly phi(phi(n)) of them
```

## Using a primitive root

If $g$ is a primitive root modulo a prime $p$, every non-zero residue is $g^i$ for a unique $i \in [0, p-2]$, its **index** (discrete logarithm). Then:

- $ab \equiv g^{i+j}$: multiplication becomes addition of indices modulo $p-1$,
- $a^k \equiv g^{ik}$: powers become multiplications.

```python
p = 101
g = primitive_root(p)
index = {pow(g, i, p): i for i in range(p - 1)}
a, b = 37, 55
assert a * b % p == pow(g, (index[a] + index[b]) % (p - 1), p)
assert pow(a, 12345, p) == pow(g, index[a] * 12345 % (p - 1), p)
```

Other places you will see primitive roots: the **Number Theoretic Transform** (the modulus 998244353 has primitive root 3, and $2^{23} \mid p - 1$), pseudo-random number generators, and constructing cyclic sequences.
