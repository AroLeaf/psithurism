# Pipes

Besides the default pipe `|` mentioned in the [basics](./basics.md), there are two other types.

## Spread Pipe

The spread pipe `≺` is like a foreach, it calls the next function in the chain for each of its arguments, and returns the results as arrays.

```py
[1, 2, 3, 4, 5] ≺ ≤3 # ([true], [true], [true], [false], [false])
```

## Merge Pipe

The merge pipe `≻` flattens its arguments with a depth of one.

```py
([true], [1, 2, 3], [[4, 5], 6]) ≻ _ # (true, 1, 2, 3, [4, 5], 6)
```

---

All pipes have the same precedence, so to use pipes within a spread pipe's chain, you will need to use parentheses.

```py
[1, 2, 3, 4, 5] ≺ %2 > 0 | …
# true false true false true
[1, 2, 3, 4, 5] ≺ (%2 > 0 | …)
# true
# false
# true
# false
# true
```