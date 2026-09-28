---
title: "Balanced Bracket Sequences"
section: Tasks
order: 2
difficulty: advanced
summary: "Validate, count, enumerate, rank and unrank balanced bracket sequences, with one or several types of brackets."
tags: [brackets, dyck words, catalan, dp, lexicographic rank]
prerequisites: [combinatorics/catalan-numbers, dynamic-programming/introduction-to-dp]
source:
  title: "Balanced bracket sequences"
  url: https://cp-algorithms.com/combinatorics/bracket_sequences.html
  license: CC BY-SA 4.0
---

A **balanced bracket sequence** is a string of `(` and `)` in which every bracket has a matching partner: `()`, `(())`, `()()`, `(()())` are balanced, `)(` and `(()` are not. Equivalently: with `(` counting $+1$ and `)` counting $-1$, every prefix has a non-negative sum and the total is zero.

Below we work with sequences of length $2n$ and the order `(` $<$ `)`.

## Validation with the balance

Keep the running **balance** (the number of open brackets). The sequence is balanced iff the balance never becomes negative and ends at 0.

```python
def is_balanced(s):
    balance = 0
    for ch in s:
        balance += 1 if ch == "(" else -1
        if balance < 0:
            return False
    return balance == 0

assert is_balanced("(()())") and is_balanced("") and is_balanced("()()")
assert not is_balanced(")(") and not is_balanced("(()") and not is_balanced("())(")
```

With several bracket types (`()`, `[]`, `{}`) use a stack: push the opening bracket, and on a closing bracket require that the top of the stack is its partner.

```python
PAIRS = {")": "(", "]": "[", "}": "{"}

def is_balanced_multi(s):
    stack = []
    for ch in s:
        if ch in "([{":
            stack.append(ch)
        elif not stack or stack.pop() != PAIRS[ch]:
            return False
    return not stack

assert is_balanced_multi("([]{})") and not is_balanced_multi("([)]") and not is_balanced_multi("((")
```

## The number of balanced sequences

### Formula

The number of balanced sequences with $n$ pairs is the [Catalan number](/theory/combinatorics/catalan-numbers)

$$
C_n = \frac{1}{n+1}\binom{2n}{n}
$$

With $k$ **types** of brackets (each pair can be any of the $k$ kinds), the structure of the sequence is the same and each of the $n$ pairs independently chooses its type, so the count is $C_n \cdot k^n$.

### Dynamic programming

More flexible is a table `d[i][j]`: the number of ways to complete a sequence when $i$ characters remain and the current balance is $j$. The next character is either `(` (balance $j+1$) or `)` (balance $j-1$, only if $j > 0$):

$$
d[0][0] = 1, \qquad d[i][j] = d[i-1][j+1] + d[i-1][j-1]\ \ (j > 0)
$$

The DP handles constraints that a formula does not (a fixed prefix, forbidden depth, ...).

```python
from math import comb
from itertools import product

def completion_table(length):
    """d[i][j]: ways to finish a balanced sequence with i characters left starting at balance j."""
    d = [[0] * (length + 2) for _ in range(length + 1)]
    d[0][0] = 1
    for i in range(1, length + 1):
        for j in range(length + 1):
            d[i][j] = d[i - 1][j + 1] + (d[i - 1][j - 1] if j > 0 else 0)
    return d

def catalan(n):
    return comb(2 * n, n) // (n + 1)

d = completion_table(12)
assert [d[2 * n][0] for n in range(7)] == [catalan(n) for n in range(7)]
assert [d[2 * n][0] for n in range(7)] == [1, 1, 2, 5, 14, 42, 132]

def all_sequences(n):
    return sorted("".join(t) for t in product("()", repeat=2 * n) if is_balanced("".join(t)))

assert all(len(all_sequences(n)) == catalan(n) for n in range(6))
assert d[6][2] == 9                                             # 6 characters left, current balance 2: 9 ways to finish

def count_multi(n, k):
    stack_valid = 0
    kinds = "([{"[:k]
    closers = {")": "(", "]": "[", "}": "{"}
    for t in product("()[]{}"[:2 * k], repeat=2 * n):
        stack, ok = [], True
        for ch in t:
            if ch in kinds:
                stack.append(ch)
            elif not stack or stack.pop() != closers[ch]:
                ok = False
                break
        stack_valid += ok and not stack
    return stack_valid

assert [count_multi(n, 2) for n in range(4)] == [catalan(n) * 2 ** n for n in range(4)] == [1, 2, 8, 40]
```

## The lexicographically next balanced sequence

To advance from $s$ to the next balanced sequence, find the **last** position $i$ holding `(` that can be turned into `)` while leaving a valid continuation (there must be enough closing brackets before it for the balance to stay non-negative). Then fill the suffix with the smallest possible completion: as many `(` as possible, then all remaining `)`.

Scanning from the right keeps a running `depth` = (number of `)` minus `(` seen so far in the suffix):

```python
def next_balanced(s):
    n = len(s)
    depth = 0
    for i in range(n - 1, -1, -1):
        depth += -1 if s[i] == "(" else 1
        if s[i] == "(" and depth > 0:
            depth -= 1                                   # turn this "(" into ")"
            opens = (n - i - 1 - depth) // 2             # the rest: opens "(", then the closes
            closes = n - i - 1 - opens
            return s[:i] + ")" + "(" * opens + ")" * closes
    return None

assert next_balanced("(())") == "()()"
assert next_balanced("()()") is None
assert next_balanced("((()))") == "(()())"

for n in range(1, 7):
    every = all_sequences(n)
    walked, current = [], "(" * n + ")" * n
    while current:
        walked.append(current)
        current = next_balanced(current)
    assert walked == every
```

## Enumerating all balanced sequences

By recursion with the two rules: an opening bracket is allowed while fewer than $n$ were placed, a closing one while the balance is positive.

```python
def generate(n):
    result = []

    def build(prefix, opened, closed):
        if len(prefix) == 2 * n:
            result.append("".join(prefix))
            return
        if opened < n:
            prefix.append("(")
            build(prefix, opened + 1, closed)
            prefix.pop()
        if closed < opened:
            prefix.append(")")
            build(prefix, opened, closed + 1)
            prefix.pop()

    build([], 0, 0)
    return result

for n in range(0, 7):
    assert generate(n) == all_sequences(n)
```

## Rank: the index of a sequence

The **rank** of a sequence is its position in the sorted list of all balanced sequences of the same length. Walk through the sequence; every time we see `)` at a position where `(` would also have been possible, all the sequences that put `(` there come earlier, and there are `d[remaining][balance + 1]` of them.

```python
def rank(s):
    length = len(s)
    d = completion_table(length)
    balance, r = 0, 0
    for i, ch in enumerate(s):
        if ch == ")":
            r += d[length - i - 1][balance + 1]
            balance -= 1
        else:
            balance += 1
    return r

for n in range(1, 7):
    every = all_sequences(n)
    assert [rank(s) for s in every] == list(range(len(every)))
```

## The $k$-th sequence (unranking)

Do the reverse: at each position count how many completions start with `(`; if the wanted index is smaller, place `(`; otherwise subtract that count and place `)`.

```python
def kth_sequence(n, k):
    """The k-th (0-indexed) balanced sequence with n pairs."""
    length = 2 * n
    d = completion_table(length)
    balance, out = 0, []
    for i in range(length):
        with_open = d[length - i - 1][balance + 1]
        if k < with_open:
            out.append("(")
            balance += 1
        else:
            k -= with_open
            out.append(")")
            balance -= 1
    return "".join(out)

for n in range(1, 7):
    every = all_sequences(n)
    assert [kth_sequence(n, k) for k in range(len(every))] == every
big = kth_sequence(30, 10 ** 15)                          # the 10^15-th sequence of 60 characters, instantly
assert is_balanced(big) and rank(big) == 10 ** 15
```

Both operations run in $O(n)$ after building the table (which is $O(n^2)$). With $k$ bracket types, multiply each count by $k^{\text{(pairs still to be opened)}}$ and iterate over the types when choosing an opening bracket.

## Applications and related facts

- The bijection between balanced sequences and Dyck paths (`(` = up step, `)` = down step) links this topic to lattice paths and the reflection principle.
- Counting sequences with a fixed prefix or a bounded depth is the same DP with extra conditions.
- The number of *minimum insertions/deletions* to balance a string is computed from the balance profile: the number of unmatched `)` plus unmatched `(`.

```python
def min_fixes(s):
    balance, unmatched_close = 0, 0
    for ch in s:
        if ch == "(":
            balance += 1
        elif balance:
            balance -= 1
        else:
            unmatched_close += 1
    return unmatched_close + balance

assert min_fixes("())(") == 2 and min_fixes("(()") == 1 and min_fixes("()") == 0
```
