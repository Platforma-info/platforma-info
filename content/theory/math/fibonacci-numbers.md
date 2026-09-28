---
title: "Fibonacci Numbers"
section: Fundamentals
order: 4
difficulty: intermediate
summary: "Properties of Fibonacci numbers and four ways to compute F(n): linear, matrix power, fast doubling and modulo-p with the Pisano period."
tags: [fibonacci, matrices, fast doubling, pisano]
prerequisites: [math/binary-exponentiation]
source:
  title: Fibonacci Numbers
  url: https://cp-algorithms.com/algebra/fibonacci-numbers.html
  license: CC BY-SA 4.0
---

The Fibonacci sequence is defined by

$$
F_0 = 0,\quad F_1 = 1,\quad F_n = F_{n-1} + F_{n-2}
$$

giving $0, 1, 1, 2, 3, 5, 8, 13, 21, 34, 55, \dots$ It appears in counting problems (tilings, compositions with parts 1 and 2), in the worst case of Euclid's algorithm, and in many data structures.

## Properties

- **Cassini's identity**: $F_{n-1} F_{n+1} - F_n^2 = (-1)^n$.
- **Addition rule**: $F_{n+k} = F_k F_{n+1} + F_{k-1} F_n$.
- **Divisibility**: $F_n \mid F_{kn}$, and more precisely $\gcd(F_m, F_n) = F_{\gcd(m, n)}$.
- **Sum**: $F_0 + F_1 + \dots + F_n = F_{n+2} - 1$.

```python
def fib_list(n):
    f = [0, 1]
    while len(f) <= n:
        f.append(f[-1] + f[-2])
    return f

F = fib_list(100)
from math import gcd

assert F[:11] == [0, 1, 1, 2, 3, 5, 8, 13, 21, 34, 55]
assert all(F[n - 1] * F[n + 1] - F[n] ** 2 == (-1) ** n for n in range(1, 90))
assert all(F[n + k] == F[k] * F[n + 1] + F[k - 1] * F[n] for n in range(1, 40) for k in range(1, 40))
assert all(gcd(F[m], F[n]) == F[gcd(m, n)] for m in range(1, 60) for n in range(1, 60))
assert all(sum(F[: n + 1]) == F[n + 2] - 1 for n in range(0, 90))
```

## Computing $F_n$

### Linearly, $O(n)$

Keep just the last two values. In Python the numbers are exact, but they grow (about $0.69\,n$ bits), so for large $n$ each addition is not constant time.

```python
def fib_linear(n):
    a, b = 0, 1
    for _ in range(n):
        a, b = b, a + b
    return a

assert fib_linear(10) == 55 and fib_linear(90) == 2880067194370816120
```

### Closed form (Binet)

$$
F_n = \frac{\varphi^n - \psi^n}{\sqrt 5}, \qquad \varphi = \frac{1 + \sqrt 5}{2},\ \psi = \frac{1 - \sqrt 5}{2}
$$

Since $|\psi| < 1$, $F_n$ is the integer nearest to $\varphi^n / \sqrt 5$. With `float` it stays exact only up to $n \approx 70$; for larger $n$ the precision is lost, and using exact arithmetic in $\mathbb{Q}(\sqrt5)$ is no simpler than the methods below.

```python
from math import sqrt

def fib_binet(n):
    phi = (1 + sqrt(5)) / 2
    return round(phi ** n / sqrt(5))

assert all(fib_binet(n) == F[n] for n in range(70))
assert fib_binet(80) != F[80]                      # floats have run out of precision
```

### Matrix exponentiation, $O(\log n)$

The transition $(F_{k}, F_{k+1}) \to (F_{k+1}, F_{k+2})$ is linear, so

$$
\begin{pmatrix} 0 & 1 \\ 1 & 1 \end{pmatrix}^{n}
\begin{pmatrix} F_0 \\ F_1 \end{pmatrix} =
\begin{pmatrix} F_n \\ F_{n+1} \end{pmatrix}
$$

and we raise the matrix to the $n$-th power by [binary exponentiation](/theory/math/binary-exponentiation):

```python
def fib_matrix(n, mod=None):
    def mul(A, B):
        C = [[A[0][0] * B[0][0] + A[0][1] * B[1][0], A[0][0] * B[0][1] + A[0][1] * B[1][1]],
             [A[1][0] * B[0][0] + A[1][1] * B[1][0], A[1][0] * B[0][1] + A[1][1] * B[1][1]]]
        return [[x % mod for x in row] for row in C] if mod else C

    result, base = [[1, 0], [0, 1]], [[0, 1], [1, 1]]
    while n:
        if n & 1:
            result = mul(result, base)
        base = mul(base, base)
        n >>= 1
    return result[0][1]

assert [fib_matrix(i) for i in range(10)] == F[:10]
assert fib_matrix(100) == F[100]
```

### Fast doubling, $O(\log n)$ with a smaller constant

From the addition rule with $k = n$ and $k = n+1$ one obtains:

$$
\begin{aligned}
F_{2k} &= F_k\,(2F_{k+1} - F_k) \\
F_{2k+1} &= F_{k+1}^2 + F_k^2
\end{aligned}
$$

So $(F_k, F_{k+1})$ gives $(F_{2k}, F_{2k+1})$ in three multiplications:

```python
def fib_pair(n):
    """Return (F_n, F_{n+1})."""
    if n == 0:
        return 0, 1
    a, b = fib_pair(n >> 1)             # F_k, F_{k+1} with k = n // 2
    c = a * (2 * b - a)                 # F_{2k}
    d = a * a + b * b                   # F_{2k+1}
    return (d, c + d) if n & 1 else (c, d)

def fib_fast(n):
    return fib_pair(n)[0]

assert [fib_fast(i) for i in range(100)] == F[:100]
assert fib_fast(1000) == fib_linear(1000)
import sys
sys.set_int_max_str_digits(0)                       # see the note below
assert len(str(fib_fast(10 ** 5))) == 20899        # F_100000 has 20899 digits
```

The recursion depth is $\log_2 n$, so it is safe. Because Python integers are exact, `fib_fast(10**6)` is instant even though the result has over 200,000 digits.

> [!PYTHON]
> Since Python 3.11, converting an `int` with more than 4300 digits to a string (`str(x)`, `print(x)`) or back raises `ValueError`, as a protection against denial-of-service. If a problem really asks you to print a huge number, call `sys.set_int_max_str_digits(0)` first. Arithmetic itself has no such limit.

## Modulo $m$ and the Pisano period

Working modulo $m$, the sequence $F_n \bmod m$ is **periodic**, because the pair $(F_n, F_{n+1})$ can take only $m^2$ values and the recurrence is invertible. The period is called the **Pisano period** $\pi(m)$. It never exceeds $6m$, with equality for $m = 2 \cdot 5^k$.

```python
def pisano(m):
    prev, cur = 0, 1
    for i in range(1, 6 * m + 1):
        prev, cur = cur, (prev + cur) % m
        if prev == 0 and cur == 1:
            return i

assert pisano(2) == 3 and pisano(3) == 8 and pisano(10) == 60
assert pisano(10 ** 3) == 1500

# huge index: reduce n modulo the period first
n, m = 10 ** 18, 1000
assert fib_matrix(n % pisano(m), m) == fib_matrix(n, m)
```

For $m = 10^9 + 7$ you don't need it, since `fib_fast` or `fib_matrix(n, mod)` is already logarithmic; the period is for problems asking about *sums* or *all* indices.

## Fibonacci coding (Zeckendorf)

Every positive integer is a **unique** sum of non-consecutive Fibonacci numbers. Greedy works: repeatedly subtract the largest Fibonacci number that fits.

```python
def zeckendorf(n):
    fibs = [1, 2]
    while fibs[-1] <= n:
        fibs.append(fibs[-1] + fibs[-2])
    parts = []
    for f in reversed(fibs):
        if f <= n:
            parts.append(f)
            n -= f
    return parts

assert zeckendorf(100) == [89, 8, 3]
assert zeckendorf(4) == [3, 1]
assert all(sum(zeckendorf(n)) == n for n in range(1, 500))
```

## Practice problems

- [SPOJ - Euclid Algorithm Revisited](http://www.spoj.com/problems/MAIN74/)
- [SPOJ - Fibonacci Sum](http://www.spoj.com/problems/FIBOSUM/)
- [HackerRank - Is Fibo](https://www.hackerrank.com/challenges/is-fibo/problem)
- [Project Euler - Even Fibonacci numbers](https://www.hackerrank.com/contests/projecteuler/challenges/euler002/problem)
- [DMOJ - Fibonacci Sequence](https://dmoj.ca/problem/fibonacci)
- [DMOJ - Fibonacci Sequence (Harder)](https://dmoj.ca/problem/fibonacci2)
- [DMOJ UCLV - Numbered sequence of pencils](https://dmoj.uclv.edu.cu/problem/secnum)
- [DMOJ UCLV - Fibonacci 2D](https://dmoj.uclv.edu.cu/problem/fibonacci)
- [DMOJ UCLV - fibonacci calculation](https://dmoj.uclv.edu.cu/problem/fibonaccicalculatio)
- [LightOJ -  Number Sequence](https://lightoj.com/problem/number-sequence)
- [Codeforces - C. Fibonacci](https://codeforces.com/problemset/gymProblem/102644/C)
- [Codeforces - A. Hexadecimal's theorem](https://codeforces.com/problemset/problem/199/A)
- [Codeforces - B. Blackboard Fibonacci](https://codeforces.com/problemset/problem/217/B)
- [Codeforces - E. Fibonacci Number](https://codeforces.com/problemset/problem/193/E)
