---
title: Comprehensions and Functional Tools
section: Idiomatic Python
order: 1
difficulty: intermediate
summary: List/dict/set comprehensions, generator expressions, map, filter, reduce, any/all, and the itertools basics.
tags: [comprehension, generator, map, filter, reduce]
prerequisites: [python-basics/loops, python-basics/functions]
---

Idiomatic Python favours short, declarative expressions over index-juggling loops. They are usually shorter and often faster.

## List comprehensions

`[expression for item in iterable if condition]`

```python
squares = [x * x for x in range(6)]
assert squares == [0, 1, 4, 9, 16, 25]

evens = [x for x in range(10) if x % 2 == 0]
assert evens == [0, 2, 4, 6, 8]

labels = ["even" if x % 2 == 0 else "odd" for x in range(3)]
assert labels == ["even", "odd", "even"]

pairs = [(i, j) for i in range(3) for j in range(3) if i < j]
assert pairs == [(0, 1), (0, 2), (1, 2)]

matrix = [[1, 2, 3], [4, 5, 6]]
assert [row[0] for row in matrix] == [1, 4]                  # first column
assert [list(col) for col in zip(*matrix)] == [[1, 4], [2, 5], [3, 6]]   # transpose
assert [x for row in matrix for x in row] == [1, 2, 3, 4, 5, 6]          # flatten
```

Read the `for` clauses left to right exactly as you would write nested loops.

## Dict and set comprehensions

```python
words = ["apple", "fig", "banana"]
assert {w: len(w) for w in words} == {"apple": 5, "fig": 3, "banana": 6}
assert {len(w) for w in words} == {3, 5, 6}
inverted = {v: k for k, v in {"a": 1, "b": 2}.items()}
assert inverted == {1: "a", 2: "b"}
```

## Generator expressions

Use parentheses to get a **lazy** sequence: values are produced one at a time and nothing is stored. Feed it straight into `sum`, `min`, `max`, `any`, `all`, `join`:

```python
assert sum(x * x for x in range(1000)) == 332833500      # no list is built
assert max(len(w) for w in ["a", "abc", "ab"]) == 3

gen = (x for x in range(3))
assert next(gen) == 0 and list(gen) == [1, 2]            # consumed once, then empty
```

Write your own generator with `yield`:

```python
def fibonacci():
    a, b = 0, 1
    while True:
        yield a
        a, b = b, a + b

from itertools import islice
assert list(islice(fibonacci(), 8)) == [0, 1, 1, 2, 3, 5, 8, 13]
```

## `any`, `all`, `sum` with booleans

```python
nums = [3, 5, 8]
assert any(n % 2 == 0 for n in nums)          # at least one even
assert not all(n % 2 == 1 for n in nums)      # not all odd
assert sum(n % 2 == 1 for n in nums) == 2     # True counts as 1: the number of odds
```

## `map`, `filter`, `reduce`

```python
assert list(map(int, ["1", "2", "3"])) == [1, 2, 3]
assert list(map(lambda x, y: x + y, [1, 2], [10, 20])) == [11, 22]
assert list(filter(lambda x: x > 1, [0, 1, 2, 3])) == [2, 3]

from functools import reduce
from operator import mul

assert reduce(mul, range(1, 6)) == 120                  # 1*2*3*4*5
assert reduce(lambda acc, x: acc * 10 + x, [1, 2, 3]) == 123
```

`map(int, input().split())` is the most common use in this whole platform. For everything else, a comprehension is usually clearer than `map` / `filter` with a `lambda`.

## itertools: a short tour

```python
from itertools import accumulate, combinations, permutations, product, groupby

assert list(accumulate([1, 2, 3, 4])) == [1, 3, 6, 10]              # prefix sums
assert list(combinations("abc", 2)) == [("a", "b"), ("a", "c"), ("b", "c")]
assert len(list(permutations(range(4)))) == 24
assert list(product("ab", repeat=2)) == [("a", "a"), ("a", "b"), ("b", "a"), ("b", "b")]
assert [(k, len(list(g))) for k, g in groupby("aabccc")] == [("a", 2), ("b", 1), ("c", 3)]
```

These get a full treatment in [The Standard-Library Toolbox](/theory/python-contests/standard-library-toolbox).

## Sorting with keys

`sorted(iterable, key=..., reverse=...)` accepts any function. A tuple key sorts by several criteria; negate a number to reverse just that criterion:

```python
people = [("Ana", 30), ("Bob", 25), ("Cara", 30)]
# by age descending, then by name ascending
result = sorted(people, key=lambda p: (-p[1], p[0]))
assert result == [("Ana", 30), ("Cara", 30), ("Bob", 25)]
```

> [!WARNING]
> Keep comprehensions short. If it needs more than one condition or a nested comprehension of nested comprehensions, write a normal loop; readability wins.

## Exercises

1. Build the list of all three-digit numbers whose digits sum to 10.
2. Given a list of words, build a dict of the words that start with each letter.
3. Flatten a list of lists in one comprehension.
4. Using `zip`, compute the dot product of two vectors in one line.
