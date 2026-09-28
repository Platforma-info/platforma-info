---
title: "Operations on Polynomials and Power Series"
section: Big numbers and polynomials
order: 3
difficulty: advanced
summary: "Fast inverse, division, logarithm, exponential and powers of polynomials with Newton's method, plus multipoint evaluation, interpolation and GCD."
tags: [polynomials, power series, newton iteration, ntt, interpolation]
prerequisites: [math/fast-fourier-transform, math/modular-inverse]
source:
  title: "Operations on polynomials and series"
  url: https://cp-algorithms.com/algebra/polynomial.html
  license: CC BY-SA 4.0
---

Once we can multiply polynomials in $O(n \log n)$ ([FFT/NTT](/theory/math/fast-fourier-transform)), a whole family of operations becomes fast. This article implements the core of them **modulo $998244353$**, so all divisions are by modular inverses. Coefficients are stored as Python lists with the constant term first: `[a0, a1, a2, ...]` means $a_0 + a_1 x + a_2 x^2 + \cdots$.

Two viewpoints:

- **Polynomials** are finite. We multiply them and divide with remainder.
- **Formal power series** are infinite; we work with them **modulo $x^n$** (only the first $n$ coefficients matter). A series with non-zero constant term has an inverse; a series with constant term $1$ has a logarithm; one with constant term $0$ has an exponential.

> [!NOTE]
> Everything here is a *toolbox*. It's the machinery behind counting problems like "the number of partitions of $n$", "the $n$-th term of a linear recurrence" and generating-function derivations. In pure Python, use sizes up to a few thousand; the code below is kept simple, not tuned.

## Setup: multiplication

```python
MOD = 998244353

def ntt(a, invert=False):
    n = len(a)
    a = a[:]
    j = 0
    for i in range(1, n):
        bit = n >> 1
        while j & bit:
            j ^= bit
            bit >>= 1
        j ^= bit
        if i < j:
            a[i], a[j] = a[j], a[i]
    length = 2
    while length <= n:
        w = pow(3, (MOD - 1) // length, MOD)
        if invert:
            w = pow(w, MOD - 2, MOD)
        half = length // 2
        ws = [1] * half
        for k in range(1, half):
            ws[k] = ws[k - 1] * w % MOD
        for start in range(0, n, length):
            for k in range(half):
                u = a[start + k]
                v = a[start + k + half] * ws[k] % MOD
                a[start + k] = (u + v) % MOD
                a[start + k + half] = (u - v) % MOD
        length <<= 1
    if invert:
        n_inv = pow(n, MOD - 2, MOD)
        a = [x * n_inv % MOD for x in a]
    return a

def mul(a, b):
    """Product of two polynomials mod 998244353."""
    if not a or not b:
        return []
    need = len(a) + len(b) - 1
    if min(len(a), len(b)) <= 16:
        res = [0] * need
        for i, x in enumerate(a):
            if x:
                for j, y in enumerate(b):
                    res[i + j] = (res[i + j] + x * y) % MOD
        return res
    n = 1
    while n < need:
        n *= 2
    fa = ntt(a + [0] * (n - len(a)))
    fb = ntt(b + [0] * (n - len(b)))
    return ntt([x * y % MOD for x, y in zip(fa, fb)], True)[:need]

def trim(a):
    a = a[:]
    while len(a) > 1 and a[-1] == 0:
        a.pop()
    return a

def add(a, b):
    n = max(len(a), len(b))
    return [((a[i] if i < len(a) else 0) + (b[i] if i < len(b) else 0)) % MOD for i in range(n)]

def sub(a, b):
    n = max(len(a), len(b))
    return [((a[i] if i < len(a) else 0) - (b[i] if i < len(b) else 0)) % MOD for i in range(n)]

def naive_mul(a, b):
    res = [0] * (len(a) + len(b) - 1)
    for i, x in enumerate(a):
        for j, y in enumerate(b):
            res[i + j] = (res[i + j] + x * y) % MOD
    return res

import random
random.seed(1)
for _ in range(30):
    a = [random.randrange(MOD) for _ in range(random.randint(1, 80))]
    b = [random.randrange(MOD) for _ in range(random.randint(1, 80))]
    assert mul(a, b) == naive_mul(a, b)
```

## Inverse series (Newton's method)

We want $B(x)$ with $A(x)B(x) \equiv 1 \pmod{x^n}$, where $a_0 \ne 0$. Newton's iteration for the equation $1/B - A = 0$ doubles the number of correct coefficients per step: if $B_k$ is correct modulo $x^k$, then

$$
B_{2k} \equiv B_k\,\big(2 - A\,B_k\big) \pmod{x^{2k}}
$$

Start with $B_1 = a_0^{-1}$. Each step costs a couple of multiplications of size $2k$, so the total is $O(n \log n)$ (a geometric series).

```python
def inverse(a, n):
    """Series b with a*b = 1 mod x^n. Requires a[0] != 0."""
    b = [pow(a[0], MOD - 2, MOD)]
    k = 1
    while k < n:
        k *= 2
        ab = mul(a[:k], b)[:k]
        ab = [(-x) % MOD for x in ab] + [0] * (k - len(ab))
        ab[0] = (ab[0] + 2) % MOD
        b = mul(b, ab)[:k]
    return b[:n]

a = [random.randrange(1, MOD) for _ in range(50)]
for n in (1, 2, 7, 33, 50):
    b = inverse(a, n)
    assert mul(a[:n], b)[:n] == [1] + [0] * (n - 1)
# 1/(1-x) = 1 + x + x^2 + ...
assert inverse([1, MOD - 1], 6) == [1] * 6
```

## Division with remainder

For polynomials $A$ (degree $n-1$) and $B$ (degree $m-1$) find $Q$, $R$ with $A = QB + R$ and $\deg R < m - 1$... Reverse the coefficients: with $A^R(x) = x^{n-1}A(1/x)$, the identity becomes $A^R = Q^R B^R + x^{n-m+1}R^R$, so modulo $x^{n-m+1}$ the remainder disappears:

$$
Q^R \equiv A^R \cdot (B^R)^{-1} \pmod{x^{n-m+1}}
$$

```python
def divmod_poly(a, b):
    a, b = trim(a), trim(b)
    n, m = len(a), len(b)
    if n < m:
        return [0], a
    k = n - m + 1
    q_rev = mul(a[::-1][:k], inverse(b[::-1][:k], k))[:k]
    q = q_rev[::-1]
    r = trim(sub(a, mul(b, q))[: m - 1] or [0])
    return trim(q), r

for _ in range(50):
    a = [random.randrange(MOD) for _ in range(random.randint(1, 60))]
    b = [random.randrange(MOD) for _ in range(random.randint(1, 30))]
    b[-1] = b[-1] or 1
    q, r = divmod_poly(a, b)
    assert trim(add(mul(q, b), r)) == trim(a)
    assert len(trim(r)) < len(trim(b)) or trim(b) == [b[0]]
```

## Derivative, integral, logarithm

$\ln A(x)$ is defined for $a_0 = 1$: its derivative is $A'/A$, so

$$
\ln A = \int \frac{A'}{A}\,dx
$$

```python
def derivative(a):
    return [i * a[i] % MOD for i in range(1, len(a))] or [0]

def integral(a):
    return [0] + [a[i] * pow(i + 1, MOD - 2, MOD) % MOD for i in range(len(a))]

def log(a, n):
    assert a[0] == 1
    da = derivative(a)
    q = mul(da, inverse(a, n))[: n - 1]
    return (integral(q) + [0] * n)[:n]

# ln(1 + x) = x - x^2/2 + x^3/3 - ...
n = 8
series = log([1, 1], n)
expected = [0] + [(-1) ** (k + 1) * pow(k, MOD - 2, MOD) % MOD for k in range(1, n)]
assert series == expected
```

## Exponential (Newton again)

$\exp(A)$ for $a_0 = 0$ solves $\ln G = A$. Newton's iteration: if $G_k$ is correct modulo $x^k$,

$$
G_{2k} \equiv G_k\,\big(1 - \ln G_k + A\big) \pmod{x^{2k}}
$$

```python
def exp(a, n):
    assert a[0] == 0
    g = [1]
    k = 1
    while k < n:
        k *= 2
        lg = log(g + [0] * (k - len(g)), k)
        f = sub((a + [0] * k)[:k], lg)
        f[0] = (f[0] + 1) % MOD
        g = mul(g, f)[:k]
    return g[:n]

# exp(x) = sum x^k / k!
n = 10
fact = [1]
for i in range(1, n):
    fact.append(fact[-1] * i % MOD)
assert exp([0, 1], n) == [pow(f, MOD - 2, MOD) for f in fact]

# exp and log are inverse to each other
a = [0] + [random.randrange(MOD) for _ in range(19)]
assert log(exp(a, 20), 20) == a
```

## Powers

For $A$ with $a_0 = 1$: $A^k = \exp(k \ln A)$, valid for any exponent $k$ (even a huge one, taken modulo $p$ in the coefficient; for the exponent of the constant we use the ordinary power). If the lowest terms vanish, factor out the power of $x$ first.

```python
def power(a, k, n):
    """a^k modulo x^n (a is any polynomial; k >= 0)."""
    first = next((i for i, c in enumerate(a) if c), None)
    if first is None:
        return [1] + [0] * (n - 1) if k == 0 else [0] * n
    if first * k >= n:
        return [0] * n
    c = a[first]
    normalized = [x * pow(c, MOD - 2, MOD) % MOD for x in a[first:]]
    m = n - first * k
    normalized = (normalized + [0] * m)[:m]
    lg = log(normalized, m)
    res = exp([x * (k % MOD) % MOD for x in lg], m)
    scale = pow(c, k, MOD)
    return [0] * (first * k) + [x * scale % MOD for x in res]

def power_naive(a, k, n):
    res = [1] + [0] * (n - 1)
    for _ in range(k):
        res = mul(res, a)[:n]
    return res + [0] * (n - len(res))

for _ in range(20):
    a = [random.randrange(MOD) for _ in range(random.randint(1, 6))]
    k = random.randint(0, 7)
    assert power(a, k, 12) == power_naive(a, k, 12)
assert power([1, 1], 5, 6) == [1, 5, 10, 10, 5, 1]                       # (1 + x)^5
assert power([0, 0, 2, 1], 3, 12)[6:9] == [8, 12, 6]                      # x^6 (2 + x)^3
```

## Evaluation and interpolation

**Multipoint evaluation:** compute $A(x_1), \dots, A(x_m)$. Build a product tree of the linear factors $(x - x_i)$, then push $A$ down the tree taking remainders: $A(x_i) = A \bmod (x - x_i)$. Reducing modulo a product of factors preserves the values at each point in that group. The recursion has depth $\log m$, and total work $O(n \log^2 n)$ with fast division.

```python
def evaluate_many(a, xs):
    def build(lo, hi):
        if hi - lo == 1:
            return [(-xs[lo]) % MOD, 1]
        mid = (lo + hi) // 2
        return mul(build(lo, mid), build(mid, hi))

    def go(poly, lo, hi):
        if hi - lo == 1:
            return [poly[0] if poly else 0]
        mid = (lo + hi) // 2
        left, right = build(lo, mid), build(mid, hi)
        return go(divmod_poly(poly, left)[1], lo, mid) + go(divmod_poly(poly, right)[1], mid, hi)

    return go(trim(a), 0, len(xs))

def horner(a, x):
    r = 0
    for c in reversed(a):
        r = (r * x + c) % MOD
    return r

a = [random.randrange(MOD) for _ in range(20)]
xs = random.sample(range(MOD), 13)
assert evaluate_many(a, xs) == [horner(a, x) for x in xs]
```

(The tree here is rebuilt on the way down for clarity; store it for the true $O(n\log^2 n)$.)

**Interpolation:** find the polynomial of degree $< n$ through $n$ points $(x_i, y_i)$. The Lagrange formula

$$
A(x) = \sum_i y_i \prod_{j \ne i} \frac{x - x_j}{x_i - x_j}
$$

costs $O(n^2)$ directly:

```python
def interpolate(xs, ys):
    n = len(xs)
    total = [0] * n
    full = [1]
    for x in xs:
        full = mul(full, [(-x) % MOD, 1])                      # prod (x - x_j)
    for i in range(n):
        # divide full by (x - x_i) with synthetic division
        q = [0] * n
        carry = 0
        for d in range(n, 0, -1):
            carry = (full[d] + carry * xs[i]) % MOD
            q[d - 1] = carry
        denom = horner(q, xs[i])
        coef = ys[i] * pow(denom, MOD - 2, MOD) % MOD
        total = [(t + coef * c) % MOD for t, c in zip(total, q)]
    return total

xs = random.sample(range(1, MOD), 8)
p = [random.randrange(MOD) for _ in range(8)]
ys = [horner(p, x) for x in xs]
assert interpolate(xs, ys) == p
```

## Polynomial GCD

Polynomials over a field have a Euclidean algorithm, exactly like integers: $\gcd(A, B) = \gcd(B, A \bmod B)$. Normalize the result to be monic.

```python
def poly_gcd(a, b):
    a, b = trim(a), trim(b)
    while b != [0]:
        a, b = b, divmod_poly(a, b)[1]
    inv_lead = pow(a[-1], MOD - 2, MOD)
    return [c * inv_lead % MOD for c in a]

f = mul([MOD - 1, 1], [MOD - 2, 1])                  # (x - 1)(x - 2)
g = mul([MOD - 2, 1], [MOD - 3, 1])                  # (x - 2)(x - 3)
assert poly_gcd(f, g) == [MOD - 2, 1]                # x - 2
assert poly_gcd([1, 1], [2, 1]) == [1]               # coprime
```

The **resultant** of two polynomials, the product of $(\alpha_i - \beta_j)$ over their roots, is computed by the same Euclidean loop while tracking the leading coefficients; it decides whether two polynomials share a root. The half-GCD algorithm speeds the whole thing up to $O(n \log^2 n)$.

## Applications

- **Counting partitions**: the generating function is $\prod_k (1 - x^k)^{-1}$; take $\exp$ of a sum of logarithms.
- **Linear recurrences**: the $N$-th term of a recurrence of order $d$ via $x^N \bmod (\text{characteristic polynomial})$, in $O(d \log d \log N)$ (Kitamasa).
- **Power sums, Stirling numbers, Bell numbers**, and other combinatorial sequences through exponential generating functions.
- **Sums over many points** of a polynomial: multipoint evaluation.

```python
# number of ways to write n as an ordered sum of 1s and 2s: coefficients of 1 / (1 - x - x^2)
ways = inverse([1, MOD - 1, MOD - 1], 12)
assert ways == [1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144]              # Fibonacci numbers
```

## Practice problems

- [CodeChef - RNG](https://www.codechef.com/problems/RNG)
- [CodeForces - Basis Change](https://codeforces.com/gym/102129/problem/D)
- [CodeForces - Permutant](https://codeforces.com/gym/102129/problem/G)
- [CodeForces - Medium Hadron Collider](https://codeforces.com/gym/102129/problem/C)
