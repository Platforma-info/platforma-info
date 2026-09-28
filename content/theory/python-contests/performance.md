---
title: "Performance and Time Limits"
section: Performance
order: 1
difficulty: intermediate
summary: "How to estimate whether a solution will pass, the complexity limits for Python, and the habits that make CPython code faster."
tags: [complexity, time limit, optimization, big-O]
prerequisites: [python-contests/fast-io]
---

A judge gives each test a fixed time (5 seconds per test on PyInfo). To know in advance whether a solution will fit, you need two numbers: how many basic steps your algorithm performs, and how many steps Python can perform per second.

## Big-O in one minute

The **time complexity** describes how the number of steps grows with the input size $n$, ignoring constant factors.

| Complexity | Example | Steps for $n = 10^5$ |
|------------|---------|----------------------|
| $O(1)$ | dictionary lookup | 1 |
| $O(\log n)$ | binary search | ~17 |
| $O(n)$ | a single pass | $10^5$ |
| $O(n \log n)$ | sorting | ~$1.7 \cdot 10^6$ |
| $O(n^2)$ | two nested loops | $10^{10}$ |
| $O(2^n)$ | all subsets | astronomically many |

## How fast is Python?

Plain CPython executes roughly **$10^7$ simple operations per second**. A loop that does a few operations per iteration manages around $10^6$ to $10^7$ iterations per second. In a quick test, adding up 3 million integers in a `for` loop took about 0.15 s, while the built-in `sum(range(...))` did the same in about 0.06 s.

With a 5-second limit, use this as a rule of thumb for the *number of loop iterations*:

| Input size $n$ | Aim for complexity |
|---------------|--------------------|
| $n \le 10$ | $O(n!)$, $O(n^2 \cdot 2^n)$ |
| $n \le 20$ | $O(2^n)$, $O(2^n \cdot n)$ |
| $n \le 500$ | $O(n^3)$ |
| $n \le 5000$ | $O(n^2)$ (borderline in Python) |
| $n \le 10^5$ | $O(n \log n)$ |
| $n \le 10^6$ | $O(n)$, with a small constant |
| $n \le 10^{18}$ | $O(\log n)$ or $O(1)$ |

The take-away for Python: if the statement says $n \le 10^5$, an $O(n^2)$ solution will not pass however clever the code is. Change the algorithm first, micro-optimize second.

## Habits that speed up CPython

### 1. Put the code in a function

Local variables are much faster to access than globals.

```python
def loop_in_function(n):
    total = 0
    for i in range(n):
        total += i
    return total

assert loop_in_function(10) == 45
```

Wrap the whole program in `def main():` and call it at the end.

### 2. Use built-ins and comprehensions

`sum`, `min`, `max`, `sorted`, `any`, `all`, `str.join`, `sum(map(...))` and comprehensions run their loop in C or in a tighter loop than yours.

```python
data = list(range(1000))
slow = 0
for x in data:
    if x % 3 == 0:
        slow += x
fast = sum(x for x in data if x % 3 == 0)
assert slow == fast
```

### 3. Choose the right container

Measured with 20,000-element containers, running 2,000 membership tests:

| Test | Time |
|------|------|
| `x in list` | 0.40 s |
| `x in set` | 0.0001 s |

That is a factor of about 4000, and it grows with $n$. If you ask "is $x$ in this collection?" more than a few times, build a `set` (or a `dict`) once.

`list.pop(0)` and `list.insert(0, x)` are $O(n)$: use `collections.deque` (see [Heaps, Deques and Bisect](/theory/python-contests/heaps-deques-and-bisect)).

### 4. Build strings with `join`

```python
pieces = [str(i) for i in range(1000)]
text = ",".join(pieces)
assert text.count(",") == 999
```

Repeated `s += x` is optimized in CPython so it is often fine, but that is an implementation detail; `join` is guaranteed to be linear.

### 5. Avoid copying big lists in a loop

`a = a[1:]` copies the list every time and makes a loop quadratic. Use an index or a `deque`. The same holds for `a + [x]` in a loop (use `append`).

### 6. Precompute

Compute values used many times once: factorials modulo $p$, prime sieves, prefix sums.

```python
a = [3, 1, 4, 1, 5, 9, 2, 6]
prefix = [0]
for x in a:
    prefix.append(prefix[-1] + x)

def range_sum(l, r):                  # sum of a[l:r] in O(1)
    return prefix[r] - prefix[l]

assert range_sum(2, 5) == 4 + 1 + 5
```

### 7. Fast I/O

See [Fast Input and Output](/theory/python-contests/fast-io): reading and printing are often the biggest part of the running time on large inputs.

## Recursion depth and memory

CPython limits recursion to about 1000 frames. Raising it with `sys.setrecursionlimit` is possible, but a very deep recursion may still crash the interpreter, and each frame uses memory. Prefer an explicit stack for deep graph traversals (see [Depth-First Search](/theory/graphs/depth-first-search)).

Memory matters too: a Python `int` in a list takes about 28 bytes plus an 8-byte pointer. A list of $10^7$ integers can use hundreds of megabytes. Use `array` for compact numeric storage when you must:

```python
from array import array

a = array("i", range(10))         # C ints, 4 bytes each
assert a[3] == 3 and a.itemsize == 4
```

## Measuring

Do not guess; measure. `time.perf_counter()` is enough:

```python
import time

start = time.perf_counter()
sum(i * i for i in range(10 ** 5))
elapsed = time.perf_counter() - start
assert elapsed < 5
```

In a terminal, `python3 -m timeit "sum(range(1000))"` runs a snippet many times and reports the best time.

## A workflow for a slow solution

1. Estimate the complexity and the number of operations for the largest input.
2. If it is above ~$10^7$, look for a better **algorithm** (sorting, hashing, prefix sums, binary search, DP).
3. Only then apply the constant-factor habits above.
4. Test with a maximum-size input you generate yourself.
