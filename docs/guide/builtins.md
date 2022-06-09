# Builtins

Psithurism provides some builtin functions to help you write your programs.
For the full list, check the [documentation](../../documentation).

## Printing
`.` prints any arguments to stdout, with a newline at the end.
```py
.'🍃'
```

## Passthrough
`=` returns its arguments unchanged.
```py
3 | =+= # 6
```

## Arithmetic

The most obvious use of these is as operators, but they can also be called like any other function, with any number of arguments.

If an array is passed as one of its arguments, the operation is applied to each element, returning an array.

- `+`: addition
- `-`: subtraction
- `*`: mutiplication
- `/`: division
- `%`: modulus
- `^`: exponentiation