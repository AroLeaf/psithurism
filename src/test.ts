import fs from 'fs';

import lexer from './lexer';
import parser from './parser';
import interpreter from './interpreter';
import { ParsedNode } from '@aroleaf/parser';

const src = fs.readFileSync('./examples/test.psi', 'utf8');
// const input = fs.readFileSync('./test.txt', 'utf-8');

// console.log(JSON.stringify(parser.parse(lexer.parse(src)), null, 2));

const start = process.hrtime.bigint();

const fn = interpreter.parse(parser.parse(lexer.parse(src)) as ParsedNode);
const mid = process.hrtime.bigint();

const res = fn(/*input*/);
const end = process.hrtime.bigint();

console.log(res);
console.log(`Parsed in : ${(Number(mid - start) / 1_000_000).toFixed(3)}ms`);
console.log(`Ran in    : ${(Number(end - mid  ) / 1_000_000).toFixed(3)}ms`);