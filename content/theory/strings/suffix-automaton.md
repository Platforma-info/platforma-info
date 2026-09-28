---
title: "Suffix Automaton"
section: Advanced
order: 2
difficulty: advanced
summary: "The smallest automaton that accepts exactly the suffixes of a string: built online in linear time, it counts distinct substrings, occurrences and longest common substrings."
tags: [suffix automaton, substrings, dawg, online algorithm]
prerequisites: [strings/suffix-array, strings/aho-corasick]
source:
  title: "Suffix Automaton"
  url: https://cp-algorithms.com/string/suffix-automaton.html
  license: CC BY-SA 4.0
---

A **suffix automaton** of a string $s$ is the smallest deterministic finite automaton that accepts exactly the suffixes of $s$. Equivalently, it is a compact directed acyclic graph in which **every path from the initial state spells a distinct substring of $s$**, and every substring of $s$ is spelled by exactly one path. For $n \ge 3$ it has at most $2n - 1$ states and $3n - 4$ transitions, and can be built online in $O(n)$ time (for a constant alphabet).

That makes it a very powerful tool for problems about substrings: distinct substrings, occurrence counts, the $k$-th substring, longest common substring of several strings.

## Structure: end-position classes

For a substring $t$ of $s$ let $\text{endpos}(t)$ be the set of positions where $t$ ends in $s$. Two substrings are **equivalent** if they have the same $\text{endpos}$. Each equivalence class becomes one *state* of the automaton.

- All strings of one class are suffixes of the longest one, and they have consecutive lengths: from $\text{len}(\text{link}(v)) + 1$ up to $\text{len}(v)$.
- The **suffix link** $\text{link}(v)$ leads to the state of the longest suffix of the strings in $v$ that has a *different* $\text{endpos}$ (a strictly larger set). The links form a tree rooted at the initial state, the **suffix-link tree**.

For each state we store `len` (the length of its longest string), `link`, and the transitions `next`.

## Construction

Add the characters one at a time. Keep `last`, the state of the whole current string.

1. Create a new state `cur` with `len = len[last] + 1`.
2. Walk from `last` along suffix links; for each state `p` that has no transition by `c`, add the transition `p -> cur`. Stop at the first `p` that already has one (or when we run out of links).
3. If we ran out of links: `link[cur] = 0` (the root).
4. Otherwise let `q = next[p][c]`. If `len[p] + 1 == len[q]`, then `link[cur] = q`.
5. Otherwise, `q` contains strings of two kinds (some that also end at the new position, some that don't). **Clone** `q` into a new state `clone` with `len = len[p] + 1`, the same transitions and link as `q`; redirect the transitions `p -> q` (and those of the suffix-link ancestors of `p`) to `clone`; set `link[q] = link[cur] = clone`.
6. `last = cur`.

```python
class SuffixAutomaton:
    def __init__(self, s=""):
        self.next = [{}]          # transitions
        self.link = [-1]          # suffix links
        self.length = [0]         # length of the longest string of the state
        self.is_clone = [False]
        self.last = 0
        for c in s:
            self.extend(c)

    def _new_state(self, length, link, transitions, is_clone):
        self.next.append(transitions)
        self.link.append(link)
        self.length.append(length)
        self.is_clone.append(is_clone)
        return len(self.next) - 1

    def extend(self, c):
        cur = self._new_state(self.length[self.last] + 1, 0, {}, False)
        p = self.last
        while p != -1 and c not in self.next[p]:
            self.next[p][c] = cur
            p = self.link[p]
        if p == -1:
            self.link[cur] = 0
        else:
            q = self.next[p][c]
            if self.length[p] + 1 == self.length[q]:
                self.link[cur] = q
            else:
                clone = self._new_state(self.length[p] + 1, self.link[q], dict(self.next[q]), True)
                while p != -1 and self.next[p].get(c) == q:
                    self.next[p][c] = clone
                    p = self.link[p]
                self.link[q] = self.link[cur] = clone
        self.last = cur

    def contains(self, t):
        v = 0
        for c in t:
            v = self.next[v].get(c)
            if v is None:
                return False
        return True

sam = SuffixAutomaton("abcbc")
assert sam.contains("bcb") and sam.contains("cbc") and sam.contains("") and not sam.contains("acb")
assert len(sam.next) <= 2 * 5 - 1
```

## Testing the structure

Every substring is accepted, every non-substring rejected, and the number of states and transitions respects the bounds:

```python
import random

random.seed(1)
for _ in range(400):
    s = "".join(random.choice("abc") for _ in range(random.randint(1, 30)))
    sam = SuffixAutomaton(s)
    substrings = {s[i:j] for i in range(len(s)) for j in range(i + 1, len(s) + 1)}
    assert all(sam.contains(t) for t in substrings)
    for _ in range(20):
        q = "".join(random.choice("abcd") for _ in range(random.randint(1, 6)))
        assert sam.contains(q) == (q in substrings)
    n = len(s)
    if n >= 2:
        assert len(sam.next) <= 2 * n - 1                          # states
    if n >= 3:
        assert sum(len(t) for t in sam.next) <= 3 * n - 4          # transitions
```

## Applications

### Number of distinct substrings

Each state $v \ne 0$ represents $\text{len}(v) - \text{len}(\text{link}(v))$ distinct strings, and every substring belongs to exactly one state:

$$
\#\text{distinct substrings} = \sum_{v \ne 0} \big(\text{len}(v) - \text{len}(\text{link}(v))\big)
$$

```python
def distinct_substrings(sam):
    return sum(sam.length[v] - sam.length[sam.link[v]] for v in range(1, len(sam.next)))

assert distinct_substrings(SuffixAutomaton("banana")) == 15
for _ in range(300):
    s = "".join(random.choice("ab") for _ in range(random.randint(0, 25)))
    expected = len({s[i:j] for i in range(len(s)) for j in range(i + 1, len(s) + 1)})
    assert distinct_substrings(SuffixAutomaton(s)) == expected
```

### Number of occurrences of a substring

Mark the states created for prefixes (the non-clones) with `cnt = 1`. The number of occurrences of a string is the number of prefixes with an end position in its class, i.e. the sum of `cnt` over the subtree of its state in the suffix-link tree. Accumulate the counts along the links, processing states in decreasing order of `len`:

```python
def occurrence_counts(sam):
    cnt = [0 if sam.is_clone[v] else 1 for v in range(len(sam.next))]
    cnt[0] = 0
    for v in sorted(range(1, len(sam.next)), key=lambda x: -sam.length[x]):
        cnt[sam.link[v]] += cnt[v]
    return cnt

def count_occurrences(sam, cnt, t):
    v = 0
    for c in t:
        v = sam.next[v].get(c)
        if v is None:
            return 0
    return cnt[v]

text = "abracadabra"
sam = SuffixAutomaton(text)
cnt = occurrence_counts(sam)
assert count_occurrences(sam, cnt, "abra") == 2 and count_occurrences(sam, cnt, "a") == 5
assert count_occurrences(sam, cnt, "cad") == 1 and count_occurrences(sam, cnt, "zz") == 0

for _ in range(200):
    s = "".join(random.choice("ab") for _ in range(random.randint(1, 25)))
    sam = SuffixAutomaton(s)
    cnt = occurrence_counts(sam)
    q = "".join(random.choice("ab") for _ in range(random.randint(1, 4)))
    expected = sum(s.startswith(q, i) for i in range(len(s)))
    assert count_occurrences(sam, cnt, q) == expected
```

Overlapping occurrences are counted, as in the brute force.

### Longest common substring of two strings

Build the automaton of the first string and run the second string through it, keeping the length of the current match. When the next character is not available, follow suffix links until it is (shortening the match), or return to the root:

```python
def longest_common_substring(a, b):
    sam = SuffixAutomaton(a)
    v, length = 0, 0
    best, best_end = 0, 0
    for i, c in enumerate(b):
        while v and c not in sam.next[v]:
            v = sam.link[v]
            length = sam.length[v]
        if c in sam.next[v]:
            v = sam.next[v][c]
            length += 1
        if length > best:
            best, best_end = length, i + 1
    return b[best_end - best:best_end]

assert longest_common_substring("xabcdz", "yabcdw") == "abcd"
assert longest_common_substring("abc", "xyz") == ""

def lcs_brute(a, b):
    best = ""
    for i in range(len(a)):
        for j in range(i + 1, len(a) + 1):
            if a[i:j] in b and j - i > len(best):
                best = a[i:j]
    return len(best)

for _ in range(300):
    a = "".join(random.choice("abc") for _ in range(random.randint(0, 20)))
    b = "".join(random.choice("abc") for _ in range(random.randint(0, 20)))
    assert len(longest_common_substring(a, b)) == lcs_brute(a, b)
```

### The $k$-th lexicographic substring

Count, for each state, the number of distinct strings starting there (the size of the path set: `paths[v] = 1 + sum(paths[next])`), and then descend, choosing the child by counts. This gives the $k$-th distinct substring in $O(|s| \cdot |\Sigma|)$:

```python
def kth_substring(sam, k):
    """k-th (1-indexed) distinct non-empty substring in lexicographic order."""
    order = sorted(range(len(sam.next)), key=lambda v: -sam.length[v])
    paths = [1] * len(sam.next)
    for v in order:
        paths[v] = 1 + sum(paths[u] for u in sam.next[v].values())
    v, result = 0, []
    while True:
        for c in sorted(sam.next[v]):
            u = sam.next[v][c]
            if k <= paths[u]:
                result.append(c)
                v = u
                k -= 1
                break
            k -= paths[u]
        else:
            raise IndexError("k is larger than the number of distinct substrings")
        if k == 0:
            return "".join(result)

s = "abac"
sam = SuffixAutomaton(s)
all_sorted = sorted({s[i:j] for i in range(len(s)) for j in range(i + 1, len(s) + 1)})
assert [kth_substring(sam, k) for k in range(1, len(all_sorted) + 1)] == all_sorted
```

## Comparison with the alternatives

| | Suffix automaton | [Suffix array](/theory/strings/suffix-array) | [Suffix tree](/theory/strings/suffix-tree) |
|---|---|---|---|
| build | $O(n)$, online | $O(n\log n)$ | $O(n)$, online |
| states / memory | $\le 2n$ states, dict per state | 2 arrays | $\le 2n$ vertices |
| substring check | $O(|t|)$ | $O(|t| \log n)$ | $O(|t|)$ |
| the natural tool for | counting and DP over substrings | sorting, LCP ranges | tree-shaped queries |

The suffix automaton of the **reversed** string is the suffix tree (its link tree), which is the standard way to obtain a suffix tree of a string in Python without Ukkonen's algorithm.

## Practice problems

- [CSES - Finding Patterns](https://cses.fi/problemset/task/2102)
- [CSES - Counting Patterns](https://cses.fi/problemset/task/2103)
- [CSES - String Matching](https://cses.fi/problemset/task/1753)
- [CSES - Patterns Positions](https://cses.fi/problemset/task/2104)
- [CSES - Distinct Substrings](https://cses.fi/problemset/task/2105)
- [CSES - Word Combinations](https://cses.fi/problemset/task/1731)
- [CSES - String Distribution](https://cses.fi/problemset/task/2110)
- [AtCoder - K-th Substring](https://atcoder.jp/contests/abc097/tasks/arc097_a)
- [SPOJ - SUBLEX](https://www.spoj.com/problems/SUBLEX/)
- [Codeforces - Cyclical Quest](https://codeforces.com/problemset/problem/235/C)
- [Codeforces - String](https://codeforces.com/contest/128/problem/B)
