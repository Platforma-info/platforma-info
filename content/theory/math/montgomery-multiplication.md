---
title: "Montgomery Multiplication"
section: Modular arithmetic
order: 9
difficulty: advanced
summary: "Multiply modulo n without dividing by n, by working in a representation where division is a bit shift."
tags: [montgomery, modular multiplication, bit tricks, reduction]
prerequisites: [math/binary-exponentiation, math/bit-manipulation]
source:
  title: "Montgomery Multiplication"
  url: https://cp-algorithms.com/algebra/montgomery_multiplication.html
  license: CC BY-SA 4.0
---

Modular multiplication $a \cdot b \bmod n$ costs a **division** by $n$, which is slow compared to a multiplication or a shift. **Montgomery multiplication** avoids it: numbers are kept in a special form in which the reduction modulo $n$ is done with one multiplication and a shift by a power of two. It is standard in cryptographic libraries, and useful in C++ when you do millions of modular multiplications (for example in [Miller-Rabin](/theory/math/primality-tests) with 64-bit moduli).

> [!PYTHON]
> In CPython a single `a * b % n` is already one C-level operation on small integers; interpreting several Python operations for Montgomery's steps is *slower*. So this article is about understanding the technique (and its bit-level structure), not about a Python speedup. We test it against `%` for correctness.

## Montgomery representation

Let $n$ be **odd** and choose $R = 2^k > n$ (a power of two, so division by $R$ is a shift). The *Montgomery form* of $x$ is

$$
\bar x = x R \bmod n
$$

Adding, subtracting and comparing Montgomery forms work as usual (mod $n$). For multiplication, $\bar a \cdot \bar b = ab R^2$, but we want $\overline{ab} = abR$, so we must divide by $R$ **modulo $n$**. That operation is the *Montgomery reduction*:

$$
\text{REDC}(T) = T R^{-1} \bmod n
$$

## Montgomery reduction

We need $T R^{-1} \bmod n$ for $0 \le T < nR$ without a division by $n$.

Precompute $n' = -n^{-1} \bmod R$, so that $n \cdot n' \equiv -1 \pmod R$. Let

$$
m = (T \bmod R)\cdot n' \bmod R, \qquad t = \frac{T + m n}{R}
$$

Then $T + mn \equiv T - T \equiv 0 \pmod R$ (since $m n \equiv -T \pmod R$), so the division by $R$ is exact — a shift. And $t \equiv T R^{-1} \pmod n$ because $mn$ is a multiple of $n$. Finally $t < 2n$, so one conditional subtraction gives the answer in $[0, n)$.

```python
class Montgomery:
    def __init__(self, n, bits=None):
        assert n % 2 == 1 and n > 1, "modulus must be odd"
        self.n = n
        self.bits = bits or n.bit_length()
        self.R = 1 << self.bits
        self.mask = self.R - 1
        self.n_prime = (-pow(n, -1, self.R)) & self.mask          # -n^{-1} mod R
        self.r2 = self.R * self.R % n                              # R^2 mod n, to enter the form

    def reduce(self, T):
        """T * R^{-1} mod n for 0 <= T < n*R."""
        m = ((T & self.mask) * self.n_prime) & self.mask
        t = (T + m * self.n) >> self.bits
        return t - self.n if t >= self.n else t

    def to_mont(self, x):
        return self.reduce((x % self.n) * self.r2)                # x * R^2 / R = x R

    def from_mont(self, x_bar):
        return self.reduce(x_bar)

    def mul(self, a_bar, b_bar):
        return self.reduce(a_bar * b_bar)

    def pow(self, base, exponent):
        result = self.to_mont(1)
        b = self.to_mont(base)
        while exponent:
            if exponent & 1:
                result = self.mul(result, b)
            b = self.mul(b, b)
            exponent >>= 1
        return self.from_mont(result)

M = Montgomery(1_000_000_007)
a, b = 123456789, 987654321
assert M.from_mont(M.mul(M.to_mont(a), M.to_mont(b))) == a * b % 1_000_000_007

import random
random.seed(1)
for n in (3, 7, 101, 65537, 1_000_000_007, 998_244_353, (1 << 61) - 1, (1 << 63) - 25):
    mont = Montgomery(n)
    for _ in range(200):
        x, y = random.randrange(n), random.randrange(n)
        assert mont.from_mont(mont.mul(mont.to_mont(x), mont.to_mont(y))) == x * y % n
    assert mont.pow(random.randrange(n), random.randrange(10 ** 6)) is not None
    z, e = random.randrange(1, n), random.randrange(10 ** 5)
    assert mont.pow(z, e) == pow(z, e, n)
```

`to_mont(x)` multiplies by $R^2 \bmod n$ and reduces, giving $x R^2 R^{-1} = xR$. `from_mont` is one reduction of the form itself: $\bar x R^{-1} = x$.

## The fast inverse trick

Computing $n' = -n^{-1} \bmod 2^k$ does not need the extended Euclid algorithm. Newton's method **doubles the number of correct bits** per step: if $x n \equiv 1 \pmod{2^j}$, then $x' = x(2 - n x)$ satisfies $x' n \equiv 1 \pmod{2^{2j}}$. Since every odd $n$ satisfies $n \cdot n \equiv 1 \pmod 8$, start from $x = n$ (3 correct bits) and iterate:

```python
def inverse_mod_pow2(n, bits):
    x = n                                           # correct to 3 bits (n*n = 1 mod 8)
    correct = 3
    mask = (1 << bits) - 1
    while correct < bits:
        x = x * (2 - n * x) & mask
        correct *= 2
    return x

for n in (3, 7, 101, 65537, 1_000_000_007, (1 << 61) - 1):
    for bits in (16, 32, 64, 128):
        inv = inverse_mod_pow2(n, bits)
        assert inv * n % (1 << bits) == 1
```

For 64 bits this takes 5 iterations of a multiply-subtract-multiply, so setup is cheap.

## Why this is worthwhile in C++

For 64-bit moduli, `a * b % n` needs a 128-bit intermediate and a 128-by-64-bit division (tens of cycles). Montgomery's REDC uses two 64x64 multiplications, a shift and a compare (a handful of cycles). In a modular-exponentiation-heavy algorithm (Miller-Rabin, Pollard's rho) the saving is a large constant factor.
