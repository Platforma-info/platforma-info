---
title: "Placing Bishops on a Chessboard"
section: Tasks
order: 1
difficulty: intermediate
summary: "Count the ways to place k non-attacking bishops on an n×n board with a DP over diagonals, treating the two square colors independently."
tags: [bishops, chessboard, dp, diagonals]
prerequisites: [dynamic-programming/introduction-to-dp]
source:
  title: "Placing Bishops on a Chessboard"
  url: https://cp-algorithms.com/combinatorics/bishops-on-chessboard.html
  license: CC BY-SA 4.0
---

Find the number of ways to place $K$ bishops on an $N\times N$ chessboard so that no two bishops attack each other. A bishop attacks along its two diagonals, so two bishops attack each other iff they share a diagonal (in either direction).

## Splitting by color

Bishops on **white** squares never attack bishops on **black** squares, because a bishop always stays on the color of its square. So the two colors are independent: if $b$ bishops go to the black squares, then $K-b$ go to the white ones, and the answer is

$$
\sum_{b=0}^{K} \text{Black}(b)\cdot\text{White}(K-b)
$$

## A DP over the diagonals of one color

Within one color, consider the diagonals in **one** direction (say those running from top-left to bottom-right). Each bishop occupies one square of exactly one such diagonal, and two bishops on the same diagonal attack each other, so there is at most one bishop per diagonal. But the *other* direction of attack also matters: a bishop on this diagonal blocks squares on other diagonals.

The neat trick is to number the diagonals of a color in **non-decreasing order of their length**. Two consecutive diagonals of the same color have lengths that differ by exactly 2 (except the first pair), and if we place bishops diagonal by diagonal from the shortest to the longest, each bishop placed earlier kills exactly one square of the current diagonal (the square it attacks along the other direction). So, when placing a bishop on a diagonal that has $s$ squares while $j-1$ bishops are already placed, exactly $s-(j-1)$ squares are free.

Let $D[i][j]$ be the number of ways to place $j$ bishops on the diagonals with indices $\le i$ that have the same color as diagonal $i$. Then

$$
D[i][j] = D[i-2][j] + D[i-2][j-1]\cdot\big(\text{squares}(i) - (j - 1)\big)
$$

The first term leaves diagonal $i$ empty; the second places one bishop on it. With diagonals numbered from 1 (black: odd indices, white: even), the length of diagonal $i$ is

$$
\text{squares}(i) = \begin{cases}
2\lfloor i/4 \rfloor + 1 & i \text{ odd} \\
2\lfloor (i-1)/4 \rfloor + 2 & i \text{ even}
\end{cases}
$$

and the base cases are $D[i][0] = 1$ and $D[1][1] = 1$.

```python
def squares(i):
    return i // 4 * 2 + 1 if i & 1 else (i - 1) // 4 * 2 + 2

def bishop_placements(n, k):
    if k > 2 * n - 1:
        return 0
    D = [[0] * (k + 1) for _ in range(2 * n)]
    for i in range(2 * n):
        D[i][0] = 1
    if k >= 1:
        D[1][1] = 1
    for i in range(2, 2 * n):
        for j in range(1, k + 1):
            D[i][j] = D[i - 2][j] + D[i - 2][j - 1] * (squares(i) - j + 1)
    return sum(D[2 * n - 1][b] * D[2 * n - 2][k - b] for b in range(k + 1))

assert bishop_placements(1, 1) == 1
assert bishop_placements(2, 2) == 4
assert bishop_placements(3, 2) == 26
assert bishop_placements(8, 0) == 1 and bishop_placements(8, 1) == 64
assert bishop_placements(4, 8) == 0                          # more than 2n - 2 = 6 bishops never fit
```

The runtime is $O(NK)$.

## Testing against exhaustive search

Place bishops one by one with backtracking, checking the two diagonals of every new bishop:

```python
from itertools import combinations

def bishops_brute(n, k):
    cells = [(r, c) for r in range(n) for c in range(n)]
    count = 0
    for chosen in combinations(cells, k):
        ok = all(abs(a[0] - b[0]) != abs(a[1] - b[1]) for a, b in combinations(chosen, 2))
        count += ok
    return count

for n in range(1, 6):
    for k in range(0, min(2 * n - 1, 6) + 1):
        assert bishop_placements(n, k) == bishops_brute(n, k), (n, k)
```

The DP agrees with brute force on all boards up to $5\times 5$ (and up to 6 bishops). Note that the maximum number of non-attacking bishops on an $n\times n$ board is $2n-2$ for $n \ge 2$; the guard `k > 2n - 1` in the code is only a cheap early exit, and larger impossible values simply give 0 from the DP.

```python
assert bishop_placements(5, 8) > 0 and bishop_placements(5, 9) == 0
assert bishop_placements(8, 14) > 0 and bishop_placements(8, 15) == 0
```

## Why the numbering works

Take the black squares of a $5\times5$ board. The black diagonals (in one direction) have lengths $1, 3, 5, 3, 1$ and the white ones $2, 4, 4, 2$. After sorting by length, the diagonals of a color are $1,1,3,3,5$ and $2,2,4,4$, and the DP processes them in this order. Each bishop already placed on a *shorter* diagonal attacks exactly one square of a longer one along the other direction, and never two, which is why subtracting $j-1$ is exact.
