---
title: "Extended Euclidean Algorithm"
section: Fundamentals
order: 3
difficulty: intermediate
summary: "Find integers x and y with ax + by = gcd(a, b), and use them to solve linear Diophantine equations."
tags: [gcd, bezout, diophantine, number theory]
prerequisites: [math/euclidean-algorithm]
source:
  title: Extended Euclidean Algorithm
  url: https://cp-algorithms.com/algebra/extended-euclid-algorithm.html
  license: CC BY-SA 4.0
---

The Euclidean algorithm finds $g = \gcd(a, b)$. The **extended** version also finds integers $x, y$ such that

$$
a x + b y = g
$$

(Bézout's identity). These coefficients are the key to modular inverses and to solving equations in integers.

## Algorithm

Let the recursion compute $(x_1, y_1)$ for the pair $(b,\ a \bmod b)$:

$$
b x_1 + (a \bmod b)\, y_1 = g
$$

Since $a \bmod b = a - \lfloor a/b \rfloor \cdot b$, substitute and regroup:

$$
b x_1 + \left(a - \left\lfloor \tfrac{a}{b} \right\rfloor b\right) y_1 = a\, y_1 + b \left(x_1 - \left\lfloor \tfrac{a}{b} \right\rfloor y_1\right) = g
$$

So

$$
x = y_1, \qquad y = x_1 - \left\lfloor \tfrac{a}{b} \right\rfloor y_1
$$

The recursion ends at $b = 0$, where $\gcd(a, 0) = a$ and we can take $x = 1,\ y = 0$.

```python
def extended_gcd(a, b):
    """Return (g, x, y) with a*x + b*y == g == gcd(a, b)."""
    if b == 0:
        return a, 1, 0
    g, x1, y1 = extended_gcd(b, a % b)
    return g, y1, x1 - (a // b) * y1

g, x, y = extended_gcd(240, 46)
assert g == 2 and 240 * x + 46 * y == 2

import math, random
for _ in range(500):
    a, b = random.randint(1, 10 ** 6), random.randint(1, 10 ** 6)
    g, x, y = extended_gcd(a, b)
    assert g == math.gcd(a, b) and a * x + b * y == g
```

The recursion depth is $O(\log \min(a, b))$, so it is safe in Python. The time is the same as ordinary Euclid.

### Iterative version

No recursion, tracking the coefficients of the current and previous remainders:

```python
def extended_gcd_iter(a, b):
    x0, y0, x1, y1 = 1, 0, 0, 1
    while b:
        q = a // b
        a, b = b, a - q * b
        x0, x1 = x1, x0 - q * x1
        y0, y1 = y1, y0 - q * y1
    return a, x0, y0

for a, b in [(240, 46), (17, 5), (100, 75), (0, 7), (7, 0)]:
    g, x, y = extended_gcd_iter(a, b)
    assert g == math.gcd(a, b) and a * x + b * y == g
```

The solution $(x, y)$ is not unique; the algorithm returns one with $|x| \le b/g$ and $|y| \le a/g$.

## Linear Diophantine equations

A **linear Diophantine equation** asks for integer solutions of

$$
a x + b y = c
$$

**Existence.** It is solvable if and only if $g = \gcd(a, b)$ divides $c$. If it does, scale the Bézout coefficients by $c/g$:

$$
x_0 = x \cdot \frac{c}{g}, \qquad y_0 = y \cdot \frac{c}{g}
$$

**All solutions.** From one solution $(x_0, y_0)$ you get every other by shifting in opposite directions:

$$
x = x_0 + k \cdot \frac{b}{g}, \qquad y = y_0 - k \cdot \frac{a}{g}, \qquad k \in \mathbb{Z}
$$

```python
def solve_diophantine(a, b, c):
    """Return one integer solution (x, y) of a*x + b*y == c, or None."""
    g, x, y = extended_gcd(a, b)
    if c % g != 0:
        return None
    return x * (c // g), y * (c // g)

assert solve_diophantine(6, 9, 4) is None            # gcd 3 does not divide 4
x, y = solve_diophantine(6, 9, 21)
assert 6 * x + 9 * y == 21

# generate more solutions from the first one
g = math.gcd(6, 9)
for k in range(-3, 4):
    assert 6 * (x + k * 9 // g) + 9 * (y - k * 6 // g) == 21
```

### Counting solutions in a range

To count (or find the smallest) solutions with $x$ in $[x_{\min}, x_{\max}]$, use the parametrization: $x_0 + k\,(b/g)$ must lie in the interval, which bounds $k$ between two integer ceilings and floors. With Python's exact big integers there are no overflow concerns, but mind the rounding of negative numbers:

```python
def count_solutions(a, b, c, xlo, xhi):
    """Number of integer solutions with xlo <= x <= xhi (a, b > 0)."""
    sol = solve_diophantine(a, b, c)
    if sol is None:
        return 0
    x0, _ = sol
    step = b // math.gcd(a, b)
    # smallest k with x0 + k*step >= xlo, largest k with x0 + k*step <= xhi
    klo = -((x0 - xlo) // step)          # ceil((xlo - x0) / step)
    khi = (xhi - x0) // step             # floor((xhi - x0) / step)
    return max(0, khi - klo + 1)

# brute-force comparison
a, b, c = 6, 9, 21
brute = sum(1 for x in range(-20, 21) if (c - a * x) % b == 0)
assert count_solutions(a, b, c, -20, 20) == brute
```

> [!PYTHON]
> Python's `//` rounds toward minus infinity for negative numbers, so `-(-p // q)` is the idiom for $\lceil p/q \rceil$. This is a common source of off-by-one errors when translating C++ code, where integer division truncates toward zero.

## Related

- The modular inverse of $a$ modulo $m$ is the $x$ in $ax + my = 1$; see [Modular Inverse](/theory/math/modular-inverse).
- Combining congruences: [Chinese Remainder Theorem](/theory/math/chinese-remainder-theorem).

## Practice problems

- [UVA - 10104 - Euclid Problem](https://uva.onlinejudge.org/index.php?option=com_onlinejudge&Itemid=8&page=show_problem&problem=1045)
- [GYM - (J) Once Upon A Time](http://codeforces.com/gym/100963)
- [UVA - 12775 - Gift Dilemma](https://uva.onlinejudge.org/index.php?option=com_onlinejudge&Itemid=8&page=show_problem&problem=4628)
