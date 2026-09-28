---
title: "Understanding Verdicts"
section: Input and output
order: 2
difficulty: beginner
summary: "What Accepted, Wrong answer, Runtime error and Time limit exceeded mean on PyInfo, and a checklist for each failure."
tags: [judge, debugging, verdicts]
prerequisites: [python-basics/first-program]
---

Every submission ends with a verdict. Reading it correctly is half of debugging.

| Verdict | Meaning |
|---------|---------|
| **Accepted** | every test passed |
| **Wrong answer** | the program finished, but its output differs from the expected one |
| **Runtime error** | the program crashed (exception or non-zero exit code) |
| **Time limit exceeded** | it ran longer than the limit on some test |
| **Compile error** | a syntax error: Python could not even parse the file |

The judge runs the tests in order and **stops at the first failure**; the message tells you which test failed and, for *Wrong answer*, what was expected and what you printed.

## Wrong answer

The logic is wrong, or the format is. Check in this order:

1. **Format.** Extra prompt text, wrong capitalization (`Yes` vs `YES`), extra spaces, a missing decimal precision. Compare the expected and obtained lines character by character.
2. **The samples.** Does your program give the sample output? If not, trace it by hand on the sample.
3. **Edge cases.** $n = 1$, empty or single-character strings, all elements equal, the minimum and maximum values, zero, negative numbers.
4. **Integer versus float division.** Use `//` for integers; `/` always returns a float, which prints as `5.0`.
5. **Off-by-one errors.** Is `range(n)` supposed to be `range(n + 1)`? Is a slice end exclusive?

```python
assert 7 / 2 == 3.5 and 8 / 2 == 4.0     # a float, prints as 4.0
assert 8 // 2 == 4                        # an int, prints as 4
assert list(range(3)) == [0, 1, 2]        # the stop value is excluded
```

## Runtime error

Read the last line of the message: it names the exception.

| Message | Likely cause |
|---------|--------------|
| `ValueError: invalid literal for int()` | you read a line that is not a single integer, or forgot `.split()` |
| `IndexError: list index out of range` | the list is shorter than you assumed; check empty input and loop bounds |
| `EOFError: EOF when reading a line` | you call `input()` more times than there are lines |
| `ZeroDivisionError` | a division or modulo by a value that can be zero |
| `RecursionError` | recursion too deep; convert to a loop or use an explicit stack |
| `KeyError` | use `dict.get` or `in` before reading a key |

## Time limit exceeded

The tests may be much larger than the samples. Work out the complexity of your solution and compare it with the limits from [Performance](/theory/python-contests/performance). The usual culprits:

- two nested loops over large data ($O(n^2)$); look for a dictionary, a set, sorting, prefix sums or a better algorithm,
- `x in some_list` inside a loop,
- reading with `input()` or printing in a loop for hundreds of thousands of lines ([Fast I/O](/theory/python-contests/fast-io)),
- an infinite loop because the loop variable is never updated.

## Compile error

Python reports the line: a missing colon, unbalanced brackets, inconsistent indentation, or a `match` statement on an interpreter older than 3.10. Run the file locally first.

## A debugging routine that works

1. Reproduce the failing test locally: save its input to a file and run `python3 solution.py < input.txt`.
2. Write a slow but obviously correct **brute force** solution.
3. Generate small random tests and compare both programs. The first difference is a minimal counter-example.
4. Print intermediate values to `sys.stderr` (`print(x, file=sys.stderr)`): the judge only looks at standard output, so debug prints there do not break the format.
