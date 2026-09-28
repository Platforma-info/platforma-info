---
title: "Arbitrary-Precision Arithmetic"
section: Big numbers and polynomials
order: 2
difficulty: intermediate
summary: "How big integers work inside: digit arrays, schoolbook and Karatsuba multiplication, and what Python's int already gives you."
tags: [big integer, long arithmetic, karatsuba, fractions]
prerequisites: [python-basics/lists-and-tuples]
source:
  title: "Arbitrary-Precision Arithmetic"
  url: https://cp-algorithms.com/algebra/big-integer.html
  license: CC BY-SA 4.0
---

Fixed-width integers (32 or 64 bits) overflow: $21!$ already exceeds $2^{64}$. **Arbitrary-precision** (or *long*) arithmetic stores a number as an array of small digits, so its size grows with the value.

> [!PYTHON]
> Python's `int` **is** an arbitrary-precision integer. `2 ** 1000`, `factorial(500)` and `10 ** 5000 + 7` just work, with the ordinary operators. You will never need to implement this to *solve* a problem in Python. It is worth understanding how it works, because it explains Python's performance, and because the ideas (carrying, Karatsuba, other representations) recur in FFT, hashing and cryptography.

## How Python stores integers

CPython keeps an integer as an array of 30-bit "digits":

```python
import sys

assert sys.int_info.bits_per_digit == 30
assert sys.getsizeof(0) < sys.getsizeof(2 ** 30) < sys.getsizeof(2 ** 300)     # grows with the value
assert (2 ** 100).bit_length() == 101
```

- `+`, `-` take $O(n)$ in the number of digits.
- `*` uses schoolbook $O(n^2)$ for small operands and **Karatsuba** $O(n^{1.585})$ beyond about 70 digits.
- `//` and `%` are $O(n^2)$; `divmod` gives both at once.
- Converting to a decimal string, `str(x)`, is $O(n^2)$ (and limited to 4300 digits since Python 3.11; see the note in [Fibonacci Numbers](/theory/math/fibonacci-numbers)); `int(s)` similarly. Working in a binary or hexadecimal base is linear.

## Classical long arithmetic

Store the number as a list of digits in some base $B$, **least significant digit first**, so that carries propagate toward the end of the list. With $B = 10^9$ each digit fits in 32 bits and products of two digits fit in 64 (an important constraint in C++; in Python we use it because it makes decimal output trivial).

```python
BASE = 10 ** 9

def from_int(n):
    digits = []
    while n:
        n, r = divmod(n, BASE)
        digits.append(r)
    return digits or [0]

def to_int(digits):
    n = 0
    for d in reversed(digits):
        n = n * BASE + d
    return n

def trim(a):
    while len(a) > 1 and a[-1] == 0:
        a.pop()
    return a

def to_str(a):
    return str(a[-1]) + "".join(f"{d:09d}" for d in reversed(a[:-1]))

def from_str(s):
    a = []
    for end in range(len(s), 0, -9):
        a.append(int(s[max(0, end - 9):end]))
    return trim(a)

assert from_int(123456789012345678901234567890) == [234567890, 345678901, 456789012, 123]
assert to_str(from_int(10 ** 30 + 5)) == str(10 ** 30 + 5)
assert to_int(from_str("123456789012345678901234567890")) == 123456789012345678901234567890
```

### Addition and subtraction

Add digit by digit with a carry; subtract with a borrow (assuming $a \ge b$).

```python
def add(a, b):
    result, carry = [], 0
    for i in range(max(len(a), len(b))):
        s = carry + (a[i] if i < len(a) else 0) + (b[i] if i < len(b) else 0)
        result.append(s % BASE)
        carry = s // BASE
    if carry:
        result.append(carry)
    return result

def sub(a, b):
    """a - b, requires a >= b."""
    result, borrow = [], 0
    for i in range(len(a)):
        d = a[i] - borrow - (b[i] if i < len(b) else 0)
        borrow = 1 if d < 0 else 0
        result.append(d + BASE if d < 0 else d)
    return trim(result)

assert to_int(add(from_int(999999999999999999), from_int(1))) == 10 ** 18
assert to_int(sub(from_int(10 ** 18), from_int(1))) == 10 ** 18 - 1
```

### Multiplication by a short number, and by a long one

```python
def mul_small(a, k):
    """a * k for 0 <= k < BASE."""
    result, carry = [], 0
    for d in a:
        cur = d * k + carry
        result.append(cur % BASE)
        carry = cur // BASE
    while carry:
        result.append(carry % BASE)
        carry //= BASE
    return trim(result)

def mul_school(a, b):
    """Schoolbook multiplication, O(len(a) * len(b))."""
    result = [0] * (len(a) + len(b) + 1)
    for i, x in enumerate(a):
        carry = 0
        for j, y in enumerate(b):
            cur = result[i + j] + x * y + carry
            result[i + j] = cur % BASE
            carry = cur // BASE
        k = i + len(b)
        while carry:
            cur = result[k] + carry
            result[k] = cur % BASE
            carry = cur // BASE
            k += 1
    return trim(result)

x, y = 31 ** 40, 17 ** 37
assert to_int(mul_school(from_int(x), from_int(y))) == x * y
assert to_int(mul_small(from_int(x), 999999999)) == x * 999999999
```

### Division by a short number

Process digits from the most significant one, carrying the remainder down:

```python
def divmod_small(a, k):
    """(a // k, a % k) for 0 < k < BASE."""
    quotient, rem = [0] * len(a), 0
    for i in range(len(a) - 1, -1, -1):
        cur = rem * BASE + a[i]
        quotient[i] = cur // k
        rem = cur % k
    return trim(quotient), rem

q, r = divmod_small(from_int(10 ** 40 + 12345), 97)
assert (to_int(q), r) == divmod(10 ** 40 + 12345, 97)
```

## Karatsuba multiplication

Split $a = a_1 B^m + a_0$, $b = b_1 B^m + b_0$. Then

$$
ab = a_1 b_1 B^{2m} + \big((a_1 + a_0)(b_1 + b_0) - a_1 b_1 - a_0 b_0\big) B^m + a_0 b_0
$$

needs only **three** half-size multiplications instead of four, giving $T(n) = 3T(n/2) + O(n) = O(n^{\log_2 3}) \approx O(n^{1.585})$.

```python
def karatsuba(x, y):
    """Karatsuba on Python ints (illustrates the recursion; Python's * already does this)."""
    if x < 2 ** 64 or y < 2 ** 64:
        return x * y
    m = max(x.bit_length(), y.bit_length()) // 2
    x1, x0 = x >> m, x & ((1 << m) - 1)
    y1, y0 = y >> m, y & ((1 << m) - 1)
    z2 = karatsuba(x1, y1)
    z0 = karatsuba(x0, y0)
    z1 = karatsuba(x1 + x0, y1 + y0) - z2 - z0
    return (z2 << (2 * m)) + (z1 << m) + z0

import random
random.seed(1)
for _ in range(100):
    a = random.getrandbits(random.randint(1, 3000))
    b = random.getrandbits(random.randint(1, 3000))
    assert karatsuba(a, b) == a * b
```

For even larger numbers (millions of digits) the FFT-based algorithms win; see [Fast Fourier Transform](/theory/math/fast-fourier-transform).

## Testing the long-arithmetic functions

```python
for _ in range(300):
    a, b = random.getrandbits(random.randint(1, 400)), random.getrandbits(random.randint(1, 400))
    A, B = from_int(a), from_int(b)
    assert to_int(add(A, B)) == a + b
    if a >= b:
        assert to_int(sub(A, B)) == a - b
    assert to_int(mul_school(A, B)) == a * b
    k = random.randrange(1, BASE)
    assert divmod_small(A, k) == (from_int(a // k), a % k)
    assert to_str(A) == str(a)
```

## Other representations

### Factorization representation

If you only need **multiplication, division and powers** (never addition), store a number as its prime factorization $\{p_i: e_i\}$. Multiplication adds exponents; division subtracts; a power multiplies them. Comparison and addition are impossible without converting back.

```python
from collections import Counter

def factor_product(*factorizations):
    total = Counter()
    for f in factorizations:
        total.update(f)
    return total

# 12! = product of factorizations of 1..12
def factorize_small(n):
    f, d = Counter(), 2
    while d * d <= n:
        while n % d == 0:
            f[d] += 1
            n //= d
        d += 1
    if n > 1:
        f[n] += 1
    return f

fact12 = factor_product(*[factorize_small(i) for i in range(2, 13)])
assert fact12 == Counter({2: 10, 3: 5, 5: 2, 7: 1, 11: 1})
assert 479001600 == 2 ** 10 * 3 ** 5 * 5 ** 2 * 7 * 11
```

### Modular representation

Keep the residues modulo several primes and rebuild the number with [Garner's algorithm](/theory/math/garners-algorithm) when needed. Addition, subtraction and multiplication are independent per prime and trivially parallel; comparison and division are hard.

### Fractions

`fractions.Fraction` stores exact rationals in lowest terms (it calls `gcd` after every operation):

```python
from fractions import Fraction

h = sum(Fraction(1, k) for k in range(1, 21))                      # harmonic number H_20
assert h == Fraction(55835135, 15519504)
assert Fraction(3, 4) + Fraction(1, 4) == 1 and Fraction(1, 3) < Fraction(2, 5)
assert Fraction("0.125") == Fraction(1, 8) and float(Fraction(1, 8)) == 0.125
```

For decimals with fixed precision, `decimal.Decimal` with `getcontext().prec` set is the tool (see the standard library article).

## What to remember

- In Python, use `int`. Its multiplication is Karatsuba; its division and string conversion are quadratic, so avoid printing numbers with hundreds of thousands of digits inside loops.
- Operating on numbers in base $2^k$ (shifts, masks) is much faster than in base 10.
- Implement long arithmetic yourself only in languages without it, or when the *structure* (digit-by-digit access) is the point of the problem.

## Practice problems

- [UVA - How Many Fibs?](https://uva.onlinejudge.org/index.php?option=onlinejudge&page=show_problem&problem=1124)
- [UVA - Product](https://uva.onlinejudge.org/index.php?option=com_onlinejudge&Itemid=8&page=show_problem&problem=1047)
- [UVA - Maximum Sub-sequence Product](https://uva.onlinejudge.org/index.php?option=onlinejudge&page=show_problem&problem=728)
- [SPOJ - Fast Multiplication](http://www.spoj.com/problems/MUL/en/)
- [SPOJ - GCD2](http://www.spoj.com/problems/GCD2/)
- [UVA - Division](https://uva.onlinejudge.org/index.php?option=onlinejudge&page=show_problem&problem=1024)
- [UVA - Fibonacci Freeze](https://uva.onlinejudge.org/index.php?option=com_onlinejudge&Itemid=8&page=show_problem&problem=436)
- [UVA - Krakovia](https://uva.onlinejudge.org/index.php?option=onlinejudge&page=show_problem&problem=1866)
- [UVA - Simplifying Fractions](https://uva.onlinejudge.org/index.php?option=com_onlinejudge&Itemid=8&page=show_problem&problem=1755)
- [UVA - 500!](https://uva.onlinejudge.org/index.php?option=onlinejudge&page=show_problem&problem=564)
- [Hackerrank - Factorial digit sum](https://www.hackerrank.com/contests/projecteuler/challenges/euler020/problem)
- [UVA - Immortal Rabbits](https://uva.onlinejudge.org/index.php?option=com_onlinejudge&Itemid=8&page=show_problem&problem=4803)
- [SPOJ - 0110SS](http://www.spoj.com/problems/IWGBS/)
- [Codeforces - Notepad](http://codeforces.com/contest/17/problem/D)
