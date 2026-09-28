---
title: "Strongly Connected Components"
section: Connectivity
order: 4
difficulty: advanced
summary: "Partition a directed graph into mutually reachable groups with Kosaraju's or Tarjan's algorithm, and build the condensation DAG."
tags: [scc, kosaraju, tarjan, condensation, directed graphs]
prerequisites: [graphs/depth-first-search]
source:
  title: Strongly connected components and the condensation graph
  url: https://cp-algorithms.com/graph/strongly-connected-components.html
  license: CC BY-SA 4.0
---

In a **directed** graph, two vertices $u$ and $v$ are *strongly connected* if each is reachable from the other. This is an equivalence relation, so the vertices split into disjoint groups, the **strongly connected components** (SCCs). Inside a component every vertex reaches every other; between components, edges go in one direction only.

If you contract every SCC into a single vertex you get the **condensation graph**, which is always a **DAG**. Many problems on messy directed graphs become easy on the DAG: dynamic programming, topological ordering, counting sources and sinks.

## Kosaraju's algorithm

1. Run a DFS over the whole graph and record the vertices in the order in which they **finish** (post-order).
2. Build the **transpose** graph (reverse every edge).
3. Process the vertices in *decreasing finishing time*; from each unvisited vertex run a DFS in the transpose graph. The vertices reached form one SCC.

Why it works: the vertex that finishes last belongs to a "source" component of the condensation. In the transposed graph, that component has no outgoing edges to unvisited components, so its DFS is trapped inside it.

Both passes are iterative here:

```python
def kosaraju(adj):
    """Return (comp, count): comp[v] is the SCC id; ids are in topological order of the condensation."""
    n = len(adj)
    radj = [[] for _ in range(n)]
    for v in range(n):
        for u in adj[v]:
            radj[u].append(v)

    # pass 1: post-order on the original graph
    visited = [False] * n
    order = []
    for s in range(n):
        if visited[s]:
            continue
        visited[s] = True
        stack = [(s, 0)]
        while stack:
            v, i = stack.pop()
            if i < len(adj[v]):
                stack.append((v, i + 1))
                u = adj[v][i]
                if not visited[u]:
                    visited[u] = True
                    stack.append((u, 0))
            else:
                order.append(v)

    # pass 2: DFS on the transpose in reverse finishing order
    comp = [-1] * n
    count = 0
    for s in reversed(order):
        if comp[s] != -1:
            continue
        comp[s] = count
        stack = [s]
        while stack:
            v = stack.pop()
            for u in radj[v]:
                if comp[u] == -1:
                    comp[u] = count
                    stack.append(u)
        count += 1
    return comp, count

#   0 -> 1 -> 2 -> 0   (a cycle)     2 -> 3 -> 4 -> 3   (another cycle)     4 -> 5
adj = [[1], [2], [0, 3], [4], [3, 5], []]
comp, count = kosaraju(adj)
assert count == 3
assert comp[0] == comp[1] == comp[2] and comp[3] == comp[4] and len({comp[0], comp[3], comp[5]}) == 3
```

Time $O(n + m)$. The component ids that Kosaraju assigns follow a **topological order** of the condensation: every edge between components goes from a smaller id to a larger one.

## Tarjan's algorithm

Tarjan's algorithm finds the SCCs in a single DFS, using `tin` and `low` again. Keep the vertices in a stack; when a vertex $v$ finishes with $\text{low}[v] = \text{tin}[v]$ it is the *root* of a component, and we pop the stack down to $v$ to collect the component.

```python
def tarjan(adj):
    """Return (comp, count). Component ids come out in reverse topological order."""
    n = len(adj)
    tin = [-1] * n
    low = [0] * n
    on_stack = [False] * n
    comp = [-1] * n
    scc_stack = []
    count = 0
    timer = 0
    for root in range(n):
        if tin[root] != -1:
            continue
        tin[root] = low[root] = timer; timer += 1
        scc_stack.append(root)
        on_stack[root] = True
        call = [(root, 0)]
        while call:
            v, i = call.pop()
            if i < len(adj[v]):
                call.append((v, i + 1))
                u = adj[v][i]
                if tin[u] == -1:
                    tin[u] = low[u] = timer; timer += 1
                    scc_stack.append(u)
                    on_stack[u] = True
                    call.append((u, 0))
                elif on_stack[u]:
                    low[v] = min(low[v], tin[u])
            else:
                if low[v] == tin[v]:                   # v is the root of a component
                    while True:
                        w = scc_stack.pop()
                        on_stack[w] = False
                        comp[w] = count
                        if w == v:
                            break
                    count += 1
                if call:
                    p = call[-1][0]
                    low[p] = min(low[p], low[v])
    return comp, count

comp_t, count_t = tarjan(adj)
assert count_t == 3 and comp_t[0] == comp_t[1] == comp_t[2] and comp_t[3] == comp_t[4]
```

Both algorithms are linear. Tarjan uses one traversal and no transposed graph, so it's the more memory-friendly one; Kosaraju is easier to remember.

## Checking against the definition

Compute reachability by brute force and compare the partitions produced:

```python
import random

def reach_sets(adj):
    n = len(adj)
    reach = []
    for s in range(n):
        seen = {s}
        stack = [s]
        while stack:
            v = stack.pop()
            for u in adj[v]:
                if u not in seen:
                    seen.add(u)
                    stack.append(u)
        reach.append(seen)
    return reach

def same_partition(comp, reach):
    n = len(comp)
    return all((comp[u] == comp[v]) == (v in reach[u] and u in reach[v]) for u in range(n) for v in range(n))

random.seed(21)
for _ in range(300):
    n = random.randint(1, 9)
    g = [[] for _ in range(n)]
    for _ in range(random.randint(0, 16)):
        g[random.randrange(n)].append(random.randrange(n))
    r = reach_sets(g)
    ck, _ = kosaraju(g)
    ct, _ = tarjan(g)
    assert same_partition(ck, r) and same_partition(ct, r)
    for v in range(n):                                   # component ids follow the stated orders
        for u in g[v]:
            assert ck[v] <= ck[u]                        # Kosaraju: topological
            assert ct[v] >= ct[u]                        # Tarjan: reverse topological
```

## Building the condensation graph

Add one edge $\text{comp}[u] \to \text{comp}[v]$ for every edge $u \to v$ that crosses two components. The result is a DAG.

```python
def condensation(adj, comp, count):
    dag = [set() for _ in range(count)]
    for v, neighbours in enumerate(adj):
        for u in neighbours:
            if comp[v] != comp[u]:
                dag[comp[v]].add(comp[u])
    return [sorted(x) for x in dag]

comp, count = kosaraju(adj)
dag = condensation(adj, comp, count)
assert sum(len(x) for x in dag) == 2
assert all(comp_from < comp_to for comp_from, targets in enumerate(dag) for comp_to in targets)   # Kosaraju: topological ids
```

## Application: 2-SAT and reachability puzzles

- "Make the graph strongly connected by adding the minimum number of edges" is `max(sources, sinks)` of the condensation (when there's more than one component).
- **2-SAT** (satisfiability of clauses with two literals) is solved by building the implication graph and checking that no variable shares an SCC with its negation.
- Counting the vertices that can reach / be reached from a given vertex reduces to DP on the DAG.

## Practice problems

- [SPOJ - Good Travels](http://www.spoj.com/problems/GOODA/)
- [SPOJ - Lego](http://www.spoj.com/problems/LEGO/)
- [Codechef - Chef and Round Run](https://www.codechef.com/AUG16/problems/CHEFRRUN)
- [UVA - 11838 - Come and Go](https://uva.onlinejudge.org/index.php?option=com_onlinejudge&Itemid=8&page=show_problem&problem=2938)
- [UVA 247 - Calling Circles](https://uva.onlinejudge.org/index.php?option=onlinejudge&page=show_problem&problem=183)
- [UVA 13057 - Prove Them All](https://uva.onlinejudge.org/index.php?option=com_onlinejudge&Itemid=8&page=show_problem&problem=4955)
- [UVA 12645 - Water Supply](https://uva.onlinejudge.org/index.php?option=com_onlinejudge&Itemid=8&page=show_problem&problem=4393)
- [UVA 11770 - Lighting Away](https://uva.onlinejudge.org/index.php?option=com_onlinejudge&Itemid=8&page=show_problem&problem=2870)
- [UVA 12926 - Trouble in Terrorist Town](https://uva.onlinejudge.org/index.php?option=com_onlinejudge&Itemid=8&category=862&page=show_problem&problem=4805)
- [UVA 11324 - The Largest Clique](https://uva.onlinejudge.org/index.php?option=com_onlinejudge&Itemid=8&page=show_problem&problem=2299)
- [UVA 11709 - Trust groups](https://uva.onlinejudge.org/index.php?option=com_onlinejudge&Itemid=8&page=show_problem&problem=2756)
- [UVA 12745 - Wishmaster](https://uva.onlinejudge.org/index.php?option=com_onlinejudge&Itemid=8&page=show_problem&problem=4598)
- [SPOJ - True Friends](http://www.spoj.com/problems/TFRIENDS/)
- [SPOJ - Capital City](http://www.spoj.com/problems/CAPCITY/)
- [Codeforces - Scheme](http://codeforces.com/contest/22/problem/E)
- [SPOJ - Ada and Panels](http://www.spoj.com/problems/ADAPANEL/)
- [CSES - Flight Routes Check](https://cses.fi/problemset/task/1682)
- [CSES - Planets and Kingdoms](https://cses.fi/problemset/task/1683)
- [CSES - Coin Collector](https://cses.fi/problemset/task/1686)
- [Codeforces - Checkposts](https://codeforces.com/problemset/problem/427/C)
