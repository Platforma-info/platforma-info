---
title: "Lowest Common Ancestor: Euler Tour and Range Minimum"
section: Trees and LCA
order: 2
difficulty: advanced
summary: "Reduce LCA to a range-minimum query over the Euler tour of the tree, and answer it with a sparse table (O(1)), a segment tree (O(log n)), or sqrt-decomposition."
tags: [lca, euler tour, rmq, sparse table, segment tree]
prerequisites: [graphs/depth-first-search, data-structures/sparse-table]
source:
  title: "Lowest Common Ancestor - O(sqrt(N)) and O(log N) with O(N) preprocessing"
  url: https://cp-algorithms.com/graph/lca.html
  license: CC BY-SA 4.0
---

Given a rooted tree and queries $(v_1, v_2)$, find for each query the **lowest common ancestor** (LCA): the lowest vertex that lies on the path from the root to $v_1$ *and* on the path from the root to $v_2$. If $v_1$ is an ancestor of $v_2$, the answer is $v_1$. The LCA always lies on the shortest path between $v_1$ and $v_2$.

The [binary lifting](/theory/graphs/lca-binary-lifting) article solves it in $O(\log n)$ per query with $O(n\log n)$ memory. This article reduces the problem to a **range minimum query** (RMQ) and gets $O(1)$ or $O(\log n)$ queries with $O(n)$ or $O(n\log n)$ preprocessing.

## The Euler tour idea

Run a DFS from the root and write down the **Euler tour**: a vertex is appended when it is first entered and again after returning from each of its children. The list has $2n - 1$ entries. Also store for each vertex its first occurrence `first[v]` and its depth `height[v]`.

For the tree

```
        1
     /  |  \
    2   3   4
   / \       \
  5   6       7
```

the tour and the heights are

| vertices | 1 | 2 | 5 | 2 | 6 | 2 | 1 | 3 | 1 | 4 | 7 | 4 | 1 |
|---------|---|---|---|---|---|---|---|---|---|---|---|---|---|
| heights | 1 | 2 | 3 | 2 | 3 | 2 | 1 | 2 | 1 | 2 | 3 | 2 | 1 |

Take the query $(6, 4)$. Between the first visit of $6$ and the first visit of $4$ the tour visits $[6, 2, 1, 3, 1, 4]$. The vertex with the smallest height, $1$, is the LCA.

Why: the tour segment between the two first occurrences essentially walks the shortest path between $v_1$ and $v_2$, plus complete excursions into subtrees hanging off that path. The excursions contain only vertices that are deeper than the path vertex they hang from, so the highest vertex in the segment is the top of the path, which is the LCA.

**So an LCA query is the vertex of minimum height in `euler[first[v1] .. first[v2]]`.**

## Building the tour

An iterative DFS avoids Python's recursion limit:

```python
def euler_tour(adj, root=0):
    n = len(adj)
    euler, first, height = [], [-1] * n, [0] * n
    visited = [False] * n
    visited[root] = True
    stack = [(root, 0)]                        # (vertex, index of the next neighbour to explore)
    first[root] = 0
    euler.append(root)
    while stack:
        v, i = stack.pop()
        if i < len(adj[v]):
            stack.append((v, i + 1))
            u = adj[v][i]
            if not visited[u]:
                visited[u] = True
                height[u] = height[v] + 1
                first[u] = len(euler)
                euler.append(u)
                stack.append((u, 0))
        elif stack:                            # finished v: record its parent again
            euler.append(stack[-1][0])
    return euler, first, height

# the example tree (vertices renumbered from 0): 0-1, 0-2, 0-3, 1-4, 1-5, 3-6
adj = [[1, 2, 3], [0, 4, 5], [0], [0, 6], [1], [1], [3]]
euler, first, height = euler_tour(adj)
assert euler == [0, 1, 4, 1, 5, 1, 0, 2, 0, 3, 6, 3, 0]
assert [height[v] for v in euler] == [0, 1, 2, 1, 2, 1, 0, 1, 0, 1, 2, 1, 0]
```

## Answering queries with a sparse table: $O(1)$

Since the array never changes, a [sparse table](/theory/data-structures/sparse-table) is the natural choice: $O(n\log n)$ preprocessing, $O(1)$ per query. It stores `(height, vertex)` pairs so that `min` picks the shallowest vertex.

```python
class LCA:
    def __init__(self, adj, root=0):
        euler, self.first, height = euler_tour(adj, root)
        self.height = height
        base = [(height[v], v) for v in euler]
        self.table = [base]
        j = 1
        while (1 << j) <= len(base):
            prev = self.table[-1]
            half = 1 << (j - 1)
            self.table.append([min(prev[i], prev[i + half]) for i in range(len(base) - (1 << j) + 1)])
            j += 1

    def query(self, u, v):
        l, r = self.first[u], self.first[v]
        if l > r:
            l, r = r, l
        j = (r - l + 1).bit_length() - 1
        return min(self.table[j][l], self.table[j][r - (1 << j) + 1])[1]

lca = LCA(adj)
assert lca.query(5, 3) == 0        # vertices 6 and 4 of the picture
assert lca.query(4, 5) == 1 and lca.query(4, 1) == 1 and lca.query(6, 6) == 6
```

## A segment tree: $O(\log n)$ per query, $O(n)$ memory

If memory matters, a bottom-up [segment tree](/theory/data-structures/segment-tree) over the same array has size $O(n)$ and answers in $O(\log n)$:

```python
class LCASegmentTree:
    def __init__(self, adj, root=0):
        euler, self.first, height = euler_tour(adj, root)
        self.size = len(euler)
        self.tree = [None] * self.size + [(height[v], v) for v in euler]
        for i in range(self.size - 1, 0, -1):
            self.tree[i] = min(self.tree[2 * i], self.tree[2 * i + 1])

    def query(self, u, v):
        l, r = self.first[u], self.first[v]
        if l > r:
            l, r = r, l
        l += self.size
        r += self.size + 1
        best = (float("inf"), -1)
        while l < r:
            if l & 1:
                best = min(best, self.tree[l])
                l += 1
            if r & 1:
                r -= 1
                best = min(best, self.tree[r])
            l >>= 1
            r >>= 1
        return best[1]

seg = LCASegmentTree(adj)
assert seg.query(5, 3) == 0 and seg.query(4, 5) == 1
```

## Checking against the definition

The definition: climb from the deeper vertex until both have the same depth, then climb together. We compare on many random trees for all pairs of vertices:

```python
import random

def random_tree(n, rnd):
    adj = [[] for _ in range(n)]
    parent = [-1] * n
    for v in range(1, n):
        p = rnd.randrange(v) if rnd.random() < 0.7 else v - 1       # a mix of bushy and path-like trees
        parent[v] = p
        adj[p].append(v)
        adj[v].append(p)
    return adj, parent

def lca_naive(parent, depth, u, v):
    while depth[u] > depth[v]:
        u = parent[u]
    while depth[v] > depth[u]:
        v = parent[v]
    while u != v:
        u, v = parent[u], parent[v]
    return u

rnd = random.Random(1)
for _ in range(150):
    n = rnd.randint(1, 40)
    adj, parent = random_tree(n, rnd)
    depth = [0] * n
    for v in range(1, n):
        depth[v] = depth[parent[v]] + 1
    fast, small = LCA(adj), LCASegmentTree(adj)
    for u in range(n):
        for v in range(n):
            expected = lca_naive(parent, depth, u, v)
            assert fast.query(u, v) == small.query(u, v) == expected
```

## Other RMQ structures

The reduction works with any RMQ structure:

- [Sqrt-decomposition](/theory/data-structures/sqrt-decomposition): $O(n)$ preprocessing, $O(\sqrt n)$ per query.
- Segment tree: $O(n)$ preprocessing, $O(\log n)$ per query.
- Sparse table: $O(n\log n)$ preprocessing, $O(1)$ per query.
- The [Farach-Colton and Bender algorithm](/theory/graphs/lca-farach-colton-bender): $O(n)$ preprocessing and $O(1)$ per query, using the fact that neighbours in the height array differ by exactly $1$.

## Practice problems

- [SPOJ: LCA](http://www.spoj.com/problems/LCA/)
- [SPOJ: DISQUERY](http://www.spoj.com/problems/DISQUERY/)
- [TIMUS: 1471. Distance in the Tree](http://acm.timus.ru/problem.aspx?space=1&num=1471)
- [CODEFORCES: Design Tutorial: Inverse the Problem](http://codeforces.com/problemset/problem/472/D)
- [CODECHEF: Lowest Common Ancestor](https://www.codechef.com/problems/TALCA)
- [SPOJ - Lowest Common Ancestor](http://www.spoj.com/problems/LCASQ/)
- [SPOJ - Ada and Orange Tree](http://www.spoj.com/problems/ADAORANG/)
- [DevSkill - Motoku (archived)](http://web.archive.org/web/20200922005503/https://devskill.com/CodingProblems/ViewProblem/141)
- [UVA 12655 - Trucks](https://uva.onlinejudge.org/index.php?option=onlinejudge&page=show_problem&problem=4384)
- [Codechef - Pishty and Tree](https://www.codechef.com/problems/PSHTTR)
- [UVA - 12533 - Joining Couples](https://uva.onlinejudge.org/index.php?option=com_onlinejudge&Itemid=8&category=441&page=show_problem&problem=3978)
- [Codechef - So close yet So Far](https://www.codechef.com/problems/CLOSEFAR)
- [Codeforces - Drivers Dissatisfaction](http://codeforces.com/contest/733/problem/F)
- [UVA 11354 - Bond](https://uva.onlinejudge.org/index.php?option=com_onlinejudge&Itemid=8&page=show_problem&problem=2339)
- [SPOJ - Query on a tree II](http://www.spoj.com/problems/QTREE2/)
- [Codeforces - Best Edge Weight](http://codeforces.com/contest/828/problem/F)
- [Codeforces - Misha, Grisha and Underground](http://codeforces.com/contest/832/problem/D)
- [SPOJ - Nlogonian Tickets](http://www.spoj.com/problems/NTICKETS/)
- [Codeforces - Rowena Rawenclaws Diadem](http://codeforces.com/contest/855/problem/D)
