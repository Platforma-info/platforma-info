---
title: "The 15 Puzzle: When Is It Solvable?"
section: Classic problems
order: 3
difficulty: intermediate
summary: "A position of the sliding-tile puzzle is solvable exactly when the inversions of the tiles plus the row of the empty cell have the right parity; verified by exhaustive search on smaller boards."
tags: [15 puzzle, parity, inversions, permutations, invariants]
prerequisites: [python-basics/lists-and-tuples]
source:
  title: "15 Puzzle Game: Existence Of The Solution"
  url: https://cp-algorithms.com/others/15-puzzle.html
  license: CC BY-SA 4.0
---

The **15 puzzle** (Noyes Chapman, 1880) is played on a $4\times4$ board with 15 numbered tiles and one empty cell. A move slides a tile adjacent to the empty cell into it. The goal position is

$$
\begin{matrix} 1 & 2 & 3 & 4 \\ 5 & 6 & 7 & 8 \\ 9 & 10 & 11 & 12 \\ 13 & 14 & 15 & 0 \end{matrix}
$$

where $0$ denotes the empty cell. Given a position, **can it be transformed into the goal by legal moves?**

## The criterion

Write the position row by row as $a_1, a_2, \dots, a_{16}$, and let $a_z = 0$ be the empty cell. Consider the sequence of the 15 tile numbers with the zero removed, and let $N$ be its **number of inversions**: pairs $i<j$ with $a_i > a_j$. Let $K$ be the **row of the empty cell** ($K = \lceil z/4\rceil$, counted from 1). Then

> a solution exists if and only if $N + K$ is **even**.

Historically: W. Johnson proved in 1879 that odd $N+K$ has no solution, and W. Story showed in the same year that all even positions are solvable. Archer (1999) found a much simpler proof.

## Why it is an invariant

A horizontal move (the empty cell moves along a row) exchanges the zero with a neighbouring tile, which does not change the order of the tiles: $N$ and $K$ stay the same. A vertical move slides a tile past the three tiles in between it and the empty cell in the row-by-row order, so the tile changes places with 3 other tiles: the number of inversions changes by an odd amount ($\pm1$ or $\pm3$), and $K$ changes by $\pm1$; so $N + K$ keeps its parity. The goal has $N=0$ and $K=4$: even. So positions with odd $N+K$ can never reach it. (The other direction, that all even positions are reachable, needs the longer argument.)

## Implementation

```python
def inversions(tiles):
    return sum(1 for i in range(len(tiles)) for j in range(i) if tiles[j] > tiles[i])

def solvable(board):
    """board: 16 numbers in row-major order (0 is the empty cell)."""
    tiles = [x for x in board if x]
    empty_row = board.index(0) // 4 + 1
    return (inversions(tiles) + empty_row) % 2 == 0

goal = list(range(1, 16)) + [0]
assert solvable(goal)
swapped = goal[:]
swapped[13], swapped[14] = swapped[14], swapped[13]              # the famous "14-15" position: unsolvable
assert not solvable(swapped)
assert solvable([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 0, 15])
```

## Checking the invariant and the theorem

**Moves preserve the parity** of $N+K$, on long random walks from random solvable and unsolvable positions:

```python
import random

def neighbours(board, width):
    z = board.index(0)
    r, c = divmod(z, width)
    for dr, dc in ((-1, 0), (1, 0), (0, -1), (0, 1)):
        nr, nc = r + dr, c + dc
        if 0 <= nr < len(board) // width and 0 <= nc < width:
            other = nr * width + nc
            nxt = board[:]
            nxt[z], nxt[other] = nxt[other], nxt[z]
            yield nxt

rnd = random.Random(1)
for start in (goal, swapped):
    board = start[:]
    parity = solvable(board)
    for _ in range(2000):
        board = rnd.choice(list(neighbours(board, 4)))
        assert solvable(board) == parity
```

**The theorem itself, exhaustively, on smaller boards.** For boards of width $w$ the criterion is: if $w$ is even, $N + K$ even (as above); if $w$ is **odd**, the row of the empty cell does not matter (sliding horizontally shifts a tile past $w - 1$ tiles, which is even) and the condition is that $N$ is even. We search all positions reachable from the goal by breadth-first search and compare with the criterion over **all** permutations:

```python
from collections import deque
from itertools import permutations

def generalized_solvable(board, width):
    tiles = [x for x in board if x]
    n = inversions(tiles)
    return n % 2 == 0 if width % 2 else (n + board.index(0) // width + 1) % 2 == 0

def check_board(rows, width):
    size = rows * width
    goal_board = tuple(list(range(1, size)) + [0])
    reachable = {goal_board}
    queue = deque([goal_board])
    while queue:
        board = queue.popleft()
        for nxt in neighbours(list(board), width):
            t = tuple(nxt)
            if t not in reachable:
                reachable.add(t)
                queue.append(t)
    count = 0
    for perm in permutations(range(size)):
        assert (perm in reachable) == generalized_solvable(list(perm), width), perm
        count += 1
    assert len(reachable) == count // 2                           # exactly half of the positions are solvable

check_board(2, 4)          # a 2 x 4 board: even width, 8!/2 = 20160 solvable positions
check_board(3, 3)          # the 8 puzzle: odd width, 9!/2 = 181440 solvable positions
```

Exactly half of all positions are solvable, in accordance with the fact that the moves generate the alternating group (for odd width) or a corresponding index-2 subgroup of the positions.

## Solving it

Solvability is only half of the story. To actually solve a solvable position, use **IDA\*** (iterative deepening with the Manhattan distance or the "pattern database" heuristics), or A\* for the $3\times3$ variant. The BFS above is enough for the 8-puzzle (181,440 positions), while the 15 puzzle has $16!/2 \approx 10^{13}$ solvable positions and needs the informed search.

## Practice problems

- [Hackerrank - N-puzzle](https://www.hackerrank.com/challenges/n-puzzle)
