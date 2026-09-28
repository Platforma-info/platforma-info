---
title: Functions
section: Functions
order: 1
difficulty: beginner
summary: Defining functions, parameters and return values, default and keyword arguments, *args/**kwargs, scope and lambda.
tags: [functions, arguments, scope, lambda]
prerequisites: [python-basics/loops]
---

A **function** is a named, reusable block of code. It removes duplication and lets you name an idea (`is_prime(n)`) instead of repeating its steps.

```python
def greet(name):
    return f"Hello, {name}!"

message = greet("Ana")
assert message == "Hello, Ana!"
```

`def` defines the function; calling it runs the body; `return` hands a value back and ends the function. A function without `return` returns `None`.

## Parameters and arguments

*Parameters* are the names in the definition; *arguments* are the values you pass.

```python
def power(base, exponent=2):        # exponent has a default value
    return base ** exponent

assert power(5) == 25               # default used
assert power(2, 10) == 1024         # positional
assert power(exponent=3, base=2) == 8   # keyword: order does not matter
```

Parameters with defaults must come after those without. Never use a mutable default such as `[]`:

```python
def bad_append(x, target=[]):       # the SAME list is reused on every call!
    target.append(x)
    return target

bad_append(1)
assert bad_append(2) == [1, 2]      # surprise

def good_append(x, target=None):
    if target is None:
        target = []
    target.append(x)
    return target

good_append(1)
assert good_append(2) == [2]
```

### Any number of arguments

```python
def total(*numbers):                # collected into a tuple
    return sum(numbers)

def describe(**info):               # collected into a dict
    return ", ".join(f"{k}={v}" for k, v in sorted(info.items()))

assert total(1, 2, 3, 4) == 10
assert describe(b=2, a=1) == "a=1, b=2"

values = [1, 2, 3]
assert total(*values) == 6          # * unpacks a list into arguments
```

### Returning several values

A function can return a tuple and the caller can unpack it:

```python
def min_max(items):
    return min(items), max(items)

lo, hi = min_max([4, 9, 1])
assert (lo, hi) == (1, 9)
```

## Scope

A variable created inside a function is **local**: it exists only during the call. A function can *read* a global variable, but assigning to it creates a new local one unless you say `global`.

```python
counter = 0

def bump():
    global counter
    counter += 1

bump(); bump()
assert counter == 2
```

> [!TIP]
> Avoid `global`. Pass values in as arguments and return results; the code becomes easier to test and reason about. In competitive programming, wrapping everything in a `def main():` function also makes the program noticeably faster, because local variable access is quicker than global access.

Arguments are passed by *object reference*: a function that mutates a list argument changes the caller's list, while reassigning the parameter does not.

```python
def add_item(lst):
    lst.append("x")        # mutates the caller's list

def rebind(lst):
    lst = ["new"]          # only rebinds the local name

data = []
add_item(data)
rebind(data)
assert data == ["x"]
```

## Lambda functions

A `lambda` is a tiny anonymous function limited to a single expression. It is mostly used as a `key` for sorting.

```python
square = lambda x: x * x
assert square(6) == 36

people = [("Ana", 30), ("Bob", 25), ("Cara", 35)]
assert sorted(people, key=lambda p: p[1])[0] == ("Bob", 25)
assert sorted(people, key=lambda p: -p[1])[0] == ("Cara", 35)
```

## Docstrings and clean design

Put a string as the first statement to document a function. Keep functions short and give each one a single job.

```python
def is_prime(n):
    """Return True if n is a prime number."""
    if n < 2:
        return False
    return all(n % d for d in range(2, int(n ** 0.5) + 1))

assert is_prime(97) and not is_prime(91)
assert is_prime.__doc__ == "Return True if n is a prime number."
```

## Exercises

1. Write `is_even(n)` and `factorial(n)` (with a loop).
2. Write `count_vowels(text)`.
3. Write `gcd(a, b)` using a loop.
4. Write a function that returns both the smallest and the second smallest element of a list.
5. Write `mean(*numbers)` accepting any number of arguments.
