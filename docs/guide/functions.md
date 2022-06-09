# Functions

In psithurism, everything is a function, and can therefore usually be called like one.

There's multiple ways to call a function:

## Parentheses

```py
greet('reader')
```

This is probably the form you're most used to, but quickly gets confusing if nested too much.
```py
min(max(value, 0), 100)
```

!!! Note
    You can't call literals this way:
    ```py
    'Hello'('reader!') # this is not allowed
    ```

## Pipes

Taking inspiration from shell scripting, psithurism adds pipes as a way to call functions:
```py
'reader' | greet
```

This improves readability, but you would still need to do things like this:
```py
((0, value) | max, 100) | min
```

To fix this, you can use parentheses and a pipe in the same function call. The arguments in the parentheses will be passed before the piped arguments:
```py
value | max(0) | min(100)
```

### Other Pipes

There are two other types of pipes:

#### Expand
Expand pipes act as a for-each loop over their arguments:
```py
(1, 2, 3, 4, 5) < . # prints each element separately
```

#### Merge
Merge pipes flatten their arguments by one level, and return them as arrays:
```py
(1, 2, [3, 4], [[5]]) > = # [1, 2, 3, 4, [5]]
```

## Implicit function calls

If you want to call a function with a single literal value, you can leave out the parentheses:
```py
greet 'reader'
```
Calling a function with parentheses is actually just this, but with a list literal.

## Operators

Any function can also be used as operator:
```py
0 max value min 100
```

Some builtin operators have a different precedence:

operator(s)   | precedence
:------------ | :---------
`|`, `<`, `>` | 0
`?`, `:`, `?:`| 1
`+`, `-`      | 2
`*`, `/`, `%` | 3
`^`           | 4
others        | 5