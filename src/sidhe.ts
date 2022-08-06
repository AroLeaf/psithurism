#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import os from 'os';
import { minifySync } from '@swc/core';
import { compile } from '.';


const help =
`
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
  argv  : the arguments passed to the script
`
.slice(1,-1);


const args: string[] = [];
const flags: string[] = [];

for (const arg of process.argv.slice(2)) {
  if (arg.startsWith('--')) flags.push(arg.slice(2));
  else if (arg.startsWith('-')) flags.push(...arg.slice(1));
  else args.push(arg);
}

function hasFlag(...variations: string[]) {
  return variations.some(f => flags.includes(f));
}


if (hasFlag('h', 'help')) {
  console.log(help);
  process.exit();
}


(() => { switch (args[0]) {
  case 'compile': {
    if (!args[1]) return console.log(help);
    const code = hasFlag('r', 'raw') ? args[0] : fs.readFileSync(path.resolve(args[1]), 'utf8');
    const js = hasFlag('m', 'minify') ? minifySync(compile(code)).code : compile(code);
    return args[2] ? fs.writeFileSync(path.resolve(args[2]), js, 'utf8') : console.log(js);
  }

  case 'run': {
    if (!args[1]) return console.log(help);
    const code = hasFlag('r', 'raw') ? args[0] : fs.readFileSync(path.resolve(args[1]), 'utf8');
    const js = hasFlag('m', 'minify') ? minifySync(compile(code)).code : compile(code);
    const tmpPath = path.resolve(os.tmpdir(), `psithurism.js`);
    fs.writeFileSync(tmpPath, js, 'utf8');
    const module = require(tmpPath);
    try {
      console.log(...module(args.slice(2)));
    } catch (error) {
      console.error(error);
    }
    break;
  }

  default: console.log(help)
}})();