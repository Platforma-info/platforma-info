---
title: Conditional Statements
section: Control flow
order: 1
difficulty: beginner
summary: if / elif / else, comparison and logical operators, truthiness, the conditional expression and match.
tags: [if, boolean, branching, match]
prerequisites: [python-basics/variables-and-types]
problems: [par-sau-impar]
---

Programs make decisions with `if`. Python marks the body of a branch with **indentation** (four spaces by convention) and a colon at the end of the header line.

```python
def describe(n):
    if n < 0:
        return "negative"
    elif n == 0:
        return "zero"
    else:
        return "positive"

assert describe(-5) == "negative"
assert describe(0) == "zero"
assert describe(9) == "positive"
```

Only the first branch whose condition is true runs. `elif` and `else` are optional.

> [!WARNING]
> Mixing tabs and spaces, or indenting inconsistently, raises `IndentationError`. Configure your editor to insert four spaces when you press Tab.

## Relational and logical operators

Comparisons (`==`, `!=`, `<`, `<=`, `>`, `>=`) produce booleans. Combine them with `and`, `or`, `not`:

```python
age = 17
assert (age >= 13 and age < 18) is True
assert (age < 13 or age >= 65) is False
assert (not age == 17) is False
assert 13 <= age < 18                # chained comparison: the readable form
```

`and` / `or` **short-circuit**: the right operand is evaluated only if it is needed. This is used to guard against errors:

```python
x = 0
safe = x != 0 and 10 / x > 1         # 10 / x is never evaluated
assert safe is False
```

Compare with `==`, never with `=` (which assigns). Use `is` only for `None`: `if value is None:`.

## Truthiness

Any object can be tested in a condition. These are *falsy*: `False`, `None`, `0`, `0.0`, `""`, `[]`, `()`, `{}`, `set()`. Everything else is truthy.

```python
items = []
if not items:
    message = "nothing to do"
else:
    message = "work to do"
assert message == "nothing to do"
```

## Conditional expression

A one-line `if` that produces a value:

```python
n = 7
parity = "even" if n % 2 == 0 else "odd"
assert parity == "odd"

assert max(3, 9) == (3 if 3 > 9 else 9)
```

## `match` (Python 3.10+)

`match` compares a value against patterns; it is a cleaner replacement for long `elif` chains on one variable.

```python
def command(text):
    match text.split():
        case ["quit"]:
            return "bye"
        case ["go", direction]:
            return f"moving {direction}"
        case ["say", *words]:
            return " ".join(words)
        case _:
            return "unknown"

assert command("quit") == "bye"
assert command("go north") == "moving north"
assert command("say hello there") == "hello there"
assert command("dance") == "unknown"
```

## Common patterns

Leap year: divisible by 4, except centuries that are not divisible by 400.

```python
def is_leap(year):
    return year % 4 == 0 and (year % 100 != 0 or year % 400 == 0)

assert is_leap(2024) and not is_leap(1900) and is_leap(2000)
```

Clamp a value into a range:

```python
def clamp(x, lo, hi):
    return max(lo, min(x, hi))

assert clamp(15, 0, 10) == 10 and clamp(-3, 0, 10) == 0 and clamp(4, 0, 10) == 4
```

## Exercises

1. Read a number and print `par` (even) or `impar` (odd).
2. Read three numbers and print the largest without `max`.
3. Given the lengths of three sides, decide if they form a triangle, and if it is equilateral, isosceles or scalene.
4. Read a year and tell whether it is a leap year.
5. Read a letter and print whether it is a vowel or a consonant.
