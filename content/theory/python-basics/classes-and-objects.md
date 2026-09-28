---
title: Classes and Objects
section: Objects
order: 1
difficulty: intermediate
summary: Model data and behaviour together with classes: attributes, methods, __init__, __str__ and class attributes.
tags: [oop, classes, methods]
prerequisites: [python-basics/functions]
---

**Object-oriented programming** (OOP) groups data and the functions that operate on it into one unit. A **class** is the blueprint; an **object** (or *instance*) is one thing built from it.

## A first class

```python
class Rectangle:
    def __init__(self, width, height):
        self.width = width          # instance attributes
        self.height = height

    def area(self):
        return self.width * self.height

    def perimeter(self):
        return 2 * (self.width + self.height)

r = Rectangle(3, 4)
assert r.area() == 12
assert r.perimeter() == 14

r.width = 10                        # attributes can change
assert r.area() == 40
```

- `__init__` is the **constructor**; Python calls it when you write `Rectangle(3, 4)`.
- `self` is the instance the method is working on. It is passed automatically as the first argument of every method.
- `r.area()` is shorthand for `Rectangle.area(r)`.

## Readable objects: `__str__` and `__repr__`

```python
class Point:
    def __init__(self, x, y):
        self.x, self.y = x, y

    def __repr__(self):                       # unambiguous, for debugging
        return f"Point({self.x}, {self.y})"

    def __str__(self):                        # friendly, used by print and str()
        return f"({self.x}, {self.y})"

p = Point(1, 2)
assert repr(p) == "Point(1, 2)"
assert str(p) == "(1, 2)"
assert f"{p}" == "(1, 2)"
```

## Class attributes

A variable defined in the class body is shared by every instance.

```python
class Counter:
    created = 0                     # class attribute

    def __init__(self):
        Counter.created += 1
        self.value = 0

    def increment(self, by=1):
        self.value += by
        return self

a, b = Counter(), Counter()
a.increment().increment(5)          # returning self allows chaining
assert a.value == 6 and b.value == 0
assert Counter.created == 2
```

## Encapsulation

Python has no real private members. By convention a leading underscore (`_balance`) means "internal, please don't touch". A `property` lets you expose a computed or validated attribute with normal attribute syntax:

```python
class Account:
    def __init__(self, balance=0):
        self._balance = balance

    @property
    def balance(self):
        return self._balance

    def deposit(self, amount):
        if amount <= 0:
            raise ValueError("amount must be positive")
        self._balance += amount

acc = Account(100)
acc.deposit(50)
assert acc.balance == 150
```

## Static and class methods

```python
class Temperature:
    @staticmethod
    def c_to_f(c):                  # no self: a plain function that lives in the class
        return c * 9 / 5 + 32

    @classmethod
    def freezing(cls):              # receives the class instead of an instance
        return cls.c_to_f(0)

assert Temperature.c_to_f(100) == 212
assert Temperature.freezing() == 32
```

## When do you need classes in contests?

Rarely. Tuples, lists and dictionaries are enough for most problems, and plain lists are faster. Classes shine when you model something with state and several operations, such as a [Fenwick tree](/theory/data-structures/fenwick-tree) or a union-find structure, and they make larger projects maintainable.

`dataclasses` remove the boilerplate for simple records:

```python
from dataclasses import dataclass

@dataclass(order=True)
class Edge:
    weight: int
    u: int
    v: int

edges = [Edge(5, 0, 1), Edge(2, 1, 2)]
assert min(edges) == Edge(2, 1, 2)          # ordering and equality for free
```

## Exercises

1. Write a `Student` class with a name and a list of grades, and a method returning the average.
2. Write a `Stack` class with `push`, `pop`, `peek` and `is_empty`.
3. Write a `Fraction` class that stores a numerator and a denominator in lowest terms.
4. Add `__len__` and `__getitem__` to a class and observe that `len(x)` and `x[i]` now work.
