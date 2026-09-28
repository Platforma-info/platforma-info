---
title: "Scheduling with Deadlines and Durations"
section: Scheduling
order: 3
difficulty: intermediate
summary: "Complete as many jobs as possible before their deadlines: go through the deadlines backwards, filling each time gap with the shortest remaining jobs, in O(n log n)."
tags: [scheduling, greedy, deadlines, priority queue, interval scheduling]
prerequisites: [python-contests/heaps-deques-and-bisect]
source:
  title: "Optimal schedule of jobs given their deadlines and durations"
  url: https://cp-algorithms.com/schedules/schedule-with-completion-duration.html
  license: CC BY-SA 4.0
---

We have a set of jobs, each with a **deadline** and a **duration**. A job cannot be interrupted once started, and a job counts only if it is *completed* by its deadline. Choose a schedule that completes the **maximum number of jobs**.

## Greedy algorithm

Sort the jobs by deadline and look at them in **descending** order. Keep a priority queue $q$ that supports extracting the job with the least remaining duration. Initially $q$ is empty.

When we look at job $i$ (with the deadline $d_i$, the next smaller deadline being $d_{i-1}$):

1. Put job $i$ into $q$.
2. The period between $d_{i-1}$ and $d_i$ is a gap of length $T = d_i - d_{i-1}$. Fill it: repeatedly extract the shortest job from $q$ and execute it; if it fits entirely into the remaining part of the gap, it is completed and the gap shrinks; if it does not fit, execute it partly, just as far as the gap allows, and return the **unfinished remainder** to $q$.
3. Stop when the gap is filled or $q$ is empty.

At the end the completed jobs form an optimal set. Time $O(n\log n)$.

Intuition: viewed from the end of time backwards, every gap can only be used by jobs that have a deadline no smaller than the gap's end; among those we prefer the shortest, since the partial work on a job means "it will have been done earlier" and shorter jobs leave more room. The remainder that we push back represents a job whose tail was executed here and whose head must be executed earlier.

## Implementation

The function returns the indices of the jobs used in an optimal schedule (to write out the plan explicitly, sort them by deadline).

```python
import heapq

def compute_schedule(jobs):
    """jobs: list of (deadline, duration). Returns the indices of the jobs that get completed."""
    order = sorted(range(len(jobs)), key=lambda i: jobs[i][0])
    heap, schedule = [], []
    for pos in range(len(order) - 1, -1, -1):
        deadline, duration = jobs[order[pos]]
        previous_deadline = jobs[order[pos - 1]][0] if pos else 0
        gap = deadline - previous_deadline
        heapq.heappush(heap, (duration, order[pos]))
        while gap and heap:
            remaining, idx = heapq.heappop(heap)
            if remaining <= gap:
                gap -= remaining
                schedule.append(idx)                    # the job is completed
            else:
                heapq.heappush(heap, (remaining - gap, idx))
                gap = 0
    return schedule

jobs = [(2, 2), (3, 1), (4, 2), (4, 3)]
chosen = compute_schedule(jobs)
assert len(chosen) == 2
```

## Feasibility and testing

A set of jobs can all be completed iff, when sorted by deadline (earliest deadline first), each job's completion time (the sum of durations so far) does not exceed its deadline. We use this to check the algorithm against an exhaustive search over all subsets:

```python
import random
from itertools import combinations

def feasible(jobs, subset):
    elapsed = 0
    for i in sorted(subset, key=lambda i: jobs[i][0]):
        elapsed += jobs[i][1]
        if elapsed > jobs[i][0]:
            return False
    return True

def best_count(jobs):
    n = len(jobs)
    for size in range(n, -1, -1):
        if any(feasible(jobs, s) for s in combinations(range(n), size)):
            return size

rnd = random.Random(1)
for _ in range(600):
    n = rnd.randint(1, 8)
    jobs = [(rnd.randint(1, 12), rnd.randint(1, 5)) for _ in range(n)]
    chosen = compute_schedule(jobs)
    assert len(set(chosen)) == len(chosen)
    assert feasible(jobs, chosen)                      # the jobs it reports can really be scheduled
    assert len(chosen) == best_count(jobs)             # and no larger set can
```

## The classical variant: unit durations with profits

When every job has the *same* duration and different profits, the greedy is different: process jobs by decreasing profit and place each in the latest free slot before its deadline (with a DSU to find the free slot). The version in this article, with arbitrary durations, maximizes the number of jobs (Moore–Hodgson's algorithm solves the same problem with a slightly different exchange step: schedule by deadline, and whenever the deadline is exceeded, drop the longest job so far).

```python
def moore_hodgson(jobs):
    """Maximum number of jobs completed by their deadlines (Moore-Hodgson)."""
    heap, elapsed = [], 0
    for deadline, duration in sorted(jobs):
        heapq.heappush(heap, -duration)
        elapsed += duration
        if elapsed > deadline:
            elapsed += heapq.heappop(heap)              # drop the longest job so far
    return len(heap)

for _ in range(300):
    n = rnd.randint(1, 8)
    jobs = [(rnd.randint(1, 12), rnd.randint(1, 5)) for _ in range(n)]
    assert moore_hodgson(jobs) == len(compute_schedule(jobs)) == best_count(jobs)
```
