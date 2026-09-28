---
title: "Scheduling Jobs on Two Machines: Johnson's Rule"
section: Scheduling
order: 2
difficulty: intermediate
summary: "Every job goes through machine 1 and then machine 2; Johnson's rule orders the jobs by a simple sorting rule to minimize the total completion time."
tags: [scheduling, johnson's rule, flow shop, greedy, exchange argument]
prerequisites: [miscellaneous/scheduling-one-machine]
source:
  title: "Scheduling jobs on two machines"
  url: https://cp-algorithms.com/schedules/schedule_two_machines.html
  license: CC BY-SA 4.0
---

There are $n$ jobs and two machines. Every job must be processed **first on machine 1 and then on machine 2**; job $i$ takes $a_i$ time on the first machine and $b_i$ time on the second. Each machine handles one job at a time. Find the order of jobs that minimizes the time when everything is finished. (With three or more machines the problem is NP-hard.) The solution is **Johnson's rule** (S. M. Johnson, 1954).

## Derivation

First, the order of the jobs may be assumed to be the same on both machines: jobs arrive to machine 2 in the order in which machine 1 finished them, and the total time for machine 2 to process all waiting jobs does not depend on their order.

For a fixed order $1, 2, \dots, n$ let $x_i$ be the **idle time** of machine 2 right before job $i$. The finish time is $\sum b_i + \sum x_i$, so we must minimize the total idle time. One can show by induction that

$$
\sum_i x_i = \max_{k=1..n} K_k,\qquad K_k = \sum_{i=1}^k a_i - \sum_{i=1}^{k-1} b_i
$$

Apply the **permutation method**: swap two neighbouring jobs $j$ and $j+1$; only $K_j$ and $K_{j+1}$ change. The swap does not help if $\max(K_j, K_{j+1}) \le \max(K_j', K_{j+1}')$. After cancelling the common terms, this becomes

$$
\min(a_j, b_{j+1}) \le \min(b_j, a_{j+1})
$$

which is a comparator; sorting with it gives a schedule in which no adjacent swap helps.

## Johnson's rule

The comparator has a simple reading. Look at the smallest of the four times $a_j, b_j, a_{j+1}, b_{j+1}$: if it belongs to machine 1, that job should go earlier; if it belongs to machine 2, later. In practice:

1. Split the jobs into two groups: those with $a_i < b_i$ and the rest.
2. Sort the first group by $a_i$ **increasing**, and the second group by $b_i$ **decreasing**.
3. The schedule is the first group followed by the second group.

Equivalently, sort all jobs by $\min(a_i, b_i)$; jobs with $a_i < b_i$ go to the front in that order, and the others to the back (the last of the sorted list being placed last). Time $O(n\log n)$.

## Implementation

```python
def johnsons_rule(jobs):
    """jobs: list of (a, b). Returns the order of the job indices."""
    front = sorted((i for i in range(len(jobs)) if jobs[i][0] < jobs[i][1]), key=lambda i: jobs[i][0])
    back = sorted((i for i in range(len(jobs)) if jobs[i][0] >= jobs[i][1]), key=lambda i: -jobs[i][1])
    return front + back

def finish_times(jobs, order):
    """(finish time of machine 1, finish time of machine 2) for a given order."""
    t1 = t2 = 0
    for i in order:
        a, b = jobs[i]
        t1 += a
        t2 = max(t2, t1) + b
    return t1, t2

jobs = [(3, 6), (5, 2), (1, 2), (6, 6), (7, 5)]
order = johnsons_rule(jobs)
assert order == [2, 0, 3, 4, 1]
assert finish_times(jobs, order) == (22, 24)
```

## Testing against all permutations

```python
import random
from itertools import permutations

rnd = random.Random(1)
for _ in range(500):
    n = rnd.randint(1, 7)
    jobs = [(rnd.randint(1, 9), rnd.randint(1, 9)) for _ in range(n)]
    best = min(finish_times(jobs, p)[1] for p in permutations(range(n)))
    assert finish_times(jobs, johnsons_rule(jobs))[1] == best
```

## Remarks

- The finishing time on machine 2 is at least $\max\big(\sum a_i + \min b_i,\ \min a_i + \sum b_i\big)$; the optimal schedule can be computed, and compared with this bound, in $O(n\log n)$.
- The rule is a special case of the *flow shop* problem; for $m \ge 3$ machines only heuristics and branch and bound remain (a 3-machine special case, when the middle machine is dominated, reduces to Johnson's rule with $a_i + b_i$ and $b_i + c_i$).
