---
title: "The Josephus Problem"
section: Classic problems
order: 1
difficulty: intermediate
summary: "People stand in a circle and every k-th one is eliminated; find the survivor with a recurrence in O(n), the closed form for k = 2, and an O(k log n) method."
tags: [josephus, recurrence, circle, bit tricks]
prerequisites: [python-basics/recursion, math/bit-manipulation]
source:
  title: Josephus Problem
  url: https://cp-algorithms.com/others/josephus_problem.html
  license: CC BY-SA 4.0
---

$n$ people stand in a circle, numbered $1, \dots, n$. Starting from person 1, count $k$ people clockwise; the $k$-th person is eliminated and leaves the circle; counting resumes from the next person. Repeat until one person remains. Who is the survivor?

Legend says Flavius Josephus, cornered by Roman soldiers with 40 companions, worked out where to stand to be the last one alive.

## Simulation

The obvious approach keeps a list and removes an element $n - 1$ times. Removing from the middle of a Python list costs $O(n)$, so the total is $O(n^2)$; with a `deque` rotation it is $O(nk)$.

```python
def josephus_simulation(n, k):
    people = list(range(1, n + 1))
    idx = 0
    while len(people) > 1:
        idx = (idx + k - 1) % len(people)
        people.pop(idx)
    return people[0]

assert josephus_simulation(7, 3) == 4
assert josephus_simulation(41, 3) == 31                  # the legendary answer
assert josephus_simulation(10, 2) == 5
```

## $O(n)$ recurrence

Let $J(n, k)$ be the **0-indexed** position of the survivor among $n$ people. After the first elimination (person $k - 1$ in 0-indexed form) there are $n - 1$ people, and counting restarts from the person at position $k \bmod n$. That subgame is the same problem with $n - 1$ people, so its survivor position $J(n-1, k)$ must be translated back to the original numbering by shifting $k$ positions:

$$
J(1, k) = 0, \qquad J(n, k) = \big(J(n-1, k) + k\big) \bmod n
$$

```python
def josephus(n, k):
    """0-indexed survivor position."""
    survivor = 0
    for size in range(2, n + 1):
        survivor = (survivor + k) % size
    return survivor

assert josephus(7, 3) + 1 == 4
assert josephus(41, 3) + 1 == 31
assert all(josephus(n, k) + 1 == josephus_simulation(n, k) for n in range(1, 40) for k in range(1, 12))
assert josephus(10 ** 6, 7) >= 0                         # a million people: still instant
```

Add 1 for the 1-indexed answer. This is $O(n)$ time and $O(1)$ memory.

## Closed form for $k = 2$

For $k = 2$: write $n = 2^m + L$ with $0 \le L < 2^m$. The survivor is $2L + 1$ (1-indexed). In binary, the answer is obtained by **rotating the binary representation of $n$ left by one position**: move the leading 1 to the end.

```python
def josephus_k2(n):
    m = n.bit_length() - 1
    L = n - (1 << m)
    return 2 * L + 1

def josephus_k2_rotate(n):
    b = bin(n)[2:]
    return int(b[1:] + b[0], 2)

assert [josephus_k2(n) for n in range(1, 11)] == [1, 1, 3, 1, 3, 5, 7, 1, 3, 5]
assert all(josephus_k2(n) == josephus_k2_rotate(n) == josephus(n, 2) + 1 for n in range(1, 500))
```

**Why.** With $n$ even, one pass removes all even-numbered people and leaves $n/2$ people in the same situation but with odd numbers; with $n$ odd, the first pass removes 2, 4, ..., $n - 1$, and then person 1 is eliminated next, leaving $(n-1)/2$ people starting from person 3. This gives $J(2n) = 2J(n) - 1$ and $J(2n + 1) = 2J(n) + 1$ (1-indexed), which is a rotation of bits.

## $O(k \log n)$ for small $k$

When $n$ is huge (say $10^{18}$) and $k$ is small, the $O(n)$ recurrence is too slow. Observe that if $J(n-1)$ is small, the recurrence adds $k$ many times before the modulus wraps around. We can **jump over** the whole run of steps in which no wrap occurs:

```python
def josephus_fast(n, k):
    """0-indexed survivor, O(k log n)."""
    if k == 1:
        return n - 1
    size, pos = 1, 0                            # invariant: pos is the survivor among `size` people
    while size < n:
        # number of steps before pos + steps*k reaches `size + steps`, i.e. before a wrap-around
        steps = (size - pos - 1) // (k - 1) + 1
        steps = min(steps, n - size)
        pos = (pos + steps * k) % (size + steps)
        size += steps
    return pos

assert all(josephus_fast(n, k) == josephus(n, k) for n in range(1, 300) for k in range(1, 9))
assert josephus_fast(10 ** 6, 3) == josephus(10 ** 6, 3)
assert josephus_fast(10 ** 18, 2) + 1 == josephus_k2(10 ** 18)
```

Each iteration multiplies `size` by roughly $k/(k-1)$, so there are $O(k \log n)$ iterations. That makes $n = 10^{18}$ feasible for small $k$.

A recursive formulation of the same trick handles the case $k > n$ via $J(n, k) = (J(n-1, k) + k) \bmod n$ directly, as in the $O(n)$ loop.

## Related problems

- Identify the *order* of eliminations (simulate with a [Fenwick tree](/theory/data-structures/fenwick-tree) using "find the $j$-th remaining person", $O(n \log n)$).
- The survivor when the first count starts from a different person: shift the answer.
- Variations where the direction alternates or the step $k_i$ changes with each round.

```python
def elimination_order(n, k):
    """Order in which people are eliminated (O(n^2) simulation; fine for small n)."""
    people = list(range(1, n + 1))
    idx, order = 0, []
    while people:
        idx = (idx + k - 1) % len(people)
        order.append(people.pop(idx))
    return order

assert elimination_order(7, 3) == [3, 6, 2, 7, 5, 1, 4]
```
