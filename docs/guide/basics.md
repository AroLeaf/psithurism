# Basics

!!! Tip
    The example code blocks in this guide may not be valid scripts

## Comments

Comments are written with a `#`:
```py
# this does nothing
```

## Literals

There's a few types of literals in psithurism:

### Strings

Strings are written between pairs of either double or single quotes.
```py
'Hello'
"reader"
```

=== "Single quotes"
    A single quoted string is assumed to be encoded according to psithurism's codepage.
    ```py
    '∨' # one byte
    ```
    !!! note
        Since there currently is no actual codepage, single and double quoted stings are both assumed to be UTF-8.

=== "Double quotes"
    A double quoted string is assumed to be UTF-8.
    ```py
    "∨" # three bytes
    ```

### Numbers

Numbers are pretty straightforward:
```py
7
2.5
.125
-4.9
```
This is not allowed however:
```py
3.
```

### Lists & Arrays

Lists and arrays are similar, but not quite the same.

List items are expanded into separate arguments of the next function in the chain.
This means nesting lists has no effect. A list is written between parentheses:
```py
# these are the same
(1, 2, 3)
(1, (2, 3))
```

The whole array is passed to the next function as one argument.
This also allows for nested arrays. An array is written between square brackets:
```py
# these are not the same
[1, 2, 3, 4]
[[1, 2], [3, 4]]
```

### Regex

Just like javascript, psithurism has regex literals:
```js
/\/((?:[^\/\\\n]|\\[^])*)\/([gimuynsxA]*)/s
```
Psithurism uses xregexp for parsing and executing regex. Check its [website](https://xregexp.com) for more information.