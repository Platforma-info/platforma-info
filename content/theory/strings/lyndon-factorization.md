---
title: "Lyndon Factorization"
section: Advanced
order: 3
difficulty: advanced
summary: "Split a string uniquely into non-increasing Lyndon words in O(n) with Duval's algorithm, and use it to find the minimal cyclic shift."
tags: [lyndon words, duval, cyclic shift, lexicographic order]
prerequisites: [python-basics/strings]
source:
  title: "Lyndon factorization"
  url: https://cp-algorithms.com/string/lyndon_factorization.html
  license: CC BY-SA 4.0
---

A string is a **Lyndon word** if it is strictly smaller (lexicographically) than every one of its proper suffixes. Equivalently, it is strictly smaller than all its non-trivial rotations. Examples: `a`, `ab`, `aab`, `abb`, `aabab`. Not Lyndon: `aa` and `ba` (each is larger than its suffix `a`) and `abab` (equal to its rotation by two).

**Lyndon's theorem:** every string $s$ can be written **uniquely** as a concatenation

$$
s = w_1 w_2 \cdots w_k \qquad\text{with } w_1 \ge w_2 \ge \dots \ge w_k
$$

where each $w_i$ is a Lyndon word. This is the **Lyndon factorization**. For instance `abab` factors as `ab`, `ab`; `cbaab` factors as `c`, `b`, `aab`.

## Duval's algorithm

Duval's algorithm computes the factorization in $O(n)$ time and $O(1)$ extra memory. It keeps a *pre-Lyndon* prefix: a string of the form $w^m \bar w$, that is, several copies of a Lyndon word $w$ followed by a proper prefix $\bar w$ of it. Three pointers walk the string:

- `i`: the start of the part not yet output;
- `k`: the position in the current word that the character `j` is compared against;
- `j`: the next character to consume.

Compare `s[k]` with `s[j]`:

- `s[k] < s[j]`: the whole segment `s[i..j]` becomes one longer Lyndon word; restart the comparison from the beginning (`k = i`);
- `s[k] == s[j]`: the pattern repeats; advance both (`k += 1`);
- `s[k] > s[j]`: the current pre-Lyndon prefix cannot be extended. Output as many copies of the word of length `j - k` as fit before `k`, and continue after them.

```python
def duval(s):
    """Lyndon factorization of s as a list of words."""
    n = len(s)
    i = 0
    words = []
    while i < n:
        j, k = i + 1, i
        while j < n and s[k] <= s[j]:
            k = i if s[k] < s[j] else k + 1
            j += 1
        period = j - k
        while i <= k:
            words.append(s[i:i + period])
            i += period
    return words

assert duval("abab") == ["ab", "ab"]
assert duval("cbaab") == ["c", "b", "aab"]
assert duval("aabab") == ["aabab"]
assert duval("banana") == ["b", "an", "an", "a"]
assert duval("") == []
```

Each iteration of the outer loop outputs at least one word, and the inner loops advance `j` and `i` monotonically (`j` may re-scan at most the length of the emitted words), so the total work is $O(n)$.

## Testing against the definition

Check on random strings that every factor is a Lyndon word, the factors are non-increasing, and they concatenate to $s$:

```python
import random

def is_lyndon(w):
    return len(w) > 0 and all(w < w[i:] for i in range(1, len(w)))

random.seed(1)
for _ in range(1000):
    s = "".join(random.choice("abc") for _ in range(random.randint(0, 25)))
    factors = duval(s)
    assert "".join(factors) == s
    assert all(is_lyndon(w) for w in factors)
    assert all(factors[i] >= factors[i + 1] for i in range(len(factors) - 1))

assert [is_lyndon(w) for w in ("a", "ab", "aab", "abb", "aabab", "aa", "ba", "abab")] == [True, True, True, True, True, False, False, False]
```

## Application: minimal cyclic shift

The lexicographically smallest rotation of $s$ starts at the beginning of the last Lyndon factor of $s + s$ that begins in the first half. Run Duval on the doubled string, and stop at the first factor that starts at or beyond position $n$; the previous factor start is the answer.

```python
def min_cyclic_shift(s):
    n = len(s)
    if n == 0:
        return ""
    t = s + s
    i, answer = 0, 0
    while i < n:
        answer = i
        j, k = i + 1, i
        while j < 2 * n and t[k] <= t[j]:
            k = i if t[k] < t[j] else k + 1
            j += 1
        while i <= k:
            i += j - k
    return t[answer:answer + n]

assert min_cyclic_shift("bca") == "abc"
assert min_cyclic_shift("abab") == "abab"
assert min_cyclic_shift("dcba") == "adcb"
for _ in range(1000):
    s = "".join(random.choice("abc") for _ in range(random.randint(1, 20)))
    assert min_cyclic_shift(s) == min(s[i:] + s[:i] for i in range(len(s)))
```

This gives a canonical form for necklaces (circular strings): two strings are rotations of each other exactly when their minimal cyclic shifts are equal.

```python
def same_necklace(a, b):
    return len(a) == len(b) and min_cyclic_shift(a) == min_cyclic_shift(b)

assert same_necklace("abcab", "cabab") and not same_necklace("abcab", "abcba")
```

## Other uses

- **Minimal suffix** of a string, and the lexicographically minimal string obtainable by certain operations: the last Lyndon factor is the smallest suffix.
- **Burrows-Wheeler transform**: bijective variants use the Lyndon factorization; the transform underlies compressors like `bzip2`.
- **Enumerating necklaces** and **de Bruijn sequences**: generating all Lyndon words of length dividing $n$ in lexicographic order and concatenating them yields the de Bruijn sequence.

```python
def de_bruijn(k, n):
    """De Bruijn sequence over the alphabet {0..k-1} for words of length n (FKM algorithm)."""
    a = [0] * (k * n)
    sequence = []

    def db(t, p):
        if t > n:
            if n % p == 0:
                sequence.extend(a[1:p + 1])
        else:
            a[t] = a[t - p]
            db(t + 1, p)
            for j in range(a[t - p] + 1, k):
                a[t] = j
                db(t + 1, t)

    db(1, 1)
    return sequence

seq = de_bruijn(2, 3)
assert len(seq) == 8
cyc = seq + seq[:2]
assert len({tuple(cyc[i:i + 3]) for i in range(8)}) == 8
```

## Practice problems

- [UVA #719 - Glass Beads](https://uva.onlinejudge.org/index.php?option=onlinejudge&page=show_problem&problem=660)
