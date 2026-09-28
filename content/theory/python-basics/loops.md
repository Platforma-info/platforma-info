---
title: "Loops"
section: Control flow
order: 2
difficulty: beginner
summary: "while and for loops, range, break / continue / else, enumerate and zip, and nested loops."
tags: [loops, range, iteration]
prerequisites: [python-basics/conditionals, python-basics/lists-and-tuples]
problems: [suma-cifrelor, suma-numere-impare, numar-prim]
---

A loop repeats a block of code. Python has two: `while` (repeat while a condition holds) and `for` (repeat for every item of a sequence).

## `while`

```python
i, total = 1, 0
while i <= 5:
    total += i
    i += 1
assert total == 15
```

Use `while` when you do not know in advance how many iterations you need, for example the sum of digits of a number:

```python
def digit_sum(n):
    total = 0
    while n > 0:
        total += n % 10       # last digit
        n //= 10              # drop the last digit
    return total

assert digit_sum(12345) == 15
```

> [!WARNING]
> Make sure something inside the loop changes the condition. Forgetting `i += 1` makes an infinite loop, which the judge will report as *time limit exceeded*.

## `for` and `range`

`for` walks over anything iterable: lists, strings, dicts, sets, files.

```python
total = 0
for x in [4, 8, 15]:
    total += x
assert total == 27

letters = [ch for ch in "abc"]
assert letters == ["a", "b", "c"]
```

`range` generates numbers lazily (no list is built):

| Call | Values |
|------|--------|
| `range(5)` | 0, 1, 2, 3, 4 |
| `range(2, 6)` | 2, 3, 4, 5 |
| `range(10, 0, -3)` | 10, 7, 4, 1 |

```python
assert list(range(5)) == [0, 1, 2, 3, 4]
assert list(range(2, 6)) == [2, 3, 4, 5]
assert list(range(10, 0, -3)) == [10, 7, 4, 1]
assert sum(range(1, 101)) == 5050
```

The stop value is always excluded. `range(n)` is the usual way to repeat something $n$ times; name the variable `_` when you do not use it.

### Loop with a position: `enumerate`

Do not write `for i in range(len(a))` when you need both the index and the value:

```python
fruits = ["apple", "pear", "plum"]
pairs = [(i, f) for i, f in enumerate(fruits)]
assert pairs == [(0, "apple"), (1, "pear"), (2, "plum")]
assert list(enumerate(fruits, start=1))[0] == (1, "apple")
```

### Two sequences at once: `zip`

```python
names = ["Ana", "Bob"]
scores = [9, 7]
assert list(zip(names, scores)) == [("Ana", 9), ("Bob", 7)]
assert dict(zip(names, scores)) == {"Ana": 9, "Bob": 7}
```

## `break`, `continue` and `else`

- `break` leaves the loop immediately.
- `continue` skips to the next iteration.
- A loop's `else` block runs only if the loop finished **without** `break`.

```python
def is_prime(n):
    if n < 2:
        return False
    for d in range(2, int(n ** 0.5) + 1):
        if n % d == 0:
            return False          # found a divisor
    return True

assert [p for p in range(20) if is_prime(p)] == [2, 3, 5, 7, 11, 13, 17, 19]
```

Same test with `for ... else`:

```python
def first_divisor(n):
    for d in range(2, n):
        if n % d == 0:
            result = d
            break
    else:                          # no break: nothing divided n
        result = None
    return result

assert first_divisor(15) == 3 and first_divisor(13) is None
```

`pass` does nothing and is a placeholder where a statement is required.

## Nested loops

Loops can be nested; the inner loop runs completely for each step of the outer one.

```python
table = [[i * j for j in range(1, 4)] for i in range(1, 4)]
assert table == [[1, 2, 3], [2, 4, 6], [3, 6, 9]]

pattern = "\n".join("*" * i for i in range(1, 4))
assert pattern == "*\n**\n***"
```

Two nested loops over $n$ elements do $n^2$ steps. With $n = 10^5$ that is far too slow in Python, and it is the point where algorithmic thinking starts. See [complexity](/theory/python-contests/performance) in the contest track.

## Exercises

1. Print the multiplication table of a number read from input.
2. Sum all odd numbers between 1 and $n$.
3. Read $n$ and print the first $n$ Fibonacci numbers.
4. Reverse the digits of an integer with a `while` loop.
5. Print a right triangle of stars of height $n$.
6. Find all perfect numbers below 10000 (a number equal to the sum of its proper divisors).
