---
title: "DP on a Broken Profile: Domino Tilings"
section: Tasks
order: 1
difficulty: advanced
summary: "Count the ways to tile a grid with dominoes by processing cell by cell and remembering a bitmask of the frontier, the broken profile."
tags: [bitmask dp, profile dp, domino tiling, grid]
prerequisites: [math/bit-manipulation, dynamic-programming/introduction-to-dp]
source:
  title: "Dynamic Programming on Broken Profile. Problem \"Parquet\""
  url: https://cp-algorithms.com/dynamic_programming/profile-dynamics.html
  license: CC BY-SA 4.0
---

Profile DP (also called *broken profile* or *bitmask DP on a grid*) solves problems of the form

- count the ways to **completely fill** a grid with some figures (dominoes, L-shapes, ...),
- find a fill using the **minimum number** of figures,
- find a partial fill leaving the fewest cells uncovered, or such that no further figure fits.

The state is the current position in the grid together with a bitmask describing the frontier, the *profile*, which cells near the current position are already covered. The grid must be narrow (about $m \le 12$ to $16$ columns) because the number of states is $2^m$.

## The problem "Parquet"

Given an $n \times m$ grid, count the ways to cover it completely with $1 \times 2$ dominoes (each cell covered exactly once, no overlaps).

### First idea: row by row

Let `dp[i][mask]` be the number of ways to fill rows $0..i-1$ completely, where `mask` says which cells of row $i$ are already covered by vertical dominoes sticking down from row $i-1$. Filling row $i$ then needs a small search over how the free cells are covered (horizontally, or by verticals into row $i+1$). Correct, but each transition enumerates many masks.

### Better: cell by cell (the broken profile)

Process the cells in row-major order, one at a time, and keep a mask of $m$ bits with the meaning:

- for the cells not yet processed in the current row (columns $\ge j$): bit $c$ is set if the cell $(i, c)$ is already covered (by a vertical domino from above, or by a horizontal domino started at $(i, c-1)$);
- for the already processed cells of the current row (columns $< j$): bit $c$ is set if the cell $(i+1, c)$ below is already covered by a vertical domino started at $(i, c)$.

Bit $j$ always refers to "the cell at the current position, or the one directly below it once we leave". At cell $(i, j)$ there are three cases:

1. **The cell is already covered** (bit $j$ is set): nothing to place, clear the bit (the cell below is not covered).
2. **Place a vertical domino** covering $(i, j)$ and $(i+1, j)$ (needs $i + 1 < n$): set bit $j$ (it now describes the cell below).
3. **Place a horizontal domino** covering $(i, j)$ and $(i, j+1)$ (needs $j + 1 < m$ and $(i, j+1)$ free, i.e. bit $j+1$ clear): set bit $j+1$; bit $j$ stays clear.

Every cell has $O(1)$ transitions per state, so the total is $O(n\,m\,2^m)$.

```python
from collections import defaultdict

def domino_tilings(n, m, blocked=frozenset()):
    """Number of ways to tile an n x m grid with dominoes; `blocked` cells (i, j) must stay empty."""
    dp = {0: 1}
    for i in range(n):
        for j in range(m):
            bit = 1 << j
            new = defaultdict(int)
            for mask, ways in dp.items():
                if (i, j) in blocked:
                    if not mask & bit:                       # nothing may already cover a blocked cell
                        new[mask] += ways
                    continue
                if mask & bit:                               # already covered from above / the left
                    new[mask ^ bit] += ways
                    continue
                if i + 1 < n and (i + 1, j) not in blocked:  # vertical domino
                    new[mask | bit] += ways
                if j + 1 < m and not mask & (bit << 1) and (i, j + 1) not in blocked:   # horizontal
                    new[mask | (bit << 1)] += ways
            dp = new
    return dp.get(0, 0)

assert [domino_tilings(2, k) for k in range(1, 9)] == [1, 2, 3, 5, 8, 13, 21, 34]     # Fibonacci numbers
assert domino_tilings(3, 4) == 11
assert domino_tilings(4, 4) == 36
assert domino_tilings(6, 6) == 6728
assert domino_tilings(8, 8) == 12988816
assert domino_tilings(3, 3) == 0                             # odd number of cells
assert domino_tilings(3, 3, frozenset({(1, 1)})) == 2         # a ring of 8 cells: two tilings
```

The answer is `dp[0]`: after the last cell no cell may stick out below the grid. The dictionary keeps only reachable masks, which helps a lot: many masks can never occur.

## Testing against exhaustive search

A backtracking counter that always covers the first free cell:

```python
import random

def tilings_brute(n, m, blocked):
    grid = [[(i, j) in blocked for j in range(m)] for i in range(n)]

    def go(pos):
        while pos < n * m and grid[pos // m][pos % m]:
            pos += 1
        if pos == n * m:
            return 1
        i, j = divmod(pos, m)
        total = 0
        grid[i][j] = True
        if j + 1 < m and not grid[i][j + 1]:
            grid[i][j + 1] = True
            total += go(pos + 1)
            grid[i][j + 1] = False
        if i + 1 < n and not grid[i + 1][j]:
            grid[i + 1][j] = True
            total += go(pos + 1)
            grid[i + 1][j] = False
        grid[i][j] = False
        return total

    return go(0)

random.seed(1)
for _ in range(300):
    n, m = random.randint(1, 5), random.randint(1, 5)
    blocked = frozenset((random.randrange(n), random.randrange(m)) for _ in range(random.randint(0, 3)))
    assert domino_tilings(n, m, blocked) == tilings_brute(n, m, blocked)
```

## Speed in Python

The number of live states matters. For an $8 \times 8$ board, `domino_tilings` visits a few hundred masks per cell and runs in a few milliseconds; for a $12 \times 12$ board $2^{12} = 4096$ masks per cell, about $6 \cdot 10^5$ transitions in all. Make the *narrow* side the mask:

```python
import time

def tilings_narrow(n, m):
    return domino_tilings(max(n, m), min(n, m))

start = time.perf_counter()
assert tilings_narrow(2, 12) == 233
assert tilings_narrow(10, 10) == 258584046368
assert time.perf_counter() - start < 30
```

## Variations

- **Minimum number of figures / maximum coverage:** store the best value instead of the count (`min` or `max` in the transition), with an extra "skip this cell" option for partial fills.
- **Other figures** (L-trominoes, $2 \times 2$ squares): the profile must cover the cells the figure can touch, i.e. two rows for L-shapes; the same cell-by-cell scheme works with a wider mask.
- **Counting with obstacles** (as above), or **weighted** placements.
- **Hamiltonian paths and cycles on grids** ("plug DP") use a profile of pairs of connected boundary cells instead of a plain bitmask.

The key technique is the same: choose an order of the cells so that the frontier between "decided" and "undecided" cells is as small as possible, and let the DP remember exactly that frontier.

## Practice problems

- [UVA 10359 - Tiling](https://onlinejudge.org/index.php?option=com_onlinejudge&Itemid=8&page=show_problem&problem=1300)
- [UVA 10918 - Tri Tiling](https://onlinejudge.org/index.php?option=com_onlinejudge&Itemid=8&page=show_problem&problem=1859)
- [SPOJ GNY07H (Four Tiling)](https://www.spoj.com/problems/GNY07H/)
- [SPOJ M5TILE (Five Tiling)](https://www.spoj.com/problems/M5TILE/)
- [SPOJ MNTILE (MxN Tiling)](https://www.spoj.com/problems/MNTILE/)
- [SPOJ DOJ1](https://www.spoj.com/problems/DOJ1/)
- [SPOJ DOJ2](https://www.spoj.com/problems/DOJ2/)
- [SPOJ BTCODE_J](https://www.spoj.com/problems/BTCODE_J/)
- [SPOJ PBOARD](https://www.spoj.com/problems/PBOARD/)
- [ACM HDU 4285 - Circuits](http://acm.hdu.edu.cn/showproblem.php?pid=4285)
- [LiveArchive 4608 - Mosaic](https://vjudge.net/problem/UVALive-4608)
- [Timus 1519 - Formula 1](https://acm.timus.ru/problem.aspx?space=1&num=1519)
- [Codeforces Parquet](https://codeforces.com/problemset/problem/26/C)
