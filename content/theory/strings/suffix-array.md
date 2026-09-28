---
title: "Suffix Array"
section: Fundamentals
order: 4
difficulty: advanced
summary: "Sort all suffixes of a string, build the array in O(n log n) by prefix doubling, compute LCP with Kasai's algorithm, and use both for substring search and counting distinct substrings."
tags: [suffix array, lcp, kasai, prefix doubling, substrings]
prerequisites: [strings/z-function, python-basics/strings]
source:
  title: "Suffix Array"
  url: https://cp-algorithms.com/string/suffix-array.html
  license: CC BY-SA 4.0
---

The **suffix array** of a string $s$ of length $n$ is the list of the starting positions of all its suffixes, sorted in lexicographic order. For `banana`:

| position | suffix |
|----------|--------|
| 5 | `a` |
| 3 | `ana` |
| 1 | `anana` |
| 0 | `banana` |
| 4 | `na` |
| 2 | `nana` |

so the suffix array is `[5, 3, 1, 0, 4, 2]`. It is a compact, cache-friendly replacement for the [suffix tree](/theory/strings/suffix-tree): every question about substrings becomes a question about a *range* of sorted suffixes.

## Naive construction

Sort the suffixes directly. Comparing two suffixes costs $O(n)$, so this is $O(n^2 \log n)$, but for short strings it is a perfectly good reference implementation.

```python
def suffix_array_naive(s):
    return sorted(range(len(s)), key=lambda i: s[i:])

assert suffix_array_naive("banana") == [5, 3, 1, 0, 4, 2]
assert suffix_array_naive("") == []
assert suffix_array_naive("aaaa") == [3, 2, 1, 0]
```

## Prefix doubling: $O(n \log^2 n)$

Sort the suffixes by their first $2^k$ characters, for $k = 0, 1, 2, \dots$ Each step uses the previous one: the first $2^{k+1}$ characters of suffix $i$ are the pair *(rank of the first $2^k$ characters of suffix $i$, rank of the first $2^k$ characters of suffix $i + 2^k$)*. After $\lceil \log_2 n \rceil$ rounds all ranks are distinct and the order is the suffix array.

```python
def suffix_array(s):
    n = len(s)
    if n == 0:
        return []
    rank = [ord(c) for c in s]
    sa = list(range(n))
    k = 1
    while True:
        def key(i):
            return (rank[i], rank[i + k] if i + k < n else -1)
        sa.sort(key=key)
        new_rank = [0] * n
        for idx in range(1, n):
            new_rank[sa[idx]] = new_rank[sa[idx - 1]] + (key(sa[idx]) != key(sa[idx - 1]))
        rank = new_rank
        if rank[sa[-1]] == n - 1:            # all ranks distinct
            return sa
        k *= 2

import random
random.seed(1)
for _ in range(500):
    s = "".join(random.choice("abc") for _ in range(random.randint(0, 40)))
    assert suffix_array(s) == suffix_array_naive(s)
```

Each round sorts with Python's `sort` in $O(n\log n)$, so the total is $O(n \log^2 n)$. That handles $n \approx 10^5$ within a few seconds. Replacing the comparison sort by two **counting sorts** (radix sort on the pair) gives the classical $O(n \log n)$; here is that version, working on *cyclic shifts* of $s$ + a sentinel smaller than every character:

```python
def suffix_array_radix(s):
    """O(n log n) via counting sort on cyclic shifts of s + sentinel."""
    s = s + "\0"
    n = len(s)
    alphabet = 256
    count = [0] * max(alphabet, n)
    p = [0] * n
    c = [0] * n
    for ch in s:
        count[ord(ch)] += 1
    for i in range(1, alphabet):
        count[i] += count[i - 1]
    for i in range(n - 1, -1, -1):
        count[ord(s[i])] -= 1
        p[count[ord(s[i])]] = i
    c[p[0]] = 0
    classes = 1
    for i in range(1, n):
        if s[p[i]] != s[p[i - 1]]:
            classes += 1
        c[p[i]] = classes - 1
    h = 0
    while (1 << h) < n:
        pn = [(p[i] - (1 << h)) % n for i in range(n)]      # sort by the second half first (it is p shifted)
        count = [0] * classes
        for i in range(n):
            count[c[pn[i]]] += 1
        for i in range(1, classes):
            count[i] += count[i - 1]
        for i in range(n - 1, -1, -1):
            count[c[pn[i]]] -= 1
            p[count[c[pn[i]]]] = pn[i]
        cn = [0] * n
        classes = 1
        for i in range(1, n):
            cur = (c[p[i]], c[(p[i] + (1 << h)) % n])
            prev = (c[p[i - 1]], c[(p[i - 1] + (1 << h)) % n])
            if cur != prev:
                classes += 1
            cn[p[i]] = classes - 1
        c = cn
        h += 1
    return p[1:]                                             # drop the sentinel suffix

for _ in range(300):
    s = "".join(random.choice("abc") for _ in range(random.randint(0, 40)))
    assert suffix_array_radix(s) == suffix_array_naive(s)
```

> [!PYTHON]
> Because `list.sort` is implemented in C, the simple doubling version is usually *faster* in Python than the hand-written counting-sort loops, despite the extra $\log$. Use `suffix_array` above unless $n$ is huge.

## LCP array (Kasai's algorithm)

The **longest common prefix** array stores, for consecutive suffixes in sorted order, the length of their common prefix: `lcp[i]` is $\text{lcp}(\text{suffix}_{sa[i]}, \text{suffix}_{sa[i+1]})$. Kasai computes it in $O(n)$ using one observation: if suffix $i$ shares $h$ characters with its predecessor in sorted order, then suffix $i+1$ shares at least $h - 1$ with *its* predecessor. So process the suffixes in text order and let $h$ decrease by at most one per step:

```python
def lcp_array(s, sa):
    n = len(s)
    rank = [0] * n
    for i, p in enumerate(sa):
        rank[p] = i
    lcp = [0] * max(0, n - 1)
    h = 0
    for i in range(n):
        if rank[i] == n - 1:
            h = 0
            continue
        j = sa[rank[i] + 1]                       # the next suffix in sorted order
        while i + h < n and j + h < n and s[i + h] == s[j + h]:
            h += 1
        lcp[rank[i]] = h
        if h:
            h -= 1
    return lcp

s = "banana"
sa = suffix_array(s)
assert lcp_array(s, sa) == [1, 3, 0, 0, 2]              # a|ana=1, ana|anana=3, anana|banana=0, banana|na=0, na|nana=2

def lcp_naive(s, sa):
    def common(a, b):
        k = 0
        while k < min(len(a), len(b)) and a[k] == b[k]:
            k += 1
        return k
    return [common(s[sa[i]:], s[sa[i + 1]:]) for i in range(len(sa) - 1)]

for _ in range(300):
    t = "".join(random.choice("ab") for _ in range(random.randint(1, 40)))
    sa_t = suffix_array(t)
    assert lcp_array(t, sa_t) == lcp_naive(t, sa_t)
```

The LCP of two *arbitrary* suffixes is the minimum of `lcp` over the range between their ranks, answered in $O(1)$ with a [sparse table](/theory/data-structures/sparse-table).

## Applications

### Substring search

All suffixes that start with a pattern $p$ form a contiguous block in the suffix array. Two binary searches find its boundaries in $O(|p| \log n)$; the block size is the number of occurrences.

```python
def find_occurrences(s, sa, pattern):
    lo, hi = 0, len(sa)
    while lo < hi:                                # first suffix >= pattern
        mid = (lo + hi) // 2
        if s[sa[mid]:sa[mid] + len(pattern)] < pattern:
            lo = mid + 1
        else:
            hi = mid
    start = lo
    hi = len(sa)
    while lo < hi:                                # first suffix whose prefix is > pattern
        mid = (lo + hi) // 2
        if s[sa[mid]:sa[mid] + len(pattern)] <= pattern:
            lo = mid + 1
        else:
            hi = mid
    return sorted(sa[start:lo])

text = "abracadabra"
sa_text = suffix_array(text)
assert find_occurrences(text, sa_text, "abra") == [0, 7]
assert find_occurrences(text, sa_text, "a") == [0, 3, 5, 7, 10]
assert find_occurrences(text, sa_text, "xyz") == []
```

### Number of distinct substrings

Every substring is a prefix of some suffix. Going through the suffixes in sorted order, suffix `sa[i]` contributes $n - sa[i]$ prefixes, of which the first `lcp[i-1]` were already counted with the previous suffix:

$$
\text{distinct} = \frac{n(n+1)}{2} - \sum_i \text{lcp}[i]
$$

```python
def distinct_substrings(s):
    sa = suffix_array(s)
    n = len(s)
    return n * (n + 1) // 2 - sum(lcp_array(s, sa))

assert distinct_substrings("banana") == 15
assert distinct_substrings("aaaa") == 4
for _ in range(300):
    t = "".join(random.choice("ab") for _ in range(random.randint(0, 30)))
    assert distinct_substrings(t) == len({t[i:j] for i in range(len(t)) for j in range(i + 1, len(t) + 1)})
```

### Longest repeated substring

It is the maximum value in the LCP array:

```python
def longest_repeated_substring(s):
    sa = suffix_array(s)
    lcp = lcp_array(s, sa)
    if not lcp or max(lcp) == 0:
        return ""
    i = max(range(len(lcp)), key=lcp.__getitem__)
    return s[sa[i]:sa[i] + lcp[i]]

assert longest_repeated_substring("banana") == "ana"
assert longest_repeated_substring("abcd") == ""
```

### Longest common substring of two strings

Concatenate $a + \# + b$ with a separator that occurs in neither, build the suffix array and LCP, and look for the largest `lcp[i]` between two suffixes that start in different strings:

```python
def longest_common_substring(a, b):
    s = a + "\x01" + b
    sa = suffix_array(s)
    lcp = lcp_array(s, sa)
    boundary = len(a)
    best, where = 0, 0
    for i in range(len(sa) - 1):
        x, y = sa[i], sa[i + 1]
        if (x < boundary) != (y < boundary) and lcp[i] > best:
            best, where = lcp[i], x
    return s[where:where + best]

assert longest_common_substring("xabcdz", "yabcdw") == "abcd"
assert longest_common_substring("abc", "xyz") == ""
```

The LCP between suffixes from different strings can never cross the separator, so it is bounded by the true common substring length.

## Summary

| Task | Cost with a suffix array |
|------|--------------------------|
| build | $O(n \log n)$ (or $O(n\log^2 n)$ with `sort`) |
| LCP array | $O(n)$ |
| find a pattern | $O(|p| \log n)$ |
| number of distinct substrings | $O(n)$ after the LCP |
| longest repeated / common substring | $O(n)$ after the LCP |
| $k$-th smallest substring | $O(n)$ with the LCP array |

## Practice problems

- [Uva 760 - DNA Sequencing](http://uva.onlinejudge.org/index.php?option=com_onlinejudge&Itemid=8&category=24&page=show_problem&problem=701)
- [Uva 1223 - Editor](http://uva.onlinejudge.org/index.php?option=com_onlinejudge&Itemid=8&category=24&page=show_problem&problem=3664)
- [Codechef - Tandem](https://www.codechef.com/problems/TANDEM)
- [Codechef - Substrings and Repetitions](https://www.codechef.com/problems/ANUSAR)
- [Codechef - Entangled Strings](https://www.codechef.com/problems/TANGLED)
- [Codeforces - Martian Strings](http://codeforces.com/problemset/problem/149/E)
- [Codeforces - Little Elephant and Strings](http://codeforces.com/problemset/problem/204/E)
- [SPOJ - Ada and Terramorphing](http://www.spoj.com/problems/ADAPHOTO/)
- [SPOJ - Ada and Substring](http://www.spoj.com/problems/ADASTRNG/)
- [UVA - 1227 - The longest constant gene](https://uva.onlinejudge.org/index.php?option=onlinejudge&page=show_problem&problem=3668)
- [SPOJ - Longest Common Substring](http://www.spoj.com/problems/LCS/en/)
- [UVA 11512 - GATTACA](https://uva.onlinejudge.org/index.php?option=com_onlinejudge&Itemid=8&page=show_problem&problem=2507)
- [LA 7502 - Suffixes and Palindromes](https://vjudge.net/problem/UVALive-7502)
- [GYM - Por Costel and the Censorship Committee](http://codeforces.com/gym/100923/problem/D)
- [UVA 1254 - Top 10](https://uva.onlinejudge.org/index.php?option=com_onlinejudge&Itemid=8&page=show_problem&problem=3695)
- [UVA 12191 - File Recover](https://uva.onlinejudge.org/index.php?option=com_onlinejudge&Itemid=8&page=show_problem&problem=3343)
- [UVA 12206 - Stammering Aliens](https://uva.onlinejudge.org/index.php?option=onlinejudge&page=show_problem&problem=3358)
- [Codechef - Jarvis and LCP](https://www.codechef.com/problems/INSQ16F)
- [LA 3943 - Liking's Letter](https://vjudge.net/problem/UVALive-3943)
- [UVA 11107 - Life Forms](https://uva.onlinejudge.org/index.php?option=com_onlinejudge&Itemid=8&page=show_problem&problem=2048)
- [UVA 12974 - Exquisite Strings](https://uva.onlinejudge.org/index.php?option=com_onlinejudge&Itemid=8&category=862&page=show_problem&problem=4853)
- [UVA 10526 - Intellectual Property](https://uva.onlinejudge.org/index.php?option=com_onlinejudge&Itemid=8&page=show_problem&problem=1467)
- [UVA 12338 - Anti-Rhyme Pairs](https://uva.onlinejudge.org/index.php?option=onlinejudge&page=show_problem&problem=3760)
- [UVA 12191 - File Recover](https://uva.onlinejudge.org/index.php?option=com_onlinejudge&Itemid=8&page=show_problem&problem=3343)
- [SPOJ - Suffix Array](http://www.spoj.com/problems/SARRAY/)
- [LA 4513 - Stammering Aliens](https://vjudge.net/problem/UVALive-4513)
- [SPOJ - LCS2](http://www.spoj.com/problems/LCS2/)
- [Codeforces - Fake News (hard)](http://codeforces.com/contest/802/problem/I)
- [SPOJ - Longest Commong Substring](http://www.spoj.com/problems/LONGCS/)
- [SPOJ - Lexicographical Substring Search](http://www.spoj.com/problems/SUBLEX/)
- [Codeforces - Forbidden Indices](http://codeforces.com/contest/873/problem/F)
- [Codeforces - Tricky and Clever Password](http://codeforces.com/contest/30/problem/E)
- [LA 6856 - Circle of digits](https://vjudge.net/problem/UVALive-6856)
