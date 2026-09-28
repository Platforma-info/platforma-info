---
title: "Counting Labeled Graphs"
section: Tasks
order: 3
difficulty: intermediate
summary: "Count all labeled graphs, the connected ones, and those with exactly k components, by the standard 'root vertex' recurrences."
tags: [labeled graphs, connected graphs, counting, recurrences]
prerequisites: [combinatorics/binomial-coefficients]
source:
  title: "Counting labeled graphs"
  url: https://cp-algorithms.com/combinatorics/counting_labeled_graphs.html
  license: CC BY-SA 4.0
---

A **labeled graph** has its $n$ vertices numbered $1..n$; two graphs are different if their edge sets differ (even if they are isomorphic). Edges are undirected, with no loops and no multiple edges.

## All labeled graphs

There are $\binom{n}{2}$ possible edges, and each is either present or absent, so

$$
G_n = 2^{\binom{n}{2}} = 2^{n(n-1)/2}
$$

## Connected labeled graphs

Let $C_n$ be the number of **connected** labeled graphs on $n$ vertices. Count the disconnected ones instead, and *root* every graph, i.e. distinguish one vertex (this multiplies the count by $n$, which we divide out at the end).

In a disconnected rooted graph, the root lies in a connected component of some size $k \in \{1, \dots, n-1\}$. To build such a graph:

- choose which $k$ vertices form the root's component: $\binom{n}{k}$;
- connect them in one of $C_k$ ways;
- choose which of them is the root: $k$ ways;
- arrange the remaining $n - k$ vertices arbitrarily: $G_{n-k}$ ways.

So

$$
C_n = G_n - \frac{1}{n}\sum_{k=1}^{n-1} k \binom{n}{k}\, C_k\, G_{n-k}
$$

```python
from math import comb

def labeled_graphs(n):
    return 2 ** (n * (n - 1) // 2)

def connected_graphs(limit):
    C = [0, 1]
    for n in range(2, limit + 1):
        disconnected_rooted = sum(k * comb(n, k) * C[k] * labeled_graphs(n - k) for k in range(1, n))
        C.append(labeled_graphs(n) - disconnected_rooted // n)
    return C

C = connected_graphs(8)
assert C[1:8] == [1, 1, 4, 38, 728, 26704, 1866256]
assert [labeled_graphs(n) for n in range(1, 6)] == [1, 2, 8, 64, 1024]
```

The division by $n$ is exact, since every disconnected graph is counted exactly $n$ times among the rooted ones.

## Graphs with exactly $k$ components

Let $D[n][k]$ be the number of labeled graphs on $n$ vertices with exactly $k$ connected components. Look at the component containing the **last** vertex (vertex $n$): if it has $s$ vertices, the other $s-1$ are chosen from the remaining $n-1$ in $\binom{n-1}{s-1}$ ways, they can be connected in $C_s$ ways, and the rest $n-s$ vertices form a graph with $k-1$ components:

$$
D[n][k] = \sum_{s=1}^{n} \binom{n-1}{s-1}\, C_s\, D[n-s][k-1], \qquad D[0][0] = 1
$$

```python
def components_table(n_max, k_max):
    C = connected_graphs(n_max)
    D = [[0] * (k_max + 1) for _ in range(n_max + 1)]
    D[0][0] = 1
    for n in range(1, n_max + 1):
        for k in range(1, k_max + 1):
            D[n][k] = sum(comb(n - 1, s - 1) * C[s] * D[n - s][k - 1] for s in range(1, n + 1))
    return D

D = components_table(6, 6)
assert D[3][1] == 4 and D[3][2] == 3 and D[3][3] == 1                    # 4 + 3 + 1 = 8 graphs on 3 vertices
assert all(sum(D[n][k] for k in range(1, n + 1)) == labeled_graphs(n) for n in range(1, 7))
```

The number of graphs with $k$ components sums over $k$ to all $2^{\binom{n}{2}}$ graphs, a consistency check.

## Testing by exhaustive enumeration

For $n \le 5$ enumerate all $2^{\binom n2}$ edge subsets and count components with a union-find:

```python
from itertools import combinations
from collections import Counter

def brute_component_counts(n):
    edges = list(combinations(range(n), 2))
    counts = Counter()
    for mask in range(1 << len(edges)):
        parent = list(range(n))

        def find(x):
            while parent[x] != x:
                parent[x] = parent[parent[x]]
                x = parent[x]
            return x

        for i, (u, v) in enumerate(edges):
            if mask >> i & 1:
                parent[find(u)] = find(v)
        counts[len({find(x) for x in range(n)})] += 1
    return counts

for n in range(1, 6):
    counts = brute_component_counts(n)
    assert counts[1] == C[n]
    for k in range(1, n + 1):
        assert counts[k] == D[n][k]
```

## Related counts

- **Labeled trees** on $n$ vertices: $n^{n-2}$ (Cayley's formula; see [Prüfer code](/theory/graphs/pruefer-code)).
- **Labeled forests**, **labeled graphs with $m$ edges** ($\binom{\binom n2}{m}$), **bipartite** and **Eulerian** labeled graphs have similar exponential-generating-function derivations.
- The recurrences above are the "logarithm" relation between the exponential generating functions of all graphs and of connected graphs: $\sum C_n x^n/n! = \ln \sum G_n x^n/n!$. With [polynomial logarithm](/theory/math/polynomial-operations) this gives $C_1, \dots, C_n$ in $O(n \log n)$.

```python
def connected_via_log(limit, mod):
    """C_n mod p from the EGF relation, using the power-series logarithm from the polynomial article (naive O(n^2))."""
    fact = [1]
    for i in range(1, limit + 1):
        fact.append(fact[-1] * i % mod)
    inv_fact = [pow(f, mod - 2, mod) for f in fact]
    g = [labeled_graphs(n) % mod * inv_fact[n] % mod for n in range(limit + 1)]     # EGF coefficients of G
    # ln g by the relation g' = h' g  ->  n*g[n] = sum_{k=1..n} k*h[k]*g[n-k]
    h = [0] * (limit + 1)
    for n in range(1, limit + 1):
        acc = n * g[n] - sum(k * h[k] % mod * g[n - k] for k in range(1, n))
        h[n] = acc % mod * pow(n, mod - 2, mod) % mod
    return [h[n] * fact[n] % mod for n in range(limit + 1)]

MOD = 998244353
assert connected_via_log(8, MOD)[1:8] == [c % MOD for c in C[1:8]]
```
