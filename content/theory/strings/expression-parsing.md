---
title: "Expression Parsing"
section: Tasks
order: 1
difficulty: intermediate
summary: "Evaluate arithmetic expressions with priorities, parentheses, unary minus and right-associative operators using two stacks or recursive descent, in O(n)."
tags: [parsing, expressions, stack, reverse polish notation, recursive descent]
prerequisites: [python-basics/recursion, python-basics/functions]
source:
  title: "Expression parsing"
  url: https://cp-algorithms.com/string/expression_parsing.html
  license: CC BY-SA 4.0
---

Given a string such as `2 + 3 * (4 - 1) ^ 2`, compute its value in $O(n)$. Two classical solutions: an **operator stack** (the shunting-yard idea, which implicitly produces reverse Polish notation) and **recursive descent**, where each level of priority is a function.

## Reverse Polish notation

In *reverse Polish notation* (RPN, postfix) the operator comes after its operands, and no parentheses are needed:

$$
a + b \cdot c \cdot d + (e - f)(g h + i) \quad\longrightarrow\quad a\ b\ c\ *\ d\ *\ +\ e\ f\ -\ g\ h\ *\ i\ +\ *\ +
$$

Evaluating RPN is trivial with a stack: numbers are pushed; an operator pops two values, applies itself and pushes the result. At the end exactly one value remains.

```python
from fractions import Fraction

def eval_rpn(tokens):
    stack = []
    for t in tokens:
        if t in "+-*/":
            b, a = stack.pop(), stack.pop()
            stack.append({"+": a + b, "-": a - b, "*": a * b, "/": a / b}[t])
        else:
            stack.append(Fraction(t))
    assert len(stack) == 1
    return stack[0]

assert eval_rpn("3 4 + 2 *".split()) == 14                       # (3 + 4) * 2
assert eval_rpn("5 1 2 + 4 * + 3 -".split()) == 14               # 5 + (1 + 2) * 4 - 3
assert eval_rpn("1 3 /".split()) == Fraction(1, 3)
```

The remaining problem is converting an ordinary (infix) expression to this form, or evaluating it directly while parsing.

## Two stacks: numbers and operators

Keep a stack of numbers and a stack of operators/parentheses. Read the expression left to right:

- **number**: push it on the number stack;
- **`(`**: push it on the operator stack;
- **`)`**: execute operators until the matching `(`, then discard it;
- **operator** $o$: while the operator on top has a higher priority than $o$ (or the same priority and $o$ is left-associative), execute the top operator; then push $o$.

At the end execute all remaining operators. Executing an operator pops one operand (unary) or two (binary) from the number stack and pushes the result.

### Unary operators and right associativity

A `-` is **unary** when it appears where an operand is expected: at the start, after `(`, or after another operator. A unary operator has no left operand, so when we meet it we simply push it without executing anything. Give the unary operators a priority between `* /` and `^`, so that `-2^2` means $-(2^2) = -4$ while `-2*3` means $(-2)\cdot 3$.

**Right-associative** operators (like `^`, and the unary ones) are executed only when the stack top has *strictly* higher priority: then `2^3^2` is $2^{(3^2)} = 512$.

```python
PRIORITY = {"+": 1, "-": 1, "*": 2, "/": 2, "u+": 3, "u-": 3, "^": 4}
RIGHT_ASSOC = {"^", "u+", "u-"}

def evaluate(expression):
    numbers, ops = [], []

    def apply(op):
        if op in ("u+", "u-"):
            x = numbers.pop()
            numbers.append(x if op == "u+" else -x)
            return
        b, a = numbers.pop(), numbers.pop()
        if op == "+":
            numbers.append(a + b)
        elif op == "-":
            numbers.append(a - b)
        elif op == "*":
            numbers.append(a * b)
        elif op == "/":
            numbers.append(a / b)
        else:
            numbers.append(a ** int(b) if b.denominator == 1 else a ** float(b))

    expects_operand = True
    i, n = 0, len(expression)
    while i < n:
        c = expression[i]
        if c.isspace():
            i += 1
        elif c.isdigit():
            j = i
            while j < n and expression[j].isdigit():
                j += 1
            numbers.append(Fraction(int(expression[i:j])))
            i = j
            expects_operand = False
        elif c == "(":
            ops.append("(")
            i += 1
            expects_operand = True
        elif c == ")":
            while ops[-1] != "(":
                apply(ops.pop())
            ops.pop()
            i += 1
            expects_operand = False
        else:
            if expects_operand:                      # a prefix operator: nothing to execute first
                ops.append("u" + c)
            else:
                while ops and ops[-1] != "(" and (
                    PRIORITY[ops[-1]] > PRIORITY[c]
                    or (PRIORITY[ops[-1]] == PRIORITY[c] and c not in RIGHT_ASSOC)
                ):
                    apply(ops.pop())
                ops.append(c)
            i += 1
            expects_operand = True
    while ops:
        apply(ops.pop())
    return numbers[0]

assert evaluate("1 + 2 * 3") == 7
assert evaluate("(1 + 2) * 3") == 9
assert evaluate("2 ^ 3 ^ 2") == 512                 # right associative
assert evaluate("-2 ^ 2") == -4                     # unary minus binds looser than ^
assert evaluate("2 * -3") == -6
assert evaluate("10 - 4 - 3") == 3                  # left associative
assert evaluate("7 / 2") == Fraction(7, 2)
assert evaluate("2 ^ -2") == Fraction(1, 4)
assert evaluate(" ( ( 42 ) ) ") == 42
```

Every token is pushed and popped at most once: $O(n)$.

## Recursive descent

The grammar, from the weakest to the strongest operator:

```text
expression := term   (('+' | '-') term)*
term       := unary  (('*' | '/') unary)*
unary      := ('+' | '-') unary | power
power      := atom ('^' unary)?
atom       := number | '(' expression ')'
```

Each rule becomes a function. Repetition `(...)*` is a `while` loop (which makes `+ - * /` left-associative). Right associativity of `^` comes from the recursive call on its right operand.

```python
def parse(expression):
    text = expression.replace(" ", "")
    pos = 0

    def peek():
        return text[pos] if pos < len(text) else ""

    def parse_expression():
        nonlocal pos
        value = parse_term()
        while peek() in ("+", "-"):
            op = text[pos]
            pos += 1
            rhs = parse_term()
            value = value + rhs if op == "+" else value - rhs
        return value

    def parse_term():
        nonlocal pos
        value = parse_unary()
        while peek() in ("*", "/"):
            op = text[pos]
            pos += 1
            rhs = parse_unary()
            value = value * rhs if op == "*" else value / rhs
        return value

    def parse_unary():
        nonlocal pos
        if peek() in ("+", "-"):
            op = text[pos]
            pos += 1
            value = parse_unary()
            return value if op == "+" else -value
        return parse_power()

    def parse_power():
        nonlocal pos
        base = parse_atom()
        if peek() == "^":
            pos += 1
            exponent = parse_unary()
            return base ** int(exponent)
        return base

    def parse_atom():
        nonlocal pos
        if peek() == "(":
            pos += 1
            value = parse_expression()
            assert peek() == ")", "expected )"
            pos += 1
            return value
        start = pos
        while peek().isdigit():
            pos += 1
        if start == pos:
            raise ValueError(f"unexpected {peek()!r} at position {pos}")
        return Fraction(int(text[start:pos]))

    value = parse_expression()
    if pos != len(text):
        raise ValueError(f"unexpected {peek()!r} at position {pos}")
    return value

assert parse("1 + 2 * 3") == 7 and parse("2 ^ 3 ^ 2") == 512 and parse("-2 ^ 2") == -4
assert parse("2 * (3 + 4) * 5") == 70
try:
    parse("2 + * 3")
except ValueError:
    pass
else:
    raise AssertionError("expected a syntax error")
```

Recursive descent is easier to extend (functions, variables, error messages), the two-stack version has no recursion (useful for extremely deep nesting).

## Testing against Python itself

Python uses the same priorities: `**` is right-associative and binds tighter than unary minus on its left, and `-2**2 == -4`. So an expression using `+ - * / ^ ( )` can be checked by running it through `eval` after replacing `^` with `**` and turning every integer into an exact `Fraction`:

```python
import random
import re

def reference(expression):
    text = re.sub(r"\d+", lambda m: f"F({m.group()})", expression.replace("^", "**"))
    return eval(text, {"F": Fraction})

def random_expression(depth):
    if depth == 0 or random.random() < 0.25:
        return str(random.randint(0, 9))
    kind = random.random()
    if kind < 0.15:
        return "-" + random_expression(depth - 1)
    if kind < 0.3:
        return "(" + random_expression(depth - 1) + ")"
    if kind < 0.4:
        return f"({random_expression(depth - 1)})^{random.randint(0, 3)}"
    op = random.choice("+-*/")
    return random_expression(depth - 1) + random.choice(["", " "]) + op + random.choice(["", " "]) + random_expression(depth - 1)

random.seed(1)
checked = 0
for _ in range(1500):
    e = random_expression(4)
    try:
        expected = reference(e)
    except ZeroDivisionError:
        continue
    assert evaluate(e) == expected and parse(e) == expected, e
    checked += 1
assert checked > 800
```

## Extending the algorithm

- **Functions and variables**: treat an identifier followed by `(` as a call; in the recursive descent it is one more alternative in `parse_atom`.
- **More operators**: add them to the priority table (stack version) or introduce another grammar level (recursive descent).
- **Building a tree** instead of evaluating: push nodes `(op, left, right)` instead of values; the tree can be evaluated, differentiated, or simplified later.
- **Error handling**: mismatched parentheses show up as an empty operator stack when a `)` is read, or a leftover `(` at the end.
