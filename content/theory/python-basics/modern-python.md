---
title: "Modern Python Features"
section: Idiomatic Python
order: 2
difficulty: intermediate
summary: "Type hints, the walrus operator, structural pattern matching, the __main__ guard and virtual environments."
tags: [typing, walrus, match, venv, main]
prerequisites: [python-basics/functions]
---

Python evolves every year. These features make code safer and shorter; you will meet them in real projects and increasingly in solutions.

## Type hints

Annotations document what a function expects and returns. Python **does not enforce them at run time**, but editors and tools such as `mypy` use them to catch mistakes.

```python
def average(values: list[float]) -> float:
    return sum(values) / len(values)

def find(items: list[int], target: int) -> int | None:
    for i, x in enumerate(items):
        if x == target:
            return i
    return None

assert average([1, 2, 3]) == 2.0
assert find([5, 6, 7], 7) == 2 and find([5], 9) is None
```

Useful forms: `list[int]`, `dict[str, int]`, `tuple[int, int]`, `set[str]`, `X | None` (Python 3.10+, older: `Optional[X]`), and `Callable[[int], int]` from `collections.abc`.

## The walrus operator `:=`

An assignment that is also an expression (Python 3.8+). It saves a duplicated call or a separate line:

```python
data = [1, 2, 3, 4, 5]

if (n := len(data)) > 3:
    assert n == 5

values = iter([3, 2, 1, 0, 9])
collected = []
while (v := next(values)) != 0:
    collected.append(v)
assert collected == [3, 2, 1]
```

## Structural pattern matching

`match` (Python 3.10+) destructures data. Besides literals it can match sequence shapes, dictionaries and class instances, with guards:

```python
def classify(shape):
    match shape:
        case ("circle", r) if r > 0:
            return "circle"
        case ("rect", w, h):
            return "square" if w == h else "rectangle"
        case {"kind": "point", "x": x, "y": y}:
            return f"point at {x},{y}"
        case []:
            return "empty"
        case _:
            return "unknown"

assert classify(("circle", 2)) == "circle"
assert classify(("rect", 2, 2)) == "square"
assert classify({"kind": "point", "x": 1, "y": 2}) == "point at 1,2"
assert classify([]) == "empty"
assert classify(42) == "unknown"
```

## Dictionary merge operators

```python
defaults = {"theme": "light", "size": 12}
overrides = {"size": 14}
assert defaults | overrides == {"theme": "light", "size": 14}
```

## `if __name__ == "__main__"`

Every module has a `__name__`. When a file is run directly it is `"__main__"`; when it is imported it is the module's name. The guard lets a file serve both as a library and as a script:

```python
def main():
    print("running as a script")

if __name__ == "__main__":
    main()
```

For contest solutions the guard is optional, but putting the code in `main()` makes it faster (locals are quicker than globals).

## Virtual environments

A **virtual environment** is an isolated set of installed packages for one project, so that projects with conflicting dependencies do not break each other.

```text
$ python3 -m venv .venv            # create it
$ source .venv/bin/activate        # activate (Windows: .venv\Scripts\activate)
(.venv) $ pip install requests     # installs only inside this environment
(.venv) $ pip freeze > requirements.txt
(.venv) $ deactivate
```

Commit `requirements.txt`, never the `.venv` folder itself.

## Where to go next

- The [official tutorial](https://docs.python.org/3/tutorial/) is excellent and short.
- Ready to compete? Continue with the [Python for Contests](/theory/python-contests) track.

## Exercises

1. Add type hints to three of your earlier solutions.
2. Rewrite a chain of `if/elif` on a command string using `match`.
3. Create a virtual environment, install a package, and confirm that `pip list` shows it only while the environment is active.
