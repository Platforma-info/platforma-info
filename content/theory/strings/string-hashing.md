---
title: "String Hashing and Rabin-Karp"
section: Fundamentals
order: 1
difficulty: intermediate
summary: "Compare any two substrings in O(1) after O(n) preprocessing with polynomial hashes, and use rolling hashes to search for patterns."
tags: [hashing, rabin-karp, substrings, modular arithmetic]
prerequisites: [math/modular-inverse]
source:
  title: String Hashing
  url: https://cp-algorithms.com/string/string-hashing.html
  license: CC BY-SA 4.0
---

**Hashing** maps a string to a number so that equal strings always get equal numbers and different strings *almost always* get different numbers. Comparing two numbers is $O(1)$ no matter how long the strings are. Combined with prefix sums, it gives an $O(1)$ test for "are these two substrings equal?".

## Polynomial hash

Choose a base $p$ and a modulus $m$ and define

$$
\text{hash}(s) = \left(s_0\, p^{\,n-1} + s_1\, p^{\,n-2} + \dots + s_{n-1}\right) \bmod m
$$

where $s_i$ is the character code. This is exactly how a number is read digit by digit (Horner's rule), with the base $p$ playing the role of 10.

Typical choices: $m$ large and prime; $p$ larger than the alphabet size and, importantly, **random**.

```python
import random

MOD = (1 << 61) - 1                       # a Mersenne prime: 2305843009213693951
BASE = random.randrange(10 ** 5, MOD - 1)

def poly_hash(s):
    h = 0
    for ch in s:
        h = (h * BASE + ord(ch)) % MOD
    return h

assert poly_hash("hello") == poly_hash("hello")
assert poly_hash("hello") != poly_hash("hellp")
```

### Why a random base and a big modulus?

If two different strings collide, the algorithm gives a wrong answer. For a random base and a prime modulus $m$ the probability that a given pair collides is about $n/m$. With $m \approx 10^9$ and $10^6$ comparisons, collisions are **likely** (birthday paradox); with $m = 2^{61} - 1$ they are negligible. In Python, big integers make the 61-bit modulus painless, which is one of the places where Python is more convenient than C++.

> [!WARNING]
> A fixed base, or arithmetic modulo $2^{64}$ (natural overflow in C++), can be attacked with specially crafted inputs (the Thue–Morse string collides for any base when the modulus is $2^{64}$). Judges and hacking contests know this; always randomize the base.

## Substring hashes in $O(1)$

Precompute prefix hashes $h[i] = \text{hash}(s[0:i])$ (so $h[i+1] = h[i]\cdot p + s_i$) and the powers of the base. Appending characters to a prefix multiplies its old value by $p$ for each one, so removing the prefix $s[0:l]$ from $h[r]$ means subtracting $h[l]\cdot p^{\,r-l}$:

$$
\text{hash}(s[l:r]) \equiv h[r] - h[l]\, p^{\,r-l} \pmod m
$$

The result does not depend on where the substring sits, so hashes of substrings taken from different places (or even different strings, with the same $p$ and $m$) can be compared directly. No modular inverse is needed.

```python
class StringHash:
    def __init__(self, s, base=None, mod=MOD):
        self.mod = mod
        self.base = base if base is not None else random.randrange(10 ** 5, mod - 1)
        n = len(s)
        self.h = [0] * (n + 1)
        self.pw = [1] * (n + 1)
        for i, ch in enumerate(s):
            self.h[i + 1] = (self.h[i] * self.base + ord(ch)) % mod
            self.pw[i + 1] = self.pw[i] * self.base % mod

    def get(self, l, r):
        """Hash of s[l:r]; equals poly_hash(s[l:r]) when the base and modulus are the same."""
        return (self.h[r] - self.h[l] * self.pw[r - l]) % self.mod

s = "abracadabra"
H = StringHash(s)
assert H.get(0, 4) == H.get(7, 11)              # "abra" == "abra"
assert H.get(0, 4) != H.get(1, 5)               # "abra" != "brac"
assert H.get(2, 2) == H.get(5, 5) == 0          # empty substrings

# a randomized comparison with direct string equality
random.seed(1)
for _ in range(300):
    t = "".join(random.choice("ab") for _ in range(random.randint(1, 30)))
    Ht = StringHash(t)
    for _ in range(20):
        length = random.randint(0, len(t))
        i = random.randint(0, len(t) - length)
        j = random.randint(0, len(t) - length)
        assert (Ht.get(i, i + length) == Ht.get(j, j + length)) == (t[i : i + length] == t[j : j + length])
```

`get` agrees with `hash(s)` computed on the substring alone:

```python
H2 = StringHash("xxabracadabrayy", base=BASE)
assert H2.get(2, 13) == poly_hash("abracadabra")
```

## Applications

### Rabin-Karp: pattern search

Slide a window of length $m = |t|$ over $s$; compare the window's hash to the pattern's hash. If equal (almost surely a match), report the position. It's $O(n + m)$ expected.

```python
def rabin_karp(s, t):
    """All start positions of t in s."""
    n, m = len(s), len(t)
    if m == 0:
        return list(range(n + 1))
    if m > n:
        return []
    Ht = StringHash(t)
    Hs = StringHash(s, base=Ht.base)                       # both strings must use the same base
    target = Ht.get(0, m)
    return [i for i in range(n - m + 1) if Hs.get(i, i + m) == target]

def find_all(s, t):
    out, i = [], s.find(t)
    while i != -1:
        out.append(i)
        i = s.find(t, i + 1)
    return out

assert rabin_karp("abracadabra", "abra") == [0, 7]
assert rabin_karp("aaaaa", "aa") == [0, 1, 2, 3]
assert rabin_karp("abc", "abcd") == []
for _ in range(200):
    text = "".join(random.choice("ab") for _ in range(random.randint(0, 40)))
    pat = "".join(random.choice("ab") for _ in range(random.randint(1, 4)))
    assert rabin_karp(text, pat) == find_all(text, pat)
```

> [!PYTHON]
> For plain substring search, `str.find` and `in` are implemented in C with a fast algorithm; use them. Hashing pays off when you need *many* comparisons between arbitrary substrings, or when the objects are not strings.

### Number of distinct substrings of a given length

Put the hashes of all length-$k$ substrings into a `set`; its size is the answer. That is $O(n)$ for one $k$.

```python
def distinct_substrings_of_length(s, k):
    H = StringHash(s)
    return len({H.get(i, i + k) for i in range(len(s) - k + 1)})

assert distinct_substrings_of_length("abababc", 2) == 3        # ab, ba, bc
assert distinct_substrings_of_length("aaaa", 2) == 1
```

Summing over every $k$ counts all distinct substrings in $O(n^2)$; a [suffix array](/theory/strings) does it in $O(n \log n)$.

### Longest repeated substring with binary search

If a substring of length $k$ occurs twice, so does one of length $k - 1$ (shorten it). That monotonicity lets you binary search $k$, checking each with a set of hashes:

```python
def longest_repeated_substring(s):
    H = StringHash(s)

    def has_repeat(k):
        seen = {}
        for i in range(len(s) - k + 1):
            h = H.get(i, i + k)
            if h in seen:
                return seen[h]
            seen[h] = i
        return None

    lo, hi, best = 1, len(s) - 1, ""
    while lo <= hi:
        mid = (lo + hi) // 2
        pos = has_repeat(mid)
        if pos is not None:
            best = s[pos : pos + mid]
            lo = mid + 1
        else:
            hi = mid - 1
    return best

assert longest_repeated_substring("banana") == "ana"
assert longest_repeated_substring("abcd") == ""
```

### Other uses

- Checking whether two strings are **cyclic shifts** of each other.
- Finding **palindromic substrings**: compare a hash of the substring with the hash of its reverse.
- Comparing **trees** or other structures by hashing a canonical string form.

## Choosing parameters

| Setting | Choice |
|---------|--------|
| modulus | $2^{61} - 1$ (Python: free) or two independent moduli around $10^9$ |
| base | random in $[\,\text{alphabet}, m)$, chosen at run time |
| character value | `ord(ch)` (never $0$, so `"a"` and `"aa"` differ) |
| direction | any, consistently |

## Practice problems

- [Good Substrings - Codeforces](https://codeforces.com/contest/271/problem/D)
- [A Needle in the Haystack - SPOJ](http://www.spoj.com/problems/NHAY/)
- [String Hashing - Kattis](https://open.kattis.com/problems/hashing)
- [Double Profiles - Codeforces](http://codeforces.com/problemset/problem/154/C)
- [Password - Codeforces](http://codeforces.com/problemset/problem/126/B)
- [SUB_PROB - SPOJ](http://www.spoj.com/problems/SUB_PROB/)
- [INSQ15_A](https://www.codechef.com/problems/INSQ15_A)
- [SPOJ - Ada and Spring Cleaning](http://www.spoj.com/problems/ADACLEAN/)
- [GYM - Text Editor](http://codeforces.com/gym/101466/problem/E)
- [12012 - Detection of Extraterrestrial](https://uva.onlinejudge.org/index.php?option=onlinejudge&page=show_problem&problem=3163)
- [Codeforces - Games on a CD](http://codeforces.com/contest/727/problem/E)
- [UVA 11855 - Buzzwords](https://uva.onlinejudge.org/index.php?option=com_onlinejudge&Itemid=8&page=show_problem&problem=2955)
- [Codeforces - Santa Claus and a Palindrome](http://codeforces.com/contest/752/problem/D)
- [Codeforces - String Compression](http://codeforces.com/contest/825/problem/F)
- [Codeforces - Palindromic Characteristics](http://codeforces.com/contest/835/problem/D)
- [SPOJ - Test](http://www.spoj.com/problems/CF25E/)
- [Codeforces - Palindrome Degree](http://codeforces.com/contest/7/problem/D)
- [Codeforces - Deletion of Repeats](http://codeforces.com/contest/19/problem/C)
- [HackerRank - Gift Boxes](https://www.hackerrank.com/contests/womens-codesprint-5/challenges/gift-boxes)
