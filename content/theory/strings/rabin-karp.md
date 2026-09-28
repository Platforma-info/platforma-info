---
title: "Rabin-Karp Pattern Matching"
section: Fundamentals
order: 6
difficulty: intermediate
summary: "Find a pattern (or many patterns of equal length) in a text with a rolling hash, updating the window hash in O(1)."
tags: [rabin-karp, rolling hash, pattern matching, hashing]
prerequisites: [strings/string-hashing]
source:
  title: "Rabin-Karp for String Matching"
  url: https://cp-algorithms.com/string/rabin-karp.html
  license: CC BY-SA 4.0
---

**Rabin-Karp** (1987) finds all occurrences of a pattern $s$ in a text $t$ by comparing **hashes** of length-$|s|$ windows of the text with the hash of the pattern. It is the standard illustration of hashing, and is especially convenient in two situations where KMP-like algorithms are awkward: matching **many patterns** of the same length, and matching **two-dimensional** patterns.

The general theory (polynomial hashes, collisions, choosing the base and modulus) is in [String Hashing](/theory/strings/string-hashing); this article shows the rolling formulation and its typical uses.

## Rolling the window

With the hash $H(x_0 \dots x_{m-1}) = \sum x_i\, B^{m-1-i} \bmod M$, moving the window one character to the right removes the leading character and appends a new one:

$$
H_{i+1} = \big(H_i - t_i\, B^{m-1}\big)\, B + t_{i+m} \pmod M
$$

so the whole text is scanned in $O(|t|)$ after $O(|s|)$ preparation. Whenever the window hash equals the pattern hash we have a candidate match; to be **certain**, compare the actual substrings (a "verified" match, which keeps the algorithm correct at the cost of an occasional $O(m)$ check) or accept the tiny collision probability of a 61-bit modulus.

```python
import random

MOD = (1 << 61) - 1

def rabin_karp(pattern, text, verify=True):
    """Start positions of all occurrences of `pattern` in `text`."""
    m, n = len(pattern), len(text)
    if m == 0:
        return list(range(n + 1))
    if m > n:
        return []
    base = random.randrange(256, MOD - 1)
    top = pow(base, m - 1, MOD)                         # weight of the leading character
    target = window = 0
    for i in range(m):
        target = (target * base + ord(pattern[i])) % MOD
        window = (window * base + ord(text[i])) % MOD
    found = []
    for i in range(n - m + 1):
        if window == target and (not verify or text[i:i + m] == pattern):
            found.append(i)
        if i + m < n:
            window = ((window - ord(text[i]) * top) * base + ord(text[i + m])) % MOD
    return found

assert rabin_karp("abra", "abracadabra") == [0, 7]
assert rabin_karp("aa", "aaaa") == [0, 1, 2]
assert rabin_karp("abc", "ab") == [] and rabin_karp("", "abc") == [0, 1, 2, 3]

def naive(pattern, text):
    return [i for i in range(len(text) - len(pattern) + 1) if text.startswith(pattern, i)]

random.seed(1)
for _ in range(1000):
    text = "".join(random.choice("ab") for _ in range(random.randint(0, 40)))
    pattern = "".join(random.choice("ab") for _ in range(random.randint(0, 5)))
    assert rabin_karp(pattern, text) == naive(pattern, text)
    assert rabin_karp(pattern, text, verify=False) == naive(pattern, text)      # a 61-bit modulus: no collisions here
```

The window hash is kept in $[0, M)$ by the final `% MOD`; Python's `%` always returns a non-negative result, so there is no need for the `+ M` correction found in C++.

> [!PYTHON]
> For a single pattern, `str.find` (or `re`) is faster than Rabin-Karp in Python: it runs in C. Use Rabin-Karp for the situations below, or when the "characters" are not simple characters.

## Many patterns of the same length

Put the hashes of all patterns into a set, roll the window over the text, and look up each window hash: $O(|t| + \sum |s_i|)$ for $k$ patterns of equal length, versus $O(k|t|)$ for running a single-pattern search $k$ times.

```python
def match_many(patterns, text):
    """Occurrences of any pattern; all patterns must have the same length m. Returns (position, pattern)."""
    m = len(patterns[0])
    assert all(len(p) == m for p in patterns)
    if m > len(text):
        return []
    base = random.randrange(256, MOD - 1)
    top = pow(base, m - 1, MOD)

    def hash_of(x):
        h = 0
        for ch in x:
            h = (h * base + ord(ch)) % MOD
        return h

    table = {}
    for p in patterns:
        table.setdefault(hash_of(p), set()).add(p)
    window = hash_of(text[:m])
    found = []
    for i in range(len(text) - m + 1):
        for p in table.get(window, ()):
            if text[i:i + m] == p:
                found.append((i, p))
        if i + m < len(text):
            window = ((window - ord(text[i]) * top) * base + ord(text[i + m])) % MOD
    return found

assert match_many(["cat", "dog", "cow"], "the cat and the dog and the cow") == [(4, "cat"), (16, "dog"), (28, "cow")]
for _ in range(300):
    text = "".join(random.choice("abc") for _ in range(random.randint(0, 40)))
    pats = list({"".join(random.choice("abc") for _ in range(3)) for _ in range(random.randint(1, 5))})
    expected = sorted((i, p) for p in pats for i in range(len(text) - 2) if text.startswith(p, i))
    assert sorted(match_many(pats, text)) == expected
```

This is how plagiarism detectors work: hash every window of length $k$ ("shingles") of two documents and compare the sets.

## Longest duplicated substring

The length of the longest repeated substring can be found by **binary search on the length**: a repeat of length $\ell$ exists whenever one of length $\ell + 1$ does. For each candidate length roll the hash over the text and look for equal hashes (verify to be safe):

```python
def longest_duplicate(text):
    n = len(text)
    base = random.randrange(256, MOD - 1)

    def find(length):
        top = pow(base, length - 1, MOD)
        window = 0
        for ch in text[:length]:
            window = (window * base + ord(ch)) % MOD
        seen = {window: [0]}
        for i in range(1, n - length + 1):
            window = ((window - ord(text[i - 1]) * top) * base + ord(text[i + length - 1])) % MOD
            for j in seen.get(window, ()):
                if text[j:j + length] == text[i:i + length]:
                    return i
            seen.setdefault(window, []).append(i)
        return -1

    lo, hi, best = 1, n - 1, ""
    while lo <= hi:
        mid = (lo + hi) // 2
        pos = find(mid)
        if pos != -1:
            best = text[pos:pos + mid]
            lo = mid + 1
        else:
            hi = mid - 1
    return best

assert longest_duplicate("banana") == "ana"
assert longest_duplicate("abcd") == ""
for _ in range(200):
    s = "".join(random.choice("ab") for _ in range(random.randint(1, 25)))
    expected = max((len(s[i:j]) for i in range(len(s)) for j in range(i + 1, len(s) + 1)
                    if s.count(s[i:j]) >= 2 or s.find(s[i:j], i + 1) != -1), default=0)
    assert len(longest_duplicate(s)) == expected
```

## Two-dimensional pattern matching

Extend the idea to grids: hash each row-window of the text, then roll a second hash down the columns. The pattern (a small picture) is found in a big image in $O(\text{area})$.

## Summary

| | Rabin-Karp |
|---|---|
| time | $O(|t| + |s|)$ expected |
| worst case | $O(|t||s|)$ if many collisions are verified (avoid with a strong hash) |
| strengths | many patterns, 2D, binary search on length, streaming |
| weakness | probabilistic unless every hit is verified |

## Practice problems

- [SPOJ - Pattern Find](http://www.spoj.com/problems/NAJPF/)
- [Codeforces - Good Substrings](http://codeforces.com/problemset/problem/271/D)
- [Codeforces - Palindromic characteristics](https://codeforces.com/problemset/problem/835/D)
- [Leetcode - Longest Duplicate Substring](https://leetcode.com/problems/longest-duplicate-substring/)
