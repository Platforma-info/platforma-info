---
title: "Length of the Union of Segments"
section: Elementary operations
order: 10
difficulty: beginner
summary: "Klee's O(n log n) sweep: sort all endpoints and add up the stretches during which at least one segment is open."
tags: [geometry, segments, sweep line, sorting, union]
prerequisites: [python-basics/lists-and-tuples]
source:
  title: "Length of the union of segments"
  url: https://cp-algorithms.com/geometry/length-of-segments-union.html
  license: CC BY-SA 4.0
---

We are given $n$ segments on a line, each by a pair of coordinates $(a_{i1}, a_{i2})$. Find the total length of their union. The algorithm below was proposed by Klee in 1977 and runs in $O(n\log n)$, which is asymptotically optimal.

## Solution

Collect all endpoints, labelled as a *left* end (segment opens) or a *right* end (segment closes), and sort them by coordinate. Sweep from left to right, keeping a counter $c$ of currently open segments. Each time we move to a new coordinate while $c > 0$, the stretch we just crossed is covered, so we add its length.

Ties are harmless: at the same coordinate the added length is zero, so the order of opening and closing there does not matter.

## Implementation

```python
def length_union(segments):
    events = []
    for a, b in segments:
        if a > b:
            a, b = b, a
        events.append((a, 1))            # opens
        events.append((b, -1))           # closes
    events.sort()
    total, open_count = 0, 0
    for i, (x, delta) in enumerate(events):
        if i > 0 and x > events[i - 1][0] and open_count > 0:
            total += x - events[i - 1][0]
        open_count += delta
    return total

assert length_union([]) == 0
assert length_union([(1, 4)]) == 3
assert length_union([(1, 4), (2, 6)]) == 5                # overlapping
assert length_union([(1, 2), (3, 4)]) == 2                # disjoint: the gap does not count
assert length_union([(1, 2), (2, 3)]) == 2                # touching
assert length_union([(0, 10), (2, 3), (4, 5)]) == 10      # nested
assert length_union([(5, 1), (2, 3)]) == 4                # reversed endpoints are fine
assert length_union([(1, 1), (2, 2)]) == 0                # points have no length
```

## Merging intervals: an alternative

Sorting the segments by their left end and merging overlapping ones is equivalent and often shorter:

```python
def length_union_merge(segments):
    total, end = 0, None
    for a, b in sorted((min(s), max(s)) for s in segments):
        if end is None or a > end:
            total += b - a
            end = b
        elif b > end:
            total += b - end
            end = b
    return total

assert length_union_merge([(1, 4), (2, 6), (8, 9)]) == 6
```

## Testing against brute force

With integer endpoints in a small range, the union length equals the number of unit cells $[k, k+1]$ covered by at least one segment:

```python
import random

def brute(segments, hi):
    covered = set()
    for a, b in segments:
        a, b = min(a, b), max(a, b)
        covered.update(range(a, b))
    return len(covered)

rnd = random.Random(4)
for _ in range(2000):
    segs = [(rnd.randint(0, 20), rnd.randint(0, 20)) for _ in range(rnd.randint(0, 8))]
    expected = brute(segs, 20)
    assert length_union(segs) == expected == length_union_merge(segs)
```

## Variations

- The same sweep over *events* computes the **area of a union of rectangles** (then the counter is replaced by a [segment tree](/theory/data-structures/segment-tree) over the $y$ coordinates) and many other measure problems.
- Storing the counter per *color* or per label lets you compute how long each number of segments overlaps, e.g. the length covered at least twice.

```python
def length_covered_at_least(segments, k):
    events = sorted([(min(s), 1) for s in segments] + [(max(s), -1) for s in segments])
    total, opened = 0, 0
    for i, (x, delta) in enumerate(events):
        if i > 0 and opened >= k:
            total += x - events[i - 1][0]
        opened += delta
    return total

assert length_covered_at_least([(0, 4), (2, 6), (3, 5)], 1) == 6
assert length_covered_at_least([(0, 4), (2, 6), (3, 5)], 2) == 3       # [2, 5]
assert length_covered_at_least([(0, 4), (2, 6), (3, 5)], 3) == 1       # [3, 4]
```
