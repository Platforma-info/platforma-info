---
title: "Kuhn's Algorithm: Maximum Bipartite Matching"
section: Flows and matchings
order: 2
difficulty: advanced
summary: "Pair up as many left and right vertices as possible using augmenting paths, in O(V·E)."
tags: [matching, bipartite, augmenting path, kuhn]
prerequisites: [graphs/bipartite-check, graphs/breadth-first-search]
source:
  title: "Kuhn's Algorithm for Maximum Bipartite Matching"
  url: https://cp-algorithms.com/graph/kuhn_maximum_bipartite_matching.html
  license: CC BY-SA 4.0
---

A **matching** in a graph is a set of edges no two of which share a vertex. A **maximum matching** has the largest possible number of edges. In a bipartite graph this is the classic assignment problem: workers to jobs, students to projects, tiles to positions.

We are given a bipartite graph with a left part of $n_1$ vertices, a right part of $n_2$ vertices, and edges between them. The goal is the largest set of edges such that each vertex is used at most once.

## Augmenting paths and Berge's lemma

Given a matching $M$, a vertex is *free* if it is not matched. An **alternating path** alternates between edges outside $M$ and edges in $M$. An **augmenting path** is an alternating path that starts and ends at *free* vertices.

If we flip the edges along an augmenting path (unmatched become matched and vice versa), the matching grows by exactly one edge. The path has one more non-matching edge than matching edges.

> **Berge's lemma.** A matching is maximum if and only if there is no augmenting path with respect to it.

This gives the algorithm: repeatedly look for an augmenting path and flip it, until none exists.

## Kuhn's algorithm

Consider the left vertices one at a time. For the current vertex $s$ try to find an augmenting path that starts at $s$: search alternately from left vertices to right vertices along any edge, and from a right vertex back to its *matched* left partner; the first time we reach a right vertex that is free, we have found the path.

The BFS below explores at most every edge once per left vertex, so the total is $O(n_1 \cdot m)$, and it never recurses, so it is safe for large graphs:

```python
from collections import deque

def max_bipartite_matching(n_left, n_right, adj):
    """adj[v] = right neighbours of left vertex v. Return (size, match_left, match_right)."""
    match_left = [-1] * n_left
    match_right = [-1] * n_right
    size = 0
    for s in range(n_left):
        came_from = [-1] * n_right                  # left vertex from which a right vertex was reached
        seen = [False] * n_right
        queue = deque([s])
        end = -1
        while queue and end == -1:
            v = queue.popleft()
            for u in adj[v]:
                if seen[u]:
                    continue
                seen[u] = True
                came_from[u] = v
                if match_right[u] == -1:            # a free right vertex: augmenting path found
                    end = u
                    break
                queue.append(match_right[u])        # continue from its current partner
        if end == -1:
            continue
        u = end                                     # flip the edges along the path
        while u != -1:
            v = came_from[u]
            previous = match_left[v]
            match_left[v] = u
            match_right[u] = v
            u = previous
        size += 1
    return size, match_left, match_right

# 3 workers, 3 jobs
adj = [[0, 1], [0], [1, 2]]
size, ml, mr = max_bipartite_matching(3, 3, adj)
assert size == 3
assert ml == [1, 0, 2] and sorted(mr) == [0, 1, 2]
```

A useful optimization: first run a greedy pass that matches each left vertex to any free neighbour; it costs $O(m)$ and often removes most of the work.

## Testing against brute force

The maximum matching size equals the best value over all ways to assign left vertices to distinct right neighbours (or skip). For tiny graphs a bitmask DP does it:

```python
import random
from functools import lru_cache

def matching_brute(n_left, n_right, adj):
    @lru_cache(maxsize=None)
    def best(v, used):
        if v == n_left:
            return 0
        result = best(v + 1, used)                      # leave v unmatched
        for u in adj[v]:
            if not used >> u & 1:
                result = max(result, 1 + best(v + 1, used | 1 << u))
        return result
    return best(0, 0)

random.seed(4)
for _ in range(500):
    nl, nr = random.randint(1, 6), random.randint(1, 6)
    g = [sorted({random.randrange(nr) for _ in range(random.randint(0, 4))}) for _ in range(nl)]
    size, ml, mr = max_bipartite_matching(nl, nr, g)
    assert size == matching_brute(nl, nr, tuple(map(tuple, g)))
    # the reported matching is valid
    assert sum(x != -1 for x in ml) == size == sum(x != -1 for x in mr)
    for v, u in enumerate(ml):
        if u != -1:
            assert u in g[v] and mr[u] == v
```

## Related results

- **König's theorem.** In a bipartite graph, the size of a maximum matching equals the size of a **minimum vertex cover** (fewest vertices touching all edges), and the maximum independent set has $n - \text{matching}$ vertices. So many "choose the most/least" problems reduce to a matching.
- **Hall's theorem.** All left vertices can be matched if and only if every set $S$ of left vertices has at least $|S|$ neighbours.
- **Hopcroft-Karp** finds a maximum matching in $O(m\sqrt{n})$ by augmenting along many shortest paths at once; use it for $n \gtrsim 10^4$ where Kuhn is too slow.
- **Maximum flow.** A matching is a flow problem: source $\to$ left (cap 1) $\to$ right (cap 1) $\to$ sink. See [maximum flow](/theory/graphs/maximum-flow).

```python
def deficiency_example():
    # Hall's condition fails: workers 0 and 1 both only know job 0 -> at most 1 of them gets a job
    size, _, _ = max_bipartite_matching(2, 2, [[0], [0]])
    return size

assert deficiency_example() == 1
```
