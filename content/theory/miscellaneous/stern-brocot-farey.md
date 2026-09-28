---
title: "The Stern-Brocot Tree and Farey Sequences"
section: Classic problems
order: 4
difficulty: advanced
summary: "The tree of all positive fractions built by mediants, its logarithmic search via continued fractions, and the Farey sequences obtained by trimming it."
tags: [stern-brocot tree, farey sequence, mediant, continued fractions, rational numbers]
prerequisites: [math/continued-fractions, math/euler-totient-function]
source:
  title: "The Stern-Brocot tree and Farey sequences"
  url: https://cp-algorithms.com/others/stern_brocot_tree_farey_sequences.html
  license: CC BY-SA 4.0
---

## The Stern-Brocot tree

The **Stern-Brocot tree** is an elegant way to represent the set of all positive fractions. It was discovered by Moritz Stern (1858) and, independently, by the watchmaker Achille Brocot (1861), who used it to choose gear ratios.

Start with the two fractions

$$
\frac01,\ \frac10
$$

(the second is not really a fraction but it represents infinity). At each iteration, for every pair of adjacent fractions $\frac ab$ and $\frac cd$, insert their **mediant** $\frac{a+c}{b+d}$ between them. The first iterations:

$$
\begin{array}{c}
\dfrac01, \dfrac11, \dfrac10\\[2mm]
\dfrac01, \dfrac12, \dfrac11, \dfrac21, \dfrac10\\[2mm]
\dfrac01, \dfrac13, \dfrac12, \dfrac23, \dfrac11, \dfrac32, \dfrac21, \dfrac31, \dfrac10
\end{array}
$$

Continuing forever, this list contains **every positive fraction**, each **exactly once**, in **irreducible** form, and in **increasing order**. In tree form each fraction has two children: the mediants with the nearest fraction to its left and to its right that are already in the tree.

```python
def stern_brocot_levels(depth):
    """The list of fractions after `depth` iterations (as (numerator, denominator) pairs)."""
    row = [(0, 1), (1, 0)]
    for _ in range(depth):
        nxt = [row[0]]
        for (a, b), (c, d) in zip(row, row[1:]):
            nxt += [(a + c, b + d), (c, d)]
        row = nxt
    return row

assert stern_brocot_levels(1) == [(0, 1), (1, 1), (1, 0)]
assert stern_brocot_levels(2) == [(0, 1), (1, 2), (1, 1), (2, 1), (1, 0)]
assert stern_brocot_levels(3) == [(0, 1), (1, 3), (1, 2), (2, 3), (1, 1), (3, 2), (2, 1), (3, 1), (1, 0)]
```

## Proofs

**Ordering.** The mediant lies between its parents: if $\frac ab \le \frac cd$ then $\frac ab \le \frac{a+c}{b+d}\le\frac cd$ (write the fractions with common denominators). The initial list is in ascending order, so every later list is too.

**Irreducibility.** We show that any two adjacent fractions satisfy $bc - ad = 1$. This holds initially, and it is preserved: after inserting the mediant, $b(a+c) - a(b+d) = bc - ad = 1$ and $c(b+d) - d(a+c) = bc - ad = 1$. The Diophantine equation $bc - ad = 1$ has an integer solution only if $\gcd(a,b) = \gcd(c,d) = 1$, so all fractions are irreducible.

**All fractions appear.** Take a target $\frac xy$. If it were not in the tree, the search from the root would go on forever with $\frac ab < \frac xy <\frac cd$ at all steps, so $bx - ay\ge1$ and $cy - dx \ge 1$. Multiplying the first by $c+d$ and the second by $a+b$ and adding, using $bc - ad = 1$:

$$
x + y \ge a + b + c + d
$$

But at every step at least one of $a, b, c, d$ grows by at least 1, so the search stops after at most $x + y$ steps. So $\frac xy$ is in the tree.

```python
from math import gcd

for depth in range(1, 9):
    row = stern_brocot_levels(depth)
    assert all(gcd(a, b) == 1 for a, b in row)                                  # irreducible
    assert all(a * d < c * b for (a, b), (c, d) in zip(row[1:-1], row[2:-1]))    # increasing (the last "1/0" is infinity)
    assert all(b * c - a * d == 1 for (a, b), (c, d) in zip(row, row[1:]))      # neighbouring fractions
    assert len(set(row)) == len(row)                                            # unique
```

## Building the tree

Any subtree is determined by its left and right ancestor fractions. Starting with $\frac01$ and $\frac10$, the mediant becomes the right ancestor of the left subtree and the left ancestor of the right subtree:

```python
def build(depth, a=0, b=1, c=1, d=0):
    """The fractions of the subtree with the ancestors a/b and c/d, in in-order (ascending)."""
    if depth == 0:
        return []
    x, y = a + c, b + d
    return build(depth - 1, a, b, x, y) + [(x, y)] + build(depth - 1, x, y, c, d)

assert build(3) == stern_brocot_levels(3)[1:-1]
```

## Searching for a fraction

The path from the root to $\frac pq$ is a binary search: go left if the target is smaller than the current fraction, right if larger. The sequence of `L` and `R` moves uniquely identifies every positive fraction: it is the *Stern–Brocot number system*.

```python
def find_naive(p, q):
    """The path to p/q as a string of 'L' and 'R'. Can be as long as p + q!"""
    pl, ql, pr, qr = 0, 1, 1, 0
    pm, qm = 1, 1
    path = ""
    while (pm, qm) != (p, q):
        if p * qm < pm * q:                      # the target is smaller: go left
            path += "L"
            pr, qr = pm, qm
        else:
            path += "R"
            pl, ql = pm, qm
        pm, qm = pl + pr, ql + qr
    return path

assert find_naive(1, 1) == "" and find_naive(2, 3) == "LR" and find_naive(3, 2) == "RL"
assert find_naive(5, 1) == "RRRR"
```

Irrational numbers correspond to infinite paths, and the fractions met along the way are increasingly better rational approximations; this is why the tree came from watchmaking. But note the path to $\frac p1$ has length $p$, so the naive algorithm should not be used when that is too slow.

### Logarithmic search

If the current boundaries are $\frac{p_L}{q_L}, \frac{p_R}{q_R}$, then $a$ steps to the right lead to $\frac{p_L + a p_R}{q_L + a q_R}$ and $a$ steps to the left lead to $\frac{a p_L + p_R}{a q_L + q_R}$. So we can do many steps in the same direction at once: the path is a *run-length encoding*, and the directions alternate. The run lengths $a_1, a_2, \dots$ are exactly the terms of the [continued fraction](/theory/math/continued-fractions) of $\frac pq$, and the visited boundaries are its convergents. So the run-length encoded path follows the Euclidean algorithm:

```python
def find_runs(p, q):
    """The path to p/q as runs [(count, 'R' or 'L'), ...], in O(log(p + q))."""
    right = True
    runs = []
    while q:
        runs.append([p // q, "R" if right else "L"])
        p, q = q, p % q
        right = not right
    runs[-1][0] -= 1                            # the last step lands exactly on the fraction
    return [(count, side) for count, side in runs if count]

assert find_runs(2, 3) == [(1, "L"), (1, "R")]
assert find_runs(5, 1) == [(4, "R")]
assert find_runs(1, 1) == []

def expand(runs):
    return "".join(side * count for count, side in runs)

for p in range(1, 40):
    for q in range(1, 40):
        if gcd(p, q) == 1:
            assert expand(find_runs(p, q)) == find_naive(p, q)
```

### Searching with an oracle

Often the target $\frac pq$ is unknown and we can only ask, for a given fraction $\frac xy$, whether it is smaller than, equal to, or larger than the target. We simulate the search on the tree: at each step we determine the number $a_k$ of moves in the current direction by **doubling** a candidate until it overshoots and then **binary searching**. That costs $O(\log a_k)$ comparisons per run, and since $\prod a_k \le p + q$, in total $O(\log(p+q))$ comparisons (a binary search over a fixed range for each run would cost $O(\log^2)$).

```python
def find_by_oracle(compare):
    """compare(x, y) returns the sign of x/y - target. Returns the target as (p, q), reduced."""
    pl, ql, pr, qr = 0, 1, 1, 0                                    # the boundaries: pl/ql < target < pr/qr
    while True:
        pm, qm = pl + pr, ql + qr
        c = compare(pm, qm)
        if c == 0:
            return pm, qm
        if c > 0:                                                  # the target is smaller: go left one or more steps
            def point(k):
                return k * pl + pr, k * ql + qr
            keep_going = lambda k: compare(*point(k)) > 0
            lo, hi = 1, 2
            while keep_going(hi):
                lo, hi = hi, hi * 2
            while hi - lo > 1:
                mid = (lo + hi) // 2
                if keep_going(mid):
                    lo = mid
                else:
                    hi = mid
            pr, qr = point(lo)
        else:                                                      # go right one or more steps
            def point(k):
                return pl + k * pr, ql + k * qr
            keep_going = lambda k: compare(*point(k)) < 0
            lo, hi = 1, 2
            while keep_going(hi):
                lo, hi = hi, hi * 2
            while hi - lo > 1:
                mid = (lo + hi) // 2
                if keep_going(mid):
                    lo = mid
                else:
                    hi = mid
            pl, ql = point(lo)
```

If the doubling or the binary search lands exactly on the target, `compare` returns `0`, which counts as neither "go left" nor "go right"; the search of that run stops, and the next mediant is then the target itself. We test it on all small fractions, counting the number of comparisons, and on a big fraction:

```python
def search(p, q):
    calls = [0]

    def compare(x, y):
        calls[0] += 1
        return (x * q > p * y) - (x * q < p * y)

    return find_by_oracle(compare), calls[0]

worst = 0
for p in range(1, 60):
    for q in range(1, 60):
        if gcd(p, q) == 1:
            found, calls = search(p, q)
            assert found == (p, q)
            worst = max(worst, calls / (p + q).bit_length())
assert worst < 6                                   # O(log(p + q)) comparisons

p, q = 123456789012345678, 98765432109876543
g = gcd(p, q)
p, q = p // g, q // g
found, calls = search(p, q)
assert found == (p, q) and calls < 700
```

## Farey sequences

The **Farey sequence of order $n$** is the sorted sequence of all fractions between $0$ and $1$ whose denominator does not exceed $n$. It is named after the geologist John Farey, who conjectured in 1816 that every fraction in a Farey sequence is the mediant of its two neighbours (proved by Cauchy; Haros had the same result in 1802).

The connection to the Stern-Brocot tree is direct: **a Farey sequence is the tree trimmed of the branches whose denominators are too large**. Start with $\frac01, \frac11$ (the part of the tree between $0$ and $1$) and, in each iteration, insert the mediant only if its denominator is at most $n$. When the list stops changing, it is the Farey sequence.

```python
def farey_by_mediants(n):
    row = [(0, 1), (1, 1)]
    changed = True
    while changed:
        changed = False
        nxt = [row[0]]
        for (a, b), (c, d) in zip(row, row[1:]):
            if b + d <= n:
                nxt.append((a + c, b + d))
                changed = True
            nxt.append((c, d))
        row = nxt
    return row

assert farey_by_mediants(5) == [(0, 1), (1, 5), (1, 4), (1, 3), (2, 5), (1, 2), (3, 5), (2, 3), (3, 4), (4, 5), (1, 1)]
```

### Generating it term by term

Given two consecutive terms $\frac ab, \frac cd$ of the Farey sequence of order $n$, the next term is $\frac{kc - a}{kd - b}$ with $k = \lfloor \frac{n + b}{d}\rfloor$. This generates the sequence in $O(1)$ per term and without storing it:

```python
def farey_iter(n):
    a, b, c, d = 0, 1, 1, n
    yield a, b
    while c <= n:
        k = (n + b) // d
        a, b, c, d = c, d, k * c - a, k * d - b
        yield a, b

assert list(farey_iter(5)) == farey_by_mediants(5)
```

### The length of a Farey sequence

The sequence of order $n$ contains that of order $n-1$ plus all irreducible fractions with denominator exactly $n$, of which there are $\varphi(n)$ ([Euler's totient](/theory/math/euler-totient-function)). So the length $L_n$ satisfies $L_n = L_{n-1} + \varphi(n)$, hence

$$
L_n = 1 + \sum_{k=1}^{n}\varphi(k)
$$

```python
from math import gcd

def totients(n):
    phi = list(range(n + 1))
    for i in range(2, n + 1):
        if phi[i] == i:                                 # i is prime
            for j in range(i, n + 1, i):
                phi[j] -= phi[j] // i
    return phi

phi = totients(60)
for n in range(1, 61):
    brute = sorted({(a // gcd(a, b), b // gcd(a, b)) for b in range(1, n + 1) for a in range(b + 1)},
                   key=lambda f: f[0] / f[1])
    assert farey_by_mediants(n) == brute == list(farey_iter(n))
    assert len(brute) == 1 + sum(phi[1:n + 1])
```

Neighbouring terms $\frac ab < \frac cd$ of a Farey sequence satisfy $bc - ad = 1$ (this is the same determinant property as in the tree), and $b + d > n$. The Farey sequences are used in problems on best rational approximations, counting fractions in an interval, and, via the sum of totients, in number-theoretic sums.
