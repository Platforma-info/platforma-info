---
title: "Scheduling Jobs on One Machine"
section: Scheduling
order: 1
difficulty: intermediate
summary: "Order jobs on a single machine to minimize the total waiting penalty; the permutation (adjacent swap) method gives a sorting solution for linear, exponential and identical penalty functions."
tags: [scheduling, greedy, exchange argument, permutation method, sorting]
prerequisites: [python-basics/lists-and-tuples]
source:
  title: "Scheduling jobs on one machine"
  url: https://cp-algorithms.com/schedules/schedule_one_machine.html
  license: CC BY-SA 4.0
---

We have $n$ jobs and a single machine. Job $i$ takes $t_i$ time to process, and waiting for $t$ time units before its processing starts costs a penalty $f_i(t)$. Find an order (permutation $\pi$) of the jobs that minimizes the total penalty:

$$
F(\pi) = f_{\pi_1}(0) + f_{\pi_2}(t_{\pi_1}) + f_{\pi_3}(t_{\pi_1} + t_{\pi_2}) + \dots + f_{\pi_n}\!\Big(\sum_{i=1}^{n-1} t_{\pi_i}\Big)
$$

In general the problem is hard; there are three special cases with a simple sorting solution, all derived by the **permutation method**: swap two adjacent jobs in an optimal schedule, compute the change in the penalty, and read off the condition that no swap may improve the schedule.

```python
def total_penalty(order, times, penalty):
    """order: job indices; times[i]: processing time; penalty(i, t): the penalty of job i waiting t."""
    total, elapsed = 0, 0
    for job in order:
        total += penalty(job, elapsed)
        elapsed += times[job]
    return total
```

## Linear penalties

Let $f_i(t) = c_i\cdot t$ with $c_i\ge0$ (a constant term could be summed up separately and dropped).

Take a schedule $\pi$ and swap the jobs at positions $i$ and $i+1$. Only these two summands change, and the difference simplifies to

$$
F(\pi') - F(\pi) = c_{\pi_i}\,t_{\pi_{i+1}} - c_{\pi_{i+1}}\,t_{\pi_i}
$$

In an optimal schedule this cannot be negative for any $i$:

$$
c_{\pi_i}\,t_{\pi_{i+1}} - c_{\pi_{i+1}}\,t_{\pi_i}\ge 0\iff\frac{c_{\pi_i}}{t_{\pi_i}}\ge\frac{c_{\pi_{i+1}}}{t_{\pi_{i+1}}}
$$

So the optimal schedule is obtained by **sorting the jobs by $c_i/t_i$ in non-increasing order**: do first the jobs that are costly to delay and short to process. (This is the classic "Smith's rule".)

```python
from fractions import Fraction

def schedule_linear(times, costs):
    """Jobs sorted by c/t, largest first (exact, with fractions)."""
    return sorted(range(len(times)), key=lambda i: -Fraction(costs[i], times[i]))

times, costs = [3, 1, 2], [3, 5, 1]
order = schedule_linear(times, costs)
assert order == [1, 0, 2]
assert total_penalty(order, times, lambda i, t: costs[i] * t) == 5 * 0 + 3 * 1 + 1 * 4
```

## Exponential penalties

Let $f_i(t) = c_i\,e^{\alpha t}$ with $c_i \ge 0$ and $\alpha > 0$. The same argument shows that the jobs should be sorted in non-increasing order of

$$
v_i = \frac{1 - e^{\alpha t_i}}{c_i}
$$

(a job with $c_i = 0$ never costs anything and can go last).

```python
import math

def schedule_exponential(times, costs, alpha):
    def key(i):
        return -(1 - math.exp(alpha * times[i])) / costs[i] if costs[i] > 0 else float("-inf")
    return sorted(range(len(times)), key=key)
```

## Identical monotone penalty

If all $f_i(t) = \varphi(t)$ are the same **non-decreasing** function, then it is best to start with the shortest jobs: sort by non-decreasing $t_i$ (each job's waiting time is then as small as possible).

```python
def schedule_identical(times):
    return sorted(range(len(times)), key=times.__getitem__)
```

## The Livshits–Kladov theorem

The permutation method (sorting by a key) works **only** for these three cases, in the following sense: under the assumption of smooth penalty functions, the theorem says that the penalty functions must be

- linear: $f_i(t) = c_i t + d_i$ with $c_i \ge 0$;
- exponential: $f_i(t) = c_i e^{\alpha t} + d_i$ with $c_i, \alpha > 0$;
- identical: $f_i = \varphi$, a monotone increasing function.

For any other family of penalty functions, no such comparison-based rule exists in general. All three solutions take $O(n\log n)$.

## Testing against all permutations

Each rule is compared with the best permutation found by exhaustive search (small $n$):

```python
import random
from itertools import permutations

def check_linear(times, costs):
    linear = lambda i, t: costs[i] * t
    best = min(total_penalty(p, times, linear) for p in permutations(range(len(times))))
    assert total_penalty(schedule_linear(times, costs), times, linear) == best

def check_exponential(times, costs, alpha):
    expo = lambda i, t: costs[i] * math.exp(alpha * t)
    best = min(total_penalty(p, times, expo) for p in permutations(range(len(times))))
    got = total_penalty(schedule_exponential(times, costs, alpha), times, expo)
    assert abs(got - best) <= 1e-9 * max(1.0, best)

def check_identical(times, phi):
    same = lambda i, t: phi(t)
    best = min(total_penalty(p, times, same) for p in permutations(range(len(times))))
    assert total_penalty(schedule_identical(times), times, same) == best

rnd = random.Random(1)
for _ in range(300):
    n = rnd.randint(1, 6)
    times = [rnd.randint(1, 6) for _ in range(n)]
    check_linear(times, [rnd.randint(0, 9) for _ in range(n)])
    check_exponential(times, [rnd.randint(1, 9) for _ in range(n)], rnd.choice([0.1, 0.5, 1.0]))
    check_identical(times, lambda t: t * t + 3 * t)
    check_identical(times, lambda t: math.sqrt(t))
```

## The permutation method in general

The recipe to solve a scheduling problem by exchange arguments:

1. Write the cost of a schedule, and compare it with the cost after swapping two **adjacent** jobs; only the two swapped terms change.
2. Turn "the swap does not help" into an inequality between the two jobs that does not involve any other job, like $c_i t_j \ge c_j t_i$.
3. If this inequality defines a consistent total order (a key), sorting by it gives the optimal schedule; adjacent swaps can then bubble any permutation into the sorted one without ever improving.

The same method gives [Johnson's rule](/theory/miscellaneous/scheduling-two-machines) for two machines.
