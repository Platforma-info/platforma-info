---
title: "Basic Geometry: Vectors, Dot and Cross Products"
section: Elementary operations
order: 1
difficulty: beginner
summary: "The toolkit behind almost every geometry algorithm: points as vectors, the dot product, the cross product, and how to intersect lines and planes with them."
tags: [geometry, vectors, dot product, cross product, orientation]
prerequisites: [python-basics/functions]
source:
  title: "Basic Geometry"
  url: https://cp-algorithms.com/geometry/basic-geometry.html
  license: CC BY-SA 4.0
---

Analytic geometry describes shapes with numbers. The whole subject rests on a handful of operations on **points**, which we treat as **vectors**: the point $\mathbf r$ and the arrow from the origin to $\mathbf r$ are the same object. We will build the toolkit in Python and use it in all the geometry articles.

## Linear operations

Points can be added and scaled. In Python, tuples are the lightest representation; small helper functions keep the code readable and work for 2D and 3D alike.

```python
def add(a, b):
    return tuple(x + y for x, y in zip(a, b))

def sub(a, b):
    return tuple(x - y for x, y in zip(a, b))

def scale(a, k):
    return tuple(x * k for x in a)

assert add((1, 2), (3, 4)) == (4, 6)
assert sub((1, 2, 3), (3, 2, 1)) == (-2, 0, 2)
assert scale((1, -2), 3) == (3, -6)
```

Because Python integers never overflow and `fractions.Fraction` is exact, you can keep integer (or rational) coordinates for as long as you like and avoid the rounding errors that plague geometry in other languages. Prefer this whenever the input is integer.

## Dot product

The **dot product** (scalar product) of two vectors is

$$
\mathbf a \cdot \mathbf b = |\mathbf a|\,|\mathbf b| \cos\theta = x_1x_2 + y_1y_2 + z_1z_2
$$

where $\theta$ is the angle between them. The geometric form says that it is the length of $\mathbf a$ times the length of the projection of $\mathbf b$ onto $\mathbf a$. The algebraic form, with coordinates, is what we compute.

It is commutative and linear in both arguments.

```python
import math

def dot(a, b):
    return sum(x * y for x, y in zip(a, b))

assert dot((1, 2, 3), (4, -5, 6)) == 12
assert dot((3, 4), (4, -3)) == 0                 # orthogonal
```

### What the dot product gives us

| Quantity | Formula |
|----------|---------|
| squared length | $\lvert\mathbf a\rvert^2 = \mathbf a \cdot \mathbf a$ |
| length | $\lvert\mathbf a\rvert = \sqrt{\mathbf a\cdot\mathbf a}$ |
| projection of $\mathbf a$ onto $\mathbf b$ | $\dfrac{\mathbf a\cdot\mathbf b}{\lvert\mathbf b\rvert}$ |
| angle between vectors | $\arccos\dfrac{\mathbf a\cdot\mathbf b}{\lvert\mathbf a\rvert\,\lvert\mathbf b\rvert}$ |

The sign of the dot product also tells the *kind* of angle: positive for acute, negative for obtuse, zero for a right angle.

```python
def norm(a):            # squared length: stays an integer for integer input
    return dot(a, a)

def length(a):
    return math.sqrt(norm(a))

def proj(a, b):
    return dot(a, b) / length(b)

def angle(a, b):
    return math.acos(dot(a, b) / length(a) / length(b))

assert norm((3, 4)) == 25 and length((3, 4)) == 5
assert abs(proj((3, 4), (1, 0)) - 3) < 1e-12
assert abs(angle((1, 0), (0, 5)) - math.pi / 2) < 1e-12
assert abs(angle((1, 0), (1, 1)) - math.pi / 4) < 1e-12
assert math.isqrt(norm((3, 4))) == 5              # exact integer length when it is an integer
```

Comparing squared lengths avoids square roots and keeps everything exact. (`math.hypot` and `math.dist` are the built-in ways to get lengths and distances as floats.)

### Lines from the dot product

The set of points $\mathbf r$ with $\mathbf r\cdot\mathbf n = C$ is a line in 2D (a plane in 3D) orthogonal to $\mathbf n$. So a line can be written as $(\mathbf r - \mathbf r_0)\cdot\mathbf n = 0$, where $\mathbf n$ is a *normal vector* and $\mathbf r_0$ is any point of the line, and $C = \mathbf r_0\cdot\mathbf n$.

## Cross product

In 3D the **cross product** $\mathbf b\times\mathbf c$ is the vector that is orthogonal to both $\mathbf b$ and $\mathbf c$, whose length is the area of the parallelogram they span, and whose direction follows the right-hand rule. In coordinates:

$$
\mathbf a\times\mathbf b = (y_1z_2 - z_1y_2,\; z_1x_2 - x_1z_2,\; x_1y_2 - y_1x_2)
$$

Properties: $\mathbf a\times\mathbf b = -\mathbf b\times\mathbf a$, it is linear in each argument, and $|\mathbf a\times\mathbf b| = |\mathbf a||\mathbf b|\sin\theta$. It is the zero vector exactly when $\mathbf a$ and $\mathbf b$ are collinear.

The **triple product** $\mathbf a\cdot(\mathbf b\times\mathbf c)$ is the signed volume of the parallelepiped spanned by three vectors, i.e. the determinant of the $3\times 3$ matrix with those rows. It is zero exactly when the three vectors are coplanar.

```python
def cross3(a, b):
    return (a[1] * b[2] - a[2] * b[1],
            a[2] * b[0] - a[0] * b[2],
            a[0] * b[1] - a[1] * b[0])

def triple(a, b, c):
    return dot(a, cross3(b, c))

ex, ey, ez = (1, 0, 0), (0, 1, 0), (0, 0, 1)
assert cross3(ex, ey) == ez and cross3(ey, ez) == ex and cross3(ez, ex) == ey
assert cross3((1, 2, 3), (4, 5, 6)) == (-3, 6, -3)
assert triple(ex, ey, ez) == 1                                   # unit cube
assert triple((1, 2, 3), (2, 4, 6), (0, 1, 5)) == 0             # first two collinear -> coplanar
a, b = (1, 2, 3), (4, 5, 6)
assert dot(cross3(a, b), a) == 0 and dot(cross3(a, b), b) == 0  # orthogonal to both
assert cross3(a, b) == scale(cross3(b, a), -1)
```

### The 2D pseudo-scalar product

In the plane, the analogue is the number

$$
\mathbf a\times\mathbf b = x_1y_2 - y_1x_2 = |\mathbf a||\mathbf b|\sin\theta
$$

with $\theta$ the counter-clockwise angle from $\mathbf a$ to $\mathbf b$. Its absolute value is the area of the parallelogram; its **sign tells the orientation**: positive when the rotation from $\mathbf a$ to $\mathbf b$ is counter-clockwise, negative when clockwise, zero when they are collinear. This one function is the most used in all of computational geometry.

```python
def cross(a, b):
    return a[0] * b[1] - a[1] * b[0]

assert cross((1, 0), (0, 1)) == 1        # counter-clockwise
assert cross((0, 1), (1, 0)) == -1       # clockwise
assert cross((2, 4), (1, 2)) == 0        # collinear
assert cross((3, 0), (0, 2)) == 6        # area of the 3 x 2 rectangle
```

A line through points $\mathbf a$ and $\mathbf b$ is the set of $\mathbf r$ with $(\mathbf r - \mathbf a)\times(\mathbf b-\mathbf a) = 0$. A plane through $\mathbf a$, $\mathbf b$, $\mathbf c$ is $(\mathbf r-\mathbf a)\cdot((\mathbf b-\mathbf a)\times(\mathbf c-\mathbf a)) = 0$.

## Exercises

### Line intersection

Parametrize the first line as $\mathbf r = \mathbf a_1 + t\,\mathbf d_1$, and require the second line $(\mathbf r - \mathbf a_2)\times\mathbf d_2 = 0$. Solving for $t$:

$$
t = \frac{(\mathbf a_2 - \mathbf a_1)\times\mathbf d_2}{\mathbf d_1\times\mathbf d_2}
$$

The denominator is zero exactly when the lines are parallel.

```python
from fractions import Fraction

def intersect_lines(a1, d1, a2, d2):
    """Intersection of two lines given as point + direction, or None if parallel."""
    denom = cross(d1, d2)
    if denom == 0:
        return None
    t = Fraction(cross(sub(a2, a1), d2), denom)
    return add(a1, scale(d1, t))

assert intersect_lines((0, 0), (1, 1), (0, 4), (1, -1)) == (2, 2)
assert intersect_lines((0, 0), (1, 0), (5, 1), (0, 1)) == (5, 0)
assert intersect_lines((0, 0), (1, 1), (0, 1), (2, 2)) is None       # parallel
p = intersect_lines((1, 1), (3, 1), (0, 5), (2, -3))
assert cross(sub(p, (1, 1)), (3, 1)) == 0 and cross(sub(p, (0, 5)), (2, -3)) == 0    # lies on both lines
```

Using `Fraction` the result is exact even for integer input where the intersection is not an integer point.

### Intersection of three planes

Given three planes $\mathbf r\cdot\mathbf n_i = \mathbf a_i\cdot\mathbf n_i$, we solve the $3\times 3$ linear system with **Cramer's rule**. The triple product is the determinant of the matrix whose columns are the given vectors, so we can reuse it directly:

```python
def intersect_planes(a1, n1, a2, n2, a3, n3):
    x = (n1[0], n2[0], n3[0])
    y = (n1[1], n2[1], n3[1])
    z = (n1[2], n2[2], n3[2])
    d = (dot(a1, n1), dot(a2, n2), dot(a3, n3))
    det = triple(x, y, z)
    if det == 0:
        return None                          # normals are coplanar: no unique point
    return (Fraction(triple(d, y, z), det),
            Fraction(triple(x, d, z), det),
            Fraction(triple(x, y, d), det))

p = intersect_planes((1, 0, 0), (1, 0, 0), (0, 2, 0), (0, 1, 0), (0, 0, 3), (0, 0, 1))
assert p == (1, 2, 3)
p = intersect_planes((1, 1, 1), (1, 1, 1), (0, 0, 2), (1, -1, 0), (3, 0, 0), (0, 1, 2))
assert dot(p, (1, 1, 1)) == 3 and dot(p, (1, -1, 0)) == 0 and dot(p, (0, 1, 2)) == dot((3, 0, 0), (0, 1, 2))
assert intersect_planes((0, 0, 0), (1, 0, 0), (0, 0, 0), (0, 1, 0), (0, 0, 0), (1, 1, 0)) is None
```

## Where to go next

Everything here is a building block: [lines from segments](/theory/geometry/segment-to-line), [line intersection](/theory/geometry/lines-intersection), [signed area of a triangle](/theory/geometry/oriented-triangle-area), [polygon area](/theory/geometry/area-of-simple-polygon) and the [convex hull](/theory/geometry/convex-hull) all reduce to these dot and cross products.

Two rules of thumb for the rest of the track:

- Compute with **integers or `Fraction`s** when the input is integral, and compare with `==`. Floats need an epsilon (typically `1e-9`) for every comparison.
- Use the **sign of the cross product** for orientation questions (left/right turns) instead of angles: it is exact and needs no trigonometry.
