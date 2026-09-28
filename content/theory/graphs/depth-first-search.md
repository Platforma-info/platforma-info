---
title: "Depth-First Search"
section: Graph traversal
order: 3
difficulty: beginner
summary: "Explore a graph as deep as possible before backtracking; entry and exit times, edge classification, and how to avoid Python's recursion limit."
tags: [dfs, traversal, recursion, stack, timestamps]
prerequisites: [graphs/graph-basics, python-basics/recursion]
source:
  title: Depth First Search
  url: https://cp-algorithms.com/graph/depth-first-search.html
  license: CC BY-SA 4.0
---

**Depth-first search** (DFS) goes as deep as possible along a path before backtracking. Where BFS uses a queue and explores by distance, DFS uses a stack (explicitly or via recursion) and explores by following one branch to its end.

Its running time is $O(n + m)$, and it is the basis of many algorithms: connected components, cycle detection, topological sorting, bridges, strongly connected components.

## Algorithm

From vertex $v$: mark it visited; for each neighbour $u$ that has not been visited, recursively run DFS from $u$. When all neighbours are done, return.

```python
def dfs_recursive(adj, s):
    visited = [False] * len(adj)
    order = []

    def go(v):
        visited[v] = True
        order.append(v)
        for u in adj[v]:
            if not visited[u]:
                go(u)

    go(s)
    return order

adj = [[1, 2], [0, 3], [0, 3], [1, 2, 4], [3]]
assert dfs_recursive(adj, 0) == [0, 1, 3, 2, 4]
```

> [!WARNING]
> Python limits recursion to about 1000 nested calls. A path graph with $10^5$ vertices makes the recursive version crash with `RecursionError`. Raising `sys.setrecursionlimit` may still overflow the C stack. In contests, write DFS **iteratively**.

## Iterative DFS

Use an explicit stack. The simplest version pushes all neighbours; the visit order may differ from the recursive one, but it's a valid DFS order (each vertex is visited before the vertices discovered from it):

```python
def dfs_iterative(adj, s):
    visited = [False] * len(adj)
    order = []
    stack = [s]
    while stack:
        v = stack.pop()
        if visited[v]:
            continue
        visited[v] = True
        order.append(v)
        for u in reversed(adj[v]):          # reversed: process neighbours in list order
            if not visited[u]:
                stack.append(u)
    return order

assert dfs_iterative(adj, 0) == dfs_recursive(adj, 0)
```

For algorithms that need the **exit** moment (post-order, timestamps, low-link values), keep an iterator index for each vertex on the stack, so the vertex stays on the stack until all its neighbours have been processed:

```python
def dfs_times(adj, s):
    """Iterative DFS returning entry times, exit times and parents."""
    n = len(adj)
    tin, tout = [-1] * n, [-1] * n
    parent = [-1] * n
    next_i = [0] * n                          # next neighbour index to examine, per vertex
    timer = 0
    tin[s] = timer; timer += 1
    stack = [s]
    while stack:
        v = stack[-1]
        if next_i[v] < len(adj[v]):
            u = adj[v][next_i[v]]
            next_i[v] += 1
            if tin[u] == -1:
                parent[u] = v
                tin[u] = timer; timer += 1
                stack.append(u)
        else:
            tout[v] = timer; timer += 1
            stack.pop()
    return tin, tout, parent

tin, tout, parent = dfs_times(adj, 0)
assert (tin[0], tout[0]) == (0, 9)
assert parent == [-1, 0, 3, 1, 3]                 # vertex 2 is discovered from 3, not from 0
```

## Entry and exit times

Record `tin[v]` when DFS enters $v$ and `tout[v]` when it leaves. They give constant-time tests about the DFS tree:

- $u$ is an **ancestor** of $v$ exactly when $\text{tin}[u] \le \text{tin}[v]$ and $\text{tout}[v] \le \text{tout}[u]$;
- sorting vertices by `tout` descending gives a **topological order** of a DAG.

```python
def is_ancestor(u, v):
    return tin[u] <= tin[v] and tout[v] <= tout[u]

assert is_ancestor(0, 4) and is_ancestor(1, 3) and not is_ancestor(2, 3)
```

## Classification of edges

In a directed graph, during a DFS every edge $v \to u$ is one of:

| Kind | How to recognise it when examined |
|------|-----------------------------------|
| **tree edge** | $u$ is unvisited |
| **back edge** | $u$ is visited and still on the stack (an ancestor): closes a **cycle** |
| **forward edge** | $u$ is a visited descendant of $v$ |
| **cross edge** | $u$ is visited, finished, and not a descendant |

In an *undirected* graph only tree edges and back edges exist. A directed graph has a cycle if and only if DFS finds a back edge; see [finding a cycle](/theory/graphs/finding-cycle).

## Applications

- **Connected components** ([article](/theory/graphs/connected-components)).
- **Topological sorting** ([article](/theory/graphs/topological-sort)).
- **Cycle detection** ([article](/theory/graphs/finding-cycle)).
- **Bridges and articulation points** ([bridges](/theory/graphs/bridges), [articulation points](/theory/graphs/articulation-points)).
- **Strongly connected components** ([article](/theory/graphs/strongly-connected-components)).
- **Subtree computations on trees**: sizes, depths, sums, using the order in which DFS finishes vertices.

```python
def subtree_sizes(adj, root):
    """Size of the subtree of every vertex of a tree, computed without recursion."""
    n = len(adj)
    parent = [-1] * n
    order = []
    stack = [root]
    while stack:
        v = stack.pop()
        order.append(v)
        for u in adj[v]:
            if u != parent[v]:
                parent[u] = v
                stack.append(u)
    size = [1] * n
    for v in reversed(order):                # children come after parents in `order`
        if parent[v] != -1:
            size[parent[v]] += size[v]
    return size

tree = [[1, 2], [0, 3, 4], [0], [1], [1]]
assert subtree_sizes(tree, 0) == [5, 3, 1, 1, 1]
```

The pattern "collect a pre-order, then process it in reverse" replaces most recursive tree DP in Python.

## BFS or DFS?

| Need | Use |
|------|-----|
| shortest path (unweighted) | BFS |
| any path, components, cycle, ordering, ancestors | DFS |
| the state space is very deep and narrow | DFS (memory) |

## Practice problems

- [SPOJ: ABCPATH](http://www.spoj.com/problems/ABCPATH/)
- [SPOJ: EAGLE1](http://www.spoj.com/problems/EAGLE1/)
- [Codeforces: Kefa and Park](http://codeforces.com/problemset/problem/580/C)
- [Timus:Werewolf](http://acm.timus.ru/problem.aspx?space=1&num=1242)
- [Timus:Penguin Avia](http://acm.timus.ru/problem.aspx?space=1&num=1709)
- [Timus:Two Teams](http://acm.timus.ru/problem.aspx?space=1&num=1106)
- [SPOJ - Ada and Island](http://www.spoj.com/problems/ADASEA/)
- [UVA 657 - The die is cast](https://uva.onlinejudge.org/index.php?option=com_onlinejudge&Itemid=8&page=show_problem&problem=598)
- [SPOJ - Sheep](http://www.spoj.com/problems/KOZE/)
- [SPOJ - Path of the Rightenous Man](http://www.spoj.com/problems/RIOI_2_3/)
- [SPOJ - Validate the Maze](http://www.spoj.com/problems/MAKEMAZE/)
- [SPOJ - Ghosts having Fun](http://www.spoj.com/problems/GHOSTS/)
- [Codeforces - Underground Lab](http://codeforces.com/contest/781/problem/C)
- [DevSkill - Maze Tester (archived)](http://web.archive.org/web/20200319103915/https://www.devskill.com/CodingProblems/ViewProblem/3)
- [DevSkill - Tourist (archived)](http://web.archive.org/web/20190426175135/https://devskill.com/CodingProblems/ViewProblem/17)
- [Codeforces - Anton and Tree](http://codeforces.com/contest/734/problem/E)
- [Codeforces - Transformation: From A to B](http://codeforces.com/contest/727/problem/A)
- [Codeforces - One Way Reform](http://codeforces.com/contest/723/problem/E)
- [Codeforces - Centroids](http://codeforces.com/contest/709/problem/E)
- [Codeforces - Generate a String](http://codeforces.com/contest/710/problem/E)
- [Codeforces - Broken Tree](http://codeforces.com/contest/758/problem/E)
- [Codeforces - Dasha and Puzzle](http://codeforces.com/contest/761/problem/E)
- [Codeforces - Making genome In Berland](http://codeforces.com/contest/638/problem/B)
- [Codeforces - Road Improvement](http://codeforces.com/contest/638/problem/C)
- [Codeforces - Garland](http://codeforces.com/contest/767/problem/C)
- [Codeforces - Labeling Cities](http://codeforces.com/contest/794/problem/D)
- [Codeforces - Send the Fool Further!](http://codeforces.com/contest/802/problem/J1)
- [Codeforces - The tag Game](http://codeforces.com/contest/813/problem/C)
- [Codeforces - Leha and Another game about graphs](http://codeforces.com/contest/841/problem/D)
- [Codeforces - Shortest path problem](http://codeforces.com/contest/845/problem/G)
- [Codeforces - Upgrading Tree](http://codeforces.com/contest/844/problem/E)
- [Codeforces - From Y to Y](http://codeforces.com/contest/849/problem/C)
- [Codeforces - Chemistry in Berland](http://codeforces.com/contest/846/problem/E)
- [Codeforces - Wizards Tour](http://codeforces.com/contest/861/problem/F)
- [Codeforces - Ring Road](http://codeforces.com/contest/24/problem/A)
- [Codeforces - Mail Stamps](http://codeforces.com/contest/29/problem/C)
- [Codeforces - Ant on the Tree](http://codeforces.com/contest/29/problem/D)
- [SPOJ - Cactus](http://www.spoj.com/problems/CAC/)
- [SPOJ - Mixing Chemicals](http://www.spoj.com/problems/AMR10J/)
