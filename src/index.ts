import lexer from './lexer';
import parser, { ParsedNode } from './parser';
import compiler from './compiler';
import { minifySync } from '@swc/core';

export function compile(code: string, minified = false) {
  const tokens = lexer.parse(code);
  const AST = parser.parse(tokens);
  const js = compiler.compile(<ParsedNode>AST);
  return minified ? minifySync(js).code : js;
}