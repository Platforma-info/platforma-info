---
title: "Finding Repetitions (Main-Lorentz)"
section: Tasks
order: 2
difficulty: advanced
summary: "Find all squares (a substring written twice in a row) in O(n log n) with divide and conquer and the Z-function."
tags: [repetitions, squares, main-lorentz, z-function, divide and conquer]
prerequisites: [strings/z-function]
source:
  title: "Finding repetitions"
  url: https://cp-algorithms.com/string/main_lorentz.html
  license: CC BY-SA 4.0
---

A **repetition** (or *square*) is a substring made of two identical halves, like `abab` or `ee`. The task: find all repetitions in a string $s$, or just the longest one, or any one.

For `acababaee` the repetitions are `abab` (positions 2-5), `baba` (3-6) and `ee` (7-8). For `abaaba`: `abaaba` (0-5) and `aa` (2-3).

A string can contain $\Theta(n^2)$ repetitions (`aaaa...a` has one for every even-length substring), so the algorithm reports them in a *compressed* form: groups of repetitions described by a few numbers. Expanding those groups gives the pairs of positions, at the price of the output size.

## Main-Lorentz algorithm

**Divide and conquer.** Split $s = u + v$ into halves, find the repetitions lying completely in $u$ and completely in $v$ recursively, and then find the **crossing** repetitions, those that start in $u$ and end in $v$. If the crossing ones are found in $O(n)$, the total is $T(n) = 2T(n/2) + O(n) = O(n\log n)$.

### Crossing repetitions

Look at the middle of a crossing repetition (the first character of its second half). It is either in $u$ (a **left** repetition) or in $v$ (a **right** one). Consider the left repetitions; right ones are symmetric.

The first character of the repetition that falls into $v$ is at position $|u|$ and equals the character exactly one half-length $l$ earlier, at position $\text{cntr} = |u| - l$. **Fix $\text{cntr}$**; this fixes the half-length $l = |u| - \text{cntr}$. All the repetitions found for this $\text{cntr}$ have length $2l$, and differ only in where the middle falls relative to $\text{cntr}$.

Split the half into two parts of lengths $l_1$ (up to $\text{cntr}$ exclusive) and $l_2 = l - l_1$ (from $\text{cntr}$). A repetition exists for the pair $(l_1, l_2)$ iff

- $k_1$ = the longest common **suffix** of $s[0..\text{cntr}-1]$ and $u$ satisfies $l_1 \le k_1$, and
- $k_2$ = the longest common **prefix** of $s[\text{cntr}..]$ and $v$ satisfies $l_2 \le k_2$.

So we need $k_1 + k_2 \ge l$, and then every $l_1 \in [\max(1, l - k_2),\ \min(l, k_1)]$ gives one repetition. Both $k_1$ and $k_2$ come from [Z-functions](/theory/strings/z-function): $k_1$ from the Z-function of the reversed $u$, and $k_2$ from the Z-function of $v \# u$. For right repetitions use the Z-functions of $\bar u \# \bar v$ and $v$.

## Implementation

```python
def z_function(s):
    n = len(s)
    z = [0] * n
    l = r = 0
    for i in range(1, n):
        if i < r:
            z[i] = min(r - i, z[i - l])
        while i + z[i] < n and s[z[i]] == s[i + z[i]]:
            z[i] += 1
        if i + z[i] > r:
            l, r = i, i + z[i]
    return z

def get_z(z, i):
    return z[i] if 0 <= i < len(z) else 0

def find_repetitions(s):
    """All repetitions as (start, end) inclusive index pairs, found with Main-Lorentz."""
    repetitions = []

    def convert(shift, left, cntr, l, k1, k2):
        for l1 in range(max(1, l - k2), min(l, k1) + 1):
            if left and l1 == l:
                break
            pos = shift + (cntr - l1 if left else cntr - l - l1 + 1)
            repetitions.append((pos, pos + 2 * l - 1))

    def solve(t, shift):
        n = len(t)
        if n == 1:
            return
        nu = n // 2
        nv = n - nu
        u, v = t[:nu], t[nu:]
        ru, rv = u[::-1], v[::-1]
        solve(u, shift)
        solve(v, shift + nu)
        z1 = z_function(ru)
        z2 = z_function(v + "#" + u)
        z3 = z_function(ru + "#" + rv)
        z4 = z_function(v)
        for cntr in range(n):
            if cntr < nu:
                l = nu - cntr
                k1 = get_z(z1, nu - cntr)
                k2 = get_z(z2, nv + 1 + cntr)
            else:
                l = cntr - nu + 1
                k1 = get_z(z3, nu + 1 + nv - 1 - (cntr - nu))
                k2 = get_z(z4, cntr - nu + 1)
            if k1 + k2 >= l:
                convert(shift, cntr < nu, cntr, l, k1, k2)

    if len(s) > 1:
        solve(s, 0)
    return repetitions

assert sorted(find_repetitions("acababaee")) == [(2, 5), (3, 6), (7, 8)]
assert sorted(find_repetitions("abaaba")) == [(0, 5), (2, 3)]
assert find_repetitions("abc") == [] and find_repetitions("a") == []
```

The separator `#` must not occur in $s$; for arbitrary alphabets use a value outside it.

## Testing against brute force

Enumerate every start and half-length and compare the halves:

```python
import random

def repetitions_brute(s):
    n = len(s)
    return [(i, i + 2 * l - 1) for i in range(n) for l in range(1, (n - i) // 2 + 1)
            if s[i:i + l] == s[i + l:i + 2 * l]]

random.seed(1)
for _ in range(600):
    s = "".join(random.choice("ab") for _ in range(random.randint(0, 30)))
    found = find_repetitions(s)
    assert sorted(found) == sorted(repetitions_brute(s)), s
    assert len(found) == len(set(found))               # every repetition is reported once
```

The lists agree on all random binary strings (the hardest alphabet, since repetitions are plentiful), and no repetition is reported twice.

## Complexity

The recursion has depth $\log n$, and each level does $O(n)$ work computing four Z-functions of total length $O(n)$, so finding all groups takes $O(n\log n)$. If the output must list every repetition explicitly, the running time is $O(n\log n + \text{output})$, and the output can be quadratic (a string of $n$ equal letters).

```python
assert len(find_repetitions("a" * 12)) == sum((12 - 2 * l + 1) for l in range(1, 7))     # 36 squares
```

## Variations

- **Longest repetition** or **any repetition**: don't expand the groups; for each $\text{cntr}$ with $k_1 + k_2 \ge l$ record $2l$ (the length is the same for the whole group).
- **Number of distinct squares** in a string is at most $2n$ (a known bound); counting *distinct* ones (not occurrences) requires a slightly different approach (runs / Lyndon roots).
- **Primitive repetitions** (whose half is not itself a repetition) number $O(n\log n)$ in total, and Fibonacci strings reach this bound.
