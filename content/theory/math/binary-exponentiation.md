---
title: Binary Exponentiation
section: Fundamentals
order: 1
difficulty: beginner
summary: Compute powers in O(log n) multiplications by squaring, and reuse the same trick for modular powers, matrices and more.
tags: [math, modular arithmetic, matrices, divide and conquer]
prerequisites: []
source:
  title: Binary Exponentiation
  url: https://cp-algorithms.com/algebra/binary-exp.html
  license: CC BY-SA 4.0
---

Binary exponentiation (also called *exponentiation by squaring*) computes $a^n$ for a non-negative integer $n$ using only $O(\log n)$ multiplications, instead of the $n-1$ multiplications of the naive loop.

The trick works for **any operation that is associative**:

$$
(X \cdot Y) \cdot Z = X \cdot (Y \cdot Z)
$$

so it applies to modular multiplication, matrix multiplication, function composition (permutations) and more, as we see below.

## The idea

Two facts are enough:

$$
a^{b+c} = a^b \cdot a^c \qquad\text{and}\qquad a^{2b} = \left(a^b\right)^2
$$

Write the exponent in binary. For example, $13 = 1101_2 = 8 + 4 + 1$, so

$$
3^{13} = 3^{8} \cdot 3^{4} \cdot 3^{1}
$$

The powers $a^1, a^2, a^4, a^8, \dots$ are cheap to produce because each one is the square of the previous one:

$$
3^1 = 3,\quad 3^2 = 9,\quad 3^4 = 9^2 = 81,\quad 3^8 = 81^2 = 6561
$$

The number $n$ has $\lfloor \log_2 n \rfloor + 1$ bits, so we compute that many squares and multiply together those whose bit in $n$ is set (here we skip $3^2$ because bit 1 of 13 is zero):

$$
3^{13} = 6561 \cdot 81 \cdot 3 = 1\,594\,323
$$

The total work is at most $\log_2 n$ squarings plus $\log_2 n$ multiplications: **$O(\log n)$**.

The same idea as a recurrence:

$$
a^n = \begin{cases}
1 & n = 0 \\
\left(a^{n/2}\right)^2 & n > 0,\ n \text{ even} \\
\left(a^{(n-1)/2}\right)^2 \cdot a & n > 0,\ n \text{ odd}
\end{cases}
$$

## Implementation

The recursive version is a direct translation of the recurrence:

```python
def binpow_rec(a, n):
    if n == 0:
        return 1
    half = binpow_rec(a, n // 2)
    return half * half * a if n % 2 else half * half
```

The iterative version walks over the bits of $n$ from the lowest to the highest. `a` always holds $a^{2^i}$ for the current bit $i$. It has the same complexity but avoids the function-call overhead, which matters in Python:

```python
def binpow(a, n):
    result = 1
    while n > 0:
        if n & 1:          # this bit of n is set: multiply it in
            result *= a
        a *= a             # a = a^(2^i) -> a^(2^(i+1))
        n >>= 1
    return result

assert binpow(3, 13) == 1_594_323
assert binpow(2, 100) == 2 ** 100
assert binpow_rec(7, 20) == 7 ** 20 == binpow(7, 20)
```

> [!PYTHON]
> Python integers have arbitrary precision, so `binpow(2, 10**5)` never overflows; it simply produces a huge number. In C++ or Java the plain version silently wraps around, which is why the *modular* version below is the one you see in contests. In Python you use it to keep numbers small and fast.

## Modular exponentiation

A very common task is computing $x^n \bmod m$ (for example, to find a [modular inverse](/theory/math/modular-inverse)). Because

$$
a \cdot b \equiv (a \bmod m)\cdot(b \bmod m) \pmod m
$$

we can reduce after every multiplication, so the numbers never exceed $m^2$:

```python
def binpow_mod(a, n, m):
    a %= m
    result = 1 % m
    while n > 0:
        if n & 1:
            result = result * a % m
        a = a * a % m
        n >>= 1
    return result

assert binpow_mod(3, 200, 1_000_000_007) == pow(3, 200, 1_000_000_007)
assert binpow_mod(2, 10**18, 998_244_353) == pow(2, 10**18, 998_244_353)
```

> [!TIP]
> **Python already has this built in.** `pow(a, n, m)` runs modular binary exponentiation in C, and is much faster than any loop you write yourself. Use it in solutions; implement the loop yourself only when you need the technique for another operation (matrices, permutations, …).

If the exponent is enormous compared to the modulus, you can shrink it first. For a prime $m$ and $\gcd(x, m) = 1$, Fermat's little theorem gives $x^n \equiv x^{\,n \bmod (m-1)} \pmod m$; for composite $m$ replace $m-1$ by Euler's $\varphi(m)$ (see [Euler's totient function](/theory/math/euler-totient-function)).

## Applications

### Any associative operation: matrix power

The loop above never used the fact that `a` is a number, only that multiplication is associative and has an identity. Replace numbers by matrices and you can raise a matrix to a power in $O(d^3 \log n)$ for a $d \times d$ matrix.

The classic use is Fibonacci numbers. The pair $(F_i, F_{i+1})$ becomes $(F_{i+1}, F_{i+2})$ under a fixed linear map, so $F_n$ is an entry of $M^n$:

$$
\begin{pmatrix} 1 & 1 \\ 1 & 0 \end{pmatrix}^n =
\begin{pmatrix} F_{n+1} & F_n \\ F_n & F_{n-1} \end{pmatrix}
$$

```python
def mat_mul(A, B, mod):
    n, m, p = len(A), len(B), len(B[0])
    return [
        [sum(A[i][k] * B[k][j] for k in range(m)) % mod for j in range(p)]
        for i in range(n)
    ]

def mat_pow(M, n, mod):
    size = len(M)
    result = [[int(i == j) for j in range(size)] for i in range(size)]  # identity
    while n > 0:
        if n & 1:
            result = mat_mul(result, M, mod)
        M = mat_mul(M, M, mod)
        n >>= 1
    return result

def fib(n, mod=10**9 + 7):
    return mat_pow([[1, 1], [1, 0]], n, mod)[0][1]

assert [fib(i) for i in range(10)] == [0, 1, 1, 2, 3, 5, 8, 13, 21, 34]
assert fib(90, 10**30) == 2880067194370816120
```

### Number of paths of length $k$ in a graph

If $M$ is the adjacency matrix of a directed graph, then $(M^k)_{ij}$ is the number of paths with exactly $k$ edges from $i$ to $j$. This costs $O(n^3 \log k)$. Replacing "multiply and add" by "add and take the minimum" gives the shortest path that uses exactly $k$ edges.

### Applying a permutation $k$ times

Composing a permutation with itself is associative, so we can raise it to the $k$-th power by squaring:

```python
def apply_permutation(sequence, permutation):
    return [sequence[p] for p in permutation]

def permute(sequence, permutation, k):
    while k > 0:
        if k & 1:
            sequence = apply_permutation(sequence, permutation)
        permutation = apply_permutation(permutation, permutation)
        k >>= 1
    return sequence

seq = list("abcde")
perm = [1, 2, 0, 4, 3]            # a 3-cycle and a 2-cycle
once = apply_permutation(seq, perm)
assert permute(seq, perm, 1) == once
assert permute(seq, perm, 6) == seq             # lcm(3, 2) = 6 returns to the start
assert permute(seq, perm, 7) == once
```

The cost is $O(n \log k)$. It can be done in $O(n)$ by decomposing the permutation into cycles and taking $k$ modulo each cycle length.

### Multiplying two numbers modulo $m$ without overflow

In C++ the product $a \cdot b$ may not fit into 64 bits even though $a, b < m$ do. The fix is to apply the same doubling idea to *addition*:

$$
a \cdot b = \begin{cases}
0 & a = 0 \\
2 \cdot \left(\tfrac{a}{2} \cdot b\right) & a \text{ even} \\
2 \cdot \left(\tfrac{a-1}{2} \cdot b\right) + b & a \text{ odd}
\end{cases}
$$

```python
def mul_mod(a, b, m):
    result = 0
    a %= m
    while b > 0:
        if b & 1:
            result = (result + a) % m
        a = (a + a) % m
        b >>= 1
    return result

m = 10**18 + 9
assert mul_mod(123456789012345678, 987654321098765432, m) == 123456789012345678 * 987654321098765432 % m
```

> [!PYTHON]
> You will never need this in Python, because `a * b % m` is exact for any size of integers. It is included because the pattern "double instead of multiply" appears in other problems (for instance, computing $a \cdot b$ when only addition is allowed).

## Common mistakes

- **Forgetting to reduce `a` first.** In `binpow_mod`, start with `a %= m`, otherwise the first squaring works with a number larger than $m$ (correct, but slower and, in C++, dangerous).
- **`m = 1`.** Every result must be `0`; that is why the code starts from `1 % m`, not `1`.
- **Negative exponents.** The loops assume $n \ge 0$. For $a^{-n} \bmod m$, compute the modular inverse first (in Python 3.8+: `pow(a, -n, m)` does exactly that when $\gcd(a, m) = 1$).

## Practice problems

- [UVa 1230 - MODEX](http://uva.onlinejudge.org/index.php?option=com_onlinejudge&Itemid=8&category=24&page=show_problem&problem=3671)
- [UVa 374 - Big Mod](http://uva.onlinejudge.org/index.php?option=com_onlinejudge&Itemid=8&category=24&page=show_problem&problem=310)
- [UVa 11029 - Leading and Trailing](https://uva.onlinejudge.org/index.php?option=onlinejudge&page=show_problem&problem=1970)
- [Codeforces - Parking Lot](http://codeforces.com/problemset/problem/630/I)
- [leetcode - Count good numbers](https://leetcode.com/problems/count-good-numbers/)
- [Codechef - Chef and Riffles](https://www.codechef.com/JAN221B/problems/RIFFLES)
- [Codeforces - Decoding Genome](https://codeforces.com/contest/222/problem/E)
- [Codeforces - Neural Network Country](https://codeforces.com/contest/852/problem/B)
- [Codeforces - Magic Gems](https://codeforces.com/problemset/problem/1117/D)
- [SPOJ - The last digit](http://www.spoj.com/problems/LASTDIG/)
- [SPOJ - Locker](http://www.spoj.com/problems/LOCKER/)
- [LA - 3722 Jewel-eating Monsters](https://vjudge.net/problem/UVALive-3722)
- [SPOJ - Just add it](http://www.spoj.com/problems/ZSUM/)
- [Codeforces - Stairs and Lines](https://codeforces.com/contest/498/problem/E)
