---
title: "Kruskal's Algorithm: The Simplest Implementation and Its Proof"
section: Spanning trees
order: 3
difficulty: intermediate
summary: "Properties of minimum spanning trees, Kruskal's algorithm with a plain tree-id array in O(M log N + N²), and the exchange-argument proof of correctness."
tags: [minimum spanning tree, kruskal, exchange argument, bottleneck, maximum spanning tree]
prerequisites: [graphs/kruskal-mst]
source:
  title: "Minimum spanning tree - Kruskal's algorithm"
  url: https://cp-algorithms.com/graph/mst_kruskal.html
  license: CC BY-SA 4.0
---

Given a weighted undirected graph, a **minimum spanning tree** (MST) is a spanning tree (a subtree connecting all vertices) with the smallest possible sum of edge weights. The [main Kruskal article](/theory/graphs/kruskal-mst) uses a disjoint set union; this one presents the simplest possible implementation, more properties of MSTs, and the proof that Kruskal's algorithm is correct.

## Properties of the MST

- The MST is **unique** if all edge weights are distinct. Otherwise there can be several MSTs (an algorithm outputs one of them).
- If all weights are positive, the MST is also the spanning tree with the **minimum product** of weights (replace each weight by its logarithm; the order of the weights is unchanged).
- The **maximum edge weight** in an MST is the smallest possible among all spanning trees (the *bottleneck* property). This follows from the correctness of Kruskal's algorithm.
- A **maximum spanning tree** is obtained by negating all weights and running any MST algorithm.

## The algorithm

Kruskal's algorithm (1956) starts with all vertices isolated, a forest of single-vertex trees, and merges trees: sort the edges by weight and go through them in that order; if the two endpoints of the edge belong to **different trees**, join the trees and add the edge to the answer.

## The simplest implementation

Keep for each vertex the id of its tree in `tree_id[]`. Checking whether an edge joins two different trees is $O(1)$. Merging two trees is a pass over `tree_id[]` that relabels one of them: $O(N)$. There are only $N-1$ merges, so the total is

$$
O(M\log M + N^2)
$$

```python
def kruskal_simple(n, edges):
    """edges: (u, v, weight). Returns (total weight, chosen edges) of a minimum spanning forest."""
    tree_id = list(range(n))
    total, chosen = 0, []
    for u, v, w in sorted(edges, key=lambda e: e[2]):
        if tree_id[u] != tree_id[v]:
            total += w
            chosen.append((u, v, w))
            old, new = tree_id[u], tree_id[v]
            for i in range(n):                        # merge the two trees: relabel one of them
                if tree_id[i] == old:
                    tree_id[i] = new
    return total, chosen

edges = [(0, 1, 4), (0, 2, 1), (1, 2, 2), (1, 3, 5), (2, 3, 8)]
total, chosen = kruskal_simple(4, edges)
assert total == 8 and sorted(chosen) == [(0, 2, 1), (1, 2, 2), (1, 3, 5)]
```

For a disconnected graph the same code produces a minimum spanning **forest** (one tree per component).

## Proof of correctness

**It builds a spanning tree.** If the graph is connected, so is the result: otherwise there would be two components of the result joined by some edge of the graph, but Kruskal would have taken that edge when it came to it, as the tree ids differ. There are no cycles, because an edge joining two vertices of one tree is never taken.

**It is minimum.** We prove by induction: *if $F$ is the set of chosen edges at any moment, some MST contains $F$.* At the start, $F = \varnothing$ is contained in every MST. Let $F$ be contained in an MST $T$ and let $e$ be the next edge of the algorithm.

- If $e$ closes a cycle in $F$, it is skipped and nothing changes.
- If $e \in T$, then $F + e \subseteq T$.
- Otherwise $T + e$ contains a cycle $C$, which must contain an edge $f \notin F$ (since $F + e$ has no cycle). Then $T - f + e$ is also a spanning tree. The weight of $f$ is not smaller than that of $e$: otherwise Kruskal would have considered $f$ before $e$, and $f$ would have been taken, since $f$ does not close a cycle with the edges of $F$ (both are in $T$). And it is not larger either, since then $T - f + e$ would be lighter than the MST $T$. So $w(e) = w(f)$ and $T - f + e$ is an MST that contains $F + e$.

At the end, $F$ is a spanning tree contained in an MST, hence it is an MST.

## Testing

For small graphs the minimum can be found by trying all subsets of $N-1$ edges and keeping those that form a spanning tree. We verify the algorithm and three of the properties above against this brute force:

```python
import math
import random
from itertools import combinations

def spanning_trees(n, edges):
    """All spanning trees of a small connected multigraph, as tuples of edge indices."""
    for subset in combinations(range(len(edges)), n - 1):
        parent = list(range(n))

        def find(x):
            while parent[x] != x:
                parent[x] = parent[parent[x]]
                x = parent[x]
            return x

        ok = True
        for i in subset:
            a, b = find(edges[i][0]), find(edges[i][1])
            if a == b:
                ok = False
                break
            parent[a] = b
        if ok:
            yield subset

def is_connected(n, edges):
    parent = list(range(n))

    def find(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x

    for u, v, _ in edges:
        parent[find(u)] = find(v)
    return len({find(x) for x in range(n)}) == 1

rnd = random.Random(4)
tested = 0
while tested < 300:
    n = rnd.randint(2, 6)
    edges = [(rnd.randrange(n), rnd.randrange(n), rnd.randint(1, 6)) for _ in range(rnd.randint(n - 1, 9))]
    edges = [e for e in edges if e[0] != e[1]]
    if not is_connected(n, edges):
        continue
    tested += 1
    trees = list(spanning_trees(n, edges))
    weights = [sum(edges[i][2] for i in t) for t in trees]
    total, chosen = kruskal_simple(n, edges)
    assert total == min(weights)                                              # minimum weight
    bottleneck = max(w for _, _, w in chosen)
    assert bottleneck == min(max(edges[i][2] for i in t) for t in trees)      # smallest possible maximum edge
    log_product = sum(math.log(w) for _, _, w in chosen)
    assert abs(log_product - min(sum(math.log(edges[i][2]) for i in t) for t in trees)) < 1e-9   # minimum product
    negated, _ = kruskal_simple(n, [(u, v, -w) for u, v, w in edges])
    assert -negated == max(weights)                                           # maximum spanning tree
```

The simple version is fine for small $N$ (say $N \le 2000$); for large graphs use the [DSU version](/theory/graphs/kruskal-mst) with $O(M\log N)$ total time.

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
