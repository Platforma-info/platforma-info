---
title: "Your First Python Program"
section: Getting started
order: 1
difficulty: beginner
summary: "What programming is, how to run Python, how comments, modules and pip work, and how PyInfo judges a solution."
tags: [basics, setup, modules, pip]
prerequisites: []
---

## What is programming?

A computer does exactly what it is told, and nothing else. **Programming** is writing those instructions in a language the computer can execute. A written program is called *source code*; the tool that reads and runs it is an *interpreter* (for Python) or a *compiler* (for languages like C++).

## Why Python?

Python is a high-level, interpreted language designed to read almost like plain English. It is widely used for automation, data analysis, web back-ends and AI, and it is one of the most popular languages for learning algorithms because the code stays short:

- **Readable**: blocks are defined by indentation, not braces.
- **Batteries included**: the standard library covers sorting, heaps, big integers, string processing and much more.
- **Dynamically typed**: you do not declare the type of a variable.
- **Big integers by default**: no overflow, which removes a whole class of bugs in math problems.

The trade-off is speed: pure Python is slower than C++. The [Python for Contests](/theory/python-contests) track shows how to stay inside the time limit.

## Running a program

Install Python 3 from [python.org](https://www.python.org/downloads/) (or through your system's package manager) and check it works:

```text
$ python3 --version
Python 3.12.3
```

Create a file `hello.py` containing:

```python
print("Hello, world!")
```

and run it:

```text
$ python3 hello.py
Hello, world!
```

`print` writes its argument to the standard output, followed by a newline. You can also type `python3` alone to open the **REPL**, an interactive prompt where every line runs immediately. It is a perfectly good calculator:

```python
print(2 + 3 * 4)     # 14: multiplication binds tighter than addition
print((2 + 3) * 4)   # 20
print(7 / 2)         # 3.5 (true division)
print(7 // 2)        # 3   (floor division)
print(7 % 2)         # 1   (remainder)
print(2 ** 10)       # 1024 (power)
```

## Comments

Everything after `#` on a line is ignored by Python. Use comments to explain *why*, not *what*.

```python
# A single-line comment
x = 10  # ...or at the end of a line

"""
A triple-quoted string that is not assigned to anything is
sometimes used as a multi-line comment. Prefer several # lines.
"""
```

## Modules and pip

A **module** is a file of ready-made code that you can reuse. You load one with `import`:

```python
import math

print(math.sqrt(144))     # 12.0
print(math.gcd(84, 36))   # 12
print(math.pi)            # 3.141592653589793
```

There are two kinds of modules:

- **Built-in (standard library)** modules such as `math`, `random`, `heapq`, `collections`, `itertools`. They ship with Python.
- **External** modules such as `numpy` or `flask`, which you install with **pip**, Python's package manager: `pip install numpy`.

> [!NOTE]
> On PyInfo (and in most contests) only the standard library is available and the code has no network access, so you never need `pip` for solving problems. It matters as soon as you build your own projects.

## How PyInfo judges a solution

Every problem on the platform works the same way:

1. Your program is saved as `solution.py` and run once per test as `python3 solution.py < input.txt`.
2. It reads the **standard input** (what you would type on the keyboard) and writes the answer to the **standard output** with `print`.
3. The output is compared with the expected one. Leading and trailing blank space of the whole output is ignored; everything else must match exactly, including spaces and letter case.
4. Each test has a time limit. You get a verdict: *Accepted*, *Wrong answer*, *Runtime error* or *Time limit exceeded*.

A first complete solution therefore looks like this:

```python skip
name = input()
print("Hello,", name)
```

`input()` reads one line. More on reading and converting input in [Variables and Data Types](/theory/python-basics/variables-and-types).

> [!IMPORTANT]
> Print only the answer. A stray `print("Enter a number:")` that is helpful in a terminal turns a correct solution into *Wrong answer* on a judge.

## Exercises

1. Write a program that prints your name on the first line and your favourite number squared on the second.
2. Using the REPL, work out how many minutes there are in a year.
3. Print the greatest common divisor of 1071 and 462 with `math.gcd`.
