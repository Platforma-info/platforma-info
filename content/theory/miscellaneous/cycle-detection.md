---
title: "Floyd's Cycle Detection (Tortoise and Hare)"
section: Classic problems
order: 2
difficulty: intermediate
summary: "Detect a cycle in a linked list or any iterated function with O(1) memory, and find where it starts and how long it is."
tags: [cycle detection, floyd, linked list, two pointers, functional graph]
prerequisites: [python-basics/loops]
source:
  title: Floyd's Linked List Cycle Finding Algorithm
  url: https://cp-algorithms.com/others/tortoise_and_hare.html
  license: CC BY-SA 4.0
---

Given a sequence produced by repeatedly applying a function, $x_0,\ x_1 = f(x_0),\ x_2 = f(x_1), \dots$, on a finite set the sequence must eventually repeat: it consists of a **tail** of $\mu$ distinct values followed by a **cycle** of length $\lambda$ that repeats forever. Examples: a linked list whose last node points back to an earlier node, the sequence of a pseudo-random number generator, the digits of a repeating fraction, a state machine.

We want to find $\mu$ and $\lambda$. Storing every value in a set works but costs $O(\mu + \lambda)$ memory. **Floyd's algorithm** (the *tortoise and the hare*) needs only $O(1)$ memory.

## Step 1: is there a cycle?

Move two pointers over the sequence: the **tortoise** advances one step at a time and the **hare** two steps. If there is a cycle, the hare enters it first and laps the tortoise; they must meet inside the cycle. If the hare reaches the end (`None`), there is no cycle.

```python
class Node:
    def __init__(self, value):
        self.value = value
        self.next = None

def has_cycle(head):
    tortoise = hare = head
    while hare is not None and hare.next is not None:
        tortoise = tortoise.next
        hare = hare.next.next
        if tortoise is hare:
            return True
    return False

def make_list(values, cycle_to=None):
    nodes = [Node(v) for v in values]
    for a, b in zip(nodes, nodes[1:]):
        a.next = b
    if cycle_to is not None:
        nodes[-1].next = nodes[cycle_to]
    return nodes

assert not has_cycle(make_list([1, 2, 3, 4]).__getitem__(0))
assert has_cycle(make_list([1, 2, 3, 4, 5], cycle_to=2)[0])
assert not has_cycle(None)
```

**Why they meet.** Once both are in the cycle, each step the gap between them (measured along the cycle) changes by one. So the gap decreases by one each step and reaches zero without jumping over: the hare cannot skip past the tortoise.

## Step 2: where does the cycle start?

Let the meeting point be reached after the tortoise made $t$ steps. Then the hare made $2t$, so it made $t$ extra steps, which is a multiple of the cycle length: $t = m\lambda$. The tortoise has walked $t$ steps, which is $\mu + a$ where $a$ is its offset inside the cycle. Continuing $\mu$ more steps from the meeting point brings the tortoise to $t + \mu = m\lambda + \mu$, which is exactly the entrance of the cycle.

**So:** reset one pointer to the start; move both pointers **one step at a time**; they meet at the first node of the cycle.

## Step 3: cycle length

From the entrance, walk around the cycle counting steps until you return.

```python
def floyd(f, x0):
    """For the sequence x0, f(x0), f(f(x0)), ... return (mu, lam): tail length and cycle length."""
    tortoise, hare = f(x0), f(f(x0))
    while tortoise != hare:                          # phase 1: meet inside the cycle
        tortoise, hare = f(tortoise), f(f(hare))
    mu = 0
    tortoise = x0                                    # phase 2: find the start
    while tortoise != hare:
        tortoise, hare = f(tortoise), f(hare)
        mu += 1
    lam = 1                                          # phase 3: measure the cycle
    hare = f(tortoise)
    while tortoise != hare:
        hare = f(hare)
        lam += 1
    return mu, lam

# f(x) = (x^2 + 1) mod 255
f = lambda x: (x * x + 1) % 255
mu, lam = floyd(f, 3)

def brute(f, x0):
    seen, x, i = {}, x0, 0
    while x not in seen:
        seen[x] = i
        x = f(x)
        i += 1
    return seen[x], i - seen[x]

assert (mu, lam) == brute(f, 3)
```

The total work is $O(\mu + \lambda)$ time and $O(1)$ memory.

### Linked list: the first node of the cycle

```python
def cycle_start(head):
    tortoise = hare = head
    while hare is not None and hare.next is not None:
        tortoise, hare = tortoise.next, hare.next.next
        if tortoise is hare:
            tortoise = head
            while tortoise is not hare:
                tortoise, hare = tortoise.next, hare.next
            return tortoise
    return None

nodes = make_list(list("abcdefg"), cycle_to=3)
assert cycle_start(nodes[0]) is nodes[3]
assert cycle_start(make_list([1, 2, 3])[0]) is None
```

## Testing on many random functions

```python
import random

random.seed(5)
for _ in range(300):
    m = random.randint(1, 60)
    table = [random.randrange(m) for _ in range(m)]        # a random function on {0..m-1}
    x0 = random.randrange(m)
    assert floyd(table.__getitem__, x0) == brute(table.__getitem__, x0)
```

## Application: finding the duplicate number

An array of $n + 1$ integers, each between $1$ and $n$, has at least one duplicate (pigeonhole). Treat `i -> a[i]` as a function: since values are in $[1, n]$, following it from index 0 never leaves the array, and the duplicated value is the **entrance of the cycle**. This finds it without modifying the array and with $O(1)$ extra memory:

```python
def find_duplicate(a):
    tortoise, hare = a[0], a[a[0]]
    while tortoise != hare:
        tortoise, hare = a[tortoise], a[a[hare]]
    tortoise = 0
    while tortoise != hare:
        tortoise, hare = a[tortoise], a[hare]
    return hare

assert find_duplicate([1, 3, 4, 2, 2]) == 2
assert find_duplicate([3, 1, 3, 4, 2]) == 3
assert find_duplicate([1, 1]) == 1
```

## Brent's algorithm

**Brent's** variation moves only one pointer and teleports the other to the current position at powers of two. It performs fewer function evaluations (typically 30-50% fewer) than Floyd's, which matters when $f$ is expensive, and it is the cycle finder inside Pollard's rho ([Integer Factorization](/theory/math/integer-factorization)).

```python
def brent(f, x0):
    power = lam = 1
    tortoise, hare = x0, f(x0)
    while tortoise != hare:
        if power == lam:
            tortoise, power, lam = hare, power * 2, 0
        hare = f(hare)
        lam += 1
    tortoise = hare = x0
    for _ in range(lam):
        hare = f(hare)
    mu = 0
    while tortoise != hare:
        tortoise, hare = f(tortoise), f(hare)
        mu += 1
    return mu, lam

assert brent(f, 3) == (mu, lam)
for _ in range(200):
    m = random.randint(1, 60)
    table = [random.randrange(m) for _ in range(m)]
    x0 = random.randrange(m)
    assert brent(table.__getitem__, x0) == brute(table.__getitem__, x0)
```

## Practice problems

- [Linked List Cycle (EASY)](https://leetcode.com/problems/linked-list-cycle/)
- [Happy Number (Easy)](https://leetcode.com/problems/happy-number/)
- [Find the Duplicate Number (Medium)](https://leetcode.com/problems/find-the-duplicate-number/)
- [Linked List Cycle II](https://leetcode.com/problems/linked-list-cycle-ii/)
