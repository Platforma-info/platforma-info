---
title: "Randomized Heap"
section: Trees
order: 6
difficulty: intermediate
summary: "A mergeable priority queue in about ten lines: merge two heaps by a random walk, and get insert and extract-min in expected O(log n)."
tags: [heap, priority queue, randomized, mergeable heap]
prerequisites: [python-contests/heaps-deques-and-bisect]
source:
  title: "Randomized Heap"
  url: https://cp-algorithms.com/data_structures/randomized_heap.html
  license: CC BY-SA 4.0
---

A **min-heap** is a binary tree in which every vertex is $\le$ its children, so the minimum is at the root. `heapq` stores it implicitly in a list, which is fast but cannot **merge** two heaps faster than $O(n)$. A **randomized heap** is an explicit tree that supports merging in expected $O(\log n)$, and everything else reduces to merging:

| Operation | Implementation |
|-----------|----------------|
| insert $x$ | merge with a one-vertex heap |
| find minimum | the root |
| extract minimum | merge the root's two children |
| merge two heaps | the operation itself |
| delete an arbitrary node (if you know where it is) | merge its children and replace it |

## The merge

To merge heaps $T_1$ and $T_2$: the smaller root becomes the new root. Its children must be combined with the remaining heap; pick **one child at random** and merge the other heap into that subtree.

```python
import random

class Node:
    __slots__ = ("value", "left", "right")

    def __init__(self, value):
        self.value = value
        self.left = None
        self.right = None

def merge(t1, t2):
    if t1 is None:
        return t2
    if t2 is None:
        return t1
    if t2.value < t1.value:
        t1, t2 = t2, t1
    if random.getrandbits(1):
        t1.left, t1.right = t1.right, t1.left
    t1.left = merge(t1.left, t2)
    return t1

class RandomizedHeap:
    def __init__(self):
        self.root = None
        self.count = 0

    def push(self, value):
        self.root = merge(self.root, Node(value))
        self.count += 1

    def top(self):
        return self.root.value

    def pop(self):
        value = self.root.value
        self.root = merge(self.root.left, self.root.right)
        self.count -= 1
        return value

    def meld(self, other):
        """Merge another heap into this one (the other becomes empty)."""
        self.root = merge(self.root, other.root)
        self.count += other.count
        other.root, other.count = None, 0

    def __len__(self):
        return self.count

h = RandomizedHeap()
for x in [5, 1, 8, 3, 9, 2]:
    h.push(x)
assert h.top() == 1
assert [h.pop() for _ in range(len(h))] == [1, 2, 3, 5, 8, 9]
```

Randomly swapping the children before recursing is what keeps the expected length of the path short.

## It behaves like a heap

```python
import heapq

random.seed(1)
for _ in range(100):
    a = [random.randint(0, 50) for _ in range(random.randint(0, 40))]
    b = [random.randint(0, 50) for _ in range(random.randint(0, 40))]
    ha, hb = RandomizedHeap(), RandomizedHeap()
    for x in a:
        ha.push(x)
    for x in b:
        hb.push(x)
    ha.meld(hb)
    assert len(hb) == 0
    out = [ha.pop() for _ in range(len(ha))]
    assert out == sorted(a + b)

# a mix of pushes and pops compared with heapq
ref, heap = [], RandomizedHeap()
for _ in range(3000):
    if ref and random.random() < 0.45:
        assert heap.pop() == heapq.heappop(ref)
    else:
        x = random.randint(0, 1000)
        heap.push(x)
        heapq.heappush(ref, x)
```

## Why it is fast

Let $h(T)$ be the length of the *random path* obtained by starting at the root and moving to a uniformly random child until a leaf. `merge` takes $O(h(T_1) + h(T_2))$ steps. By induction on the two subtrees,

$$
\mathbf{E}\,h(T) \le \log_2(n+1)
$$

because $\mathbf{E}h(T) = 1 + \tfrac12(\mathbf{E}h(L) + \mathbf{E}h(R)) \le 1 + \log_2\sqrt{(n_L+1)(n_R+1)} \le \log_2(n+1)$ (AM-GM). The tail is also thin: $\Pr[h(T) > (c+1)\log_2 n] < n^{-c}$, since a path of length $\ell$ is chosen with probability $2^{-\ell}$ and there are fewer than $n$ paths. So every operation takes $O(\log n)$ in expectation, and the chance of exceeding $c\log n$ steps shrinks polynomially in $n$.

The *deepest* branch of the tree can be much longer than the random path (the operations only ever walk random paths, so that is what the analysis bounds):

```python
def height(t):
    """Height without recursion (the tree may be deep)."""
    best, stack = 0, [(t, 1)] if t else []
    while stack:
        node, d = stack.pop()
        best = max(best, d)
        for child in (node.left, node.right):
            if child:
                stack.append((child, d + 1))
    return best

big = RandomizedHeap()
for x in range(5000):
    big.push(x)                      # sorted insertions
assert height(big.root) >= 13        # at least log2(5000)
assert len(big) == 5000 and big.top() == 0
```

## When to use it

- You need **meldable** priority queues: merging the heaps of two subtrees without the extra $\log$ of small-to-large merging.
- Problems of type "each vertex of a tree owns a priority queue; combine the children's queues into the parent's" (slope-trick and Lagrangian-relaxation style optimisations).
- For plain push/pop, `heapq` is faster in Python; use this structure only when merging matters.
