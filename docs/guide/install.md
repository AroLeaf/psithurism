# Install

=== "Global"
    To install psithurism globally, run the following command on a system with nodejs:
    ```sh
    npm i -g psithurism
    ```

=== "Local"
    To install psithurism locally, run the following command in a nodejs project:
    ```sh
    npm i psithurism
    ```

    !!! warning
        You will need to replace `sidhe` in commands with `npx sidhe`.

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