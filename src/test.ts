import fs from 'fs';

import lexer from './lexer';
import parser from './parser';
import interpreter from './interpreter';
import { ParsedNode } from '@aroleaf/parser';

const src = fs.readFileSync('./examples/fizzbuzz.psi', 'utf8');

// console.log(JSON.stringify(parser.parse(lexer.parse(src)), null, 2));

const fn = interpreter.parse(parser.parse(lexer.parse(src)) as ParsedNode);

const res = fn();

console.log(res);
