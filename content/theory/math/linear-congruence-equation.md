---
title: "Linear Congruence Equation"
section: Modular arithmetic
order: 3
difficulty: intermediate
summary: "Solve a·x ≡ b (mod n): when solutions exist, how many there are, and how to list them."
tags: [congruence, modular arithmetic, gcd, extended euclid]
prerequisites: [math/modular-inverse]
source:
  title: "Linear Congruence Equation"
  url: https://cp-algorithms.com/algebra/linear_congruence_equation.html
  license: CC BY-SA 4.0
---

A **linear congruence** is an equation

$$
a x \equiv b \pmod n
$$

with unknown $x$. If $\gcd(a, n) = 1$ then $a$ has a [modular inverse](/theory/math/modular-inverse) and $x \equiv a^{-1} b$. The interesting case is $\gcd(a, n) > 1$.

## Reduction to a Diophantine equation

$a x \equiv b \pmod n$ means $a x + n y = b$ for some integer $y$, a [linear Diophantine equation](/theory/math/linear-diophantine-equations). With $g = \gcd(a, n)$:

- **No solution** if $g \nmid b$.
- Otherwise divide everything by $g$: $a' x \equiv b' \pmod{n'}$ with $a' = a/g$, $b' = b/g$, $n' = n/g$, and now $\gcd(a', n') = 1$, so there is a unique solution modulo $n'$:

$$
x_0 \equiv a'^{-1} b' \pmod{n'}
$$

Modulo the original $n$ there are exactly $g$ solutions:

$$
x = x_0 + k \cdot \frac{n}{g}, \qquad k = 0, 1, \dots, g-1
$$

```python
from math import gcd

def solve_congruence(a, b, n):
    """All x in [0, n) with a*x = b (mod n), as a sorted list."""
    a %= n
    b %= n
    g = gcd(a, n)
    if b % g:
        return []
    a1, b1, n1 = a // g, b // g, n // g
    x0 = b1 * pow(a1, -1, n1) % n1 if n1 > 1 else 0
    return [x0 + k * n1 for k in range(g)]

assert solve_congruence(3, 6, 9) == [2, 5, 8]          # 3*2 = 6, 3*5 = 15 = 6 (mod 9), ...
assert solve_congruence(3, 1, 9) == []                  # gcd 3 does not divide 1
assert solve_congruence(7, 3, 10) == [9]                # invertible: unique solution
assert solve_congruence(0, 0, 5) == [0, 1, 2, 3, 4]     # 0*x = 0 holds for every x
assert solve_congruence(4, 2, 1) == [0]

for n in range(1, 40):
    for a in range(0, 2 * n):
        for b in range(0, n):
            assert solve_congruence(a, b, n) == [x for x in range(n) if (a * x - b) % n == 0]
```

(`pow(a1, -1, n1)` needs Python 3.8; for older versions use the extended Euclidean algorithm.)

The number of solutions is $g$ when $g \mid b$, otherwise $0$. So the equation $ax \equiv b$ has:

| $\gcd(a, n)$ | solutions modulo $n$ |
|-------------|----------------------|
| $1$ | exactly one |
| $g > 1$, $g \mid b$ | exactly $g$, evenly spaced by $n/g$ |
| $g > 1$, $g \nmid b$ | none |

## Systems of congruences

If you have several congruences with different moduli, solve each one to the form $x \equiv r_i \pmod{m_i}$ and combine them with the [Chinese Remainder Theorem](/theory/math/chinese-remainder-theorem):

```python
def solve_system(equations):
    """equations: list of (a, b, n) meaning a*x = b (mod n). Return (x0, modulus) or None (first solution)."""
    r, m = 0, 1
    for a, b, n in equations:
        sols = solve_congruence(a, b, n)
        if not sols:
            return None
        base, step = sols[0], n // len(sols)          # solutions form x = base (mod step)
        # combine x = r (mod m) with x = base (mod step) by brute merge using extended gcd
        g = gcd(m, step)
        if (base - r) % g:
            return None
        lcm = m // g * step
        t = ((base - r) // g * pow(m // g, -1, step // g)) % (step // g) if step // g > 1 else 0
        r, m = (r + m * t) % lcm, lcm
    return r, m

assert solve_system([(3, 6, 9), (1, 2, 4)]) == (2, 12)       # x = 2 mod 3 and x = 2 mod 4
assert solve_system([(1, 1, 4), (1, 2, 6)]) is None          # 1 vs 2 mod 2: contradictory
x0, m = solve_system([(2, 4, 10), (3, 6, 15)])
assert all((2 * x - 4) % 10 == 0 and (3 * x - 6) % 15 == 0 for x in range(x0, x0 + 5 * m, m))
```
