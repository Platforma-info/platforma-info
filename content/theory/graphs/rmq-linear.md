---
title: "Range Minimum Query via LCA and the Cartesian Tree"
section: Trees and LCA
order: 4
difficulty: advanced
summary: "Turn a static range-minimum query on an array into an LCA query on its Cartesian tree, which the Farach-Colton–Bender algorithm answers in O(1) after linear preprocessing."
tags: [rmq, cartesian tree, lca, static queries, linear time]
prerequisites: [graphs/lca-farach-colton-bender, data-structures/minimum-stack-queue]
source:
  title: "Solve RMQ (Range Minimum Query) by finding LCA (Lowest Common Ancestor)"
  url: https://cp-algorithms.com/graph/rmq_linear.html
  license: CC BY-SA 4.0
---

Given an array `A[0..N-1]` that never changes, answer queries `[L, R]`: the minimum of `A` from position `L` to `R`. This article describes an asymptotically optimal solution ($O(N)$ preprocessing, $O(1)$ per query) that is unusual: it reduces RMQ to the LCA problem, and the [Farach-Colton and Bender algorithm](/theory/graphs/lca-farach-colton-bender) reduces LCA back to a *specialized* RMQ and solves that.

## The Cartesian tree

The **Cartesian tree** of an array is a binary tree with

- the **min-heap property**: the value of a parent is smaller than or equal to those of its children;
- **in-order traversal** visiting the elements in their array order.

Recursively: the root is the minimum of the array; the left subtree is the Cartesian tree of the prefix before it and the right subtree that of the suffix after it.

**Claim:** the minimum on `[l, r]` is the value of the node `LCA(l, r)` in the Cartesian tree (nodes are identified with array positions). By the heap property, the node holding the smallest element of the range is an ancestor of every node in the range. And it is the *lowest* such ancestor: otherwise `l` and `r` would both lie in its left or both in its right subtree, and the minimum would not be in the range.

## Building the tree in $O(N)$

Add the elements one at a time, keeping the *right spine* (the path from the root going right) on a stack. A new element `A[i]` pops from the stack all spine nodes with values greater than or equal to it; the last popped node becomes the **left child** of `i`, and `i` becomes the **right child** of the node now on top of the stack.

```python
def cartesian_tree_parents(a):
    """parent[i] of every position in the Cartesian tree (-1 for the root)."""
    parent = [-1] * len(a)
    stack = []
    for i, x in enumerate(a):
        last = -1
        while stack and a[stack[-1]] >= x:
            last = stack.pop()
        if stack:
            parent[i] = stack[-1]
        if last >= 0:
            parent[last] = i
        stack.append(i)
    return parent

a = [5, 2, 7, 4, 1, 8, 3]
parent = cartesian_tree_parents(a)
assert parent == [1, 4, 3, 1, -1, 6, 4]           # the root is position 4, the global minimum 1
```

## Putting it together

Build the tree from the parent array, then use the LCA structure on it. The code below includes the Farach-Colton–Bender structure from the previous article (an argmin structure for arrays whose neighbours differ by exactly one).

```python
class PlusMinusOneRMQ:
    def __init__(self, a):
        self.a = a
        n = len(a)
        self.log = [0] * (n + 2)
        for i in range(2, n + 2):
            self.log[i] = self.log[i // 2] + 1
        self.k = k = max(1, self.log[n] // 2)
        self.nblocks = (n + k - 1) // k
        block_min = [min(range(b * k, min(n, (b + 1) * k)), key=a.__getitem__) for b in range(self.nblocks)]
        self.st = [block_min]
        j = 1
        while (1 << j) <= self.nblocks:
            prev, half = self.st[-1], 1 << (j - 1)
            self.st.append([self._better(prev[i], prev[i + half]) for i in range(self.nblocks - (1 << j) + 1)])
            j += 1
        self.mask = []
        for b in range(self.nblocks):
            m = 0
            for j in range(1, k):
                i = b * k + j
                if i < n and a[i] > a[i - 1]:
                    m |= 1 << (j - 1)
            self.mask.append(m)
        self.inner = {}
        for m in set(self.mask):
            heights = [0]
            for j in range(k - 1):
                heights.append(heights[-1] + (1 if m >> j & 1 else -1))
            table = [[0] * k for _ in range(k)]
            for l in range(k):
                best = l
                for r in range(l, k):
                    if heights[r] < heights[best]:
                        best = r
                    table[l][r] = best
            self.inner[m] = table

    def _better(self, i, j):
        return i if self.a[i] <= self.a[j] else j

    def _in_block(self, b, l, r):
        return b * self.k + self.inner[self.mask[b]][l][r]

    def argmin(self, l, r):
        k = self.k
        bl, br = l // k, r // k
        if bl == br:
            return self._in_block(bl, l % k, r % k)
        best = self._better(self._in_block(bl, l % k, k - 1), self._in_block(br, 0, r % k))
        if bl + 1 < br:
            j = self.log[br - bl - 1]
            best = self._better(best, self._better(self.st[j][bl + 1], self.st[j][br - (1 << j)]))
        return best

class StaticRMQ:
    """O(n) preprocessing, O(1) range-minimum queries."""

    def __init__(self, a):
        self.a = a
        n = len(a)
        parent = cartesian_tree_parents(a)
        children = [[] for _ in range(n)]
        root = -1
        for v, p in enumerate(parent):
            if p == -1:
                root = v
            else:
                children[p].append(v)
        # Euler tour of the Cartesian tree (iterative)
        self.euler, self.first, depth = [root], [-1] * n, [0] * n
        self.first[root] = 0
        stack = [(root, 0)]
        while stack:
            v, i = stack.pop()
            if i < len(children[v]):
                stack.append((v, i + 1))
                u = children[v][i]
                depth[u] = depth[v] + 1
                self.first[u] = len(self.euler)
                self.euler.append(u)
                stack.append((u, 0))
            elif stack:
                self.euler.append(stack[-1][0])
        self.lca_rmq = PlusMinusOneRMQ([depth[v] for v in self.euler])

    def query(self, l, r):
        """The minimum of a[l..r]."""
        i, j = self.first[l], self.first[r]
        if i > j:
            i, j = j, i
        return self.a[self.euler[self.lca_rmq.argmin(i, j)]]

rmq = StaticRMQ(a)
assert rmq.query(1, 3) == 2 and rmq.query(0, 6) == 1 and rmq.query(5, 6) == 3 and rmq.query(2, 2) == 7
```

## Testing

Compare with `min(a[l:r+1])` for **all** ranges of many random arrays, including arrays with many equal values (duplicates create ties in the Cartesian tree, which are harmless):

```python
import random

rnd = random.Random(5)
for _ in range(200):
    n = rnd.randint(1, 60)
    a = [rnd.randint(0, rnd.choice([3, 10, 1000])) for _ in range(n)]
    rmq = StaticRMQ(a)
    for l in range(n):
        for r in range(l, n):
            assert rmq.query(l, r) == min(a[l:r + 1])
```

## When to use it

Practically, a [sparse table](/theory/data-structures/sparse-table) is simpler and just as fast for queries: $O(N\log N)$ memory is fine for arrays up to a few million elements. The reduction is a beautiful piece of theory (RMQ $\leftrightarrow$ LCA are equivalent problems) and the Cartesian tree itself is a useful object on its own: it is the structure behind the [treap](/theory/data-structures/treap) and behind many "nearest smaller value" problems.
