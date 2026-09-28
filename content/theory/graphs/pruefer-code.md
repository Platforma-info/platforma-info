---
title: "Prüfer Code and Cayley's Formula"
section: Spanning trees
order: 6
difficulty: advanced
summary: "Encode a labeled tree as a sequence of n−2 numbers, decode it back in linear time, and derive Cayley's formula and the number of ways to connect a graph."
tags: [prüfer code, cayley formula, labeled trees, bijection, counting]
prerequisites: [graphs/graph-basics, math/binomial-coefficients]
source:
  title: "Prüfer code"
  url: https://cp-algorithms.com/graph/pruefer_code.html
  license: CC BY-SA 4.0
---

The **Prüfer code** (or Prüfer sequence) encodes a **labeled tree** with $n$ vertices as a sequence of $n - 2$ integers from $[0, n-1]$, in a one-to-one way. Storing trees this way is impractical, but the code is a very useful tool in **combinatorics**: it proves Cayley's formula for the number of spanning trees of a complete graph, and it counts the ways of connecting a graph. (We don't consider the single-vertex tree; it is a special case where several statements clash.)

## Building the code

Repeat $n - 2$ times: take the **leaf with the smallest number**, remove it from the tree, and write down the number of the vertex it was attached to. After $n-2$ steps two vertices remain.

With a heap of the current leaves this is $O(n\log n)$:

```python
import heapq

def pruefer_code_slow(n, edges):
    adj = [[] for _ in range(n)]
    for u, v in edges:
        adj[u].append(v)
        adj[v].append(u)
    degree = [len(a) for a in adj]
    leaves = [v for v in range(n) if degree[v] == 1]
    heapq.heapify(leaves)
    killed = [False] * n
    code = []
    for _ in range(n - 2):
        leaf = heapq.heappop(leaves)
        killed[leaf] = True
        neighbour = next(u for u in adj[leaf] if not killed[u])
        code.append(neighbour)
        degree[neighbour] -= 1
        if degree[neighbour] == 1:
            heapq.heappush(leaves, neighbour)
    return code

# the star with center 3 on 5 vertices: every removed leaf was attached to 3
assert pruefer_code_slow(5, [(0, 3), (1, 3), (2, 3), (4, 3)]) == [3, 3, 3]
# the path 0-1-2-3-4: leaves 0 then 1 then 2 are removed
assert pruefer_code_slow(5, [(0, 1), (1, 2), (2, 3), (3, 4)]) == [1, 2, 3]
```

### Linear time with a moving pointer

The smallest leaf can be maintained with a pointer `ptr`: the number of leaves never increases (removing a leaf either loses one leaf or exchanges it for a new one), and all vertices with numbers below `ptr` are either removed or not leaves. After removing the current leaf we either continue with its neighbour (if it just became a leaf and is smaller than `ptr`), or advance `ptr` to the next leaf. Since `ptr` only moves forward, everything is $O(n)$.

To find the neighbour that a leaf is attached to at its removal time, root the tree at $n-1$ (which is never removed) and use `parent[]`.

```python
def pruefer_code(n, edges):
    adj = [[] for _ in range(n)]
    for u, v in edges:
        adj[u].append(v)
        adj[v].append(u)
    parent = [-1] * n
    stack = [n - 1]
    while stack:                                          # root the tree at n - 1
        v = stack.pop()
        for u in adj[v]:
            if u != parent[v]:
                parent[u] = v
                stack.append(u)
    degree = [len(a) for a in adj]
    ptr = next(i for i in range(n) if degree[i] == 1)
    leaf = ptr
    code = []
    for _ in range(n - 2):
        nxt = parent[leaf]
        code.append(nxt)
        degree[nxt] -= 1
        if degree[nxt] == 1 and nxt < ptr:
            leaf = nxt
        else:
            ptr += 1
            while degree[ptr] != 1:
                ptr += 1
            leaf = ptr
    return code

assert pruefer_code(5, [(0, 1), (1, 2), (2, 3), (3, 4)]) == [1, 2, 3]
```

### Properties

- After building, two vertices remain; one of them is always the largest, $n-1$.
- Every vertex $v$ appears in the code exactly $\deg(v) - 1$ times (its degree drops by one each time its label is written, and it is removed at degree $1$). This is also true for the two vertices that remain.

## Restoring the tree

We know the degree of every vertex: `1 + (number of occurrences in the code)`. The first removed leaf is the smallest vertex of degree $1$, and it was attached to the first number of the code. Add this edge, decrease both degrees, and continue with the second number, and so on. In the end two vertices of degree $1$ remain; connect them.

With a heap of leaves it is $O(n\log n)$; with the moving pointer it is linear, exactly like the encoding:

```python
def pruefer_decode(code):
    n = len(code) + 2
    degree = [1] * n
    for v in code:
        degree[v] += 1
    ptr = 0
    while degree[ptr] != 1:
        ptr += 1
    leaf = ptr
    edges = []
    for v in code:
        edges.append((leaf, v))
        degree[v] -= 1
        if degree[v] == 1 and v < ptr:
            leaf = v
        else:
            ptr += 1
            while degree[ptr] != 1:
                ptr += 1
            leaf = ptr
    edges.append((leaf, n - 1))
    return edges

def pruefer_decode_slow(code):
    n = len(code) + 2
    degree = [1] * n
    for v in code:
        degree[v] += 1
    leaves = [v for v in range(n) if degree[v] == 1]
    heapq.heapify(leaves)
    edges = []
    for v in code:
        leaf = heapq.heappop(leaves)
        edges.append((leaf, v))
        degree[v] -= 1
        if degree[v] == 1:
            heapq.heappush(leaves, v)
    edges.append((heapq.heappop(leaves), n - 1))
    return edges

assert sorted(map(sorted, pruefer_decode([1, 2, 3]))) == [[0, 1], [1, 2], [2, 3], [3, 4]]
assert sorted(map(sorted, pruefer_decode([3, 3, 3]))) == [[0, 3], [1, 3], [2, 3], [3, 4]]
```

## The bijection

Every tree has a Prüfer code, and every sequence of $n-2$ numbers in $[0, n-1]$ decodes to a tree. So trees and codes are in **one-to-one correspondence**. We can check that exhaustively for small $n$: decode every possible code, check that we get a tree, that the encoding returns the same code, and that all trees are different.

```python
from itertools import product

def is_tree(n, edges):
    if len(edges) != n - 1:
        return False
    parent = list(range(n))

    def find(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x

    for u, v in edges:
        a, b = find(u), find(v)
        if a == b:
            return False
        parent[a] = b
    return True

for n in range(3, 8):
    seen = set()
    for code in product(range(n), repeat=n - 2):
        edges = pruefer_decode(list(code))
        assert is_tree(n, edges)
        assert sorted(map(sorted, edges)) == sorted(map(sorted, pruefer_decode_slow(list(code))))
        assert pruefer_code(n, edges) == pruefer_code_slow(n, edges) == list(code)
        seen.add(frozenset(frozenset(e) for e in edges))
    assert len(seen) == n ** (n - 2)                       # all trees appear exactly once
```

## Cayley's formula

The bijection immediately gives **Cayley's formula**: the number of spanning trees of the complete labeled graph $K_n$ is

$$
n^{\,n-2}
$$

because there are exactly $n^{n-2}$ sequences of $n-2$ numbers from $n$ possibilities, and each corresponds to one labeled tree, that is, to one spanning tree of $K_n$. The checks above enumerated exactly these.

## Number of ways to make a graph connected

Suppose a graph with $n$ vertices has $k$ connected components of sizes $s_1, \dots, s_k$. In how many ways can we add $k - 1$ edges to make it connected (the minimum number needed)?

Think of each component as a vertex of a complete graph on $k$ vertices, and count the trees on them. The only difference from Cayley's setting: an edge attached to component $i$ can choose any of its $s_i$ vertices as an endpoint, so every edge incident to $i$ multiplies the count by $s_i$.

If the degrees of the components in the resulting tree are $d_1, \dots, d_k$ (with $\sum d_i = 2k-2$), then component $i$ appears $d_i - 1$ times in the Prüfer code, which has length $k-2$. The number of codes with these multiplicities is the multinomial coefficient, so the number of ways for this degree sequence is

$$
s_1^{d_1}\cdots s_k^{d_k}\binom{k-2}{d_1-1,\dots,d_k-1}
$$

Summing over all degree sequences with $e_i = d_i - 1$ and using the **multinomial theorem**:

$$
\sum_{e_1+\dots+e_k = k-2} s_1^{e_1+1}\cdots s_k^{e_k+1}\binom{k-2}{e_1,\dots,e_k} = s_1 s_2\cdots s_k\,(s_1+\dots+s_k)^{k-2} = s_1 s_2\cdots s_k\cdot n^{k-2}
$$

This holds for $k = 1$ as well. When all components are single vertices ($s_i = 1$, $k = n$) it becomes Cayley's formula again.

```python
from itertools import combinations
from math import prod

def ways_to_connect(component_sizes):
    k, n = len(component_sizes), sum(component_sizes)
    return prod(component_sizes) * n ** (k - 2) if k >= 2 else 1

def ways_to_connect_brute(n, edges):
    """Count the sets of k - 1 new edges that make the graph connected."""
    existing = {frozenset(e) for e in edges}
    parent = list(range(n))

    def find(x, p):
        while p[x] != x:
            p[x] = p[p[x]]
            x = p[x]
        return x

    for u, v in edges:
        parent[find(u, parent)] = find(v, parent)
    k = len({find(x, parent) for x in range(n)})
    candidates = [(u, v) for u in range(n) for v in range(u + 1, n) if frozenset((u, v)) not in existing]
    count = 0
    for chosen in combinations(candidates, k - 1):
        p = parent[:]
        for u, v in chosen:
            p[find(u, p)] = find(v, p)
        if len({find(x, p) for x in range(n)}) == 1:
            count += 1
    return count

# components {0,1,2} (a path), {3,4} (an edge) and {5}: sizes 3, 2, 1 and n = 6
edges = [(0, 1), (1, 2), (3, 4)]
assert ways_to_connect([3, 2, 1]) == 3 * 2 * 1 * 6 ** 1 == 36
assert ways_to_connect_brute(6, edges) == 36
assert ways_to_connect([1, 1, 1, 1]) == 4 ** 2                                    # Cayley for n = 4
assert ways_to_connect_brute(4, []) == 16
assert ways_to_connect_brute(5, [(0, 1), (2, 3)]) == ways_to_connect([2, 2, 1])   # 2*2*1*5 = 20
```

## Practice problems

- [UVA #10843 - Anne's game](https://uva.onlinejudge.org/index.php?option=com_onlinejudge&Itemid=8&category=20&page=show_problem&problem=1784)
- [Timus #1069 - Prufer Code](http://acm.timus.ru/problem.aspx?space=1&num=1069)
- [Codeforces - Clues](http://codeforces.com/contest/156/problem/D)
- [Topcoder - TheCitiesAndRoadsDivTwo](https://community.topcoder.com/stat?c=problem_statement&pm=10774&rd=14146)
