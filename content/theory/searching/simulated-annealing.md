---
title: "Simulated Annealing"
section: Search
order: 4
difficulty: advanced
summary: "A randomized local search that sometimes accepts worse solutions, with a decreasing temperature, to escape local optima; applied to the travelling salesman problem."
tags: [simulated annealing, heuristics, optimization, tsp, randomized]
prerequisites: [python-basics/functions]
source:
  title: "Simulated Annealing"
  url: https://cp-algorithms.com/num_methods/simulated_annealing.html
  license: CC BY-SA 4.0
---

Many optimization problems are too hard to solve exactly in the time available (NP-hard problems such as the travelling salesman problem, scheduling, layout, packing). A **heuristic** finds a good, though not necessarily optimal, solution. **Simulated annealing** is a simple and surprisingly effective one, inspired by metallurgy: when a hot metal is cooled slowly, its atoms settle into a low-energy crystal structure.

## The problem and the landscape

We are given a set of *states* $s$ and an **energy function** $E(s)$ to minimize. Think of the states as points of a landscape and $E$ as the altitude. A plain **hill-descent** repeatedly moves to a better neighbouring state and stops in the first valley it finds, a *local minimum*, which may be far from the global one.

Simulated annealing also accepts **worse** neighbours, with a probability that shrinks as the search proceeds, so it can climb out of shallow valleys early on and gradually settles in a deep one.

## The algorithm

Keep the current state $s$ and a **temperature** $T$ (initially high). Repeat:

1. Pick a random neighbour $s'$ of $s$.
2. If $E(s') < E(s)$, move to $s'$.
3. Otherwise move to $s'$ with probability $\exp\!\big(-(E(s') - E(s))/T\big)$.
4. Lower the temperature: $T \leftarrow \alpha T$ with $0 < \alpha < 1$ (geometric cooling).

At high $T$ the acceptance probability is close to 1 (almost a random walk); as $T \to 0$ only improvements are accepted (hill descent). Remember the best state seen.

```python
import math
import random

def simulated_annealing(initial, energy, neighbour, t0=10.0, alpha=0.999, iterations=20000, seed=1):
    """Generic minimizer. Returns (best_energy, best_state)."""
    rnd = random.Random(seed)
    state, current = initial, energy(initial)
    best_state, best = state, current
    t = t0
    for _ in range(iterations):
        candidate = neighbour(state, rnd)
        e = energy(candidate)
        if e < current or rnd.random() < math.exp((current - e) / t):
            state, current = candidate, e
            if current < best:
                best_state, best = state, current
        t *= alpha
    return best, best_state
```

The three ingredients you must supply are the **state**, the **energy function** and the **neighbour move**; a good neighbour move changes the state a little, so that nearby states have similar energy.

## Example: the travelling salesman problem (TSP)

Given $n$ points in the plane, find the shortest closed tour visiting every point once.

- **State:** a permutation of the points (the tour order).
- **Energy:** the length of the tour.
- **Neighbour:** reverse a random segment of the tour (a *2-opt move*), which replaces two edges by two others.

```python
from itertools import permutations

def tour_length(order, pts):
    return sum(math.dist(pts[order[i]], pts[order[(i + 1) % len(order)]]) for i in range(len(order)))

def two_opt_move(order, rnd):
    i, j = sorted(rnd.sample(range(len(order)), 2))
    return order[:i] + order[i:j + 1][::-1] + order[j + 1:]

def solve_tsp(pts, seed=1, iterations=20000):
    order = list(range(len(pts)))
    random.Random(seed).shuffle(order)
    return simulated_annealing(order, lambda o: tour_length(o, pts), two_opt_move,
                               t0=10.0, alpha=0.999, iterations=iterations, seed=seed)

def tsp_brute_force(pts):
    n = len(pts)
    return min(tour_length((0,) + p, pts) for p in permutations(range(1, n)))

rnd = random.Random(5)
for n in (7, 8, 9):
    pts = [(rnd.random() * 100, rnd.random() * 100) for _ in range(n)]
    optimum = tsp_brute_force(pts)
    for seed in range(3):
        best, tour = solve_tsp(pts, seed=seed)
        assert sorted(tour) == list(range(n))                     # a valid tour
        assert abs(best - tour_length(tour, pts)) < 1e-9
        assert abs(best - optimum) < 1e-9                         # annealing finds the optimum on these instances
```

For these tiny instances (compared against exhaustive search) the annealing finds the optimal tour with every seed. For hundreds of points it usually gets within a few percent of the optimum, far faster than any exact method.

### Comparison with hill descent

The same code with the temperature forced towards zero (accept only improvements) is hill descent, and it can get stuck. A quick experiment counts how often each finds the optimum on random 10-city instances:

```python
def hill_descent(pts, seed):
    return simulated_annealing(list(range(len(pts))), lambda o: tour_length(o, pts), two_opt_move,
                               t0=1e-9, alpha=1.0, iterations=3000, seed=seed)[0]

rnd = random.Random(11)
wins_sa = wins_hd = 0
for _ in range(6):
    pts = [(rnd.random() * 100, rnd.random() * 100) for _ in range(9)]
    optimum = tsp_brute_force(pts)
    wins_sa += abs(solve_tsp(pts, seed=1, iterations=6000)[0] - optimum) < 1e-9
    wins_hd += abs(hill_descent(pts, seed=1) - optimum) < 1e-9
assert wins_sa >= wins_hd
```

## Choosing the parameters

- **Initial temperature $T_0$:** on the scale of typical energy differences between neighbours; too low and you never escape the first valley, too high and time is wasted on a random walk.
- **Cooling factor $\alpha$:** slower cooling ($\alpha$ closer to 1) gives better results and costs more iterations. A common choice is $\alpha \in [0.99, 0.9999]$.
- **Iterations:** as many as the time limit allows; a run with a time budget can compute $\alpha$ from the wanted final temperature.
- **Acceptance function:** $\exp(-\Delta E/T)$ is the standard (Metropolis) choice.

```python
def cooling_factor(t_start, t_end, steps):
    """The alpha that takes the temperature from t_start to t_end in `steps` geometric steps."""
    return (t_end / t_start) ** (1 / steps)

alpha = cooling_factor(10.0, 0.001, 20000)
assert abs(10.0 * alpha ** 20000 - 0.001) < 1e-9
```

## Further improvements

- **Restarts:** run several independent annealings and keep the best.
- **Reheating:** occasionally raise the temperature if progress stalls.
- **Incremental energy:** compute the *change* in energy of a move in $O(1)$ (for 2-opt, only four points matter) instead of recomputing the full tour length; this often gives a 100x speed-up.
- **Problem-specific moves:** choose neighbour moves that preserve feasibility.

```python
def two_opt_delta(order, pts, i, j):
    """Change in tour length when reversing order[i..j] (i < j), computed in O(1)."""
    n = len(order)
    a, b = order[i - 1], order[i]
    c, d = order[j], order[(j + 1) % n]
    d_ = lambda p, q: math.dist(pts[p], pts[q])
    return d_(a, c) + d_(b, d) - d_(a, b) - d_(c, d)

rnd = random.Random(3)
pts = [(rnd.random() * 100, rnd.random() * 100) for _ in range(12)]
order = list(range(12))
for _ in range(200):
    i, j = sorted(rnd.sample(range(1, 12), 2))
    candidate = order[:i] + order[i:j + 1][::-1] + order[j + 1:]
    assert abs(tour_length(candidate, pts) - tour_length(order, pts) - two_opt_delta(order, pts, i, j)) < 1e-9
```

## When to use it

Simulated annealing shines in *optimization-with-scoring* problems (heuristic contests, layout, scheduling) where an exact algorithm is out of reach and any reasonable answer earns points. It gives no guarantee of optimality, and for problems with exact polynomial algorithms you should use those.

## Practice problems

- [USACO Jan 2017 - Subsequence Reversal](https://usaco.org/index.php?page=viewproblem2&cpid=698)
- [Deltix Summer 2021 - DIY Tree](https://codeforces.com/contest/1556/problem/H)
- [AtCoder Contest Scheduling](https://atcoder.jp/contests/intro-heuristics/tasks/intro_heuristics_a)
