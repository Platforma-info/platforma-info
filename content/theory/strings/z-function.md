---
title: "Z-function"
section: Fundamentals
order: 3
difficulty: intermediate
summary: "For every position, the length of the longest common prefix with the whole string, in O(n), and its uses in matching and periods."
tags: [z-function, pattern matching, prefix, periods]
prerequisites: [strings/prefix-function]
source:
  title: Z-function and its calculation
  url: https://cp-algorithms.com/string/z-function.html
  license: CC BY-SA 4.0
---

For a string $s$ of length $n$, the **Z-function** $z[i]$ is the length of the longest common prefix of $s$ and the suffix of $s$ starting at $i$. By convention $z[0]$ is $0$ (or $n$).

For `"aaabaab"`:

| $i$ | 0 | 1 | 2 | 3 | 4 | 5 | 6 |
|-----|---|---|---|---|---|---|---|
| $s[i]$ | a | a | a | b | a | a | b |
| $z[i]$ | 0 | 2 | 1 | 0 | 2 | 1 | 0 |

At $i=1$ the suffix is `aabaab`, which shares `aa` with `aaabaab`, hence $z[1] = 2$.

## Computing it in $O(n)$

Naively each $z[i]$ costs $O(n)$. The trick is to keep the rightmost **z-box** $[l, r)$ found so far: a segment where $s[l..r) = s[0..r-l)$. For a new index $i$ inside the box, we already know something:

$$
z[i] \ge \min(r - i,\ z[i - l])
$$

because $s[i..r)$ is a copy of $s[i-l .. r-l)$. Start from that value and extend by direct comparison; then update the box if we extended beyond $r$. Each character comparison that succeeds advances $r$, so the total work is $O(n)$.

```python
def z_function(s):
    n = len(s)
    z = [0] * n
    l = r = 0
    for i in range(1, n):
        if i < r:
            z[i] = min(r - i, z[i - l])
        while i + z[i] < n and s[z[i]] == s[i + z[i]]:
            z[i] += 1
        if i + z[i] > r:
            l, r = i, i + z[i]
    return z

assert z_function("aaabaab") == [0, 2, 1, 0, 2, 1, 0]
assert z_function("abacaba") == [0, 0, 1, 0, 3, 0, 1]
assert z_function("aaaaa") == [0, 4, 3, 2, 1]

import random

def z_naive(s):
    z = [0] * len(s)
    for i in range(1, len(s)):
        while i + z[i] < len(s) and s[z[i]] == s[i + z[i]]:
            z[i] += 1
    return z

random.seed(2)
for _ in range(300):
    t = "".join(random.choice("ab") for _ in range(random.randint(0, 30)))
    assert z_function(t) == z_naive(t)
```

## Applications

### Substring search

To find every occurrence of pattern $t$ in text $s$, compute the Z-function of `t + "\0" + s`; the positions with $z = |t|$ are exactly the matches:

```python
def z_search(s, t):
    m = len(t)
    z = z_function(t + "\0" + s)
    return [i - m - 1 for i in range(m + 1, len(z)) if z[i] >= m]

assert z_search("abracadabra", "abra") == [0, 7]
assert z_search("aaaaa", "aaa") == [0, 1, 2]

def brute(s, t):
    return [i for i in range(len(s) - len(t) + 1) if s[i : i + len(t)] == t]

for _ in range(300):
    text = "".join(random.choice("ab") for _ in range(random.randint(0, 30)))
    pat = "".join(random.choice("ab") for _ in range(random.randint(1, 5)))
    assert z_search(text, pat) == brute(text, pat)
```

### Number of distinct substrings

Adding one character at the end of a string adds new substrings, namely the suffixes that did not occur before. Reversing the string and computing the Z-function tells us that the new suffixes number $k - \max(z)$, where $k$ is the new length. The total is $O(n^2)$, enough for $n$ up to a few thousands:

```python
def distinct_substrings(s):
    total = 0
    t = ""
    for ch in s:
        t = ch + t                      # the reversed prefix: the new character comes first
        z = z_function(t)
        total += len(t) - max(z, default=0)
    return total

assert distinct_substrings("abc") == 6
assert distinct_substrings("aaa") == 3
assert distinct_substrings("abab") == 7
for _ in range(100):
    u = "".join(random.choice("ab") for _ in range(random.randint(0, 12)))
    assert distinct_substrings(u) == len({u[i:j] for i in range(len(u)) for j in range(i + 1, len(u) + 1)})
```

### String compression: the smallest repeating block

Find the smallest $p$ that divides $n$ and satisfies $z[p] = n - p$. Then $s$ is $s[0:p]$ repeated $n/p$ times.

```python
def smallest_block(s):
    n = len(s)
    z = z_function(s)
    for p in range(1, n):
        if n % p == 0 and z[p] == n - p:
            return s[:p]
    return s

assert smallest_block("abcabcabc") == "abc"
assert smallest_block("abcabcab") == "abcabcab"
```

## Z-function and prefix function

They carry the same information and can be converted into one another in $O(n)$. Pick whichever is easier to reason about: the Z-function answers "how much of the prefix matches *starting here*?", while the [prefix function](/theory/strings/prefix-function) answers "how much of the prefix matches *ending here*?".

## Practice problems

- [CSES - Finding Borders](https://cses.fi/problemset/task/1732)
- [eolymp - Blocks of string](https://www.eolymp.com/en/problems/1309)
- [Codeforces - Password [Difficulty: Easy]](http://codeforces.com/problemset/problem/126/B)
- [UVA # 455 "Periodic Strings" [Difficulty: Medium]](http://uva.onlinejudge.org/index.php?option=onlinejudge&page=show_problem&problem=396)
- [UVA # 11022 "String Factoring" [Difficulty: Medium]](http://uva.onlinejudge.org/index.php?option=onlinejudge&page=show_problem&problem=1963)
- [UVa 11475 - Extend to Palindrome](http://uva.onlinejudge.org/index.php?option=com_onlinejudge&Itemid=8&category=24&page=show_problem&problem=2470)
- [LA 6439 - Pasti Pas!](https://icpcarchive.ecs.baylor.edu/index.php?option=com_onlinejudge&Itemid=8&category=588&page=show_problem&problem=4450)
- [Codechef - Chef and Strings](https://www.codechef.com/problems/CHSTR)
- [Codeforces - Prefixes and Suffixes](http://codeforces.com/problemset/problem/432/D)
- [Codeforces - "a" String Problem](https://codeforces.com/problemset/problem/1984/D)
