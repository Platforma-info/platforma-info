---
title: "Prefix Function and Knuth-Morris-Pratt"
section: Fundamentals
order: 2
difficulty: intermediate
summary: "Compute the longest proper border of every prefix in O(n), and use it for pattern matching, string periods and counting occurrences."
tags: [prefix function, kmp, borders, pattern matching]
prerequisites: [python-basics/strings]
source:
  title: Prefix function - Knuth-Morris-Pratt
  url: https://cp-algorithms.com/string/prefix-function.html
  license: CC BY-SA 4.0
---

For a string $s$ of length $n$, the **prefix function** $\pi[i]$ is the length of the longest **proper** prefix of $s[0..i]$ that is also a **suffix** of $s[0..i]$. "Proper" means it is not the whole substring itself. Prefix-suffix pairs like this are called *borders*.

For `"abcabcd"`:

| $i$ | 0 | 1 | 2 | 3 | 4 | 5 | 6 |
|-----|---|---|---|---|---|---|---|
| $s[i]$ | a | b | c | a | b | c | d |
| $\pi[i]$ | 0 | 0 | 0 | 1 | 2 | 3 | 0 |

For instance $\pi[5] = 3$ because `"abc"` is both a prefix and a suffix of `"abcabc"`.

## Computing it in $O(n)$

Compute $\pi[i]$ from $\pi[i-1]$. Let $k = \pi[i-1]$ be the length of the current border. If $s[k] = s[i]$, the border extends: $\pi[i] = k + 1$. If not, we fall back to the next shorter border, which is $\pi[k-1]$, and try again, until $k = 0$.

The total number of fall-backs is bounded by the total number of extensions (each fall-back strictly decreases $k$, and $k$ grows by at most 1 per step), so the algorithm is linear.

```python
def prefix_function(s):
    n = len(s)
    pi = [0] * n
    for i in range(1, n):
        k = pi[i - 1]
        while k > 0 and s[i] != s[k]:
            k = pi[k - 1]
        if s[i] == s[k]:
            k += 1
        pi[i] = k
    return pi

assert prefix_function("abcabcd") == [0, 0, 0, 1, 2, 3, 0]
assert prefix_function("aabaaab") == [0, 1, 0, 1, 2, 2, 3]
assert prefix_function("aaaa") == [0, 1, 2, 3]
assert prefix_function("") == []

def prefix_function_naive(s):
    return [
        max((k for k in range(i + 1) if s[:k] == s[i + 1 - k : i + 1]), default=0)
        for i in range(len(s))
    ]

import random
random.seed(1)
for _ in range(300):
    t = "".join(random.choice("ab") for _ in range(random.randint(0, 25)))
    assert prefix_function(t) == prefix_function_naive(t)
```

## Pattern matching (KMP)

To find pattern $t$ in text $s$, compute the prefix function of `t + "#" + s`, where `#` is a separator that occurs in neither string. Every position $i$ with $\pi[i] = |t|$ marks an occurrence that ends at $i$ inside the combined string.

```python
def kmp_search(s, t):
    """Start positions of every occurrence of t in s, in O(|s| + |t|)."""
    if not t:
        return list(range(len(s) + 1))
    pi = prefix_function(t + "\0" + s)                 # "\0" is assumed not to occur
    m = len(t)
    return [i - 2 * m for i in range(2 * m, len(pi)) if pi[i] == m]

assert kmp_search("abracadabra", "abra") == [0, 7]
assert kmp_search("aaaaa", "aa") == [0, 1, 2, 3]
assert kmp_search("hello", "xyz") == []

def naive_find(s, t):
    return [i for i in range(len(s) - len(t) + 1) if s[i : i + len(t)] == t]

for _ in range(300):
    text = "".join(random.choice("ab") for _ in range(random.randint(0, 30)))
    pat = "".join(random.choice("ab") for _ in range(random.randint(1, 5)))
    assert kmp_search(text, pat) == naive_find(text, pat)
```

Only $O(|t|)$ extra memory is really needed if you process the text online instead of building the concatenation, which is helpful for streams.

> [!PYTHON]
> `str.find` is faster for plain strings. KMP is useful when the "characters" are arbitrary values (lists of numbers), when matching on-line, or when the prefix function itself is the objective, as in the applications below.

## Applications

### Smallest period of a string

The string $s$ has a period $p$ if $s[i] = s[i+p]$ for all valid $i$. The smallest period is $n - \pi[n-1]$. It **divides** the length exactly when the string is a repetition of a shorter block:

```python
def shortest_repeating_block(s):
    n = len(s)
    if n == 0:
        return ""
    p = n - prefix_function(s)[-1]
    return s[:p] if n % p == 0 else s

assert shortest_repeating_block("abcabcabc") == "abc"
assert shortest_repeating_block("abcabca") == "abcabca"     # period 3 but does not divide 7
assert shortest_repeating_block("aaaa") == "a"
assert shortest_repeating_block("abab") == "ab"
```

### Number of occurrences of each prefix

Every prefix of length $\pi[i]$ ending at $i$ is also a suffix, which tells us how often each prefix occurs as a substring. Count the values of $\pi$, then push the counts down the chain of borders (a border of length $k$ implies a border of length $\pi[k-1]$):

```python
def prefix_occurrences(s):
    """occ[k] = number of occurrences of the prefix of length k in s (k = 1..n)."""
    n = len(s)
    pi = prefix_function(s)
    occ = [0] * (n + 1)
    for v in pi:
        occ[v] += 1
    for k in range(n - 1, 0, -1):
        occ[pi[k - 1]] += occ[k]
    return [c + 1 for c in occ[1:]]                    # +1: the prefix itself

assert prefix_occurrences("abab") == [2, 2, 1, 1]      # a x2, ab x2, aba x1, abab x1
for _ in range(100):
    t = "".join(random.choice("ab") for _ in range(random.randint(1, 15)))
    expected = [sum(t[i : i + k] == t[:k] for i in range(len(t) - k + 1)) for k in range(1, len(t) + 1)]
    assert prefix_occurrences(t) == expected
```

### All borders of a string

Following $\pi[n-1] \to \pi[\pi[n-1]-1] \to \cdots$ enumerates every border, longest first:

```python
def all_borders(s):
    pi = prefix_function(s)
    out, k = [], pi[-1] if pi else 0
    while k > 0:
        out.append(k)
        k = pi[k - 1]
    return out

assert all_borders("abacaba") == [3, 1]                # "aba" and "a"
assert all_borders("abc") == []
```

## Related

The [Z-function](/theory/strings/z-function) is a close cousin with the same applications, and either can be converted into the other in $O(n)$.

## Practice problems

- [UVA # 455 "Periodic Strings"](http://uva.onlinejudge.org/index.php?option=onlinejudge&page=show_problem&problem=396)
- [UVA # 11022 "String Factoring"](http://uva.onlinejudge.org/index.php?option=onlinejudge&page=show_problem&problem=1963)
- [UVA # 11452 "Dancing the Cheeky-Cheeky"](http://uva.onlinejudge.org/index.php?option=onlinejudge&page=show_problem&problem=2447)
- [UVA 12604 - Caesar Cipher](https://uva.onlinejudge.org/index.php?option=com_onlinejudge&Itemid=8&page=show_problem&problem=4282)
- [UVA 12467 - Secret Word](https://uva.onlinejudge.org/index.php?option=com_onlinejudge&Itemid=8&page=show_problem&problem=3911)
- [UVA 11019 - Matrix Matcher](https://uva.onlinejudge.org/index.php?option=onlinejudge&page=show_problem&problem=1960)
- [SPOJ - Pattern Find](http://www.spoj.com/problems/NAJPF/)
- [SPOJ - A Needle in the Haystack](https://www.spoj.com/problems/NHAY/)
- [Codeforces - Anthem of Berland](http://codeforces.com/contest/808/problem/G)
- [Codeforces - MUH and Cube Walls](http://codeforces.com/problemset/problem/471/D)
- [Codeforces - Prefixes and Suffixes](https://codeforces.com/contest/432/problem/D)
