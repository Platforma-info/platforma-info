---
title: "Bit Manipulation"
section: Bits
order: 1
difficulty: intermediate
summary: "Binary numbers, bitwise operators, the classic tricks (lowest set bit, popcount, powers of two) and how to iterate over subsets with masks."
tags: [bits, bitmask, xor, binary]
prerequisites: [python-basics/variables-and-types]
source:
  title: Bit manipulation
  url: https://cp-algorithms.com/algebra/bit-manipulation.html
  license: CC BY-SA 4.0
---

Computers store integers in **binary**. Working with individual bits is fast, compact (a set of up to 30 items fits in one integer), and the basis of many neat tricks.

## Binary numbers

Each bit is a power of two, counted from 0 on the right: $1101_2 = 8 + 4 + 0 + 1 = 13$.

```python
assert int("1101", 2) == 13
assert bin(13) == "0b1101"
assert format(13, "08b") == "00001101"           # zero-padded to 8 bits
assert 0b1101 == 13 and 0xFF == 255
assert (13).bit_length() == 4                      # number of bits needed
```

## Bitwise operators

| Operator | Meaning | Example |
|----------|---------|---------|
| `a & b` | AND: 1 where both are 1 | `0b1100 & 0b1010 == 0b1000` |
| `a \| b` | OR: 1 where either is 1 | `0b1100 \| 0b1010 == 0b1110` |
| `a ^ b` | XOR: 1 where they differ | `0b1100 ^ 0b1010 == 0b0110` |
| `~a` | NOT: flips every bit | `~5 == -6` |
| `a << k` | shift left, multiply by $2^k$ | `3 << 2 == 12` |
| `a >> k` | shift right, floor-divide by $2^k$ | `13 >> 2 == 3` |

```python
assert 0b1100 & 0b1010 == 0b1000
assert 0b1100 | 0b1010 == 0b1110
assert 0b1100 ^ 0b1010 == 0b0110
assert 3 << 2 == 12 and 13 >> 2 == 3
assert ~5 == -6                                     # ~x == -x - 1
assert -7 >> 1 == -4                                # shifting rounds toward minus infinity
```

> [!PYTHON]
> Python integers have unlimited width and behave as if a negative number were written in two's complement with infinitely many leading ones. So `~x` is always `-x - 1`, and there is no overflow. To emulate a fixed width, mask: `(~x) & 0xFFFFFFFF` gives the 32-bit unsigned result.

```python
assert (~5) & 0xFFFFFFFF == 4294967290
assert (-1) & 0xFF == 255
```

## Everyday tricks

Numbering bits from 0:

```python
x = 0b101100

def set_bit(x, i):    return x | (1 << i)
def clear_bit(x, i):  return x & ~(1 << i)
def flip_bit(x, i):   return x ^ (1 << i)
def test_bit(x, i):   return (x >> i) & 1

assert set_bit(x, 0) == 0b101101
assert clear_bit(x, 2) == 0b101000
assert flip_bit(x, 5) == 0b001100
assert test_bit(x, 3) == 1 and test_bit(x, 4) == 0
```

**Even or odd**: `x & 1`. **Multiply/divide by a power of two**: `x << k`, `x >> k`.

**Divisible by $2^k$**: `x & ((1 << k) - 1) == 0`.

```python
assert 12 & 1 == 0 and 13 & 1 == 1
assert (48 & ((1 << 4) - 1)) == 0                  # 48 is divisible by 16
```

**Power of two**: exactly one bit is set, so `x & (x - 1) == 0`. Subtracting 1 turns the lowest set bit into 0 and all bits below into 1s.

```python
def is_power_of_two(x):
    return x > 0 and x & (x - 1) == 0

assert [n for n in range(1, 40) if is_power_of_two(n)] == [1, 2, 4, 8, 16, 32]
```

**Lowest set bit**: `x & -x`. Because `-x` is `~x + 1`, everything above the lowest set bit is flipped and the bit itself stays. **Clear the lowest set bit**: `x & (x - 1)`.

```python
assert 0b101000 & -0b101000 == 0b1000
assert 0b101000 & (0b101000 - 1) == 0b100000
assert (0b101000 & -0b101000).bit_length() - 1 == 3        # index of the lowest set bit
```

### Counting set bits (popcount)

```python
def popcount_kernighan(x):
    count = 0
    while x:
        x &= x - 1               # each iteration removes one set bit
        count += 1
    return count

assert popcount_kernighan(0b101101) == 4
assert bin(0b101101).count("1") == 4
assert (0b101101).bit_count() == 4                 # Python 3.10+: built in and fast
assert all(popcount_kernighan(n) == bin(n).count("1") for n in range(2000))
```

Kernighan's loop runs once per set bit. Use `int.bit_count()` when it is available (3.10+).

Popcount table for $0..n$ with a recurrence: the count for $i$ is that of $i \gg 1$ plus its last bit.

```python
def popcounts_upto(n):
    c = [0] * (n + 1)
    for i in range(1, n + 1):
        c[i] = c[i >> 1] + (i & 1)
    return c

assert popcounts_upto(8) == [0, 1, 1, 2, 1, 2, 2, 3, 1]
```

## XOR tricks

$x \oplus x = 0$ and $x \oplus 0 = x$, and XOR is commutative and associative. So XOR-ing a list cancels everything that appears an even number of times.

```python
from functools import reduce
from operator import xor

assert reduce(xor, [4, 1, 2, 1, 2]) == 4           # the element that appears once

a, b = 5, 9
a ^= b; b ^= a; a ^= b                              # swap without a temporary (cute, not useful in Python)
assert (a, b) == (9, 5)
```

## Bitmasks as sets

A number can represent a subset of $\{0, 1, \dots, n-1\}$: bit $i$ is set when element $i$ belongs to the set. Unions, intersections and differences become single operations, and a set of up to about 20 elements can be a *state* in dynamic programming.

```python
A = 0b10110                   # {1, 2, 4}
B = 0b01100                   # {2, 3}
assert A | B == 0b11110       # union
assert A & B == 0b00100       # intersection
assert A & ~B == 0b10010      # difference A \ B
assert (A >> 4) & 1           # 4 in A
```

**All subsets** of $n$ elements are the integers $0 \ldots 2^n - 1$:

```python
items = ["a", "b", "c"]
subsets = []
for mask in range(1 << len(items)):
    subsets.append([items[i] for i in range(len(items)) if mask >> i & 1])
assert len(subsets) == 8 and ["a", "c"] in subsets and [] in subsets
```

**All submasks of a mask** in decreasing order, visiting each once (in total $3^n$ steps over all masks):

```python
def submasks(mask):
    sub = mask
    while sub:
        yield sub
        sub = (sub - 1) & mask
    yield 0

assert sorted(submasks(0b1011)) == [0b0000, 0b0001, 0b0010, 0b0011, 0b1000, 0b1001, 0b1010, 0b1011]
assert sum(1 for _ in submasks(0b111111)) == 2 ** 6
```

## Gray code

A **Gray code** orders all $n$-bit numbers so that consecutive numbers differ in exactly one bit. The $i$-th one is `i ^ (i >> 1)`:

```python
gray = [i ^ (i >> 1) for i in range(8)]
assert gray == [0, 1, 3, 2, 6, 7, 5, 4]
assert all(bin(gray[i] ^ gray[i + 1]).count("1") == 1 for i in range(7))
```

## Practice problems

- [Codeforces - Raising Bacteria](https://codeforces.com/problemset/problem/579/A)
- [Codeforces - Fedor and New Game](https://codeforces.com/problemset/problem/467/B)
- [Codeforces - And Then There Were K](https://codeforces.com/problemset/problem/1527/A)
