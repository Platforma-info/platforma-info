---
title: "Fast Input and Output"
section: Input and output
order: 1
difficulty: beginner
summary: "Read large inputs and print large outputs quickly, and the templates for the most common input formats."
tags: [io, stdin, performance, templates]
prerequisites: [python-basics/variables-and-types]
---

With a few hundred numbers it does not matter how you read them. With $2 \cdot 10^5$ numbers it can be the difference between *Accepted* and *Time limit exceeded*: `input()` and `print()` are convenient but slow, because each call does a lot of bookkeeping.

We measured 300,000 integers on one line each (CPython 3.11, one core):

| Way of reading | Time |
|----------------|------|
| `input()` in a loop | 0.43 s |
| `sys.stdin.readline` in a loop | 0.12 s |
| `sys.stdin.read().split()` | 0.08 s |

and writing 300,000 lines:

| Way of writing | Time |
|----------------|------|
| `print(i)` in a loop | 0.57 s |
| one `print("\n".join(...))` | 0.12 s |

Your machine will differ, but the ratios (roughly 4x to 5x) hold.

## Reading

### Everything at once (fastest, most flexible)

Read all input as one string, split it into tokens, and walk through them with a pointer. This handles any layout of spaces and newlines.

```python skip
import sys

def main():
    data = sys.stdin.buffer.read().split()   # bytes tokens; int() accepts bytes
    n = int(data[0])
    a = list(map(int, data[1:1 + n]))
    print(sum(a))

main()
```

Reading `sys.stdin.buffer` skips text decoding, which is a little faster still. Use `sys.stdin.read()` if you need `str` tokens.

### Line by line

```python skip
import sys

input = sys.stdin.readline          # shadow the built-in with the faster function

n = int(input())
a = list(map(int, input().split()))
```

> [!WARNING]
> `sys.stdin.readline` keeps the trailing `"\n"`. `int()` and `.split()` ignore it, but a string read this way still ends with a newline; call `.strip()` (or `.rstrip("\n")`) before comparing or printing it.

### Common input formats

Try these on a string with `io.StringIO`, exactly as the judge would feed your program:

```python
import io

def read_all(text):
    return io.StringIO(text).read().split()

# 1. n, then n numbers
tok = read_all("3\n10 20 30\n")
n = int(tok[0]); a = list(map(int, tok[1:1 + n]))
assert a == [10, 20, 30]

# 2. several test cases: t, then for each case n and n numbers
tok = read_all("2\n2\n1 2\n3\n4 5 6\n"); p = 0
t = int(tok[p]); p += 1
answers = []
for _ in range(t):
    n = int(tok[p]); p += 1
    a = list(map(int, tok[p:p + n])); p += n
    answers.append(sum(a))
assert answers == [3, 15]

# 3. a grid: r rows of c characters
tok = read_all("2 3\n#.#\n..#\n")
r, c = int(tok[0]), int(tok[1])
grid = tok[2:2 + r]
assert grid[0][2] == "#" and len(grid) == 2

# 4. edges of a graph: n, m, then m pairs
tok = read_all("4 3\n1 2\n2 3\n3 4\n")
n, m = int(tok[0]), int(tok[1])
edges = [(int(tok[2 + 2 * i]) - 1, int(tok[3 + 2 * i]) - 1) for i in range(m)]
assert edges == [(0, 1), (1, 2), (2, 3)]
```

Tokenizing by whitespace works for grids without spaces inside rows. If rows can contain spaces, read them with `readline` instead.

## Writing

Collect the answers in a list and print once:

```python
out = []
for x in range(1, 6):
    out.append(x * x)
print("\n".join(map(str, out)))         # one line per answer
print(" ".join(map(str, out)))          # all on one line
```

You can also pass `*out` with `sep`: `print(*out, sep="\n")`. It builds the output in one call as well.

## Formatting details that cause *Wrong answer*

- The judge trims blank space at the very start and end of the **whole** output, but line breaks and spaces **inside** must match exactly. No extra spaces between numbers, no trailing spaces at the end of a line unless the problem asks for it.
- Floats: `print(2/3)` prints 16 digits. If the statement asks for 4 decimals, write `print(f"{2/3:.4f}")` (output `0.6667`).
- Booleans: `print(True)` prints `True`. If the statement wants `YES` / `NO`, print exactly that string, in the requested case.

```python
assert f"{2/3:.4f}" == "0.6667"
assert ("YES" if 5 % 2 == 1 else "NO") == "YES"
```

## A reusable template

```python skip
import sys

def main():
    data = sys.stdin.buffer.read().split()
    # ... parse `data` ...
    out = []
    # ... fill `out` ...
    sys.stdout.write("\n".join(map(str, out)) + "\n")

main()
```

Wrapping everything in `main()` also speeds up the computation itself; see [Performance](/theory/python-contests/performance).
