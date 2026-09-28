---
title: "Euclidean Algorithm (GCD and LCM)"
section: Fundamentals
order: 2
difficulty: beginner
summary: "Compute the greatest common divisor in O(log min(a, b)) steps, derive the LCM from it, and learn the modulo-free binary variant."
tags: [gcd, lcm, number theory, euclid]
prerequisites: [math/binary-exponentiation]
source:
  title: Euclidean algorithm for computing the greatest common divisor
  url: https://cp-algorithms.com/algebra/euclid-algorithm.html
  license: CC BY-SA 4.0
---

The **greatest common divisor** $\gcd(a, b)$ of two integers is the largest integer that divides both. For example $\gcd(12, 18) = 6$, and by convention $\gcd(a, 0) = a$.

Trying every candidate divisor is $O(\min(a, b))$, far too slow for numbers like $10^{18}$. The Euclidean algorithm, over two thousand years old, needs only a logarithmic number of steps.

## The algorithm

The key identity is:

$$
\gcd(a, b) = \begin{cases}
a & b = 0 \\
\gcd(b,\ a \bmod b) & b \neq 0
\end{cases}
$$

**Why it is true.** Write $a = q b + r$ with $r = a \bmod b$. Any number that divides both $a$ and $b$ also divides $r = a - qb$. Conversely, any number that divides $b$ and $r$ divides $a = qb + r$. So the pairs $(a, b)$ and $(b, r)$ have exactly the same common divisors, hence the same greatest one.

Each step replaces the pair by a smaller one, and the second number strictly decreases until it reaches $0$.

```python
def gcd_rec(a, b):
    return a if b == 0 else gcd_rec(b, a % b)

def gcd(a, b):
    while b:
        a, b = b, a % b
    return abs(a)

assert gcd(12, 18) == 6
assert gcd(17, 5) == 1
assert gcd(0, 9) == 9 and gcd(9, 0) == 9
assert gcd_rec(1071, 462) == gcd(1071, 462) == 21
```

A run on $(1071, 462)$:

| $a$ | $b$ | $a \bmod b$ |
|-----|-----|------------|
| 1071 | 462 | 147 |
| 462 | 147 | 21 |
| 147 | 21 | 0 |
| 21 | 0 | |

> [!PYTHON]
> `math.gcd(a, b)` does exactly this in C and accepts any number of arguments in Python 3.9+: `math.gcd(12, 18, 30) == 6`. In a solution, just call it; write the loop yourself when you need to understand or extend it (see [extended Euclid](/theory/math/extended-euclidean-algorithm)).

```python
import math
from functools import reduce

assert math.gcd(12, 18) == 6
assert math.gcd(12, 18, 30) == 6                          # Python 3.9+
assert reduce(math.gcd, [24, 36, 60]) == 12               # works on any version
```

## Time complexity

The loop runs $O(\log \min(a, b))$ times. After two consecutive steps the larger number at least halves, because $a \bmod b < a/2$ whenever $a \ge b$.

The worst case is a pair of consecutive **Fibonacci numbers** (Lamé's theorem): each quotient is $1$ and the numbers shrink as slowly as possible.

```python
def steps(a, b):
    n = 0
    while b:
        a, b = b, a % b
        n += 1
    return n

fib = [1, 1]
while len(fib) < 60:
    fib.append(fib[-1] + fib[-2])

# gcd(F_{k+1}, F_k) takes k - 1 steps: about 1.44 * log2(a) at worst
assert steps(fib[30], fib[29]) == 29
assert steps(10 ** 18, 3 * 10 ** 17) < 100
```

## Least common multiple

The LCM is the smallest positive number divisible by both. Because $\gcd(a, b) \cdot \text{lcm}(a, b) = a \cdot b$,

$$
\text{lcm}(a, b) = \frac{a}{\gcd(a, b)} \cdot b
$$

Dividing before multiplying keeps intermediate values small (matters in C++; harmless in Python).

```python
def lcm(a, b):
    return a // math.gcd(a, b) * b

assert lcm(4, 6) == 12
assert lcm(21, 6) == 42
assert reduce(lcm, range(1, 11)) == 2520        # smallest number divisible by 1..10
assert math.lcm(4, 6) == 12                       # built in since Python 3.9
```

## Binary GCD

The modulo operation is slower than additions, subtractions and shifts. The **binary GCD** avoids it using three facts:

- if both numbers are even: $\gcd(2a, 2b) = 2\gcd(a, b)$;
- if exactly one is even (say $2a$ and odd $b$): $\gcd(2a, b) = \gcd(a, b)$;
- if both are odd: $\gcd(a, b) = \gcd(b, a - b)$, and $a - b$ is even.

```python
def binary_gcd(a, b):
    if a == 0 or b == 0:
        return a | b
    shift = ((a | b) & -(a | b)).bit_length() - 1      # number of common factors of 2
    a >>= (a & -a).bit_length() - 1                    # make a odd
    while b:
        b >>= (b & -b).bit_length() - 1                # make b odd
        if a > b:
            a, b = b, a
        b -= a
    return a << shift

assert binary_gcd(48, 18) == 6
assert binary_gcd(0, 5) == 5
assert all(binary_gcd(a, b) == math.gcd(a, b) for a in range(60) for b in range(60))
```

`x & -x` isolates the lowest set bit, so `(x & -x).bit_length() - 1` counts trailing zeros.

> [!NOTE]
> In C++ the binary version can be noticeably faster. In Python the built-in `math.gcd` is always the fastest option, so the binary GCD is here purely as an algorithmic idea.

## Applications

- **Reducing a fraction**: divide numerator and denominator by their gcd.
- **Coprimality**: $a$ and $b$ are coprime exactly when $\gcd(a, b) = 1$.
- **Solving equations** $ax + by = c$ and computing modular inverses: [extended Euclid](/theory/math/extended-euclidean-algorithm).
- **GCD of an array**: fold with `gcd`. Since the running value can only shrink, this takes $O(n + \log \max)$ amortized.

```python
def reduce_fraction(p, q):
    g = math.gcd(p, q)
    return p // g, q // g

assert reduce_fraction(84, 36) == (7, 3)
```

## Practice problems

- [CSAcademy - Greatest Common Divisor](https://csacademy.com/contest/archive/task/gcd/)
- [Codeforces 1916B - Two Divisors](https://codeforces.com/contest/1916/problem/B)
