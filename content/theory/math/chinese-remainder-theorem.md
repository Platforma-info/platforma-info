---
title: "Chinese Remainder Theorem"
section: Modular arithmetic
order: 2
difficulty: advanced
summary: "Combine congruences x ≡ a_i (mod m_i) into a single one, first for coprime moduli, then for arbitrary moduli."
tags: [crt, congruences, modular arithmetic]
prerequisites: [math/modular-inverse]
source:
  title: Chinese Remainder Theorem
  url: https://cp-algorithms.com/algebra/chinese-remainder-theorem.html
  license: CC BY-SA 4.0
---

Suppose you know the remainders of an unknown number $x$ modulo several different numbers:

$$
\begin{cases}
x \equiv a_1 \pmod{m_1} \\
x \equiv a_2 \pmod{m_2} \\
\quad\vdots \\
x \equiv a_k \pmod{m_k}
\end{cases}
$$

The **Chinese Remainder Theorem** (CRT) says that when the moduli are pairwise coprime, there is exactly one solution modulo $M = m_1 m_2 \cdots m_k$. It lets you split a computation modulo a large composite number into computations modulo small pieces, or recover a large number from its residues.

*Example.* $x \equiv 2 \pmod 3$, $x \equiv 3 \pmod 5$, $x \equiv 2 \pmod 7$ gives $x \equiv 23 \pmod{105}$.

## Two congruences

Solve $x \equiv a_1 \pmod{m_1}$ and $x \equiv a_2 \pmod{m_2}$ with $\gcd(m_1, m_2) = 1$. Look for $x = a_1 + m_1 t$. The second congruence becomes

$$
m_1 t \equiv a_2 - a_1 \pmod{m_2} \quad\Longrightarrow\quad t \equiv (a_2 - a_1)\, m_1^{-1} \pmod{m_2}
$$

and $m_1^{-1} \bmod m_2$ exists because they are coprime. With `pow(m1, -1, m2)`:

```python
def crt_two(a1, m1, a2, m2):
    """Coprime moduli: return the unique x in [0, m1*m2)."""
    t = (a2 - a1) * pow(m1, -1, m2) % m2
    return a1 + m1 * t

assert crt_two(2, 3, 3, 5) == 8
assert crt_two(2, 3, 3, 5) % 3 == 2 and crt_two(2, 3, 3, 5) % 5 == 3
```

## Many congruences

Apply the two-congruence merge repeatedly: after merging the first $i$ equations you have a single congruence $x \equiv r \pmod{M}$, which you combine with equation $i + 1$.

Making the merge work for **non-coprime** moduli only needs the extended Euclidean algorithm. With $g = \gcd(m_1, m_2)$ a solution exists if and only if $a_1 \equiv a_2 \pmod g$, and then the combined modulus is $\text{lcm}(m_1, m_2)$:

```python
from math import gcd

def extended_gcd(a, b):
    if b == 0:
        return a, 1, 0
    g, x1, y1 = extended_gcd(b, a % b)
    return g, y1, x1 - (a // b) * y1

def merge(a1, m1, a2, m2):
    """Combine x = a1 (mod m1) and x = a2 (mod m2); return (a, lcm) or None if impossible."""
    g, p, _ = extended_gcd(m1, m2)          # m1*p + m2*q = g
    if (a2 - a1) % g != 0:
        return None
    lcm = m1 // g * m2
    # x = a1 + m1 * t, with m1 * t = a2 - a1 (mod m2)  ->  t = (a2 - a1)/g * p (mod m2/g)
    t = (a2 - a1) // g * p % (m2 // g)
    return (a1 + m1 * t) % lcm, lcm

def crt(remainders, moduli):
    """Smallest non-negative x with x = r_i (mod m_i) for all i, plus the combined modulus."""
    a, m = 0, 1
    for r, mod in zip(remainders, moduli):
        merged = merge(a, m, r % mod, mod)
        if merged is None:
            return None
        a, m = merged
    return a, m

assert crt([2, 3, 2], [3, 5, 7]) == (23, 105)              # the classic example
assert crt([1, 3], [4, 6]) == (9, 12)                       # non-coprime, solvable
assert crt([1, 2], [4, 6]) is None                          # 1 != 2 (mod gcd = 2): no solution
assert crt([], []) == (0, 1)
```

Python's exact integers mean there are no overflow issues while the modulus grows, but the combined modulus can become huge, which is expected.

Brute-force check on small random systems:

```python
import random

random.seed(7)
for _ in range(300):
    mods = [random.randint(1, 12) for _ in range(3)]
    rems = [random.randrange(m) for m in mods]
    brute = next((x for x in range(0, 12 * 11 * 10 * 9 + 1) if all(x % m == r for r, m in zip(rems, mods))), None)
    result = crt(rems, mods)
    if result is None:
        assert brute is None
    else:
        assert brute == result[0]
```

## Direct construction (coprime moduli)

An alternative closed form: let $M = \prod m_i$, $M_i = M / m_i$ and $N_i = M_i^{-1} \bmod m_i$. Then

$$
x \equiv \sum_{i=1}^{k} a_i\, M_i\, N_i \pmod M
$$

because the $i$-th term is $\equiv a_i$ modulo $m_i$ and $\equiv 0$ modulo every other $m_j$.

```python
from math import prod

def crt_direct(remainders, moduli):
    M = prod(moduli)
    x = 0
    for a, m in zip(remainders, moduli):
        Mi = M // m
        x += a * Mi * pow(Mi, -1, m)
    return x % M

assert crt_direct([2, 3, 2], [3, 5, 7]) == 23
```

## Applications

- **Big numbers by pieces**: compute a value modulo several small primes, then reconstruct it (used in NTT-based big multiplication and *Garner's algorithm*).
- **Reducing a hard modulus**: $m = 2^{10} \cdot 3^5 \cdot 7$ can be handled prime power by prime power, then combined.
- **Puzzles** of the form "when do events with periods $m_i$ and offsets $a_i$ coincide?"

## Practice problems

- [Google Code Jam - Golf Gophers](https://github.com/google/coding-competitions-archive/blob/main/codejam/2019/round_1a/golf_gophers/statement.pdf)
- [Hackerrank - Number of sequences](https://www.hackerrank.com/contests/w22/challenges/number-of-sequences)
- [Codeforces - Remainders Game](http://codeforces.com/problemset/problem/687/B)
