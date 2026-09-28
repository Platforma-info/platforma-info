---
title: "Modular Multiplicative Inverse"
section: Modular arithmetic
order: 1
difficulty: intermediate
summary: "Divide under a modulus. Find a^-1 mod m with extended Euclid, with Fermat/Euler, with Python's pow, and for a whole array at once."
tags: [modular arithmetic, inverse, fermat, division]
prerequisites: [math/extended-euclidean-algorithm, math/euler-totient-function]
source:
  title: Modular Multiplicative Inverse
  url: https://cp-algorithms.com/algebra/module-inverse.html
  license: CC BY-SA 4.0
---

Addition, subtraction and multiplication work modulo $m$ by simply reducing the result. **Division** does not: you cannot divide the remainders. Instead you multiply by an *inverse*.

## Definition

The **modular multiplicative inverse** of $a$ modulo $m$ is a number $x$ such that

$$
a \cdot x \equiv 1 \pmod m
$$

and it is written $a^{-1}$. Then "$b / a \bmod m$" means $b \cdot a^{-1} \bmod m$.

**When does it exist?** Exactly when $\gcd(a, m) = 1$ (the numbers are coprime). If a common factor $g > 1$ existed, $ax$ would always be a multiple of $g$ modulo $m$ and could never be $1$. When it exists it is unique modulo $m$. For a **prime** $m$ every $a \not\equiv 0$ has an inverse.

Example: $3 \cdot 5 = 15 \equiv 1 \pmod 7$, so $3^{-1} \equiv 5 \pmod 7$.

## Method 1: extended Euclid

$ax \equiv 1 \pmod m$ means $ax + my = 1$ for some integer $y$. The [extended Euclidean algorithm](/theory/math/extended-euclidean-algorithm) solves this directly. It works for **any** modulus (not only primes) and costs $O(\log m)$:

```python
def extended_gcd(a, b):
    if b == 0:
        return a, 1, 0
    g, x1, y1 = extended_gcd(b, a % b)
    return g, y1, x1 - (a // b) * y1

def inverse_euclid(a, m):
    g, x, _ = extended_gcd(a % m, m)
    if g != 1:
        raise ValueError(f"{a} has no inverse modulo {m}")
    return x % m                       # normalize into [0, m)

assert inverse_euclid(3, 7) == 5
assert inverse_euclid(10, 17) == 12
assert all(a * inverse_euclid(a, 101) % 101 == 1 for a in range(1, 101))
```

## Method 2: binary exponentiation (Fermat / Euler)

By **Euler's theorem**, if $\gcd(a, m) = 1$ then $a^{\varphi(m)} \equiv 1$, hence

$$
a^{-1} \equiv a^{\varphi(m) - 1} \pmod m
$$

and for a prime $m = p$ (Fermat's little theorem) simply $a^{-1} \equiv a^{p-2} \pmod p$. Computing the power takes $O(\log m)$ with [binary exponentiation](/theory/math/binary-exponentiation):

```python
MOD = 1_000_000_007

def inverse_fermat(a, p=MOD):
    return pow(a, p - 2, p)

assert inverse_fermat(3, 7) == 5
assert inverse_fermat(2) * 2 % MOD == 1
assert all(inverse_fermat(a, 101) == inverse_euclid(a, 101) for a in range(1, 101))
```

This is the go-to one-liner in contests where the modulus is $10^9 + 7$ or $998244353$.

## Method 3: Python's built-in

Since Python 3.8, the three-argument `pow` accepts a **negative exponent** and computes the modular inverse (raising `ValueError` if none exists):

```python
assert pow(3, -1, 7) == 5
assert pow(10, -1, 17) == 12
assert pow(7, -2, 100) == pow(pow(7, -1, 100), 2, 100)

try:
    pow(6, -1, 9)                      # gcd(6, 9) = 3
except ValueError:
    pass
else:
    raise AssertionError("expected ValueError")
```

Use it: it is the shortest, works for any coprime modulus, and runs in C.

## Method 4: all inverses $1, \dots, n$ modulo a prime in $O(n)$

Let $m$ be prime and write $m = q\, i + r$ with $q = \lfloor m/i \rfloor$ and $r = m \bmod i$. Then $q\,i + r \equiv 0 \pmod m$. Multiply by $i^{-1} r^{-1}$:

$$
q\, r^{-1} + i^{-1} \equiv 0 \quad\Longrightarrow\quad i^{-1} \equiv -\left\lfloor \frac{m}{i} \right\rfloor \cdot (m \bmod i)^{-1} \pmod m
$$

and $m \bmod i < i$ has already been computed:

```python
def inverses_upto(n, p=MOD):
    inv = [0, 1] + [0] * (n - 1)
    for i in range(2, n + 1):
        inv[i] = (p - (p // i) * inv[p % i] % p) % p
    return inv

inv = inverses_upto(1000)
assert all(i * inv[i] % MOD == 1 for i in range(1, 1001))
```

This is how you precompute factorial inverses for [binomial coefficients](/theory/combinatorics/binomial-coefficients).

## Method 5: inverses of an arbitrary array

Inverting $n$ numbers separately costs $n \log m$. With **prefix products** you need just one inversion:

1. Compute prefix products $P_i = a_1 a_2 \cdots a_i$.
2. Invert the total $P_n$ once.
3. Walk backwards. If `running` holds $(a_1 \cdots a_i)^{-1}$, then $a_i^{-1} = P_{i-1} \cdot \text{running}$, and multiplying `running` by $a_i$ gives $(a_1 \cdots a_{i-1})^{-1}$ for the next step.

```python
def batch_inverse(a, m=MOD):
    n = len(a)
    prefix = [1] * (n + 1)
    for i, x in enumerate(a):
        prefix[i + 1] = prefix[i] * x % m
    running = pow(prefix[n], -1, m)          # (a_1 ... a_n)^-1
    result = [0] * n
    for i in range(n - 1, -1, -1):
        result[i] = prefix[i] * running % m
        running = running * a[i] % m         # drop a_i: running is now (a_1 ... a_{i-1})^-1
    return result

nums = [3, 5, 7, 123456789, 999999999]
assert batch_inverse(nums) == [pow(x, -1, MOD) for x in nums]
```

## Which method?

| You need | Use |
|----------|-----|
| one inverse, any modulus | `pow(a, -1, m)` |
| one inverse, contest template | `pow(a, m - 2, m)` for prime $m$ |
| $1^{-1}, \dots, n^{-1}$ | linear recurrence |
| inverses of an arbitrary list | prefix-product trick |

## Practice problems

- [UVa 11904 - One Unit Machine](https://uva.onlinejudge.org/index.php?option=com_onlinejudge&Itemid=8&page=show_problem&problem=3055)
- [Hackerrank - Longest Increasing Subsequence Arrays](https://www.hackerrank.com/contests/world-codesprint-5/challenges/longest-increasing-subsequence-arrays)
- [Codeforces 300C - Beautiful Numbers](http://codeforces.com/problemset/problem/300/C)
- [Codeforces 622F - The Sum of the k-th Powers](http://codeforces.com/problemset/problem/622/F)
- [Codeforces 717A - Festival Organization](http://codeforces.com/problemset/problem/717/A)
- [Codeforces 896D - Nephren Runs a Cinema](http://codeforces.com/problemset/problem/896/D)
