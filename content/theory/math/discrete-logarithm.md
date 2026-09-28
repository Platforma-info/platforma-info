---
title: "Discrete Logarithm"
section: Modular arithmetic
order: 6
difficulty: advanced
summary: "Solve a^x ≡ b (mod m) with baby-step giant-step in O(√m), including the case where a and m are not coprime."
tags: [discrete log, baby-step giant-step, modular arithmetic, meet in the middle]
prerequisites: [math/euler-totient-function, math/modular-inverse]
source:
  title: "Discrete Log"
  url: https://cp-algorithms.com/algebra/discrete-log.html
  license: CC BY-SA 4.0
---

The **discrete logarithm** problem asks for an integer $x$ such that

$$
a^x \equiv b \pmod m
$$

It's the modular counterpart of $\log_a b$. There is no known fast general algorithm (the difficulty of the problem underlies Diffie-Hellman key exchange), but a *meet in the middle* trick brings it from $O(m)$ down to $O(\sqrt m)$.

## Baby-step giant-step (coprime case)

Assume $\gcd(a, m) = 1$. The powers of $a$ are periodic with a period of at most $\varphi(m)$, so if a solution exists there is one with $0 \le x < m$. Write $x = n p - q$ where $n = \lceil \sqrt m \rceil$, $p \in [1, n]$ and $q \in [0, n)$ (every $x$ in $[0, n^2)$ has such a form). The equation becomes

$$
a^{n p - q} \equiv b \iff a^{n p} \equiv b\, a^{q} \pmod m
$$

(we can multiply by $a^q$ because $a$ is invertible.) Both sides are cheap to tabulate:

1. **Baby steps:** compute $b\,a^q$ for every $q = 0, \dots, n$ and store it in a hash table (remember the largest $q$ for each value).
2. **Giant steps:** for $p = 1, 2, \dots, n$ compute $a^{np}$ and look it up. On the first hit, $x = np - q$.

Time and memory: $O(\sqrt m)$.

```python
from math import gcd, isqrt

def dlog_coprime(a, b, m):
    """Smallest x >= 0 with a^x = b (mod m), assuming gcd(a, m) == 1; None if no solution."""
    a %= m
    b %= m
    n = isqrt(m) + 1
    a_n = pow(a, n, m)
    baby = {}
    cur = b
    for q in range(n + 1):
        baby[cur] = q                       # later (larger) q overwrites: gives the smallest x below
        cur = cur * a % m
    cur = 1
    for p in range(1, n + 1):
        cur = cur * a_n % m
        if cur in baby:
            return n * p - baby[cur]
    return None

assert dlog_coprime(2, 3, 5) == 3                          # 2^3 = 8 = 3 (mod 5)
assert dlog_coprime(3, 13, 17) == 4                        # 3^4 = 81 = 13 (mod 17)
assert dlog_coprime(2, 5, 7) is None                       # 5 is not a power of 2 mod 7
```

Why the smallest: the giant step loop finds the smallest $p$, and among equal table values the largest $q$ was stored, and $np - q$ is then minimal.

## Any $a$ and $m$ (not necessarily coprime)

If $g = \gcd(a, m) > 1$, then $a^x \equiv b \pmod m$ with $x \ge 1$ forces $g \mid b$. Divide out $g$ once:

$$
\frac{a}{g}\,a^{x-1} \equiv \frac{b}{g} \pmod{\tfrac{m}{g}}
$$

This is an equation of the form $k \cdot a^{x'} \equiv b' \pmod{m'}$ with a known factor $k$. Repeat until $\gcd(a, m') = 1$ (at most $\log_2 m$ times; $x$ increases by 1 each time), then run the coprime algorithm with the extra factor $k$ on the left side. If at some point $b \equiv k$, then $x$ equals the number of steps already taken.

```python
def dlog(a, b, m):
    """Smallest x >= 0 with a^x = b (mod m), for any a, b, m >= 1; None if there is none."""
    if m == 1:
        return 0
    a %= m
    b %= m
    k, add = 1, 0
    while True:
        g = gcd(a, m)
        if g == 1:
            break
        if b == k:
            return add
        if b % g:
            return None
        b //= g
        m //= g
        add += 1
        k = k * (a // g) % m
    n = isqrt(m) + 1
    a_n = pow(a, n, m)
    baby = {}
    cur = b % m
    for q in range(n + 1):
        baby[cur] = q
        cur = cur * a % m
    cur = k % m
    for p in range(1, n + 1):
        cur = cur * a_n % m
        if cur in baby:
            return n * p - baby[cur] + add
    return None

def dlog_brute(a, b, m):
    for x in range(0, 2 * m + 2):
        if pow(a, x, m) == b % m:
            return x
    return None

for m in range(1, 65):
    for a in range(0, 70):
        for b in range(0, m):
            assert dlog(a, b, m) == dlog_brute(a, b, m), (a, b, m)
```

The exhaustive comparison over all $a < 70$, all $b < m$ and all $m \le 64$ passes, including the non-coprime cases.

## A note on complexity and the hash table

The algorithm balances two costs: making the table takes $n$ steps and the search takes $m/n$ steps; the balance $n = \sqrt m$ minimizes the total. You can shift work between them: if you need many logarithms for the *same* $a$ and $m$, use a bigger baby-step table once (a larger $n$) so each query does fewer giant steps.

For $m$ of about $10^{12}$ the table has a million entries: fine in Python. For a prime modulus of hundreds of bits (cryptography) the algorithm is hopeless, which is exactly the point.

## Applications

- Solving $x^k \equiv a$ ([discrete root](/theory/math/discrete-root)) through a [primitive root](/theory/math/primitive-root).
- Finding the **order** of an element or checking whether $b$ is in the subgroup generated by $a$.
- Puzzles of the type "after how many steps does the sequence $x_{i+1} = a x_i \bmod m$ first reach $b$?".

```python
# after how many steps does x -> 7x mod 1000003 starting from 1 first reach 123456?
steps = dlog(7, 123456, 1000003)
assert steps is not None and pow(7, steps, 1000003) == 123456
```

## Practice problems

- [Spoj - Power Modulo Inverted](http://www.spoj.com/problems/MOD/)
- [Topcoder - SplittingFoxes3](https://community.topcoder.com/stat?c=problem_statement&pm=14386&rd=16801)
- [CodeChef - Inverse of a Function](https://www.codechef.com/problems/INVXOR/)
- [Hard Equation](https://codeforces.com/gym/101853/problem/G) (assume that $0^0$ is undefined)
- [CodeChef - Chef and Modular Sequence](https://www.codechef.com/problems/CHEFMOD)
