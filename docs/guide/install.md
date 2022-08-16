# Install

=== "Bun"
    To install psithurism globally, run the following command on a system with [Bun](https://bun.sh/):
    ```sh
    bun add -g psithurism
    ```

    To install psithurism locally, run the following command in a [Bun](https://bun.sh/) project:
    ```sh
    bun add psithurism
    ```

    !!! warning
        You will not be able to call `sidhe` from a local install, as Bun does not provide a replacement for `npx` yet.

=== "Node.js"
    To install psithurism globally, run the following command on a system with [Node.js](https://nodejs.org/):
    ```sh
    npm i -g psithurism
    ```

    To install psithurism locally, run the following command in a [Node.js](https://nodejs.org/) project:
    ```sh
    npm i psithurism
    ```

    !!! note
        When installing locally, you should use `npx sidhe` instead of `sidhe` when invoking from the command line.

---

To verify you installed psithurism correctly, run:
```sh
sidhe --version
```
This should print the version of psithurism you installed.

---

## Sidhe

`sidhe` is a CLI program bundled with psithurism that can compile and run your scripts.

### Usage
```
usage: sidhe <command> [...flags] [...args]

sidhe compile [...flags] <in> [out]
  compile a psithurism script to JS

sidhe run [...flags] <in> [...argv]
  run a psithurism script directly
  
flags
  -r/--raw    : treat <in> as code instead of filepath
  -m/--minify : minify the resulting code when compiling

args
  in    : script source, filepath or code (requires -r to be set)
  out   : compiled script location, filepath, stdout when not provided
  argv  : the arguments passed to the script, as JSON strings
```

To view this information in your shell, run:
```sh
sidhe --help
```