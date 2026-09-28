---
title: "Dictionaries and Sets"
section: Collections
order: 2
difficulty: beginner
summary: "Hash-based collections with O(1) lookups: counting, grouping, membership tests and set algebra."
tags: [dict, set, hashing, counting]
prerequisites: [python-basics/lists-and-tuples]
problems: [litera-frecventa]
---

Both structures are built on **hash tables**: finding, inserting or deleting an element takes $O(1)$ on average, no matter how large the collection is. That makes them the first tool to reach for when a solution is too slow because of repeated searching in a list.

## Dictionaries

A **dictionary** maps *keys* to *values*. Keys must be immutable and hashable (numbers, strings, tuples of those). Since Python 3.7 a dict remembers insertion order.

```python
student = {"name": "Ana", "grade": 10}
assert student["name"] == "Ana"

student["age"] = 16               # add or overwrite
del student["grade"]              # remove
assert student == {"name": "Ana", "age": 16}
assert len(student) == 2
assert "age" in student           # tests KEYS, O(1)
```

Reading a missing key with `[]` raises `KeyError`. Use `get` to supply a default:

```python
d = {"a": 1}
assert d.get("a") == 1
assert d.get("z") is None
assert d.get("z", 0) == 0
```

### Iterating

```python
d = {"x": 1, "y": 2, "z": 3}
assert list(d) == ["x", "y", "z"]                    # keys
assert list(d.values()) == [1, 2, 3]
assert list(d.items()) == [("x", 1), ("y", 2), ("z", 3)]

total = 0
for key, value in d.items():
    total += value
assert total == 6
```

Useful methods: `d.pop(key, default)`, `d.setdefault(key, default)`, `d.update(other)`, `d.keys()`, `d.values()`, `d.items()`, `d.copy()`.

### The counting pattern

Counting occurrences is the most common use of a dict:

```python
text = "mississippi"

counts = {}
for ch in text:
    counts[ch] = counts.get(ch, 0) + 1
assert counts == {"m": 1, "i": 4, "s": 4, "p": 2}
```

The standard library has tools that remove the boilerplate:

```python
from collections import Counter, defaultdict

assert Counter(text) == counts
assert Counter(text).most_common(1) in ([("i", 4)], [("s", 4)])

groups = defaultdict(list)                 # missing keys start as []
for word in ["apple", "avocado", "banana", "blueberry", "cherry"]:
    groups[word[0]].append(word)
assert groups["a"] == ["apple", "avocado"]
```

### Merging (Python 3.9+)

```python
a = {"x": 1, "y": 2}
b = {"y": 20, "z": 30}
assert a | b == {"x": 1, "y": 20, "z": 30}     # right side wins on conflicts
a |= b                                          # in-place update
assert a == {"x": 1, "y": 20, "z": 30}
```

## Sets

A **set** is an unordered collection of *unique* elements. It has the fast membership test of a dictionary without values.

```python
s = {3, 1, 2, 3, 3}
assert s == {1, 2, 3}
assert len(s) == 3

s.add(4)
s.discard(10)          # no error if absent (remove() raises KeyError)
assert 4 in s          # O(1)

empty = set()          # NOT {}: that is an empty dictionary
```

Deduplicating a list is one call, but the order is lost:

```python
assert sorted(set([3, 1, 3, 2, 1])) == [1, 2, 3]
```

### Set algebra

```python
a = {1, 2, 3, 4}
b = {3, 4, 5}
assert a | b == {1, 2, 3, 4, 5}      # union
assert a & b == {3, 4}               # intersection
assert a - b == {1, 2}               # difference
assert a ^ b == {1, 2, 5}            # symmetric difference
assert {3, 4} <= a                   # subset
```

## Choosing the right structure

| You need to... | Use |
|----------------|-----|
| keep order and index by position | `list` |
| a fixed record / dictionary key | `tuple` |
| look up a value by a key | `dict` |
| ask "have I seen this?" | `set` |
| count things | `Counter` |

> [!WARNING]
> `x in some_list` scans the whole list: $O(n)$. Inside a loop over $n$ items that is $O(n^2)$ overall and a common cause of *time limit exceeded*. Convert the list to a `set` first.

## Exercises

1. Count how often each letter appears in a word and print the most frequent one.
2. Given two lists, print the elements that appear in both.
3. Given a list of numbers, print `YES` if some value occurs twice, otherwise `NO`.
4. Group a list of words by their length.
5. Two-sum: given a list and a target $t$, find two positions whose values add up to $t$ in $O(n)$ using a dict.
