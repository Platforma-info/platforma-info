---
title: "Finding the Largest Zero Submatrix"
section: Tasks
order: 2
difficulty: intermediate
summary: "Find the largest rectangle of zeros in a binary matrix in O(nm) using column heights and a monotonic stack."
tags: [matrix, histogram, monotonic stack, largest rectangle]
prerequisites: [data-structures/minimum-stack-queue]
source:
  title: "Finding the largest zero submatrix"
  url: https://cp-algorithms.com/dynamic_programming/zero_matrix.html
  license: CC BY-SA 4.0
---

You are given an $n \times m$ matrix of zeros and ones. Find the **largest rectangle consisting only of zeros** (by area) and report its size and position.

A brute force checks every rectangle: $O(n^2 m^2)$ rectangles, each verified with prefix sums in $O(1)$, i.e. $O(n^2 m^2)$ total. The approach below runs in $O(nm)$.

## Reduction to histograms

Process the matrix row by row. Let `height[j]` be the number of consecutive zeros ending at the current row in column $j$ (0 if the current cell is a one). For a fixed row, a rectangle of zeros whose **bottom edge** is on this row is a rectangle under the "skyline" of bars `height[0..m-1]`.

So the task on each row is the classic **largest rectangle in a histogram**: for every bar $j$, find how far it can extend left and right while all bars stay at least as tall (`height[j]`). The nearest smaller bar on each side is found with a **monotonic stack** in linear time (see [minimum stack](/theory/data-structures/minimum-stack-queue)). The area of the best rectangle whose height is limited by bar $j$ is `height[j] * (right - left - 1)`.

```python
def largest_zero_rectangle(matrix):
    """
    matrix: list of strings/lists with '0'/'1' (or 0/1). Return (area, top, left, bottom, right), inclusive
    coordinates of a largest all-zero rectangle, or (0, -1, -1, -1, -1) if there are no zeros.
    """
    n = len(matrix)
    m = len(matrix[0]) if n else 0
    heights = [0] * m
    best = (0, -1, -1, -1, -1)
    for i in range(n):
        for j in range(m):
            heights[j] = heights[j] + 1 if str(matrix[i][j]) == "0" else 0
        # nearest smaller bar to the left and right, with a monotonic stack
        left = [-1] * m
        right = [m] * m
        stack = []
        for j in range(m):
            while stack and heights[stack[-1]] >= heights[j]:
                right[stack.pop()] = j
            left[j] = stack[-1] if stack else -1
            stack.append(j)
        for j in range(m):
            width = right[j] - left[j] - 1
            area = heights[j] * width
            if area > best[0]:
                best = (area, i - heights[j] + 1, left[j] + 1, i, right[j] - 1)
    return best

grid = [
    "1011",
    "0000",
    "0000",
    "1101",
]
area, top, left, bottom, right = largest_zero_rectangle(grid)
assert area == 8 and (top, left, bottom, right) == (1, 0, 2, 3)
assert largest_zero_rectangle(["11", "11"]) == (0, -1, -1, -1, -1)
assert largest_zero_rectangle(["0"])[0] == 1
```

In the inner loop, when a bar is popped because `heights[j] <= heights[stack[-1]]`, position $j$ is its right boundary; the bar below it on the stack is its left boundary. Using `>=` makes equal bars pop each other, so the rightmost of a run of equal bars gets the full width, which is what we want.

The total work is $O(m)$ per row, $O(nm)$ overall, and $O(m)$ memory besides the input.

## Testing against brute force

```python
import random

def brute(matrix):
    n, m = len(matrix), len(matrix[0])
    best = 0
    for top in range(n):
        for bottom in range(top, n):
            for left in range(m):
                for right in range(left, m):
                    if all(str(matrix[r][c]) == "0" for r in range(top, bottom + 1) for c in range(left, right + 1)):
                        best = max(best, (bottom - top + 1) * (right - left + 1))
    return best

random.seed(1)
for _ in range(400):
    n, m = random.randint(1, 6), random.randint(1, 6)
    density = random.choice([0.2, 0.5, 0.8])
    matrix = ["".join("1" if random.random() < density else "0" for _ in range(m)) for _ in range(n)]
    area, top, left, bottom, right = largest_zero_rectangle(matrix)
    assert area == brute(matrix)
    if area:
        assert area == (bottom - top + 1) * (right - left + 1)
        assert all(matrix[r][c] == "0" for r in range(top, bottom + 1) for c in range(left, right + 1))
```

## Variations

- **Largest rectangle of ones:** use `heights[j] + 1` when the cell is `1`. This is the well-known *maximal rectangle* problem.
- **Largest square:** a simpler DP works: `side[i][j] = 1 + min(side[i-1][j], side[i][j-1], side[i-1][j-1])` for zero cells.
- **Counting** all zero rectangles: for every bar the number of rectangles ending at the bottom row can be accumulated with the same stack, in $O(nm)$.
- **Largest rectangle in a histogram** itself is the row-level subproblem, useful on its own (for example, the largest rectangle under a skyline).

```python
def largest_square(matrix):
    n, m = len(matrix), len(matrix[0])
    side = [[0] * m for _ in range(n)]
    best = 0
    for i in range(n):
        for j in range(m):
            if matrix[i][j] == "0":
                side[i][j] = 1 + (min(side[i - 1][j], side[i][j - 1], side[i - 1][j - 1]) if i and j else 0)
                best = max(best, side[i][j])
    return best

assert largest_square(grid) == 2
assert largest_square(["000", "000", "000"]) == 3
```
