---
title: "Minimum Spanning Tree: Kruskal's Algorithm"
section: Spanning trees
order: 1
difficulty: intermediate
summary: "Connect all vertices at the smallest total cost by sorting edges and joining components with a disjoint set union, in O(m log m)."
tags: [mst, kruskal, dsu, greedy, spanning tree]
prerequisites: [data-structures/disjoint-set-union]
source:
  title: Minimum spanning tree - Kruskal with Disjoint Set Union
  url: https://cp-algorithms.com/graph/mst_kruskal_with_dsu.html
  license: CC BY-SA 4.0
---

Given a connected, weighted, undirected graph, a **spanning tree** is a subset of edges that connects all $n$ vertices without a cycle (so it has exactly $n-1$ edges). A **minimum spanning tree** (MST) is a spanning tree of the smallest possible total weight. Typical use: connect all cities with the cheapest road network, cable a set of offices, cluster points.

## Kruskal's algorithm

A greedy algorithm:

1. Sort all edges by weight, from smallest to largest.
2. Go through them in that order; **add** an edge if it connects two vertices that are not yet connected (it won't form a cycle), otherwise skip it.

The correctness rests on the **cut property**: for any partition of the vertices into two groups, the lightest edge crossing the partition belongs to *some* MST. When Kruskal considers an edge that joins two different current components, that edge is the lightest one leaving one of them, so it is safe to take.

To test "are $u$ and $v$ already connected?" quickly, use a [disjoint set union](/theory/data-structures/disjoint-set-union).

```python
def kruskal(n, edges):
    """edges: list of (weight, u, v). Return (total_weight, list_of_chosen_edges)."""
    parent = list(range(n))
    size = [1] * n

    def find(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x

    total = 0
    chosen = []
    for w, u, v in sorted(edges):
        ru, rv = find(u), find(v)
        if ru == rv:
            continue                          # would close a cycle
        if size[ru] < size[rv]:
            ru, rv = rv, ru
        parent[rv] = ru
        size[ru] += size[rv]
        total += w
        chosen.append((u, v, w))
        if len(chosen) == n - 1:
            break
    return total, chosen

edges = [(7, 0, 1), (5, 0, 3), (8, 1, 2), (9, 1, 3), (7, 1, 4), (5, 2, 4), (15, 3, 4), (6, 3, 5), (8, 4, 5), (9, 4, 6), (11, 5, 6)]
total, chosen = kruskal(7, edges)
assert total == 39 and len(chosen) == 6
```

**Complexity.** Sorting costs $O(m \log m) = O(m \log n)$; the DSU operations cost $O(m\,\alpha(n))$. The sort dominates.

If the graph is **disconnected**, the algorithm returns a *minimum spanning forest*: fewer than $n - 1$ edges. Check `len(chosen)` to detect that.

```python
total, chosen = kruskal(4, [(1, 0, 1), (2, 2, 3)])
assert len(chosen) == 2 and total == 3            # a forest with 2 components: 4 - 2 edges
```

## Checking against a brute force

For small graphs enumerate all subsets of $n-1$ edges, keep those that form a spanning tree, take the cheapest:

```python
from itertools import combinations
import random

def is_spanning_tree(n, chosen):
    parent = list(range(n))

    def find(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x

    for _, u, v in chosen:
        ru, rv = find(u), find(v)
        if ru == rv:
            return False
        parent[ru] = rv
    return True

def mst_brute(n, edges):
    best = None
    for subset in combinations(edges, n - 1):
        if is_spanning_tree(n, subset):
            w = sum(e[0] for e in subset)
            best = w if best is None else min(best, w)
    return best

random.seed(2)
for _ in range(200):
    n = random.randint(2, 6)
    # ensure connectivity with a random path, then add extra edges
    perm = list(range(n))
    random.shuffle(perm)
    es = [(random.randint(1, 9), perm[i], perm[i + 1]) for i in range(n - 1)]
    es += [(random.randint(1, 9), random.randrange(n), random.randrange(n)) for _ in range(random.randint(0, 5))]
    es = [(w, u, v) for w, u, v in es if u != v]
    assert kruskal(n, es)[0] == mst_brute(n, es)
```

## Properties and applications

- If all edge weights are **distinct**, the MST is unique. Otherwise there may be several with the same total weight.
- The MST minimizes the **maximum** edge on the path between any two vertices (the *bottleneck* path).
- **Single-linkage clustering**: stop Kruskal when $k$ components remain to obtain $k$ clusters.
- **Maximum spanning tree**: sort edges in decreasing order.
- **Second-best MST**: try replacing each non-tree edge into the tree (needs [LCA](/theory/graphs/lca-binary-lifting) with path maxima).

```python
def k_clusters(n, edges, k):
    """Split n points into k groups by stopping Kruskal early; return the group id of each vertex."""
    parent = list(range(n))

    def find(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x

    components = n
    for w, u, v in sorted(edges):
        if components == k:
            break
        ru, rv = find(u), find(v)
        if ru != rv:
            parent[ru] = rv
            components -= 1
    roots = sorted({find(x) for x in range(n)})
    return [roots.index(find(x)) for x in range(n)]

groups = k_clusters(6, [(1, 0, 1), (1, 1, 2), (2, 3, 4), (10, 2, 3), (1, 4, 5)], 2)
assert groups[0] == groups[1] == groups[2] and groups[3] == groups[4] == groups[5] and groups[0] != groups[3]
```

For dense graphs, [Prim's algorithm](/theory/graphs/prim-mst) can be better.

## Practice problems

- [SPOJ - Koicost](http://www.spoj.com/problems/KOICOST/)
- [SPOJ - MaryBMW](http://www.spoj.com/problems/MARYBMW/)
- [Codechef - Fullmetal Alchemist](https://www.codechef.com/ICL2016/problems/ICL16A)
- [Codeforces - Edges in MST](http://codeforces.com/contest/160/problem/D)
- [UVA 12176 - Bring Your Own Horse](https://uva.onlinejudge.org/index.php?option=com_onlinejudge&Itemid=8&page=show_problem&problem=3328)
- [UVA 10600 - ACM Contest and Blackout](https://uva.onlinejudge.org/index.php?option=com_onlinejudge&Itemid=8&page=show_problem&problem=1541)
- [UVA 10724 - Road Construction](https://uva.onlinejudge.org/index.php?option=onlinejudge&page=show_problem&problem=1665)
- [Hackerrank - Roads in HackerLand](https://www.hackerrank.com/contests/june-world-codesprint/challenges/johnland/problem)
- [UVA 11710 - Expensive subway](https://uva.onlinejudge.org/index.php?option=com_onlinejudge&Itemid=8&page=show_problem&problem=2757)
- [Codechef - Chefland and Electricity](https://www.codechef.com/problems/CHEFELEC)
- [UVA 10307 - Killing Aliens in Borg Maze](https://uva.onlinejudge.org/index.php?option=com_onlinejudge&Itemid=8&page=show_problem&problem=1248)
- [Codeforces - Flea](http://codeforces.com/problemset/problem/32/C)
- [Codeforces - Igon in Museum](http://codeforces.com/problemset/problem/598/D)
- [Codeforces - Hongcow Builds a Nation](http://codeforces.com/problemset/problem/744/A)
- [UVA - 908 - Re-connecting Computer Sites](https://uva.onlinejudge.org/index.php?option=com_onlinejudge&Itemid=8&page=show_problem&problem=849)
- [UVA 1208 - Oreon](https://uva.onlinejudge.org/index.php?option=com_onlinejudge&Itemid=8&page=show_problem&problem=3649)
- [UVA 1235 - Anti Brute Force Lock](https://uva.onlinejudge.org/index.php?option=com_onlinejudge&Itemid=8&page=show_problem&problem=3676)
- [UVA 10034 - Freckles](https://uva.onlinejudge.org/index.php?option=com_onlinejudge&Itemid=8&page=show_problem&problem=975)
- [UVA 11228 - Transportation system](https://uva.onlinejudge.org/index.php?option=onlinejudge&page=show_problem&problem=2169)
- [UVA 11631 - Dark roads](https://uva.onlinejudge.org/index.php?option=com_onlinejudge&Itemid=8&page=show_problem&problem=2678)
- [UVA 11733 - Airports](https://uva.onlinejudge.org/index.php?option=com_onlinejudge&Itemid=8&page=show_problem&problem=2833)
- [UVA 11747 - Heavy Cycle Edges](https://uva.onlinejudge.org/index.php?option=com_onlinejudge&Itemid=8&page=show_problem&problem=2847)
- [SPOJ - Blinet](http://www.spoj.com/problems/BLINNET/)
- [SPOJ - Help the Old King](http://www.spoj.com/problems/IITKWPCG/)
- [Codeforces - Hierarchy](http://codeforces.com/contest/17/problem/B)
- [SPOJ - Modems](https://www.spoj.com/problems/EC_MODE/)
- [CSES - Road Reparation](https://cses.fi/problemset/task/1675)
- [CSES - Road Construction](https://cses.fi/problemset/task/1676)
