---
title: "Ternary Search"
section: Search
order: 2
difficulty: intermediate
summary: "Find the maximum or minimum of a unimodal function by discarding a third of the interval each step."
tags: [ternary search, unimodal, optimization, golden section]
prerequisites: [searching/binary-search]
source:
  title: Ternary Search
  url: https://cp-algorithms.com/num_methods/ternary_search.html
  license: CC BY-SA 4.0
---

**Ternary search** finds the extremum of a *unimodal* function: one that strictly increases up to a single peak and then strictly decreases (or the reverse for a minimum).

## Idea

Take two points $m_1 < m_2$ inside the interval $[l, r]$ and compare $f(m_1)$ with $f(m_2)$ (for the maximum):

- if $f(m_1) < f(m_2)$, the peak cannot be to the left of $m_1$: set $l = m_1$;
- if $f(m_1) > f(m_2)$, the peak cannot be to the right of $m_2$: set $r = m_2$;
- if they are equal, the peak lies between them (for strictly unimodal functions).

Choosing $m_1 = l + (r - l)/3$ and $m_2 = r - (r - l)/3$ discards a third each time.

```python
def ternary_max(f, lo, hi, iterations=200):
    for _ in range(iterations):
        m1 = lo + (hi - lo) / 3
        m2 = hi - (hi - lo) / 3
        if f(m1) < f(m2):
            lo = m1
        else:
            hi = m2
    return (lo + hi) / 2

# a concave parabola with its maximum at x = 3
x = ternary_max(lambda x: -(x - 3) ** 2 + 10, -100, 100)
assert abs(x - 3) < 1e-6

def ternary_min(f, lo, hi, iterations=200):
    return ternary_max(lambda x: -f(x), lo, hi, iterations)

assert abs(ternary_min(lambda x: abs(x - 7) + 2, -50, 50) - 7) < 1e-12       # a sharp minimum is found precisely
```

> [!NOTE]
> **Precision has a floor.** Near a smooth extremum, $f(x) \approx f^* - c\,(x - x^*)^2$. Once $|x - x^*| \lesssim 10^{-8}$ the difference between $f(m_1)$ and $f(m_2)$ is smaller than the rounding error of $f$ itself (about $10^{-16}$ relative), so the comparison becomes noise. In practice you locate a smooth peak only to about $\sqrt{\varepsilon_{\text{machine}}} \approx 10^{-8}$, however many iterations you run. A sharp peak (like $|x - 7|$) can be located to full precision. If the problem asks for the *value* $f(x^*)$ rather than $x^*$, this is not a problem: the value is accurate to $10^{-16}$.

### Running time

Each iteration keeps $2/3$ of the interval, so after $k$ iterations the interval has length $(2/3)^k (r - l)$; reaching precision $\varepsilon$ takes $O(\log_{3/2}((r-l)/\varepsilon))$ iterations, each with two evaluations of $f$.

> [!WARNING]
> The function must be **strictly** unimodal. A flat region (a plateau) that isn't at the extremum makes the comparison meaningless and the search may go the wrong way. For a convex function it's safe.

## Integer arguments

With integer arguments, the intervals eventually shrink to a few points. Instead, use a **binary search on the slope**: compare $f(m)$ with $f(m + 1)$.

```python
def ternary_min_int(f, lo, hi):
    """Minimum of a unimodal (decreasing then increasing) f on integers lo..hi."""
    while lo < hi:
        mid = (lo + hi) // 2
        if f(mid) <= f(mid + 1):
            hi = mid               # f starts increasing at mid: the minimum is at mid or before
        else:
            lo = mid + 1
    return lo

assert ternary_min_int(lambda x: (x - 17) ** 2, -1000, 1000) == 17
assert ternary_min_int(lambda x: abs(x - 4) + 1, 0, 10) == 4
```

This uses $\log_2$ steps and is exact. It requires the function to be **strictly** decreasing then strictly increasing, or at least `f(mid) == f(mid+1)` only at the minimum.

## Example: the best meeting point

Find the integer position $x$ that minimizes the total distance $\sum |x - a_i|$. The function is convex (a sum of convex functions), so ternary search applies; the optimum is the median:

```python
def total_distance(x, points):
    return sum(abs(x - p) for p in points)

points = [1, 2, 4, 9, 20]
best = ternary_min_int(lambda x: total_distance(x, points), min(points), max(points))
assert best == 4                                        # the median
assert total_distance(best, points) == min(total_distance(x, points) for x in range(0, 25))
```

Note that for *sums of absolute values* the minimum can be a whole interval (even-sized sets have two medians and the function is flat between them). The slope-based version handles flat *minima* correctly because of the `<=` comparison, as long as the function is not flat anywhere else.

## Example: geometry

Ternary search often optimizes a geometric quantity: the point on a segment closest to another point, or the time when two moving points are closest (the distance function is convex in time):

```python
def closest_time(p1, v1, p2, v2, t_max=1000.0):
    """Time in [0, t_max] when two points moving with constant velocity are closest."""
    def dist(t):
        return ((p1[0] + v1[0] * t - p2[0] - v2[0] * t) ** 2 + (p1[1] + v1[1] * t - p2[1] - v2[1] * t) ** 2) ** 0.5
    return ternary_min(dist, 0.0, t_max)

# one point stands still at the origin, the other passes at (1, 1) going right
t = closest_time((0, 0), (0, 0), (-5, 1), (1, 0))
assert abs(t - 5) < 1e-6
```

## Golden-section search

Ternary search evaluates $f$ twice per iteration and reuses none of the values. The **golden-section search** picks the two inner points at the golden ratio positions so that one of them can be **reused** in the next iteration, needing only one new evaluation per step. The interval shrinks by $\varphi^{-1} \approx 0.618$ per evaluation, versus $\sqrt{2/3} \approx 0.816$ for ternary. It's worth using only when evaluating $f$ is expensive.

```python
def golden_max(f, lo, hi, iterations=100):
    phi = (5 ** 0.5 - 1) / 2                          # 0.618...
    m1 = hi - phi * (hi - lo)
    m2 = lo + phi * (hi - lo)
    f1, f2 = f(m1), f(m2)
    for _ in range(iterations):
        if f1 < f2:
            lo, m1, f1 = m1, m2, f2                    # reuse m2 as the new m1
            m2 = lo + phi * (hi - lo)
            f2 = f(m2)
        else:
            hi, m2, f2 = m2, m1, f1                    # reuse m1 as the new m2
            m1 = hi - phi * (hi - lo)
            f1 = f(m1)
    return (lo + hi) / 2

assert abs(golden_max(lambda x: -(x - 3) ** 2, -100, 100) - 3) < 1e-6
```

## When not to use it

- If the function is monotone, use [binary search](/theory/searching/binary-search).
- If the function has several local extrema, ternary search finds *some* of them, not necessarily the global one.
- For functions with a derivative, [Newton's method](https://cp-algorithms.com/num_methods/roots_newton.html) converges much faster.

## Practice problems

- [Codeforces - New Bakery](https://codeforces.com/problemset/problem/1978/B)
- [Codechef - Race time](https://www.codechef.com/problems/AMCS03)
- [Hackerearth - Rescuer](https://www.hackerearth.com/problem/algorithm/rescuer-2d2495cb/)
- [Spoj - Building Construction](http://www.spoj.com/problems/KOPC12A/)
- [Codeforces - Weakness and Poorness](http://codeforces.com/problemset/problem/578/C)
- [LOJ - Closest Distance](http://lightoj.com/volume_showproblem.php?problem=1146)
- [GYM - Dome of Circus (D)](http://codeforces.com/gym/101309)
- [UVA - Galactic Taxes](https://uva.onlinejudge.org/index.php?option=com_onlinejudge&Itemid=8&page=show_problem&problem=4898)
- [GYM - Chasing the Cheetahs (A)](http://codeforces.com/gym/100829)
- [UVA - 12197 - Trick or Treat](https://uva.onlinejudge.org/index.php?option=com_onlinejudge&Itemid=8&page=show_problem&problem=3349)
- [SPOJ - Building Construction](http://www.spoj.com/problems/KOPC12A/)
- [Codeforces - Devu and his Brother](https://codeforces.com/problemset/problem/439/D)
- [Codechef - Is This JEE ](https://www.codechef.com/problems/ICM2003)
- [Codeforces - Restorer Distance](https://codeforces.com/contest/1355/problem/E)
- [TIMUS 1058 Chocolate](https://acm.timus.ru/problem.aspx?space=1&num=1058)
- [TIMUS 1436 Billboard](https://acm.timus.ru/problem.aspx?space=1&num=1436)
- [TIMUS 1451 Beerhouse Tale](https://acm.timus.ru/problem.aspx?space=1&num=1451)
- [TIMUS 1719 Kill the Shaitan-Boss](https://acm.timus.ru/problem.aspx?space=1&num=1719)
- [TIMUS 1913 Titan Ruins: Alignment of Forces](https://acm.timus.ru/problem.aspx?space=1&num=1913)
