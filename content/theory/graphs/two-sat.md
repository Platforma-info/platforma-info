---
title: "2-SAT"
section: Advanced topics
order: 1
difficulty: advanced
summary: "Decide whether a conjunction of two-literal clauses is satisfiable in O(n + m) with the implication graph and strongly connected components, and construct an assignment."
tags: [2-sat, satisfiability, implication graph, scc, kosaraju]
prerequisites: [graphs/strongly-connected-components]
source:
  title: "2-SAT"
  url: https://cp-algorithms.com/graph/2SAT.html
  license: CC BY-SA 4.0
---

**SAT** (Boolean satisfiability) asks for values of Boolean variables that make a given formula true. Usually the formula is in **CNF**: a conjunction (AND) of *clauses*, each a disjunction (OR) of *literals* (variables or their negations). In general SAT is NP-complete. But in **2-SAT** every clause has exactly two literals, and the problem is solvable in $O(n + m)$ for $n$ variables and $m$ clauses.

Example: find $a, b, c$ satisfying

$$
(a \lor \lnot b) \land (\lnot a \lor b) \land (\lnot a \lor \lnot b) \land (a \lor \lnot c)
$$

## The implication graph

The clause $a \lor b$ is equivalent to the pair of implications $\lnot a \Rightarrow b$ and $\lnot b \Rightarrow a$ (if one is false, the other must be true). Build a directed graph with **two vertices per variable**, $x$ and $\lnot x$, and add the two implication edges of every clause.

For the example this gives the edges

$$
\begin{array}{cccc}
\lnot a \Rightarrow \lnot b & a \Rightarrow b & a \Rightarrow \lnot b & \lnot a \Rightarrow \lnot c\\
b \Rightarrow a & \lnot b \Rightarrow \lnot a & b \Rightarrow \lnot a & c \Rightarrow a
\end{array}
$$

The graph is *skew-symmetric*: if there is an edge $a \Rightarrow b$, there is also $\lnot b \Rightarrow \lnot a$.

## When is there a solution?

If $\lnot x$ is reachable from $x$ **and** $x$ is reachable from $\lnot x$, there is no solution: whatever value $x$ has, the implications force the opposite.

This condition is also **sufficient**. Since reachability in both directions means that two vertices belong to the same [strongly connected component](/theory/graphs/strongly-connected-components):

> The formula is satisfiable if and only if, for every variable $x$, the vertices $x$ and $\lnot x$ are in **different** strongly connected components.

## Constructing an assignment

Even when a solution exists, $\lnot x$ may be reachable from $x$ (then $x$ must be false), or $x$ from $\lnot x$ (then $x$ must be true); we need a rule that never causes a contradiction.

Number the strongly connected components in **topological order** of the condensation: $\text{comp}[v] \le \text{comp}[u]$ if there is a path from $v$ to $u$. Then set

$$
x = \begin{cases}\text{true} & \text{if } \text{comp}[x] > \text{comp}[\lnot x]\\ \text{false} & \text{otherwise}\end{cases}
$$

so a literal is made true when its component is *later* in the topological order (further downstream).

*Proof.* Suppose $x$ was assigned true, so $\text{comp}[x] > \text{comp}[\lnot x]$. Then $x$ cannot reach $\lnot x$ (that would need $\text{comp}[x] \le \text{comp}[\lnot x]$). Also, no variable $y$ can have both $y$ and $\lnot y$ reachable from $x$: by skew-symmetry $\lnot x$ would be reachable from both $\lnot y$ and $y$, hence from $x$, a contradiction. So the implications starting at a true literal never lead to a contradiction, and the assignment satisfies all clauses.

## Implementation

Vertices $2k$ and $2k + 1$ represent variable $k$ and its negation. We use an iterative Kosaraju: a first DFS on the graph to compute the finishing order, and a second DFS on the transposed graph in the reverse order; the components are then numbered in topological order.

```python
class TwoSat:
    def __init__(self, n_vars):
        self.n = n_vars
        self.adj = [[] for _ in range(2 * n_vars)]
        self.adj_t = [[] for _ in range(2 * n_vars)]

    def add_clause(self, a, a_true, b, b_true):
        """Adds the clause (x_a == a_true) OR (x_b == b_true)."""
        u = 2 * a + (0 if a_true else 1)                # the vertex of the first literal
        v = 2 * b + (0 if b_true else 1)
        self.adj[u ^ 1].append(v)                       # not first  =>  second
        self.adj[v ^ 1].append(u)                       # not second =>  first
        self.adj_t[v].append(u ^ 1)
        self.adj_t[u].append(v ^ 1)

    def solve(self):
        """Returns a list of Booleans satisfying all the clauses, or None if there is none."""
        size = 2 * self.n
        visited, order = [False] * size, []
        for start in range(size):                       # first pass: finishing order
            if visited[start]:
                continue
            visited[start] = True
            stack = [(start, 0)]
            while stack:
                v, i = stack.pop()
                if i < len(self.adj[v]):
                    stack.append((v, i + 1))
                    u = self.adj[v][i]
                    if not visited[u]:
                        visited[u] = True
                        stack.append((u, 0))
                else:
                    order.append(v)
        comp = [-1] * size
        count = 0
        for start in reversed(order):                   # second pass on the transposed graph
            if comp[start] != -1:
                continue
            comp[start] = count
            stack = [start]
            while stack:
                v = stack.pop()
                for u in self.adj_t[v]:
                    if comp[u] == -1:
                        comp[u] = count
                        stack.append(u)
            count += 1
        assignment = []
        for k in range(self.n):
            if comp[2 * k] == comp[2 * k + 1]:
                return None
            assignment.append(comp[2 * k] > comp[2 * k + 1])
        return assignment

# (a or not b) and (not a or not b) and (b or c) and (a or a)
solver = TwoSat(3)
solver.add_clause(0, True, 1, False)
solver.add_clause(0, False, 1, False)
solver.add_clause(1, True, 2, True)
solver.add_clause(0, True, 0, True)
assert solver.solve() == [True, False, True]

# the example from above: a, b, c
solver = TwoSat(3)
for a, na, b, nb in [(0, True, 1, False), (0, False, 1, True), (0, False, 1, False), (0, True, 2, False)]:
    solver.add_clause(a, na, b, nb)
result = solver.solve()
assert result is not None and result[0] == result[1] == False       # a and b are forced to be false
# a contradiction: a and not a
bad = TwoSat(1)
bad.add_clause(0, True, 0, True)
bad.add_clause(0, False, 0, False)
assert bad.solve() is None
```

A clause with a repeated literal like $(a \lor a)$ forces $a$: it adds the edge $\lnot a \Rightarrow a$.

## Testing against brute force

Random formulas over few variables: satisfiability must agree with checking all $2^n$ assignments, and any returned assignment must satisfy every clause.

```python
import random
from itertools import product

rnd = random.Random(1)
sat_count = 0
for _ in range(2000):
    n = rnd.randint(1, 6)
    clauses = [(rnd.randrange(n), rnd.random() < 0.5, rnd.randrange(n), rnd.random() < 0.5)
               for _ in range(rnd.randint(0, 12))]
    solver = TwoSat(n)
    for a, na, b, nb in clauses:
        solver.add_clause(a, na, b, nb)
    result = solver.solve()
    exists = any(all(x[a] == na or x[b] == nb for a, na, b, nb in clauses) for x in product([False, True], repeat=n))
    assert (result is not None) == exists
    if result is not None:
        sat_count += 1
        assert all(result[a] == na or result[b] == nb for a, na, b, nb in clauses)
assert sat_count > 300                                      # both satisfiable and unsatisfiable formulas occurred
```

## Modelling with 2-SAT

Many constraints can be written as 2-clauses:

| Constraint | Clauses |
|-----------|---------|
| $x \Rightarrow y$ | $(\lnot x \lor y)$ |
| $x$ and $y$ not both true | $(\lnot x \lor \lnot y)$ |
| $x$ and $y$ not both false | $(x \lor y)$ |
| $x = y$ | $(x \lor \lnot y) \land (\lnot x \lor y)$ |
| $x \ne y$ | $(x \lor y) \land (\lnot x \lor \lnot y)$ |
| $x$ is true | $(x \lor x)$ |
| at most one of $x_1..x_k$ | $(\lnot x_i \lor \lnot x_j)$ for all pairs |

The helper below adds them, and we use it to solve a small scheduling puzzle: three meetings, each held in the morning (false) or in the afternoon (true), with some pairs that cannot be at the same time:

```python
def add_implication(s, a, a_true, b, b_true):
    s.add_clause(a, not a_true, b, b_true)                  # (a == a_true) => (b == b_true)

def add_not_both(s, a, b):
    s.add_clause(a, False, b, False)

def add_different(s, a, b):
    s.add_clause(a, True, b, True)
    s.add_clause(a, False, b, False)

meetings = TwoSat(3)
add_different(meetings, 0, 1)             # meetings 0 and 1 are at different times
add_different(meetings, 1, 2)             # so are 1 and 2
add_implication(meetings, 0, True, 2, False)     # if 0 is in the afternoon, 2 is in the morning
plan = meetings.solve()
assert plan is not None and plan[0] != plan[1] != plan[2] and (not plan[0] or not plan[2])
```

## Practice problems

- [Codeforces: The Door Problem](http://codeforces.com/contest/776/problem/D)
- [Kattis: Illumination](https://open.kattis.com/problems/illumination)
- [UVA: Rectangles](https://uva.onlinejudge.org/index.php?option=com_onlinejudge&Itemid=8&page=show_problem&problem=3081)
- [Codeforces : Radio Stations](https://codeforces.com/problemset/problem/1215/F)
- [CSES : Giant Pizza](https://cses.fi/problemset/task/1684)
- [Codeforces: +-1](https://codeforces.com/contest/1971/problem/H)
- [Gym: (C) Colorful Village](https://codeforces.com/gym/104772/problem/C)
- [POI: Renovation](https://szkopul.edu.pl/problemset/problem/xNjwUvwdHQoQTFBrmyG8vD1O/site/?key=statement)
