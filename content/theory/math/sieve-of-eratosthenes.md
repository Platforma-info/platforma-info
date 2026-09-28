---
title: "Sieve of Eratosthenes"
section: Prime numbers
order: 1
difficulty: beginner
summary: "Find all primes up to n in O(n log log n), then make it fast in Python with slice assignment, and extend it to segments and smallest prime factors."
tags: [primes, sieve, number theory, factorization]
prerequisites: [math/euclidean-algorithm]
problems: [numar-prim]
source:
  title: Sieve of Eratosthenes
  url: https://cp-algorithms.com/algebra/sieve-of-eratosthenes.html
  license: CC BY-SA 4.0
---

A **prime** is an integer greater than 1 whose only divisors are 1 and itself. The **sieve of Eratosthenes** finds *all* primes in $[2, n]$ at once, in about $n \log\log n$ operations. For $n = 10^7$ that is a fraction of a second, whereas testing each number separately would be far slower.

## The idea

1. Write down all numbers from $2$ to $n$; none is crossed out yet.
2. Take the smallest number not crossed out, $p$. It is prime.
3. Cross out all its multiples $2p, 3p, 4p, \dots$
4. Repeat from step 2.

A number is left standing exactly when it has no smaller prime factor, i.e. when it is prime.

```text
n = 30
2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25 26 27 28 29 30
p=2: cross 4 6 8 10 12 ...      -> 3 5 7 9 11 13 15 17 19 21 23 25 27 29
p=3: cross 9 15 21 27           -> 5 7 11 13 17 19 23 25 29
p=5: cross 25                   -> 7 11 13 17 19 23 29
(p=7: 49 > 30, stop)
```

## Implementation

A direct translation:

```python
from math import isqrt

def sieve_simple(n):
    is_prime = [True] * (n + 1)
    is_prime[0:2] = [False, False][: n + 1]
    for i in range(2, n + 1):
        if is_prime[i]:
            for j in range(i * i, n + 1, i):     # start at i*i: smaller multiples
                is_prime[j] = False              # already crossed by smaller primes
    return is_prime

assert [i for i, p in enumerate(sieve_simple(30)) if p] == [2, 3, 5, 7, 11, 13, 17, 19, 23, 29]
```

Two optimizations are already present: the inner loop starts at $i^2$ because $i \cdot k$ with $k < i$ has a smaller prime factor and was crossed earlier, and (below) the outer loop only needs to go up to $\sqrt n$.

### Sieving until the square root

If a composite $m \le n$ had all prime factors greater than $\sqrt n$, then $m > n$, a contradiction. So every composite has a prime factor $\le \sqrt n$ and we only need to sieve with primes up to $\sqrt n$.

### The fast Python version

Python-level loops are slow (about $10^7$ steps per second). Crossing out multiples is a strided slice, and Python can assign to a whole slice in C:

```python
from math import isqrt

def sieve(n):
    """Return a bytearray `s` with s[i] == 1 iff i is prime, for 0 <= i <= n."""
    s = bytearray([1]) * (n + 1)
    s[0] = 0
    if n >= 1:
        s[1] = 0
    for i in range(2, isqrt(n) + 1):
        if s[i]:
            s[i * i :: i] = bytes(len(range(i * i, n + 1, i)))
    return s

def primes_up_to(n):
    return [i for i, is_p in enumerate(sieve(n)) if is_p]

assert primes_up_to(30) == [2, 3, 5, 7, 11, 13, 17, 19, 23, 29]
assert sieve(0) == bytearray(b"\x00") and sieve(1) == bytearray(b"\x00\x00")
assert sum(sieve(10 ** 6)) == 78498                 # known value of pi(10^6)
assert sieve_simple(2000) == [bool(x) for x in sieve(2000)]
```

`bytes(k)` is `k` zero bytes, and `s[a::i] = ...` overwrites every $i$-th byte in one C call. We measured $n = 10^7$: **0.08 s** with the slice version against **1.7 s** with the nested `for` loops, a 20x difference for the same algorithm.

> [!TIP]
> Use a `bytearray` (1 byte per number) instead of a list of booleans (8 bytes per element) when $n$ is large. $10^8$ needs 100 MB as a bytearray; a list would need nearly a gigabyte.

## Complexity

For each prime $p \le \sqrt n$ the inner loop runs $n/p$ times, so the total is

$$
n \sum_{p \le \sqrt n} \frac{1}{p} = O(n \log\log n)
$$

by Mertens' theorem, which is almost linear. Memory is $O(n)$.

## Sieving by odd numbers only

Except for $2$, all primes are odd, so we can store only odd numbers and halve the memory and time. Index $i$ stands for the number $2i + 1$:

```python
def sieve_odd(n):
    """Return the list of primes <= n, using half the memory."""
    if n < 2:
        return []
    size = (n - 1) // 2               # index i represents 2*i + 3
    s = bytearray([1]) * size
    for i in range(isqrt(n) // 2):
        if s[i]:
            p = 2 * i + 3
            start = (p * p - 3) // 2
            s[start::p] = bytes(len(range(start, size, p)))
    return [2] + [2 * i + 3 for i in range(size) if s[i]]

assert sieve_odd(30) == primes_up_to(30)
assert sieve_odd(10 ** 5) == primes_up_to(10 ** 5)
assert sieve_odd(1) == [] and sieve_odd(2) == [2] and sieve_odd(3) == [2, 3]
```

## Segmented sieve: primes in a range

Sometimes $n$ is huge (say $10^{12}$) but you only want primes in $[L, R]$ with $R - L \le 10^6$. Sieve the small primes up to $\sqrt R$ first, then use them to cross out multiples inside the segment:

```python
def primes_in_range(L, R):
    L = max(L, 2)
    if L > R:
        return []
    small = primes_up_to(isqrt(R))
    is_prime = bytearray([1]) * (R - L + 1)
    for p in small:
        first = max(p * p, (L + p - 1) // p * p)       # first multiple of p in [L, R]
        if first > R:
            continue
        is_prime[first - L :: p] = bytes(len(range(first - L, R - L + 1, p)))
    return [L + i for i, x in enumerate(is_prime) if x]

assert primes_in_range(10, 30) == [11, 13, 17, 19, 23, 29]
assert primes_in_range(1, 10) == [2, 3, 5, 7]
assert primes_in_range(10 ** 12, 10 ** 12 + 100) == [
    p for p in range(10 ** 12, 10 ** 12 + 101) if all(p % d for d in range(2, isqrt(p) + 1))
]
```

The cost is $O((R - L)\log\log R + \sqrt R)$.

## Smallest prime factor sieve

Instead of a yes/no flag, record the **smallest prime factor** `spf[i]` for every $i$. It answers "is $i$ prime?" (`spf[i] == i`) and, more importantly, factorizes any $i \le n$ in $O(\log i)$ by repeated division:

```python
def spf_sieve(n):
    spf = list(range(n + 1))
    for i in range(2, isqrt(n) + 1):
        if spf[i] == i:                        # i is prime
            for j in range(i * i, n + 1, i):
                if spf[j] == j:
                    spf[j] = i
    return spf

def factorize(x, spf):
    factors = []
    while x > 1:
        p = spf[x]
        factors.append(p)
        x //= p
    return factors

spf = spf_sieve(1000)
assert factorize(360, spf) == [2, 2, 2, 3, 3, 5]
assert factorize(997, spf) == [997]
```

This is the workhorse when you must factorize many numbers, for example to compute the [Euler totient](/theory/math/euler-totient-function) or the [number of divisors](/theory/math/number-of-divisors) of every $i \le n$.

## Linear sieve

The plain sieve may cross out a composite several times (for example $30$ by $2$, $3$ and $5$). The **linear sieve** crosses each composite exactly once, through its smallest prime factor, in $O(n)$ time, and produces the list of primes as a by-product:

```python
def linear_sieve(n):
    spf = [0] * (n + 1)
    primes = []
    for i in range(2, n + 1):
        if spf[i] == 0:
            spf[i] = i
            primes.append(i)
        for p in primes:
            if p > spf[i] or i * p > n:
                break
            spf[i * p] = p                     # p is the smallest prime factor of i*p
    return spf, primes

spf2, primes = linear_sieve(1000)
assert primes == primes_up_to(1000)
assert spf2[2:] == spf_sieve(1000)[2:]        # indexes 0 and 1 are not meaningful
```

Each composite $i \cdot p$ is written exactly once, when $p$ is its smallest prime factor. In pure Python this loop-heavy version is *slower* than the slice-based sieve, so use it when you need `spf` (or other multiplicative functions) and $n \lesssim 10^6$.

## Try it

On the platform, solve *numar-prim*; the sieve is the tool once you have to test many numbers.

## Practice problems

- [Leetcode - Four Divisors](https://leetcode.com/problems/four-divisors/)
- [Leetcode - Count Primes](https://leetcode.com/problems/count-primes/)
- [Leetcode - Closest Prime Numbers in Range](https://leetcode.com/problems/closest-prime-numbers-in-range/)
- [SPOJ - Printing Some Primes](http://www.spoj.com/problems/TDPRIMES/)
- [SPOJ - A Conjecture of Paul Erdos](http://www.spoj.com/problems/HS08PAUL/)
- [SPOJ - Primal Fear](http://www.spoj.com/problems/VECTAR8/)
- [SPOJ - Primes Triangle (I)](http://www.spoj.com/problems/PTRI/)
- [Codeforces - Almost Prime](http://codeforces.com/contest/26/problem/A)
- [Codeforces - Sherlock And His Girlfriend](http://codeforces.com/contest/776/problem/B)
- [SPOJ - Namit in Trouble](http://www.spoj.com/problems/NGIRL/)
- [SPOJ - Bazinga!](http://www.spoj.com/problems/DCEPC505/)
- [Project Euler - Prime pair connection](https://www.hackerrank.com/contests/projecteuler/challenges/euler134)
- [SPOJ - N-Factorful](http://www.spoj.com/problems/NFACTOR/)
- [SPOJ - Binary Sequence of Prime Numbers](http://www.spoj.com/problems/BSPRIME/)
- [UVA 11353 - A Different Kind of Sorting](https://uva.onlinejudge.org/index.php?option=com_onlinejudge&Itemid=8&page=show_problem&problem=2338)
- [SPOJ - Prime Generator](http://www.spoj.com/problems/PRIME1/)
- [SPOJ - Printing some primes (hard)](http://www.spoj.com/problems/PRIMES2/)
- [Codeforces - Nodbach Problem](https://codeforces.com/problemset/problem/17/A)
- [Codeforces - Colliders](https://codeforces.com/problemset/problem/154/B)
