---
title: Exceptions
section: Files and errors
order: 2
difficulty: beginner
summary: What runtime errors are, how to catch them with try / except / else / finally, and how to raise your own.
tags: [errors, try, except, raise]
prerequisites: [python-basics/functions]
---

When Python cannot do what you asked, it raises an **exception**. If nothing handles it, the program stops and prints a *traceback*. On a judge that is a *Runtime error* verdict.

Common exceptions and their usual cause:

| Exception | Typical cause |
|-----------|---------------|
| `ValueError` | right type, wrong value: `int("abc")` |
| `TypeError` | wrong type: `"a" + 1` |
| `IndexError` | list index out of range |
| `KeyError` | missing dictionary key |
| `ZeroDivisionError` | `1 / 0` or `n % 0` |
| `EOFError` | `input()` after the input ended |
| `RecursionError` | recursion too deep |

## try / except

```python
def to_int(text):
    try:
        return int(text)
    except ValueError:
        return None

assert to_int("42") == 42
assert to_int("4x2") is None
```

Catch specific exceptions. A bare `except:` also swallows `KeyboardInterrupt` and hides real bugs.

Several handlers, and one handler for several types:

```python
def safe_divide(a, b):
    try:
        return a / b
    except ZeroDivisionError:
        return float("inf")
    except (TypeError, ValueError) as err:
        return f"bad input: {err}"

assert safe_divide(6, 3) == 2.0
assert safe_divide(1, 0) == float("inf")
assert safe_divide("a", 1).startswith("bad input")
```

## else and finally

- `else` runs if **no** exception occurred;
- `finally` runs **always**, for cleanup.

```python
log = []

def attempt(text):
    try:
        value = int(text)
    except ValueError:
        log.append("error")
    else:
        log.append(f"ok {value}")
    finally:
        log.append("done")

attempt("7")
attempt("x")
assert log == ["ok 7", "done", "error", "done"]
```

The `with` statement from [Files](/theory/python-basics/file-io) is the tidy way to guarantee cleanup.

## Raising exceptions

Use `raise` to signal that a caller broke the rules of your function:

```python
def sqrt_int(n):
    if n < 0:
        raise ValueError("n must be non-negative")
    r = int(n ** 0.5)
    while r * r > n:
        r -= 1
    while (r + 1) * (r + 1) <= n:
        r += 1
    return r

assert sqrt_int(99) == 9

try:
    sqrt_int(-1)
except ValueError as err:
    assert str(err) == "n must be non-negative"
```

You can define your own exception type by subclassing `Exception`:

```python
class InsufficientFunds(Exception):
    pass

def withdraw(balance, amount):
    if amount > balance:
        raise InsufficientFunds(f"need {amount - balance} more")
    return balance - amount

try:
    withdraw(10, 30)
except InsufficientFunds as err:
    assert "20" in str(err)
```

## Reading until the input ends

A frequent judge idiom uses `EOFError`, although `sys.stdin` iteration is cleaner (see [Files and Standard Input](/theory/python-basics/file-io)):

```python skip
while True:
    try:
        line = input()
    except EOFError:
        break
    print(line)
```

> [!NOTE]
> Do not wrap your whole solution in `try/except` to hide errors. A judge that reports a runtime error is telling you about a real bug: an index off by one, a missing case, an empty input.

## Exercises

1. Read a number from a string and print `invalid` instead of crashing when it is not numeric.
2. Write `get(lst, i, default)` that returns `lst[i]` or `default` when the index is out of range, using `try`.
3. Write a function that raises `ValueError` if a password is shorter than 8 characters.
