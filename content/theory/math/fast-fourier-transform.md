---
title: "Fast Fourier Transform and Number Theoretic Transform"
section: Big numbers and polynomials
order: 1
difficulty: advanced
summary: "Multiply polynomials and big numbers in O(n log n): the complex FFT, the exact NTT modulo 998244353, arbitrary moduli, and a big-integer shortcut that is uniquely fast in Python."
tags: [fft, ntt, convolution, polynomial multiplication, kronecker]
prerequisites: [math/primitive-root, math/garners-algorithm]
source:
  title: "Fast Fourier transform"
  url: https://cp-algorithms.com/algebra/fft.html
  license: CC BY-SA 4.0
---

Multiplying two polynomials of degree $n$ by the definition takes $O(n^2)$. The **Fast Fourier Transform** (FFT) does it in $O(n \log n)$. Since a big number is a polynomial in its base, the same technique multiplies huge integers, and many counting problems are secretly convolutions.

## The idea: evaluate, multiply pointwise, interpolate

A polynomial of degree $< n$ is determined by its values at $n$ distinct points. The product $C = A \cdot B$ has degree $< 2n - 1$, so evaluate $A$ and $B$ at $N \ge 2n-1$ points, multiply the values **pointwise** ($O(N)$), and interpolate back. Evaluating at arbitrary points costs $O(n^2)$, but if the points are the $N$-th **roots of unity**

$$
w_k = e^{2\pi i k / N}, \qquad k = 0, \dots, N-1
$$

then divide and conquer works. The values $A(w_k)$ are the **discrete Fourier transform** (DFT) of the coefficient vector.

## Fast Fourier transform

Split $A(x) = A_0(x^2) + x\,A_1(x^2)$ into even- and odd-indexed coefficients. With $N$ even, $w_k^2$ takes only $N/2$ distinct values (the roots of unity of order $N/2$) and $w_{k+N/2} = -w_k$. Therefore for $k < N/2$:

$$
A(w_k) = A_0(w_k^2) + w_k\,A_1(w_k^2), \qquad A(w_{k+N/2}) = A_0(w_k^2) - w_k\,A_1(w_k^2)
$$

so a transform of size $N$ reduces to two of size $N/2$ plus $O(N)$ work: $T(N) = 2T(N/2) + O(N) = O(N \log N)$.

```python
import cmath

def fft(a, invert=False):
    """Recursive complex FFT; len(a) must be a power of two."""
    n = len(a)
    if n == 1:
        return a[:]
    even = fft(a[0::2], invert)
    odd = fft(a[1::2], invert)
    angle = 2 * cmath.pi / n * (-1 if invert else 1)
    w, wn = 1, cmath.exp(1j * angle)
    result = [0] * n
    for k in range(n // 2):
        t = w * odd[k]
        result[k] = even[k] + t
        result[k + n // 2] = even[k] - t
        w *= wn
    return result

def multiply_fft(a, b):
    """Product of two integer polynomials via floating-point FFT (rounded)."""
    n = 1
    while n < len(a) + len(b) - 1:
        n *= 2
    fa = fft([complex(x) for x in a] + [0] * (n - len(a)))
    fb = fft([complex(x) for x in b] + [0] * (n - len(b)))
    prod = fft([x * y for x, y in zip(fa, fb)], invert=True)
    return [round(x.real / n) for x in prod[: len(a) + len(b) - 1]]

def multiply_naive(a, b):
    res = [0] * (len(a) + len(b) - 1)
    for i, x in enumerate(a):
        for j, y in enumerate(b):
            res[i + j] += x * y
    return res

assert multiply_fft([1, 2, 3], [4, 5]) == [4, 13, 22, 15]           # (1+2x+3x^2)(4+5x)
import random
random.seed(1)
for _ in range(100):
    a = [random.randint(-50, 50) for _ in range(random.randint(1, 40))]
    b = [random.randint(-50, 50) for _ in range(random.randint(1, 40))]
    assert multiply_fft(a, b) == multiply_naive(a, b)
```

The **inverse transform** is the same algorithm with $w_k^{-1}$ instead of $w_k$, followed by division by $N$ (the code above does the division at the end).

> [!WARNING]
> Floating-point FFT has rounding error that grows with the size and the magnitude of coefficients. Coefficients up to about $10^6$ with $N \le 2^{18}$ are typically safe in doubles; for exact results with larger numbers use the NTT below.

## Number theoretic transform (NTT)

The FFT only needs a number $w$ with two properties: $w^N = 1$ and $w^k \ne 1$ for $0 < k < N$ (a *primitive $N$-th root of unity*). Such elements exist in modular arithmetic too. If $p = c\cdot 2^k + 1$ is prime and $g$ is a [primitive root](/theory/math/primitive-root), then $g^{(p-1)/N}$ is a primitive $N$-th root of unity for every power of two $N \mid 2^k$. The transform then works over integers modulo $p$, **exactly**, with no rounding.

The classic modulus: $p = 998244353 = 119 \cdot 2^{23} + 1$, root $g = 3$, allowing sizes up to $2^{23}$.

```python
MOD = 998244353
G = 3

def ntt(a, invert=False):
    """In-place style iterative NTT (returns a new list). len(a) must be a power of two <= 2^23."""
    n = len(a)
    a = a[:]
    j = 0
    for i in range(1, n):                          # bit-reversal permutation
        bit = n >> 1
        while j & bit:
            j ^= bit
            bit >>= 1
        j ^= bit
        if i < j:
            a[i], a[j] = a[j], a[i]
    length = 2
    while length <= n:
        w = pow(G, (MOD - 1) // length, MOD)
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

def multiply_ntt(a, b):
    """Product of two polynomials modulo 998244353."""
    need = len(a) + len(b) - 1
    n = 1
    while n < need:
        n *= 2
    fa = ntt(a + [0] * (n - len(a)))
    fb = ntt(b + [0] * (n - len(b)))
    return ntt([x * y % MOD for x, y in zip(fa, fb)], invert=True)[:need]

for _ in range(100):
    a = [random.randrange(MOD) for _ in range(random.randint(1, 60))]
    b = [random.randrange(MOD) for _ in range(random.randint(1, 60))]
    assert multiply_ntt(a, b) == [x % MOD for x in multiply_naive(a, b)]
```

The loop structure is the standard iterative FFT: first permute the input by reversing the bits of the indices, then combine pairs of size $1$, $2$, $4$, ... in place ("butterfly" operations).

Other NTT-friendly primes with primitive root 3: $167772161 = 5\cdot 2^{25}+1$ and $469762049 = 7 \cdot 2^{26}+1$.

## Multiplication modulo an arbitrary number

For a modulus like $10^9+7$ (not NTT-friendly), compute the product **exactly** (coefficients up to $n \cdot 10^{18}$) using three NTT primes whose product exceeds that bound, and combine the three residues with [Garner's algorithm](/theory/math/garners-algorithm):

```python
PRIMES = [998244353, 167772161, 469762049]

def ntt_mod(a, mod, invert=False, g=3):
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
        w = pow(g, (mod - 1) // length, mod)
        if invert:
            w = pow(w, mod - 2, mod)
        half = length // 2
        ws = [1] * half
        for k in range(1, half):
            ws[k] = ws[k - 1] * w % mod
        for start in range(0, n, length):
            for k in range(half):
                u = a[start + k]
                v = a[start + k + half] * ws[k] % mod
                a[start + k] = (u + v) % mod
                a[start + k + half] = (u - v) % mod
        length <<= 1
    if invert:
        n_inv = pow(n, mod - 2, mod)
        a = [x * n_inv % mod for x in a]
    return a

def multiply_any_mod(a, b, mod):
    need = len(a) + len(b) - 1
    n = 1
    while n < need:
        n *= 2
    residues = []
    for p in PRIMES:
        fa = ntt_mod([x % p for x in a] + [0] * (n - len(a)), p)
        fb = ntt_mod([x % p for x in b] + [0] * (n - len(b)), p)
        residues.append(ntt_mod([x * y % p for x, y in zip(fa, fb)], p, invert=True)[:need])
    p1, p2, p3 = PRIMES
    inv12 = pow(p1, -1, p2)
    inv123 = pow(p1 * p2, -1, p3)
    out = []
    for r1, r2, r3 in zip(*residues):
        x1 = r1
        x2 = (r2 - x1) * inv12 % p2
        x3 = ((r3 - x1 - x2 * p1) * inv123) % p3
        out.append((x1 + x2 * p1 + x3 * p1 * p2) % mod)     # Garner: mixed radix evaluated mod `mod`
    return out

M = 10 ** 9 + 7
for _ in range(30):
    a = [random.randrange(M) for _ in range(random.randint(1, 50))]
    b = [random.randrange(M) for _ in range(random.randint(1, 50))]
    assert multiply_any_mod(a, b, M) == [x % M for x in multiply_naive(a, b)]
```

## A Python shortcut: multiplication with big integers (Kronecker substitution)

CPython multiplies huge integers with the Karatsuba algorithm **in C**. So we can let Python's `int` do the convolution: pack the coefficients into one big integer with enough bits per coefficient to avoid overlap, multiply the integers, then unpack. If every coefficient is below $B$ and the polynomials have at most $n$ terms, each product coefficient is below $n B^2$, so $k$ bits per slot with $2^k > nB^2$ suffice.

```python
def multiply_kronecker(a, b):
    """Exact product of polynomials with non-negative integer coefficients."""
    n = min(len(a), len(b))
    biggest = max(max(a), max(b), 1)
    bits = 2 * biggest.bit_length() + n.bit_length() + 1
    nbytes = (bits + 7) // 8
    A = int.from_bytes(b"".join(x.to_bytes(nbytes, "little") for x in a), "little")
    B = int.from_bytes(b"".join(x.to_bytes(nbytes, "little") for x in b), "little")
    C = A * B
    raw = C.to_bytes(nbytes * (len(a) + len(b)), "little")
    return [int.from_bytes(raw[i * nbytes : (i + 1) * nbytes], "little") for i in range(len(a) + len(b) - 1)]

for _ in range(100):
    a = [random.randrange(10 ** 9) for _ in range(random.randint(1, 60))]
    b = [random.randrange(10 ** 9) for _ in range(random.randint(1, 60))]
    assert multiply_kronecker(a, b) == multiply_naive(a, b)
```

We measured two random polynomials with 30-bit coefficients:

| terms | naive | pure-Python NTT (mod 998244353) | Kronecker |
|-------|-------|---------------------------------|-----------|
| 1,024 | 0.21 s | 15 ms | 3 ms |
| 4,096 | (minutes) | 71 ms | 22 ms |
| 16,384 | – | 356 ms | 173 ms |

The exact integer product beats the hand-written NTT while being 6 lines long and needing no modulus at all; reduce the coefficients afterwards if needed. For negative coefficients, shift by an offset or split into positive and negative parts.

## Applications

### All possible sums

Given two sets of numbers, which sums $a + b$ are attainable? Build the indicator polynomials $\sum x^{a}$ and $\sum x^{b}$; the exponents present in the product are the attainable sums (and their coefficients count the number of ways).

```python
def possible_sums(A, B):
    pa = [0] * (max(A) + 1)
    pb = [0] * (max(B) + 1)
    for x in A:
        pa[x] = 1
    for x in B:
        pb[x] = 1
    prod = multiply_kronecker(pa, pb)
    return {s: c for s, c in enumerate(prod) if c}

sums = possible_sums([1, 3, 4], [2, 3])
assert sums == {3: 1, 4: 1, 5: 1, 6: 2, 7: 1}          # 6 = 3+3 = 4+2
assert set(sums) == {a + b for a in [1, 3, 4] for b in [2, 3]}
```

### All scalar products of cyclic shifts

To compute $\sum_i a_i\, b_{(i + s) \bmod n}$ for every shift $s$, reverse one array and convolve: the shifted dot products are the "correlation" of $a$ and $b$.

```python
def cyclic_correlation(a, b):
    n = len(a)
    doubled = b + b
    prod = multiply_kronecker(a[::-1], doubled)
    return [prod[n - 1 + s] for s in range(n)]

a, b = [1, 2, 3, 4], [5, 6, 7, 8]
expected = [sum(a[i] * b[(i + s) % 4] for i in range(4)) for s in range(4)]
assert cyclic_correlation(a, b) == expected
```

### String matching with wildcards

Match pattern $P$ against text $T$ where the character `*` matches anything. Map letters to $1..26$ and wildcards to $0$. Position $i$ matches exactly when

$$
\sum_{j} P_j\, T_{i+j}\,(P_j - T_{i+j})^2 = 0
$$

(each term is non-negative and vanishes only for a wildcard or equal letters). Expanding gives three convolutions.

```python
def wildcard_match(text, pattern):
    def code(c):
        return 0 if c == "*" else ord(c) - 96
    T = [code(c) for c in text]
    P = [code(c) for c in pattern][::-1]                 # reverse: turns correlation into convolution
    m = len(pattern)
    t1, t2, t3 = T, [x * x for x in T], [x ** 3 for x in T]
    p1, p2, p3 = P, [x * x for x in P], [x ** 3 for x in P]
    c1 = multiply_kronecker(t1, p3)                      # T   * P^3
    c2 = multiply_kronecker(t2, p2)                      # T^2 * P^2
    c3 = multiply_kronecker(t3, p1)                      # T^3 * P
    out = []
    for i in range(len(text) - m + 1):
        k = i + m - 1
        if c1[k] - 2 * c2[k] + c3[k] == 0:
            out.append(i)
    return out

assert wildcard_match("abcabcab", "ab*") == [0, 3]
assert wildcard_match("a*c", "abc") == [0]

def wildcard_naive(text, pattern):
    return [i for i in range(len(text) - len(pattern) + 1)
            if all(p == "*" or t == "*" or p == t for p, t in zip(pattern, text[i:i + len(pattern)]))]

for _ in range(200):
    text = "".join(random.choice("ab*") for _ in range(random.randint(1, 20)))
    pat = "".join(random.choice("ab*") for _ in range(random.randint(1, 5)))
    assert wildcard_match(text, pat) == wildcard_naive(text, pat)
```

## Choosing a method

| Task | Best tool in Python |
|------|---------------------|
| product of integer polynomials, exact | Kronecker substitution (big-int `*`) |
| product modulo 998244353 | NTT, or Kronecker followed by `% MOD` |
| product modulo other $m$ | Kronecker followed by `% m` |
| multiplication of huge integers | just use `*` (Karatsuba built in) |
| you need the transform itself (for pointwise operations, polynomial inverse, ...) | NTT |

## Practice problems

- [SPOJ - POLYMUL](http://www.spoj.com/problems/POLYMUL/)
- [SPOJ - MAXMATCH](http://www.spoj.com/problems/MAXMATCH/)
- [SPOJ - ADAMATCH](http://www.spoj.com/problems/ADAMATCH/)
- [Codeforces - Yet Another String Matching Problem](http://codeforces.com/problemset/problem/954/I)
- [Codeforces - Lightsabers (hard)](http://codeforces.com/problemset/problem/958/F3)
- [Codeforces - Running Competition](https://codeforces.com/contest/1398/problem/G)
- [Kattis - A+B Problem](https://open.kattis.com/problems/aplusb)
- [Kattis - K-Inversions](https://open.kattis.com/problems/kinversions)
- [Codeforces - Dasha and cyclic table](http://codeforces.com/contest/754/problem/E)
- [CodeChef - Expected Number of Customers](https://www.codechef.com/COOK112A/problems/MMNN01)
- [CodeChef - Power Sum](https://www.codechef.com/SEPT19A/problems/PSUM)
- [Codeforces - Centroid Probabilities](https://codeforces.com/problemset/problem/1667/E)
