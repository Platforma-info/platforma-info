---
title: "Treap (Cartesian Tree)"
section: Trees
order: 5
difficulty: advanced
summary: "A binary search tree kept balanced by random priorities, built on two operations, split and merge; includes the implicit treap for array-like sequences."
tags: [treap, cartesian tree, split, merge, implicit treap, randomized]
prerequisites: [data-structures/segment-tree, python-basics/classes-and-objects]
source:
  title: "Treap (Cartesian tree)"
  url: https://cp-algorithms.com/data_structures/treap.html
  license: CC BY-SA 4.0
---

A **treap** stores pairs $(x, y)$ in a binary tree that is simultaneously

- a **binary search tree** by the key $x$ (left subtree: smaller keys, right subtree: larger), and
- a **heap** by the priority $y$ (a parent's priority is at least its children's).

If the priorities are all different, the shape of the tree is *uniquely determined* by the keys and priorities (the root is the element with the highest priority; the left and right parts are built recursively). If the priorities are chosen **randomly**, the tree has the same shape as a random binary search tree, so its expected depth is $O(\log n)$ whatever the insertion order. Hence the alternative name *randomized binary search tree*.

Everything reduces to two operations, **split** and **merge**.

> [!NOTE]
> Treaps shine when you need operations that `bisect` and `list` cannot do quickly: insert/delete by *position* in $O(\log n)$, reverse or rotate a subarray, or split and concatenate sequences. If you only need an ordered set of numbers with $O(\log n)$ insert, delete and $k$-th element, a [Fenwick tree](/theory/data-structures/fenwick-tree) over compressed values is simpler in Python.

## Node and helpers

```python
import random

class Node:
    __slots__ = ("key", "prio", "left", "right", "size")

    def __init__(self, key):
        self.key = key
        self.prio = random.random()
        self.left = None
        self.right = None
        self.size = 1

def size(t):
    return t.size if t else 0

def update(t):
    t.size = 1 + size(t.left) + size(t.right)
```

Keeping the `size` of every subtree makes order statistics possible.

## Split

`split(t, key)` cuts a treap into two: one with all keys $<$ `key` and one with keys $\ge$ `key`. If the root's key is smaller than `key`, the root and its left subtree go to the left result; we split the right subtree recursively and attach its left part as the root's new right child.

```python
def split(t, key):
    """Return (L, R): L has keys < key, R has keys >= key."""
    if t is None:
        return None, None
    if t.key < key:
        left, right = split(t.right, key)
        t.right = left
        update(t)
        return t, right
    left, right = split(t.left, key)
    t.left = right
    update(t)
    return left, t
```

## Merge

`merge(a, b)` joins two treaps, assuming all keys of `a` are smaller than all keys of `b`. The root with the higher priority stays the root; we merge the other treap into its appropriate child.

```python
def merge(a, b):
    if a is None:
        return b
    if b is None:
        return a
    if a.prio > b.prio:
        a.right = merge(a.right, b)
        update(a)
        return a
    b.left = merge(a, b.left)
    update(b)
    return b
```

Both run in expected $O(\log n)$ (they follow one root-to-leaf path).

## Insert, erase, search

**Insert** a key: split at the key and merge: `merge(merge(L, new), R)`. **Erase**: split out the range `[key, key+1)`, drop it, and merge the rest.

```python
def insert(t, key):
    left, right = split(t, key)
    return merge(merge(left, Node(key)), right)

def erase(t, key):
    left, rest = split(t, key)
    _, right = split(rest, key + 1)               # for integer keys; use a "greater than" split otherwise
    return merge(left, right)

def contains(t, key):
    while t:
        if key == t.key:
            return True
        t = t.left if key < t.key else t.right
    return False

def kth(t, k):
    """k-th smallest (0-indexed)."""
    while t:
        ls = size(t.left)
        if k < ls:
            t = t.left
        elif k == ls:
            return t.key
        else:
            k -= ls + 1
            t = t.right
    raise IndexError

def count_less(t, key):
    count = 0
    while t:
        if key <= t.key:
            t = t.left
        else:
            count += size(t.left) + 1
            t = t.right
    return count

def to_list(t):
    out, stack = [], []
    while stack or t:
        while t:
            stack.append(t)
            t = t.left
        t = stack.pop()
        out.append(t.key)
        t = t.right
    return out

def depth(t):
    return 0 if t is None else 1 + max(depth(t.left), depth(t.right))

# an ordered multiset compared against a sorted list under random operations
random.seed(1)
root, reference = None, []
for _ in range(2000):
    x = random.randint(0, 200)
    if random.random() < 0.6:
        root = insert(root, x)
        reference.append(x)
    elif x in reference:
        root = erase(root, x)                      # removes every copy of x
        reference = [v for v in reference if v != x]
    assert size(root) == len(reference)
reference.sort()
assert to_list(root) == reference
for i in (0, len(reference) // 2, len(reference) - 1):
    assert kth(root, i) == reference[i]
assert count_less(root, 100) == sum(1 for v in reference if v < 100)
assert contains(root, reference[3]) and not contains(root, 1000)
```

## The tree really is balanced

Inserting keys in sorted order would degrade a plain BST to a linked list. In a treap the depth stays logarithmic:

```python
root = None
for x in range(5000):                       # worst case for a plain BST
    root = insert(root, x)
assert to_list(root) == list(range(5000))
assert depth(root) < 60                     # about 2*ln(n) ~ 17 expected, far below 5000
```

## Union of two treaps

To merge two treaps with arbitrary keys, take the root with the higher priority, split the other treap by that root's key, and union recursively. The cost is $O(m \log(n/m))$ for sizes $m \le n$, better than inserting one by one.

```python
def union(a, b):
    if a is None:
        return b
    if b is None:
        return a
    if a.prio < b.prio:
        a, b = b, a
    left, right = split(b, a.key)
    a.left = union(a.left, left)
    a.right = union(a.right, right)
    update(a)
    return a

t1 = None
for x in range(0, 100, 2):
    t1 = insert(t1, x)
t2 = None
for x in range(1, 100, 2):
    t2 = insert(t2, x)
assert to_list(union(t1, t2)) == list(range(100))
```

## Implicit treap: a sequence with fast editing

An **implicit treap** does not store keys at all: the key of a node is its position in the in-order traversal, determined by the subtree sizes. Splitting is then "by index": `split(t, k)` returns the first $k$ elements and the rest. With a lazy flag we can also **reverse** a range in $O(\log n)$:

```python
class INode:
    __slots__ = ("val", "prio", "left", "right", "size", "rev", "total")

    def __init__(self, val):
        self.val = val
        self.prio = random.random()
        self.left = self.right = None
        self.size = 1
        self.rev = False
        self.total = val

def isize(t):
    return t.size if t else 0

def push(t):
    if t and t.rev:
        t.left, t.right = t.right, t.left
        if t.left:
            t.left.rev ^= True
        if t.right:
            t.right.rev ^= True
        t.rev = False

def iupdate(t):
    t.size = 1 + isize(t.left) + isize(t.right)
    t.total = t.val + (t.left.total if t.left else 0) + (t.right.total if t.right else 0)

def isplit(t, k):
    """First k elements -> left, the rest -> right."""
    if t is None:
        return None, None
    push(t)
    if isize(t.left) < k:
        left, right = isplit(t.right, k - isize(t.left) - 1)
        t.right = left
        iupdate(t)
        return t, right
    left, right = isplit(t.left, k)
    t.left = right
    iupdate(t)
    return left, t

def imerge(a, b):
    if a is None:
        return b
    if b is None:
        return a
    if a.prio > b.prio:
        push(a)
        a.right = imerge(a.right, b)
        iupdate(a)
        return a
    push(b)
    b.left = imerge(a, b.left)
    iupdate(b)
    return b

def ibuild(values):
    t = None
    for v in values:
        t = imerge(t, INode(v))
    return t

def ito_list(t):
    if t is None:
        return []
    push(t)
    return ito_list(t.left) + [t.val] + ito_list(t.right)

def reverse_range(t, l, r):
    """Reverse elements l..r-1 in O(log n)."""
    a, rest = isplit(t, l)
    b, c = isplit(rest, r - l)
    b.rev ^= True
    return imerge(imerge(a, b), c)

def range_sum(t, l, r):
    a, rest = isplit(t, l)
    b, c = isplit(rest, r - l)
    s = b.total if b else 0
    return imerge(imerge(a, b), c), s

def insert_at(t, pos, val):
    a, b = isplit(t, pos)
    return imerge(imerge(a, INode(val)), b)

def delete_at(t, pos):
    a, rest = isplit(t, pos)
    _, c = isplit(rest, 1)
    return imerge(a, c)

random.seed(2)
ref = list(range(30))
tr = ibuild(ref)
for _ in range(1500):
    op = random.randrange(4)
    if op == 0 and len(ref) > 1:
        l = random.randrange(len(ref))
        r = random.randint(l + 1, len(ref))
        tr = reverse_range(tr, l, r)
        ref[l:r] = ref[l:r][::-1]
    elif op == 1 and ref:
        l = random.randrange(len(ref))
        r = random.randint(l + 1, len(ref))
        tr, s = range_sum(tr, l, r)
        assert s == sum(ref[l:r])
    elif op == 2:
        pos, v = random.randint(0, len(ref)), random.randint(0, 99)
        tr = insert_at(tr, pos, v)
        ref.insert(pos, v)
    elif len(ref) > 1:
        pos = random.randrange(len(ref))
        tr = delete_at(tr, pos)
        del ref[pos]
    assert isize(tr) == len(ref)
assert ito_list(tr) == ref
```

One implicit treap can emulate a `list` with $O(\log n)$ insert/delete anywhere, range reversal, cyclic shift (split and swap the two parts), and range aggregates, exactly what a plain list cannot do quickly.

## Complexity

| Operation | Expected time |
|-----------|---------------|
| split, merge | $O(\log n)$ |
| insert, erase, search | $O(\log n)$ |
| $k$-th element, rank | $O(\log n)$ |
| union of sizes $m \le n$ | $O(m \log (n/m))$ |
| build from sorted keys | $O(n)$ with a stack, $O(n \log n)$ with repeated merges |
| depth | $O(\log n)$ with high probability |

## Practice problems

- [SPOJ - Ada and Aphids](http://www.spoj.com/problems/ADAAPHID/)
- [SPOJ - Ada and Harvest](http://www.spoj.com/problems/ADACROP/)
- [Codeforces - Radio Stations](http://codeforces.com/contest/762/problem/E)
- [SPOJ - Ghost Town](http://www.spoj.com/problems/COUNT1IT/)
- [SPOJ - Arrangement Validity](http://www.spoj.com/problems/IITWPC4D/)
- [SPOJ - All in One](http://www.spoj.com/problems/ALLIN1/)
- [Codeforces - Dog Show](http://codeforces.com/contest/847/problem/D)
- [Codeforces - Yet Another Array Queries Problem](http://codeforces.com/contest/863/problem/D)
- [SPOJ - Mean of Array](http://www.spoj.com/problems/MEANARR/)
- [SPOJ - TWIST](http://www.spoj.com/problems/TWIST/)
- [SPOJ - KOILINE](http://www.spoj.com/problems/KOILINE/)
- [CodeChef - The Prestige](https://www.codechef.com/problems/PRESTIGE)
- [Codeforces - T-Shirts](https://codeforces.com/contest/702/problem/F)
- [Codeforces - Wizards and Roads](https://codeforces.com/problemset/problem/167/D)
- [Codeforces - Yaroslav and Points](https://codeforces.com/contest/295/problem/E)
