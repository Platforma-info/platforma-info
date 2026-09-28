---
title: Files and Standard Input
section: Files and errors
order: 1
difficulty: beginner
summary: Read and write files with the with statement, and the standard-input techniques you use in every judged problem.
tags: [files, io, stdin, with]
prerequisites: [python-basics/strings]
---

Programs that outlive a single run need to store data in **files**. The same reading tools also apply to the standard input, which is how judged problems deliver their data.

## Opening a file

```python
import os
import tempfile

path = os.path.join(tempfile.mkdtemp(), "notes.txt")

with open(path, "w", encoding="utf-8") as f:   # "w": write, creates or overwrites
    f.write("first line\n")
    f.write("second line\n")
    f.writelines(["third line\n", "fourth line\n"])
```

`open(path, mode)` returns a file object. The common modes are:

| Mode | Meaning |
|------|---------|
| `"r"` | read (default); error if the file does not exist |
| `"w"` | write; **erases** an existing file |
| `"a"` | append to the end |
| `"x"` | create; error if it already exists |
| `"b"` | add for binary data, e.g. `"rb"` |

### Always use `with`

`with open(...) as f:` closes the file automatically when the block ends, even if an error occurs. Without it you must remember `f.close()`, and unflushed data may be lost.

## Reading

```python
with open(path, encoding="utf-8") as f:
    everything = f.read()                 # the whole file as one string
assert everything.startswith("first line\n")

with open(path, encoding="utf-8") as f:
    first = f.readline()                  # one line, including the "\n"
    rest = f.readlines()                  # the remaining lines as a list
assert first == "first line\n" and len(rest) == 3

with open(path, encoding="utf-8") as f:
    lengths = [len(line.rstrip("\n")) for line in f]     # iterate lazily, line by line
assert lengths == [10, 11, 10, 11]
```

Iterating over the file object (`for line in f`) is the best default: it reads one line at a time and works on files larger than memory.

## Standard input and output

A judged program reads from **standard input** (`stdin`) and writes to **standard output** (`stdout`). You already know `input()` and `print()`; here are the tools for the rest.

Read until the input ends:

```python skip
import sys

for line in sys.stdin:                 # every remaining line
    line = line.strip()
    if line:
        print(line.upper())
```

Read everything at once and split into tokens, which is the most robust way when the input format is a stream of numbers:

```python skip
import sys

data = sys.stdin.read().split()
n = int(data[0])
numbers = list(map(int, data[1:1 + n]))
print(sum(numbers))
```

You can test such code without a keyboard by substituting the stream:

```python
import io
import sys

sys.stdin = io.StringIO("3\n10 20 30\n")
data = sys.stdin.read().split()
n = int(data[0])
assert sum(map(int, data[1:1 + n])) == 60
sys.stdin = sys.__stdin__
```

Writing many lines is faster if you collect them and print once:

```python
lines = [str(i * i) for i in range(5)]
output = "\n".join(lines)
assert output == "0\n1\n4\n9\n16"
print(output)
```

More on speed in [Fast Input and Output](/theory/python-contests/fast-io).

## Paths

The `pathlib` module treats paths as objects and is clearer than string concatenation:

```python
from pathlib import Path

p = Path(path)
assert p.name == "notes.txt" and p.suffix == ".txt"
assert p.exists()
assert p.read_text(encoding="utf-8").count("\n") == 4
```

## Exercises

1. Write the numbers 1 to 100 to a file, one per line, then read the file and print their sum.
2. Count the lines, words and characters of a text file.
3. Print the longest line of a file.
4. Read a stream of integers of unknown length from stdin and print their average.
