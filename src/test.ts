import fs from 'fs';

import lexer from './lexer';
import parser from './parser';
import interpreter from './interpreter';
import { ParsedNode } from '@aroleaf/parser';

const src = fs.readFileSync('./examples/test.psi', 'utf8');

const fn = interpreter.parse(parser.parse(lexer.parse(src)) as ParsedNode);

const res = fn([0,2,4,5]);

console.log(res);
