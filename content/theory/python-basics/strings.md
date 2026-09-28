---
title: Strings
section: Data and text
order: 2
difficulty: beginner
summary: Indexing, slicing, the most useful string methods, escape sequences and f-strings.
tags: [strings, slicing, methods]
prerequisites: [python-basics/variables-and-types]
problems: [nume-inversat, palindrom, numarare-vocale]
---

A **string** is an immutable sequence of characters. Single, double and triple quotes all create one:

```python
a = 'single'
b = "double: it's fine"
c = """triple quotes
can span several lines"""
assert len(a) == 6
```

## Indexing

Characters are numbered from `0`. Negative indices count from the end.

```python
s = "PyInfo"
assert s[0] == "P" and s[2] == "I"
assert s[-1] == "o" and s[-2] == "f"
assert len(s) == 6
```

Strings are **immutable**: `s[0] = "p"` raises a `TypeError`. To "change" a string, build a new one.

## Slicing

`s[start:stop:step]` takes characters from `start` up to but **not including** `stop`. Any part may be omitted.

```python
s = "abcdefgh"
assert s[2:5] == "cde"        # indexes 2, 3, 4
assert s[:3] == "abc"         # from the beginning
assert s[5:] == "fgh"         # to the end
assert s[-3:] == "fgh"        # the last three
assert s[::2] == "aceg"       # every second character
assert s[::-1] == "hgfedcba"  # reversed
assert s[6:100] == "gh"       # out-of-range slices are clipped, not errors
```

`s[::-1]` is the idiomatic way to reverse a string, and the core of the *palindrome* check:

```python
def is_palindrome(text):
    return text == text[::-1]

assert is_palindrome("level") and not is_palindrome("python")
```

## Useful methods

Strings never change in place; every method returns a new string.

```python
s = "  Hello, World  "
assert s.strip() == "Hello, World"                 # trim both ends (lstrip/rstrip for one side)
assert "abc".upper() == "ABC" and "ABC".lower() == "abc"
assert "hello world".title() == "Hello World"
assert "hello".capitalize() == "Hello"
assert "banana".count("an") == 2                    # non-overlapping occurrences
assert "banana".find("na") == 2                     # -1 if absent
assert "banana".index("na") == 2                    # ValueError if absent
assert "banana".replace("a", "o") == "bonono"
assert "a,b,c".split(",") == ["a", "b", "c"]
assert " ".join(["a", "b", "c"]) == "a b c"
assert "Python".startswith("Py") and "Python".endswith("on")
assert "123".isdigit() and "abc".isalpha() and "ab1".isalnum()
```

`"sep".join(list)` is the inverse of `split` and is far faster than adding strings in a loop.

Membership is tested with `in`:

```python
assert "nan" in "banana"
assert "x" not in "banana"
```

## Iterating over a string

```python
vowels = 0
for ch in "programming":
    if ch in "aeiou":
        vowels += 1
assert vowels == 3
```

`ord(ch)` gives the character code and `chr(code)` the reverse, which is handy for shifting letters:

```python
assert ord("a") == 97 and chr(98) == "b"
assert chr(ord("a") + 3) == "d"      # Caesar shift by 3
```

## Escape sequences

A backslash introduces a special character:

| Sequence | Meaning |
|----------|---------|
| `\n` | newline |
| `\t` | tab |
| `\\` | a backslash |
| `\'` `\"` | a quote |

Prefix a string with `r` to disable escapes (`r"C:\new"`), which is useful for paths and regular expressions.

## f-strings and formatting

```python
name, score = "Ana", 9.5
assert f"{name} scored {score}" == "Ana scored 9.5"
assert f"{score:6.2f}" == "  9.50"      # width 6, 2 decimals
assert f"{255:b}" == "11111111"          # binary
assert f"{255:x}" == "ff"               # hexadecimal
assert f"{1234567:,}" == "1,234,567"
assert f"{name!r}" == "'Ana'"
```

> [!TIP]
> Since Python 3.8 you can write `f"{x = }"` to print both the expression and its value while debugging.

## Exercises

1. Read a name and print it reversed.
2. Count the vowels in a line of text (case-insensitive).
3. Given a string, print it with the first and last character swapped.
4. Check whether two words are anagrams (hint: compare `sorted(a)` and `sorted(b)`).
5. Encode a message with a Caesar cipher of shift $k$.
