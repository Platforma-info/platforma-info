---
title: "Lists and Tuples"
section: Collections
order: 1
difficulty: beginner
summary: "Python's workhorse sequences: creating, indexing, slicing, sorting and modifying lists, and when to use tuples."
tags: [lists, tuples, sorting, sequences]
prerequisites: [python-basics/strings]
problems: [maxim-lista, inversare-lista, medie-aritmetica, suma-numere-impare]
---

## Lists

A **list** is an ordered, *mutable* collection. It can hold values of any type, even mixed.

```python
nums = [5, 3, 8, 1]
mixed = [1, "two", 3.0, [4, 5]]
empty = []
assert len(nums) == 4
```

Indexing and slicing work exactly like on strings (including negative indices), but slices of lists are new lists and elements can be assigned:

```python
nums = [5, 3, 8, 1]
assert nums[0] == 5 and nums[-1] == 1
assert nums[1:3] == [3, 8]
assert nums[::-1] == [1, 8, 3, 5]

nums[0] = 50
assert nums == [50, 3, 8, 1]
```

### Adding and removing elements

```python
a = [1, 2, 3]
a.append(4)              # add at the end            -> [1, 2, 3, 4]
a.insert(0, 0)           # add at index 0 (O(n))     -> [0, 1, 2, 3, 4]
a.extend([5, 6])         # add many                  -> [0, 1, 2, 3, 4, 5, 6]
assert a == [0, 1, 2, 3, 4, 5, 6]

assert a.pop() == 6      # remove and return the last element (O(1))
assert a.pop(0) == 0     # remove by index (O(n))
a.remove(3)              # remove the first element equal to 3
assert a == [1, 2, 4, 5]

del a[0]                 # delete by index
assert a == [2, 4, 5]
```

### Searching and counting

```python
a = [4, 2, 4, 1]
assert 2 in a                      # membership test, O(n)
assert a.index(4) == 0             # position of the first 4
assert a.count(4) == 2
assert max(a) == 4 and min(a) == 1 and sum(a) == 11
```

### Sorting and reversing

`sort()` changes the list; `sorted()` returns a new one and works on any iterable. Both accept `reverse=True` and a `key` function.

```python
words = ["pear", "fig", "banana"]
assert sorted(words) == ["banana", "fig", "pear"]
assert sorted(words, key=len) == ["fig", "pear", "banana"]
assert sorted([3, 1, 2], reverse=True) == [3, 2, 1]

nums = [3, 1, 2]
nums.sort()
nums.reverse()
assert nums == [3, 2, 1]
```

### Copying: a classic trap

Assignment does not copy a list; it gives the same list a second name.

```python
a = [1, 2, 3]
b = a              # same object!
b.append(4)
assert a == [1, 2, 3, 4]

c = a.copy()       # or a[:] or list(a): an independent (shallow) copy
c.append(5)
assert a == [1, 2, 3, 4] and c == [1, 2, 3, 4, 5]
```

The same trap appears when building a 2D grid:

```python
bad = [[0] * 3] * 3            # three references to the SAME row
bad[0][0] = 1
assert bad == [[1, 0, 0], [1, 0, 0], [1, 0, 0]]

good = [[0] * 3 for _ in range(3)]   # three distinct rows
good[0][0] = 1
assert good == [[1, 0, 0], [0, 0, 0], [0, 0, 0]]
```

## Reading a list from input

```python skip
n = int(input())
a = list(map(int, input().split()))
print(max(a), min(a), sum(a) / n)
```

## Tuples

A **tuple** is an ordered, *immutable* collection, written with parentheses (or just commas).

```python
point = (3, 4)
single = (5,)            # the trailing comma makes it a tuple
x, y = point             # unpacking
assert (x, y) == (3, 4)
assert point[0] == 3
assert point + (5,) == (3, 4, 5)
assert (1, 2) < (1, 3) < (2, 0)     # compared element by element
```

Use a tuple when the data should not change: coordinates, a `(row, column)` pair, an `(edge, weight)` record. Because they are immutable and hashable, tuples can be dictionary keys and set members, which lists cannot.

Unpacking is more powerful than it looks:

```python
first, *middle, last = [1, 2, 3, 4, 5]
assert first == 1 and middle == [2, 3, 4] and last == 5

for i, (name, score) in enumerate([("Ana", 9), ("Bob", 7)]):
    assert i in (0, 1)
```

## Exercises

1. Read $n$ integers and print the maximum without using `max`.
2. Print the list in reverse order in two different ways.
3. Remove all duplicates from a list while keeping the first occurrence of each value.
4. Given a list of `(name, grade)` tuples, print the names sorted by grade descending.
5. Rotate a list by $k$ positions to the right.
