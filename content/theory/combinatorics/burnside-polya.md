---
title: "Burnside's Lemma and Pólya Enumeration"
section: Techniques
order: 3
difficulty: advanced
summary: "Count objects up to symmetry (necklaces, colorings of a cube or a torus) by averaging the number of fixed colorings over the symmetry group."
tags: [burnside, polya, group action, necklaces, symmetry]
prerequisites: [combinatorics/binomial-coefficients, math/euler-totient-function]
source:
  title: "Burnside's lemma / Pólya enumeration theorem"
  url: https://cp-algorithms.com/combinatorics/burnside.html
  license: CC BY-SA 4.0
---

How many different necklaces can be made from $n$ beads of $k$ colors, if rotating a necklace does not make it a different necklace? Counting all $k^n$ colorings overcounts, because rotated copies of the same necklace are counted separately. **Burnside's lemma** counts the **equivalence classes** (orbits) directly.

## Symmetry groups and orbits

Let a group $G$ of *symmetries* (permutations of the positions) act on the set $X$ of all colorings. Two colorings are **equivalent** if some symmetry turns one into the other. We want the number of equivalence classes, the number of *orbits*.

For a symmetry $g \in G$ let $\text{Fix}(g)$ be the set of colorings that $g$ leaves unchanged.

> **Burnside's lemma.** The number of orbits equals the average number of fixed points:
> $$
> \#\text{orbits} = \frac{1}{|G|} \sum_{g \in G} |\text{Fix}(g)|
> $$

**Why.** Count pairs $(g, x)$ with $g\cdot x = x$ in two ways. Grouping by $g$ gives $\sum_g |\text{Fix}(g)|$. Grouping by $x$ gives $\sum_x |\text{Stab}(x)| = \sum_x |G|/|\text{orbit}(x)|$, and each orbit contributes $|G|$ in total (its $|\text{orbit}|$ elements each contribute $|G|/|\text{orbit}|$), so the sum is $|G|\cdot\#\text{orbits}$.

## Pólya's shortcut for colorings

A coloring is fixed by a permutation $g$ of the positions exactly when all positions in each **cycle** of $g$ have the same color. If $g$ has $c(g)$ cycles, that's $k^{c(g)}$ colorings:

$$
\#\text{orbits} = \frac{1}{|G|} \sum_{g \in G} k^{\,c(g)}
$$

This is Pólya's enumeration theorem in its simplest form. Everything reduces to counting the cycles of each symmetry.

```python
def cycle_count(perm):
    seen = [False] * len(perm)
    cycles = 0
    for i in range(len(perm)):
        if not seen[i]:
            cycles += 1
            j = i
            while not seen[j]:
                seen[j] = True
                j = perm[j]
    return cycles

def count_orbits(group, k):
    """Number of colorings with k colors, up to the symmetries in `group` (list of permutations)."""
    return sum(k ** cycle_count(g) for g in group) // len(group)

def rotations(n):
    return [[(i + shift) % n for i in range(n)] for shift in range(n)]

def reflections(n):
    return [[(shift - i) % n for i in range(n)] for shift in range(n)]

assert count_orbits(rotations(4), 3) == 24                        # 3 colors, 4 beads
assert count_orbits(rotations(6), 2) == 14                        # 2 colors, 6 beads
```

## Application: necklaces

A necklace of $n$ beads with rotations as the only symmetries: the rotation by $s$ positions splits the positions into $\gcd(s, n)$ cycles. Grouping the shifts by $d = \gcd(s, n)$ there are $\varphi(n/d)$ shifts with that gcd, so

$$
N(n, k) = \frac{1}{n} \sum_{d \mid n} \varphi\!\left(\frac{n}{d}\right) k^{d}
$$

If flipping the necklace over also counts as the same (a **bracelet**), the group has $2n$ elements. The $n$ reflections add, for odd $n$, $n \cdot k^{(n+1)/2}$ in total; for even $n$, $\tfrac{n}{2}\left(k^{n/2+1} + k^{n/2}\right)$.

```python
from math import gcd

def phi(m):
    return sum(1 for x in range(1, m + 1) if gcd(x, m) == 1)

def necklaces(n, k):
    return sum(phi(n // d) * k ** d for d in range(1, n + 1) if n % d == 0) // n

def bracelets(n, k):
    total = sum(phi(n // d) * k ** d for d in range(1, n + 1) if n % d == 0)      # rotations
    if n % 2:
        total += n * k ** ((n + 1) // 2)
    else:
        total += n // 2 * (k ** (n // 2 + 1) + k ** (n // 2))
    return total // (2 * n)

assert [necklaces(n, 2) for n in range(1, 9)] == [2, 3, 4, 6, 8, 14, 20, 36]
assert necklaces(4, 3) == 24 and bracelets(6, 2) == 13 and bracelets(5, 3) == 39

# the group-based count agrees with the closed forms
for n in range(1, 9):
    for k in range(1, 4):
        assert count_orbits(rotations(n), k) == necklaces(n, k)
        assert count_orbits(rotations(n) + reflections(n), k) == bracelets(n, k)
```

### Checking against canonical forms

For small cases count the equivalence classes directly by mapping every coloring to the smallest one in its orbit:

```python
from itertools import product

def orbits_brute(group, n, k):
    canonical = set()
    for coloring in product(range(k), repeat=n):
        canonical.add(min(tuple(coloring[g[i]] for i in range(n)) for g in group))
    return len(canonical)

for n in range(1, 7):
    for k in range(1, 4):
        assert orbits_brute(rotations(n), n, k) == necklaces(n, k)
        assert orbits_brute(rotations(n) + reflections(n), n, k) == bracelets(n, k)
```

## Application: coloring a grid on a torus

An $a \times b$ grid where both directions wrap around (a torus), symmetric under all cyclic shifts $(s, t)$ in the two directions. A shift by $(s, t)$ has cycles of length $\text{lcm}\!\left(\frac{a}{\gcd(a,s)}, \frac{b}{\gcd(b,t)}\right)$ (the order of the shift), so the number of cycles is $ab$ divided by that length.

```python
from math import lcm

def torus_colorings(a, b, k):
    total = 0
    for s in range(a):
        for t in range(b):
            order = lcm(a // gcd(a, s), b // gcd(b, t))
            total += k ** (a * b // order)
    return total // (a * b)

def torus_group(a, b):
    return [[((i + s) % a) * b + (j + t) % b for i in range(a) for j in range(b)]
            for s in range(a) for t in range(b)]

assert torus_colorings(2, 2, 2) == 7                 # (16 + 4 + 4 + 4) / 4
for a in range(1, 4):
    for b in range(1, 4):
        for k in (1, 2, 3):
            assert torus_colorings(a, b, k) == count_orbits(torus_group(a, b), k)
```

## Application: coloring the faces of a cube

The 24 rotations of a cube permute its 6 faces. Generate the group as the closure of two generating rotations and apply the lemma:

```python
# faces: 0 = up, 1 = down, 2 = front, 3 = back, 4 = left, 5 = right
ROTATE_VERTICAL = (0, 1, 4, 5, 3, 2)          # turn around the vertical axis: front -> left -> back -> right
ROTATE_SIDEWAYS = (2, 3, 1, 0, 4, 5)          # turn around the left-right axis: up -> front -> down -> back

def compose(p, q):
    return tuple(p[q[i]] for i in range(len(p)))

def generate_group(generators):
    identity = tuple(range(len(generators[0])))
    group, frontier = {identity}, [identity]
    while frontier:
        g = frontier.pop()
        for h in generators:
            new = compose(h, g)
            if new not in group:
                group.add(new)
                frontier.append(new)
    return list(group)

cube = generate_group([ROTATE_VERTICAL, ROTATE_SIDEWAYS])
assert len(cube) == 24
assert [count_orbits(cube, k) for k in (1, 2, 3, 4)] == [1, 10, 57, 240]
assert orbits_brute(cube, 6, 2) == 10 and orbits_brute(cube, 6, 3) == 57
```

With two colors there are 10 distinct cubes, with three colors 57.

## Pólya's theorem with counted colors

To count colorings with prescribed numbers of each color (for example exactly 3 red beads), replace $k^{c(g)}$ by the coefficient extraction from $\prod_{\text{cycles}} (x_1^{|C|} + x_2^{|C|} + \dots + x_k^{|C|})$ over the cycles $C$ of $g$. In code, use a polynomial (dictionary) per cycle and multiply them; the exponent vector says how many beads have each color.

```python
from collections import Counter

def polya_by_counts(group, colors):
    """Number of orbits for each way of using the colors (a Counter keyed by tuples of counts)."""
    total = Counter()
    for g in group:
        cycle_lengths = []
        seen = [False] * len(g)
        for i in range(len(g)):
            if not seen[i]:
                j, length = i, 0
                while not seen[j]:
                    seen[j] = True
                    j = g[j]
                    length += 1
                cycle_lengths.append(length)
        poly = Counter({(0,) * colors: 1})
        for length in cycle_lengths:
            new = Counter()
            for counts, ways in poly.items():
                for c in range(colors):
                    updated = list(counts)
                    updated[c] += length
                    new[tuple(updated)] += ways
            poly = new
        total.update(poly)
    return {key: value // len(group) for key, value in total.items()}

by_counts = polya_by_counts(rotations(6), 2)
assert by_counts[(3, 3)] == 4        # 000111, 001011, 001101, 010101: three black and three white beads
assert sum(by_counts.values()) == necklaces(6, 2)
```

## Practice problems

- [CSES - Counting Necklaces](https://cses.fi/problemset/task/2209)
- [CSES - Counting Grids](https://cses.fi/problemset/task/2210)
- [Codeforces - Buildings](https://codeforces.com/gym/101873/problem/B)
- [CS Academy - Cube Coloring](https://csacademy.com/contest/beta-round-8/task/cube-coloring/)
- [Codeforces - Side Transmutations](https://codeforces.com/contest/1065/problem/E)
- [LightOJ - Necklace](https://vjudge.net/problem/LightOJ-1419)
- [POJ - Necklace of Beads](http://poj.org/problem?id=1286)
- [CodeChef - Lucy and Flowers](https://www.codechef.com/problems/DECORATE)
- [HackerRank - Count the Necklaces](https://www.hackerrank.com/contests/infinitum12/challenges/count-the-necklaces)
- [POJ - Magic Bracelet](http://poj.org/problem?id=2888)
- [SPOJ - Sorting Machine](https://www.spoj.com/problems/SRTMACH/)
- [Project Euler - Pizza Toppings](https://projecteuler.net/problem=281)
- [ICPC 2011 SERCP - Alphabet Soup](https://basecamp.eolymp.com/tr/problems/3064)
- [GCPC 2017 - Buildings](https://basecamp.eolymp.com/en/problems/11615)
