---
title: Heaps, Deques and Bisect
section: Standard library toolbox
order: 2
difficulty: intermediate
summary: Priority queues with heapq, O(1) queues with deque, and binary search on sorted lists with bisect.
tags: [heapq, deque, bisect, priority queue]
prerequisites: [python-contests/standard-library-toolbox]
---

Three small modules turn common $O(n)$ operations into $O(\log n)$ or $O(1)$, and they underlie many algorithms in this course.

## `heapq`: a priority queue

A **heap** stores items so that the smallest one can be read in $O(1)$ and removed in $O(\log n)$. Python's `heapq` implements a *min*-heap on top of a plain list.

```python
import heapq

h = []
for x in [5, 1, 8, 3]:
    heapq.heappush(h, x)             # O(log n)

assert h[0] == 1                     # the minimum is always at index 0
assert heapq.heappop(h) == 1         # O(log n)
assert heapq.heappop(h) == 3
assert len(h) == 2
```

Turn an existing list into a heap in $O(n)$ with `heapify`:

```python
a = [9, 4, 7, 1]
heapq.heapify(a)
assert a[0] == 1
assert [heapq.heappop(a) for _ in range(4)] == [1, 4, 7, 9]      # heap sort
```

### Max-heap trick

Only a min-heap exists, so store negated values:

```python
h = []
for x in [5, 1, 8]:
    heapq.heappush(h, -x)
assert -heapq.heappop(h) == 8
```

### Tuples as priorities

Tuples compare element by element, so `(priority, payload)` works. This is how [Dijkstra's algorithm](/theory/graphs/dijkstra) keeps `(distance, vertex)` pairs:

```python
tasks = []
heapq.heappush(tasks, (2, "write"))
heapq.heappush(tasks, (1, "plan"))
heapq.heappush(tasks, (3, "test"))
assert heapq.heappop(tasks) == (1, "plan")
```

### k largest / smallest

```python
data = [7, 2, 9, 4, 1, 8]
assert heapq.nlargest(3, data) == [9, 8, 7]
assert heapq.nsmallest(2, data) == [1, 2]
assert heapq.nlargest(1, ["aa", "b", "cccc"], key=len) == ["cccc"]
```

A heap does **not** support fast search or deletion of an arbitrary element. The usual workaround is *lazy deletion*: leave stale entries in the heap and skip them when they surface.

## `deque`: a queue with O(1) at both ends

`list.pop(0)` shifts every remaining element, so it costs $O(n)$. On 100,000 elements, emptying a list with `pop(0)` took 0.79 s in our test; a deque took 0.008 s.

```python
from collections import deque

q = deque()
q.append(1); q.append(2); q.append(3)      # enqueue at the right
assert q.popleft() == 1                     # dequeue from the left, O(1)
q.appendleft(0)
assert list(q) == [0, 2, 3]
assert q[0] == 0 and q[-1] == 3             # indexing the ends is O(1)
```

Use a `deque` for [BFS](/theory/graphs/breadth-first-search), sliding windows and any FIFO queue. With `maxlen` it keeps only the last $k$ items:

```python
last3 = deque(maxlen=3)
for x in range(6):
    last3.append(x)
assert list(last3) == [3, 4, 5]
```

## `bisect`: binary search on a sorted list

`bisect` finds where to insert a value in a sorted list, in $O(\log n)$.

```python
from bisect import bisect_left, bisect_right, insort

a = [1, 3, 3, 3, 7, 9]
assert bisect_left(a, 3) == 1        # first index with a[i] >= 3
assert bisect_right(a, 3) == 4       # first index with a[i] > 3
assert bisect_right(a, 3) - bisect_left(a, 3) == 3     # how many times 3 occurs
assert bisect_left(a, 5) == 4        # where 5 would be inserted
assert bisect_left(a, 100) == 6

insort(a, 5)                         # insert keeping the list sorted (the insertion itself is O(n))
assert a == [1, 3, 3, 3, 5, 7, 9]
```

Common questions and their one-liners on a sorted list `a`:

```python
a = [1, 3, 3, 3, 5, 7, 9]

def contains(a, x):
    i = bisect_left(a, x)
    return i < len(a) and a[i] == x

def largest_not_greater(a, x):           # predecessor
    i = bisect_right(a, x)
    return a[i - 1] if i else None

def smallest_greater(a, x):              # successor
    i = bisect_right(a, x)
    return a[i] if i < len(a) else None

assert contains(a, 5) and not contains(a, 4)
assert largest_not_greater(a, 6) == 5
assert smallest_greater(a, 7) == 9 and smallest_greater(a, 9) is None
```

For searching on an *answer* instead of an array, see [Binary Search](/theory/searching/binary-search).

## Complexity cheat sheet

| Structure | Operation | Cost |
|-----------|-----------|------|
| `list` | `append`, `pop()` | $O(1)$ |
| `list` | `insert(i, x)`, `pop(0)`, `x in a` | $O(n)$ |
| `deque` | `append`, `appendleft`, `pop`, `popleft` | $O(1)$ |
| `heapq` | `heappush`, `heappop` | $O(\log n)$ |
| `heapq` | `heapify` | $O(n)$ |
| `set` / `dict` | insert, delete, `in` | $O(1)$ average |
| `bisect` | search in a sorted list | $O(\log n)$ |

## Exercises

1. Merge $k$ sorted lists into one using a heap (or `heapq.merge`).
2. Maintain the median of a stream with two heaps.
3. For each element of an array, find the nearest greater element to the right using a stack, then compare with a `bisect` approach.
4. Simulate a queue at a bank with `deque` given arrival times.
