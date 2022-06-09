#!/usr/bin/env node
import { program } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import { spawnSync } from 'child_process';
import * as pkg from '../package.json';
import { compile } from '.';


interface CompileOptions {
  out?: string
  raw?: boolean
  minify?: boolean
}

interface RunOptions {
  raw?: boolean
  compile?: boolean
}


program
  .name('sidhe')
  .description('compiles and runs psithurism scripts')
  .version(pkg.version);

program
  .command('compile')
  .description('compile a psithurism script')
  .argument('<file>', 'the path to a file containing the code to compile')
  .option('-o, --out <file>', 'path to a file to save the compiled code to, prints to stdout if not provided')
  .option('-r, --raw', 'treat the input as raw code instead of a filepath')
  .option('-m, --minify', 'minify the compiled code')
  .action((input: string, options: CompileOptions = {}) => {
    const ps = options.raw ? input : fs.readFileSync(path.resolve(input), 'utf8');
    const js = compile(ps, options.minify);
    options.out ? fs.writeFileSync(path.resolve(options.out), js, 'utf8') : console.log(js);
    console.log(`compiled ${Buffer.from(ps).length} bytes`);
  });

program
  .command('run')
  .description('run a compiled script')
  .argument('<file>', 'the path to a file containing compiled code')
  .option('-r, --raw', 'treat the input as raw code instead of a filepath')
  .option('-c, --compile', 'treat the input as uncompiled and compile it before running')
  .action((input: string, options: RunOptions = {}) => {
    const code = options.raw ? input : fs.readFileSync(path.resolve(input), 'utf8');
    const js = options.compile ? compile(code, true) : code;
    spawnSync('node', ['-r', path.resolve(__dirname, '../dist/register.js'), '-e', js], { stdio: 'inherit' });
  });

program.parse();