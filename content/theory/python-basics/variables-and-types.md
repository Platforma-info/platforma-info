---
title: "Variables and Data Types"
section: Data and text
order: 1
difficulty: beginner
summary: "Variables, the core types (int, float, str, bool), operators, type conversion and reading input."
tags: [basics, types, operators, input]
prerequisites: [python-basics/first-program]
problems: [suma-a-doua-numere, celsius-fahrenheit]
---

## Variables

A **variable** is a name attached to a value. You create it by assigning:

```python
age = 16
price = 19.99
name = "Ana"
is_student = True

print(age, price, name, is_student)
```

There is no declaration and the same name can later refer to a value of another type. Python also lets you assign several names at once, and swap without a temporary:

```python
a, b = 1, 2
a, b = b, a
assert (a, b) == (2, 1)

x = y = 0          # both names refer to 0
```

### Naming rules

An identifier can contain letters, digits and underscores, and cannot start with a digit. Names are case-sensitive (`Total` and `total` are different) and cannot be a keyword (`if`, `for`, `class`, ...). The convention for variables and functions is `snake_case`.

## The basic data types

| Type | Example | Meaning |
|------|---------|---------|
| `int` | `42`, `-7`, `10**100` | whole numbers of any size |
| `float` | `3.14`, `1e-9` | real numbers with limited precision |
| `str` | `"hello"`, `'a'` | text |
| `bool` | `True`, `False` | truth values |
| `NoneType` | `None` | "no value" |

`type()` tells you what something is:

```python
print(type(5), type(5.0), type("5"), type(True), type(None))
```

```text
<class 'int'> <class 'float'> <class 'str'> <class 'bool'> <class 'NoneType'>
```

> [!PYTHON]
> `int` has no upper limit, so `2**1000` is fine. `float` is a 64-bit binary number, so `0.1 + 0.2` is `0.30000000000000004`. Compare floats with a tolerance (`math.isclose`) and use integers whenever the problem allows it.

## Operators

**Arithmetic**

| Operator | Meaning | Example | Result |
|----------|---------|---------|--------|
| `+` `-` `*` | add, subtract, multiply | `6 * 7` | `42` |
| `/` | true division (always a float) | `7 / 2` | `3.5` |
| `//` | floor division | `7 // 2`, `-7 // 2` | `3`, `-4` |
| `%` | remainder | `7 % 3`, `-7 % 3` | `1`, `2` |
| `**` | power | `2 ** 5` | `32` |

```python
assert 7 // 2 == 3 and -7 // 2 == -4       # floors toward minus infinity
assert -7 % 3 == 2                          # result has the sign of the divisor
assert divmod(17, 5) == (3, 2)              # quotient and remainder together
assert (7 // 2) * 2 + 7 % 2 == 7            # the identity that always holds
```

**Comparison** (`==`, `!=`, `<`, `<=`, `>`, `>=`) give a `bool`, and can be chained: `0 < x < 10`.

**Logical**: `and`, `or`, `not`.

**Augmented assignment** is shorthand: `x += 1` means `x = x + 1` (same for `-=`, `*=`, `//=`, `%=`, `**=`).

## Converting between types

Use the type name as a function:

```python
assert int("42") + 1 == 43
assert float("3.5") * 2 == 7.0
assert str(2024) + "!" == "2024!"
assert int(3.99) == 3            # truncates, does not round
assert round(3.5) == 4 and round(2.5) == 2     # banker's rounding: ties go to even
assert bool(0) is False and bool("") is False and bool([]) is False
assert bool("0") is True         # a non-empty string is always truthy
```

Converting something that is not a valid number raises a `ValueError` (see [Exceptions](/theory/python-basics/exceptions)).

## Reading input

`input()` always returns a **string**, so convert what you read:

```python skip
n = int(input())                          # one integer on a line
a, b = map(int, input().split())          # two integers on one line
values = list(map(int, input().split()))  # any number of integers
name = input()                            # a line of text
```

For an input line `5 7`, `input().split()` gives `['5', '7']` and `map(int, ...)` converts each piece. A complete program for the problem *sum of two numbers*:

```python skip
a, b = map(int, input().split())
print(a + b)
```

To feel what these calls do without a keyboard, apply them to a literal string:

```python
line = "5 7"
a, b = map(int, line.split())
assert a + b == 12
```

## Formatting output

`print` accepts several values and separates them by a space; use `sep` and `end` to change that. **f-strings** embed expressions in text:

```python
x, y = 3, 4
print(x, y)                       # 3 4
print(x, y, sep=", ")             # 3, 4
print("no newline", end="")       # stays on the same line
print()
print(f"{x} squared is {x**2}")   # 3 squared is 9
print(f"{22/7:.3f}")              # 3.143  (3 decimals)
print(f"{5:03d}")                 # 005    (zero-padded)
```

## Exercises

1. Read two integers and print their sum, difference, product, quotient (`//`) and remainder.
2. Convert a temperature from Celsius to Fahrenheit: $F = C \cdot 9/5 + 32$.
3. Read a three-digit number and print the sum of its digits using only `//` and `%`.
4. Explain why `int("3.5")` fails but `int(float("3.5"))` works.
