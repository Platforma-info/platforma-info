---
title: "MEX (Minimal Excluded) of a Sequence"
section: Sequences
order: 3
difficulty: intermediate
summary: "Find the smallest non-negative integer missing from an array in O(N), and maintain it under point updates with counts and a heap of missing values."
tags: [mex, sets, heap, sequences, updates]
prerequisites: [python-basics/dictionaries-and-sets, python-contests/heaps-deques-and-bisect]
source:
  title: "MEX (minimal excluded) of a sequence"
  url: https://cp-algorithms.com/sequences/mex.html
  license: CC BY-SA 4.0
---

Given an array $A$ of size $N$, its **MEX** (minimal excluded value) is the smallest non-negative integer that does not occur in the array:

$$
\begin{aligned}
\operatorname{mex}(\{0, 1, 2, 4, 5\}) &= 3\\
\operatorname{mex}(\{0, 1, 2, 3, 4\}) &= 5\\
\operatorname{mex}(\{1, 2, 3, 4, 5\}) &= 0
\end{aligned}
$$

The MEX of an array of size $N$ is never bigger than $N$: only $N$ distinct values are present, so among $0, 1, \dots, N$ one is missing.

## Computing it once

Put the elements in a set and test $0, 1, 2, \dots$ until one is missing. That's $O(N)$ expected time with a hash set, and only numbers up to $N$ matter:

```python
def mex(a):
    present = set(a)
    result = 0
    while result in present:
        result += 1
    return result

assert mex([0, 1, 2, 4, 5]) == 3 and mex([0, 1, 2, 3, 4]) == 5 and mex([1, 2, 3, 4, 5]) == 0
assert mex([]) == 0 and mex([7, 7, 7]) == 0
```

(In C++ the same is done with a boolean array of size $N+1$ instead of a set; in Python a `set` is just as good.)

## With updates

Now suppose individual elements are **changed** ("set `A[idx] = new_value`"), and after each change we need the new MEX. Recomputing costs $O(N)$ each time.

**Approach 1: a tree over the values.** Keep, for each value $0..N$, its frequency, and build a segment tree over the values where each node stores how many *distinct* values present its range has. The MEX is found by descending: if the left half $[l, m)$ has fewer than $m - l$ distinct values, a value is missing there, so go left; otherwise go right. Updates and queries take $O(\log N)$.

**Approach 2: counts and a set of missing values.** Keep the frequency of every value and the **set of missing values** in $0..N$. The MEX is the minimum of that set. In C++, `std::set` gives $O(\log N)$ updates and an $O(1)$ query. Python has no ordered set, but a **heap with lazy deletion** does the same job: push a value onto the heap when its count drops to zero; pop entries from the top while they are stale (their count is positive again).

```python
import heapq

class Mex:
    def __init__(self, a):
        self.a = list(a)
        self.n = len(a)
        self.count = {}
        for x in self.a:
            self.count[x] = self.count.get(x, 0) + 1
        self.missing = [v for v in range(self.n + 1) if v not in self.count]    # already a valid heap: sorted
        # (the values 0..n that occur nowhere in the array)

    def mex(self):
        while self.count.get(self.missing[0], 0) > 0:      # a stale entry: the value is present again
            heapq.heappop(self.missing)
        return self.missing[0]

    def update(self, idx, new_value):
        old = self.a[idx]
        if old == new_value:
            return
        self.count[old] -= 1
        if self.count[old] == 0 and old <= self.n:
            heapq.heappush(self.missing, old)               # the old value is missing now
        self.a[idx] = new_value
        self.count[new_value] = self.count.get(new_value, 0) + 1

m = Mex([0, 1, 2, 4, 5])
assert m.mex() == 3
m.update(3, 3)                       # the array is 0 1 2 3 5
assert m.mex() == 4
m.update(0, 9)                       # 9 1 2 3 5
assert m.mex() == 0
m.update(1, 0)                       # 9 0 2 3 5
assert m.mex() == 1
```

`self.missing` always contains every value in $0..N$ that is really absent; it may also contain values that were later re-added (stale entries), which the query loop discards. Every value is pushed and popped a bounded number of times per update, so the total time is $O((N + Q)\log N)$ for $Q$ updates. A value that is re-inserted after being popped is pushed again when its count returns to zero.

## Testing

```python
import random

rnd = random.Random(1)
for _ in range(300):
    n = rnd.randint(1, 12)
    a = [rnd.randint(0, n + 1) for _ in range(n)]
    m = Mex(a)
    assert m.mex() == mex(a)
    for _ in range(40):
        idx, value = rnd.randrange(n), rnd.randint(0, n + 2)
        a[idx] = value
        m.update(idx, value)
        assert m.mex() == mex(a)
```

## Where MEX appears

MEX is central in **combinatorial game theory**: the *Grundy number* (nim-value) of a position is the MEX of the Grundy numbers of the positions it can move to; see [games on graphs](/theory/miscellaneous/games-on-graphs). It also appears in constructive problems ("make the array's MEX equal to $x$") and in queries about the MEX of a subarray (typically solved offline with a segment tree over the values).

## Practice problems

- [AtCoder: Neq Min](https://atcoder.jp/contests/hhkb2020/tasks/hhkb2020_c)
- [Codeforces: Informatics in MAC](https://codeforces.com/contest/1935/problem/B)
- [Codeforces: Replace by MEX](https://codeforces.com/contest/1375/problem/D)
- [Codeforces: Vitya and Strange Lesson](https://codeforces.com/problemset/problem/842/D)
- [Codeforces: MEX Queries](https://codeforces.com/contest/817/problem/F)
