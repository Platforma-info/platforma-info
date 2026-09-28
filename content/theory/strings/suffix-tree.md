---
title: "Suffix Tree and Ukkonen's Algorithm"
section: Advanced
order: 1
difficulty: advanced
summary: "A compressed trie of all suffixes that answers substring questions in O(pattern length), built online in linear time with Ukkonen's algorithm."
tags: [suffix tree, ukkonen, trie, substrings]
prerequisites: [strings/suffix-array]
source:
  title: "Suffix Tree. Ukkonen's Algorithm"
  url: https://cp-algorithms.com/string/suffix-tree-ukkonen.html
  license: CC BY-SA 4.0
---

The **suffix tree** of a string $s$ is a tree whose root-to-leaf paths spell the suffixes of $s$, with chains of single-child vertices compressed into one edge. Each edge is labelled with a substring of $s$, stored as a pair of indices $(l, r)$ instead of a copy of the characters, so the whole tree takes $O(n)$ memory. It has at most $2n$ vertices.

Once built, it answers in $O(|p|)$ time whether a pattern $p$ occurs in $s$, and supports the same applications as a [suffix array](/theory/strings/suffix-array) (distinct substrings, longest repeated substring, longest common substring), often in the most direct way: many problems read as "walk the tree".

> [!NOTE]
> Building a suffix tree in Python is heavy: each vertex is a small dictionary, so memory and time are large compared with a suffix array. Use it to learn the structure, or for strings of a few thousand characters. For larger inputs prefer the [suffix array](/theory/strings/suffix-array) or the [suffix automaton](/theory/strings/suffix-automaton).

## Ukkonen's algorithm

Ukkonen's algorithm builds the tree **online**: it adds the characters of $s$ one at a time, always keeping the suffix tree of the current prefix (with leaves that implicitly extend to the end of the string). It runs in $O(n \log k)$ for an alphabet of size $k$ (linear for a constant alphabet).

Each vertex stores the label of the edge from its parent, the parent, a **suffix link**, and its outgoing edges by first character:

- `(l, r)`: the edge label is `s[l:r]` (leaves use $r = n$);
- `parent`;
- `link`: for the vertex spelling $x\alpha$, the vertex spelling $\alpha$;
- `next`: dictionary from first character to child.

The algorithm keeps a pointer `(v, pos)` meaning "the current suffix is `pos` characters down the edge leading into vertex `v`". To add the character at index `i`:

1. Try to follow the character from the pointer. If it is possible, advance the pointer and stop: the current suffix (and all shorter ones) already occurs, so no new leaves are needed.
2. Otherwise split the edge at the pointer if necessary (creating an internal vertex), add a new leaf labelled from `i` to the end, and move the pointer along the **suffix link** to the next shorter suffix. Repeat.

Suffix links are computed lazily.

```python
class SuffixTree:
    """Suffix tree of s built with Ukkonen's algorithm (suffix links computed lazily)."""

    def __init__(self, s):
        self.s = s
        self.n = len(s)
        self.l = [0]                 # edge label into each vertex: s[l:r]
        self.r = [0]
        self.par = [-1]
        self.link = [-1]
        self.next = [{}]
        self.v, self.pos = 0, 0      # pointer: pos characters down the edge into vertex v
        for i in range(self.n):
            self._extend(i)

    def _new(self, l, r, par):
        self.l.append(l)
        self.r.append(r)
        self.par.append(par)
        self.link.append(-1)
        self.next.append({})
        return len(self.l) - 1

    def _len(self, v):
        return self.r[v] - self.l[v]

    def _go(self, v, pos, l, r):
        """Follow the characters s[l:r] from the state (v, pos); return the new state or (-1, -1)."""
        s = self.s
        while l < r:
            if pos == self._len(v):
                v = self.next[v].get(s[l], -1)
                pos = 0
                if v == -1:
                    return -1, -1
            else:
                if s[self.l[v] + pos] != s[l]:
                    return -1, -1
                if r - l < self._len(v) - pos:
                    return v, pos + r - l
                l += self._len(v) - pos
                pos = self._len(v)
        return v, pos

    def _split(self, v, pos):
        """Make the state (v, pos) an explicit vertex; return it."""
        if pos == self._len(v):
            return v
        if pos == 0:
            return self.par[v]
        s = self.s
        mid = self._new(self.l[v], self.l[v] + pos, self.par[v])
        self.next[self.par[v]][s[self.l[v]]] = mid
        self.next[mid][s[self.l[v] + pos]] = v
        self.par[v] = mid
        self.l[v] += pos
        return mid

    def _get_link(self, v):
        if self.link[v] != -1:
            return self.link[v]
        if self.par[v] == -1:
            return 0
        to = self._get_link(self.par[v])
        v2, p2 = self._go(to, self._len(to), self.l[v] + (1 if self.par[v] == 0 else 0), self.r[v])
        self.link[v] = self._split(v2, p2)
        return self.link[v]

    def _extend(self, i):
        s = self.s
        while True:
            nv, npos = self._go(self.v, self.pos, i, i + 1)
            if nv != -1:
                self.v, self.pos = nv, npos
                return
            mid = self._split(self.v, self.pos)
            leaf = self._new(i, self.n, mid)
            self.next[mid][s[i]] = leaf
            self.v = self._get_link(mid)
            self.pos = self._len(self.v)
            if mid == 0:
                break

    # ----- queries -----
    def contains(self, pattern):
        v, pos = self._go(0, 0, 0, 0)          # the root
        s = self.s
        i = 0
        while i < len(pattern):
            if pos == self._len(v):
                v = self.next[v].get(pattern[i], -1)
                pos = 0
                if v == -1:
                    return False
            if s[self.l[v] + pos] != pattern[i]:
                return False
            pos += 1
            i += 1
        return True

    def distinct_substrings(self):
        """Every distinct substring corresponds to exactly one position in the tree."""
        return sum(self._len(v) for v in range(1, len(self.l)))

t = SuffixTree("banana")
assert t.contains("ana") and t.contains("nan") and t.contains("banana") and t.contains("")
assert not t.contains("nab") and not t.contains("bananas")
assert t.distinct_substrings() == 15
```

## Testing against brute force

Every substring must be found, everything else must be absent, the count of distinct substrings must agree, and the number of vertices is at most $2n$:

```python
import random

random.seed(1)
for _ in range(400):
    s = "".join(random.choice("abc") for _ in range(random.randint(1, 30)))
    tree = SuffixTree(s)
    all_substrings = {s[i:j] for i in range(len(s)) for j in range(i + 1, len(s) + 1)}
    assert tree.distinct_substrings() == len(all_substrings)
    assert all(tree.contains(sub) for sub in all_substrings)
    for _ in range(20):
        q = "".join(random.choice("abcd") for _ in range(random.randint(1, 6)))
        assert tree.contains(q) == (q in all_substrings)
    assert len(tree.l) <= 2 * len(s)
```

## Explicit suffixes with a terminator

Without a terminal character, some suffixes (those that are also prefixes of longer suffixes, like `a` in `banana`) end in the middle of an edge or at an internal vertex instead of at a leaf; the tree is then called *implicit*. Appending a unique terminator that occurs nowhere else (say `$`) makes every suffix a leaf, so the number of leaves is exactly $n$ (plus the terminator) and the number of occurrences of a pattern is the number of leaves below its position:

```python
def count_occurrences(tree, pattern):
    """Number of occurrences of `pattern` in tree.s[:-1]; the tree must be built on s + '$'."""
    v, pos, i, s = 0, 0, 0, tree.s
    while i < len(pattern):
        if pos == tree._len(v):
            v = tree.next[v].get(pattern[i], -1)
            pos = 0
            if v == -1:
                return 0
        if s[tree.l[v] + pos] != pattern[i]:
            return 0
        pos += 1
        i += 1
    leaves, stack = 0, [v]
    while stack:
        x = stack.pop()
        if not tree.next[x]:
            leaves += 1
        stack.extend(tree.next[x].values())
    return leaves

text = "abracadabra"
tree = SuffixTree(text + "$")
assert count_occurrences(tree, "abra") == 2 and count_occurrences(tree, "a") == 5
assert count_occurrences(tree, "cad") == 1 and count_occurrences(tree, "zzz") == 0

for _ in range(200):
    s = "".join(random.choice("ab") for _ in range(random.randint(1, 25)))
    tree = SuffixTree(s + "$")
    q = "".join(random.choice("ab") for _ in range(random.randint(1, 4)))
    expected = sum(s.startswith(q, i) for i in range(len(s)))
    assert count_occurrences(tree, q) == expected
```

## Complexity and where it fits

| | Suffix tree | Suffix array + LCP | Suffix automaton |
|---|---|---|---|
| build | $O(n)$ | $O(n \log n)$ | $O(n)$ |
| pattern search | $O(|p|)$ | $O(|p| \log n)$ | $O(|p|)$ |
| memory | large ($\sim 2n$ vertices, each with a map) | small | $\sim 2n$ states |
| typical use | direct tree walks, LCA-based queries | most contest problems | counting substrings, matching statistics |

The **generalized suffix tree** (several strings separated by distinct terminators) solves longest common substring of many strings directly: find the deepest vertex whose subtree contains leaves of all strings.

## Practice problems

- [UVA 10679 - I Love Strings!!!](http://uva.onlinejudge.org/index.php?option=onlinejudge&page=show_problem&problem=1620)
