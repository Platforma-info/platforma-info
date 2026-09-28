---
title: "Balanced Ternary"
section: Number systems
order: 1
difficulty: intermediate
summary: "Represent integers with digits −1, 0, 1: no sign needed, and rounding is free."
tags: [balanced ternary, number systems, base conversion]
prerequisites: [python-basics/loops]
source:
  title: "Balanced Ternary"
  url: https://cp-algorithms.com/algebra/balanced-ternary.html
  license: CC BY-SA 4.0
---

**Balanced ternary** is a base-3 positional system whose digits are $-1$, $0$ and $+1$ (written `-`, `0`, `+`) instead of $0, 1, 2$. A number is

$$
n = \sum_i d_i\, 3^i, \qquad d_i \in \{-1, 0, 1\}
$$

Every integer, positive or negative, has a **unique** representation and needs **no separate sign**: negating a number just flips every digit. Truncating the low digits rounds to the nearest value, which is why the system was used in early computers (the Soviet Setun) and why it appears in weighing puzzles: with weights $1, 3, 9, 27, \dots$ you can put a weight on the same pan as the object, on the other one, or leave it off.

For example $7 = 9 - 3 + 1 = \texttt{+-+}$ and $-7 = \texttt{-+-}$.

## Conversion

To convert from a normal integer, repeatedly take the remainder modulo 3. A remainder of 0 or 1 is the digit itself. A remainder of 2 means the digit $-1$, and we carry one to the next position ($2 = 3 - 1$).

```python
def to_balanced_ternary(n):
    if n == 0:
        return "0"
    digits = []
    while n:
        r = n % 3                       # Python: always in {0, 1, 2}, even for negative n
        if r == 0:
            digits.append("0")
        elif r == 1:
            digits.append("+")
            n -= 1
        else:                           # r == 2: digit -1 with a carry
            digits.append("-")
            n += 1
        n //= 3
    return "".join(reversed(digits))

def from_balanced_ternary(s):
    value = 0
    for ch in s:
        value = value * 3 + {"-": -1, "0": 0, "+": 1}[ch]
    return value

assert to_balanced_ternary(7) == "+-+"
assert to_balanced_ternary(-7) == "-+-"
assert to_balanced_ternary(0) == "0"
assert [to_balanced_ternary(i) for i in range(1, 6)] == ["+", "+-", "+0", "++", "+--"]
assert all(from_balanced_ternary(to_balanced_ternary(n)) == n for n in range(-5000, 5001))
```

## Negation and addition

Negation flips `+` and `-`:

```python
def negate(s):
    return s.translate(str.maketrans("+-", "-+"))

assert negate("+-+") == "-+-"
assert all(from_balanced_ternary(negate(to_balanced_ternary(n))) == -n for n in range(-200, 200))
```

Digit-wise addition works with a carry: the sum of two digits plus carry lies in $[-3, 3]$; write it as $d + 3c$ with $d \in \{-1, 0, 1\}$.

```python
def add(a, b):
    a, b = a[::-1], b[::-1]
    out, carry = [], 0
    for i in range(max(len(a), len(b))):
        x = {"-": -1, "0": 0, "+": 1}[a[i]] if i < len(a) else 0
        y = {"-": -1, "0": 0, "+": 1}[b[i]] if i < len(b) else 0
        total = x + y + carry
        carry = 0
        if total > 1:
            total -= 3
            carry = 1
        elif total < -1:
            total += 3
            carry = -1
        out.append("-0+"[total + 1])
    if carry:
        out.append("-0+"[carry + 1])
    s = "".join(reversed(out)).lstrip("0")
    return s or "0"

assert add("+-+", "-+-") == "0"
assert add("+", "+") == "+-"
import random
random.seed(1)
for _ in range(1000):
    x, y = random.randint(-10 ** 6, 10 ** 6), random.randint(-10 ** 6, 10 ** 6)
    assert from_balanced_ternary(add(to_balanced_ternary(x), to_balanced_ternary(y))) == x + y
```

Multiplication by 3 appends a `0`, and multiplication by a single digit is negation or zero, so multiplication is a shift-and-add algorithm.

## The weighing puzzle

With weights $1, 3, 9, \dots, 3^{k-1}$ (one of each) you can weigh every integer mass from 1 to $(3^k - 1)/2$ on a balance scale. The balanced ternary digits tell you where each weight goes:

```python
def weighing(mass):
    """Return (weights on the object's pan, weights on the other pan)."""
    s = to_balanced_ternary(mass)
    with_object, opposite = [], []
    for i, ch in enumerate(reversed(s)):
        if ch == "-":
            with_object.append(3 ** i)
        elif ch == "+":
            opposite.append(3 ** i)
    return with_object, opposite

left, right = weighing(11)                       # 11 = 9 + 3 - 1
assert (left, right) == ([1], [3, 9])
assert 11 + sum(left) == sum(right)
assert all(m + sum(weighing(m)[0]) == sum(weighing(m)[1]) for m in range(1, 122))
```

## Practice problems

- [Topcoder SRM 604, Div1-250](http://community.topcoder.com/stat?c=problem_statement&pm=12917&rd=15837)
