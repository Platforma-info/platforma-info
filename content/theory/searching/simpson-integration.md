---
title: "Numerical Integration: Simpson's Rule"
section: Integration
order: 1
difficulty: intermediate
summary: "Approximate a definite integral by fitting parabolas: the composite Simpson formula, its O(h⁴) error, and an adaptive version that refines only where needed."
tags: [integration, simpson, numerical methods, adaptive]
prerequisites: [python-basics/functions]
source:
  title: "Integration by Simpson's formula"
  url: https://cp-algorithms.com/num_methods/simpson-integration.html
  license: CC BY-SA 4.0
---

We want the value of a definite integral $\int_a^b f(x)\,dx$ when no closed form is at hand. Numerical integration replaces $f$ by a simple function on small pieces and integrates that exactly. The cheapest schemes:

| Rule | On each piece the function is approximated by | Error for step $h$ |
|------|-----------------------------------------------|--------------------|
| rectangle | a constant | $O(h)$ |
| trapezoid | a line | $O(h^2)$ |
| **Simpson** | a **parabola** through 3 points | $O(h^4)$ |

## Simpson's formula

On an interval $[l, r]$ with midpoint $m$, the parabola through $(l, f(l))$, $(m, f(m))$, $(r, f(r))$ integrates to

$$
\int_l^r f(x)\,dx \approx \frac{r - l}{6}\Big(f(l) + 4 f(m) + f(r)\Big)
$$

This is exact for all polynomials up to degree **3** (the cubic term cancels by symmetry), which is why the error is $O(h^4)$ although we only use a parabola.

## Composite rule

Split $[a, b]$ into $2n$ equal subintervals (an even number) of width $h = (b-a)/2n$ and apply the formula to each consecutive pair:

$$
\int_a^b f \approx \frac{h}{3}\Big(f(x_0) + 4f(x_1) + 2f(x_2) + 4f(x_3) + \cdots + 2f(x_{2n-2}) + 4f(x_{2n-1}) + f(x_{2n})\Big)
$$

The weights alternate $4, 2, 4, 2, \dots$ inside, with $1$ at both ends.

```python
import math

def simpson(f, a, b, n=1000):
    """Composite Simpson with 2n subintervals."""
    h = (b - a) / (2 * n)
    total = f(a) + f(b)
    for i in range(1, 2 * n):
        total += (4 if i % 2 else 2) * f(a + i * h)
    return total * h / 3

# exact for cubics, even with a single pair of intervals
assert abs(simpson(lambda x: x ** 3 - 2 * x + 1, 0, 2, n=1) - (4 - 4 + 2)) < 1e-12
assert abs(simpson(math.sin, 0, math.pi) - 2) < 1e-12
assert abs(simpson(math.exp, 0, 1) - (math.e - 1)) < 1e-12
assert abs(simpson(lambda x: 1 / x, 1, math.e) - 1) < 1e-10
assert abs(simpson(lambda x: 4 / (1 + x * x), 0, 1, n=200) - math.pi) < 1e-10        # a famous way to compute pi
```

## The error

For a smooth $f$ the error of the composite rule is

$$
\left|E\right| \le \frac{(b-a)\,h^4}{180} \max_{[a,b]} |f^{(4)}(x)|
$$

so doubling the number of intervals divides the error by about 16. We can check that empirically:

```python
def error_for(n):
    return abs(simpson(math.sin, 0, math.pi, n=n) - 2)

ratios = [error_for(n) / error_for(2 * n) for n in (4, 8, 16, 32)]
assert all(14 < r < 18 for r in ratios)                            # each doubling gains a factor of ~16
```

The rule is much more accurate than the trapezoid rule at the same number of function evaluations, at the cost of requiring smoothness: with a kink or a singularity in the interval the order of convergence drops.

```python
def trapezoid(f, a, b, n):
    h = (b - a) / n
    return h * (f(a) / 2 + f(b) / 2 + sum(f(a + i * h) for i in range(1, n)))

assert abs(simpson(math.sin, 0, math.pi, n=10) - 2) < abs(trapezoid(math.sin, 0, math.pi, 20) - 2) / 100
```

## Choosing the number of intervals: adaptive Simpson

A fixed grid wastes evaluations where $f$ is flat and may be too coarse where $f$ changes rapidly. **Adaptive Simpson** applies the rule to an interval and to its two halves; if the two answers agree within a tolerance the interval is accepted, otherwise each half is refined recursively with half the tolerance.

The estimate of the error is the difference $|S_{\text{halves}} - S_{\text{whole}}|/15$ (the factor 15 comes from the $h^4$ order: $16 - 1$).

```python
def adaptive_simpson(f, a, b, eps=1e-9, max_depth=50):
    def rule(l, fl, m, fm, r, fr):
        return (r - l) / 6 * (fl + 4 * fm + fr)

    def go(l, fl, m, fm, r, fr, whole, eps, depth):
        lm, rm = (l + m) / 2, (m + r) / 2
        flm, frm = f(lm), f(rm)
        left = rule(l, fl, lm, flm, m, fm)
        right = rule(m, fm, rm, frm, r, fr)
        if depth <= 0 or abs(left + right - whole) <= 15 * eps:
            return left + right + (left + right - whole) / 15        # Richardson correction
        return (go(l, fl, lm, flm, m, fm, left, eps / 2, depth - 1)
                + go(m, fm, rm, frm, r, fr, right, eps / 2, depth - 1))

    m = (a + b) / 2
    fa, fm, fb = f(a), f(m), f(b)
    return go(a, fa, m, fm, b, fb, rule(a, fa, m, fm, b, fb), eps, max_depth)

assert abs(adaptive_simpson(math.sin, 0, math.pi) - 2) < 1e-9
assert abs(adaptive_simpson(lambda x: math.sqrt(x), 0, 1, eps=1e-8) - 2 / 3) < 1e-6          # sqrt has a singular derivative at 0
assert abs(adaptive_simpson(lambda x: math.exp(-x * x), -5, 5) - math.sqrt(math.pi)) < 1e-6

calls = 0
def counted(x):
    global calls
    calls += 1
    return math.sin(50 * x) if x > 0.9 else 0.0                     # mostly flat, oscillating on the last tenth
adaptive_simpson(counted, 0, 1, eps=1e-6)
adaptive_calls = calls
calls = 0
simpson(counted, 0, 1, n=4000)
assert adaptive_calls < calls / 2                                      # far fewer evaluations for a comparable result
```

## Practical notes

- **Even number of subintervals** is required by the composite rule; an odd count needs a different closing rule (Simpson's 3/8 rule).
- For very smooth functions, **Gaussian quadrature** or **Romberg integration** (repeated Richardson extrapolation of the trapezoid rule) achieve high accuracy with fewer evaluations.
- Improper integrals ($\infty$ limits, singularities) need a change of variables first.
- Multiple integrals: integrate in one variable at a time (nested Simpson); the cost multiplies.
- If $f$ is a polynomial of degree $\le 3$, one Simpson step is *exactly* the integral.

## Practice problems

- [Latin American Regionals 2012 - Environment Protection](https://matcomgrader.com/problem/9335/environment-protection/)
