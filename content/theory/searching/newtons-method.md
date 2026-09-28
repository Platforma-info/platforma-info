---
title: "Newton's Method for Finding Roots"
section: Search
order: 3
difficulty: intermediate
summary: "Find a root of f(x) = 0 by repeatedly replacing the function with its tangent line: quadratic convergence, the square-root special case, and when it fails."
tags: [newton, root finding, iteration, square root, numerical methods]
prerequisites: [searching/binary-search]
source:
  title: "Newton's method for finding roots"
  url: https://cp-algorithms.com/num_methods/roots_newton.html
  license: CC BY-SA 4.0
---

**Newton's method** (Newton-Raphson) finds a root of a differentiable function $f$: an $x$ with $f(x) = 0$. Where [binary search](/theory/searching/binary-search) gains one bit of accuracy per step, Newton's method roughly **doubles the number of correct digits** at every step once it is close to the root.

## The iteration

Start from a guess $x_0$. Replace $f$ near $x_n$ by its tangent line $f(x_n) + f'(x_n)(x - x_n)$ and take the point where this line crosses zero as the next guess:

$$
x_{n+1} = x_n - \frac{f(x_n)}{f'(x_n)}
$$

```python
def newton(f, df, x0, iterations=50, tolerance=1e-14):
    x = x0
    for _ in range(iterations):
        step = f(x) / df(x)
        x -= step
        if abs(step) < tolerance:
            break
    return x

# the root of x^2 - 2 is sqrt(2)
root = newton(lambda x: x * x - 2, lambda x: 2 * x, 1.0)
assert abs(root - 2 ** 0.5) < 1e-15

# cos(x) = x, i.e. f(x) = cos(x) - x
import math
fixed_point = newton(lambda x: math.cos(x) - x, lambda x: -math.sin(x) - 1, 1.0)
assert abs(math.cos(fixed_point) - fixed_point) < 1e-14
```

### Why it is fast

If $r$ is a simple root ($f(r) = 0$, $f'(r) \ne 0$) and $e_n = x_n - r$, then by Taylor expansion

$$
e_{n+1} \approx \frac{f''(r)}{2f'(r)}\, e_n^2
$$

The error is *squared* at each step. For $\sqrt 2$ started from $x_0 = 3$ the errors are roughly $0.42,\ 0.048,\ 8\cdot10^{-4},\ 2\cdot10^{-7},\ 2\cdot10^{-14}$: once the error is small, the number of correct digits doubles each step:

```python
errors = []
x = 3.0
for _ in range(6):
    x = x - (x * x - 2) / (2 * x)
    errors.append(abs(x - 2 ** 0.5))
assert errors[0] > errors[1] > errors[2] > errors[3]
assert errors[3] < 1e-6 and errors[4] < 1e-13 and errors[5] < 1e-15
assert all(errors[i + 1] < 2 * errors[i] ** 2 for i in range(3))            # next error ~ e^2 / (2 sqrt 2)
```

## Application: square roots

For $f(x) = x^2 - a$ the update becomes the ancient **Babylonian method**:

$$
x_{n+1} = \frac{1}{2}\left(x_n + \frac{a}{x_n}\right)
$$

```python
def sqrt_newton(a, iterations=60):
    if a == 0:
        return 0.0
    x = max(a, 1.0)
    for _ in range(iterations):
        nxt = 0.5 * (x + a / x)
        if abs(nxt - x) <= 1e-16 * nxt:
            break
        x = nxt
    return x

for a in (2, 3, 10, 0.25, 1e-8, 123456789.0, 1e30):
    assert abs(sqrt_newton(a) - math.sqrt(a)) <= 1e-13 * math.sqrt(a)
```

### Exact integer square root

The same idea works in integers, giving $\lfloor\sqrt n\rfloor$ exactly for arbitrarily large $n$. Starting from a value at least as large as the root, the sequence decreases until it stops:

```python
def isqrt_newton(n):
    if n < 0:
        raise ValueError
    if n == 0:
        return 0
    x = 1 << ((n.bit_length() + 1) // 2)               # a power of two >= sqrt(n)
    while True:
        y = (x + n // x) // 2
        if y >= x:
            return x
        x = y

assert all(isqrt_newton(n) == math.isqrt(n) for n in range(5000))
assert isqrt_newton(10 ** 200) == 10 ** 100
assert isqrt_newton(10 ** 200 - 1) == 10 ** 100 - 1
```

The number of iterations is $O(\log\log n)$ after the initial power-of-two guess.

## Generalizations

**Cube root, $k$-th root:** $f(x) = x^k - a$ gives $x_{n+1} = \tfrac{1}{k}\big((k-1)x_n + a/x_n^{k-1}\big)$.

```python
def kth_root_int(a, k):
    """Floor of the k-th root of a non-negative integer."""
    if a == 0:
        return 0
    x = 1 << ((a.bit_length() + k - 1) // k)
    while True:
        y = ((k - 1) * x + a // x ** (k - 1)) // k
        if y >= x:
            return x
        x = y

assert [kth_root_int(n, 3) for n in (0, 1, 7, 8, 26, 27, 28, 10 ** 30)] == [0, 1, 1, 2, 2, 3, 3, 10 ** 10]
assert all(kth_root_int(n, 3) ** 3 <= n < (kth_root_int(n, 3) + 1) ** 3 for n in range(3000))
```

**Solving equations with a numerical derivative:** replace $f'$ by $\frac{f(x+h) - f(x)}{h}$ when a formula for the derivative is not available (the *secant method* uses the two previous iterates instead).

```python
def secant(f, x0, x1, iterations=60):
    for _ in range(iterations):
        f0, f1 = f(x0), f(x1)
        if f1 == f0:
            break
        x0, x1 = x1, x1 - f1 * (x1 - x0) / (f1 - f0)
    return x1

assert abs(secant(lambda x: x ** 3 - 2 * x - 5, 2.0, 3.0) - 2.0945514815423265) < 1e-12
```

**Systems of equations:** Newton's method in several variables uses the Jacobian matrix and a linear solve at each step. In **polynomial arithmetic** it computes inverses, logarithms and exponentials of power series ([polynomial operations](/theory/math/polynomial-operations)).

## When Newton's method fails

- **Bad starting point:** far from the root the tangent line may point to a distant place; the iteration can wander or diverge.
- **Zero derivative:** if $f'(x_n) = 0$ the step is undefined; near it, steps are huge.
- **Multiple roots** ($f'(r) = 0$ too): convergence degrades to linear, halving the error each step.
- **Cycles:** e.g. $f(x) = x^3 - 2x + 2$ started at $0$ oscillates between $0$ and $1$.

```python
# a cycle: Newton's method for x^3 - 2x + 2 started at 0 bounces between 0 and 1 forever
g = lambda x: x ** 3 - 2 * x + 2
dg = lambda x: 3 * x ** 2 - 2
x, seen = 0.0, []
for _ in range(6):
    x = x - g(x) / dg(x)
    seen.append(x)
assert seen == [1.0, 0.0, 1.0, 0.0, 1.0, 0.0]

# a double root: convergence is only linear (the error halves at each step)
x = 2.0
errs = []
for _ in range(5):
    x = x - (x - 1) ** 2 / (2 * (x - 1))
    errs.append(abs(x - 1))
assert all(abs(errs[i + 1] / errs[i] - 0.5) < 1e-12 for i in range(4))
```

A robust practical scheme is **safeguarded Newton**: keep a bracket $[lo, hi]$ with a sign change (as in binary search) and take a Newton step only when it stays inside the bracket, falling back to bisection otherwise.

```python
def safe_newton(f, df, lo, hi, iterations=100):
    assert f(lo) * f(hi) <= 0
    x = (lo + hi) / 2
    for _ in range(iterations):
        fx = f(x)
        if fx == 0:
            return x
        if f(lo) * fx < 0:
            hi = x
        else:
            lo = x
        d = df(x)
        nxt = x - fx / d if d != 0 else None
        x = nxt if nxt is not None and lo < nxt < hi else (lo + hi) / 2
    return x

assert abs(safe_newton(g, dg, -3, 0) - (-1.7692923542386314)) < 1e-12        # the real root of x^3 - 2x + 2
```

## Practice problems

- [UVa 10428 - The Roots](https://uva.onlinejudge.org/index.php?option=com_onlinejudge&Itemid=8&category=16&page=show_problem&problem=1369)
