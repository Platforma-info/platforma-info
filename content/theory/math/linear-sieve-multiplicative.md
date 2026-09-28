---
title: "Linear Sieve and Multiplicative Functions"
section: Prime numbers
order: 4
difficulty: advanced
summary: "The O(n) sieve, and how to compute φ, μ, d and σ for every number up to n in one pass."
tags: [linear sieve, multiplicative functions, mobius, totient]
prerequisites: [math/sieve-of-eratosthenes, math/number-of-divisors]
source:
  title: "Linear Sieve"
  url: https://cp-algorithms.com/algebra/prime-sieve-linear.html
  license: CC BY-SA 4.0
---

The [sieve of Eratosthenes](/theory/math/sieve-of-eratosthenes) runs in $O(n \log\log n)$ because a composite such as $30$ is crossed out by each of its prime factors $2$, $3$ and $5$. The **linear sieve** ensures every composite is visited **exactly once**, through its *smallest prime factor* $\text{lp}(m)$.

## Idea

Every composite $m$ can be written uniquely as $m = i \cdot p$ where $p = \text{lp}(m)$ and $i = m/p$ satisfies $\text{lp}(i) \ge p$. So process $i = 2, 3, \dots, n$ in order, and for each prime $p \le \text{lp}(i)$ (with $ip \le n$) mark $ip$ with $\text{lp}(ip) = p$.

```python
def linear_sieve(n):
    lp = [0] * (n + 1)                      # smallest prime factor, 0 = not set
    primes = []
    for i in range(2, n + 1):
        if lp[i] == 0:                      # nothing marked it: i is prime
            lp[i] = i
            primes.append(i)
        for p in primes:
            if p > lp[i] or i * p > n:
                break
            lp[i * p] = p
    return lp, primes

lp, primes = linear_sieve(100)
assert primes[:10] == [2, 3, 5, 7, 11, 13, 17, 19, 23, 29] and len(primes) == 25
assert lp[91] == 7 and lp[64] == 2 and lp[97] == 97
```

The inner loop writes each composite exactly once, giving $O(n)$ time. The `p > lp[i]` check is the whole trick: it stops us from generating $i \cdot p$ with $p$ larger than the smallest prime factor of $i$, which some smaller prime would have generated.

In pure Python this loop-heavy version is slower than the slice-based sieve for plain primality (see the earlier article), but it produces much more than a bit per number.

## Multiplicative functions in one pass

A function $f$ is **multiplicative** if $f(ab) = f(a)f(b)$ for coprime $a, b$. Values at $m = i \cdot p$ (with $p = \text{lp}(m)$) follow from $f(i)$ in two cases:

- $p \nmid i$ ($p < \text{lp}(i)$): $i$ and $p$ are coprime, so $f(ip) = f(i) f(p)$.
- $p \mid i$ ($p = \text{lp}(i)$): a rule specific to $f$ using the exponent of $p$ in $i$.

### Euler's totient $\varphi$

$\varphi(ip) = \varphi(i)\,(p-1)$ if $p \nmid i$, and $\varphi(ip) = \varphi(i)\,p$ if $p \mid i$.

### Möbius function $\mu$

$\mu(n) = 0$ if $n$ has a squared prime factor, otherwise $(-1)^k$ for $k$ distinct primes. $\mu(ip) = -\mu(i)$ if $p \nmid i$, else $0$.

### Number of divisors $d$ and their sum $\sigma$

Keep $\text{cnt}[m]$ = the exponent of $\text{lp}(m)$ in $m$:

- $p \nmid i$: $d(ip) = 2\,d(i)$, $\text{cnt}[ip] = 1$;
- $p \mid i$: $\text{cnt}[ip] = \text{cnt}[i] + 1$ and $d(ip) = d(i) / (\text{cnt}[i] + 1) \cdot (\text{cnt}[i] + 2)$.

For $\sigma$ keep $\text{geo}[m] = 1 + p + \dots + p^{\text{cnt}[m]}$ (the factor of $\sigma$ that belongs to the smallest prime). If $p \nmid i$ then $\sigma(ip) = \sigma(i)(p + 1)$; otherwise replace the old factor $\text{geo}[i]$ by $\text{geo}[ip] = p \cdot \text{geo}[i] + 1$.

```python
def multiplicative_tables(n):
    lp = [0] * (n + 1)
    primes = []
    phi = [0] * (n + 1)
    mu = [0] * (n + 1)
    d = [0] * (n + 1)
    cnt = [0] * (n + 1)                     # exponent of lp[m] in m
    sigma = [0] * (n + 1)
    geo = [0] * (n + 1)                     # 1 + p + ... + p^cnt for p = lp[m]
    phi[1] = mu[1] = d[1] = sigma[1] = geo[1] = 1
    for i in range(2, n + 1):
        if lp[i] == 0:
            lp[i] = i
            primes.append(i)
            phi[i], mu[i], d[i], cnt[i], sigma[i], geo[i] = i - 1, -1, 2, 1, i + 1, i + 1
        for p in primes:
            m = i * p
            if p > lp[i] or m > n:
                break
            lp[m] = p
            if p < lp[i]:                   # p does not divide i: coprime
                phi[m] = phi[i] * (p - 1)
                mu[m] = -mu[i]
                d[m] = d[i] * 2
                cnt[m] = 1
                geo[m] = p + 1
                sigma[m] = sigma[i] * (p + 1)
            else:                           # p == lp[i]
                phi[m] = phi[i] * p
                mu[m] = 0
                cnt[m] = cnt[i] + 1
                d[m] = d[i] // (cnt[i] + 1) * (cnt[i] + 2)
                geo[m] = geo[i] * p + 1
                sigma[m] = sigma[i] // geo[i] * geo[m]
    return phi, mu, d, sigma

phi, mu, d, sigma = multiplicative_tables(1000)

from math import gcd
assert phi[1:11] == [1, 1, 2, 2, 4, 2, 6, 4, 6, 4]
assert mu[1:11] == [1, -1, -1, 0, -1, 1, -1, 0, 0, 1]
assert d[1:11] == [1, 2, 2, 3, 2, 4, 2, 4, 3, 4]
assert sigma[1:11] == [1, 3, 4, 7, 6, 12, 8, 15, 13, 18]

for m in range(1, 1001):
    divs = [x for x in range(1, m + 1) if m % x == 0]
    assert d[m] == len(divs) and sigma[m] == sum(divs)
    assert phi[m] == sum(gcd(x, m) == 1 for x in range(1, m + 1))
```

All four tables come from a single $O(n)$ pass.

## Möbius inversion in practice

The Möbius function satisfies $\sum_{d \mid n} \mu(d) = [n = 1]$, which gives a formula for counting coprime pairs:

$$
\#\{(a, b) : 1 \le a, b \le n,\ \gcd(a, b) = 1\} = \sum_{d=1}^{n} \mu(d) \left\lfloor \frac{n}{d} \right\rfloor^2
$$

```python
def coprime_pairs(n):
    return sum(mu[k] * (n // k) ** 2 for k in range(1, n + 1))

assert coprime_pairs(10) == sum(gcd(a, b) == 1 for a in range(1, 11) for b in range(1, 11)) == 63
assert coprime_pairs(300) == sum(gcd(a, b) == 1 for a in range(1, 301) for b in range(1, 301))
```
