#! /usr/bin/env node
import cli from './cli.js';
import Breeze from '../breeze';
import fs from 'fs';
import path from 'path';

const defaults = {
  windforce: 'breeze',
}

function main(options: { [key: string]: any } = {}) {
  options = Object.assign({}, defaults, options);

  switch (options.windforce) {
    case 'breeze': {
      const code = fs.readFileSync(options.input, 'utf8');
      const before = process.hrtime.bigint();
      const func = Breeze.parse(code);
      const compiled = process.hrtime.bigint();
      const result = func(...options._rest.map((arg: string) => JSON.parse(arg)));
      const after = process.hrtime.bigint();
      if (options.telemetry) {
        console.log(`Compiled in ${(Number(Number(compiled - before)) / 1_000_000).toFixed(3)}ms`);
        console.log(`Executed in ${(Number(Number(after - compiled)) / 1_000_000).toFixed(3)}ms`);
      }
      return result;
    }

    default: throw new Error(`Unknown windforce: ${options.windforce}`);
  }
}

function bin() {
  const options = cli(process.argv.slice(2), {
    positional: [{
      name: 'input',
      description: 'The input file',
      required: true,
      transform: value => path.resolve(value),
    }],
    flags: [{
      name: 'windforce',
      description: 'The flavor of psithurism to use',
      short: 'f',
      args: [{
        name: 'windforce',
        required: true,
      }],
    }, {
      name: 'telemetry',
      description: 'Show some information about how long it took to compile and execute the code',
      short: 't',
    }],
  });
  
  console.log(main(options));
}

if (require.main === module) {
  bin();
}