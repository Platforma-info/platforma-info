---
title: "Minimum Stack and Minimum Queue"
section: Fundamentals
order: 1
difficulty: intermediate
summary: "Keep the minimum of a stack or a queue available in O(1), and find the minimum of every window of fixed length in O(n)."
tags: [stack, queue, deque, sliding window, monotonic]
prerequisites: [python-contests/heaps-deques-and-bisect]
source:
  title: Minimum stack / Minimum queue
  url: https://cp-algorithms.com/data_structures/stack_queue_modification.html
  license: CC BY-SA 4.0
---

A plain stack or queue answers "what is the smallest element currently stored?" only in $O(n)$. Small modifications make this an $O(1)$ query, and they are the key to the classic **sliding window minimum**.

## Minimum stack

Store, together with each element, the minimum of everything at or below it. The minimum of the whole stack is then stored in the top element.

```python
class MinStack:
    def __init__(self):
        self.items = []                       # pairs (value, minimum up to here)

    def push(self, x):
        current = min(x, self.items[-1][1]) if self.items else x
        self.items.append((x, current))

    def pop(self):
        return self.items.pop()[0]

    def top(self):
        return self.items[-1][0]

    def minimum(self):
        return self.items[-1][1]

    def __len__(self):
        return len(self.items)

s = MinStack()
for x in [5, 3, 8, 2, 7]:
    s.push(x)
assert s.minimum() == 2
assert s.pop() == 7 and s.minimum() == 2
assert s.pop() == 2 and s.minimum() == 3
```

Push, pop and minimum are all $O(1)$.

## Minimum queue with two stacks

A queue is two stacks: elements are pushed onto the *input* stack, and popped from the *output* stack; when the output is empty, everything moves from input to output, which reverses the order. Make both stacks *minimum stacks* and the minimum of the queue is the smaller of their two minimums.

```python
class MinQueue:
    def __init__(self):
        self.inbox, self.outbox = MinStack(), MinStack()

    def push(self, x):
        self.inbox.push(x)

    def pop(self):
        if not len(self.outbox):
            while len(self.inbox):
                self.outbox.push(self.inbox.pop())
        return self.outbox.pop()

    def minimum(self):
        candidates = []
        if len(self.inbox):
            candidates.append(self.inbox.minimum())
        if len(self.outbox):
            candidates.append(self.outbox.minimum())
        return min(candidates)

    def __len__(self):
        return len(self.inbox) + len(self.outbox)

q = MinQueue()
for x in [4, 2, 6, 1, 5]:
    q.push(x)
assert q.minimum() == 1
assert q.pop() == 4 and q.minimum() == 1
assert q.pop() == 2 and q.pop() == 6
assert q.minimum() == 1
assert q.pop() == 1 and q.minimum() == 5
```

Each element is moved at most once between stacks, so every operation is $O(1)$ **amortized**.

## Minimum queue with a monotonic deque

Another approach keeps a `deque` of candidates that is **increasing** from front to back. When a new element arrives, every candidate larger than it can never be the minimum again (the new one is smaller *and* will stay in the window longer), so discard them from the back. The front of the deque is always the current minimum.

```python
from collections import deque

class MonotonicMinQueue:
    def __init__(self):
        self.q = deque()                     # (value, count of elements it "represents")

    def push(self, x):
        count = 1
        while self.q and self.q[-1][0] >= x:
            count += self.q.pop()[1]
        self.q.append((x, count))

    def pop(self):
        """Remove the oldest element."""
        value, count = self.q[0]
        if count == 1:
            self.q.popleft()
        else:
            self.q[0] = (value, count - 1)

    def minimum(self):
        return self.q[0][0]

mq = MonotonicMinQueue()
data = [4, 2, 6, 1, 5]
for x in data:
    mq.push(x)
window = list(data)
while window:
    assert mq.minimum() == min(window)
    mq.pop()
    window.pop(0)
```

The counts remember how many original elements each stored value stands for, so `pop` knows when the front value really leaves. All operations are amortized $O(1)$.

## Application: minimum of every window of length $k$

Slide a window over the array: push the entering element, pop the leaving one, read the minimum. Total time $O(n)$ (a naive scan would be $O(nk)$):

```python
def sliding_window_min(a, k):
    dq = deque()                              # indices with increasing values
    result = []
    for i, x in enumerate(a):
        while dq and a[dq[-1]] >= x:
            dq.pop()
        dq.append(i)
        if dq[0] <= i - k:                    # front index left the window
            dq.popleft()
        if i >= k - 1:
            result.append(a[dq[0]])
    return result

assert sliding_window_min([1, 3, -1, -3, 5, 3, 6, 7], 3) == [-1, -3, -3, -3, 3, 3]

import random
random.seed(8)
for _ in range(200):
    n = random.randint(1, 30)
    arr = [random.randint(-20, 20) for _ in range(n)]
    k = random.randint(1, n)
    assert sliding_window_min(arr, k) == [min(arr[i : i + k]) for i in range(n - k + 1)]
```

Replace `>=` by `<=` for the maximum. The same technique is used in DP optimizations ("monotone queue optimization").

## Practice problems

- [Queries with Fixed Length](https://www.hackerrank.com/challenges/queries-with-fixed-length/problem)
- [Sliding Window Minimum](https://cses.fi/problemset/task/3221)
- [Binary Land](https://www.codechef.com/MAY20A/problems/BINLAND)
