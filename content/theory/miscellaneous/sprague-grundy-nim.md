---
title: "Sprague-Grundy Theorem and Nim"
section: Game theory
order: 1
difficulty: advanced
summary: "Solve impartial two-player games by reducing each position to a Nim pile through its Grundy number, and combine independent games with XOR."
tags: [game theory, nim, grundy, mex, xor]
prerequisites: [math/bit-manipulation, dynamic-programming/introduction-to-dp]
source:
  title: Sprague-Grundy theorem. Nim
  url: https://cp-algorithms.com/game_theory/sprague-grundy-nim.html
  license: CC BY-SA 4.0
---

We study **impartial games**: two players alternate moves; both have exactly the same moves available in any position (unlike chess, where each side owns different pieces); the game ends when a player cannot move, and that player **loses** (*normal play*). No randomness, and perfect information.

Every position is either **winning** for the player to move (there exists a move to a losing position) or **losing** (every move goes to a winning position). The task is to tell which, quickly.

## Nim

There are $n$ piles of stones with $a_1, \dots, a_n$ stones. A move removes any positive number of stones from a single pile. Whoever cannot move loses.

> **Bouton's theorem.** The player to move wins if and only if $a_1 \oplus a_2 \oplus \dots \oplus a_n \neq 0$.

**Why.** If the XOR ("nim-sum") is 0, any move changes exactly one pile, so the XOR becomes non-zero: from a zero position you can only reach non-zero positions. If the XOR is $s \ne 0$, take the highest set bit of $s$, pick a pile $a_i$ that has this bit set, and reduce it to $a_i \oplus s < a_i$; the total XOR becomes 0. The terminal position (all piles empty) has XOR 0 and is losing, so by induction the claim holds.

```python
from functools import reduce
from operator import xor

def nim_wins(piles):
    return reduce(xor, piles, 0) != 0

def nim_winning_move(piles):
    """Return (pile index, new size) of a winning move, or None if the position is losing."""
    s = reduce(xor, piles, 0)
    if s == 0:
        return None
    for i, a in enumerate(piles):
        if a ^ s < a:
            return i, a ^ s

assert nim_wins([3, 4, 5]) is True                    # 3^4^5 = 2
assert nim_wins([1, 2, 3]) is False                   # 1^2^3 = 0
assert nim_winning_move([3, 4, 5]) == (0, 1)          # 3 -> 1 makes 1^4^5 = 0
assert nim_winning_move([1, 2, 3]) is None
```

### Verifying against brute-force game search

```python
from functools import lru_cache
from itertools import product

@lru_cache(maxsize=None)
def brute_wins(piles):
    """piles: sorted tuple. True if the player to move wins."""
    for i, a in enumerate(piles):
        for take in range(1, a + 1):
            nxt = tuple(sorted(piles[:i] + (a - take,) + piles[i + 1:]))
            if not brute_wins(nxt):
                return True
    return False

for piles in product(range(5), repeat=3):
    assert brute_wins(tuple(sorted(piles))) == nim_wins(list(piles))
```

### Misère Nim

In *misère* play the player who takes the last stone **loses**. The strategy is the same as normal Nim, except that when all remaining piles would have size at most 1, you play to leave an **odd** number of piles of size 1. Precisely: if some pile has at least 2 stones, use the normal nim-sum rule; otherwise the player to move wins exactly when the number of non-empty piles is even.

```python
def misere_wins(piles):
    if any(a >= 2 for a in piles):
        return reduce(xor, piles, 0) != 0
    return sum(piles) % 2 == 0

@lru_cache(maxsize=None)
def misere_brute(piles):
    if sum(piles) == 0:
        return True                                    # the previous player took the last stone and lost
    for i, a in enumerate(piles):
        for take in range(1, a + 1):
            nxt = tuple(sorted(piles[:i] + (a - take,) + piles[i + 1:]))
            if not misere_brute(nxt):
                return True
    return False

for piles in product(range(5), repeat=3):
    assert misere_brute(tuple(sorted(piles))) == misere_wins(list(piles))
```

## The Sprague-Grundy theorem

Nim looks special, but **every** impartial game is equivalent to a Nim pile. To each position $v$ assign its **Grundy number** (nimber):

$$
g(v) = \operatorname{mex}\{\, g(u) : v \to u \text{ is a legal move} \,\}
$$

where $\operatorname{mex}$ ("minimum excluded value") of a set is the smallest non-negative integer not in it. A position with no moves has $g = 0$.

> **Sprague-Grundy theorem.** A position with Grundy number $g$ behaves exactly like a Nim pile with $g$ stones. Moreover a position is **losing** for the player to move if and only if $g = 0$.

For a **sum of independent games** (on your turn you choose *one* component and make a move there), the Grundy number of the combined position is the XOR of the components' numbers. So:

1. compute $g$ for each component (dynamic programming over positions);
2. XOR them; a non-zero result means the first player wins.

```python
def mex(values):
    seen = set(values)
    m = 0
    while m in seen:
        m += 1
    return m

def grundy_table(limit, moves):
    """One pile of n stones; a move removes any m in `moves` stones (if available)."""
    g = [0] * (limit + 1)
    for n in range(1, limit + 1):
        g[n] = mex(g[n - m] for m in moves if m <= n)
    return g

assert grundy_table(10, [1, 2, 3]) == [0, 1, 2, 3, 0, 1, 2, 3, 0, 1, 2]     # n mod 4
assert grundy_table(10, [1, 3, 4]) == [0, 1, 0, 1, 2, 3, 2, 0, 1, 0, 1]
```

### A game made of several piles with restricted moves

Two piles; a player takes 1, 3 or 4 stones from **one** of them. Combine with XOR:

```python
G = grundy_table(30, [1, 3, 4])

def wins_sum(piles):
    total = 0
    for a in piles:
        total ^= G[a]
    return total != 0

@lru_cache(maxsize=None)
def brute_sum(piles):
    for i, a in enumerate(piles):
        for m in (1, 3, 4):
            if m <= a:
                nxt = tuple(sorted(piles[:i] + (a - m,) + piles[i + 1:]))
                if not brute_sum(nxt):
                    return True
    return False

for piles in product(range(12), repeat=3):
    assert brute_sum(tuple(sorted(piles))) == wins_sum(piles)
```

The general recipe for a contest problem:

1. Identify what the **independent components** of the game are (piles, rows, cells, tokens on a graph...).
2. Compute $g$ for each possible component state with the mex recurrence (usually with memoization).
3. XOR everything.

## Grundy numbers on a graph

A **token on a DAG**: the move moves the token along an edge; the player unable to move loses. Then $g(v) = \operatorname{mex}\{g(u) : v \to u\}$, computed in reverse topological order. With several tokens (one game each), XOR their Grundy numbers.

```python
def grundy_on_dag(adj):
    n = len(adj)
    g = [-1] * n

    def compute(v):
        # iterative post-order to avoid deep recursion
        stack = [v]
        while stack:
            x = stack[-1]
            pending = [u for u in adj[x] if g[u] == -1]
            if pending:
                stack.extend(pending)
            else:
                g[x] = mex(g[u] for u in adj[x])
                stack.pop()

    for v in range(n):
        if g[v] == -1:
            compute(v)
    return g

#  0 -> 1 -> 3,  0 -> 2 -> 3,  3 has no moves
dag = [[1, 2], [3], [3], []]
assert grundy_on_dag(dag) == [0, 1, 1, 0]        # from 0 both moves lead to g = 1, and mex{1} = 0: losing
```

## Splitting games

Some games allow a move to split a component into independent parts (a heap divides into two heaps). If the parts are independent, the Grundy number of the result is the **XOR** of the parts' numbers; use it in the mex.

*Example:* a heap of $n$ stones; a move removes some stones and then optionally splits the rest into two non-empty heaps (Grundy's game variants). The recurrence:

```python
def grundy_split(limit):
    """Move: take at least 1 stone from a heap and optionally split the rest into two heaps."""
    g = [0] * (limit + 1)
    for n in range(1, limit + 1):
        options = set()
        for rest in range(n):                              # stones left after taking: n-1 ... 0
            options.add(g[rest])                           # no split
            for a in range(1, rest):                       # split rest into a and rest-a
                options.add(g[a] ^ g[rest - a])
        g[n] = mex(options)
    return g

assert grundy_split(8) == [0, 1, 2, 3, 4, 5, 6, 7, 8]      # this game is equivalent to plain Nim
```

## Patterns

Grundy sequences are often periodic or follow a simple rule (e.g. $n \bmod (k+1)$ when you can take $1..k$). Print the first 50 values by brute force, look for the pattern, then prove or trust it.

## Practice

- Winning a token game on a graph with several tokens.
- Games on a grid where a piece moves left/up (each coordinate is a Nim pile).
- "Staircase Nim": only the piles on odd steps matter.

## Practice problems

- [KATTIS S-Nim](https://open.kattis.com/problems/snim)
- [CodeForces - Marbles (2018-2019 ACM-ICPC Brazil Subregional)](https://codeforces.com/gym/101908/problem/B)
- [KATTIS - Cuboid Slicing Game](https://open.kattis.com/problems/cuboidslicinggame)
- [HackerRank - Tower Breakers, Revisited!](https://www.hackerrank.com/contests/5-days-of-game-theory/challenges/tower-breakers-2)
- [HackerRank - Tower Breakers, Again!](https://www.hackerrank.com/contests/5-days-of-game-theory/challenges/tower-breakers-3/problem)
- [HackerRank - Chessboard Game, Again!](https://www.hackerrank.com/contests/5-days-of-game-theory/challenges/a-chessboard-game)
- [Atcoder - ABC368F - Dividing Game](https://atcoder.jp/contests/abc368/tasks/abc368_f)
