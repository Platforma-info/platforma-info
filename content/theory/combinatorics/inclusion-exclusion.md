---
title: "The Inclusion-Exclusion Principle"
section: Techniques
order: 1
difficulty: advanced
summary: "Count the elements of a union by alternately adding and subtracting intersections; derangements, coprime counts and multiples in a range."
tags: [inclusion-exclusion, counting, derangements, bitmask]
prerequisites: [combinatorics/binomial-coefficients, math/bit-manipulation]
source:
  title: The Inclusion-Exclusion Principle
  url: https://cp-algorithms.com/combinatorics/inclusion-exclusion.html
  license: CC BY-SA 4.0
---

The **inclusion-exclusion principle** counts how many elements belong to at least one of several sets $A_1, \dots, A_n$ without listing them. If you add $|A_1| + |A_2|$, the elements in both sets are counted twice, so subtract $|A_1 \cap A_2|$. With three sets we must add the triple intersection back, and so on:

$$
|A_1 \cup A_2 \cup \dots \cup A_n| = \sum_{i} |A_i| - \sum_{i<j} |A_i \cap A_j| + \sum_{i<j<k} |A_i \cap A_j \cap A_k| - \dots + (-1)^{n-1} |A_1 \cap \dots \cap A_n|
$$

or, more compactly, summing over all non-empty subsets $S$ of the sets:

$$
\left|\bigcup_{i} A_i\right| = \sum_{\emptyset \ne S \subseteq \{1..n\}} (-1)^{|S|-1} \left|\bigcap_{i \in S} A_i\right|
$$

**Why it works.** An element that lies in exactly $t \ge 1$ of the sets is counted $\binom{t}{1} - \binom{t}{2} + \binom{t}{3} - \dots = 1$ time by the right-hand side, since $\sum_{j=0}^{t} (-1)^j \binom{t}{j} = 0$.

## The usual form: count what avoids all properties

Often we want the number of elements that have **none** of the properties $P_1, \dots, P_n$. With $N$ elements in total and $A_i$ = elements with property $P_i$:

$$
\#\text{none} = N - \left|\bigcup A_i\right| = \sum_{S \subseteq \{1..n\}} (-1)^{|S|}\, \left|\bigcap_{i \in S} A_i\right|
$$

(the empty subset contributes $+N$). Enumerate the subsets with a bitmask. That costs $2^n$ terms, so it is used with $n$ up to about 20.

## Example 1: derangements

A **derangement** is a permutation of $n$ elements with no fixed point ($p_i \neq i$ for all $i$). Let $A_i$ = permutations with $p_i = i$; the intersection of any $k$ of them contains $(n - k)!$ permutations, and there are $\binom{n}{k}$ ways to pick the $k$ sets:

$$
D_n = \sum_{k=0}^{n} (-1)^k \binom{n}{k} (n-k)! = n! \sum_{k=0}^{n} \frac{(-1)^k}{k!}
$$

```python
from math import comb, factorial
from itertools import permutations

def derangements(n):
    return sum((-1) ** k * comb(n, k) * factorial(n - k) for k in range(n + 1))

def derangements_brute(n):
    return sum(all(p[i] != i for i in range(n)) for p in permutations(range(n)))

assert [derangements(n) for n in range(9)] == [1, 0, 1, 2, 9, 44, 265, 1854, 14833]
assert all(derangements(n) == derangements_brute(n) for n in range(8))

# also D_n = (n - 1) * (D_{n-1} + D_{n-2})
D = [1, 0]
for n in range(2, 12):
    D.append((n - 1) * (D[-1] + D[-2]))
assert D == [derangements(n) for n in range(12)]
```

The fraction $D_n / n!$ tends to $1/e \approx 0.368$: a random permutation has no fixed point about 37% of the time.

## Example 2: numbers in $[1, n]$ coprime to $m$

$x$ is coprime to $m$ if it's divisible by none of the prime factors of $m$. Let the distinct primes of $m$ be $p_1, \dots, p_k$ and $A_i$ = multiples of $p_i$. The multiples of $\prod_{i \in S} p_i$ in $[1, n]$ number $\lfloor n / \prod p_i \rfloor$:

```python
from math import gcd

def prime_factors(m):
    ps, d = [], 2
    while d * d <= m:
        if m % d == 0:
            ps.append(d)
            while m % d == 0:
                m //= d
        d += 1
    if m > 1:
        ps.append(m)
    return ps

def count_coprime(n, m):
    primes = prime_factors(m)
    total = 0
    for mask in range(1 << len(primes)):
        product, bits = 1, 0
        for i, p in enumerate(primes):
            if mask >> i & 1:
                product *= p
                bits += 1
        total += (-1) ** bits * (n // product)
    return total

assert count_coprime(30, 30) == 8                       # phi(30) = 8
assert count_coprime(100, 6) == sum(1 for x in range(1, 101) if gcd(x, 6) == 1)
assert all(count_coprime(n, m) == sum(gcd(x, m) == 1 for x in range(1, n + 1))
           for n in range(0, 60, 7) for m in range(1, 40))
```

For a range $[l, r]$ compute $f(r) - f(l - 1)$.

## Example 3: multiples of at least one number

How many integers in $[1, n]$ are divisible by at least one of $a_1, \dots, a_k$? Now the *union* formula applies, and the intersection of multiples of a subset is the multiples of their **lcm**:

```python
from math import lcm

def multiples_of_any(n, numbers):
    k = len(numbers)
    total = 0
    for mask in range(1, 1 << k):
        l, bits = 1, 0
        for i in range(k):
            if mask >> i & 1:
                l = lcm(l, numbers[i])
                bits += 1
                if l > n:
                    break
        else:
            total += (-1) ** (bits - 1) * (n // l)
    return total

assert multiples_of_any(100, [3, 5]) == 33 + 20 - 6
assert multiples_of_any(1000, [2, 3, 5, 7]) == sum(any(x % a == 0 for a in (2, 3, 5, 7)) for x in range(1, 1001))
assert multiples_of_any(50, [4, 6, 10]) == sum(any(x % a == 0 for a in (4, 6, 10)) for x in range(1, 51))
```

(`math.lcm` needs Python 3.9+.) Stopping as soon as the lcm exceeds $n$ prunes many subsets.

## Example 4: sums with upper bounds

The number of solutions of $x_1 + x_2 + \dots + x_k = s$ in non-negative integers with $x_i \le b_i$: start from all solutions without upper bounds (stars and bars), and use inclusion-exclusion over the set of variables that *violate* their bound by setting $x_i \ge b_i + 1$. See [Stars and Bars](/theory/combinatorics/stars-and-bars).

## Example 5: surjections

The number of functions from an $n$-element set **onto** an $m$-element set is the number with no unused value:

$$
\text{Surj}(n, m) = \sum_{k=0}^{m} (-1)^k \binom{m}{k} (m-k)^n
$$

```python
from itertools import product

def surjections(n, m):
    return sum((-1) ** k * comb(m, k) * (m - k) ** n for k in range(m + 1))

def surjections_brute(n, m):
    return sum(len(set(f)) == m for f in product(range(m), repeat=n))

assert surjections(4, 2) == 14 and surjections(3, 3) == 6
assert all(surjections(n, m) == surjections_brute(n, m) for n in range(1, 6) for m in range(1, 5))
```

## Counting elements in exactly $r$ sets

The same idea with weights $(-1)^{k - r}\binom{k}{r}$ counts the elements that have **exactly** $r$ of the properties: replace the sign by that coefficient.

## Practical notes

- Complexity is exponential in the number of sets; keep $n \lesssim 20$, or look for structure that lets you group terms (for example, over divisors, use the Möbius function: the sum over squarefree divisors).
- The alternating signs make intermediate sums large, but Python integers are exact. Modulo a prime, keep the signs separately and reduce carefully.

## Practice problems

- [UVA #10325 "The Lottery" [difficulty: low]](http://uva.onlinejudge.org/index.php?option=onlinejudge&page=show_problem&problem=1266)
- [UVA #11806 "Cheerleaders" [difficulty: low]](http://uva.onlinejudge.org/index.php?option=com_onlinejudge&Itemid=8&page=show_problem&problem=2906)
- [TopCoder SRM 477 "CarelessSecretary" [difficulty: low]](http://www.topcoder.com/stat?c=problem_statement&pm=10875)
- [TopCoder TCHS 16 "Divisibility" [difficulty: low]](http://community.topcoder.com/stat?c=problem_statement&pm=6658&rd=10068)
- [SPOJ #6285 NGM2 , "Another Game With Numbers" [difficulty: low]](http://www.spoj.com/problems/NGM2/)
- [TopCoder SRM 382 "CharmingTicketsEasy" [difficulty: medium]](http://community.topcoder.com/stat?c=problem_statement&pm=8470)
- [TopCoder SRM 390 "SetOfPatterns" [difficulty: medium]](http://www.topcoder.com/stat?c=problem_statement&pm=8307)
- [TopCoder SRM 176 "Deranged" [difficulty: medium]](http://community.topcoder.com/stat?c=problem_statement&pm=2013)
- [TopCoder SRM 457 "TheHexagonsDivOne" [difficulty: medium]](http://community.topcoder.com/stat?c=problem_statement&pm=10702&rd=14144&rm=303184&cr=22697599)
- [SPOJ #4191 MSKYCODE "Sky Code" [difficulty: medium]](http://www.spoj.com/problems/MSKYCODE/)
- [SPOJ #4168 SQFREE "Square-free integers" [difficulty: medium]](http://www.spoj.com/problems/SQFREE/)
- [CodeChef "Count Relations" [difficulty: medium]](http://www.codechef.com/JAN11/problems/COUNTREL/)
- [SPOJ - Almost Prime Numbers Again](http://www.spoj.com/problems/KPRIMESB/)
- [SPOJ - Find number of Pair of Friends](http://www.spoj.com/problems/IITKWPCH/)
- [SPOJ - Balanced Cow Subsets](http://www.spoj.com/problems/SUBSET/)
- [SPOJ - EASY MATH [difficulty: medium]](http://www.spoj.com/problems/EASYMATH/)
- [SPOJ - MOMOS - FEASTOFPIGS [difficulty: easy]](https://www.spoj.com/problems/MOMOS/)
- [Atcoder - Grid 2 [difficulty: easy]](https://atcoder.jp/contests/dp/tasks/dp_y/)
- [Codeforces - Count GCD](https://codeforces.com/contest/1750/problem/D)
