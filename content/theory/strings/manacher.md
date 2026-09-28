---
title: "Manacher's Algorithm: All Palindromic Substrings"
section: Tasks
order: 1
difficulty: advanced
summary: Find the longest palindrome centered at every position, and hence count all palindromic substrings, in O(n).
tags: [palindromes, manacher, strings]
prerequisites: [strings/z-function]
source:
  title: "Manacher's Algorithm - Finding all sub-palindromes in O(N)"
  url: https://cp-algorithms.com/string/manacher.html
  license: CC BY-SA 4.0
---

A **palindrome** reads the same forwards and backwards. Given a string $s$ we want, for every center, the longest palindrome around it. Odd-length palindromes have a character as center; even-length palindromes have a gap between two characters as center.

- $d_1[i]$: number of palindromes of **odd** length centered at $i$ (equivalently the radius including the center). For `"aba"`, $d_1[1] = 2$ (`"b"` and `"aba"`).
- $d_2[i]$: number of palindromes of **even** length whose right center is $i$. For `"abba"`, $d_2[2] = 2$ (`"bb"` and `"abba"`).

From these arrays you get the longest palindromic substring, and the number of palindromic substrings is $\sum d_1[i] + \sum d_2[i]$.

## A quadratic starting point

Expand around each center:

```python
def manacher_naive(s):
    n = len(s)
    d1, d2 = [0] * n, [0] * n
    for i in range(n):
        k = 1
        while i - k >= 0 and i + k < n and s[i - k] == s[i + k]:
            k += 1
        d1[i] = k
        k = 0
        while i - k - 1 >= 0 and i + k < n and s[i - k - 1] == s[i + k]:
            k += 1
        d2[i] = k
    return d1, d2

assert manacher_naive("abba") == ([1, 1, 1, 1], [0, 0, 2, 0])
assert manacher_naive("aba")[0] == [1, 2, 1]
```

This is $O(n^2)$ for `"aaaa...a"`. Manacher's algorithm reuses the symmetry of palindromes to avoid recomparing.

## Manacher's algorithm

Keep the palindrome $[l, r]$ that reaches farthest to the right. For a new center $i$ inside it, the mirror position $j = l + r - i$ has an already computed radius, and the palindrome at $i$ is at least as large as the mirror's, capped at the boundary $r$ (a palindrome centered at $i$ can be assumed to reach only as far as we have verified). Then try to extend by direct comparison. Since $r$ only moves right, the total is linear.

```python
def manacher(s):
    n = len(s)
    d1 = [0] * n
    l, r = 0, -1
    for i in range(n):
        k = 1 if i > r else min(d1[l + r - i], r - i + 1)
        while i - k >= 0 and i + k < n and s[i - k] == s[i + k]:
            k += 1
        d1[i] = k
        if i + k - 1 > r:
            l, r = i - k + 1, i + k - 1

    d2 = [0] * n
    l, r = 0, -1
    for i in range(n):
        k = 0 if i > r else min(d2[l + r - i + 1], r - i + 1)
        while i - k - 1 >= 0 and i + k < n and s[i - k - 1] == s[i + k]:
            k += 1
        d2[i] = k
        if i + k - 1 > r:
            l, r = i - k, i + k - 1
    return d1, d2

assert manacher("abba") == ([1, 1, 1, 1], [0, 0, 2, 0])
assert manacher("abacaba")[0] == [1, 2, 1, 4, 1, 2, 1]
assert manacher("") == ([], [])

import random
random.seed(3)
for _ in range(500):
    t = "".join(random.choice("ab") for _ in range(random.randint(0, 30)))
    assert manacher(t) == manacher_naive(t)
d1_big, _ = manacher("a" * 100_000)                 # linear time: instant, the naive version would not be
assert max(d1_big) == 50_000 and d1_big[0] == 1
```

## Applications

### Count palindromic substrings

```python
def count_palindromes(s):
    d1, d2 = manacher(s)
    return sum(d1) + sum(d2)

assert count_palindromes("aaa") == 6              # a a a aa aa aaa
assert count_palindromes("abc") == 3
assert count_palindromes("abba") == 6             # a b b a bb abba

def brute_count(s):
    return sum(s[i:j] == s[i:j][::-1] for i in range(len(s)) for j in range(i + 1, len(s) + 1))

for _ in range(200):
    t = "".join(random.choice("ab") for _ in range(random.randint(0, 20)))
    assert count_palindromes(t) == brute_count(t)
```

### Longest palindromic substring

The longest odd palindrome has length $2 d_1[i] - 1$; the longest even one has length $2 d_2[i]$.

```python
def longest_palindrome(s):
    if not s:
        return ""
    d1, d2 = manacher(s)
    best_len, best_start = 0, 0
    for i in range(len(s)):
        odd = 2 * d1[i] - 1
        if odd > best_len:
            best_len, best_start = odd, i - d1[i] + 1
        even = 2 * d2[i]
        if even > best_len:
            best_len, best_start = even, i - d2[i]
    return s[best_start : best_start + best_len]

assert longest_palindrome("babad") in ("bab", "aba")
assert longest_palindrome("cbbd") == "bb"
assert longest_palindrome("forgeeksskeegfor") == "geeksskeeg"
for _ in range(200):
    t = "".join(random.choice("abc") for _ in range(random.randint(1, 20)))
    r = longest_palindrome(t)
    assert r == r[::-1] and r in t
    assert len(r) == max(len(t[i:j]) for i in range(len(t)) for j in range(i + 1, len(t) + 1) if t[i:j] == t[i:j][::-1])
```

### Is a substring a palindrome? In $O(1)$

After Manacher, a substring $s[l..r]$ is a palindrome exactly when the palindrome radius at its center is large enough.

```python
def palindrome_checker(s):
    d1, d2 = manacher(s)

    def is_pal(l, r):                 # inclusive indices
        length = r - l + 1
        if length % 2:
            return d1[(l + r) // 2] >= (length + 1) // 2
        return d2[(l + r + 1) // 2] >= length // 2
    return is_pal

t = "abacabadxyx"
is_pal = palindrome_checker(t)
assert is_pal(0, 6) and not is_pal(0, 7) and is_pal(8, 10)
assert all(is_pal(i, j) == (t[i : j + 1] == t[i : j + 1][::-1]) for i in range(len(t)) for j in range(i, len(t)))
```

## Practice problems

- [Library Checker - Enumerate Palindromes](https://judge.yosupo.jp/problem/enumerate_palindromes)
- [Longest Palindrome](https://cses.fi/problemset/task/1111)
- [UVA 11475 - Extend to Palindrome](https://onlinejudge.org/index.php?option=com_onlinejudge&Itemid=8&category=26&page=show_problem&problem=2470)
- [GYM - (Q) QueryreuQ](https://codeforces.com/gym/101806/problem/Q)
- [CF - Prefix-Suffix Palindrome](https://codeforces.com/contest/1326/problem/D2)
- [SPOJ - Number of Palindromes](https://www.spoj.com/problems/NUMOFPAL/)
- [Kattis - Palindromes](https://open.kattis.com/problems/palindromes)
