---
title: "Games on Arbitrary Graphs"
section: Game theory
order: 2
difficulty: advanced
summary: "Solve a two-player game on a directed graph with cycles for every starting vertex at once in O(m): win, lose or draw by retrograde analysis from the terminal positions."
tags: [game theory, retrograde analysis, winning positions, draw, directed graph]
prerequisites: [graphs/breadth-first-search, miscellaneous/sprague-grundy-nim]
source:
  title: "Games on arbitrary graphs"
  url: https://cp-algorithms.com/game_theory/games_on_graphs.html
  license: CC BY-SA 4.0
---

Two players play on a directed graph $G$ (which may contain cycles). The current state is a vertex; the players alternate moves along outgoing edges. In the version we consider, the player who **cannot move loses** (in other versions they win: just swap the roles of the terminal states). Given both players play optimally, who wins from each starting vertex, or is the game a **draw** (it can go on forever)?

We solve it for *all* starting vertices at once in $O(n + m)$.

## Rules

A vertex is **winning** if the player to move from it wins, **losing** if the player to move loses (assuming optimal play by the opponent).

- A vertex without outgoing edges is losing.
- If a vertex has an edge to a **losing** vertex, it is winning (move there).
- If **all** edges of a vertex lead to winning vertices, it is losing (whatever we do, the opponent then wins).
- Vertices that are neither winning nor losing after applying the rules exhaustively are **draws**: each player can always avoid losing by moving to another undecided vertex.

Applying the rules repeatedly until nothing changes takes $O(nm)$. A propagation along the *reversed* edges makes it linear.

## The linear algorithm

Start from the terminal (losing) vertices. Process a queue of decided vertices; for a decided vertex $v$ look at every predecessor $u$ (a vertex with an edge $u \to v$) that is still undecided:

- if $v$ is **losing**, then $u$ is **winning**;
- if $v$ is **winning**, decrease the counter of not-yet-winning successors of $u$; when it reaches zero, all successors of $u$ are winning and $u$ is **losing**.

Each decided vertex is processed once and each reversed edge is looked at at most once: $O(n + m)$. Vertices left undecided are draws.

```python
from collections import deque

WIN, LOSE, DRAW = "win", "lose", "draw"

def solve_game(n, edges):
    """edges: list of (u, v) moves. Returns a list with the outcome of the player to move in every vertex."""
    reverse = [[] for _ in range(n)]
    degree = [0] * n
    for u, v in edges:
        reverse[v].append(u)
        degree[u] += 1
    result = [DRAW] * n
    queue = deque()
    for v in range(n):
        if degree[v] == 0:                           # no move: the player to move loses
            result[v] = LOSE
            queue.append(v)
    while queue:
        v = queue.popleft()
        for u in reverse[v]:
            if result[u] != DRAW:
                continue
            if result[v] == LOSE:
                result[u] = WIN
                queue.append(u)
            else:
                degree[u] -= 1
                if degree[u] == 0:
                    result[u] = LOSE
                    queue.append(u)
    return result

# 0 -> 1 -> 2 (no moves), 3 <-> 4 form a cycle with an exit 4 -> 2, 5 <-> 6 is a plain cycle
edges = [(0, 1), (1, 2), (3, 4), (4, 3), (4, 2), (5, 6), (6, 5)]
assert solve_game(7, edges) == [LOSE, WIN, LOSE, LOSE, WIN, DRAW, DRAW]
```

In the example: vertex 2 is a loss for the player to move; 1 moves to it and wins; 0 can only move to the winning vertex 1, so loses. Vertex 4 can move to 2 and wins; 3's only move is to 4, so 3 is a loss. The cycle $5\leftrightarrow 6$ never ends, hence a draw.

### Why the result is optimal

The propagation proves each label by a finite strategy: a winning vertex has a move to a losing vertex that was decided earlier, and a losing vertex has all moves into winning vertices decided earlier; so the player with the label can force the game to end within the decided part (all labels come with a finite depth, and the depth decreases with every move). For an undecided vertex, neither player can force a win: each one always has a move to another undecided vertex (otherwise it would have been decided), so a player who wants to avoid defeat can play forever.

## Testing

Compare with the naive fixed-point iteration of the rules (the $O(nm)$ method), on random directed graphs (with loops and cycles):

```python
import random

def solve_naive(n, edges):
    out = [[] for _ in range(n)]
    for u, v in edges:
        out[u].append(v)
    result = [DRAW] * n
    changed = True
    while changed:
        changed = False
        for u in range(n):
            if result[u] != DRAW:
                continue
            if not out[u] or all(result[v] == WIN for v in out[u]):
                result[u], changed = LOSE, True
            elif any(result[v] == LOSE for v in out[u]):
                result[u], changed = WIN, True
    return result

rnd = random.Random(1)
counts = {WIN: 0, LOSE: 0, DRAW: 0}
for _ in range(1000):
    n = rnd.randint(1, 10)
    edges = list({(rnd.randrange(n), rnd.randrange(n)) for _ in range(rnd.randint(0, 20))})
    fast = solve_game(n, edges)
    assert fast == solve_naive(n, edges)
    for r in fast:
        counts[r] += 1
assert all(c > 100 for c in counts.values())
```

## Example: "policeman and thief"

A board of $m\times n$ cells, some blocked. A policeman and a thief stand on given cells and move alternately, the policeman first; either may also stay in place. The policeman moves in 8 directions, the thief in 4. If they are on the same cell, the policeman wins; if the thief reaches the exit (without the policeman being there), the thief wins. Otherwise the game may last forever (a draw).

The state is $(P, T, \text{turn})$: the cells of the policeman and of the thief, and whose turn it is. The subtle point: the *terminal* states depend on the turn, because the player about to move in an already decided state must "lose" or "win" it:

- policeman to move: the state is **winning** if the two are on the same cell (he has caught the thief), and **losing** if the thief is on the exit;
- thief to move: **losing** if the two are on the same cell, **winning** if the thief is on the exit.

We build the graph explicitly (states that are already decided get no outgoing edges) and give those states their label. Building it explicitly is easier and less error-prone than generating moves on the fly, at the price of more memory and time.

```python
def chase_game(grid):
    """Build the game graph of the policeman-and-thief game.

    grid: strings with '.', '*' (blocked), 'E' (exit), 'P' (policeman), 'T' (thief).
    Returns (number of states, edges, labels of the decided states, the starting state)."""
    n, m = len(grid), len(grid[0])
    free = [(r, c) for r in range(n) for c in range(m) if grid[r][c] != "*"]
    exit_cells = {(r, c) for r in range(n) for c in range(m) if grid[r][c] == "E"}
    for (r, c) in free:
        if grid[r][c] == "P":
            start_p = (r, c)
        elif grid[r][c] == "T":
            start_t = (r, c)
    states = {}                                              # (P, T, turn) -> id; turn 1 = policeman to move
    for p in free:
        for t in free:
            for turn in (0, 1):
                states[p, t, turn] = len(states)

    def moves(cell, directions):
        for dr, dc in directions:
            r, c = cell[0] + dr, cell[1] + dc
            if 0 <= r < n and 0 <= c < m and grid[r][c] != "*":
                yield (r, c)

    four = [(0, 0), (-1, 0), (1, 0), (0, -1), (0, 1)]                                  # staying in place is allowed
    eight = [(dr, dc) for dr in (-1, 0, 1) for dc in (-1, 0, 1)]
    edges, label = [], {}
    for (p, t, turn), sid in states.items():
        if turn == 1:
            if p == t:
                label[sid] = WIN
            elif t in exit_cells:
                label[sid] = LOSE
        else:
            if p == t:
                label[sid] = LOSE
            elif t in exit_cells:
                label[sid] = WIN
        if sid in label:
            continue                                        # decided: no outgoing edges
        if turn == 1:
            edges += [(sid, states[q, t, 0]) for q in moves(p, eight)]
        else:
            edges += [(sid, states[p, q, 1]) for q in moves(t, four)]
    return len(states), edges, label, states[start_p, start_t, 1]

def solve_game_labeled(n, edges, label):
    """Like solve_game, but some vertices are already decided (label) and have no outgoing edges."""
    reverse = [[] for _ in range(n)]
    degree = [0] * n
    for u, v in edges:
        reverse[v].append(u)
        degree[u] += 1
    result = [DRAW] * n
    queue = deque()
    for v in range(n):
        if v in label:
            result[v] = label[v]
            queue.append(v)
        elif degree[v] == 0:
            result[v] = LOSE
            queue.append(v)
    while queue:
        v = queue.popleft()
        for u in reverse[v]:
            if result[u] != DRAW:
                continue
            if result[v] == LOSE:
                result[u] = WIN
                queue.append(u)
            else:
                degree[u] -= 1
                if degree[u] == 0:
                    result[u] = LOSE
                    queue.append(u)
    return result

def policeman_and_thief(grid):
    count, edges, label, start = chase_game(grid)
    outcome = solve_game_labeled(count, edges, label)[start]
    return {WIN: "Police catches the thief", LOSE: "The thief escapes", DRAW: "Draw"}[outcome]

# adjacent at the start: the policeman moves first and catches the thief at once
assert policeman_and_thief(["PT.", "...", "..E"]) == "Police catches the thief"
# a 1 x 5 corridor: the policeman needs two moves to be next to the thief, the thief needs one to reach the exit
assert policeman_and_thief(["P.TE."]) == "The thief escapes"
# the thief is trapped in a corner of walls: the policeman walks up to him through the middle
assert policeman_and_thief(["P**", "*.*", "**T"]) == "Police catches the thief"
# a wall separates them and there is no exit: nobody can ever win
assert policeman_and_thief(["P*T"]) == "Draw"
```

### Checking the graph solution

On random small boards, compare the linear algorithm with the naive fixed-point iteration of the rules on the same graph, and check the two structural facts: a decided state's label agrees with the rules, and the answer for the start is one of three outcomes. The boards include walls and exits, so all three outcomes appear:

```python
def solve_labeled_naive(n, edges, label):
    out = [[] for _ in range(n)]
    for u, v in edges:
        out[u].append(v)
    result = [label.get(v, DRAW) for v in range(n)]
    changed = True
    while changed:
        changed = False
        for u in range(n):
            if result[u] != DRAW:
                continue
            if u not in label and (not out[u] or all(result[v] == WIN for v in out[u])):
                result[u], changed = LOSE, True
            elif any(result[v] == LOSE for v in out[u]):
                result[u], changed = WIN, True
    return result

rnd = random.Random(4)
seen = set()
for _ in range(120):
    rows, cols = rnd.randint(1, 3), rnd.randint(2, 4)
    board = [[rnd.choice(".....*") for _ in range(cols)] for _ in range(rows)]
    cells = [(r, c) for r in range(rows) for c in range(cols)]
    p, t = rnd.sample(cells, 2)
    board[p[0]][p[1]], board[t[0]][t[1]] = "P", "T"
    exit_cell = rnd.choice(cells)
    if board[exit_cell[0]][exit_cell[1]] == ".":
        board[exit_cell[0]][exit_cell[1]] = "E"
    grid = ["".join(row) for row in board]
    count, edges, label, start = chase_game(grid)
    fast = solve_game_labeled(count, edges, label)
    assert fast == solve_labeled_naive(count, edges, label)
    seen.add(fast[start])
assert seen == {WIN, LOSE, DRAW}
```

## Notes

- When the graph is **acyclic** there are no draws, and the same propagation is a simple DP in reverse topological order.
- For impartial games where only the *winner* matters, on a DAG the [Sprague–Grundy theory](/theory/miscellaneous/sprague-grundy-nim) gives more: the Grundy value (a MEX of successor values) tells the outcome of sums of games.
- The graph of a real game is often huge; build it implicitly and prune states unreachable from the start, or compute only the needed part with memoized search when the graph is acyclic.
