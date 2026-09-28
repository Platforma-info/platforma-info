---
title: "Garner's Algorithm"
section: Modular arithmetic
order: 4
difficulty: advanced
summary: "Recover a big number from its residues modulo pairwise coprime primes using a mixed radix representation, without big-integer arithmetic."
tags: [garner, crt, mixed radix, modular arithmetic]
prerequisites: [math/chinese-remainder-theorem]
source:
  title: "Garner's algorithm"
  url: https://cp-algorithms.com/algebra/garners-algorithm.html
  license: CC BY-SA 4.0
---

The [Chinese Remainder Theorem](/theory/math/chinese-remainder-theorem) says that residues modulo pairwise coprime numbers $p_1, \dots, p_k$ determine a number $x$ modulo $M = p_1 \cdots p_k$. **Garner's algorithm** computes $x$ from those residues by building its **mixed radix representation**, using only arithmetic modulo the small numbers $p_i$. It matters in languages without big integers (and when the answer must be produced modulo something else), and it is the standard tool for "compute modulo several primes, then combine".

## Mixed radix representation

Write $x$ as

$$
x = x_1 + x_2\,p_1 + x_3\,p_1 p_2 + \dots + x_k\,p_1 \cdots p_{k-1}, \qquad 0 \le x_i < p_i
$$

This is like decimal digits, except that the "base" changes at every position. Such a representation exists and is unique for every $0 \le x < M$.

## Computing the digits

Reduce the equation modulo $p_1$: $x \equiv x_1 \pmod{p_1}$, so $x_1 = a_1$ (the first residue). Modulo $p_2$:

$$
a_2 \equiv x_1 + x_2 p_1 \pmod{p_2} \implies x_2 \equiv (a_2 - x_1)\, p_1^{-1} \pmod{p_2}
$$

and in general

$$
x_i \equiv \Big(a_i - \big(x_1 + x_2 p_1 + \dots + x_{i-1} p_1 \cdots p_{i-2}\big)\Big) \cdot (p_1 \cdots p_{i-1})^{-1} \pmod{p_i}
$$

Everything is computed modulo $p_i$, so the numbers stay small. The cost is $O(k^2)$ operations with the inverses precomputed.

```python
def garner(residues, moduli):
    """Mixed radix digits x_1..x_k of the unique x in [0, prod(moduli)) with x = a_i (mod p_i)."""
    k = len(moduli)
    digits = []
    for i in range(k):
        p = moduli[i]
        value = 0                          # x_1 + x_2*p_1 + ... evaluated modulo p_i
        weight = 1
        for j in range(i):
            value = (value + digits[j] * weight) % p
            weight = weight * moduli[j] % p
        # digit i: (a_i - value) / (p_1 ... p_{i-1}) modulo p_i
        digits.append((residues[i] - value) * pow(weight, -1, p) % p)
    return digits

def from_mixed_radix(digits, moduli):
    x, weight = 0, 1
    for digit, p in zip(digits, moduli):
        x += digit * weight
        weight *= p
    return x

moduli = [3, 5, 7]
digits = garner([2, 3, 2], moduli)                    # the classic x = 2 (3), 3 (5), 2 (7)
assert from_mixed_radix(digits, moduli) == 23

import random
primes = [101, 103, 107, 109, 113]
random.seed(1)
for _ in range(300):
    x = random.randrange(101 * 103 * 107 * 109 * 113)
    res = [x % p for p in primes]
    assert from_mixed_radix(garner(res, primes), primes) == x
```

## Computing the answer modulo another number

The main use: compute a big quantity (say a determinant or a product) modulo several primes $p_i$, then find the result **modulo a different modulus** $m$ using only the digits, never the huge number itself:

```python
def crt_mod(residues, moduli, target_mod):
    digits = garner(residues, moduli)
    x, weight = 0, 1
    for digit, p in zip(digits, moduli):
        x = (x + digit * weight) % target_mod
        weight = weight * p % target_mod
    return x

big = 12345678901234567890123
res = [big % p for p in primes]                       # big < prod(primes)? check
prod = 1
for p in primes:
    prod *= p
small = big % prod
res = [small % p for p in primes]
assert crt_mod(res, primes, 10 ** 9 + 7) == small % (10 ** 9 + 7)
```

## Application: multiplication of huge numbers with NTT

Several primes for a Number Theoretic Transform ([Fast Fourier Transform](/theory/math/fast-fourier-transform)) can multiply polynomials with coefficients up to $\sim 10^{18}$: compute the product modulo three NTT-friendly primes, then reconstruct each coefficient with Garner's algorithm.

## Compared with plain CRT

| | CRT (iterative) | Garner |
|---|---|---|
| intermediate numbers | grow up to $M$ | stay below $\max p_i$ |
| result | one big number | mixed radix digits (then evaluate) |
| needs big integers | yes (in C++) | no |

In Python you often just merge with big integers and be done; Garner's algorithm is the one to know for competitive programming in C++ and for its digit-by-digit structure.
