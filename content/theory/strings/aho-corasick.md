---
title: "Aho-Corasick Algorithm"
section: Fundamentals
order: 5
difficulty: advanced
summary: "Search for many patterns in a text at once by building a trie with failure links, and use the resulting automaton for counting strings that avoid patterns."
tags: [aho-corasick, trie, automaton, multiple patterns, failure links]
prerequisites: [strings/prefix-function]
source:
  title: "Aho-Corasick algorithm"
  url: https://cp-algorithms.com/string/aho_corasick.html
  license: CC BY-SA 4.0
---

Given a set of patterns (a *dictionary*) $p_1, \dots, p_k$ with total length $m$, and a text $t$ of length $n$, find every occurrence of every pattern in $t$. Running [KMP](/theory/strings/prefix-function) once per pattern costs $O(k\,n + m)$. The **Aho-Corasick automaton** does it in $O(n + m + z)$, where $z$ is the number of occurrences reported, for any number of patterns.

## The trie

Put all patterns into a **trie** (prefix tree): the root is the empty string; each vertex stands for a prefix of some pattern; an edge is labelled with a character. Mark the vertices where a pattern ends.

## Failure links

The **failure link** (suffix link) of a vertex $v$ that represents the string $w$ points to the vertex representing the **longest proper suffix of $w$ that is also a prefix of some pattern**, that is, a vertex of the trie. It plays the same role as the [prefix function](/theory/strings/prefix-function): when a mismatch happens, we fall back to the longest partial match that can still continue.

Compute the links by BFS from the root. For a vertex $v$ with parent $p$ and edge character $c$: start from the failure link of $p$ and follow failure links until a vertex with an outgoing edge $c$ exists; that edge's target is the failure link of $v$. Vertices at depth 1 fail to the root.

We also keep a **dictionary link** for each vertex: the nearest vertex along its failure chain that ends a pattern. It lets us report all patterns that end at the current position (a pattern may be a suffix of another pattern) without walking the whole chain.

## Searching

Walk the text keeping the current vertex; on each character follow failure links until an edge with that character exists, then step. At each new vertex, report the patterns ending there and, through dictionary links, all shorter patterns that are its suffixes.

Each character causes amortized $O(1)$ failure steps (the depth of the current vertex grows by at most one per character, and each failure step decreases it), plus work proportional to the number of reported occurrences.

## Implementation

```python
from collections import deque

class AhoCorasick:
    def __init__(self, patterns):
        self.patterns = patterns
        self.go = [{}]                 # go[v][c]: trie child of v by character c
        self.link = [0]                # failure link
        self.out = [[]]                # indices of the patterns that end exactly at v
        for index, pattern in enumerate(patterns):
            v = 0
            for c in pattern:
                if c not in self.go[v]:
                    self.go.append({})
                    self.link.append(0)
                    self.out.append([])
                    self.go[v][c] = len(self.go) - 1
                v = self.go[v][c]
            self.out[v].append(index)
        self._build_links()

    def _build_links(self):
        self.dict_link = [-1] * len(self.go)     # nearest vertex on the failure chain that ends a pattern
        queue = deque(self.go[0].values())       # depth-1 vertices fail to the root
        while queue:
            v = queue.popleft()
            f = self.link[v]
            self.dict_link[v] = f if self.out[f] else self.dict_link[f]
            for c, child in self.go[v].items():
                u = f
                while u and c not in self.go[u]:
                    u = self.link[u]
                self.link[child] = self.go[u].get(c, 0)
                queue.append(child)

    def search(self, text):
        """Sorted list of (end_index, pattern_index) for every occurrence in the text."""
        result = []
        v = 0
        for i, c in enumerate(text):
            while v and c not in self.go[v]:
                v = self.link[v]
            v = self.go[v].get(c, 0)
            u = v if self.out[v] else self.dict_link[v]
            while u > 0:
                result.extend((i, index) for index in self.out[u])
                u = self.dict_link[u]
        return sorted(result)

ac = AhoCorasick(["he", "she", "his", "hers"])
assert ac.search("ushers") == [(3, 0), (3, 1), (5, 3)]        # "she" and "he" end at index 3, "hers" at 5
assert ac.search("") == [] and ac.search("xyz") == []
```

`self.go[u].get(c, 0)` handles both cases at once: if a vertex with the edge exists we take it, otherwise the link is the root. The vertex $v$ itself can never be its own failure link, since $u$ has a strictly smaller depth than $v$.

## Testing against brute force

```python
import random

def brute(patterns, text):
    found = []
    for index, p in enumerate(patterns):
        start = text.find(p)
        while start != -1:
            found.append((start + len(p) - 1, index))
            start = text.find(p, start + 1)
    return sorted(found)

random.seed(1)
for _ in range(500):
    patterns = ["".join(random.choice("ab") for _ in range(random.randint(1, 4)))
                for _ in range(random.randint(1, 6))]
    text = "".join(random.choice("ab") for _ in range(random.randint(0, 40)))
    assert AhoCorasick(patterns).search(text) == brute(patterns, text), (patterns, text)
```

Duplicate patterns are reported once per index, since the same trie vertex stores both indices.

## As an automaton: explicit transitions

The search loop may follow many failure links for one character. Precompute a full transition table $\delta(v, c)$, the state after reading $c$ in state $v$, so that every step costs $O(1)$ and the structure becomes a deterministic automaton over the alphabet:

$$
\delta(v, c) = \begin{cases}
\text{go}[v][c] & \text{if the trie edge exists} \\
\delta(\text{link}[v], c) & \text{otherwise (at the root: stay at the root)}
\end{cases}
$$

```python
def build_automaton(ac, alphabet):
    """delta[v][c] for every vertex and every character; a BFS order guarantees links are done first."""
    order = [0]
    for v in order:
        order.extend(ac.go[v].values())
    delta = [dict() for _ in ac.go]
    for v in order:
        for c in alphabet:
            if c in ac.go[v]:
                delta[v][c] = ac.go[v][c]
            elif v == 0:
                delta[v][c] = 0
            else:
                delta[v][c] = delta[ac.link[v]][c]
    return delta

delta = build_automaton(ac, "abcdefghijklmnopqrstuvwxyz")
state = 0
for c in "ushers":
    state = delta[state][c]
assert ac.out[state] == [3]                       # ended at the vertex of "hers"
```

### Application: counting strings that avoid all patterns

How many strings of length $L$ over the alphabet contain **none** of the patterns as a substring? Run a DP over the automaton: `ways[state]` counts the strings leading to that state, and states that end a pattern (directly or through a dictionary link) are forbidden.

```python
from itertools import product

def count_avoiding(patterns, alphabet, length):
    ac = AhoCorasick(patterns)
    delta = build_automaton(ac, alphabet)
    forbidden = [bool(ac.out[v]) or ac.dict_link[v] != -1 for v in range(len(ac.go))]
    ways = {0: 1}
    for _ in range(length):
        new = {}
        for v, count in ways.items():
            for c in alphabet:
                u = delta[v][c]
                if not forbidden[u]:
                    new[u] = new.get(u, 0) + count
        ways = new
    return sum(ways.values())

def count_avoiding_brute(patterns, alphabet, length):
    return sum(all(p not in "".join(s) for p in patterns) for s in product(alphabet, repeat=length))

assert count_avoiding(["ab"], "ab", 3) == 4                 # aaa, baa, bba, bbb
assert count_avoiding(["ab", "ba"], "ab", 4) == 2           # only aaaa and bbbb
for _ in range(100):
    patterns = ["".join(random.choice("ab") for _ in range(random.randint(1, 3))) for _ in range(random.randint(1, 3))]
    L = random.randint(0, 9)
    assert count_avoiding(patterns, "ab", L) == count_avoiding_brute(patterns, "ab", L)
```

The DP costs $O(L \cdot m \cdot |\Sigma|)$, so it handles lengths up to $10^5$ (usually with counts taken modulo a prime), where brute force is hopeless.

## More applications

- Find all occurrences of a dictionary of words in a text: spam filters, plagiarism detection, DNA motifs.
- **Longest or lexicographically smallest** string that avoids forbidden substrings: DP over the automaton.
- **Counting** the occurrences of each pattern in $O(n + m)$: count the visits to each vertex, then push the counts down the failure links in reverse BFS order.
- Matching with a dictionary as a lexer: longest match at each position.

## Practice problems

- [UVA #11590 - Prefix Lookup](https://uva.onlinejudge.org/index.php?option=com_onlinejudge&Itemid=8&page=show_problem&problem=2637)
- [UVA #11171 - SMS](https://uva.onlinejudge.org/index.php?option=com_onlinejudge&Itemid=8&page=show_problem&problem=2112)
- [UVA #10679 - I Love Strings!!](https://uva.onlinejudge.org/index.php?option=onlinejudge&page=show_problem&problem=1620)
- [Codeforces - x-prime Substrings](https://codeforces.com/problemset/problem/1400/F)
- [Codeforces - Frequency of String](http://codeforces.com/problemset/problem/963/D)
- [CodeChef - TWOSTRS](https://www.codechef.com/MAY20A/problems/TWOSTRS)
