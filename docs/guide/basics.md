# Basics

## Literals

### String

Strings are written between pairs of single or double quotes:

```py
'Hello,'
"World!"
'I\'m a string!'
```

### Numbers

Numbers are simple too:

```py
7
2.5
.125
-4.9
3e333
```

### Lists & Arrays

Lists and arrays are similar, but not quite the same.

Lists get passed to functions as separate arguments, flattened recursively. This means nesting lists has no effect. A list is written between parentheses:

```py
# these are the same
(1, 2, 3)
(1, (2, 3))
```

Arrays are not flattened, and are passed as a single argument. This allows for nested arrays. An array is written between square brackets:

```py
# these are not the same
[1, 2, 3, 4]
[[1, 2], [3, 4]]
```

### Semi-literals

There are a few functions that may look like literals, but are regular functions:

```js
true
false
null
```


## Functions

In psithurism, everything is a function (yes, even literals!).

```py
'hello!'  # function
<10       # function
_         # function
myFunc()  # function (sort of)
1~101≺∨((%3?:'Fizz')+(%5?:'Buzz'))≻…  # function
```

This makes psithurism a very flexible language, since everything fits almost everywhere.

### Calling functions

The main way of calling a function is using pipes:

```py
# `…` pretty-prints its arguments, with a trailing newline
'Hello, World!' | …
```

You can also call a function with a single argument directly if the argument is a literal, and the function is not:

```py
…'🍃'
+(5, 5) # this is a list literal
```

A function called with a literal still takes its piped arguments as arguments:

```py
5|+5  # 10
```

The third way to call a function is as operator. This can again not be done with a literal as operator:

```py
5+5
4+3*6 # math operators keep their precedence, this is 4+(3*6)
7ə2   # 7 to the 2nd power
```

### Defining custom functions

Functions are defined using `≔`:
```py
greet ≔ 'Hello, ' + _ + '!'
greet('reader') # 'Hello, reader!'
```

!!! note
    Calling a user-defined function treats all its arguments as piped arugments, putting arugments that are actually passed to it before those actually piped to it (it's equivalent to using `(_ | <code>)` inline).


## Conditionals

Conditionals in psithurism are based on the ternary if statements a lot of C-like languages have:

```py
>5 ? 'greater' : 'less'
```

However, where most languages require you to have an expression for both truthy and falsy outcomes, psithurism doesn't:

```py
>5 ? 'yes'  # will return `null` if falsy
>5 ?: 'no'  # the `?` is still required, this allows for better nesting
```