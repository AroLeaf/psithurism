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
Usage: sidhe [options] [command]

compiles and runs psithurism scripts

Options:
  -V, --version             output the version number
  -h, --help                display help for command

Commands:
  compile [options] <file>  compile a psithurism script
  run [options] <file>      run a compiled script
  help [command]            display help for command
```

To view this information in your shell, run:
```sh
sidhe --help
```