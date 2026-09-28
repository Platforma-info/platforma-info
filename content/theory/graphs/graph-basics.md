---
title: "Graphs: Terminology and Representation"
section: Graph traversal
order: 1
difficulty: beginner
summary: "Vertices, edges and the vocabulary of graph problems, and the three ways to store a graph in Python (adjacency list, matrix, edge list)."
tags: [graphs, adjacency list, representation, input]
prerequisites: [python-basics/dictionaries-and-sets]
---

Graphs model **things and the connections between them**: cities and roads, people and friendships, web pages and links, tasks and their dependencies. Most graph problems are about answering "can I get from A to B?", "what is the cheapest way?" or "how are these things grouped?".

## Terminology

- A graph $G = (V, E)$ has a set of **vertices** $V$ (also *nodes*) and a set of **edges** $E$. We write $n = |V|$ and $m = |E|$.
- An edge can be **undirected** (a two-way road: $\{u, v\}$) or **directed** (a one-way street: $u \to v$).
- An edge can carry a **weight** (length, cost, time).
- Two vertices joined by an edge are **adjacent**; the edge is **incident** to both. The **degree** of a vertex is the number of its edges (in-degree and out-degree for directed graphs).
- A **path** is a sequence of vertices where consecutive ones are joined by an edge; its **length** is the number of edges (or the sum of weights). A **cycle** is a path that returns to its start.
- A graph is **connected** if there is a path between every two vertices. A **tree** is a connected graph without cycles ($m = n - 1$).
- A **DAG** is a directed graph without directed cycles.
- A **simple** graph has no loops (edge $v \to v$) and no parallel edges. Some problems allow *multi-edges*; read the statement.

## Vertices are numbers

Give the vertices the numbers $0, 1, \dots, n-1$. If the statement numbers them from 1, either subtract 1 when reading, or allocate $n + 1$ lists and ignore index 0. Pick one convention and stay with it.

## Representation 1: adjacency list

For each vertex, store the list of its neighbours. It takes $O(n + m)$ memory and iterating over the neighbours of $v$ takes $O(\deg v)$. It is what you want almost always.

```python
n = 5
edges = [(0, 1), (0, 2), (1, 3), (2, 3), (3, 4)]        # undirected

adj = [[] for _ in range(n)]
for u, v in edges:
    adj[u].append(v)
    adj[v].append(u)                                       # drop this line for a directed graph

assert adj[3] == [1, 2, 4]
assert sorted(len(a) for a in adj) == [1, 2, 2, 2, 3]
assert sum(len(a) for a in adj) == 2 * len(edges)          # handshake lemma: degrees add up to 2m
```

**Weighted graph**: store `(neighbour, weight)` pairs.

```python
wedges = [(0, 1, 4), (0, 2, 1), (2, 1, 2), (1, 3, 5)]
wadj = [[] for _ in range(4)]
for u, v, w in wedges:
    wadj[u].append((v, w))
    wadj[v].append((u, w))

assert wadj[0] == [(1, 4), (2, 1)]
```

> [!WARNING]
> Do **not** create the lists with `[[]] * n`: it repeats *one* list `n` times, and every append shows up everywhere (see [Lists and Tuples](/theory/python-basics/lists-and-tuples)). Use a comprehension, as above.

## Representation 2: adjacency matrix

A 2D table `mat[u][v]` (`True`/`1` or the weight, or infinity when there's no edge). Checking whether an edge exists is $O(1)$, but it needs $O(n^2)$ memory and iterating over neighbours costs $O(n)$. Use it for small dense graphs ($n \lesssim 2000$) and for algorithms such as [Floyd-Warshall](/theory/graphs/floyd-warshall).

```python
mat = [[0] * n for _ in range(n)]
for u, v in edges:
    mat[u][v] = mat[v][u] = 1

assert mat[1][3] == 1 and mat[1][2] == 0
assert sum(map(sum, mat)) == 2 * len(edges)
```

## Representation 3: edge list

Just a list of `(u, v)` or `(u, v, w)`. It's the natural input format, and the only thing needed by algorithms that process edges globally, such as [Kruskal](/theory/graphs/kruskal-mst) and [Bellman-Ford](/theory/graphs/bellman-ford).

## Comparison

| | adjacency list | adjacency matrix | edge list |
|---|---|---|---|
| memory | $O(n + m)$ | $O(n^2)$ | $O(m)$ |
| is $(u, v)$ an edge? | $O(\deg u)$ | $O(1)$ | $O(m)$ |
| iterate neighbours of $v$ | $O(\deg v)$ | $O(n)$ | $O(m)$ |
| typical use | traversals, shortest paths | dense graphs, Floyd-Warshall | Kruskal, Bellman-Ford |

## Reading a graph from input

Typical format: `n m`, then `m` lines `u v` (or `u v w`).

```python skip
import sys

def main():
    data = sys.stdin.buffer.read().split()
    n, m = int(data[0]), int(data[1])
    adj = [[] for _ in range(n)]
    p = 2
    for _ in range(m):
        u, v = int(data[p]) - 1, int(data[p + 1]) - 1      # statement is 1-indexed
        p += 2
        adj[u].append(v)
        adj[v].append(u)
    # ... run an algorithm ...

main()
```

Read [Fast Input and Output](/theory/python-contests/fast-io) for why we read everything at once.

## Grids are graphs too

A maze or a grid map is an implicit graph: each cell is a vertex adjacent to its 4 (or 8) neighbours. You don't build an adjacency list; generate neighbours on the fly:

```python
def neighbours(r, c, rows, cols):
    for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        nr, nc = r + dr, c + dc
        if 0 <= nr < rows and 0 <= nc < cols:
            yield nr, nc

assert sorted(neighbours(0, 0, 3, 3)) == [(0, 1), (1, 0)]
assert len(list(neighbours(1, 1, 3, 3))) == 4
```

Next: explore a graph with [breadth-first search](/theory/graphs/breadth-first-search) and [depth-first search](/theory/graphs/depth-first-search).
