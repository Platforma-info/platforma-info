---
title: "Inheritance and Operator Overloading"
section: Objects
order: 2
difficulty: intermediate
summary: "Reuse behaviour with inheritance, override methods, call super(), and teach your classes to work with +, ==, < and len."
tags: [oop, inheritance, operators, dunder]
prerequisites: [python-basics/classes-and-objects]
---

## Inheritance

A class can **inherit** everything from a *base* class and then add or change behaviour. This models an "is-a" relationship: a `Dog` *is an* `Animal`.

```python
class Animal:
    def __init__(self, name):
        self.name = name

    def speak(self):
        return f"{self.name} makes a sound"

class Dog(Animal):
    def speak(self):                         # overrides the base method
        return f"{self.name} barks"

class Cat(Animal):
    def __init__(self, name, indoor=True):
        super().__init__(name)               # run the base constructor
        self.indoor = indoor

animals = [Animal("Generic"), Dog("Rex"), Cat("Tom")]
assert [a.speak() for a in animals] == [
    "Generic makes a sound",
    "Rex barks",
    "Tom makes a sound",
]
assert isinstance(animals[1], Animal) and issubclass(Dog, Animal)
```

`super()` gives access to the base class, so you extend the parent's behaviour instead of copying it. The loop above is an example of **polymorphism**: the same call `a.speak()` does the right thing for each type.

### Types of inheritance

- **Single**: `class B(A)`.
- **Multilevel**: `class C(B)` where `B(A)`; the chain is followed upward.
- **Multiple**: `class C(A, B)`. Python searches the parents in the *method resolution order* (MRO), which you can inspect with `C.__mro__`.

```python
class Swimmer:
    def move(self):
        return "swim"

class Walker:
    def move(self):
        return "walk"

class Duck(Swimmer, Walker):
    pass

assert Duck().move() == "swim"                  # Swimmer comes first in the MRO
assert [c.__name__ for c in Duck.__mro__] == ["Duck", "Swimmer", "Walker", "object"]
```

> [!TIP]
> Prefer composition ("has-a": an object holds another object) over deep inheritance trees; they are easier to change later.

## Operator overloading

Special ("dunder", double-underscore) methods let your objects use Python syntax.

| Expression | Method |
|-----------|--------|
| `a + b` | `__add__` |
| `a - b` | `__sub__` |
| `a * b` | `__mul__` |
| `a == b` | `__eq__` |
| `a < b` | `__lt__` |
| `len(a)` | `__len__` |
| `a[i]` | `__getitem__` |
| `x in a` | `__contains__` |
| `str(a)` | `__str__` |
| `hash(a)` | `__hash__` |

A 2D vector that behaves like a number:

```python
class Vec:
    def __init__(self, x, y):
        self.x, self.y = x, y

    def __add__(self, other):
        return Vec(self.x + other.x, self.y + other.y)

    def __mul__(self, k):
        return Vec(self.x * k, self.y * k)

    def __eq__(self, other):
        return isinstance(other, Vec) and (self.x, self.y) == (other.x, other.y)

    def __hash__(self):                      # needed to keep a class hashable once __eq__ is defined
        return hash((self.x, self.y))

    def __repr__(self):
        return f"Vec({self.x}, {self.y})"

a, b = Vec(1, 2), Vec(3, 4)
assert a + b == Vec(4, 6)
assert a * 3 == Vec(3, 6)
assert len({a, Vec(1, 2), b}) == 2           # equal vectors collapse in a set
```

Implement ordering once and let `functools.total_ordering` derive the rest, or simply return a tuple from `__lt__`:

```python
from functools import total_ordering

@total_ordering
class Version:
    def __init__(self, text):
        self.parts = tuple(int(p) for p in text.split("."))

    def __eq__(self, other):
        return self.parts == other.parts

    def __lt__(self, other):
        return self.parts < other.parts

assert Version("1.10.0") > Version("1.9.9")
assert sorted([Version("2.0"), Version("1.5")])[0].parts == (1, 5)
```

## Exercises

1. Create `Shape` with `area()`, and subclasses `Circle` and `Square`. Print the total area of a mixed list.
2. Give `Vec` `__sub__`, `__neg__` and a `dot` method.
3. Make a `Money` class that adds amounts of the same currency and raises an error for different currencies.
