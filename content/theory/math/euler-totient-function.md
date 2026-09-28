---
title: "Euler's Totient Function"
section: Number-theoretic functions
order: 1
difficulty: intermediate
summary: "Count the integers up to n that are coprime to n, compute φ(n) from the factorization or for all n at once, and apply Euler's theorem."
tags: [totient, euler, number theory, modular arithmetic]
prerequisites: [math/integer-factorization]
source:
  title: Euler's totient function
  url: https://cp-algorithms.com/algebra/phi-function.html
  license: CC BY-SA 4.0
---

**Euler's totient function** $\varphi(n)$ counts the integers in $[1, n]$ that are coprime to $n$:

$$
\varphi(n) = \#\{\, 1 \le k \le n : \gcd(k, n) = 1 \,\}
$$

The first values are:

| $n$ | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|-----|---|---|---|---|---|---|---|---|---|----|
| $\varphi(n)$ | 1 | 1 | 2 | 2 | 4 | 2 | 6 | 4 | 6 | 4 |

## Properties

- For a prime $p$: $\varphi(p) = p - 1$, since every smaller positive number is coprime to it.
- For a prime power: $\varphi(p^k) = p^k - p^{k-1}$, because only the multiples of $p$ are not coprime, and there are $p^{k-1}$ of them.
- **Multiplicative**: if $\gcd(a, b) = 1$ then $\varphi(ab) = \varphi(a)\varphi(b)$.

Combining these gives the formula from the prime factorization $n = p_1^{e_1} \cdots p_k^{e_k}$:

$$
\varphi(n) = n \prod_{i=1}^{k} \left(1 - \frac{1}{p_i}\right) = \prod_{i=1}^{k} p_i^{e_i - 1}(p_i - 1)
$$

For example $\varphi(36) = 36 \cdot \frac12 \cdot \frac23 = 12$.

## Computing $\varphi(n)$ for one number, $O(\sqrt n)$

Factor $n$ by trial division and apply $n \leftarrow n - n/p$ for each distinct prime $p$:

```python
def phi(n):
    result = n
    p = 2
    while p * p <= n:
        if n % p == 0:
            while n % p == 0:
                n //= p
            result -= result // p          # multiply by (1 - 1/p) exactly
        p += 1
    if n > 1:                              # one prime factor larger than sqrt(n) remains
        result -= result // n
    return result

from math import gcd

assert [phi(n) for n in range(1, 11)] == [1, 1, 2, 2, 4, 2, 6, 4, 6, 4]
assert phi(36) == 12 and phi(10 ** 9 + 7) == 10 ** 9 + 6
assert all(phi(n) == sum(1 for k in range(1, n + 1) if gcd(k, n) == 1) for n in range(1, 300))
```

`result -= result // p` is the integer version of `result *= (1 - 1/p)`; it is exact because `result` is still divisible by `p`.

## The totient of all numbers up to $n$ in $O(n \log\log n)$

Sieve-style: start with $\varphi(i) = i$ and, for every prime $p$, apply the factor $(1 - 1/p)$ to all multiples of $p$.

```python
def phi_sieve(n):
    phi = list(range(n + 1))
    for i in range(2, n + 1):
        if phi[i] == i:                      # untouched so far: i is prime
            for j in range(i, n + 1, i):
                phi[j] -= phi[j] // i
    return phi

table = phi_sieve(1000)
assert table[:11] == [0, 1, 1, 2, 2, 4, 2, 6, 4, 6, 4]
assert all(table[i] == phi(i) for i in range(1, 1001))
```

## Divisor sum property

Summing $\varphi$ over the divisors of $n$ gives back $n$:

$$
\sum_{d \mid n} \varphi(d) = n
$$

Intuitively, sort the fractions $\frac{k}{n}$ for $1 \le k \le n$ by their reduced denominator $d$; there are exactly $\varphi(d)$ fractions with denominator $d$.

```python
for n in range(1, 400):
    assert sum(phi(d) for d in range(1, n + 1) if n % d == 0) == n
```

The property yields another way to build all values, with $\varphi(n) = n - \sum_{d \mid n,\, d < n} \varphi(d)$, in $O(n \log n)$.

## Euler's theorem

If $\gcd(a, m) = 1$ then

$$
a^{\varphi(m)} \equiv 1 \pmod m
$$

For a prime modulus this is **Fermat's little theorem**, $a^{p-1} \equiv 1 \pmod p$. Two consequences that appear constantly:

- **Modular inverse**: $a^{-1} \equiv a^{\varphi(m) - 1} \pmod m$ (see [Modular Inverse](/theory/math/modular-inverse)).
- **Huge exponents**: $a^n \equiv a^{\,n \bmod \varphi(m)} \pmod m$ when $\gcd(a, m) = 1$.

```python
m, a = 1000, 7                                       # gcd(7, 1000) = 1
assert pow(a, phi(m), m) == 1
huge = 10 ** 100 + 12345
assert pow(a, huge, m) == pow(a, huge % phi(m), m)   # reduce the exponent first
```

> [!PYTHON]
> `pow(a, huge, m)` is already fast for enormous exponents, so you rarely need to reduce them. The reduction is essential when the exponent is itself a *tower* such as $a^{b^c}$ that cannot be computed directly: compute $b^c \bmod \varphi(m)$ first.

## Counting

Because $\varphi(n)$ counts numbers coprime to $n$, it counts the reduced fractions with denominator $n$ in $(0, 1]$; the number of reduced fractions with denominator at most $N$ is $\sum_{n=1}^{N} \varphi(n)$ (the length of the Farey sequence).

```python
N = 30
farey = {(a // gcd(a, b), b // gcd(a, b)) for b in range(1, N + 1) for a in range(1, b + 1)}
assert len(farey) == sum(phi_sieve(N)[1:])
```

## Practice problems

- [SPOJ #4141 "Euler Totient Function" [Difficulty: CakeWalk]](http://www.spoj.com/problems/ETF/)
- [UVA #10179 "Irreducible Basic Fractions" [Difficulty: Easy]](http://uva.onlinejudge.org/index.php?option=onlinejudge&page=show_problem&problem=1120)
- [UVA #10299 "Relatives" [Difficulty: Easy]](http://uva.onlinejudge.org/index.php?option=onlinejudge&page=show_problem&problem=1240)
- [UVA #11327 "Enumerating Rational Numbers" [Difficulty: Medium]](http://uva.onlinejudge.org/index.php?option=com_onlinejudge&Itemid=8&page=show_problem&problem=2302)
- [TIMUS #1673 "Admission to Exam" [Difficulty: High]](http://acm.timus.ru/problem.aspx?space=1&num=1673)
- [UVA 10990 - Another New Function](https://uva.onlinejudge.org/index.php?option=onlinejudge&page=show_problem&problem=1931)
- [Codechef - Golu and Sweetness](https://www.codechef.com/problems/COZIE)
- [SPOJ - LCM Sum](http://www.spoj.com/problems/LCMSUM/)
- [GYM - Simple Calculations  (F)](http://codeforces.com/gym/100975)
- [UVA 13132 - Laser Mirrors](https://uva.onlinejudge.org/index.php?option=com_onlinejudge&Itemid=8&page=show_problem&problem=5043)
- [SPOJ - GCDEX](http://www.spoj.com/problems/GCDEX/)
- [UVA 12995 - Farey Sequence](https://uva.onlinejudge.org/index.php?option=com_onlinejudge&Itemid=8&page=show_problem&problem=4878)
- [SPOJ - Totient in Permutation (easy)](http://www.spoj.com/problems/TIP1/)
- [LOJ - Mathematically Hard](http://lightoj.com/volume_showproblem.php?problem=1007)
- [SPOJ - Totient Extreme](http://www.spoj.com/problems/DCEPCA03/)
- [SPOJ - Playing with GCD](http://www.spoj.com/problems/NAJPWG/)
- [SPOJ - G Force](http://www.spoj.com/problems/DCEPC12G/)
- [SPOJ - Smallest Inverse Euler Totient Function](http://www.spoj.com/problems/INVPHI/)
- [Codeforces - Power Tower](http://codeforces.com/problemset/problem/906/D)
- [Kattis - Exponial](https://open.kattis.com/problems/exponial)
- [LeetCode - 372. Super Pow](https://leetcode.com/problems/super-pow/)
- [Codeforces - The Holmes Children](http://codeforces.com/problemset/problem/776/E)
- [Codeforces - Small GCD](https://codeforces.com/contest/1900/problem/D)
