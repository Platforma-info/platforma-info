---
title: "Recursion"
section: Functions
order: 2
difficulty: beginner
summary: "Functions that call themselves: base case, recursive case, the call stack, Python's recursion limit and memoization."
tags: [recursion, call stack, memoization]
prerequisites: [python-basics/functions]
problems: [factorial]
---

A **recursive** function solves a problem by calling itself on a smaller version of the same problem. Every correct recursive function has two parts:

1. a **base case** that returns directly, and
2. a **recursive case** that moves toward the base case.

## Example: factorial

$n! = n \cdot (n-1)!$ and $0! = 1$.

```python
def factorial(n):
    if n == 0:                      # base case
        return 1
    return n * factorial(n - 1)     # recursive case

assert factorial(5) == 120
assert factorial(0) == 1
```

Calling `factorial(3)` unfolds like this, then results are multiplied on the way back:

```text
factorial(3)
  3 * factorial(2)
        2 * factorial(1)
              1 * factorial(0)
                    1
```

Each pending call is stored on the **call stack**. Forget the base case, or never reach it, and the stack grows until Python raises `RecursionError`.

## More examples

Sum of the digits, and the $n$-th Fibonacci number by definition:

```python
def digit_sum(n):
    return n if n < 10 else n % 10 + digit_sum(n // 10)

def fib(n):
    return n if n < 2 else fib(n - 1) + fib(n - 2)

assert digit_sum(2024) == 8
assert [fib(i) for i in range(10)] == [0, 1, 1, 2, 3, 5, 8, 13, 21, 34]
```

Recursion is the natural fit for problems with a self-similar structure: trees, nested lists, backtracking, divide and conquer.

```python
def flatten(x):
    if not isinstance(x, list):
        return [x]
    result = []
    for item in x:
        result += flatten(item)
    return result

assert flatten([1, [2, [3, 4]], 5]) == [1, 2, 3, 4, 5]
```

## The cost of naive recursion

`fib(n)` above recomputes the same values again and again; its running time grows exponentially (about $1.6^n$). `fib(35)` already takes seconds. The fix is **memoization**: remember each result the first time it is computed.

```python
from functools import lru_cache

@lru_cache(maxsize=None)
def fib_fast(n):
    return n if n < 2 else fib_fast(n - 1) + fib_fast(n - 2)

assert fib_fast(80) == 23416728348467685
```

Now each value is computed once, so the time is linear. This "recursion plus a cache" idea is exactly what [dynamic programming](/theory/dynamic-programming/introduction-to-dp) formalises.

## Python's recursion limit

Python refuses to go deeper than about 1000 nested calls by default:

```python
import sys

def depth(n):
    return 0 if n == 0 else 1 + depth(n - 1)

assert depth(500) == 500
try:
    depth(10 ** 6)
except RecursionError:
    print("too deep")

print(sys.getrecursionlimit())
```

For problems that genuinely need deep recursion (a path graph with $10^5$ vertices, say) you can raise the limit, but every frame uses memory and very deep recursion can crash the interpreter. The robust alternative is an explicit **stack** and a loop, as shown for graph traversal in [Depth-First Search](/theory/graphs/depth-first-search).

> [!TIP]
> Whenever a recursive function is simple enough to write as a loop, prefer the loop in Python: it is faster and has no depth limit. Keep recursion for where it makes the idea clearer.

## Exercises

1. Compute $a^n$ recursively in $O(\log n)$ (see [Binary Exponentiation](/theory/math/binary-exponentiation)).
2. Reverse a string recursively.
3. Check if a string is a palindrome recursively.
4. Print all permutations of `"abc"`.
5. Solve the Towers of Hanoi: print the moves for $n$ disks.
